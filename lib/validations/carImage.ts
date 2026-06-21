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

/** A single uploaded image's metadata (car_id added by the action). */
export const newCarImageSchema = z.object({
  url: z.url(),
  storage_path: z.string().nullish(),
  alt: z.string().max(160).nullish(),
  alt_ar: z.string().max(160).nullish(),
});

/** Payload for recording one or more freshly-uploaded images. */
export const addCarImagesSchema = z.object({
  car_id: z.uuid(),
  images: z.array(newCarImageSchema).min(1).max(20),
});

export type AddCarImagesInput = z.infer<typeof addCarImagesSchema>;

/** Reorder a car's images by the given id order. */
export const reorderImagesSchema = z.object({
  car_id: z.uuid(),
  ordered_ids: z.array(z.uuid()).min(1),
});

/** Promote one image to primary for its car. */
export const setPrimaryImageSchema = z.object({
  car_id: z.uuid(),
  image_id: z.uuid(),
});

/** Delete a single image (its storage object is best-effort removed). */
export const deleteCarImageSchema = z.object({
  id: z.uuid(),
  storage_path: z.string().nullish(),
});
