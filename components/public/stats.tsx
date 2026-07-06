import { useTranslations } from "next-intl";

import type { DesignStatKey } from "@/lib/design";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Counter } from "@/components/motion/counter";

/** Built-in headline stats, used when the owner has not set custom figures. */
const STATS = [
  { key: "cars", value: 40, suffix: "+" },
  { key: "clients", value: 1200, suffix: "+" },
  { key: "years", value: 8, suffix: "" },
  { key: "satisfaction", value: 98, suffix: "%" },
] as const;

/**
 * Animated statistics band. Numbers count up the first time they scroll into
 * view (see `Counter`), or render statically under reduced motion / no-JS.
 *
 * Figure precedence per stat: owner override (admin → settings → design) →
 * live fleet count (cars only, when > 0) → built-in default.
 *
 * @param carsCount when provided (> 0) replaces the hard-coded fleet figure
 *   with the real number of published cars.
 * @param overrides owner-set figures from `agency_settings.design.stats`.
 */
export function Stats({
  carsCount,
  overrides,
}: {
  carsCount?: number;
  overrides?: Partial<Record<DesignStatKey, number | null>>;
}) {
  const t = useTranslations("stats");

  return (
    <section
      data-sec="stats"
      className="bg-primary text-primary-foreground border-y"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-primary-foreground/80 mt-3">{t("subtitle")}</p>
        </Reveal>

        <Stagger className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((s) => {
            const fallback =
              s.key === "cars" && carsCount && carsCount > 0
                ? carsCount
                : s.value;
            const value = overrides?.[s.key] ?? fallback;
            return (
              <StaggerItem key={s.key} className="text-center">
                <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                  <Counter value={value} suffix={s.suffix} />
                </p>
                <p className="text-primary-foreground/80 mt-2 text-sm">
                  {t(s.key)}
                </p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
