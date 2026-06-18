import { getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { getAvailableCars } from "@/server/queries";
import { isCarAvailable } from "@/server/availability";
import {
  applyFilters,
  parseFilters,
  type RawSearchParams,
} from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { CarCard } from "@/components/public/car-card";

/**
 * Async results region for the catalog — rendered inside <Suspense> so the
 * filters/header paint instantly while the (possibly availability-checked)
 * list streams in.
 */
export async function CarResults({
  searchParams,
  locale,
}: {
  searchParams: RawSearchParams;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "catalog" });
  const filters = parseFilters(searchParams);

  const all = await getAvailableCars();
  let cars = applyFilters(all, filters);

  // When a date window is given, keep only cars free for that range.
  // Small fleet → a handful of parallel boolean RPCs is fine.
  if (filters.from && filters.to) {
    const { from, to } = filters;
    const flags = await Promise.all(
      cars.map((c) => isCarAvailable(c.id, from, to)),
    );
    cars = cars.filter((_, i) => flags[i]);
  }

  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-20 text-center">
        <SearchX className="text-muted-foreground size-10" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold">{t("empty.title")}</h2>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {t("empty.desc")}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/cars">{t("empty.action")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted-foreground mb-6 text-sm" aria-live="polite">
        {t("results", { count: cars.length })}
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((car, i) => (
          <CarCard key={car.id} car={car} priority={i < 3} />
        ))}
      </div>
    </div>
  );
}
