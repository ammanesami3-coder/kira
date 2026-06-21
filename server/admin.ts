"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/server/mutations";
import type {
  Booking,
  BlockedPeriod,
  CarImage,
  Json,
} from "@/types/database.types";
import type { CarWithImages } from "@/server/queries";
import type { DateRange } from "@/server/availability";
import {
  carSchema,
  carUpdateSchema,
  toggleAvailabilitySchema,
  addCarImagesSchema,
  reorderImagesSchema,
  setPrimaryImageSchema,
  deleteCarImageSchema,
  deleteBlockedPeriodSchema,
  agencySettingsSchema,
} from "@/lib/validations";

/**
 * Admin (owner) data access for the dashboard. Reads are consumed by
 * TanStack Query as query functions; writes are Server Actions. Every
 * function re-checks the authenticated owner and uses the cookie-bound
 * client, so RLS ("admin full access" for `authenticated`) is the final
 * guard even though the proxy already gates the routes.
 */

const PG_UNIQUE_VIOLATION = "23505";
const CAR_IMAGES_BUCKET = "car-images";

/** Resolve the authenticated owner's client, or throw for reads. */
async function ownerClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return supabase;
}

/** Like `ownerClient` but returns null instead of throwing (for writes). */
async function ownerClientOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

function emptyToNull(value: string | null | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/* ── Reads (TanStack query functions) ────────────────────────────── */

export async function listCars(): Promise<CarWithImages[]> {
  const supabase = await ownerClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_images(*)")
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "car_images" });
  if (error) throw error;
  return data ?? [];
}

export async function listCarImages(carId: string): Promise<CarImage[]> {
  const supabase = await ownerClient();
  const { data, error } = await supabase
    .from("car_images")
    .select("*")
    .eq("car_id", carId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listBookings(): Promise<Booking[]> {
  const supabase = await ownerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listBlockedPeriods(
  carId: string,
): Promise<BlockedPeriod[]> {
  const supabase = await ownerClient();
  const { data, error } = await supabase
    .from("blocked_periods")
    .select("*")
    .eq("car_id", carId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Unavailable ranges (confirmed bookings + blocks) for a car, PII-free. */
export async function listUnavailableRanges(
  carId: string,
): Promise<DateRange[]> {
  const supabase = await ownerClient();
  const { data, error } = await supabase
    .from("car_unavailable_ranges")
    .select("start_date, end_date")
    .eq("car_id", carId);
  if (error) throw error;
  return (data ?? [])
    .filter(
      (r): r is { car_id: string; start_date: string; end_date: string } =>
        r.start_date !== null && r.end_date !== null,
    )
    .map((r) => ({ start_date: r.start_date, end_date: r.end_date }));
}

/* ── Cars CRUD ───────────────────────────────────────────────────── */

export async function createCar(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = carSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await ownerClientOrNull();
  if (!supabase) return { ok: false, error: "UNAUTHORIZED" };

  const { data, error } = await supabase
    .from("cars")
    .insert({
      ...parsed.data,
      name_ar: emptyToNull(parsed.data.name_ar),
      price_per_week: parsed.data.price_per_week ?? null,
      description: emptyToNull(parsed.data.description),
      description_ar: emptyToNull(parsed.data.description_ar),
      description_fr: emptyToNull(parsed.data.description_fr),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      return { ok: false, error: "SLUG_TAKEN", code: error.code };
    }
    return { ok: false, error: "DB_ERROR", code: error.code };
  }
  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}

export async function updateCar(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = carUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await ownerClientOrNull();
  if (!supabase) return { ok: false, error: "UNAUTHORIZED" };

  const { id, ...fields } = parsed.data;
  const { error } = await supabase
    .from("cars")
    .update({
      ...fields,
      name_ar: emptyToNull(fields.name_ar),
      price_per_week: fields.price_per_week ?? null,
      description: emptyToNull(fields.description),
      description_ar: emptyToNull(fields.description_ar),
      description_fr: emptyToNull(fields.description_fr),
    })
    .eq("id", id);

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      return { ok: false, error: "SLUG_TAKEN", code: error.code };
    }
    return { ok: false, error: "DB_ERROR", code: error.code };
  }
  revalidatePath("/", "layout");
  return { ok: true, data: { id } };
}

export async function deleteCar(
  id: unknown,
): Promise<ActionResult<{ id: string }>> {
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "INVALID_INPUT" };
  }
  const supabase = await ownerClientOrNull();
  if (!supabase) return { ok: false, error: "UNAUTHORIZED" };

  // Best-effort: remove storage objects for this car's images first.
  const { data: images } = await supabase
    .from("car_images")
    .select("storage_path")
    .eq("car_id", id);
  const paths = (images ?? [])
    .map((i) => i.storage_path)
    .filter((p): p is string => !!p);
  if (paths.length > 0) {
    await supabase.storage.from(CAR_IMAGES_BUCKET).remove(paths);
  }

  // Rows in car_images cascade via FK on delete.
  const { error } = await supabase.from("cars").delete().eq("id", id);
  if (error) return { ok: false, error: "DB_ERROR", code: error.code };
  revalidatePath("/", "layout");
  return { ok: true, data: { id } };
}

export async function toggleCarAvailability(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = toggleAvailabilitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await ownerClientOrNull();
  if (!supabase) return { ok: false, error: "UNAUTHORIZED" };

  const { error } = await supabase
    .from("cars")
    .update({ is_available: parsed.data.is_available })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: "DB_ERROR", code: error.code };
  revalidatePath("/", "layout");
  return { ok: true, data: { id: parsed.data.id } };
}

/* ── Car images ──────────────────────────────────────────────────── */

export async function addCarImages(
  input: unknown,
): Promise<ActionResult<{ count: number }>> {
  const parsed = addCarImagesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await ownerClientOrNull();
  if (!supabase) return { ok: false, error: "UNAUTHORIZED" };

  // Append after existing images; make the first-ever image primary.
  const { data: existing } = await supabase
    .from("car_images")
    .select("id, sort_order")
    .eq("car_id", parsed.data.car_id);
  const hasExisting = (existing?.length ?? 0) > 0;
  const baseOrder = (existing ?? []).reduce(
    (max, i) => Math.max(max, i.sort_order),
    -1,
  );

  const rows = parsed.data.images.map((img, idx) => ({
    car_id: parsed.data.car_id,
    url: img.url,
    storage_path: img.storage_path ?? null,
    alt: img.alt ?? null,
    alt_ar: img.alt_ar ?? null,
    sort_order: baseOrder + 1 + idx,
    is_primary: !hasExisting && idx === 0,
  }));

  const { error } = await supabase.from("car_images").insert(rows);
  if (error) return { ok: false, error: "DB_ERROR", code: error.code };
  revalidatePath("/", "layout");
  return { ok: true, data: { count: rows.length } };
}

export async function reorderCarImages(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = reorderImagesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await ownerClientOrNull();
  if (!supabase) return { ok: false, error: "UNAUTHORIZED" };

  // Persist the new order sequentially (small N per car).
  for (let i = 0; i < parsed.data.ordered_ids.length; i++) {
    const { error } = await supabase
      .from("car_images")
      .update({ sort_order: i })
      .eq("id", parsed.data.ordered_ids[i]!)
      .eq("car_id", parsed.data.car_id);
    if (error) return { ok: false, error: "DB_ERROR", code: error.code };
  }
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}

export async function setPrimaryImage(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = setPrimaryImageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await ownerClientOrNull();
  if (!supabase) return { ok: false, error: "UNAUTHORIZED" };

  // Clear the current primary, then promote the chosen image.
  const { error: clearError } = await supabase
    .from("car_images")
    .update({ is_primary: false })
    .eq("car_id", parsed.data.car_id);
  if (clearError)
    return { ok: false, error: "DB_ERROR", code: clearError.code };

  const { error } = await supabase
    .from("car_images")
    .update({ is_primary: true })
    .eq("id", parsed.data.image_id)
    .eq("car_id", parsed.data.car_id);
  if (error) return { ok: false, error: "DB_ERROR", code: error.code };
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}

export async function deleteCarImage(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = deleteCarImageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await ownerClientOrNull();
  if (!supabase) return { ok: false, error: "UNAUTHORIZED" };

  if (parsed.data.storage_path) {
    await supabase.storage
      .from(CAR_IMAGES_BUCKET)
      .remove([parsed.data.storage_path]);
  }
  const { error } = await supabase
    .from("car_images")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: "DB_ERROR", code: error.code };
  revalidatePath("/", "layout");
  return { ok: true, data: null };
}

/* ── Availability: delete blocked period ─────────────────────────── */

export async function deleteBlockedPeriod(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = deleteBlockedPeriodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await ownerClientOrNull();
  if (!supabase) return { ok: false, error: "UNAUTHORIZED" };

  const { error } = await supabase
    .from("blocked_periods")
    .delete()
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: "DB_ERROR", code: error.code };
  revalidatePath("/", "layout");
  return { ok: true, data: { id: parsed.data.id } };
}

/* ── Agency settings (singleton) ─────────────────────────────────── */

export async function updateAgencySettings(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = agencySettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await ownerClientOrNull();
  if (!supabase) return { ok: false, error: "UNAUTHORIZED" };

  const d = parsed.data;
  const payload = {
    name: d.name,
    name_ar: emptyToNull(d.name_ar),
    name_fr: emptyToNull(d.name_fr),
    logo_url: emptyToNull(d.logo_url),
    primary_color: d.primary_color,
    secondary_color: d.secondary_color,
    phone: emptyToNull(d.phone),
    whatsapp_number: emptyToNull(d.whatsapp_number),
    email: emptyToNull(d.email),
    address: emptyToNull(d.address),
    address_ar: emptyToNull(d.address_ar),
    lat: d.lat ?? null,
    lng: d.lng ?? null,
    currency: d.currency,
    opening_hours: d.opening_hours as Json,
    social_links: d.social_links as Json,
    locales: d.locales,
    seo_title: emptyToNull(d.seo_title),
    seo_description: emptyToNull(d.seo_description),
    og_image_url: emptyToNull(d.og_image_url),
    updated_at: new Date().toISOString(),
  };

  // Singleton: update the existing row, or insert the first one.
  const { data: existing } = await supabase
    .from("agency_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("agency_settings")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { ok: false, error: "DB_ERROR", code: error.code };
    revalidatePath("/", "layout");
    return { ok: true, data: { id: existing.id } };
  }

  const { data, error } = await supabase
    .from("agency_settings")
    .insert(payload)
    .select("id")
    .single();
  if (error) return { ok: false, error: "DB_ERROR", code: error.code };
  revalidatePath("/", "layout");
  return { ok: true, data: { id: data.id } };
}
