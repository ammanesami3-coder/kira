import { z } from "zod";

import { EXTRA_IDS } from "@/lib/booking/extras";

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

/** Lenient international phone format (e.g. +212600000000). */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{5,19}$/, "invalid phone number");

/**
 * Public booking request submitted by a guest (no account). Dates are
 * ISO `YYYY-MM-DD`; `end_date` is the (exclusive) drop-off day and must
 * be strictly after `start_date`. Validated identically on client and
 * server; the server re-checks availability + relies on the DB
 * exclusion constraint as the final guard against double booking.
 */
export const bookingInputSchema = z
  .object({
    car_id: z.uuid(),
    customer_name: z.string().trim().min(2).max(120),
    customer_phone: phoneSchema,
    customer_email: z.email().max(160).optional().or(z.literal("")),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    pickup_location: z.string().trim().min(2).max(160),
    dropoff_location: z.string().trim().max(160).optional().or(z.literal("")),
    note: z.string().trim().max(1000).optional().or(z.literal("")),
    /** Selected add-ons; priced server-side from the shared catalog. */
    extras: z.array(z.enum(EXTRA_IDS)).default([]),
    /** Anti-spam honeypot: must stay empty (real users never fill it). */
    company: z.string().max(0).optional(),
    /** Cloudflare Turnstile token (optional until a key is configured). */
    turnstileToken: z.string().optional(),
  })
  .refine((v) => v.end_date > v.start_date, {
    message: "end_date must be after start_date",
    path: ["end_date"],
  });

export type BookingInput = z.infer<typeof bookingInputSchema>;

/**
 * Form-facing (input) type: fields with a Zod `.default()` are optional
 * before parsing. Used as the React Hook Form value type, while the parsed
 * `BookingInput` (output) is what the submit handler / Server Action receive.
 */
export type BookingFormValues = z.input<typeof bookingInputSchema>;

/** Admin status transition for a booking. */
export const bookingStatusUpdateSchema = z.object({
  id: z.uuid(),
  status: bookingStatusSchema,
});

export type BookingStatusUpdate = z.infer<typeof bookingStatusUpdateSchema>;
