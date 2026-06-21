/**
 * Shared SEO helpers — URLs and locale alternates.
 *
 * Pure (no server-only imports) so both Server Components and route handlers
 * (sitemap, metadata) can use it. Paths are passed WITHOUT a locale prefix,
 * e.g. "" for the home page or "/cars/dacia-logan" for a detail page.
 */

import { siteConfig, type Locale } from "@/config/site.config";

/** Absolute URL for a locale-prefixed path, e.g. ("ar", "/cars") → ".../ar/cars". */
export function localePath(locale: Locale, path = ""): string {
  return `/${locale}${path}`;
}

/** Absolute, fully-qualified URL (used where Metadata can't resolve relatives). */
export function absoluteUrl(path = ""): string {
  return `${siteConfig.url}${path}`;
}

/**
 * `alternates` block for `generateMetadata`: a canonical for the current
 * locale plus an hreflang map (one entry per locale + `x-default` pointing at
 * the default locale). Relative URLs — Next resolves them against
 * `metadataBase`.
 */
export function localizedAlternates(locale: Locale, path = "") {
  const languages: Record<string, string> = {};
  for (const l of siteConfig.locales) {
    languages[l] = localePath(l, path);
  }
  // x-default → the default-locale variant for unmatched languages/regions.
  languages["x-default"] = localePath(siteConfig.defaultLocale, path);

  return {
    canonical: localePath(locale, path),
    languages,
  };
}

/**
 * `openGraph.locale` / `alternateLocale` expects underscore region tags.
 * Kira targets Morocco, so map ar → ar_MA, fr → fr_MA.
 */
export const ogLocale: Record<Locale, string> = {
  ar: "ar_MA",
  fr: "fr_MA",
};

/** Clamp a description to the 150–160 char SEO sweet spot without cutting words. */
export function clampDescription(text: string, max = 160): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
