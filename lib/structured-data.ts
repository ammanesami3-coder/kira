/**
 * Schema.org JSON-LD builders for rich results.
 *
 * Each function returns a plain object that is serialized into a
 * `<script type="application/ld+json">` by `<JsonLd />`. Keep these pure and
 * free of server-only imports — they run during metadata/render on the server
 * but take all data as arguments.
 *
 * Validated against Google's Rich Results Test and the Schema Markup
 * Validator for: AutoRental (LocalBusiness), Car + Offer, BreadcrumbList,
 * FAQPage.
 */

import type { AgencySettings, Json } from "@/types/database.types";
import type { Branding } from "@/lib/branding";
import type { Locale } from "@/config/site.config";
import { absoluteUrl, localePath } from "@/lib/seo";

type WithContext<T> = T & { "@context": "https://schema.org" };

function withContext<T extends object>(node: T): WithContext<T> {
  return { "@context": "https://schema.org", ...node };
}

/* ── Opening hours ─────────────────────────────────────────────────── */

// Map the keys used in `agency_settings.opening_hours` to schema.org day
// names. Supports single days ("mon") and inclusive ranges ("mon_fri").
const DAY_NAMES: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function daysForKey(key: string): string[] {
  const [d0 = "", d1 = ""] = key.toLowerCase().split(/[_-]/);
  if (d1 && DAY_NAMES[d0] && DAY_NAMES[d1]) {
    const start = DAY_ORDER.indexOf(d0);
    const end = DAY_ORDER.indexOf(d1);
    if (start !== -1 && end !== -1 && start <= end) {
      return DAY_ORDER.slice(start, end + 1)
        .map((d) => DAY_NAMES[d])
        .filter((d): d is string => Boolean(d));
    }
  }
  const single = DAY_NAMES[d0];
  return single ? [single] : [];
}

interface OpeningHoursSpec {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

function openingHoursSpec(hours: Json): OpeningHoursSpec[] {
  if (!hours || typeof hours !== "object" || Array.isArray(hours)) return [];
  const specs: OpeningHoursSpec[] = [];
  for (const [key, value] of Object.entries(hours)) {
    if (typeof value !== "string") continue;
    const match = value.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (!match || !match[1] || !match[2]) continue; // "closed"/malformed → skip
    const dayOfWeek = daysForKey(key);
    if (dayOfWeek.length === 0) continue;
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek,
      opens: match[1],
      closes: match[2],
    });
  }
  return specs;
}

/* ── AutoRental (LocalBusiness) ────────────────────────────────────── */

/**
 * AutoRental business entity for the home & contact pages. AutoRental is a
 * subtype of LocalBusiness, so it inherits NAP, geo, hours and social links.
 */
export function autoRentalJsonLd(
  settings: AgencySettings | null,
  brand: Branding,
  locale: Locale,
  description: string,
) {
  const social = settings?.social_links;
  const sameAs =
    social && typeof social === "object" && !Array.isArray(social)
      ? Object.values(social).filter(
          (v): v is string => typeof v === "string" && v.length > 0,
        )
      : [];

  const node: Record<string, Json | undefined> = {
    "@type": "AutoRental",
    "@id": `${absoluteUrl(localePath(locale))}#business`,
    name: brand.name,
    description,
    url: absoluteUrl(localePath(locale)),
    image: brand.logo || undefined,
    logo: brand.logo || undefined,
    // priceRange is a free-form affordability hint; "$$" is the Google-
    // recommended generic value for a mid-range business.
    priceRange: "$$",
    currenciesAccepted: settings?.currency ?? undefined,
  };

  if (settings?.phone) node.telephone = settings.phone;
  if (settings?.email) node.email = settings.email;

  const street = locale === "ar" ? settings?.address_ar : settings?.address;
  if (street || settings?.address) {
    node.address = {
      "@type": "PostalAddress",
      streetAddress: street ?? settings?.address ?? "",
      addressCountry: "MA",
    };
  }

  if (settings?.lat != null && settings?.lng != null) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: settings.lat,
      longitude: settings.lng,
    };
  }

  const hours = openingHoursSpec(settings?.opening_hours ?? null);
  if (hours.length > 0) {
    node.openingHoursSpecification = hours as unknown as Json;
  }

  if (sameAs.length > 0) node.sameAs = sameAs;

  // Drop undefined keys so the serialized JSON-LD stays clean.
  const cleaned: Record<string, Json> = {};
  for (const [k, v] of Object.entries(node)) {
    if (v !== undefined) cleaned[k] = v;
  }

  return withContext(cleaned);
}

/* ── Car + Offer ───────────────────────────────────────────────────── */

export interface CarJsonLdInput {
  name: string;
  description: string;
  brand: string;
  model: string;
  year: number;
  transmission: string;
  fuelType: string;
  seats: number;
  doors: number;
  images: string[];
  pricePerDay: number;
  currency: string;
  url: string;
  available: boolean;
}

/**
 * Car product entity with a rental Offer. Google understands `Car` (a
 * `Product`/`Vehicle` subtype) for vehicle rich results; the `Offer` carries
 * the daily price and live availability.
 */
export function carJsonLd(input: CarJsonLdInput) {
  return withContext({
    "@type": "Car",
    name: input.name,
    description: input.description,
    brand: { "@type": "Brand", name: input.brand },
    model: input.model,
    vehicleModelDate: String(input.year),
    productionDate: String(input.year),
    vehicleTransmission: input.transmission,
    fuelType: input.fuelType,
    vehicleSeatingCapacity: input.seats,
    numberOfDoors: input.doors,
    image: input.images.length > 0 ? input.images : undefined,
    url: input.url,
    offers: {
      "@type": "Offer",
      price: input.pricePerDay,
      priceCurrency: input.currency,
      url: input.url,
      availability: input.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      // Daily rental price; expressed as a unit price spec for clarity.
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: input.pricePerDay,
        priceCurrency: input.currency,
        unitCode: "DAY",
      },
    },
  });
}

/* ── BreadcrumbList ────────────────────────────────────────────────── */

export interface BreadcrumbItem {
  name: string;
  /** Locale-prefixed path, e.g. "/ar/cars". */
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return withContext({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  });
}

/* ── FAQPage ───────────────────────────────────────────────────────── */

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqJsonLd(items: FaqItem[]) {
  return withContext({
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  });
}
