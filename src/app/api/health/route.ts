import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public health check for uptime monitors and the server watchdog.
 * Reports only whether the site and its database work and how fresh the news is,
 * with no counts or other internals.
 *   200 = healthy, 503 = database unreachable.
 */
export async function GET() {
  const started = Date.now();
  try {
    const newest = await prisma.article.findFirst({
      where: { sourceUrl: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const ageHours = newest ? Math.round(((Date.now() - newest.createdAt.getTime()) / 36e5) * 10) / 10 : null;
    return NextResponse.json(
      { ok: true, db: "ok", newestStoryAgeHours: ageHours, responseMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ ok: false, db: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
