/**
 * Dev-only: render a sample booking PDF to `tmp/sample-booking.pdf` so the
 * Arabic RTL layout can be eyeballed without a full booking round-trip.
 *   pnpm tsx scripts/pdf-preview.tsx
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { generateBookingPdf } from "@/lib/pdf";

const buffer = await generateBookingPdf({
  locale: "ar",
  agency: {
    name: "Kira",
    name_ar: "وكالة كراء السندباد",
    name_fr: "Sindibad Location",
    logo_url: null,
    primary_color: "#0F3D3E",
    secondary_color: "#C8A24B",
    phone: "+212 5 22 00 00 00",
    whatsapp_number: "+212 600 000 000",
    email: "contact@sindibad.ma",
    address: "Casablanca, Maroc",
    address_ar: "الدار البيضاء، المغرب",
    currency: "MAD",
  },
  car: {
    name: "Dacia Logan",
    name_ar: "داسيا لوغان",
    brand: "Dacia",
    model: "Logan",
    year: 2024,
    price_per_day: 300,
    deposit: 3000,
  },
  booking: {
    reference: "KR-2026-000123",
    created_at: "2026-06-20T10:30:00Z",
    customer_name: "محمد العلوي",
    customer_phone: "+212 661 23 45 67",
    customer_email: "mohamed@example.com",
    start_date: "2026-07-01",
    end_date: "2026-07-06",
    total_days: 5,
    pickup_location: "مطار محمد الخامس، الدار البيضاء",
    dropoff_location: "وسط مدينة مراكش",
    total_price: 5 * 300 + 80 * 5 + 50,
    notes: "الرجاء تجهيز السيارة بمقعد أطفال إضافي عند الاستلام.",
    extras: ["full_insurance", "additional_driver"],
  },
});

mkdirSync("tmp", { recursive: true });
writeFileSync("tmp/sample-booking.pdf", buffer);
console.log(`Wrote tmp/sample-booking.pdf (${buffer.length} bytes)`);
