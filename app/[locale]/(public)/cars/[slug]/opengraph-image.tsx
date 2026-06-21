import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { siteConfig, type Locale } from "@/config/site.config";
import { resolveBranding } from "@/lib/branding";
import { getAgencySettings, getCarBySlug } from "@/server/queries";
import { carName, formatPrice } from "@/lib/display";

// Node runtime so the Supabase (supabase-js) read and fs font load work.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Car";

/**
 * Per-car social share image generated with `next/og` (Satori). Branded with
 * the agency's primary color, the car name, key specs and the daily price.
 * Falls back to a simple branded card if the car can't be loaded.
 *
 * The bundled Almarai TTF (also used for the PDF) is embedded so Arabic text
 * renders with real glyphs rather than tofu.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [car, settings, almarai] = await Promise.all([
    getCarBySlug(slug).catch(() => null),
    getAgencySettings().catch(() => null),
    readFile(
      path.join(process.cwd(), "assets", "fonts", "Almarai-Bold.ttf"),
    ).catch(() => null),
  ]);

  const brand = resolveBranding(settings, locale as Locale);
  const primary = brand.primaryColor || "#0F3D3E";
  const accent = brand.secondaryColor || "#C8A24B";

  const name = car ? carName(car, locale as Locale) : brand.name;
  const specs = car ? `${car.brand} · ${car.model} · ${car.year}` : "";
  const price = car
    ? `${formatPrice(Number(car.price_per_day), siteConfig.currency, locale as Locale)}`
    : "";

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

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: `linear-gradient(135deg, ${primary} 0%, #0b2b2c 100%)`,
        color: "#ffffff",
        fontFamily: "Almarai, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "9999px",
            background: accent,
          }}
        />
        <div style={{ fontSize: "34px", fontWeight: 700, opacity: 0.95 }}>
          {brand.name}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontSize: "78px", fontWeight: 700, lineHeight: 1.05 }}>
          {name}
        </div>
        {specs ? (
          <div style={{ fontSize: "34px", opacity: 0.85 }}>{specs}</div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {price ? (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "12px",
              padding: "14px 28px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.12)",
              fontSize: "40px",
              fontWeight: 700,
            }}
          >
            {price}
          </div>
        ) : (
          <div />
        )}
        <div style={{ fontSize: "28px", color: accent, fontWeight: 700 }}>
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
