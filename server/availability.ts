import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CarUnavailableRange } from "@/types/database.types";

/**
 * Availability logic — thin wrappers over the DB function and the
 * PII-free view. The database is the source of truth: `is_car_available`
 * and the `bookings` exclusion constraint do the real enforcement.
 *
 * Dates are ISO `YYYY-MM-DD`. The interval is half-open [start, end):
 * `end` is the (exclusive) drop-off day, so same-day turnover is allowed.
 */

export interface DateRange {
  start_date: string;
  end_date: string;
}

/** True if the car is free for [start, end) — no confirmed booking / block. */
export async function isCarAvailable(
  carId: string,
  start: string,
  end: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_car_available", {
    car_id: carId,
    p_start: start,
    p_end: end,
  });
  if (error) throw error;
  return data ?? false;
}

/**
 * Unavailable date ranges for a car (confirmed bookings + blocked
 * periods), with NO customer data. Used to disable/grey out dates in the
 * public date picker. Reads the public `car_unavailable_ranges` view.
 */
export async function getUnavailableRanges(
  carId: string,
): Promise<DateRange[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("car_unavailable_ranges")
    .select("start_date, end_date")
    .eq("car_id", carId);
  if (error) throw error;

  return (data ?? [])
    .filter(
      (r): r is CarUnavailableRange & DateRange =>
        r.start_date !== null && r.end_date !== null,
    )
    .map((r) => ({ start_date: r.start_date, end_date: r.end_date }));
}
