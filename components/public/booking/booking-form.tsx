"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { AlertCircle, ArrowLeft, ArrowRight, ImageOff } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { siteConfig, type Locale } from "@/config/site.config";
import { formatPrice } from "@/lib/display";
import {
  BOOKING_EXTRAS,
  extraPrice,
  extrasTotal,
  type ExtraId,
} from "@/lib/booking/extras";
import {
  bookingInputSchema,
  type BookingInput,
  type BookingFormValues,
} from "@/lib/validations";
import { createBooking, type BookingConfirmation } from "@/server/mutations";
import type { DateRange } from "@/server/availability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingDateRange } from "./booking-date-range";
import { BookingConfirmationView } from "./booking-confirmation";
import type { BookingCar } from "./types";

/** Server error codes that map to a friendly translated message. */
const KNOWN_ERRORS = new Set([
  "DATES_UNAVAILABLE",
  "CAR_NOT_AVAILABLE",
  "RATE_LIMITED",
  "INVALID_INPUT",
  "CAPTCHA_FAILED",
  "DB_ERROR",
]);

export function BookingForm({
  car,
  ranges,
}: {
  car: BookingCar;
  ranges: DateRange[];
}) {
  const t = useTranslations("book");
  const tExtras = useTranslations("bookingExtras");
  const tCat = useTranslations("categories");
  const locale = useLocale() as Locale;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const [range, setRange] = useState<DayPickerRange | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues, unknown, BookingInput>({
    resolver: zodResolver(bookingInputSchema),
    defaultValues: {
      car_id: car.id,
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      start_date: "",
      end_date: "",
      pickup_location: "",
      dropoff_location: "",
      note: "",
      extras: [],
      company: "",
    },
  });

  // Live price inputs.
  const startDate = useWatch({ control, name: "start_date" });
  const endDate = useWatch({ control, name: "end_date" });
  const extras = useWatch({ control, name: "extras" }) ?? [];

  const totalDays =
    startDate && endDate
      ? differenceInCalendarDays(parseISO(endDate), parseISO(startDate))
      : 0;
  const basePrice = totalDays * car.pricePerDay;
  const extrasSum = extrasTotal(extras as ExtraId[], totalDays);
  const totalPrice = basePrice + extrasSum;

  /** Sync the calendar selection into the validated form fields. */
  const onRangeChange = (next: DayPickerRange | undefined) => {
    setRange(next);
    setValue("start_date", next?.from ? format(next.from, "yyyy-MM-dd") : "", {
      shouldValidate: true,
    });
    setValue("end_date", next?.to ? format(next.to, "yyyy-MM-dd") : "", {
      shouldValidate: true,
    });
    if (serverError === "DATES_UNAVAILABLE") setServerError(null);
  };

  const onSubmit = async (values: BookingInput) => {
    setServerError(null);
    const res = await createBooking(values);
    if (res.ok) {
      setConfirmation(res.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setServerError(res.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (confirmation) {
    return (
      <BookingConfirmationView
        confirmation={confirmation}
        car={car}
        customerName={getValues("customer_name")}
        pickup={getValues("pickup_location")}
        dropoff={getValues("dropoff_location") || null}
      />
    );
  }

  const datesError = errors.start_date || errors.end_date;
  const serverErrorMsg =
    serverError &&
    (KNOWN_ERRORS.has(serverError)
      ? t(`errors.${serverError}`)
      : t("errors.generic"));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ms-2 mb-6">
        <Link
          href={`/cars/${car.slug}`}
          className="text-muted-foreground gap-2"
        >
          <Arrow className="size-4 rotate-180" aria-hidden />
          {t("back")}
        </Link>
      </Button>

      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title", { name: car.name })}
        </h1>
        <p className="text-muted-foreground text-pretty">{t("subtitle")}</p>
      </header>

      {serverErrorMsg && (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{t("errors.title")}</p>
            <p>{serverErrorMsg}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid gap-8 lg:grid-cols-[1fr_22rem]"
      >
        {/* ── Left: dates + guest details ─────────────────────────── */}
        <div className="space-y-8">
          <section aria-labelledby="dates-heading" className="space-y-3">
            <h2 id="dates-heading" className="text-lg font-semibold">
              {t("dates")}
            </h2>
            <BookingDateRange
              ranges={ranges}
              value={range}
              onChange={onRangeChange}
            />
            {datesError && (
              <p className="text-destructive text-sm" role="alert">
                {t("validation.datesRequired")}
              </p>
            )}
          </section>

          <section aria-labelledby="details-heading" className="space-y-4">
            <h2 id="details-heading" className="text-lg font-semibold">
              {t("form.heading")}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="customer_name"
                label={t("form.name")}
                error={errors.customer_name && t("validation.nameMin")}
              >
                <Input
                  id="customer_name"
                  autoComplete="name"
                  placeholder={t("form.namePlaceholder")}
                  aria-invalid={!!errors.customer_name}
                  {...register("customer_name")}
                />
              </Field>

              <Field
                id="customer_phone"
                label={t("form.phone")}
                error={errors.customer_phone && t("validation.phoneInvalid")}
              >
                <Input
                  id="customer_phone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  autoComplete="tel"
                  placeholder={t("form.phonePlaceholder")}
                  aria-invalid={!!errors.customer_phone}
                  {...register("customer_phone")}
                />
              </Field>

              <Field
                id="customer_email"
                label={t("form.email")}
                hint={t("form.optional")}
                error={errors.customer_email && t("validation.emailInvalid")}
              >
                <Input
                  id="customer_email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder={t("form.emailPlaceholder")}
                  aria-invalid={!!errors.customer_email}
                  {...register("customer_email")}
                />
              </Field>

              <Field
                id="pickup_location"
                label={t("form.pickupLocation")}
                error={errors.pickup_location && t("validation.pickupRequired")}
              >
                <Input
                  id="pickup_location"
                  autoComplete="off"
                  placeholder={t("form.pickupLocationPlaceholder")}
                  aria-invalid={!!errors.pickup_location}
                  {...register("pickup_location")}
                />
              </Field>

              <Field
                id="dropoff_location"
                label={t("form.dropoffLocation")}
                hint={t("form.optional")}
                className="sm:col-span-2"
              >
                <Input
                  id="dropoff_location"
                  autoComplete="off"
                  placeholder={t("form.dropoffLocationPlaceholder")}
                  {...register("dropoff_location")}
                />
              </Field>

              <Field
                id="note"
                label={t("form.note")}
                hint={t("form.optional")}
                className="sm:col-span-2"
              >
                <textarea
                  id="note"
                  rows={3}
                  placeholder={t("form.notePlaceholder")}
                  className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:text-sm"
                  {...register("note")}
                />
              </Field>
            </div>

            {/* Honeypot — visually hidden, off-screen, not announced. Bots
                fill it; the server rejects any non-empty value. */}
            <div aria-hidden className="sr-only">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register("company")}
              />
            </div>
          </section>

          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold">
              {t("form.extras")}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {BOOKING_EXTRAS.map((extra) => (
                <label
                  key={extra.id}
                  className="border-input hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
                >
                  <input
                    type="checkbox"
                    value={extra.id}
                    className="accent-primary mt-0.5 size-4"
                    {...register("extras")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {tExtras(extra.id)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatPrice(extra.price, siteConfig.currency, locale)}
                      {extra.pricing === "per_day"
                        ? ` ${tExtras("perDay")}`
                        : ` ${tExtras("perBooking")}`}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* ── Right: summary + price + submit (sticky) ─────────────── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card space-y-5 rounded-xl border p-5">
            <div className="flex gap-3">
              <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg">
                {car.image ? (
                  <Image
                    src={car.image.url}
                    alt={car.image.alt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center">
                    <ImageOff className="size-6" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <Badge variant="secondary" className="mb-1">
                  {tCat(car.category)}
                </Badge>
                <p className="truncate font-semibold">{car.name}</p>
                <p className="text-muted-foreground text-sm">
                  {car.model} · {car.year}
                </p>
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <h2 className="mb-3 font-semibold">{t("price.title")}</h2>
              {totalDays > 0 ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">
                      {t("price.base")}
                      <span className="block text-xs">
                        {t("price.perDayLine", {
                          price: formatPrice(
                            car.pricePerDay,
                            siteConfig.currency,
                            locale,
                          ),
                          days: t("price.days", { count: totalDays }),
                        })}
                      </span>
                    </dt>
                    <dd className="font-medium">
                      {formatPrice(basePrice, siteConfig.currency, locale)}
                    </dd>
                  </div>

                  {(extras as ExtraId[]).length > 0 &&
                    BOOKING_EXTRAS.filter((e) =>
                      (extras as ExtraId[]).includes(e.id),
                    ).map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <dt className="text-muted-foreground">
                          {tExtras(e.id)}
                        </dt>
                        <dd className="font-medium">
                          {formatPrice(
                            extraPrice(e.id, totalDays),
                            siteConfig.currency,
                            locale,
                          )}
                        </dd>
                      </div>
                    ))}

                  <div className="flex items-center justify-between gap-3 border-t pt-2">
                    <dt className="font-semibold">{t("price.total")}</dt>
                    <dd className="text-lg font-bold">
                      {formatPrice(totalPrice, siteConfig.currency, locale)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("price.selectDatesFirst")}
                </p>
              )}
            </div>

            <p className="text-muted-foreground text-xs">
              {t("deposit")}:{" "}
              {formatPrice(car.deposit, siteConfig.currency, locale)}
            </p>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => {
                // Surface date errors even before a field is touched.
                if (!getValues("start_date") || !getValues("end_date")) {
                  void trigger(["start_date", "end_date"]);
                }
              }}
            >
              {isSubmitting ? t("form.submitting") : t("form.submit")}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}

/** Small labelled field wrapper with optional hint + error message. */
function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | false;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="text-destructive mt-1.5 text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
