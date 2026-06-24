import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { type Locale } from "@/config/site.config";
import { resolveBranding } from "@/lib/branding";
import { getAgencySettings } from "@/server/queries";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/public/brand";
import { LocaleSwitcher } from "@/components/public/locale-switcher";

export async function Navbar() {
  const t = await getTranslations("nav");
  const locale = (await getLocale()) as Locale;
  const settings = await getAgencySettings().catch(() => null);
  const brand = resolveBranding(settings, locale);

  const links = [
    { href: "/", label: t("home") },
    { href: "/cars", label: t("cars") },
    { href: "/about", label: t("about") },
    { href: "/faq", label: t("faq") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <BrandLogo size="md" name={brand.name} logo={brand.logo} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Button key={link.href} asChild variant="ghost" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/cars">{t("book")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
