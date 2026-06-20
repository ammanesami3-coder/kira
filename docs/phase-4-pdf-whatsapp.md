# Phase 4 — Booking PDF + WhatsApp delivery

Every new booking generates a professional PDF voucher, stores it, and pushes it
to the agency owner's WhatsApp through a **self-hosted Baileys gateway** (free).

## Flow

```
createBooking (Server Action, service-role)
  └─ insert booking (status=pending)        ← booking is committed here
  └─ after() ────────────────────────────┐  ← runs AFTER the response (instant
                                          │     confirmation for the guest)
fulfillBooking(id)  [server/fulfillment]  │
  1. generateBookingPdf  ────────────────┘  @react-pdf/renderer → Buffer
  2. upload to Storage bucket `booking-pdfs` (private) → 1y signed URL
  3. save bookings.pdf_url
  4. sendDocument → WA_GATEWAY_URL/send-document (x-api-key)
  5. on success: bookings.whatsapp_sent = true
```

## Key decisions

- **`@react-pdf/renderer`, not Puppeteer** — pure JS, no Chromium, Vercel-safe.
- **Arabic rendering** — a real Arabic font (Almarai, OFL) is shipped under
  `assets/fonts/` and registered via `Font.register` in `components/pdf/fonts.ts`.
  @react-pdf shapes Arabic (joining + ligatures) and reorders bidi only when the
  font carries Arabic glyphs. Fonts are pulled into the serverless bundle via
  `outputFileTracingIncludes` in `next.config.ts`; `@react-pdf/renderer` is kept
  in `serverExternalPackages`.
- **`after()`** runs fulfilment post-response so a slow/down gateway never adds
  latency to — or fails — the guest's booking.
- **Resilience** — `fulfillBooking` never throws. If the gateway is absent or
  unreachable, the PDF is still produced and the booking stays
  `whatsapp_sent = false` for a later retry (`retryBookingFulfillment` Server
  Action, or a cron over `whatsapp_sent = false`). Optional Resend email
  fallback (`lib/email.ts`) notifies the owner if configured.
- **Idempotency** — PDF is regenerated only when `pdf_url` is null; WhatsApp is
  sent only when `whatsapp_sent` is false. Re-running is safe.
- **Storage privacy** — the `booking-pdfs` bucket is **private** (PDFs hold
  PII). The gateway and admin fetch via signed URLs. Migration
  `20260620000009_storage_booking_pdfs.sql` is guarded so the PGlite db-test
  (no `storage` schema) skips it.
- **Secrets** — `WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY`, `AGENCY_WHATSAPP_NUMBER`
  are server-only; the gateway's `API_KEY` lives only inside the gateway.

## The gateway (separate repo)

`kira-wa-gateway/` is a standalone Node/Express + Baileys service that **cannot**
live on Vercel (needs a persistent WebSocket + saved session). It runs on an
always-on host (Oracle Cloud Always Free / Raspberry Pi / VPS). Endpoints:
`GET /qr`, `GET /status`, `POST /send-document` (API-key protected). See that
repo's README for deploy + QR pairing.

## Dev preview

`pnpm pdf:preview` renders a sample voucher to `tmp/sample-booking.pdf` (uses
`scripts/tsconfig.preview.json` to stub `server-only` outside an RSC context).
