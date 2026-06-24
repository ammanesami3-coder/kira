import Image from "next/image";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

import { siteConfig } from "@/config/site.config";
import { Badge } from "@/components/ui/badge";
import { QuickSearch } from "@/components/public/quick-search";

/**
 * Landing hero. The image is the LCP element, so it is eagerly loaded
 * (`priority`) with a reserved aspect ratio to avoid layout shift.
 * When no fleet image is available it gracefully degrades to the themed
 * gradient background alone.
 */
export function Hero({ imageUrl }: { imageUrl: string | null }) {
  const t = useTranslations("home");

  return (
    <section className="hero-grid relative overflow-hidden border-b">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-12 lg:px-8">
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="size-3.5" aria-hidden />
            {t("badge")}
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t("title", { name: siteConfig.name })}
          </h1>

          <p className="text-muted-foreground max-w-xl text-lg text-pretty">
            {t("subtitle")}
          </p>

          <div className="mt-2">
            <QuickSearch />
          </div>
        </div>

        <div className="relative order-first aspect-[4/3] overflow-hidden rounded-2xl border shadow-xl lg:order-none">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={t("heroImageAlt")}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="ken-burns object-cover"
            />
          ) : (
            <div className="bg-primary/10 size-full" />
          )}
        </div>
      </div>
    </section>
  );
}
