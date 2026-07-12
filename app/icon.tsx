import { ImageResponse } from "next/og";

import { createPublicClient } from "@/lib/supabase/public";
import { siteConfig } from "@/config/site.config";

/**
 * Dynamic favicon generated from the agency's own logo (agency_settings /
 * env), replacing the previously referenced-but-missing /favicon.ico. This
 * is what the browser tab shows and what Google displays next to the site
 * name in search results (Google wants a square icon, a multiple of 48px —
 * 192×192 here). Falls back to a monogram tile in the brand color when the
 * logo is missing or unreachable, so the route never 404s.
 */

export const revalidate = 3600;
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

/** Fetch the logo and inline it as a data URI (null on any failure). */
async function loadLogo(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/png";
    if (!type.startsWith("image/")) return null;
    const data = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Icon() {
  let logo: string | null = null;
  let name = siteConfig.name;
  let color = siteConfig.colors.primary;

  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("agency_settings")
      .select("name, logo_url, primary_color")
      .limit(1)
      .maybeSingle();
    if (data?.name) name = data.name;
    if (data?.primary_color) color = data.primary_color;
    logo = await loadLogo(data?.logo_url || siteConfig.logo || null);
  } catch {
    // Fall through to the monogram tile.
  }

  if (logo) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: 36,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- satori JSX, next/image does not exist here */}
        <img
          src={logo}
          alt=""
          width={168}
          height={168}
          style={{ objectFit: "contain" }}
        />
      </div>,
      size,
    );
  }

  const letter = (name.match(/[A-Za-z0-9]/)?.[0] ?? "K").toUpperCase();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: color,
        color: "#ffffff",
        fontSize: 112,
        fontWeight: 700,
        borderRadius: 36,
      }}
    >
      {letter}
    </div>,
    size,
  );
}
