/**
 * Effective per-agency branding = DB `agency_settings` (owner-editable, the
 * source of truth) layered over the `site.config` env defaults. Editing the
 * settings in the admin dashboard therefore re-themes the public site
 * (colors), updates its identity (name/logo) and never breaks when the row
 * or a field is missing.
 *
 * Pure (no server-only imports) so it is usable from both Server and Client
 * Components.
 */

import type { AgencySettings } from "@/types/database.types";
import { siteConfig, type Locale } from "@/config/site.config";

export interface Branding {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

type BrandingSettings = Pick<
  AgencySettings,
  | "name"
  | "name_ar"
  | "name_fr"
  | "logo_url"
  | "primary_color"
  | "secondary_color"
> | null;

function localizedName(settings: BrandingSettings, locale: Locale): string {
  if (!settings) return siteConfig.name;
  if (locale === "ar" && settings.name_ar) return settings.name_ar;
  if (locale === "fr" && settings.name_fr) return settings.name_fr;
  return settings.name || siteConfig.name;
}

export function resolveBranding(
  settings: BrandingSettings,
  locale: Locale,
): Branding {
  return {
    name: localizedName(settings, locale),
    logo: settings?.logo_url || siteConfig.logo,
    primaryColor: settings?.primary_color || siteConfig.colors.primary,
    secondaryColor: settings?.secondary_color || siteConfig.colors.secondary,
  };
}
