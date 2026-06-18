"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { parseISO, subDays } from "date-fns";
import { ar as arLocale, fr as frLocale } from "date-fns/locale";
import type { Matcher } from "react-day-picker";

import { type Locale } from "@/config/site.config";
import type { DateRange } from "@/server/availability";
import { Calendar } from "@/components/ui/calendar";

const dateFnsLocale = { ar: arLocale, fr: frLocale } as const;

/**
 * Read-only availability calendar. Confirmed bookings + blocked periods
 * (from the PII-free `car_unavailable_ranges` view) and past dates are
 * disabled and visually marked as taken. Ranges are half-open [start, end)
 * — `end` is the exclusive drop-off day, so the last unavailable day is
 * `end - 1`.
 */
export function AvailabilityCalendar({ ranges }: { ranges: DateRange[] }) {
  const t = useTranslations("car");
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
        to: subDays(parseISO(r.end_date), 1),
      })),
    [ranges],
  );

  const disabled: Matcher[] = [{ before: today }, ...bookedMatchers];

  return (
    <div className="space-y-4">
      <Calendar
        locale={dateFnsLocale[locale]}
        disabled={disabled}
        modifiers={{ booked: bookedMatchers }}
        modifiersClassNames={{
          booked: "text-destructive line-through opacity-60",
        }}
        startMonth={today}
        showOutsideDays={false}
        className="w-full"
      />

      <ul className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
        <li className="flex items-center gap-2">
          <span
            className="border-border size-3 rounded-sm border"
            aria-hidden
          />
          {t("legendAvailable")}
        </li>
        <li className="flex items-center gap-2">
          <span
            className="bg-destructive/20 border-destructive/40 size-3 rounded-sm border"
            aria-hidden
          />
          {t("legendUnavailable")}
        </li>
      </ul>

      <p className="text-muted-foreground text-xs">{t("availabilityHint")}</p>
    </div>
  );
}
