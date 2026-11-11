import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeEqual } from "@/lib/session";
import { pushPublicKey, sendPush, type PushMessage } from "@/lib/push";
import { hasPremiumGoal } from "@/lib/study/progress";
import { addDays, bdDay, freezeAvailable, goalFor, goalPercent, type DayCounts } from "@/lib/study/daily-goal";
import { dueKinds, examReminder, mainReminder, rescueReminder, type ReaderState, type ReminderKind, type Teaser } from "@/lib/study/reminders";

export const dynamic = "force-dynamic";

/**
 * Sends the due reminder notifications. Called every 15 minutes by scripts/cron-worker.js
 * with "Authorization: Bearer <CRON_SECRET>". Safe to call as often as you like: each
 * kind goes to a device at most once a day, and never more than 2 a day in total.
 *   ?dryRun=true  work out what would be sent, send nothing
 */
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret || process.env.NODE_ENV === "production") {
    if (!secret) return false;
    const header = req.headers.get("authorization");
    return !!header && safeEqual(header, `Bearer ${secret}`);
  }
  return true;
}

const EMPTY: DayCounts = { stories: 0, mcqs: 0, mcqsCorrect: 0, words: 0, lookups: 0 };

/** One real MCQ from the newest stories, the same for everyone that day. */
async function pickTeaser(dayIndex: number): Promise<Teaser | null> {
  const since = new Date(Date.now() - 36 * 3600_000);
  const questions = await prisma.quizQuestion.findMany({
    where: { article: { createdAt: { gte: since }, dailyPick: true } },
    select: { question: true, article: { select: { slug: true } } },
    orderBy: { id: "asc" },
    take: 60,
  });
  const good = questions.filter((q) => q.question.length >= 20 && q.question.length <= 130);
  if (!good.length) return null;
  const q = good[dayIndex % good.length];
  return { question: q.question, slug: q.article.slug };
}

async function run(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!pushPublicKey() || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ success: true, skipped: "push keys are not set" });
  }
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";

  const now = Date.now();
  const today = bdDay(now);
  const hour = new Date(now + 6 * 3600_000).getUTCHours();
  const dayIndex = Math.floor(Date.parse(today + "T00:00:00Z") / 86400_000);

  const exam = await prisma.weeklyExam.findFirst({ where: { day: today, status: "scheduled" }, select: { id: true, title: true } });

  const devices = await prisma.pushDevice.findMany({ where: { enabled: true } });
  const due = devices
    .map((d) => ({
      d,
      kinds: dueKinds(
        { reminderHour: d.reminderHour, sentDay: d.sentDay, sentKinds: d.sentKinds ? d.sentKinds.split(",") : [] },
        today,
        hour,
        !!exam
      ),
    }))
    .filter((x) => x.kinds.length > 0);
  if (!due.length) return NextResponse.json({ success: true, hour, devices: devices.length, due: 0, sent: 0 });

  // Everything needed about the readers behind those devices, in a few queries
  const ids = [...new Set(due.map((x) => x.d.studentId).filter((v): v is string => !!v))];
  const [students, todayRows, lastRows, attempts, teaser] = await Promise.all([
    prisma.student.findMany({ where: { id: { in: ids } }, select: { id: true, streakDays: true, streakFreezeDay: true } }),
    prisma.dailyProgress.findMany({ where: { studentId: { in: ids }, day: today } }),
    prisma.dailyProgress.groupBy({ by: ["studentId"], where: { studentId: { in: ids }, day: { lt: today } }, _max: { day: true } }),
    exam ? prisma.examAttempt.findMany({ where: { examId: exam.id, studentId: { in: ids } }, select: { studentId: true } }) : Promise.resolve([]),
    pickTeaser(dayIndex),
  ]);
  const studentById = new Map(students.map((s) => [s.id, s]));
  const rowById = new Map(todayRows.map((r) => [r.studentId, r]));
  const lastById = new Map(lastRows.map((r) => [r.studentId, r._max.day]));
  const tookExam = new Set(attempts.map((a) => a.studentId));

  async function stateFor(studentId: string | null): Promise<ReaderState> {
    const s = studentId ? studentById.get(studentId) : undefined;
    const goal = goalFor(s ? await hasPremiumGoal(s.id) : true);
    if (!s) return { streak: null, streakAlive: false, activeToday: false, done: false, percent: 0, counts: EMPTY, goal };
    const row = rowById.get(s.id);
    const last = lastById.get(s.id) ?? null;
    const counts: DayCounts = row
      ? { stories: row.stories, mcqs: row.mcqs, mcqsCorrect: row.mcqsCorrect, words: row.words, lookups: row.lookups }
      : EMPTY;
    const alive =
      !!row || !last || last === addDays(today, -1) || (last === addDays(today, -2) && freezeAvailable(today, s.streakFreezeDay));
    return { streak: s.streakDays, streakAlive: alive, activeToday: !!row, done: row?.goalDone ?? false, percent: goalPercent(counts, goal), counts, goal };
  }

  const tally: Record<string, number> = { sent: 0, gone: 0, failed: 0, nothing: 0 };
  const preview: { kind: ReminderKind; title: string; body: string }[] = [];

  for (const { d, kinds } of due) {
    const state = await stateFor(d.studentId);
    let chosen: { kind: ReminderKind; message: PushMessage } | null = null;
    for (const kind of kinds) {
      const message =
        kind === "exam"
          ? exam && !(d.studentId && tookExam.has(d.studentId)) ? examReminder(exam.title) : null
          : kind === "main"
          ? mainReminder(state, teaser, dayIndex)
          : rescueReminder(state);
      if (message) {
        chosen = { kind, message };
        break;
      }
    }
    if (!chosen) {
      tally.nothing++;
      continue;
    }
    if (dryRun) {
      if (preview.length < 10) preview.push({ kind: chosen.kind, title: chosen.message.title, body: chosen.message.body });
      tally.sent++;
      continue;
    }
    const result = await sendPush(d, chosen.message);
    tally[result]++;
    if (result === "sent") {
      const already = d.sentDay === today && d.sentKinds ? d.sentKinds.split(",") : [];
      await prisma.pushDevice
        .update({ where: { id: d.id }, data: { sentDay: today, sentKinds: [...already, chosen.kind].join(",") } })
        .catch(() => {});
    }
  }

  return NextResponse.json({ success: true, dryRun, hour, devices: devices.length, due: due.length, ...tally, ...(dryRun ? { preview } : {}) });
}

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}
