import "server-only";

/**
 * Client for the self-hosted WhatsApp gateway (Baileys / Evolution API).
 *
 * The gateway is a SEPARATE always-on service (see `kira-wa-gateway/`) because
 * Baileys needs a persistent WebSocket + saved session that Vercel's serverless
 * runtime cannot keep. From here we only make short, authenticated HTTP calls.
 *
 * Secrets (`WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY`) are server-only — never
 * `NEXT_PUBLIC_*`. The `server-only` import guarantees this never reaches the
 * browser bundle.
 */

const DEFAULT_TIMEOUT_MS = 8000;

export interface SendDocumentParams {
  /** Recipient phone in international format, digits only (e.g. 2126…). */
  to: string;
  /** Publicly fetchable URL of the PDF (a Supabase signed URL). */
  fileUrl: string;
  filename: string;
  caption?: string;
}

export type GatewayResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not_configured" | "unreachable" | "rejected";
      detail?: string;
    };

function gatewayConfig(): { url: string; apiKey: string } | null {
  const url = process.env.WA_GATEWAY_URL;
  const apiKey = process.env.WA_GATEWAY_API_KEY;
  if (!url || !apiKey) return null;
  return { url: url.replace(/\/+$/, ""), apiKey };
}

export function isGatewayConfigured(): boolean {
  return gatewayConfig() !== null;
}

/** Agency owner's WhatsApp receiving number (digits only). */
export function agencyWhatsappNumber(): string | null {
  const raw = process.env.AGENCY_WHATSAPP_NUMBER;
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  return digits.length > 0 ? digits : null;
}

/**
 * POST the booking PDF to the gateway. Never throws — returns a tagged result
 * so the caller can decide whether to mark the booking as sent or leave it for
 * a later retry. A down/disconnected gateway must NOT fail the booking.
 */
export async function sendDocument(
  params: SendDocumentParams,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<GatewayResult> {
  const config = gatewayConfig();
  if (!config) return { ok: false, reason: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${config.url}/send-document`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, reason: "rejected", detail: detail.slice(0, 300) };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: "unreachable",
      detail: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}
