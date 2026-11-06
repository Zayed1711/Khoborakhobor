/**
 * Sending email through Brevo (free plan: 300 emails a day).
 *
 * Settings in the server's .env:
 *   BREVO_API_KEY=xkeysib-...          (Brevo › SMTP & API › API keys)
 *   EMAIL_FROM=no-reply@kkhobor.com    (a sender address verified in Brevo)
 *   EMAIL_FROM_NAME=খবরাখবর             (optional)
 *
 * Without BREVO_API_KEY: on a developer's computer the email is printed to the server log
 * (so sign-up can be tested); in production nothing is sent and `isEmailReady()` is false,
 * so the site simply does not ask for codes yet.
 */

export const isEmailReady = () => Boolean(process.env.BREVO_API_KEY) || process.env.NODE_ENV !== "production";

export interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(email: Email): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[EMAIL - not sent, no BREVO_API_KEY] to ${email.to}: ${email.subject}\n${email.text}`);
      return { ok: true };
    }
    return { ok: false, error: "Email is not set up (BREVO_API_KEY missing)." };
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: process.env.EMAIL_FROM || "no-reply@kkhobor.com", name: process.env.EMAIL_FROM_NAME || "খবরাখবর" },
        to: [{ email: email.to }],
        subject: email.subject,
        textContent: email.text,
        htmlContent: email.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[EMAIL] Brevo refused (${res.status}): ${body.slice(0, 200)}`);
      return { ok: false, error: `Brevo ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[EMAIL] could not reach Brevo:", e);
    return { ok: false, error: "network" };
  }
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** The code email, in Bengali with the code large and plain. */
export function codeEmail(to: string, code: string, purpose: "verify" | "reset"): Email {
  const what = purpose === "verify" ? "আপনার ইমেইল যাচাই করতে" : "পাসওয়ার্ড নতুন করে সেট করতে";
  const subject = purpose === "verify" ? `খবরাখবর: আপনার যাচাই কোড ${code}` : `খবরাখবর: পাসওয়ার্ড রিসেট কোড ${code}`;
  const text = `${what} এই কোডটি লিখুন: ${code}\n\nকোডটি ১০ মিনিট কার্যকর থাকবে। আপনি এই অনুরোধ না করে থাকলে ইমেইলটি উপেক্ষা করুন।\n\n— খবরাখবর (www.kkhobor.com)`;
  const html = `<div style="font-family:Arial,'Nirmala UI',sans-serif;max-width:480px;margin:auto;padding:24px;color:#17191d">
  <h2 style="margin:0 0 12px;color:#842323">খবরাখবর</h2>
  <p style="margin:0 0 12px">${escapeHtml(what)} এই কোডটি লিখুন:</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:0 0 16px">${escapeHtml(code)}</p>
  <p style="margin:0 0 8px;color:#525a68">কোডটি ১০ মিনিট কার্যকর থাকবে। আপনি এই অনুরোধ না করে থাকলে ইমেইলটি উপেক্ষা করুন।</p>
  <p style="margin:16px 0 0;color:#8a909b;font-size:12px">www.kkhobor.com</p>
</div>`;
  return { to, subject, text, html };
}
