import "server-only";

import { format, parseISO } from "date-fns";
import { ar as arLocale, fr as frLocale } from "date-fns/locale";
import { renderToBuffer } from "@react-pdf/renderer";

import {
  BookingPdf,
  type BookingPdfData,
  type PdfLocale,
  type PdfLogo,
} from "@/components/pdf/booking-pdf";
import { siteConfig } from "@/config/site.config";
import { extraPrice, extrasTotal, type ExtraId } from "@/lib/booking/extras";

/**
 * Booking PDF generation with @react-pdf/renderer (pure JS, Vercel-safe — no
 * Chromium). This module does all the I/O and formatting, then renders the
 * `BookingPdf` template to a Buffer ready to upload to Supabase Storage.
 */

const dfLocale = { ar: arLocale, fr: frLocale } as const;

/** Extra labels mirrored from the i18n catalog (server has no request ctx). */
const EXTRA_LABELS: Record<PdfLocale, Record<ExtraId, string>> = {
  ar: {
    full_insurance: "تأمين شامل",
    additional_driver: "سائق إضافي",
    gps: "نظام ملاحة GPS",
    child_seat: "مقعد أطفال",
  },
  fr: {
    full_insurance: "Assurance tous risques",
    additional_driver: "Conducteur additionnel",
    gps: "GPS",
    child_seat: "Siège bébé",
  },
};

const localeTag: Record<PdfLocale, string> = { ar: "ar-MA", fr: "fr-MA" };

function money(amount: number, currency: string, locale: PdfLocale): string {
  return new Intl.NumberFormat(localeTag[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(iso: string, locale: PdfLocale): string {
  return format(parseISO(iso), "d MMMM yyyy", { locale: dfLocale[locale] });
}

/** Subset of `agency_settings` the PDF needs (nullable singleton). */
export interface PdfAgency {
  name: string | null;
  name_ar: string | null;
  name_fr: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  address: string | null;
  address_ar: string | null;
  currency: string | null;
}

export interface GenerateBookingPdfInput {
  /** PDF language. Defaults to the deployment's default locale. */
  locale?: PdfLocale;
  agency: PdfAgency | null;
  car: {
    name: string;
    name_ar: string | null;
    brand: string;
    model: string;
    year: number;
    price_per_day: number;
    deposit: number;
  };
  booking: {
    reference: string;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    start_date: string;
    end_date: string;
    total_days: number;
    pickup_location: string | null;
    dropoff_location: string | null;
    total_price: number;
    notes: string | null;
    extras: readonly ExtraId[];
  };
}

/** Fetch the agency logo and decode it to a raster buffer @react-pdf accepts.
 * Returns null on any failure (missing/unsupported/slow) — the PDF still
 * renders without a logo rather than failing the whole booking. */
async function loadLogo(url: string | null): Promise<PdfLogo | null> {
  if (!url) return null;
  // @react-pdf rasters only — SVG is not supported as an <Image> source.
  const lower = url.split("?")[0]!.toLowerCase();
  const format: PdfLogo["format"] | null = lower.endsWith(".png")
    ? "png"
    : lower.endsWith(".jpg") || lower.endsWith(".jpeg")
      ? "jpg"
      : null;
  if (!format) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = Buffer.from(await res.arrayBuffer());
    return { data, format };
  } catch {
    return null;
  }
}

export async function generateBookingPdf(
  input: GenerateBookingPdfInput,
): Promise<Buffer> {
  const locale: PdfLocale =
    input.locale ?? (siteConfig.defaultLocale as PdfLocale);
  const currency = input.agency?.currency || siteConfig.currency;
  const { booking, car, agency } = input;

  const agencyName =
    (locale === "ar" ? agency?.name_ar : agency?.name_fr) ||
    agency?.name ||
    siteConfig.name;

  const carName = (locale === "ar" ? car.name_ar : null) || car.name;
  const carSubtitle = `${car.brand} ${car.model} · ${car.year}`;

  const days = booking.total_days;
  const subtotal = days * Number(car.price_per_day);
  const extrasSum = extrasTotal(booking.extras, days);

  const extras = booking.extras.map((id) => ({
    label: EXTRA_LABELS[locale][id] ?? id,
    price: money(extraPrice(id, days), currency, locale),
  }));

  const data: BookingPdfData = {
    locale,
    brand: {
      primary: agency?.primary_color || siteConfig.colors.primary,
      secondary: agency?.secondary_color || siteConfig.colors.secondary,
    },
    agency: {
      name: agencyName,
      logo: await loadLogo(agency?.logo_url ?? siteConfig.logo ?? null),
      phone: agency?.phone ?? null,
      whatsapp: agency?.whatsapp_number ?? null,
      email: agency?.email ?? null,
      address:
        (locale === "ar" ? agency?.address_ar : agency?.address) ||
        agency?.address ||
        null,
    },
    booking: {
      reference: booking.reference,
      issuedAt: fmtDate(booking.created_at.slice(0, 10), locale),
      customerName: booking.customer_name,
      customerPhone: booking.customer_phone,
      customerEmail: booking.customer_email,
      startDate: fmtDate(booking.start_date, locale),
      endDate: fmtDate(booking.end_date, locale),
      totalDays: String(days),
      pickupLocation: booking.pickup_location ?? "—",
      dropoffLocation: booking.dropoff_location,
      notes: booking.notes,
    },
    car: {
      name: carName,
      subtitle: carSubtitle,
      pricePerDay: money(Number(car.price_per_day), currency, locale),
      deposit: money(Number(car.deposit), currency, locale),
    },
    extras,
    money: {
      subtotal: money(subtotal, currency, locale),
      extras: money(extrasSum, currency, locale),
      total: money(Number(booking.total_price), currency, locale),
    },
  };

  return renderToBuffer(<BookingPdf data={data} />);
}
