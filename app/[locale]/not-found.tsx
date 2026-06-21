import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Localized 404 page for unmatched routes under a valid locale
 * (e.g. /ar/this-car-does-not-exist). It renders inside `[locale]/layout`,
 * so the brand theme, fonts and RTL/LTR direction are already applied.
 */
export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations("errors");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-primary text-7xl font-bold tracking-tight sm:text-8xl">
        404
      </p>
      <h1 className="mt-6 text-2xl font-semibold sm:text-3xl">
        {t("notFoundTitle")}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-balance">
        {t("notFoundMessage")}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/" locale={locale}>
            {t("backHome")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/cars" locale={locale}>
            {t("browseCars")}
          </Link>
        </Button>
      </div>
    </main>
  );
}
