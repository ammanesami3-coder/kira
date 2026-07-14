import { z } from "zod";

import {
  arabicFontIds,
  defaultArabicFont,
  defaultLatinFont,
  latinFontIds,
} from "@/config/fonts.config";
import { HOME_SECTION_IDS } from "@/lib/design";

const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "must be a hex color");

/** Optional hex in form state: "" means "use the theme default". */
const optionalHex = hexColor.optional().or(z.literal(""));

/** Heading/text overrides for one public-site section (see lib/design.ts). */
const sectionColorsSchema = z.object({
  heading: optionalHex,
  text: optionalHex,
});

/** Positive integer or null ("" is mapped to null by the form). */
const optionalInt = (min: number, max: number) =>
  z.number().int().min(min).max(max).nullish();

/**
 * Owner-editable site design (persisted as `agency_settings.design` jsonb).
 * Section keys mirror DESIGN_SECTION_IDS in lib/design.ts.
 */
export const siteDesignSchema = z.object({
  hero_image_url: z.url().nullish().or(z.literal("")),
  logo_height_header: optionalInt(16, 200),
  logo_height_footer: optionalInt(16, 200),
  stats: z
    .object({
      cars: optionalInt(0, 1_000_000),
      clients: optionalInt(0, 1_000_000),
      years: optionalInt(0, 1_000),
      satisfaction: optionalInt(0, 100),
    })
    .default({}),
  sections: z
    .object({
      hero: sectionColorsSchema.optional(),
      howItWorks: sectionColorsSchema.optional(),
      fleet: sectionColorsSchema.optional(),
      featured: sectionColorsSchema.optional(),
      valueProps: sectionColorsSchema.optional(),
      stats: sectionColorsSchema.optional(),
      testimonials: sectionColorsSchema.optional(),
      faq: sectionColorsSchema.optional(),
      cta: sectionColorsSchema.optional(),
      footer: sectionColorsSchema.optional(),
    })
    .default({}),
  home_section_order: z
    .array(z.enum(HOME_SECTION_IDS))
    .max(HOME_SECTION_IDS.length)
    .nullish(),
});

export type SiteDesignInput = z.infer<typeof siteDesignSchema>;

/**
 * Owner overrides for one booking extra: visibility + optional price
 * (null/"" = keep the default catalog price).
 */
const bookingExtraItemSchema = z.object({
  enabled: z.boolean().default(true),
  price: z.coerce.number().min(0).max(1_000_000).nullish(),
});

const defaultExtraItem = { enabled: true, price: null };
const defaultExtraItems = {
  full_insurance: defaultExtraItem,
  additional_driver: defaultExtraItem,
  gps: defaultExtraItem,
  child_seat: defaultExtraItem,
};

/**
 * Owner-editable booking extras ("options supplémentaires") — persisted as
 * `agency_settings.booking_extras` jsonb. Keys mirror EXTRA_IDS in
 * lib/booking/extras.ts. The defaults reproduce the built-in catalog, so an
 * untouched form saves a no-op blob.
 */
export const bookingExtrasSchema = z
  .object({
    enabled: z.boolean().default(true),
    items: z
      .object({
        full_insurance: bookingExtraItemSchema.default(defaultExtraItem),
        additional_driver: bookingExtraItemSchema.default(defaultExtraItem),
        gps: bookingExtraItemSchema.default(defaultExtraItem),
        child_seat: bookingExtraItemSchema.default(defaultExtraItem),
      })
      .default(defaultExtraItems),
  })
  .default({ enabled: true, items: defaultExtraItems });

export type BookingExtrasInput = z.infer<typeof bookingExtrasSchema>;

/** One owner-curated showcase review (mirrors lib/reviews.ts AgencyReview). */
export const agencyReviewSchema = z.object({
  author: z.string().min(1).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  quote: z.string().min(1).max(400),
  date: z.string().max(40).optional().or(z.literal("")),
});

export type AgencyReviewInput = z.infer<typeof agencyReviewSchema>;

/** Agency identity / SEO settings (admin-editable singleton). */
export const agencySettingsSchema = z.object({
  name: z.string().min(1).max(120),
  name_ar: z.string().max(120).nullish(),
  name_fr: z.string().max(120).nullish(),
  logo_url: z.url().nullish().or(z.literal("")),
  primary_color: hexColor,
  secondary_color: hexColor,
  font_latin: z.enum(latinFontIds).default(defaultLatinFont),
  font_arabic: z.enum(arabicFontIds).default(defaultArabicFont),
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
    .array(z.enum(["ar", "fr", "en"]))
    .min(1)
    .default(["ar", "fr", "en"]),
  seo_title: z.string().max(70).nullish(),
  seo_description: z.string().max(160).nullish(),
  og_image_url: z.url().nullish().or(z.literal("")),
  google_maps_link: z.url().nullish().or(z.literal("")),
  reviews: z.array(agencyReviewSchema).max(12).default([]),
  design: siteDesignSchema.default({ stats: {}, sections: {} }),
  booking_extras: bookingExtrasSchema,
});

export type AgencySettingsInput = z.infer<typeof agencySettingsSchema>;
