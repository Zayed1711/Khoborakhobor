import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Web push: notifications sent from our own server, free, no Google Play needed.
// Keys come from the environment (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT).

export interface PushMessage {
  title: string;
  body: string;
  /** Path opened on tap, e.g. "/capsule" */
  url?: string;
  /** Same tag replaces the earlier notification */
  tag?: string;
}

export function pushPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://www.kkhobor.com", pub, priv);
  configured = true;
  return true;
}

/** Only real push services over https, so the server can never be made to call other hosts. */
export function isValidPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return false;
  try {
    const u = new URL(endpoint);
    if (u.protocol !== "https:") return false;
    return /(^|\.)(googleapis\.com|push\.apple\.com|mozilla\.com|mozaws\.net|windows\.com|microsoft\.com)$/i.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Send one notification to one device. Returns "sent", "gone" (the phone removed the
 * app or blocked notifications; the row is deleted) or "failed".
 */
export async function sendPush(
  device: { id: string; endpoint: string; p256dh: string; auth: string },
  message: PushMessage
): Promise<"sent" | "gone" | "failed"> {
  if (!configure()) return "failed";
  try {
    await webpush.sendNotification(
      { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
      JSON.stringify(message),
      { TTL: 6 * 60 * 60, urgency: "normal" }
    );
    await prisma.pushDevice.update({ where: { id: device.id }, data: { lastSentAt: new Date() } }).catch(() => {});
    return "sent";
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 404 || status === 410) {
      await prisma.pushDevice.delete({ where: { id: device.id } }).catch(() => {});
      return "gone";
    }
    return "failed";
  }
}
