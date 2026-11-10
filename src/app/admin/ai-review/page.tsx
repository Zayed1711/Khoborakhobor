import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { aiMode } from "@/lib/study/ai-facts-store";

export const dynamic = "force-dynamic";

function list(s: string | null): string[] {
  try {
    const v = JSON.parse(s || "[]");
    return Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : `${x?.label}: ${x?.value}`)) : [];
  } catch {
    return [];
  }
}

/** Admin only: the latest AI summaries next to the publisher's summary, with pass/fail reasons. */
export default async function AiReviewPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const session = await getCurrentSession();
  if (session.role !== "admin") redirect("/admin/login");

  const { show } = await searchParams;
  const onlyFailed = show === "failed";
  const [rows, totals] = await Promise.all([
    prisma.articleFacts.findMany({
      where: onlyFailed ? { status: "failed" } : {},
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { article: { select: { title: true, summary: true, slug: true, sourceName: true } } },
    }),
    prisma.articleFacts.groupBy({ by: ["status"], _count: { _all: true }, _sum: { calls: true, tokensIn: true, tokensOut: true } }),
  ]);
  const ok = totals.find((t) => t.status === "ok");
  const failed = totals.find((t) => t.status === "failed");
  const all = (ok?._count._all ?? 0) + (failed?._count._all ?? 0);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-[#1f2328]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-[#68707f] hover:text-[#842323]">← Admin</Link>
          <h1 className="text-2xl font-bold mt-1">AI summary review</h1>
          <p className="text-sm text-[#68707f]">
            Mode: <b>{aiMode()}</b> (AI_FACTS) · {all} stories · {ok?._count._all ?? 0} passed
            {all ? ` (${Math.round(((ok?._count._all ?? 0) / all) * 100)}%)` : ""} · calls{" "}
            {(ok?._sum.calls ?? 0) + (failed?._sum.calls ?? 0)} · tokens {(ok?._sum.tokensIn ?? 0) + (failed?._sum.tokensIn ?? 0)} in /{" "}
            {(ok?._sum.tokensOut ?? 0) + (failed?._sum.tokensOut ?? 0)} out
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/ai-review" className={`px-3 py-1.5 rounded-lg border ${!onlyFailed ? "bg-[#842323] text-white border-[#842323]" : "border-[#ded8cb]"}`}>Latest 40</Link>
          <Link href="/admin/ai-review?show=failed" className={`px-3 py-1.5 rounded-lg border ${onlyFailed ? "bg-[#842323] text-white border-[#842323]" : "border-[#ded8cb]"}`}>Failed only</Link>
        </div>
      </div>

      {!rows.length && <p className="text-[#68707f]">No AI results yet. They appear after the next crawl with AI_FACTS=shadow or on.</p>}

      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-[#e4ded3] bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Link href={`/article/${encodeURIComponent(r.article.slug)}`} className="font-semibold hover:text-[#842323]">{r.article.title}</Link>
              <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${r.status === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                {r.status === "ok" ? "passed" : "kept old summary"} · {r.model || "-"} · {r.calls} call(s)
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-[#faf8f4] p-3">
                <p className="text-xs font-semibold text-[#68707f] mb-1">Publisher summary ({r.article.sourceName || "source"})</p>
                <p className="text-[15px] leading-relaxed">{r.article.summary}</p>
              </div>
              <div className="rounded-lg bg-[#f2f6ff] p-3">
                <p className="text-xs font-semibold text-[#68707f] mb-1">AI summary</p>
                <p className="text-[15px] leading-relaxed">{r.summary || "—"}</p>
              </div>
            </div>
            {r.status === "ok" && (
              <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[8rem_1fr]">
                <dt className="text-[#68707f]">What</dt><dd>{r.what || "—"}</dd>
                <dt className="text-[#68707f]">Who</dt><dd>{list(r.who).join(", ") || "—"}</dd>
                <dt className="text-[#68707f]">When / where</dt><dd>{r.whenText || "—"} / {r.whereText || "—"}</dd>
                <dt className="text-[#68707f]">Figures</dt><dd>{list(r.numbers).join(" · ") || "—"}</dd>
                <dt className="text-[#68707f]">Category / score</dt><dd>{r.gkCategory || "—"} / {r.examScore ?? "—"}</dd>
              </dl>
            )}
            {r.problems && <p className="text-xs text-[#8a5a00] bg-[#fff8e6] rounded-lg p-2 break-words">{r.problems}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
