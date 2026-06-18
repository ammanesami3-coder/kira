import { useTranslations } from "next-intl";
import { Car } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site.config";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/public/locale-switcher";

export function Navbar() {
  const t = useTranslations("nav");

  const links = [
    { href: "/", label: t("home") },
    { href: "/cars", label: t("cars") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
            <Car className="size-5" />
          </span>
          <span className="text-lg">{siteConfig.name}</span>
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
