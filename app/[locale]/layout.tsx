import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Plus_Jakarta_Sans, Tajawal } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

import { routing } from "@/i18n/routing";
import { siteConfig, localeDirection, type Locale } from "@/config/site.config";
import { ogLocale } from "@/lib/seo";
import { resolveBranding } from "@/lib/branding";
import { getAgencySettings } from "@/server/queries";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-tajawal",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = hasLocale(routing.locales, locale)
    ? (locale as Locale)
    : siteConfig.defaultLocale;
  const settings = await getAgencySettings().catch(() => null);
  const brand = resolveBranding(settings, safeLocale);
  const description = settings?.seo_description || brand.name;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: settings?.seo_title || brand.name,
      template: `%s · ${brand.name}`,
    },
    description,
    applicationName: brand.name,
    icons: { icon: "/favicon.ico" },
    // Per-page metadata overrides title/description/canonical; these are the
    // shared OG/Twitter defaults. The actual OG/Twitter image comes from the
    // file-convention `opengraph-image` (per-car, with a branded public
    // default) so every page ships a social card.
    openGraph: {
      type: "website",
      siteName: brand.name,
      locale: ogLocale[safeLocale],
      alternateLocale: siteConfig.locales
        .filter((l) => l !== safeLocale)
        .map((l) => ogLocale[l]),
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const dir = localeDirection[locale as Locale];

  // Brand colors come from the agency settings (owner-editable), falling back
  // to env defaults. Injected as inline custom properties so an edit in the
  // dashboard re-themes the entire site with no redeploy.
  const settings = await getAgencySettings().catch(() => null);
  const brand = resolveBranding(settings, locale as Locale);
  const themeStyle = {
    "--primary": brand.primaryColor,
    "--secondary": brand.secondaryColor,
  } as React.CSSProperties;

  return (
    <html
      lang={locale}
      dir={dir}
      style={themeStyle}
      className={`${jakarta.variable} ${tajawal.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          {children}
          <Toaster />
        </NextIntlClientProvider>
        {/* Field Core Web Vitals (LCP/CLS/INP) + privacy-light page analytics.
            No-ops in dev / outside Vercel. */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
