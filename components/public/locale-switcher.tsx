"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { Globe, Check } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/config/site.config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const localeLabelKey: Record<Locale, "arabic" | "french"> = {
  ar: "arabic",
  fr: "french",
};

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const activeLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function onSelect(nextLocale: Locale) {
    if (nextLocale === activeLocale) return;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- next-intl typed routes don't know params shape
        { pathname, params },
        { locale: nextLocale },
      );
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isPending}
          aria-label={t("language")}
        >
          <Globe className="size-4" />
          <span className="hidden sm:inline">
            {t(localeLabelKey[activeLocale as Locale])}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => onSelect(locale)}
            className="justify-between"
          >
            {t(localeLabelKey[locale])}
            {locale === activeLocale && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
