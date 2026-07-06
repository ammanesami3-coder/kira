import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Headset,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Umbrella,
} from "lucide-react";

import { siteConfig } from "@/config/site.config";
import { Badge } from "@/components/ui/badge";
import { QuickSearch } from "@/components/public/quick-search";
import { Reveal } from "@/components/motion/reveal";

const TRUST_ITEMS = [
  { key: "secure", Icon: ShieldCheck },
  { key: "insurance", Icon: Umbrella },
  { key: "support", Icon: Headset },
  { key: "flexible", Icon: RefreshCw },
] as const;

/**
 * Hosts covered by next.config `images.remotePatterns`. The owner may paste
 * an arbitrary hero URL in the dashboard; optimizing an unlisted host would
 * throw at request time, so those render unoptimized instead of crashing.
 */
function isOptimizableHost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname.endsWith(".supabase.co") || hostname === "placehold.co";
  } catch {
    return false;
  }
}

/**
 * Landing hero — asymmetric bento grid:
 *
 *   ┌───────────────────────────┬──────────────┐
 *   │ headline + subtitle       │              │
 *   ├───────────────────────────┤  hero image  │
 *   │ quick-search (glass)      │  + fleet chip│
 *   ├───────────────────────────┴──────────────┤
 *   │ trust tiles (4 glass mini-cards)         │
 *   └──────────────────────────────────────────┘
 *
 * LCP contract: the image and the h1 render with NO entrance animation
 * (an opacity-0 start would push LCP back); the image keeps `priority` and
 * a reserved ratio on mobile / grid-driven height on desktop, so nothing
 * here can shift layout. Only the below-fold trust tiles scroll-reveal.
 */
export function Hero({
  imageUrl,
  carsCount = 0,
}: {
  imageUrl: string | null;
  carsCount?: number;
}) {
  const t = useTranslations("home");
  const tTrust = useTranslations("trust");

  return (
    <section
      data-sec="hero"
      className="hero-grid relative overflow-hidden border-b"
    >
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-12 lg:gap-6 lg:px-8">
        {/* Media cell — LCP. First on mobile; spans both text rows on desktop. */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border shadow-xl lg:order-2 lg:col-span-5 lg:row-span-2 lg:aspect-auto">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={t("heroImageAlt")}
              fill
              priority
              fetchPriority="high"
              unoptimized={!isOptimizableHost(imageUrl)}
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="ken-burns object-cover"
            />
          ) : (
            <div className="bg-primary/10 size-full" />
          )}
          {carsCount > 0 && (
            <div className="glass absolute start-4 bottom-4 rounded-2xl px-4 py-2.5">
              <p className="text-2xl leading-none font-bold tracking-tight">
                {carsCount}+
              </p>
              <p className="text-muted-foreground mt-1 text-xs font-medium">
                {t("fleetChip")}
              </p>
            </div>
          )}
        </div>

        {/* Headline cell */}
        <div className="flex flex-col gap-6 lg:order-1 lg:col-span-7 lg:justify-center lg:pe-8">
          <Badge
            variant="secondary"
            className="glass w-fit gap-1.5 px-3 py-1 text-xs"
          >
            <Sparkles className="size-3.5" aria-hidden />
            {t("badge")}
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t("title", { name: siteConfig.name })}
          </h1>

          <p className="text-muted-foreground max-w-xl text-lg text-pretty">
            {t("subtitle")}
          </p>
        </div>

        {/* Search cell — glass panel */}
        <div className="lg:order-3 lg:col-span-7">
          <QuickSearch />
        </div>

        {/* Trust tiles — absorbed from the old TrustBadges strip */}
        <Reveal
          variant="fade"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:order-4 lg:col-span-12"
        >
          {TRUST_ITEMS.map(({ key, Icon }) => (
            <div
              key={key}
              className="glass flex items-center gap-3 rounded-2xl p-3.5"
            >
              <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <span className="text-sm font-medium text-pretty">
                {tTrust(key)}
              </span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
