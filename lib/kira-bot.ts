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

/**
 * Env values pasted into Vercel often carry surrounding quotes (copied from a
 * dotenv file, e.g. `KIRA_BOT_ENABLED="true"`) or a trailing newline — either
 * makes a strict string comparison fail silently. Strip both before use.
 */
function cleanEnv(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim();
}

const TRUTHY_FLAGS = new Set(["true", "1", "yes", "on"]);

function botConfig(): { url: string; secret: string } | null {
  const url = cleanEnv(process.env.KIRA_BOT_URL);
  const secret = cleanEnv(process.env.KIRA_BOT_HMAC_SECRET);
  if (!url || !secret) return null;
  return { url: url.replace(/\/+$/, ""), secret };
}

/**
 * Master switch for the new notification path. `KIRA_BOT_ENABLED=false` (or
 * unset, or missing config) restores the legacy behavior instantly — an env
 * change only, no code deploy. Accepts true/1/yes/on, case-insensitive,
 * quotes and whitespace tolerated.
 */
export function isKiraBotEnabled(): boolean {
  return (
    TRUTHY_FLAGS.has(cleanEnv(process.env.KIRA_BOT_ENABLED).toLowerCase()) &&
    botConfig() !== null
  );
}

/**
 * Log-safe snapshot of the bot configuration, for diagnosing why a booking
 * was routed to the bot vs. the legacy gateway. `rawFlag` is JSON-encoded so
 * stray quotes/whitespace in the env value are visible in Vercel logs. The
 * HMAC secret is reported as present/absent only — never its value.
 */
export function kiraBotDiagnostics(): {
  rawFlag: string;
  flagIsTruthy: boolean;
  url: string | null;
  secretSet: boolean;
  enabled: boolean;
} {
  return {
    rawFlag: JSON.stringify(process.env.KIRA_BOT_ENABLED ?? null),
    flagIsTruthy: TRUTHY_FLAGS.has(
      cleanEnv(process.env.KIRA_BOT_ENABLED).toLowerCase(),
    ),
    url: botConfig()?.url ?? null,
    secretSet: cleanEnv(process.env.KIRA_BOT_HMAC_SECRET).length > 0,
    enabled: isKiraBotEnabled(),
  };
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
