import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Plus_Jakarta_Sans, Tajawal } from "next/font/google";

import { routing } from "@/i18n/routing";
import { siteConfig, localeDirection, type Locale } from "@/config/site.config";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
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

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s · ${siteConfig.name}`,
    },
    description: siteConfig.name,
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

  // Inject brand colors as inline custom properties so changing the env
  // values re-themes the entire site (overrides the defaults in globals.css).
  const themeStyle = {
    "--primary": siteConfig.colors.primary,
    "--secondary": siteConfig.colors.secondary,
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
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
