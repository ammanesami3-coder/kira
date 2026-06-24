import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Car, Compass, Gem, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { CarCategory } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

/** Categories surfaced as entry points; each links to the filtered catalog. */
const FEATURED: { key: CarCategory; Icon: typeof Car }[] = [
  { key: "economy", Icon: Car },
  { key: "suv", Icon: Compass },
  { key: "luxury", Icon: Gem },
  { key: "van", Icon: Users },
];

/**
 * Fleet categories grid. Cards deep-link into `/cars?category=…`, a crawlable,
 * shareable filtered view (no client state). Hover lift is a transform-only
 * micro-interaction.
 */
export function FleetCategories({ locale }: { locale: string }) {
  const t = useTranslations("fleet");
  const tCat = useTranslations("categories");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="bg-muted/40 border-y">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
            <p className="text-muted-foreground mt-3">{t("subtitle")}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/cars" className="gap-2">
              {t("cta")}
              <Arrow className="size-4" aria-hidden />
            </Link>
          </Button>
        </Reveal>

        <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED.map(({ key, Icon }) => (
            <StaggerItem key={key}>
              <Link
                href={{ pathname: "/cars", query: { category: key } }}
                className="group bg-card focus-visible:ring-ring/50 flex h-full flex-col gap-4 rounded-xl border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-12 items-center justify-center rounded-full transition-colors">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold">{tCat(key)}</h3>
                <p className="text-muted-foreground text-sm text-pretty">
                  {t(`items.${key}`)}
                </p>
                <span className="text-primary mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium">
                  {t("browse")}
                  <Arrow
                    className="size-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
