import { setRequestLocale } from "next-intl/server";

import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

/**
 * Chrome for the public-facing site (navbar + footer). The admin dashboard
 * lives outside this group, so it gets its own shell with no public chrome.
 *
 * Calls `setRequestLocale` so the next-intl APIs used by `Navbar`/`Footer`
 * (`getLocale`, `getTranslations`) resolve from the static locale rather than
 * falling back to reading request `headers()` — which would opt every public
 * page out of static rendering / ISR.
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

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
