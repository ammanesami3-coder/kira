"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { ar as arLocale, fr as frLocale } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Search } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { type Locale } from "@/config/site.config";
import { CATEGORIES } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const dateFnsLocale = { ar: arLocale, fr: frLocale } as const;
const ANY = "any";

/**
 * Hero quick-search: pick a category + date window, then jump to the
 * catalog with those as URL params (shareable & SEO-friendly). No booking
 * happens here — that is Phase 3.
 */
export function QuickSearch() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [category, setCategory] = useState<string>(ANY);
  const [range, setRange] = useState<DateRange | undefined>();
  const [open, setOpen] = useState(false);

  const fmt = (d: Date) =>
    format(d, "d MMM", { locale: dateFnsLocale[locale] });
  const iso = (d: Date) => format(d, "yyyy-MM-dd");

  const dateLabel =
    range?.from && range?.to
      ? `${fmt(range.from)} – ${fmt(range.to)}`
      : t("quickSearch.selectDates");

  function onSubmit() {
    const query: Record<string, string> = {};
    if (category !== ANY) query.category = category;
    if (range?.from && range?.to) {
      query.from = iso(range.from);
      query.to = iso(range.to);
    }
    router.push({ pathname: "/cars", query });
  }

  return (
    <div className="bg-card/95 supports-[backdrop-filter]:bg-card/80 rounded-2xl border p-4 shadow-lg backdrop-blur sm:p-5">
      <p className="mb-3 text-sm font-semibold">{t("quickSearch.title")}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="qs-category" className="text-xs">
            {t("quickSearch.category")}
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="qs-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>
                {t("quickSearch.anyCategory")}
              </SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`categories.${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("quickSearch.dates")}</Label>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start font-normal"
              >
                <CalendarDays className="size-4" aria-hidden />
                <span className="truncate">{dateLabel}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-fit max-w-[calc(100%-2rem)]">
              <DialogHeader>
                <DialogTitle>{t("quickSearch.dates")}</DialogTitle>
              </DialogHeader>
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={1}
                disabled={{ before: new Date() }}
                autoFocus
                className="mx-auto"
              />
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>
                  {t("common.confirm")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-end">
          <Button onClick={onSubmit} className="w-full lg:w-auto" size="lg">
            <Search className="size-4" aria-hidden />
            {t("quickSearch.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
