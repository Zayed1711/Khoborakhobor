import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { readSession, rateLimit, pickClientIp } from "@/lib/session";
import { isValidPushEndpoint, pushPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

function bad(status: number) {
  return NextResponse.json({ ok: false }, { status, headers: noStore });
}

async function allowed(): Promise<boolean> {
  const h = await headers();
  return rateLimit(`push:${pickClientIp((n) => h.get(n))}`, 20, 60_000);
}

function clampHour(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 23 ? n : undefined;
}

/** The public key the browser needs to subscribe. */
export async function GET() {
  return NextResponse.json({ ok: true, publicKey: pushPublicKey() }, { headers: noStore });
}

/** Save (or update) this device's subscription. Body: { subscription, reminderHour? } */
export async function POST(req: Request) {
  if (!(await allowed())) return bad(429);
  let body: { subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }; reminderHour?: unknown };
  try {
    body = await req.json();
  } catch {
    return bad(400);
  }
  const sub = body?.subscription;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!isValidPushEndpoint(sub?.endpoint)) return bad(400);
  if (typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100) return bad(400);

  const session = await readSession();
  const studentId = session?.role === "student" ? session.sid : null;
  const reminderHour = clampHour(body.reminderHour);
  await prisma.pushDevice.upsert({
    where: { endpoint: sub.endpoint as string },
    create: { endpoint: sub.endpoint as string, p256dh, auth, studentId, ...(reminderHour !== undefined ? { reminderHour } : {}) },
    update: { p256dh, auth, enabled: true, ...(studentId ? { studentId } : {}), ...(reminderHour !== undefined ? { reminderHour } : {}) },
  });
  return NextResponse.json({ ok: true }, { headers: noStore });
}

/** Turn notifications off for this device. Body: { endpoint } */
export async function DELETE(req: Request) {
  if (!(await allowed())) return bad(429);
  let body: { endpoint?: unknown };
  try {
    body = await req.json();
  } catch {
    return bad(400);
  }
  if (!isValidPushEndpoint(body?.endpoint)) return bad(400);
  await prisma.pushDevice.deleteMany({ where: { endpoint: body.endpoint } });
  return NextResponse.json({ ok: true }, { headers: noStore });
}
