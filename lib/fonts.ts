/**
 * next/font registry for the admin-selectable font whitelist.
 *
 * next/font mandates static, module-scope declarations, so every candidate
 * is declared here — but only the *selected* pair's `.variable` classes are
 * ever applied to <html> (app/[locale]/layout.tsx). @font-face is lazy:
 * browsers download a family only when rendered text actually uses it, so
 * the unselected declarations cost a few bytes of CSS and zero font bytes.
 *
 * `preload: false` everywhere is deliberate: Next would otherwise emit
 * <link rel="preload"> hints for all six families on every page (the hint
 * injection is static, per import — it cannot know the runtime selection).
 * With `display: "swap"` + next/font's metric-adjusted fallbacks the swap
 * window is tiny and CLS-free.
 *
 * Keyed by the ids in config/fonts.config.ts — keep both in sync.
 */

import {
  Cairo,
  IBM_Plex_Sans_Arabic,
  Inter,
  Montserrat,
  Plus_Jakarta_Sans,
  Tajawal,
} from "next/font/google";

import type { ArabicFontId, LatinFontId } from "@/config/fonts.config";

/* ── Latin ────────────────────────────────────────────────────────── */

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: false,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  preload: false,
});

/* ── Arabic ───────────────────────────────────────────────────────── */

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-tajawal",
  preload: false,
});

const cairo = Cairo({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-cairo",
  preload: false,
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-ibm-plex-arabic",
  preload: false,
});

/* ── Registry ─────────────────────────────────────────────────────── */

interface FontEntry {
  /** Class that attaches the font's CSS variable to the subtree. */
  variable: string;
  /** The CSS custom property the class defines, e.g. `--font-inter`. */
  cssVar: string;
}

export const latinFonts: Record<LatinFontId, FontEntry> = {
  jakarta: { variable: jakarta.variable, cssVar: "--font-jakarta" },
  inter: { variable: inter.variable, cssVar: "--font-inter" },
  montserrat: { variable: montserrat.variable, cssVar: "--font-montserrat" },
};

export const arabicFonts: Record<ArabicFontId, FontEntry> = {
  tajawal: { variable: tajawal.variable, cssVar: "--font-tajawal" },
  cairo: { variable: cairo.variable, cssVar: "--font-cairo" },
  "ibm-plex-arabic": {
    variable: ibmPlexArabic.variable,
    cssVar: "--font-ibm-plex-arabic",
  },
};

/**
 * Every candidate's variable class in one string — applied around the admin
 * font pickers so each option can preview in its own face. Fonts stay lazy:
 * a family downloads only when preview text actually renders with it.
 */
export const allFontVariables = [
  ...Object.values(latinFonts),
  ...Object.values(arabicFonts),
]
  .map((f) => f.variable)
  .join(" ");
