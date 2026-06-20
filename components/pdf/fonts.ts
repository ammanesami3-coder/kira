import "server-only";

import path from "node:path";

import { Font } from "@react-pdf/renderer";

/**
 * Register an Arabic-capable font with @react-pdf/renderer.
 *
 * @react-pdf shapes text through fontkit + textkit, which apply the font's
 * GSUB features (Arabic initial/medial/final/isolated forms + ligatures) and
 * bidi reordering — but ONLY when a font that actually contains Arabic glyphs
 * is registered. The default Helvetica has none, so Arabic would otherwise
 * render as tofu boxes. We ship Almarai (OFL) statically with the repo.
 *
 * The TTFs live under `assets/fonts/` and are pulled into the serverless
 * bundle via `outputFileTracingIncludes` in `next.config.ts`. We register by
 * absolute path resolved from `process.cwd()` so it works both in `next dev`
 * and on Vercel.
 */

export const PDF_FONT_FAMILY = "Almarai";

const fontsDir = path.join(process.cwd(), "assets", "fonts");

let registered = false;

/** Idempotently register the PDF fonts. Safe to call on every render. */
export function registerPdfFonts(): void {
  if (registered) return;

  Font.register({
    family: PDF_FONT_FAMILY,
    fonts: [
      { src: path.join(fontsDir, "Almarai-Regular.ttf"), fontWeight: 400 },
      { src: path.join(fontsDir, "Almarai-Bold.ttf"), fontWeight: 700 },
      { src: path.join(fontsDir, "Almarai-ExtraBold.ttf"), fontWeight: 800 },
    ],
  });

  // Disable word hyphenation: the default callback splits words on every
  // character, which mangles Arabic (and is undesirable for our short fields).
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
