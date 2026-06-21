import { z } from "zod";

/**
 * Owner-defined unavailability (maintenance, off-platform reservations).
 * Same half-open [start, end) convention as bookings: `end_date` is
 * exclusive and must be strictly after `start_date`.
 */
export const blockedPeriodSchema = z
  .object({
    car_id: z.uuid(),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    reason: z.string().trim().max(80).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.end_date > v.start_date, {
    message: "end_date must be after start_date",
    path: ["end_date"],
  });

export type BlockedPeriodInput = z.infer<typeof blockedPeriodSchema>;

/** Remove a blocked period by id (admin). */
export const deleteBlockedPeriodSchema = z.object({ id: z.uuid() });
