/**
 * Single source of truth for per-agency identity.
 *
 * Everything here is driven by environment variables so the same codebase
 * can be redeployed for a new agency by changing env values only — no code
 * edits. Values fall back to sensible defaults so the app runs out of the box.
 *
 * NOTE: only `NEXT_PUBLIC_*` vars are readable here because this module is
 * imported by client components too. Server-only secrets must never live here.
 */

export type Locale = "ar" | "fr";

export const locales = ["ar", "fr"] as const;

function env(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.length > 0 ? value : fallback;
}

const defaultLocale = env("NEXT_PUBLIC_DEFAULT_LOCALE", "ar") as Locale;

export const siteConfig = {
  name: env("NEXT_PUBLIC_SITE_NAME", "Kira"),
  url: env("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  /** Brand logo image URL. Empty → fall back to the built-in icon + name. */
  logo: env("NEXT_PUBLIC_LOGO_URL", ""),
  defaultLocale: (locales.includes(defaultLocale)
    ? defaultLocale
    : "ar") as Locale,
  locales,
  currency: env("NEXT_PUBLIC_CURRENCY", "MAD"),
  /** Brand colors as HEX. Injected as CSS variables to theme the whole site. */
  colors: {
    primary: env("NEXT_PUBLIC_PRIMARY_COLOR", "#0F3D3E"),
    secondary: env("NEXT_PUBLIC_SECONDARY_COLOR", "#C8A24B"),
  },
} as const;

export type SiteConfig = typeof siteConfig;

/** Per-locale text direction. */
export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  fr: "ltr",
};
