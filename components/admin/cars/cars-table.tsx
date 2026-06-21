"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Search } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { type Locale } from "@/config/site.config";
import { carName, formatPrice, primaryImage } from "@/lib/display";
import { adminKeys } from "@/lib/admin/query-keys";
import { listCars, toggleCarAvailability, deleteCar } from "@/server/admin";
import type { CarWithImages } from "@/server/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/admin/page-header";

export function CarsTable({
  initialCars,
  currency,
}: {
  initialCars: CarWithImages[];
  currency: string;
}) {
  const t = useTranslations("admin.cars");
  const tc = useTranslations("categories");
  const tCommon = useTranslations("admin.common");
  const locale = useLocale() as Locale;
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<CarWithImages | null>(null);

  const { data: cars = [] } = useQuery({
    queryKey: adminKeys.cars,
    queryFn: listCars,
    initialData: initialCars,
  });

  const toggle = useMutation({
    mutationFn: (vars: { id: string; is_available: boolean }) =>
      toggleCarAvailability(vars),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: adminKeys.cars });
      const prev = qc.getQueryData<CarWithImages[]>(adminKeys.cars);
      qc.setQueryData<CarWithImages[]>(adminKeys.cars, (old) =>
        (old ?? []).map((c) =>
          c.id === vars.id ? { ...c, is_available: vars.is_available } : c,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(adminKeys.cars, ctx.prev);
      toast.error(tCommon("error"));
    },
    onSuccess: (res) => {
      if (!res.ok) {
        qc.invalidateQueries({ queryKey: adminKeys.cars });
        toast.error(tCommon("error"));
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.cars }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCar(id),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(t("deleted"));
        qc.invalidateQueries({ queryKey: adminKeys.cars });
      } else {
        toast.error(tCommon("error"));
      }
      setToDelete(null);
    },
    onError: () => {
      toast.error(tCommon("error"));
      setToDelete(null);
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.name_ar ?? "").toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q),
    );
  }, [cars, search]);

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <Button asChild>
            <Link href="/admin/cars/new">
              <Plus className="size-4" />
              {t("new")}
            </Link>
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="ps-9"
        />
      </div>

      {cars.length === 0 ? (
        <EmptyState message={t("empty")} />
      ) : filtered.length === 0 ? (
        <EmptyState message={t("noResults")} />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3 text-start font-medium">
                  {t("colName")}
                </th>
                <th className="hidden px-4 py-3 text-start font-medium sm:table-cell">
                  {t("colCategory")}
                </th>
                <th className="hidden px-4 py-3 text-start font-medium md:table-cell">
                  {t("colPrice")}
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
              {filtered.map((car) => {
                const img = primaryImage(car.car_images);
                return (
                  <tr key={car.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md">
                          {img && (
                            <Image
                              src={img.url}
                              alt={carName(car, locale)}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {carName(car, locale)}
                          </div>
                          <div className="text-muted-foreground truncate text-xs">
                            {car.brand} {car.model} · {car.year}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {tc(car.category)}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {formatPrice(car.price_per_day, currency, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={car.is_available}
                          disabled={toggle.isPending}
                          onCheckedChange={(v) =>
                            toggle.mutate({ id: car.id, is_available: v })
                          }
                          aria-label={t("colStatus")}
                        />
                        <Badge
                          variant={car.is_available ? "secondary" : "outline"}
                        >
                          {car.is_available ? t("available") : t("unavailable")}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/admin/cars/${car.id}`}>
                            <Pencil className="size-4" />
                            <span className="sr-only">{tCommon("edit")}</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToDelete(car)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">{tCommon("delete")}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>{t("deleteConfirm")}</DialogDescription>
          </DialogHeader>
          {toDelete && (
            <p className="font-medium">{carName(toDelete, locale)}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => toDelete && remove.mutate(toDelete.id)}
            >
              {remove.isPending ? tCommon("deleting") : tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
      {message}
    </div>
  );
}
