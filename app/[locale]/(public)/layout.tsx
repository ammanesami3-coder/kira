import { setRequestLocale } from "next-intl/server";

import { buildSectionCss, parseDesign } from "@/lib/design";
import { getAgencySettings } from "@/server/queries";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { MotionProvider } from "@/components/motion/motion-config";

/**
 * Chrome for the public-facing site (navbar + footer). The admin dashboard
 * lives outside this group, so it gets its own shell with no public chrome.
 *
 * Calls `setRequestLocale` so the next-intl APIs used by `Navbar`/`Footer`
 * (`getLocale`, `getTranslations`) resolve from the static locale rather than
 * falling back to reading request `headers()` — which would opt every public
 * page out of static rendering / ISR.
 *
 * Also injects the owner's per-section text-color overrides (admin →
 * settings → design) as an unlayered `<style>` tag: unlayered CSS beats
 * Tailwind's `@layer utilities`, so the picked colors reliably win over
 * classes like `text-muted-foreground`. `getAgencySettings` is request-cached,
 * so this adds no extra query on top of the Navbar/Footer reads.
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const settings = await getAgencySettings().catch(() => null);
  const sectionCss = buildSectionCss(parseDesign(settings?.design));

  return (
    <MotionProvider>
      {sectionCss && <style>{sectionCss}</style>}
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </MotionProvider>
  );
}
