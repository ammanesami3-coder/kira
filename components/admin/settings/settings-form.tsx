"use client";

import { useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import type { z } from "zod";

import {
  agencySettingsSchema,
  type AgencySettingsInput,
} from "@/lib/validations";

type SettingsFormValues = z.input<typeof agencySettingsSchema>;
import { updateAgencySettings } from "@/server/admin";
import { locales as ALL_LOCALES, type Locale } from "@/config/site.config";
import {
  arabicFontIds,
  defaultArabicFont,
  defaultLatinFont,
  fontLabels,
  isArabicFontId,
  isLatinFontId,
  latinFontIds,
} from "@/config/fonts.config";
import { allFontVariables, arabicFonts, latinFonts } from "@/lib/fonts";
import { parseReviews } from "@/lib/reviews";
import { BOOKING_EXTRAS, parseExtrasOverrides } from "@/lib/booking/extras";
import {
  DESIGN_SECTION_IDS,
  DESIGN_STAT_KEYS,
  parseDesign,
  type SiteDesign,
} from "@/lib/design";
import { uploadBrandingImage } from "@/lib/upload";
import { cn } from "@/lib/utils";
import type { AgencySettings } from "@/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Form shape for the design blob: nulls/"" mean "use the default". */
function designDefaults(d: SiteDesign): AgencySettingsInput["design"] {
  return {
    hero_image_url: d.heroImageUrl ?? "",
    logo_height_header: d.logoHeightHeader,
    logo_height_footer: d.logoHeightFooter,
    stats: { ...d.stats },
    sections: Object.fromEntries(
      DESIGN_SECTION_IDS.map((id) => [
        id,
        {
          heading: d.sections[id]?.heading ?? "",
          text: d.sections[id]?.text ?? "",
        },
      ]),
    ),
    // No form UI (set per-client in the DB); kept in form state so a
    // settings save round-trips the stored order instead of erasing it.
    home_section_order: d.homeSectionOrder,
  };
}

/** Form shape for the extras overrides: price null = "default price". */
function extrasDefaults(
  s: AgencySettings | null,
): AgencySettingsInput["booking_extras"] {
  const overrides = parseExtrasOverrides(s?.booking_extras);
  return {
    enabled: overrides.enabled,
    items: Object.fromEntries(
      BOOKING_EXTRAS.map(({ id }) => [
        id,
        {
          enabled: overrides.items[id].enabled,
          price: overrides.items[id].price,
        },
      ]),
    ) as AgencySettingsInput["booking_extras"]["items"],
  };
}

function defaults(s: AgencySettings | null): AgencySettingsInput {
  return {
    name: s?.name ?? "",
    name_ar: s?.name_ar ?? "",
    name_fr: s?.name_fr ?? "",
    logo_url: s?.logo_url ?? "",
    primary_color: s?.primary_color ?? "#0F3D3E",
    secondary_color: s?.secondary_color ?? "#C8A24B",
    font_latin: isLatinFontId(s?.font_latin) ? s.font_latin : defaultLatinFont,
    font_arabic: isArabicFontId(s?.font_arabic)
      ? s.font_arabic
      : defaultArabicFont,
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
    locales: s?.locales?.filter((l): l is Locale =>
      (ALL_LOCALES as readonly string[]).includes(l),
    ).length
      ? (s!.locales as Locale[])
      : [...ALL_LOCALES],
    seo_title: s?.seo_title ?? "",
    seo_description: s?.seo_description ?? "",
    og_image_url: s?.og_image_url ?? "",
    google_maps_link: s?.google_maps_link ?? "",
    reviews_elfsight_app_id: s?.reviews_elfsight_app_id ?? "",
    reviews: parseReviews(s?.reviews).map((r) => ({
      ...r,
      date: r.date ?? "",
    })),
    design: designDefaults(parseDesign(s?.design)),
    booking_extras: extrasDefaults(s),
  };
}

export function SettingsForm({
  settings,
}: {
  settings: AgencySettings | null;
}) {
  const t = useTranslations("admin.settings");
  const tCommon = useTranslations("admin.common");
  const tStats = useTranslations("stats");
  const tExtras = useTranslations("bookingExtras");
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

  const reviewsArray = useFieldArray({ control, name: "reviews" });

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
        <Controller
          control={control}
          name="primary_color"
          render={({ field }) => (
            <Field label={t("primaryColor")}>
              <ColorPicker value={field.value} onChange={field.onChange} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="secondary_color"
          render={({ field }) => (
            <Field label={t("secondaryColor")}>
              <ColorPicker value={field.value} onChange={field.onChange} />
            </Field>
          )}
        />
      </Section>

      {/* Typography — wrapped in allFontVariables so every whitelisted face
          can render its own preview (fonts download lazily, admin-only). */}
      <Section title={t("typography")} className={allFontVariables}>
        <Controller
          control={control}
          name="font_latin"
          render={({ field }) => (
            <Field label={t("fontLatin")} hint={t("fontHint")}>
              <FontSelect
                value={field.value ?? defaultLatinFont}
                onChange={field.onChange}
                ids={latinFontIds}
                cssVarOf={(id) => latinFonts[id].cssVar}
                previewText="The quick brown fox — 0123456789"
                previewDir="ltr"
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="font_arabic"
          render={({ field }) => (
            <Field label={t("fontArabic")} hint={t("fontHint")}>
              <FontSelect
                value={field.value ?? defaultArabicFont}
                onChange={field.onChange}
                ids={arabicFontIds}
                cssVarOf={(id) => arabicFonts[id].cssVar}
                previewText="سيارات فاخرة بأسعار ممتازة — ٠١٢٣٤٥٦٧٨٩"
                previewDir="rtl"
              />
            </Field>
          )}
        />
      </Section>

      {/* Site design — hero image, logo sizes, stats figures, section colors */}
      <Section title={t("design")}>
        <Controller
          control={control}
          name="design.hero_image_url"
          render={({ field }) => (
            <Field
              label={t("heroImage")}
              hint={t("heroImageHint")}
              className="sm:col-span-2"
            >
              <HeroImageInput
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            </Field>
          )}
        />

        <Field label={t("logoHeader")} hint={t("logoSizeHint")}>
          <Input
            type="number"
            dir="ltr"
            min={16}
            max={200}
            placeholder="88"
            {...register("design.logo_height_header", {
              setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
            })}
          />
        </Field>
        <Field label={t("logoFooter")} hint={t("logoSizeHint")}>
          <Input
            type="number"
            dir="ltr"
            min={16}
            max={200}
            placeholder="32"
            {...register("design.logo_height_footer", {
              setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
            })}
          />
        </Field>

        <div className="space-y-3 sm:col-span-2">
          <div className="space-y-1">
            <Label>{t("statsTitle")}</Label>
            <p className="text-muted-foreground text-xs">{t("statsHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DESIGN_STAT_KEYS.map((key) => (
              <Field key={key} label={tStats(key)}>
                <Input
                  type="number"
                  dir="ltr"
                  min={0}
                  placeholder={key === "cars" ? t("statsAuto") : undefined}
                  {...register(`design.stats.${key}`, {
                    setValueAs: (v) =>
                      v === "" || v == null ? null : Number(v),
                  })}
                />
              </Field>
            ))}
          </div>
        </div>

        <div className="space-y-3 sm:col-span-2">
          <div className="space-y-1">
            <Label>{t("sectionColors")}</Label>
            <p className="text-muted-foreground text-xs">
              {t("sectionColorsHint")}
            </p>
          </div>
          <div className="divide-y rounded-xl border">
            {DESIGN_SECTION_IDS.map((id) => (
              <div
                key={id}
                className="grid gap-3 p-3.5 sm:grid-cols-[minmax(8rem,1fr)_auto_auto] sm:items-center"
              >
                <span className="text-sm font-medium">
                  {t(`sections.${id}`)}
                </span>
                <Controller
                  control={control}
                  name={`design.sections.${id}.heading`}
                  render={({ field }) => (
                    <OptionalColorPicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      label={t("headingColor")}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`design.sections.${id}.text`}
                  render={({ field }) => (
                    <OptionalColorPicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      label={t("textColor")}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        </div>
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

      {/* Booking extras — show/hide + price of each "option supplémentaire" */}
      <Section title={t("extras")}>
        <div className="space-y-1 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="size-4"
              {...register("booking_extras.enabled")}
            />
            {t("extrasSectionEnabled")}
          </label>
          <p className="text-muted-foreground text-xs">{t("extrasHint")}</p>
        </div>

        <div className="divide-y rounded-xl border sm:col-span-2">
          {BOOKING_EXTRAS.map((extra) => (
            <div
              key={extra.id}
              className="grid gap-3 p-3.5 sm:grid-cols-[minmax(10rem,1fr)_auto_auto] sm:items-center"
            >
              <span className="text-sm font-medium">{tExtras(extra.id)}</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  {...register(`booking_extras.items.${extra.id}.enabled`)}
                />
                {t("extraVisible")}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  dir="ltr"
                  min={0}
                  step="any"
                  placeholder={String(extra.price)}
                  className="w-28"
                  {...register(`booking_extras.items.${extra.id}.price`, {
                    setValueAs: (v) =>
                      v === "" || v == null ? null : Number(v),
                  })}
                />
                <span className="text-muted-foreground text-xs">
                  {extra.pricing === "per_day"
                    ? tExtras("perDay")
                    : tExtras("perBooking")}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-xs sm:col-span-2">
          {t("extraPriceHint")}
        </p>
      </Section>

      {/* Google reviews — Maps link + curated showcase reviews */}
      <Section title={t("reviews")}>
        <Field
          label={t("googleMapsLink")}
          hint={t("googleMapsLinkHint")}
          className="sm:col-span-2"
        >
          <Input
            dir="ltr"
            placeholder="https://maps.app.goo.gl/…"
            {...register("google_maps_link")}
          />
        </Field>

        <Field
          label={t("reviewsWidget")}
          hint={t("reviewsWidgetHint")}
          className="sm:col-span-2"
        >
          <Input
            dir="ltr"
            placeholder="618e726b-427e-4e44-b9c9-edbd86ead43f"
            {...register("reviews_elfsight_app_id")}
          />
        </Field>

        <div className="space-y-3 sm:col-span-2">
          {reviewsArray.fields.length === 0 && (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              {t("reviewsEmpty")}
            </p>
          )}

          {reviewsArray.fields.map((field, index) => (
            <div key={field.id} className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <Controller
                  control={control}
                  name={`reviews.${index}.rating`}
                  render={({ field: rf }) => (
                    <RatingPicker
                      value={Number(rf.value) || 5}
                      onChange={rf.onChange}
                      label={t("reviewRating")}
                    />
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => reviewsArray.remove(index)}
                  className="text-muted-foreground hover:text-destructive gap-2"
                >
                  <Trash2 className="size-4" aria-hidden />
                  {t("removeReview")}
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("reviewAuthor")}>
                  <Input {...register(`reviews.${index}.author`)} />
                </Field>
                <Field label={t("reviewDate")}>
                  <Input
                    dir="ltr"
                    placeholder="2026-05"
                    {...register(`reviews.${index}.date`)}
                  />
                </Field>
              </div>
              <Field label={t("reviewQuote")}>
                <Textarea rows={2} {...register(`reviews.${index}.quote`)} />
              </Field>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={reviewsArray.fields.length >= 12}
            onClick={() =>
              reviewsArray.append({
                author: "",
                rating: 5,
                quote: "",
                date: "",
              })
            }
          >
            <Plus className="size-4" aria-hidden />
            {t("addReview")}
          </Button>
        </div>
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
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className={`grid gap-4 sm:grid-cols-2 ${className ?? ""}`}>
        {children}
      </CardContent>
    </Card>
  );
}

/** Round swatch (native picker) + hex input, kept in two-way sync. */
function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  // The native color input only accepts #rrggbb; expand #rgb and fall back
  // to black while the user is mid-edit in the hex field.
  const long = /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : /^#[0-9a-fA-F]{3}$/.test(value)
      ? `#${[...value.slice(1)].map((c) => c + c).join("")}`
      : "#000000";

  return (
    <div className="border-input focus-within:ring-ring/50 flex items-center gap-3 rounded-lg border p-1.5 ps-2 transition-shadow focus-within:ring-2">
      <label
        className="ring-border relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-full shadow-sm ring-1 ring-inset"
        style={{ backgroundColor: long }}
      >
        <input
          type="color"
          value={long}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        dir="ltr"
        value={value}
        maxLength={7}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        className="border-0 font-mono text-sm uppercase shadow-none focus-visible:ring-0"
      />
    </div>
  );
}

/** Expand #rgb → #rrggbb for the native color input; fallback while editing. */
function toLongHex(value: string, fallback = "#000000"): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${[...value.slice(1)].map((c) => c + c).join("")}`;
  }
  return fallback;
}

/**
 * Hero image control: URL field + one-click upload to Supabase Storage
 * (`car-images/branding/…`, owner-only writes) + live preview. Uploading
 * keeps the URL on the Supabase host, which next/image already allows.
 */
function HeroImageInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const t = useTranslations("admin.settings");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadBrandingImage(file);
      onChange(url);
    } catch {
      toast.error(t("uploadError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          dir="ltr"
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="shrink-0 gap-2"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
          {uploading ? t("uploading") : t("upload")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
      </div>
      {value && (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an arbitrary URL */}
          <img
            src={value}
            alt=""
            className="h-32 rounded-lg border object-cover"
          />
          <button
            type="button"
            aria-label={t("removeImage")}
            onClick={() => onChange("")}
            className="bg-background/90 text-muted-foreground hover:text-destructive absolute end-2 top-2 rounded-full border p-1 shadow-sm transition-colors"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Optional color: empty string = "theme default". Swatch opens the native
 * picker; the clear button reverts to the default.
 */
function OptionalColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const t = useTranslations("admin.settings");
  const isSet = value.length > 0;
  const long = toLongHex(value, "#888888");

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-16 shrink-0 text-xs">
        {label}
      </span>
      <label
        className={cn(
          "ring-border relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-full shadow-sm ring-1 ring-inset",
          !isSet && "border-muted-foreground/40 border border-dashed",
        )}
        style={isSet ? { backgroundColor: long } : undefined}
        title={label}
      >
        <input
          type="color"
          value={long}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        dir="ltr"
        value={value}
        maxLength={7}
        spellCheck={false}
        placeholder={t("colorAuto")}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-24 font-mono text-xs uppercase"
      />
      <button
        type="button"
        aria-label={t("resetColor")}
        onClick={() => onChange("")}
        className={cn(
          "text-muted-foreground hover:text-destructive rounded-md p-1 transition-colors",
          !isSet && "invisible",
        )}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

/** 1–5 star picker for curated reviews. */
function RatingPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label={label}
    >
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={`${v}/5`}
          onClick={() => onChange(v)}
          className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              "size-5",
              v <= value
                ? "fill-secondary text-secondary"
                : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** Font dropdown where each option + a sample line render in their face. */
function FontSelect<Id extends string>({
  value,
  onChange,
  ids,
  cssVarOf,
  previewText,
  previewDir,
}: {
  value: Id;
  onChange: (next: Id) => void;
  ids: readonly Id[];
  cssVarOf: (id: Id) => string;
  previewText: string;
  previewDir: "ltr" | "rtl";
}) {
  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={(v) => onChange(v as Id)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ids.map((id) => (
            <SelectItem key={id} value={id}>
              <span style={{ fontFamily: `var(${cssVarOf(id)})` }}>
                {fontLabels[id as keyof typeof fontLabels]}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p
        dir={previewDir}
        className="bg-muted/50 text-muted-foreground rounded-md px-3 py-2 text-sm"
        style={{ fontFamily: `var(${cssVarOf(value)})` }}
      >
        {previewText}
      </p>
    </div>
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
