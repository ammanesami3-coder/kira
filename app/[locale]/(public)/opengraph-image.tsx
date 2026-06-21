import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getTranslations } from "next-intl/server";

import { siteConfig, type Locale } from "@/config/site.config";
import { resolveBranding } from "@/lib/branding";
import { getAgencySettings } from "@/server/queries";

// Node runtime so the Supabase read + fs font load work.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Kira";

/**
 * Default social share image for the public pages (home, catalog, contact).
 * Car detail pages override this with their own per-car `opengraph-image`.
 *
 * If the owner configured `agency_settings.og_image_url`, that explicit image
 * wins (rendered full-bleed). Otherwise we generate a branded card from the
 * agency name + tagline + colors, so every page has a consistent social card
 * with zero configuration. Almarai is embedded for correct Arabic glyphs.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [settings, t, almarai] = await Promise.all([
    getAgencySettings().catch(() => null),
    getTranslations({ locale, namespace: "home" }),
    readFile(
      path.join(process.cwd(), "assets", "fonts", "Almarai-Bold.ttf"),
    ).catch(() => null),
  ]);

  const brand = resolveBranding(settings, locale as Locale);
  const primary = brand.primaryColor || "#0F3D3E";
  const accent = brand.secondaryColor || "#C8A24B";

  const fonts = almarai
    ? [
        {
          name: "Almarai",
          data: almarai as unknown as ArrayBuffer,
          weight: 700 as const,
          style: "normal" as const,
        },
      ]
    : undefined;

  // Owner-configured image wins — render it full-bleed.
  if (settings?.og_image_url) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.og_image_url}
          width={size.width}
          height={size.height}
          style={{ objectFit: "cover" }}
          alt=""
        />
      </div>,
      { ...size },
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: `linear-gradient(135deg, ${primary} 0%, #0b2b2c 100%)`,
        color: "#ffffff",
        fontFamily: "Almarai, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "9999px",
            background: accent,
          }}
        />
        <div style={{ fontSize: "36px", fontWeight: 700 }}>{brand.name}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontSize: "68px", fontWeight: 700, lineHeight: 1.1 }}>
          {t("title", { name: brand.name })}
        </div>
        <div style={{ fontSize: "32px", opacity: 0.85, maxWidth: "900px" }}>
          {t("subtitle")}
        </div>
      </div>

      <div style={{ fontSize: "28px", color: accent, fontWeight: 700 }}>
        {siteConfig.url.replace(/^https?:\/\//, "")}
      </div>
    </div>,
    { ...size, fonts },
  );
}
