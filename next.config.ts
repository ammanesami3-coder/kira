import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // @react-pdf/renderer (+ fontkit) is a heavy native-ish dependency that
  // must run in the Node runtime, not be bundled/transpiled by Turbopack.
  serverExternalPackages: ["@react-pdf/renderer"],
  // The Arabic PDF font is read from disk at render time; make sure the TTFs
  // are traced into the serverless function bundle on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./assets/fonts/**"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Supabase Storage is the production image host; `placehold.co` covers
    // the dev/seed dataset. Add the concrete Supabase project host (or a
    // CDN) per-deployment as needed.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
