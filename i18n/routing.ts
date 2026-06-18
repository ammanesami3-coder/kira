import { defineRouting } from "next-intl/routing";
import { locales, siteConfig } from "@/config/site.config";

export const routing = defineRouting({
  locales,
  defaultLocale: siteConfig.defaultLocale,
  // Every locale carries an explicit prefix (/ar, /fr) — clean hreflang
  // and unambiguous canonical URLs for SEO.
  localePrefix: "always",
});
