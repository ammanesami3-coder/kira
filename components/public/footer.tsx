import { getLocale, getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { type Locale } from "@/config/site.config";
import { resolveBranding } from "@/lib/branding";
import { getAgencySettings } from "@/server/queries";
import { BrandLogo } from "@/components/public/brand";

/**
 * Site footer. Contact details come from the `agency_settings` singleton
 * so a redeploy for a new agency needs no code changes. Degrades
 * gracefully when a field (or the whole row) is missing.
 */
export async function Footer() {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const settings = await getAgencySettings().catch(() => null);
  const brand = resolveBranding(settings, locale);

  const year = new Date().getFullYear();
  const address =
    locale === "ar"
      ? (settings?.address_ar ?? settings?.address)
      : settings?.address;

  const exploreLinks = [
    { href: "/cars", label: t("nav.cars") },
    { href: "/contact", label: t("nav.contact") },
  ] as const;

  return (
    <footer className="bg-muted/40 mt-24 border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BrandLogo size="sm" name={brand.name} logo={brand.logo} />
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
          <ul className="text-muted-foreground space-y-2 text-sm">
            {settings?.phone && (
              <li>
                <a
                  href={`tel:${settings.phone}`}
                  className="hover:text-foreground flex items-center gap-2 transition-colors"
                >
                  <Phone className="size-4 shrink-0" aria-hidden />
                  <span dir="ltr">{settings.phone}</span>
                </a>
              </li>
            )}
            {settings?.email && (
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-foreground flex items-center gap-2 transition-colors"
                >
                  <Mail className="size-4 shrink-0" aria-hidden />
                  {settings.email}
                </a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{address}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t py-6">
        <p className="text-muted-foreground text-center text-xs">
          © {year} {brand.name}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
