"use server";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";
import { extrasTotal } from "@/lib/booking/extras";
import { rateLimit, pruneRateLimits } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  bookingInputSchema,
  bookingStatusUpdateSchema,
  blockedPeriodSchema,
} from "@/lib/validations";

/**
 * Write-side Server Actions.
 *
 * Booking creation runs through the SERVICE-ROLE admin client (guests
 * have no INSERT grant). The flow is defence-in-depth:
 *   1. Validate input with the shared Zod schema (same as the client).
 *   2. Re-check availability against confirmed bookings + blocks.
 *   3. Insert — and still treat the DB exclusion constraint as the final
 *      authority, mapping a conflict to a friendly message.
 */

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/** Postgres error codes we map to user-facing outcomes. */
const PG_EXCLUSION_VIOLATION = "23P01";
const PG_UNIQUE_VIOLATION = "23505";

function daysBetween(startIso: string, endIso: string): number {
  const ms = Date.parse(endIso) - Date.parse(startIso);
  return Math.round(ms / 86_400_000);
}

/** Build a half-open daterange literal: [start, end). */
function dateRangeLiteral(start: string, end: string): string {
  return `[${start},${end})`;
}

/** Best-effort client IP from proxy headers (Vercel sets these). */
async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export interface BookingConfirmation {
  id: string;
  reference: string;
  start_date: string;
  end_date: string;
  total_days: number;
  total_price: number;
}

export async function createBooking(
  input: unknown,
): Promise<ActionResult<BookingConfirmation>> {
  const parsed = bookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const data = parsed.data;

  // Honeypot: silently reject bots without revealing the check.
  if (data.company && data.company.length > 0) {
    return { ok: false, error: "INVALID_INPUT" };
  }

  // Simple per-IP rate limit against automated submissions.
  pruneRateLimits();
  const ip = await clientIp();
  const limit = rateLimit(`booking:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return { ok: false, error: "RATE_LIMITED", code: String(limit.retryAfter) };
  }

  // Turnstile is a no-op until TURNSTILE_SECRET_KEY is configured.
  const human = await verifyTurnstile(data.turnstileToken, ip);
  if (!human) {
    return { ok: false, error: "CAPTCHA_FAILED" };
  }

  const admin = createAdminClient();

  // The car must exist and be publicly available to book.
  const { data: car, error: carError } = await admin
    .from("cars")
    .select("id, price_per_day, is_available")
    .eq("id", data.car_id)
    .maybeSingle();
  if (carError) return { ok: false, error: "DB_ERROR" };
  if (!car || !car.is_available) {
    return { ok: false, error: "CAR_NOT_AVAILABLE" };
  }

  // Re-validate availability server-side (confirmed bookings + blocks).
  const { data: available, error: availError } = await admin.rpc(
    "is_car_available",
    { car_id: data.car_id, p_start: data.start_date, p_end: data.end_date },
  );
  if (availError) return { ok: false, error: "DB_ERROR" };
  if (!available) {
    return {
      ok: false,
      error: "DATES_UNAVAILABLE",
      code: PG_EXCLUSION_VIOLATION,
    };
  }

  // Authoritative pricing — recomputed server-side from the car price and
  // the shared extras catalog. The client total is for display only.
  const totalDays = daysBetween(data.start_date, data.end_date);
  const basePrice = totalDays * Number(car.price_per_day);
  const totalPrice = basePrice + extrasTotal(data.extras, totalDays);

  const { data: inserted, error: insertError } = await admin
    .from("bookings")
    .insert({
      car_id: data.car_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email ? data.customer_email : null,
      period: dateRangeLiteral(data.start_date, data.end_date),
      pickup_location: data.pickup_location,
      dropoff_location: data.dropoff_location ? data.dropoff_location : null,
      total_price: totalPrice,
      extras: { selected: data.extras } as Json,
      notes: data.note ? data.note : null,
      status: "pending",
    })
    .select("id, reference, start_date, end_date, total_days, total_price")
    .single();

  if (insertError) {
    if (insertError.code === PG_EXCLUSION_VIOLATION) {
      return { ok: false, error: "DATES_UNAVAILABLE", code: insertError.code };
    }
    return { ok: false, error: "DB_ERROR", code: insertError.code };
  }

  return {
    ok: true,
    data: {
      id: inserted.id,
      reference: inserted.reference,
      start_date: inserted.start_date,
      end_date: inserted.end_date,
      total_days: inserted.total_days,
      total_price: Number(inserted.total_price),
    },
  };
}

/**
 * Admin status transition. Confirming a booking can trip the DB
 * exclusion constraint if another confirmed booking overlaps — that
 * conflict is surfaced rather than silently swallowed.
 */
export async function updateBookingStatus(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = bookingStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  // Uses the authenticated owner session (RLS allows admin writes).
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    if (error.code === PG_EXCLUSION_VIOLATION) {
      return {
        ok: false,
        error: "CONFLICTING_CONFIRMED_BOOKING",
        code: error.code,
      };
    }
    return { ok: false, error: "DB_ERROR", code: error.code };
  }
  return { ok: true, data: { id: parsed.data.id } };
}

/** Admin: block a date range for a car (maintenance, phone booking…). */
export async function createBlockedPeriod(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = blockedPeriodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blocked_periods")
    .insert({
      car_id: parsed.data.car_id,
      period: dateRangeLiteral(parsed.data.start_date, parsed.data.end_date),
      reason: parsed.data.reason ?? null,
      note: parsed.data.note ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (
      error.code === PG_EXCLUSION_VIOLATION ||
      error.code === PG_UNIQUE_VIOLATION
    ) {
      return { ok: false, error: "OVERLAPPING_BLOCK", code: error.code };
    }
    return { ok: false, error: "DB_ERROR", code: error.code };
  }
  return { ok: true, data: { id: data.id } };
}
