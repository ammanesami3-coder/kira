"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Wand2 } from "lucide-react";

import { Link, useRouter } from "@/i18n/navigation";
import type { z } from "zod";

import { CATEGORIES, TRANSMISSIONS } from "@/lib/catalog";
import { carSchema, type CarInput } from "@/lib/validations";

type CarFormValues = z.input<typeof carSchema>;
import { adminKeys } from "@/lib/admin/query-keys";
import { createCar, updateCar } from "@/server/admin";
import type { Car } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function defaults(car: Car | null): CarInput {
  return {
    slug: car?.slug ?? "",
    name: car?.name ?? "",
    name_ar: car?.name_ar ?? "",
    brand: car?.brand ?? "",
    model: car?.model ?? "",
    year: car?.year ?? new Date().getFullYear(),
    category: car?.category ?? "economy",
    transmission: car?.transmission ?? "manual",
    fuel_type: car?.fuel_type ?? "",
    seats: car?.seats ?? 5,
    doors: car?.doors ?? 4,
    price_per_day: car?.price_per_day ?? 0,
    price_per_week: car?.price_per_week ?? null,
    deposit: car?.deposit ?? 0,
    features: car?.features ?? [],
    description: car?.description ?? "",
    description_ar: car?.description_ar ?? "",
    description_fr: car?.description_fr ?? "",
    is_available: car?.is_available ?? true,
    sort_order: car?.sort_order ?? 0,
  };
}

export function CarForm({ car }: { car: Car | null }) {
  const t = useTranslations("admin.carForm");
  const tCars = useTranslations("admin.cars");
  const tCommon = useTranslations("admin.common");
  const tCat = useTranslations("categories");
  const tTrans = useTranslations("transmission");
  const router = useRouter();
  const qc = useQueryClient();

  const isEdit = !!car;
  const [featuresText, setFeaturesText] = useState(
    (car?.features ?? []).join(", "),
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CarFormValues, unknown, CarInput>({
    resolver: zodResolver(carSchema),
    defaultValues: defaults(car) as CarFormValues,
  });

  async function onSubmit(values: CarInput) {
    const features = featuresText
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    const payload = { ...values, features };

    const result = isEdit
      ? await updateCar({ ...payload, id: car!.id })
      : await createCar(payload);

    if (!result.ok) {
      toast.error(
        result.error === "SLUG_TAKEN" ? tCars("slugTaken") : tCars("saveError"),
      );
      return;
    }

    qc.invalidateQueries({ queryKey: adminKeys.cars });
    toast.success(isEdit ? tCars("updated") : tCars("created"));

    if (isEdit) {
      router.refresh();
    } else {
      // Go to the edit page of the new car so images can be added.
      router.push(`/admin/cars/${result.data.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <PageHeader
        title={isEdit ? tCars("edit") : tCars("create")}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/cars">
              <ArrowLeft className="size-4" />
              {tCommon("back")}
            </Link>
          </Button>
        }
      />

      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("basics")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label={t("name")} error={errors.name?.message}>
            <Input {...register("name")} aria-invalid={!!errors.name} />
          </Field>
          <Field label={t("nameAr")}>
            <Input dir="rtl" {...register("name_ar")} />
          </Field>
          <Field
            label={t("slug")}
            error={errors.slug?.message}
            hint={t("slugHint")}
            className="sm:col-span-2"
          >
            <div className="flex gap-2">
              <Input
                dir="ltr"
                {...register("slug")}
                aria-invalid={!!errors.slug}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setValue("slug", slugify(getValues("name")), {
                    shouldValidate: true,
                  })
                }
              >
                <Wand2 className="size-4" />
                {t("generate")}
              </Button>
            </div>
          </Field>
          <Field label={t("brand")} error={errors.brand?.message}>
            <Input {...register("brand")} aria-invalid={!!errors.brand} />
          </Field>
          <Field label={t("model")} error={errors.model?.message}>
            <Input {...register("model")} aria-invalid={!!errors.model} />
          </Field>
        </CardContent>
      </Card>

      {/* Specs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("specs")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("year")} error={errors.year?.message}>
            <Input type="number" {...register("year")} />
          </Field>
          <Field label={t("category")}>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {tCat(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label={t("transmission")}>
            <Controller
              control={control}
              name="transmission"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSMISSIONS.map((tr) => (
                      <SelectItem key={tr} value={tr}>
                        {tTrans(tr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label={t("fuelType")} error={errors.fuel_type?.message}>
            <Input
              {...register("fuel_type")}
              aria-invalid={!!errors.fuel_type}
            />
          </Field>
          <Field label={t("seats")} error={errors.seats?.message}>
            <Input type="number" {...register("seats")} />
          </Field>
          <Field label={t("doors")} error={errors.doors?.message}>
            <Input type="number" {...register("doors")} />
          </Field>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pricing")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label={t("pricePerDay")} error={errors.price_per_day?.message}>
            <Input type="number" step="0.01" {...register("price_per_day")} />
          </Field>
          <Field label={t("pricePerWeek")}>
            <Input
              type="number"
              step="0.01"
              {...register("price_per_week", {
                setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
              })}
            />
          </Field>
          <Field label={t("deposit")}>
            <Input type="number" step="0.01" {...register("deposit")} />
          </Field>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("content")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label={t("features")} hint={t("featuresHint")}>
            <Input
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="climatisation, bluetooth, gps"
            />
          </Field>
          <Field label={t("description")}>
            <Textarea {...register("description")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("descriptionAr")}>
              <Textarea dir="rtl" {...register("description_ar")} />
            </Field>
            <Field label={t("descriptionFr")}>
              <Textarea dir="ltr" {...register("description_fr")} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("sortOrder")}>
              <Input type="number" {...register("sort_order")} />
            </Field>
            <div className="flex items-center gap-3 pt-7">
              <Controller
                control={control}
                name="is_available"
                render={({ field }) => (
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                    id="is_available"
                  />
                )}
              />
              <Label htmlFor="is_available">{t("isAvailable")}</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="outline" type="button">
          <Link href="/admin/cars">{tCommon("cancel")}</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-muted-foreground text-xs">{hint}</p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
