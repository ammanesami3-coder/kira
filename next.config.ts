import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * We deliberately keep `'unsafe-inline'` for scripts/styles instead of a
 * nonce-based policy: a per-request nonce forces dynamic rendering, which would
 * opt every page out of static rendering / ISR — directly conflicting with the
 * performance budgets in CLAUDE.md. A static allow-list CSP is the right
 * trade-off for a mostly-static marketing + catalog site. `'unsafe-eval'` is
 * only added in development (React Refresh needs it); production omits it.
 *
 * Allowed external origins:
 *   - *.supabase.co        → DB/auth REST, Storage, realtime (wss) + images
 *   - va.vercel-scripts.com / *.vercel-insights.com → Analytics + Speed Insights
 *   - challenges.cloudflare.com → optional Turnstile anti-spam widget
 * Google fonts are self-hosted by next/font at build time, so no font origin
 * is required.
 */
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'self'`,
  `form-action 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://*.vercel-insights.com https://challenges.cloudflare.com`,
  `frame-src https://challenges.cloudflare.com https://www.google.com https://maps.google.com`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Native View Transitions API for client-side route changes. Next wraps
  // soft navigations in `document.startViewTransition`, giving a smooth
  // crossfade between pages and a shared-element morph wherever the same
  // `view-transition-name` exists on both pages (catalog card ↔ detail hero).
  // CSS in globals.css neutralises the effect under `prefers-reduced-motion`.
  experimental: {
    viewTransition: true,
  },
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
          { key: "Content-Security-Policy", value: csp },
          // HSTS: force HTTPS for 2 years incl. subdomains, preload-eligible.
          // Safe on Vercel (always HTTPS). Harmless on localhost (HTTP ignores it).
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
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
