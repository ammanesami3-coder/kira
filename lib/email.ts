import "server-only";

/**
 * Optional owner notification fallback via Resend (no SDK — plain REST).
 *
 * Used only when the WhatsApp gateway could not deliver a new booking, so the
 * agency owner still hears about it. Entirely opt-in: if `RESEND_API_KEY` (or
 * the agency email) is unset this is a silent no-op and never throws.
 */

export interface OwnerBookingEmail {
  to: string;
  agencyName: string;
  reference: string;
  summary: string;
  pdfUrl: string | null;
}

export async function sendOwnerBookingEmail(
  email: OwnerBookingEmail,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Kira <onboarding@resend.dev>";
  if (!apiKey || !email.to) return false;

  const link = email.pdfUrl ? `<p><a href="${email.pdfUrl}">PDF</a></p>` : "";
  const html =
    `<h2>${email.agencyName} — ${email.reference}</h2>` +
    `<p>${email.summary}</p>${link}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: `${email.agencyName} — ${email.reference}`,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
