import { z } from "zod";

/** Mirrors the `car_category` / `transmission_type` DB enums. */
export const carCategorySchema = z.enum([
  "economy",
  "sedan",
  "suv",
  "luxury",
  "van",
  "pickup",
  "sport",
]);

export const transmissionSchema = z.enum(["manual", "automatic"]);

/**
 * Car create/update payload (admin). Numeric fields use coercion so the
 * same schema validates HTML form strings on the client and JSON on the
 * server. Identical validation runs in both places — never trust the UI.
 */
export const carSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  name: z.string().min(1).max(120),
  name_ar: z.string().max(120).nullish(),
  brand: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.coerce.number().int().min(1980).max(2100),
  category: carCategorySchema,
  transmission: transmissionSchema,
  fuel_type: z.string().min(1).max(40),
  seats: z.coerce.number().int().min(1).max(60),
  doors: z.coerce.number().int().min(1).max(10),
  price_per_day: z.coerce.number().nonnegative(),
  price_per_week: z.coerce.number().nonnegative().nullish(),
  deposit: z.coerce.number().nonnegative().default(0),
  features: z.array(z.string()).default([]),
  description: z.string().nullish(),
  description_ar: z.string().nullish(),
  description_fr: z.string().nullish(),
  is_available: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export type CarInput = z.infer<typeof carSchema>;

/** Update payload: same fields plus the target id. */
export const carUpdateSchema = carSchema.extend({ id: z.uuid() });
export type CarUpdateInput = z.infer<typeof carUpdateSchema>;

/** Toggle a car's public availability (the master show/hide switch). */
export const toggleAvailabilitySchema = z.object({
  id: z.uuid(),
  is_available: z.boolean(),
});
