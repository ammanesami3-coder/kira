"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO, addDays, subDays } from "date-fns";
import { ar as arLocale, fr as frLocale } from "date-fns/locale";
import type { DateRange as DayPickerRange, Matcher } from "react-day-picker";
import { Trash2, CalendarPlus } from "lucide-react";

import { type Locale } from "@/config/site.config";
import { carName } from "@/lib/display";
import { adminKeys } from "@/lib/admin/query-keys";
import { parseDateRange } from "@/lib/admin/date-range";
import {
  toggleCarAvailability,
  deleteBlockedPeriod,
  listBlockedPeriods,
} from "@/server/admin";
import { createBlockedPeriod } from "@/server/mutations";
import type { Booking, BlockedPeriod } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";

const dateFnsLocale = { ar: arLocale, fr: frLocale } as const;

interface CarInfo {
  id: string;
  name: string;
  name_ar: string | null;
  is_available: boolean;
}

export function AvailabilityClient({
  initialCars,
  initialBookings,
}: {
  initialCars: CarInfo[];
  initialBookings: Booking[];
}) {
  const t = useTranslations("admin.availability");
  const tCommon = useTranslations("admin.common");
  const locale = useLocale() as Locale;
  const dfLocale = dateFnsLocale[locale];
  const qc = useQueryClient();

  const [cars, setCars] = useState(initialCars);
  const [selectedId, setSelectedId] = useState(initialCars[0]?.id ?? null);
  const [range, setRange] = useState<DayPickerRange | undefined>();
  const [reason, setReason] = useState("");

  const selectedCar = cars.find((c) => c.id === selectedId) ?? null;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Confirmed bookings for the selected car (read-only "booked" dates).
  const confirmedForCar = useMemo(
    () =>
      initialBookings.filter(
        (b) => b.car_id === selectedId && b.status === "confirmed",
      ),
    [initialBookings, selectedId],
  );

  const blocksQuery = useQuery({
    queryKey: selectedId ? adminKeys.blocks(selectedId) : ["admin", "blocks"],
    queryFn: () => listBlockedPeriods(selectedId!),
    enabled: !!selectedId,
  });
  const parsedBlocks = useMemo(
    () =>
      (blocksQuery.data ?? [])
        .map((b) => ({ ...b, parsed: parseDateRange(b.period) }))
        .filter(
          (
            b,
          ): b is BlockedPeriod & {
            parsed: { start: string; end: string };
          } => b.parsed !== null,
        ),
    [blocksQuery.data],
  );

  // Disable past, confirmed bookings and existing blocks in the picker so a
  // new block can never overlap (the DB exclusion constraint is the final
  // guard and maps to a friendly "overlap" message).
  const disabledMatchers = useMemo<Matcher[]>(() => {
    const bookingMatchers: Matcher[] = confirmedForCar.map((b) => ({
      from: parseISO(b.start_date),
      to: subDays(parseISO(b.end_date), 1),
    }));
    const blockMatchers: Matcher[] = parsedBlocks.map((b) => ({
      from: parseISO(b.parsed.start),
      to: subDays(parseISO(b.parsed.end), 1),
    }));
    return [{ before: today }, ...bookingMatchers, ...blockMatchers];
  }, [confirmedForCar, parsedBlocks, today]);

  const toggle = useMutation({
    mutationFn: (vars: { id: string; is_available: boolean }) =>
      toggleCarAvailability(vars),
    onMutate: (vars) => {
      const prev = cars;
      setCars((cs) =>
        cs.map((c) =>
          c.id === vars.id ? { ...c, is_available: vars.is_available } : c,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) setCars(ctx.prev);
      toast.error(tCommon("error"));
    },
    onSuccess: (res, vars, ctx) => {
      if (res.ok) {
        toast.success(t("statusUpdated"));
        qc.invalidateQueries({ queryKey: adminKeys.cars });
      } else {
        if (ctx?.prev) setCars(ctx.prev);
        toast.error(tCommon("error"));
      }
    },
  });

  const addBlock = useMutation({
    mutationFn: (vars: {
      car_id: string;
      start_date: string;
      end_date: string;
      reason?: string;
    }) => createBlockedPeriod(vars),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(t("blockAdded"));
        setRange(undefined);
        setReason("");
        if (selectedId)
          qc.invalidateQueries({ queryKey: adminKeys.blocks(selectedId) });
      } else {
        toast.error(
          res.error === "OVERLAPPING_BLOCK" ? t("overlap") : tCommon("error"),
        );
      }
    },
    onError: () => toast.error(tCommon("error")),
  });

  const removeBlock = useMutation({
    mutationFn: (id: string) => deleteBlockedPeriod({ id }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(t("blockRemoved"));
        if (selectedId)
          qc.invalidateQueries({ queryKey: adminKeys.blocks(selectedId) });
      } else {
        toast.error(tCommon("error"));
      }
    },
    onError: () => toast.error(tCommon("error")),
  });

  function submitBlock() {
    if (!selectedId || !range?.from || !range?.to) {
      toast.error(t("selectRange"));
      return;
    }
    // Picked range is inclusive; store half-open [start, end) → end = to + 1.
    addBlock.mutate({
      car_id: selectedId,
      start_date: format(range.from, "yyyy-MM-dd"),
      end_date: format(addDays(range.to, 1), "yyyy-MM-dd"),
      reason: reason.trim() || undefined,
    });
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Cars list with availability toggle */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("carsList")}</CardTitle>
            <p className="text-muted-foreground text-xs">{t("toggleHint")}</p>
          </CardHeader>
          <CardContent className="space-y-1">
            {cars.map((car) => (
              <div
                key={car.id}
                className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 ${
                  car.id === selectedId ? "bg-accent" : "hover:bg-muted/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(car.id)}
                  className="min-w-0 flex-1 truncate text-start text-sm font-medium"
                >
                  {carName(car, locale)}
                </button>
                <Switch
                  checked={car.is_available}
                  disabled={toggle.isPending}
                  onCheckedChange={(v) =>
                    toggle.mutate({ id: car.id, is_available: v })
                  }
                  aria-label={t("available")}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Selected car: blocks + calendar + booked dates */}
        {!selectedCar ? (
          <div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
            {t("selectCar")}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                {carName(selectedCar, locale)}
              </h2>
              <Badge
                variant={selectedCar.is_available ? "secondary" : "outline"}
              >
                {selectedCar.is_available ? t("available") : t("unavailable")}
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("addBlock")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[auto_1fr]">
                <Calendar
                  mode="range"
                  locale={dfLocale}
                  selected={range}
                  onSelect={setRange}
                  disabled={disabledMatchers}
                  excludeDisabled
                  startMonth={today}
                  showOutsideDays={false}
                />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("blockReason")}</Label>
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t("blockReasonPlaceholder")}
                    />
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {t("from")}:{" "}
                    <span className="text-foreground font-medium">
                      {range?.from
                        ? format(range.from, "d MMM yyyy", { locale: dfLocale })
                        : "—"}
                    </span>
                    <br />
                    {t("to")}:{" "}
                    <span className="text-foreground font-medium">
                      {range?.to
                        ? format(range.to, "d MMM yyyy", { locale: dfLocale })
                        : "—"}
                    </span>
                  </div>
                  <Button
                    onClick={submitBlock}
                    disabled={addBlock.isPending || !range?.from || !range?.to}
                  >
                    <CalendarPlus className="size-4" />
                    {t("addBlock")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("blockedPeriods")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {parsedBlocks.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {t("noBlocks")}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {parsedBlocks.map((b) => (
                        <li
                          key={b.id}
                          className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <div dir="ltr" className="font-medium">
                              {b.parsed.start} ←{" "}
                              {format(
                                subDays(parseISO(b.parsed.end), 1),
                                "yyyy-MM-dd",
                              )}
                            </div>
                            {b.reason && (
                              <div className="text-muted-foreground truncate text-xs">
                                {b.reason}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={removeBlock.isPending}
                            onClick={() => removeBlock.mutate(b.id)}
                            aria-label={t("deleteBlock")}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("bookedDates")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {confirmedForCar.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      {t("noBooked")}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {confirmedForCar.map((b) => (
                        <li
                          key={b.id}
                          className="rounded-md border px-3 py-2 text-sm"
                        >
                          <div dir="ltr" className="font-medium">
                            {b.start_date} ←{" "}
                            {format(
                              subDays(parseISO(b.end_date), 1),
                              "yyyy-MM-dd",
                            )}
                          </div>
                          <div className="text-muted-foreground truncate text-xs">
                            {b.reference}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
