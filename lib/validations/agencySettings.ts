import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "must be a hex color");

/** Agency identity / SEO settings (admin-editable singleton). */
export const agencySettingsSchema = z.object({
  name: z.string().min(1).max(120),
  name_ar: z.string().max(120).nullish(),
  name_fr: z.string().max(120).nullish(),
  logo_url: z.url().nullish().or(z.literal("")),
  primary_color: hexColor,
  secondary_color: hexColor,
  phone: z.string().max(40).nullish(),
  whatsapp_number: z.string().max(40).nullish(),
  email: z.email().max(160).nullish().or(z.literal("")),
  address: z.string().max(300).nullish(),
  address_ar: z.string().max(300).nullish(),
  lat: z.coerce.number().min(-90).max(90).nullish(),
  lng: z.coerce.number().min(-180).max(180).nullish(),
  currency: z.string().length(3).default("MAD"),
  opening_hours: z.record(z.string(), z.unknown()).default({}),
  social_links: z.record(z.string(), z.string()).default({}),
  locales: z
    .array(z.enum(["ar", "fr"]))
    .min(1)
    .default(["ar", "fr"]),
  seo_title: z.string().max(70).nullish(),
  seo_description: z.string().max(160).nullish(),
  og_image_url: z.url().nullish().or(z.literal("")),
});

export type AgencySettingsInput = z.infer<typeof agencySettingsSchema>;
