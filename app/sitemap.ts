import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site.config";
import { absoluteUrl, localePath } from "@/lib/seo";
import { getCarSlugs } from "@/server/queries";

// Refresh the sitemap on the same cadence as the catalog so newly published
// cars are discoverable without a redeploy.
export const revalidate = 3600;

/** hreflang alternates map for a locale-agnostic path (one entry per locale). */
function languagesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of siteConfig.locales)
    languages[l] = absoluteUrl(localePath(l, path));
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static public routes (home / catalog / contact), one URL per locale.
  const staticRoutes = ["", "/cars", "/about", "/faq", "/contact"] as const;
  for (const locale of siteConfig.locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: absoluteUrl(localePath(locale, route)),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "" ? 1 : 0.8,
        alternates: { languages: languagesFor(route) },
      });
    }
  }

  // Every available car × every locale. Best-effort: if the DB is briefly
  // unreachable the static routes are still emitted.
  const cars = await getCarSlugs().catch(() => []);
  for (const locale of siteConfig.locales) {
    for (const car of cars) {
      const route = `/cars/${car.slug}`;
      entries.push({
        url: absoluteUrl(localePath(locale, route)),
        lastModified: car.updated_at ? new Date(car.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: { languages: languagesFor(route) },
      });
    }
  }

  return entries;
}
