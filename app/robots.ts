import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin dashboard must never be indexed.
      disallow: ["/*/admin", "/api"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
