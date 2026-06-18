import { useTranslations } from "next-intl";
import { Car } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site.config";

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  const exploreLinks = [
    { href: "/cars", label: t("nav.cars") },
    { href: "/contact", label: t("nav.contact") },
  ] as const;

  return (
    <footer className="bg-muted/40 mt-24 border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Car className="size-4" />
            </span>
            <span>{siteConfig.name}</span>
          </Link>
          <p className="text-muted-foreground max-w-xs text-sm">
            {t("footer.tagline")}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t("footer.explore")}</h3>
          <ul className="space-y-2 text-sm">
            {exploreLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t("footer.contact")}</h3>
          <p className="text-muted-foreground text-sm">{siteConfig.url}</p>
        </div>
      </div>

      <div className="border-t py-6">
        <p className="text-muted-foreground text-center text-xs">
          © {year} {siteConfig.name}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
