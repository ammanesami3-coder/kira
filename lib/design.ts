/**
 * Owner-editable site design: shared read-side helpers.
 *
 * `agency_settings.design` is a jsonb blob validated by Zod on write, but
 * jsonb carries no schema — so every read goes through `parseDesign`, which
 * silently drops malformed values instead of ever crashing a page (same
 * contract as lib/reviews.ts).
 *
 * Pure module (no server-only imports) — usable from Server Components and
 * the admin form alike.
 */

import type { Json } from "@/types/database.types";

/**
 * Public-site sections whose heading/text colors the owner may override.
 * Ids double as the `data-sec` attribute on each section's root element —
 * `buildSectionCss` emits rules against that attribute.
 */
export const DESIGN_SECTION_IDS = [
  "hero",
  "howItWorks",
  "fleet",
  "featured",
  "valueProps",
  "stats",
  "testimonials",
  "faq",
  "cta",
  "footer",
] as const;

export type DesignSectionId = (typeof DESIGN_SECTION_IDS)[number];

/**
 * Homepage sections the owner may reorder (`design.home_section_order`).
 * Hero is pinned first and the footer lives in the layout, so neither is
 * orderable. The array order here is the built-in default.
 */
export const HOME_SECTION_IDS = [
  "howItWorks",
  "fleet",
  "featured",
  "valueProps",
  "stats",
  "testimonials",
  "faq",
  "cta",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export interface SectionColors {
  /** Hex color for headings (h1–h4) inside the section. */
  heading?: string;
  /** Hex color for body copy (p, li, …) inside the section. */
  text?: string;
}

/** Keys of the editable stats band figures (labels stay translated). */
export const DESIGN_STAT_KEYS = [
  "cars",
  "clients",
  "years",
  "satisfaction",
] as const;

export type DesignStatKey = (typeof DESIGN_STAT_KEYS)[number];

export interface SiteDesign {
  /** Landing hero visual; null = fall back to the first car photo. */
  heroImageUrl: string | null;
  /** Navbar logo height in px; null = built-in size. */
  logoHeightHeader: number | null;
  /** Footer logo height in px; null = built-in size. */
  logoHeightFooter: number | null;
  /** Stats band figures; null = built-in default (cars = live fleet count). */
  stats: Record<DesignStatKey, number | null>;
  /** Per-section text color overrides; absent section = theme default. */
  sections: Partial<Record<DesignSectionId, SectionColors>>;
  /** Homepage section order (after the hero); null = built-in order. */
  homeSectionOrder: HomeSectionId[] | null;
}

export const EMPTY_DESIGN: SiteDesign = {
  heroImageUrl: null,
  logoHeightHeader: null,
  logoHeightFooter: null,
  stats: { cars: null, clients: null, years: null, satisfaction: null },
  sections: {},
  homeSectionOrder: null,
};

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function isSectionId(value: string): value is DesignSectionId {
  return (DESIGN_SECTION_IDS as readonly string[]).includes(value);
}

function isHomeSectionId(value: unknown): value is HomeSectionId {
  return (
    typeof value === "string" &&
    (HOME_SECTION_IDS as readonly string[]).includes(value)
  );
}

/**
 * Canonical homepage order from an owner-supplied list: unknown ids are
 * dropped, duplicates keep their first position, and any missing section is
 * appended in built-in order so every section always renders. Returns null
 * when the result is exactly the built-in order (i.e. "no override").
 */
export function normalizeHomeSectionOrder(
  values: readonly unknown[],
): HomeSectionId[] | null {
  const seen = new Set<HomeSectionId>();
  const order: HomeSectionId[] = [];
  for (const value of values) {
    if (isHomeSectionId(value) && !seen.has(value)) {
      seen.add(value);
      order.push(value);
    }
  }
  for (const id of HOME_SECTION_IDS) {
    if (!seen.has(id)) order.push(id);
  }
  return order.every((id, i) => id === HOME_SECTION_IDS[i]) ? null : order;
}

function asHex(value: Json | undefined): string | undefined {
  return typeof value === "string" && HEX_RE.test(value) ? value : undefined;
}

function asInt(
  value: Json | undefined,
  min: number,
  max: number,
): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
    ? Math.round(value)
    : null;
}

export function parseDesign(value: Json | null | undefined): SiteDesign {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_DESIGN;
  }
  const d = value as Record<string, Json | undefined>;

  const rawStats =
    d.stats && typeof d.stats === "object" && !Array.isArray(d.stats)
      ? (d.stats as Record<string, Json | undefined>)
      : {};
  const stats = {
    cars: asInt(rawStats.cars, 0, 1_000_000),
    clients: asInt(rawStats.clients, 0, 1_000_000),
    years: asInt(rawStats.years, 0, 1_000),
    satisfaction: asInt(rawStats.satisfaction, 0, 100),
  };

  const sections: SiteDesign["sections"] = {};
  const rawSections =
    d.sections && typeof d.sections === "object" && !Array.isArray(d.sections)
      ? (d.sections as Record<string, Json | undefined>)
      : {};
  for (const [key, raw] of Object.entries(rawSections)) {
    if (!isSectionId(key)) continue;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const colors = raw as Record<string, Json | undefined>;
    const heading = asHex(colors.heading);
    const text = asHex(colors.text);
    if (heading || text) {
      sections[key] = {
        ...(heading ? { heading } : {}),
        ...(text ? { text } : {}),
      };
    }
  }

  return {
    heroImageUrl:
      typeof d.hero_image_url === "string" && d.hero_image_url !== ""
        ? d.hero_image_url
        : null,
    logoHeightHeader: asInt(d.logo_height_header, 16, 200),
    logoHeightFooter: asInt(d.logo_height_footer, 16, 200),
    stats,
    sections,
    homeSectionOrder: Array.isArray(d.home_section_order)
      ? normalizeHomeSectionOrder(d.home_section_order)
      : null,
  };
}

/**
 * Per-section color overrides as a tiny CSS string, injected unlayered by the
 * public layout. Unlayered rules beat Tailwind's `@layer utilities`
 * declarations regardless of specificity, so an owner-picked color reliably
 * overrides classes like `text-muted-foreground`. Headings target h1–h4;
 * body copy targets prose-ish elements plus plain links, while `data-slot`
 * excludes shadcn buttons so CTAs keep their own contrast pair. Values are
 * regex-validated hex colors (see `asHex`), so interpolation is safe.
 */
export function buildSectionCss(design: SiteDesign): string {
  const rules: string[] = [];
  for (const [id, colors] of Object.entries(design.sections)) {
    if (colors.heading) {
      rules.push(
        `[data-sec="${id}"] :is(h1,h2,h3,h4){color:${colors.heading}}`,
      );
    }
    if (colors.text) {
      rules.push(
        `[data-sec="${id}"] :is(p,li,dt,dd,blockquote,figcaption,a:not([data-slot="button"])){color:${colors.text}}`,
      );
    }
  }
  return rules.join("\n");
}
