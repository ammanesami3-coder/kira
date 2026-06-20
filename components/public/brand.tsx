import { Car } from "lucide-react";

import { siteConfig } from "@/config/site.config";

/**
 * Brand lockup used in the navbar and footer.
 *
 * When `NEXT_PUBLIC_LOGO_URL` is set (in Vercel, like the name/colors) the
 * agency logo image is shown on its own. Otherwise it falls back to the
 * built-in car icon + the site name, so the app still looks complete with
 * zero configuration.
 *
 * A plain `<img>` is intentional: the logo URL is arbitrary per-deployment,
 * so this stays host-agnostic (no `next.config` image allowlist to edit).
 * A fixed height reserves layout space to avoid CLS.
 */
export function BrandLogo({ size = "md" }: { size?: "md" | "sm" }) {
  const isMd = size === "md";

  if (siteConfig.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary external logo host; see above
      <img
        src={siteConfig.logo}
        alt={siteConfig.name}
        className={`${isMd ? "h-16" : "h-8"} w-auto max-w-[180px] object-contain`}
      />
    );
  }

  return (
    <>
      <span
        className={`bg-primary text-primary-foreground flex ${
          isMd ? "size-9" : "size-8"
        } items-center justify-center rounded-lg`}
      >
        <Car className={isMd ? "size-5" : "size-4"} aria-hidden />
      </span>
      <span className={isMd ? "text-lg" : undefined}>{siteConfig.name}</span>
    </>
  );
}
