import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site.config";

// Static public routes. Dynamic car slugs are added in a later phase.
const routes = ["", "/cars", "/contact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of siteConfig.locales) {
    for (const route of routes) {
      entries.push({
        url: `${siteConfig.url}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "" ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            siteConfig.locales.map((l) => [
              l,
              `${siteConfig.url}/${l}${route}`,
            ]),
          ),
        },
      });
    }
  }

  return entries;
}
