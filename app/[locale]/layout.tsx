import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Plus_Jakarta_Sans, Tajawal } from "next/font/google";

import { routing } from "@/i18n/routing";
import { siteConfig, localeDirection, type Locale } from "@/config/site.config";
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
  const settings = await getAgencySettings().catch(() => null);
  const brand = resolveBranding(
    settings,
    hasLocale(routing.locales, locale) ? (locale as Locale) : "ar",
  );
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: settings?.seo_title || brand.name,
      template: `%s · ${brand.name}`,
    },
    description: settings?.seo_description || brand.name,
    icons: { icon: "/favicon.ico" },
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
      </body>
    </html>
  );
}
