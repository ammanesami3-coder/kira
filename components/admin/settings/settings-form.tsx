"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { z } from "zod";

import {
  agencySettingsSchema,
  type AgencySettingsInput,
} from "@/lib/validations";

type SettingsFormValues = z.input<typeof agencySettingsSchema>;
import { updateAgencySettings } from "@/server/admin";
import { locales as ALL_LOCALES } from "@/config/site.config";
import type { AgencySettings } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function defaults(s: AgencySettings | null): AgencySettingsInput {
  return {
    name: s?.name ?? "",
    name_ar: s?.name_ar ?? "",
    name_fr: s?.name_fr ?? "",
    logo_url: s?.logo_url ?? "",
    primary_color: s?.primary_color ?? "#0F3D3E",
    secondary_color: s?.secondary_color ?? "#C8A24B",
    phone: s?.phone ?? "",
    whatsapp_number: s?.whatsapp_number ?? "",
    email: s?.email ?? "",
    address: s?.address ?? "",
    address_ar: s?.address_ar ?? "",
    lat: s?.lat ?? null,
    lng: s?.lng ?? null,
    currency: s?.currency ?? "MAD",
    opening_hours: asRecord(s?.opening_hours),
    social_links: (s?.social_links as Record<string, string>) ?? {},
    locales: s?.locales?.filter(
      (l): l is "ar" | "fr" => l === "ar" || l === "fr",
    ).length
      ? (s!.locales as ("ar" | "fr")[])
      : ["ar", "fr"],
    seo_title: s?.seo_title ?? "",
    seo_description: s?.seo_description ?? "",
    og_image_url: s?.og_image_url ?? "",
  };
}

export function SettingsForm({
  settings,
}: {
  settings: AgencySettings | null;
}) {
  const t = useTranslations("admin.settings");
  const tCommon = useTranslations("admin.common");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<SettingsFormValues, unknown, AgencySettingsInput>({
    resolver: zodResolver(agencySettingsSchema),
    defaultValues: defaults(settings) as SettingsFormValues,
  });

  const [hoursText, setHoursText] = useState(
    JSON.stringify(asRecord(settings?.opening_hours), null, 2),
  );
  const [hoursError, setHoursError] = useState(false);

  async function onSubmit(values: AgencySettingsInput) {
    let openingHours: Record<string, unknown> = {};
    if (hoursText.trim()) {
      try {
        openingHours = JSON.parse(hoursText);
        setHoursError(false);
      } catch {
        setHoursError(true);
        toast.error(t("saveError"));
        return;
      }
    }

    const result = await updateAgencySettings({
      ...values,
      opening_hours: openingHours,
    });

    if (!result.ok) {
      toast.error(t("saveError"));
      return;
    }
    toast.success(t("saved"));
    router.refresh();
  }

  const lat = register("lat", {
    setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
  });
  const lng = register("lng", {
    setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tCommon("saving") : tCommon("save")}
          </Button>
        }
      />

      {/* Identity */}
      <Section title={t("identity")}>
        <Field label={t("name")}>
          <Input {...register("name")} />
        </Field>
        <Field label={t("nameAr")}>
          <Input dir="rtl" {...register("name_ar")} />
        </Field>
        <Field label={t("nameFr")}>
          <Input dir="ltr" {...register("name_fr")} />
        </Field>
      </Section>

      {/* Branding */}
      <Section title={t("branding")}>
        <Field label={t("logoUrl")} className="sm:col-span-2">
          <Input dir="ltr" placeholder="https://…" {...register("logo_url")} />
        </Field>
        <Field label={t("primaryColor")}>
          <input
            type="color"
            {...register("primary_color")}
            className="h-9 w-16 cursor-pointer rounded-md border bg-transparent p-1"
          />
        </Field>
        <Field label={t("secondaryColor")}>
          <input
            type="color"
            {...register("secondary_color")}
            className="h-9 w-16 cursor-pointer rounded-md border bg-transparent p-1"
          />
        </Field>
      </Section>

      {/* Contact */}
      <Section title={t("contact")}>
        <Field label={t("phone")}>
          <Input dir="ltr" {...register("phone")} />
        </Field>
        <Field label={t("whatsappNumber")}>
          <Input
            dir="ltr"
            placeholder="2126…"
            {...register("whatsapp_number")}
          />
        </Field>
        <Field label={t("email")}>
          <Input dir="ltr" type="email" {...register("email")} />
        </Field>
        <Field label={t("address")}>
          <Input {...register("address")} />
        </Field>
        <Field label={t("addressAr")}>
          <Input dir="rtl" {...register("address_ar")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lat">
            <Input type="number" step="any" dir="ltr" {...lat} />
          </Field>
          <Field label="Lng">
            <Input type="number" step="any" dir="ltr" {...lng} />
          </Field>
        </div>
      </Section>

      {/* Localization */}
      <Section title={t("localization")}>
        <Field label={t("currency")}>
          <Input dir="ltr" maxLength={3} {...register("currency")} />
        </Field>
        <Field label={t("locales")} className="sm:col-span-2">
          <Controller
            control={control}
            name="locales"
            render={({ field }) => {
              const current = field.value ?? [];
              return (
                <div className="flex gap-4 pt-2">
                  {ALL_LOCALES.map((loc) => {
                    const checked = current.includes(loc);
                    return (
                      <label
                        key={loc}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...current, loc]
                              : current.filter((l) => l !== loc);
                            field.onChange(next.length ? next : current);
                          }}
                        />
                        {loc.toUpperCase()}
                      </label>
                    );
                  })}
                </div>
              );
            }}
          />
        </Field>
      </Section>

      {/* Hours */}
      <Section title={t("hours")}>
        <Field
          label={t("openingHours")}
          hint={t("hoursHint")}
          error={hoursError ? t("saveError") : undefined}
          className="sm:col-span-2"
        >
          <Textarea
            dir="ltr"
            rows={5}
            value={hoursText}
            onChange={(e) => setHoursText(e.target.value)}
            className="font-mono text-xs"
          />
        </Field>
      </Section>

      {/* SEO */}
      <Section title={t("seo")}>
        <Field label={t("seoTitle")} className="sm:col-span-2">
          <Input {...register("seo_title")} />
        </Field>
        <Field label={t("seoDescription")} className="sm:col-span-2">
          <Textarea rows={2} {...register("seo_description")} />
        </Field>
        <Field label={t("ogImage")} className="sm:col-span-2">
          <Input
            dir="ltr"
            placeholder="https://…"
            {...register("og_image_url")}
          />
        </Field>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {children}
      </CardContent>
    </Card>
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
