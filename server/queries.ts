import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  AgencySettings,
  Booking,
  BlockedPeriod,
  Car,
  CarImage,
} from "@/types/database.types";

/**
 * Read-side data access for Server Components.
 *
 * Public reads go through the cookie-bound anon client and are therefore
 * constrained by RLS (only available cars / their images / the singleton
 * settings are visible). Admin reads run inside authenticated admin pages,
 * where the same client carries the owner's session and RLS grants full
 * visibility.
 */

export type CarWithImages = Car & { car_images: CarImage[] };

/** The agency identity / SEO singleton (public). */
export async function getAgencySettings(): Promise<AgencySettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agency_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Public catalog: available cars with their images, ordered for display. */
export async function getAvailableCars(): Promise<CarWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_images(*)")
    .eq("is_available", true)
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "car_images" });
  if (error) throw error;
  return data ?? [];
}

/** Public car detail by slug (only if available). */
export async function getCarBySlug(
  slug: string,
): Promise<CarWithImages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_images(*)")
    .eq("slug", slug)
    .eq("is_available", true)
    .order("sort_order", { ascending: true, referencedTable: "car_images" })
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ── Admin reads (require an authenticated owner session) ─────────── */

/** All cars including hidden ones (admin). */
export async function getAllCars(): Promise<CarWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_images(*)")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Bookings list (admin; contains PII — RLS limits this to the owner). */
export async function getBookings(): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Blocked periods for a car (admin). */
export async function getBlockedPeriods(
  carId: string,
): Promise<BlockedPeriod[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blocked_periods")
    .select("*")
    .eq("car_id", carId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
