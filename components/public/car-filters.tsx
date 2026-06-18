"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";
import {
  CATEGORIES,
  SEAT_OPTIONS,
  SORT_OPTIONS,
  TRANSMISSIONS,
} from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ANY = "any";

/**
 * Catalog filters & sort. Every control writes to the URL search params,
 * so the resulting view is shareable, bookmarkable and crawlable. Reading
 * state straight from the URL keeps this in sync with back/forward too.
 */
export function CarFilters() {
  const t = useTranslations();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /** Replace one param (null clears it) and navigate, preserving the rest. */
  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "" || value === ANY) next.delete(key);
    else next.set(key, value);
    const query = Object.fromEntries(next.entries());
    router.replace({ pathname, query }, { scroll: false });
  }

  function clearAll() {
    router.replace({ pathname }, { scroll: false });
    setOpen(false);
  }

  const category = params.get("category") ?? ANY;
  const transmission = params.get("transmission") ?? ANY;
  const seats = params.get("seats") ?? ANY;
  const sort = params.get("sort") ?? "newest";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";

  const activeCount = [
    "category",
    "transmission",
    "seats",
    "minPrice",
    "maxPrice",
  ].filter((k) => params.has(k)).length;

  const controls = (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="f-category">{t("catalog.category")}</Label>
        <Select value={category} onValueChange={(v) => setParam("category", v)}>
          <SelectTrigger id="f-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("catalog.any")}</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {t(`categories.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="f-transmission">{t("catalog.transmission")}</Label>
        <Select
          value={transmission}
          onValueChange={(v) => setParam("transmission", v)}
        >
          <SelectTrigger id="f-transmission" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("catalog.any")}</SelectItem>
            {TRANSMISSIONS.map((tr) => (
              <SelectItem key={tr} value={tr}>
                {t(`transmission.${tr}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="f-seats">{t("catalog.seats")}</Label>
        <Select value={seats} onValueChange={(v) => setParam("seats", v)}>
          <SelectTrigger id="f-seats" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t("catalog.any")}</SelectItem>
            {SEAT_OPTIONS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {t("catalog.seatsPlus", { count: s })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-sm font-medium">
          {t("catalog.priceRange")}
        </legend>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label={t("catalog.minPrice")}
            placeholder={t("catalog.minPrice")}
            defaultValue={minPrice}
            onBlur={(e) => setParam("minPrice", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                setParam("minPrice", e.currentTarget.value);
            }}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label={t("catalog.maxPrice")}
            placeholder={t("catalog.maxPrice")}
            defaultValue={maxPrice}
            onBlur={(e) => setParam("maxPrice", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                setParam("maxPrice", e.currentTarget.value);
            }}
          />
        </div>
      </fieldset>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-muted-foreground"
        >
          <X className="size-4" aria-hidden />
          {t("catalog.clear")}
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: a "Filters" button opening a dialog; sort stays inline */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="size-4" aria-hidden />
              {t("catalog.filters")}
              {activeCount > 0 && (
                <span className="bg-primary text-primary-foreground ms-1 inline-flex size-5 items-center justify-center rounded-full text-xs">
                  {activeCount}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("catalog.filters")}</DialogTitle>
            </DialogHeader>
            {controls}
          </DialogContent>
        </Dialog>

        <SortSelect value={sort} onChange={(v) => setParam("sort", v)} />
      </div>

      {/* Desktop: persistent sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" aria-hidden />
            <h2 className="font-semibold">{t("catalog.filters")}</h2>
          </div>
          {controls}
          <div className="border-t pt-5">
            <Label htmlFor="f-sort" className="mb-1.5 block">
              {t("catalog.sort")}
            </Label>
            <SortSelect
              id="f-sort"
              value={sort}
              onChange={(v) => setParam("sort", v)}
            />
          </div>
        </div>
      </aside>
    </>
  );
}

function SortSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        className="w-full min-w-40"
        aria-label={t("catalog.sort")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((s) => (
          <SelectItem key={s} value={s}>
            {t(`sort.${s}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
