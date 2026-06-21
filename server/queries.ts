import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
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
 * Public reads go through the cookie-LESS anon client (`createPublicClient`)
 * and are wrapped in React `cache`: they only ever touch anon-visible data,
 * never read cookies, and so keep the public pages statically renderable +
 * ISR cacheable while deduping repeated calls within a single render. Admin
 * reads use the cookie-bound client, which carries the owner's session so
 * RLS grants full visibility.
 */

export type CarWithImages = Car & { car_images: CarImage[] };

/**
 * The agency identity / SEO singleton (public).
 * `cache`d so the layout, metadata and footer share one query per request.
 */
export const getAgencySettings = cache(
  async (): Promise<AgencySettings | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("agency_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
);

/** Public catalog: available cars with their images, ordered for display. */
export const getAvailableCars = cache(async (): Promise<CarWithImages[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_images(*)")
    .eq("is_available", true)
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "car_images" });
  if (error) throw error;
  return data ?? [];
});

/** Public car detail by slug (only if available). `cache`d so a page and its
 * `generateMetadata` share a single query. */
export const getCarBySlug = cache(
  async (slug: string): Promise<CarWithImages | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("cars")
      .select("*, car_images(*)")
      .eq("slug", slug)
      .eq("is_available", true)
      .order("sort_order", { ascending: true, referencedTable: "car_images" })
      .maybeSingle();
    if (error) throw error;
    return data;
  },
);

/** Slugs of all available cars — drives the dynamic sitemap. */
export const getCarSlugs = cache(
  async (): Promise<{ slug: string; updated_at: string }[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("cars")
      .select("slug, updated_at")
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
);

/* ── Admin reads (require an authenticated owner session) ─────────── */

/** All cars including hidden ones (admin). */
export async function getAllCars(): Promise<CarWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_images(*)")
    .order("sort_order", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "car_images" });
  if (error) throw error;
  return data ?? [];
}

/** A single car with its images (admin; includes hidden cars). */
export async function getCarForAdmin(
  id: string,
): Promise<CarWithImages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_images(*)")
    .eq("id", id)
    .order("sort_order", { ascending: true, referencedTable: "car_images" })
    .maybeSingle();
  if (error) throw error;
  return data;
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
