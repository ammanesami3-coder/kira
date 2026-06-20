import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateBookingPdf, type PdfAgency } from "@/lib/pdf";
import {
  agencyWhatsappNumber,
  isGatewayConfigured,
  sendDocument,
} from "@/lib/wa-gateway";
import { sendOwnerBookingEmail } from "@/lib/email";
import { EXTRA_IDS, type ExtraId } from "@/lib/booking/extras";
import { siteConfig } from "@/config/site.config";

/**
 * Post-booking fulfilment: generate the PDF, store it, and push it to the
 * agency owner's WhatsApp through the self-hosted gateway.
 *
 * Design constraints (Phase 4):
 *   • IDEMPOTENT — keyed on `bookings.pdf_url` (skip regenerating) and
 *     `bookings.whatsapp_sent` (never send the same PDF twice).
 *   • RESILIENT — never throws to the caller. A failed/absent gateway leaves
 *     the booking as "awaiting send" (`whatsapp_sent = false`) for a later
 *     retry, optionally emailing the owner as a fallback. The booking itself
 *     is already committed and must never be rolled back here.
 */

const PDF_BUCKET = "booking-pdfs";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year — long-lived for the gateway + admin

export interface FulfillmentResult {
  pdfReady: boolean;
  whatsappSent: boolean;
  /** Diagnostic note (gateway reason, fallback used, etc.). */
  note?: string;
}

function parseExtras(value: unknown): ExtraId[] {
  const selected =
    value && typeof value === "object" && "selected" in value
      ? (value as { selected: unknown }).selected
      : null;
  if (!Array.isArray(selected)) return [];
  return selected.filter((x): x is ExtraId =>
    (EXTRA_IDS as readonly string[]).includes(x as string),
  );
}

export async function fulfillBooking(
  bookingId: string,
): Promise<FulfillmentResult> {
  const admin = createAdminClient();

  // Load the booking with its car (single round-trip).
  const { data: booking, error } = await admin
    .from("bookings")
    .select(
      "*, cars(name, name_ar, brand, model, year, price_per_day, deposit)",
    )
    .eq("id", bookingId)
    .single();

  if (error || !booking || !booking.cars) {
    return { pdfReady: false, whatsappSent: false, note: "booking_not_found" };
  }

  const { data: agencyRow } = await admin
    .from("agency_settings")
    .select(
      "name, name_ar, name_fr, logo_url, primary_color, secondary_color, phone, whatsapp_number, email, address, address_ar, currency",
    )
    .limit(1)
    .maybeSingle();
  const agency = (agencyRow as PdfAgency | null) ?? null;

  const car = booking.cars;
  const extras = parseExtras(booking.extras);

  // ── 1. PDF (skip if already generated) ──────────────────────────────
  let pdfUrl = booking.pdf_url;
  if (!pdfUrl) {
    try {
      const buffer = await generateBookingPdf({
        agency,
        car,
        booking: {
          reference: booking.reference,
          created_at: booking.created_at,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          customer_email: booking.customer_email,
          start_date: booking.start_date,
          end_date: booking.end_date,
          total_days: booking.total_days,
          pickup_location: booking.pickup_location,
          dropoff_location: booking.dropoff_location,
          total_price: Number(booking.total_price),
          notes: booking.notes,
          extras,
        },
      });

      const objectPath = `${booking.id}.pdf`;
      const { error: uploadError } = await admin.storage
        .from(PDF_BUCKET)
        .upload(objectPath, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { data: signed, error: signError } = await admin.storage
        .from(PDF_BUCKET)
        .createSignedUrl(objectPath, SIGNED_URL_TTL);
      if (signError || !signed) throw signError ?? new Error("sign_failed");

      pdfUrl = signed.signedUrl;
      await admin
        .from("bookings")
        .update({ pdf_url: pdfUrl })
        .eq("id", booking.id);
    } catch (err) {
      return {
        pdfReady: false,
        whatsappSent: booking.whatsapp_sent,
        note: `pdf_failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // ── 2. WhatsApp (idempotent: skip if already sent) ──────────────────
  if (booking.whatsapp_sent) {
    return { pdfReady: true, whatsappSent: true, note: "already_sent" };
  }

  const to = agencyWhatsappNumber() ?? agency?.whatsapp_number ?? null;
  const agencyName =
    agency?.name_ar || agency?.name || siteConfig.name || "Kira";
  const currency = agency?.currency || siteConfig.currency;
  const caption =
    `📄 حجز جديد — ${booking.reference}\n` +
    `${booking.customer_name} · ${booking.customer_phone}\n` +
    `${car.name} · ${booking.start_date} ← ${booking.end_date}\n` +
    `المجموع: ${Number(booking.total_price)} ${currency}`;

  if (!isGatewayConfigured() || !to) {
    await emailFallback(agency, booking, agencyName, caption, pdfUrl);
    return {
      pdfReady: true,
      whatsappSent: false,
      note: !to ? "no_recipient" : "gateway_not_configured",
    };
  }

  const result = await sendDocument({
    to,
    fileUrl: pdfUrl!,
    filename: `${booking.reference}.pdf`,
    caption,
  });

  if (result.ok) {
    await admin
      .from("bookings")
      .update({ whatsapp_sent: true })
      .eq("id", booking.id);
    return { pdfReady: true, whatsappSent: true };
  }

  // Gateway down/disconnected → leave for retry, try the optional email path.
  await emailFallback(agency, booking, agencyName, caption, pdfUrl);
  return { pdfReady: true, whatsappSent: false, note: `wa_${result.reason}` };
}

async function emailFallback(
  agency: PdfAgency | null,
  booking: { reference: string },
  agencyName: string,
  summary: string,
  pdfUrl: string | null,
): Promise<void> {
  if (!agency?.email) return;
  await sendOwnerBookingEmail({
    to: agency.email,
    agencyName,
    reference: booking.reference,
    summary: summary.replace(/\n/g, " · "),
    pdfUrl,
  });
}
