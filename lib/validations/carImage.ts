import { z } from "zod";

/** Image attached to a car (admin). */
export const carImageSchema = z.object({
  car_id: z.uuid(),
  url: z.url(),
  storage_path: z.string().nullish(),
  alt: z.string().max(160).nullish(),
  alt_ar: z.string().max(160).nullish(),
  is_primary: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
});

export type CarImageInput = z.infer<typeof carImageSchema>;
