import Link from "next/link";
import { ArrowLeft, CheckCircle2, MinusCircle, Trophy, XCircle, PenLine } from "lucide-react";
import type { ExamResults, ReviewItem } from "@/actions/exam-results";
import { SECTIONS, TOTAL_MARKS } from "@/lib/exam/rules";

const fmtDay = (day: string) =>
  new Date(day + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fmtTime = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** Results of a weekly exam: the student's own score and paper, and the public merit list. */
export default function ExamResultsView({ r, loggedIn }: { r: ExamResults; loggedIn: boolean }) {
  const me = r.me;
  return (
    <div className="space-y-8">
      <div>
        <Link href="/exam" className="text-sm text-[#842323] inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Weekly exam
        </Link>
        <h1 className="font-serif text-3xl font-bold text-[#17191d] mt-2">{r.exam.title}</h1>
        <p className="text-sm text-[#68707f] mt-1">
          {fmtDay(r.exam.day)} · {r.takers} {r.takers === 1 ? "student" : "students"} sat the exam
        </p>
      </div>

      {me ? (
        <section className="rounded-2xl border border-[#ded8cb] bg-white p-6 space-y-4">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#68707f]">Your score</p>
              <p className="text-4xl font-bold text-[#17191d]">
                {num(me.total)}
                <span className="text-lg font-normal text-[#68707f]"> / {TOTAL_MARKS}</span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#68707f]">Merit position</p>
              <p className="text-3xl font-bold text-[#842323]">
                {me.rank}
                <span className="text-base font-normal text-[#68707f]"> of {r.takers}</span>
              </p>
            </div>
          </div>
          <ul className="grid sm:grid-cols-2 gap-1.5 text-sm text-[#404652]">
            <li>
              Objective: {num(me.objective)} / 40 ({me.correct} right, {me.wrong} wrong, −{num(me.negative)})
            </li>
            <li>Writing: {me.writingPending ? `${num(me.writing)} so far — still being checked` : `${num(me.writing)} / 10`}</li>
            <li>Time taken: {fmtTime(me.timeTakenSec)}</li>
          </ul>
          {me.writingPending && <p className="text-xs text-[#68707f]">Your total and position will change when your writing is marked.</p>}
        </section>
      ) : (
        <p className="rounded-2xl border border-[#ded8cb] bg-white p-5 text-sm text-[#525a68]">
          {loggedIn ? (
            "You did not sit this exam."
          ) : (
            <>
              <Link href={`/login?redirect=/exam/results/${r.exam.id}`} className="text-[#842323] font-semibold hover:underline">
                Log in
              </Link>{" "}
              to see your own result and answers.
            </>
          )}
        </p>
      )}

      {/* Merit list */}
      <section className="space-y-3">
        <h2 className="font-serif text-xl font-bold text-[#17191d] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#c29547]" /> Merit list
        </h2>
        {r.pendingWritings > 0 && <p className="text-xs text-[#68707f]">Writing is still being marked (*), so positions may change.</p>}
        {r.merit.length === 0 ? (
          <p className="text-sm text-[#68707f]">Nobody sat this exam.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#ded8cb] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[#faf8f4] text-[#68707f] text-xs uppercase">
                <tr>
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-right px-3 py-2">Total</th>
                  <th className="text-right px-3 py-2 hidden sm:table-cell">Objective</th>
                  <th className="text-right px-3 py-2 hidden sm:table-cell">Writing</th>
                  <th className="text-right px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {r.merit.map((m) => (
                  <tr key={m.rank} className={m.isMe ? "bg-amber-50 font-semibold" : "border-t border-[#f0ebe1]"} aria-current={m.isMe ? "true" : undefined}>
                    <td className="px-3 py-2">{m.rank}</td>
                    <td className="px-3 py-2">
                      {m.name}
                      {m.isMe && <span className="ml-2 text-xs text-amber-800">(you)</span>}
                    </td>
                    <td className="px-3 py-2 text-right">{num(m.total)}</td>
                    <td className="px-3 py-2 text-right hidden sm:table-cell">{num(m.objective)}</td>
                    <td className="px-3 py-2 text-right hidden sm:table-cell">
                      {num(m.writing)}
                      {m.writingPending && <span title="Still being marked">*</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-[#68707f]">{fmtTime(m.timeTakenSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-[#68707f]">Equal marks: less time ranks higher, then fewer negative marks.</p>
      </section>

      {/* Own paper with answers */}
      {me && (
        <section className="space-y-6">
          <h2 className="font-serif text-xl font-bold text-[#17191d]">Your answers</h2>
          {SECTIONS.map((s) => {
            const items = me.review.filter((x) => x.section === s.id);
            if (!items.length) return null;
            return (
              <div key={s.id} className="space-y-3">
                <h3 className="font-semibold text-[#17191d]">{s.label}</h3>
                {(s.id === "ielts" && me.passages.ielts2 ? [1, 2] : [0]).map((no) => {
                  const text = no === 2 ? me.passages.ielts2 : me.passages[s.id];
                  const group = no === 0 ? items : items.filter((x) => x.passageNo === no);
                  return (
                    <div key={no} className="space-y-3">
                      {text && (
                        <details className="rounded-xl border border-[#ded8cb] bg-[#faf8f4] p-3 text-sm">
                          <summary className="cursor-pointer text-[#525a68]">{no ? `Reading passage ${no}` : "Reading passage"}</summary>
                          <p className="mt-2 whitespace-pre-wrap leading-relaxed">{text}</p>
                        </details>
                      )}
                      {group.map((it) => (
                        <ReviewCard key={it.n} it={it} />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function ReviewCard({ it }: { it: ReviewItem }) {
  const icon =
    it.result === "right" ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-label="Right" />
    ) : it.result === "wrong" ? (
      <XCircle className="w-4 h-4 text-rose-600" aria-label="Wrong" />
    ) : it.result === "blank" ? (
      <MinusCircle className="w-4 h-4 text-[#9aa1ad]" aria-label="Left blank" />
    ) : (
      <PenLine className="w-4 h-4 text-[#842323]" aria-label="Writing" />
    );
  return (
    <div className="rounded-xl border border-[#ded8cb] bg-white p-4 space-y-2 text-sm">
      <div className="flex gap-2">
        <span className="font-bold text-[#842323]">{it.n}.</span>
        <p className="flex-1 whitespace-pre-wrap leading-relaxed text-[#1c1d21]">{it.question}</p>
        {icon}
      </div>
      {it.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={it.imageUrl} alt="Chart for this task" className="max-h-64 rounded border border-[#ded8cb]" />
      )}
      {it.kind === "writing" ? (
        <>
          <p className="whitespace-pre-wrap rounded-lg bg-[#faf8f4] p-3 leading-relaxed">{it.myAnswer || <span className="text-[#9aa1ad]">No answer</span>}</p>
          {it.given !== null ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
              <p className="font-semibold text-emerald-900">
                Marks: {num(it.given)} / {it.marks}
              </p>
              {it.feedback && <p className="mt-1 whitespace-pre-wrap text-emerald-950">{it.feedback}</p>}
            </div>
          ) : (
            it.myAnswer && <p className="text-xs text-[#68707f]">Waiting to be marked.</p>
          )}
        </>
      ) : (
        <div className="ml-5 space-y-1">
          <p>
            <span className="text-[#68707f]">Your answer: </span>
            <span className={it.result === "right" ? "text-emerald-700 font-semibold" : it.result === "wrong" ? "text-rose-700 font-semibold" : "text-[#9aa1ad]"}>
              {it.myAnswer || "left blank"}
            </span>
          </p>
          {it.result !== "right" && (
            <p>
              <span className="text-[#68707f]">Correct answer: </span>
              <span className="text-emerald-700 font-semibold">{it.correctAnswer}</span>
            </p>
          )}
          {it.explanation && <p className="text-[#525a68] italic">{it.explanation}</p>}
        </div>
      )}
    </div>
  );
}
