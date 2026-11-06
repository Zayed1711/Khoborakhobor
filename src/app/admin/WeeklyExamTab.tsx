"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  CheckCircle2,
  FileText,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createExamAction,
  deleteExamAction,
  deleteQuestionAction,
  getExamAction,
  getExamSourcesAction,
  listExamsAction,
  moveQuestionAction,
  saveExamMetaAction,
  saveQuestionAction,
  setExamScheduledAction,
  type AdminExam,
  type AdminExamQuestion,
  type EnglishStory,
  type QuestionInput,
  type SourceNote,
} from "@/actions/exam-admin";
import { EXAM_MINUTES, NEGATIVE_MARK, SECTIONS, TFNG, TOTAL_MARKS, sectionMarks, type QuestionKind, type SectionId } from "@/lib/exam/rules";
import type { KeyNoteDay } from "@/lib/study/key-notes";

type Notify = (type: "success" | "error" | "info", msg: string) => void;

const KIND_LABEL: Record<QuestionKind, string> = {
  mcq: "Multiple choice",
  tfng: "True / False / Not Given",
  blank: "Fill in the blank",
  writing: "Writing task",
};

const PHASE: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-[#212936] text-[#c8d0da]" },
  scheduled: { label: "Scheduled", cls: "bg-sky-900/60 text-sky-200" },
  live: { label: "Live now", cls: "bg-emerald-900/60 text-emerald-200" },
  closed: { label: "Closed", cls: "bg-[#2a1f1f] text-rose-200" },
};

const fmtDay = (day: string) =>
  new Date(day + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

/** Admin: write the Friday exam by hand, from the last 7 days of key notes. */
export default function WeeklyExamTab({ showNotify }: { showNotify: Notify }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return openId ? (
    <ExamBuilder id={openId} onBack={() => setOpenId(null)} notify={showNotify} />
  ) : (
    <ExamList onOpen={setOpenId} notify={showNotify} />
  );
}

// ---------------------------------------------------------------------------
// Exam list
// ---------------------------------------------------------------------------

function ExamList({ onOpen, notify }: { onOpen: (id: string) => void; notify: Notify }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof listExamsAction>> | null>(null);
  const [day, setDay] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    listExamsAction()
      .then((r) => live && setData(r))
      .catch(() => live && setData({ nextFriday: "", exams: [] }));
    return () => {
      live = false;
    };
  }, []);

  const create = async (d: string) => {
    setBusy(true);
    const r = await createExamAction(d);
    setBusy(false);
    if (r.ok) onOpen(r.id);
    else notify("error", r.message);
  };

  if (!data) return <Spinner />;
  const target = day || data.nextFriday;
  const hasNext = data.exams.some((e) => e.day === data.nextFriday);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#212936] bg-[#141b24] p-5 space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#f5c66b]" /> Weekly exam
        </h3>
        <p className="text-sm text-[#8e9aa8] leading-relaxed">
          Friday 7:00 am – 12:00 pm · {EXAM_MINUTES} minutes · {TOTAL_MARKS} marks ({SECTIONS.map((s) => `${s.label} ${s.marks}`).join(", ")}) · −{NEGATIVE_MARK} for a
          wrong objective answer. Write it on Thursday and press Schedule; it opens by itself on Friday morning.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {!hasNext && data.nextFriday && (
            <button onClick={() => create(data.nextFriday)} disabled={busy} className="px-4 py-2 rounded-lg bg-[#f5c66b] text-[#0b1017] text-sm font-semibold disabled:opacity-50">
              <Plus className="w-4 h-4 inline -mt-0.5 mr-1" />
              Create exam for {fmtDay(data.nextFriday)}
            </button>
          )}
          <span className="text-xs text-[#8e9aa8]">or another Friday:</span>
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="rounded-lg bg-[#0b1017] border border-[#212936] px-2 py-1.5 text-sm text-white"
            aria-label="Exam date"
          />
          {day && (
            <button onClick={() => create(target)} disabled={busy} className="px-3 py-1.5 rounded-lg border border-[#f5c66b] text-[#f5c66b] text-sm font-semibold">
              Create
            </button>
          )}
        </div>
      </div>

      {data.exams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#212936] p-8 text-center text-sm text-[#8e9aa8]">No exams yet.</p>
      ) : (
        <div className="grid gap-2">
          {data.exams.map((e) => (
            <button
              key={e.id}
              onClick={() => onOpen(e.id)}
              className="text-left rounded-xl border border-[#212936] bg-[#141b24] hover:border-[#f5c66b]/60 p-4 flex flex-wrap items-center gap-3"
            >
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PHASE[e.phase].cls}`}>{PHASE[e.phase].label}</span>
              <span className="text-white font-semibold">{e.title}</span>
              <span className="text-xs text-[#8e9aa8] ml-auto">
                {e.questionCount} questions · {e.ready ? "complete" : "incomplete"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

interface Editing {
  section: SectionId;
  draft: QuestionInput;
}

function blankDraft(section: SectionId, sourceNote: SourceNote | null = null): QuestionInput {
  const sec = SECTIONS.find((s) => s.id === section)!;
  return {
    section,
    kind: sec.kinds[0],
    question: "",
    options: ["", "", "", ""],
    answer: sec.kinds[0] === "tfng" ? "TRUE" : "",
    explanation: sourceNote?.point || "",
    imagePath: null,
    sourceNote,
  };
}

function ExamBuilder({ id, onBack, notify }: { id: string; onBack: () => void; notify: Notify }) {
  const [exam, setExam] = useState<AdminExam | null>(null);
  const [sources, setSources] = useState<{ bn: KeyNoteDay[]; en: KeyNoteDay[]; stories: EnglishStory[] } | null>(null);
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [busy, setBusy] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    let live = true;
    getExamAction(id)
      .then((r) => live && setExam(r))
      .catch(() => live && setExam(null));
    return () => {
      live = false;
    };
  }, [id, version]);

  useEffect(() => {
    let live = true;
    getExamSourcesAction()
      .then((r) => live && setSources(r))
      .catch(() => live && setSources({ bn: [], en: [], stories: [] }));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (editing) editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [editing?.section, editing?.draft.id, editing?.draft.sourceNote?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!exam) return <Spinner />;
  const locked = exam.phase === "live" || exam.phase === "closed";
  const filled = sectionMarks(exam.questions);

  const run = async (fn: () => Promise<{ ok: boolean; message?: string }>, success?: string) => {
    setBusy(true);
    try {
      const r = await fn();
      if (r.ok) {
        if (success) notify("success", success);
        reload();
        return true;
      }
      notify("error", r.message || "Could not save.");
    } catch (e) {
      notify("error", errMsg(e));
    } finally {
      setBusy(false);
    }
    return false;
  };

  const startFromNote = (section: SectionId, note: SourceNote) => {
    const sec = SECTIONS.find((s) => s.id === section)!;
    if (filled[section] >= sec.marks) return notify("info", `${sec.label} is already full.`);
    setEditing({ section, draft: blankDraft(section, note) });
  };

  const usePassage = async (section: SectionId, story: EnglishStory) => {
    await run(() => saveExamMetaAction(exam.id, { passages: { ...exam.passages, [section]: story.text } }), `Passage set for ${SECTIONS.find((s) => s.id === section)!.label}.`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-[#212936] bg-[#141b24] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg border border-[#212936] text-[#8e9aa8] hover:text-white" aria-label="Back to exam list">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PHASE[exam.phase].cls}`}>{PHASE[exam.phase].label}</span>
          <input
            key={exam.title}
            defaultValue={exam.title}
            disabled={locked}
            onBlur={(e) => e.target.value !== exam.title && run(() => saveExamMetaAction(exam.id, { title: e.target.value }))}
            className="flex-1 min-w-[220px] bg-transparent text-white font-semibold text-lg outline-none border-b border-transparent focus:border-[#f5c66b]"
            aria-label="Exam title"
          />
          <span className="text-xs text-[#8e9aa8]">{fmtDay(exam.day)} · 7:00 am – 12:00 pm</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SECTIONS.map((s) => (
            <span
              key={s.id}
              className={`text-xs px-2 py-1 rounded-md border ${filled[s.id] === s.marks ? "border-emerald-700 text-emerald-300" : "border-[#212936] text-[#8e9aa8]"}`}
            >
              {s.label} {filled[s.id]}/{s.marks}
            </span>
          ))}
          <span className="ml-auto flex gap-2">
            {!locked && exam.phase === "draft" && (
              <button
                onClick={() => run(() => setExamScheduledAction(exam.id, true), "Scheduled. It opens by itself on Friday at 7:00 am.")}
                disabled={busy || exam.problems.length > 0}
                title={exam.problems[0] || ""}
                className="px-4 py-2 rounded-lg bg-[#f5c66b] text-[#0b1017] text-sm font-semibold disabled:opacity-40"
              >
                Schedule
              </button>
            )}
            {exam.phase === "scheduled" && (
              <button onClick={() => run(() => setExamScheduledAction(exam.id, false), "Moved back to draft.")} className="px-4 py-2 rounded-lg border border-[#212936] text-sm text-[#c8d0da]">
                Back to draft
              </button>
            )}
            {!locked && (
              <button
                onClick={() => {
                  if (confirm("Delete this exam and all its questions?")) run(() => deleteExamAction(exam.id)).then((ok) => ok && onBack());
                }}
                className="p-2 rounded-lg border border-[#3a2323] text-rose-300 hover:bg-[#2a1f1f]"
                aria-label="Delete exam"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </span>
        </div>

        {locked ? (
          <p className="text-sm text-emerald-300">This exam has opened, so its questions are locked.</p>
        ) : exam.problems.length > 0 ? (
          <details className="text-sm text-[#e7c27a]">
            <summary className="cursor-pointer">{exam.problems.length} things left before it can be scheduled</summary>
            <ul className="list-disc ml-5 mt-1 space-y-0.5 text-[#c8d0da]">
              {exam.problems.slice(0, 20).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </details>
        ) : (
          exam.phase === "draft" && (
            <p className="text-sm text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Complete. Press Schedule when you are happy with it.
            </p>
          )
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 items-start">
        {/* Left: source material */}
        <SourcePanel sources={sources} locked={locked} onUseNote={startFromNote} onUsePassage={usePassage} />

        {/* Right: the paper */}
        <div className="space-y-4">
          {SECTIONS.map((sec) => {
            const qs = exam.questions.filter((q) => q.section === sec.id);
            const full = filled[sec.id] >= sec.marks;
            return (
              <section key={sec.id} className="rounded-xl border border-[#212936] bg-[#141b24] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold">{sec.label}</h3>
                  <span className={`text-xs ${filled[sec.id] === sec.marks ? "text-emerald-300" : "text-[#8e9aa8]"}`}>
                    {filled[sec.id]}/{sec.marks} marks
                  </span>
                  {!locked && !full && (
                    <button
                      onClick={() => setEditing({ section: sec.id, draft: blankDraft(sec.id) })}
                      className="ml-auto text-xs px-2.5 py-1 rounded-lg border border-[#f5c66b]/60 text-[#f5c66b] hover:bg-[#f5c66b]/10"
                    >
                      <Plus className="w-3.5 h-3.5 inline -mt-0.5" /> {sec.writing ? "Add task" : "Add question"}
                    </button>
                  )}
                </div>

                {sec.passage !== "none" && (
                  <PassageBox
                    key={exam.passages[sec.id] || ""}
                    label={sec.passage === "required" ? "Reading passage (required)" : "Reading passage (optional)"}
                    value={exam.passages[sec.id] || ""}
                    locked={locked}
                    onSave={(text) => run(() => saveExamMetaAction(exam.id, { passages: { ...exam.passages, [sec.id]: text } }), "Passage saved.")}
                  />
                )}

                {qs.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    n={i + 1}
                    locked={locked || busy}
                    first={i === 0}
                    last={i === qs.length - 1}
                    onEdit={() => setEditing({ section: sec.id, draft: { ...q } })}
                    onMove={(d) => run(() => moveQuestionAction(exam.id, q.id, d))}
                    onDelete={() => confirm("Delete this question?") && run(() => deleteQuestionAction(exam.id, q.id))}
                  />
                ))}

                {editing?.section === sec.id && (
                  <div ref={editorRef}>
                    <QuestionEditor
                      key={(editing.draft.id || "new") + (editing.draft.sourceNote?.slug || "")}
                      initial={editing.draft}
                      busy={busy}
                      onCancel={() => setEditing(null)}
                      onSave={async (d) => {
                        const ok = await run(() => saveQuestionAction(exam.id, d), "Question saved.");
                        if (ok) setEditing(null);
                      }}
                      onError={(m) => notify("error", m)}
                    />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left pane: key notes and English stories
// ---------------------------------------------------------------------------

function SourcePanel({
  sources,
  locked,
  onUseNote,
  onUsePassage,
}: {
  sources: { bn: KeyNoteDay[]; en: KeyNoteDay[]; stories: EnglishStory[] } | null;
  locked: boolean;
  onUseNote: (section: SectionId, note: SourceNote) => void;
  onUsePassage: (section: SectionId, story: EnglishStory) => void;
}) {
  const [tab, setTab] = useState<"bn" | "en" | "stories">("bn");
  const objective = SECTIONS.filter((s) => !s.writing);

  return (
    <aside className="rounded-xl border border-[#212936] bg-[#141b24] p-4 space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="flex gap-1 text-xs">
        {(
          [
            ["bn", "Job notes (7 days)"],
            ["en", "English notes"],
            ["stories", "English stories"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-2.5 py-1.5 rounded-lg font-semibold ${tab === k ? "bg-[#f5c66b] text-[#0b1017]" : "text-[#8e9aa8] hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!sources ? (
        <Spinner />
      ) : tab === "stories" ? (
        sources.stories.length === 0 ? (
          <p className="text-sm text-[#8e9aa8]">No English stories in the last 7 days.</p>
        ) : (
          sources.stories.map((s) => (
            <details key={s.slug} className="rounded-lg border border-[#212936] bg-[#0b1017] p-3 text-sm">
              <summary className="cursor-pointer text-white font-medium">{s.title}</summary>
              <p className="text-xs text-[#8e9aa8] mt-1">{fmtDay(s.day)}</p>
              <p className="whitespace-pre-wrap text-[#c8d0da] mt-2 leading-relaxed">{s.text}</p>
              {!locked && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {SECTIONS.filter((x) => x.passage !== "none").map((x) => (
                    <button key={x.id} onClick={() => onUsePassage(x.id, s)} className="text-xs px-2 py-1 rounded-md border border-[#f5c66b]/60 text-[#f5c66b]">
                      <FileText className="w-3 h-3 inline -mt-0.5 mr-1" />
                      Use as {x.label} passage
                    </button>
                  ))}
                </div>
              )}
            </details>
          ))
        )
      ) : (
        (tab === "bn" ? sources.bn : sources.en).map((d) => (
          <div key={d.day} className="space-y-2">
            <p className="text-xs font-semibold text-[#f5c66b]">{fmtDay(d.day)}</p>
            {d.items.length === 0 && <p className="text-xs text-[#8e9aa8]">No notes this day.</p>}
            {d.items.map((n) => {
              const note: SourceNote = { day: d.day, slug: n.slug, title: n.title, point: n.point };
              return (
                <div key={n.slug} className="rounded-lg border border-[#212936] bg-[#0b1017] p-3 text-sm space-y-1.5">
                  <a href={`/article/${encodeURIComponent(n.slug)}`} target="_blank" rel="noreferrer" className="block text-white font-medium hover:text-[#f5c66b]">
                    {n.title}
                  </a>
                  <p className="text-[#c8d0da] leading-relaxed">{n.point}</p>
                  {!locked && (
                    <select
                      value=""
                      onChange={(e) => e.target.value && onUseNote(e.target.value as SectionId, note)}
                      className="text-xs rounded-md bg-[#141b24] border border-[#212936] px-2 py-1 text-[#f5c66b]"
                      aria-label={`Make a question from: ${n.title}`}
                    >
                      <option value="">+ Make a question in…</option>
                      {objective.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                      <option value="writing">Argumentative Writing</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Right pane pieces
// ---------------------------------------------------------------------------

function PassageBox({ label, value, locked, onSave }: { label: string; value: string; locked: boolean; onSave: (t: string) => void }) {
  const [text, setText] = useState(value);
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-[#8e9aa8]">{label} — pick a story on the left or paste your own text.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
        rows={text ? 6 : 2}
        aria-label={label}
        className="w-full rounded-lg bg-[#0b1017] border border-[#212936] p-3 text-sm text-white leading-relaxed outline-none focus:border-[#f5c66b]"
      />
      {!locked && text !== value && (
        <button onClick={() => onSave(text)} className="text-xs px-3 py-1.5 rounded-lg bg-[#f5c66b] text-[#0b1017] font-semibold">
          Save passage
        </button>
      )}
    </div>
  );
}

function QuestionCard({
  q,
  n,
  locked,
  first,
  last,
  onEdit,
  onMove,
  onDelete,
}: {
  q: AdminExamQuestion;
  n: number;
  locked: boolean;
  first: boolean;
  last: boolean;
  onEdit: () => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-[#212936] bg-[#0b1017] p-3 text-sm space-y-2">
      <div className="flex items-start gap-2">
        <span className="font-bold text-[#f5c66b]">{n}.</span>
        <p className="flex-1 text-white whitespace-pre-wrap leading-relaxed">{q.question}</p>
        {!locked && (
          <span className="flex gap-1 shrink-0">
            <IconBtn label="Move up" disabled={first} onClick={() => onMove(-1)}>
              <ArrowUp className="w-3.5 h-3.5" />
            </IconBtn>
            <IconBtn label="Move down" disabled={last} onClick={() => onMove(1)}>
              <ArrowDown className="w-3.5 h-3.5" />
            </IconBtn>
            <IconBtn label="Edit" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </IconBtn>
            <IconBtn label="Delete" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </IconBtn>
          </span>
        )}
      </div>
      {q.kind === "mcq" && (
        <ol className="grid sm:grid-cols-2 gap-1 ml-5">
          {q.options.map((o, i) => (
            <li key={i} className={String(i) === q.answer ? "text-emerald-300 font-semibold" : "text-[#c8d0da]"}>
              {String.fromCharCode(65 + i)}. {o}
            </li>
          ))}
        </ol>
      )}
      {(q.kind === "tfng" || q.kind === "blank") && <p className="ml-5 text-emerald-300 font-semibold">Answer: {q.answer}</p>}
      {q.imagePath && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/exam-image/${q.imagePath}`} alt="Chart for this task" className="ml-5 max-h-56 rounded border border-[#212936] bg-white" />
      )}
      <div className="ml-5 flex flex-wrap gap-2 text-xs text-[#8e9aa8]">
        <span>{KIND_LABEL[q.kind]}</span>
        <span>· {q.marks} {q.marks === 1 ? "mark" : "marks"}</span>
        {q.sourceNote && <span className="truncate max-w-[22rem]">· from: {q.sourceNote.title}</span>}
      </div>
      {q.explanation && <p className="ml-5 text-xs text-[#8e9aa8] italic">Explanation: {q.explanation}</p>}
    </div>
  );
}

function IconBtn({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className="p-1.5 rounded-md border border-[#212936] text-[#8e9aa8] hover:text-white disabled:opacity-30">
      {children}
    </button>
  );
}

function QuestionEditor({
  initial,
  busy,
  onSave,
  onCancel,
  onError,
}: {
  initial: QuestionInput;
  busy: boolean;
  onSave: (d: QuestionInput) => void;
  onCancel: () => void;
  onError: (m: string) => void;
}) {
  const sec = SECTIONS.find((s) => s.id === initial.section)!;
  const [d, setD] = useState<QuestionInput>({ ...initial, options: initial.options?.length === 4 ? initial.options : ["", "", "", ""] });
  const [uploading, setUploading] = useState(false);
  const set = (patch: Partial<QuestionInput>) => setD((x) => ({ ...x, ...patch }));

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await fetch("/api/admin/exam-image", { method: "POST", body: form }).then((res) => res.json());
      if (r.ok) set({ imagePath: r.name });
      else onError(r.message || "Upload failed.");
    } catch {
      onError("Upload failed.");
    }
    setUploading(false);
  };

  const input = "w-full rounded-lg bg-[#0b1017] border border-[#212936] px-3 py-2 text-sm text-white outline-none focus:border-[#f5c66b]";

  return (
    <div className="rounded-lg border border-[#f5c66b]/50 bg-[#10161f] p-4 space-y-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-[#f5c66b] font-semibold">{initial.id ? "Edit" : "New"} — {sec.label}</span>
        <button onClick={onCancel} className="ml-auto p-1 text-[#8e9aa8] hover:text-white" aria-label="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>

      {d.sourceNote && (
        <div className="rounded-md border border-[#212936] bg-[#0b1017] p-2 text-xs text-[#c8d0da]">
          <span className="text-[#8e9aa8]">From the note ({fmtDay(d.sourceNote.day)}): </span>
          {d.sourceNote.point}
          <button onClick={() => set({ sourceNote: null })} className="ml-2 text-[#8e9aa8] hover:text-white underline">
            remove
          </button>
        </div>
      )}

      {sec.kinds.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sec.kinds.map((k) => (
            <button
              key={k}
              onClick={() => set({ kind: k, answer: k === "tfng" ? "TRUE" : k === "mcq" ? "" : d.kind === "blank" ? d.answer : "" })}
              className={`px-2.5 py-1 rounded-md border text-xs ${d.kind === k ? "border-[#f5c66b] text-[#f5c66b]" : "border-[#212936] text-[#8e9aa8]"}`}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-xs text-[#8e9aa8]">
          {sec.writing ? "Task (what the student must write about)" : d.kind === "blank" ? "Sentence — put _____ where the answer goes" : d.kind === "tfng" ? "Statement" : "Question"}
        </span>
        <textarea value={d.question} onChange={(e) => set({ question: e.target.value })} rows={sec.writing ? 4 : 2} className={input} />
      </label>

      {d.kind === "mcq" && (
        <div className="space-y-2">
          <span className="text-xs text-[#8e9aa8]">Options — tick the correct one</span>
          {(d.options || []).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={d.answer === String(i)}
                onChange={() => set({ answer: String(i) })}
                aria-label={`Option ${String.fromCharCode(65 + i)} is correct`}
                className="accent-[#f5c66b]"
              />
              <span className="text-[#8e9aa8] w-4">{String.fromCharCode(65 + i)}</span>
              <input
                value={o}
                onChange={(e) => set({ options: (d.options || []).map((x, j) => (j === i ? e.target.value : x)) })}
                className={input}
                aria-label={`Option ${String.fromCharCode(65 + i)}`}
              />
            </div>
          ))}
        </div>
      )}

      {d.kind === "tfng" && (
        <div className="flex gap-3">
          {TFNG.map((t) => (
            <label key={t} className="flex items-center gap-1.5 text-white">
              <input type="radio" name="tfng" checked={d.answer === t} onChange={() => set({ answer: t })} className="accent-[#f5c66b]" />
              {t}
            </label>
          ))}
        </div>
      )}

      {d.kind === "blank" && (
        <label className="block space-y-1">
          <span className="text-xs text-[#8e9aa8]">Accepted answer(s) — separate other forms with / (e.g. “inflation / inflations”)</span>
          <input value={d.answer || ""} onChange={(e) => set({ answer: e.target.value })} className={input} />
        </label>
      )}

      {sec.image && (
        <div className="space-y-2">
          <span className="text-xs text-[#8e9aa8]">Chart image (PNG, JPG or WebP, up to 3 MB)</span>
          {d.imagePath && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/exam-image/${d.imagePath}`} alt="Uploaded chart" className="max-h-64 rounded border border-[#212936] bg-white" />
          )}
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#212936] text-[#c8d0da] cursor-pointer hover:text-white">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {d.imagePath ? "Replace image" : "Upload image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      {!sec.writing && (
        <label className="block space-y-1">
          <span className="text-xs text-[#8e9aa8]">Explanation (shown to students after the exam closes)</span>
          <textarea value={d.explanation || ""} onChange={(e) => set({ explanation: e.target.value })} rows={2} className={input} />
        </label>
      )}

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-[#212936] text-[#c8d0da]">
          Cancel
        </button>
        <button onClick={() => onSave(d)} disabled={busy || uploading} className="px-4 py-1.5 rounded-lg bg-[#f5c66b] text-[#0b1017] font-semibold disabled:opacity-50">
          {busy ? "Saving…" : "Save question"}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-10 text-[#8e9aa8]">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}
