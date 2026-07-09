import "server-only";

import { createHmac } from "node:crypto";

/**
 * Client for the Kira Bot service — the SECOND, isolated WhatsApp session
 * that runs on the always-on host next to the legacy gateway (see
 * `kira-wa-gateway/services/kira-bot/`).
 *
 * Why it exists: the legacy path sends from the agency's number to itself,
 * which WhatsApp treats as a silent "message to self". Kira Bot sends from
 * the official platform number TO the agency's number — an external message
 * that rings as a real lock-screen notification.
 *
 * Every request is signed: `x-kira-signature` = hex HMAC-SHA256 of
 * `${timestamp}.${body}` with the shared secret, plus `x-kira-timestamp`.
 * The service rejects stale timestamps (>5 min), so captured requests
 * cannot be replayed.
 *
 * Secrets (`KIRA_BOT_URL`, `KIRA_BOT_HMAC_SECRET`) are server-only — never
 * `NEXT_PUBLIC_*`. The `server-only` import guarantees this module never
 * reaches the browser bundle, and the agency's WhatsApp number is always
 * fetched from the database server-side, never accepted from the client.
 */

const DEFAULT_TIMEOUT_MS = 8000;
/** Short in-call retry for transient blips; anything longer is left to the
 * booking-level retry (`whatsapp_sent = false` → admin resend). */
const RETRY_DELAYS_MS = [1000, 3000];

export interface KiraBotSendParams {
  /** Agency WhatsApp number (digits only) — fetched from the DB server-side. */
  to: string;
  /** Publicly fetchable URL of the PDF (a Supabase signed URL). */
  fileUrl: string;
  filename: string;
  caption?: string;
  /** Booking reference — duplicate-suppression key on the bot side. */
  idempotencyKey: string;
}

export type KiraBotResult =
  | { ok: true }
  | {
      ok: false;
      reason: "not_configured" | "unreachable" | "rejected";
      detail?: string;
    };

function botConfig(): { url: string; secret: string } | null {
  const url = process.env.KIRA_BOT_URL;
  const secret = process.env.KIRA_BOT_HMAC_SECRET;
  if (!url || !secret) return null;
  return { url: url.replace(/\/+$/, ""), secret };
}

/**
 * Master switch for the new notification path. `KIRA_BOT_ENABLED=false` (or
 * unset, or missing config) restores the legacy behavior instantly — an env
 * change only, no code deploy.
 */
export function isKiraBotEnabled(): boolean {
  return process.env.KIRA_BOT_ENABLED === "true" && botConfig() !== null;
}

function sign(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

async function postOnce(
  config: { url: string; secret: string },
  body: string,
  timeoutMs: number,
): Promise<KiraBotResult> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${config.url}/send-document`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-kira-timestamp": timestamp,
        "x-kira-signature": sign(config.secret, timestamp, body),
      },
      body,
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

/**
 * POST the booking PDF to Kira Bot. Never throws — a down/disconnected bot
 * must NOT fail the booking; the caller falls back to the legacy gateway and
 * leaves `whatsapp_sent = false` for a later retry.
 *
 * Transient failures (unreachable / 5xx-rejected) get a short backoff retry.
 * Auth/allowlist rejections (401/403/429) are NOT retried in-call — they are
 * configuration problems a retry cannot fix. Duplicate sends are safe at any
 * layer: the bot's idempotency store ignores a reference it already sent.
 */
export async function sendDocumentViaKiraBot(
  params: KiraBotSendParams,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<KiraBotResult> {
  const config = botConfig();
  if (!config) return { ok: false, reason: "not_configured" };

  const body = JSON.stringify(params);

  let result = await postOnce(config, body, timeoutMs);
  for (const delay of RETRY_DELAYS_MS) {
    if (result.ok || result.reason !== "unreachable") break;
    await new Promise((resolve) => setTimeout(resolve, delay));
    result = await postOnce(config, body, timeoutMs);
  }
  return result;
}
