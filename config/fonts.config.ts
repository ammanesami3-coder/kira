/**
 * Whitelist of admin-selectable global fonts.
 *
 * Pure constants (no next/font imports) so this module is usable from Zod
 * schemas, client components (admin selects) and the DB CHECK constraint
 * mirror in supabase/migrations. The actual next/font instances live in
 * lib/fonts.ts and are keyed by these ids — keep the three in sync.
 */

export const latinFontIds = ["jakarta", "inter", "montserrat"] as const;
export const arabicFontIds = ["tajawal", "cairo", "ibm-plex-arabic"] as const;

export type LatinFontId = (typeof latinFontIds)[number];
export type ArabicFontId = (typeof arabicFontIds)[number];

export const defaultLatinFont: LatinFontId = "jakarta";
export const defaultArabicFont: ArabicFontId = "tajawal";

/** Human-readable names for the admin dropdowns. */
export const fontLabels: Record<LatinFontId | ArabicFontId, string> = {
  jakarta: "Plus Jakarta Sans",
  inter: "Inter",
  montserrat: "Montserrat",
  tajawal: "Tajawal",
  cairo: "Cairo",
  "ibm-plex-arabic": "IBM Plex Sans Arabic",
};

export function isLatinFontId(value: unknown): value is LatinFontId {
  return (
    typeof value === "string" &&
    (latinFontIds as readonly string[]).includes(value)
  );
}

export function isArabicFontId(value: unknown): value is ArabicFontId {
  return (
    typeof value === "string" &&
    (arabicFontIds as readonly string[]).includes(value)
  );
}
