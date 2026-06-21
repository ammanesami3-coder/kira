"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Localized error boundary for runtime errors thrown inside a locale route.
 * Must be a Client Component (React error boundary). It renders inside
 * `[locale]/layout`, so brand theme, fonts and direction are inherited and
 * `useTranslations` resolves from the NextIntlClientProvider.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Surface to the browser console / monitoring. `digest` is the server-side
    // error id you can correlate with Vercel logs (or Sentry if configured).
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-primary text-7xl font-bold tracking-tight sm:text-8xl">
        500
      </p>
      <h1 className="mt-6 text-2xl font-semibold sm:text-3xl">
        {t("serverErrorTitle")}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-balance">
        {t("serverErrorMessage")}
      </p>
      {error.digest ? (
        <p className="text-muted-foreground/70 mt-2 font-mono text-xs">
          {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>{t("tryAgain")}</Button>
        <Button asChild variant="outline">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
