"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format, parseISO, subDays } from "date-fns";
import { ar as arLocale, fr as frLocale } from "date-fns/locale";
import type { DateRange as DayPickerRange, Matcher } from "react-day-picker";

import { type Locale } from "@/config/site.config";
import type { DateRange } from "@/server/availability";
import { Calendar } from "@/components/ui/calendar";

const dateFnsLocale = { ar: arLocale, fr: frLocale } as const;

/**
 * Interactive range picker for the booking flow. Past days and every day of
 * the unavailable ranges (confirmed bookings + blocks, from the PII-free
 * view) are disabled, and `excludeDisabled` prevents a selection from
 * spanning a taken day — so the chosen range can never overlap a booking.
 *
 * Ranges are half-open [start, end): the picked drop-off day is the
 * exclusive `end`, matching the DB `period`. `min={2}` enforces at least one
 * rental day.
 */
export function BookingDateRange({
  ranges,
  value,
  onChange,
}: {
  ranges: DateRange[];
  value: DayPickerRange | undefined;
  onChange: (range: DayPickerRange | undefined) => void;
}) {
  const t = useTranslations("book");
  const locale = useLocale() as Locale;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const bookedMatchers = useMemo<Matcher[]>(
    () =>
      ranges.map((r) => ({
        from: parseISO(r.start_date),
        // Half-open [start, end): last taken day is end - 1.
        to: subDays(parseISO(r.end_date), 1),
      })),
    [ranges],
  );

  const disabled: Matcher[] = [{ before: today }, ...bookedMatchers];

  const dfLocale = dateFnsLocale[locale];

  return (
    <div className="space-y-3">
      <Calendar
        mode="range"
        locale={dfLocale}
        selected={value}
        onSelect={onChange}
        disabled={disabled}
        excludeDisabled
        min={2}
        modifiers={{ booked: bookedMatchers }}
        modifiersClassNames={{
          booked: "text-destructive line-through opacity-60",
        }}
        startMonth={today}
        showOutsideDays={false}
        className="w-full"
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <div className="flex gap-4">
          <span className="text-muted-foreground">
            {t("pickup")}:{" "}
            <span className="text-foreground font-medium">
              {value?.from
                ? format(value.from, "d MMM yyyy", { locale: dfLocale })
                : "—"}
            </span>
          </span>
          <span className="text-muted-foreground">
            {t("dropoff")}:{" "}
            <span className="text-foreground font-medium">
              {value?.to
                ? format(value.to, "d MMM yyyy", { locale: dfLocale })
                : "—"}
            </span>
          </span>
        </div>
        {(value?.from || value?.to) && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            {t("clearDates")}
          </button>
        )}
      </div>

      <p className="text-muted-foreground text-xs">{t("datesHint")}</p>
    </div>
  );
}
