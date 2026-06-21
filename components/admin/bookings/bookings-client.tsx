"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Send, FileText, Loader2 } from "lucide-react";

import { type Locale } from "@/config/site.config";
import { carName, formatPrice } from "@/lib/display";
import { adminKeys } from "@/lib/admin/query-keys";
import {
  updateBookingStatus,
  retryBookingFulfillment,
} from "@/server/mutations";
import { listBookings } from "@/server/admin";
import type { Booking, BookingStatus } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadgeVariant } from "@/components/admin/bookings/status-badge";

const STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

interface CarInfo {
  id: string;
  name: string;
  name_ar: string | null;
}

export function BookingsClient({
  initialBookings,
  cars,
  currency,
}: {
  initialBookings: Booking[];
  cars: CarInfo[];
  currency: string;
}) {
  const t = useTranslations("admin.bookings");
  const tStatus = useTranslations("admin.status");
  const tCommon = useTranslations("admin.common");
  const locale = useLocale() as Locale;
  const qc = useQueryClient();

  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [selected, setSelected] = useState<Booking | null>(null);

  const { data: bookings = [] } = useQuery({
    queryKey: adminKeys.bookings,
    queryFn: listBookings,
    initialData: initialBookings,
  });

  const carMap = useMemo(() => new Map(cars.map((c) => [c.id, c])), [cars]);
  function nameFor(carId: string): string {
    const c = carMap.get(carId);
    return c ? carName(c, locale) : "—";
  }

  const filtered = useMemo(
    () =>
      filter === "all" ? bookings : bookings.filter((b) => b.status === filter),
    [bookings, filter],
  );

  const status = useMutation({
    mutationFn: (vars: { id: string; status: BookingStatus }) =>
      updateBookingStatus(vars),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: adminKeys.bookings });
      const prev = qc.getQueryData<Booking[]>(adminKeys.bookings);
      qc.setQueryData<Booking[]>(adminKeys.bookings, (old) =>
        (old ?? []).map((b) =>
          b.id === vars.id ? { ...b, status: vars.status } : b,
        ),
      );
      setSelected((s) =>
        s && s.id === vars.id ? { ...s, status: vars.status } : s,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(adminKeys.bookings, ctx.prev);
      toast.error(tCommon("error"));
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(t("statusUpdated"));
      } else {
        toast.error(
          res.error === "CONFLICTING_CONFIRMED_BOOKING"
            ? t("conflict")
            : tCommon("error"),
        );
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.bookings }),
  });

  const resend = useMutation({
    mutationFn: (id: string) => retryBookingFulfillment(id),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.data.whatsappSent ? t("resent") : t("resendPartial"));
        qc.invalidateQueries({ queryKey: adminKeys.bookings });
      } else {
        toast.error(tCommon("error"));
      }
    },
    onError: () => toast.error(tCommon("error")),
  });

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <div className="w-44">
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as BookingStatus | "all")}
            >
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon("all")}</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {tStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {bookings.length === 0 ? (
        <Empty message={t("empty")} />
      ) : filtered.length === 0 ? (
        <Empty message={t("noResults")} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3 text-start font-medium">
                  {t("colRef")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("colCustomer")}
                </th>
                <th className="hidden px-4 py-3 text-start font-medium md:table-cell">
                  {t("colCar")}
                </th>
                <th className="hidden px-4 py-3 text-start font-medium lg:table-cell">
                  {t("colDates")}
                </th>
                <th className="hidden px-4 py-3 text-start font-medium sm:table-cell">
                  {t("colTotal")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("colStatus")}
                </th>
                <th className="px-4 py-3 text-end font-medium">
                  {tCommon("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium" dir="ltr">
                    {b.reference}
                  </td>
                  <td className="px-4 py-3">{b.customer_name}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {nameFor(b.car_id)}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell" dir="ltr">
                    {b.start_date} ← {b.end_date}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {formatPrice(Number(b.total_price), currency, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={StatusBadgeVariant[b.status]}>
                      {tStatus(b.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelected(b)}
                    >
                      <Eye className="size-4" />
                      <span className="sr-only">{t("details")}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span dir="ltr">{selected.reference}</span>
                  <Badge variant={StatusBadgeVariant[selected.status]}>
                    {tStatus(selected.status)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{t("details")}</DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Detail label={t("customer")} value={selected.customer_name} />
                <Detail
                  label={t("phone")}
                  value={selected.customer_phone}
                  ltr
                />
                <Detail
                  label={t("email")}
                  value={selected.customer_email ?? "—"}
                  ltr
                />
                <Detail label="" value={nameFor(selected.car_id)} />
                <Detail
                  label={t("dates")}
                  value={`${selected.start_date} ← ${selected.end_date}`}
                  ltr
                />
                <Detail label={t("days")} value={String(selected.total_days)} />
                <Detail
                  label={t("pickup")}
                  value={selected.pickup_location ?? "—"}
                />
                <Detail
                  label={t("dropoff")}
                  value={selected.dropoff_location ?? "—"}
                />
                <Detail
                  label={t("total")}
                  value={formatPrice(
                    Number(selected.total_price),
                    currency,
                    locale,
                  )}
                />
                <Detail
                  label={t("whatsapp")}
                  value={selected.whatsapp_sent ? t("sent") : t("notSent")}
                />
                {selected.notes && (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground text-xs">
                      {t("notes")}
                    </dt>
                    <dd className="mt-0.5">{selected.notes}</dd>
                  </div>
                )}
              </dl>

              <div className="space-y-3 border-t pt-4">
                <div className="space-y-1.5">
                  <span className="text-muted-foreground text-xs">
                    {t("changeStatus")}
                  </span>
                  <Select
                    value={selected.status}
                    onValueChange={(v) =>
                      status.mutate({
                        id: selected.id,
                        status: v as BookingStatus,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {tStatus(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={resend.isPending}
                    onClick={() => resend.mutate(selected.id)}
                  >
                    {resend.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {resend.isPending ? t("resending") : t("resend")}
                  </Button>
                  {selected.pdf_url && (
                    <Button asChild variant="ghost">
                      <a
                        href={selected.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="size-4" />
                        {t("viewPdf")}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div>
      {label && <dt className="text-muted-foreground text-xs">{label}</dt>}
      <dd className="mt-0.5 break-words" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
      {message}
    </div>
  );
}
