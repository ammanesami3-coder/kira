import "server-only";

/**
 * Client for the self-hosted WhatsApp gateway (Baileys / Evolution API).
 *
 * Phase 0: intentionally empty. Later this POSTs the booking PDF to
 * `WA_GATEWAY_URL` authenticated with `WA_GATEWAY_API_KEY` (server-only),
 * with retry + idempotency keyed on `bookings.whatsapp_sent`.
 */

export {};
