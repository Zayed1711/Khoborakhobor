import { describe, expect, it } from "vitest";
import { examPhase, examProblems, examWindow, isFriday, nextExamFriday, questionProblems, TOTAL_MARKS, type QuestionLike } from "@/lib/exam/rules";

const mcq = (section: string, i = 0): QuestionLike => ({ section, kind: "mcq", question: `Q${i}?`, options: ["a", "b", "c", "d"], answer: "1", marks: 1 });

function fullExam(): QuestionLike[] {
  const qs: QuestionLike[] = [];
  for (const s of ["gk", "grammar", "english1", "ielts"]) for (let i = 0; i < 10; i++) qs.push(mcq(s, i));
  qs.push({ section: "writing", kind: "writing", question: "Discuss.", options: [], answer: "", marks: 5 });
  qs.push({ section: "chart", kind: "writing", question: "Describe the chart.", options: [], answer: "", marks: 5, imagePath: "abc.png" });
  return qs;
}

describe("weekly exam rules", () => {
  it("is 50 marks", () => expect(TOTAL_MARKS).toBe(50));

  it("opens 7 am and closes 12 pm Dhaka time (UTC+6)", () => {
    const w = examWindow("2026-11-13");
    expect(w.opensAt.toISOString()).toBe("2026-11-13T01:00:00.000Z");
    expect(w.closesAt.toISOString()).toBe("2026-11-13T06:00:00.000Z");
  });

  it("finds the next Friday that has not opened yet", () => {
    expect(nextExamFriday(Date.parse("2026-11-12T16:00:00Z"))).toBe("2026-11-13"); // Thu 10 pm Dhaka
    expect(nextExamFriday(Date.parse("2026-11-13T02:00:00Z"))).toBe("2026-11-20"); // Fri 8 am Dhaka: this one is open
    expect(isFriday("2026-11-13")).toBe(true);
    expect(isFriday("2026-11-12")).toBe(false);
  });

  it("phases follow the clock once scheduled", () => {
    expect(examPhase("draft", "2026-11-13", Date.parse("2026-11-13T02:00:00Z"))).toBe("draft");
    expect(examPhase("scheduled", "2026-11-13", Date.parse("2026-11-13T00:59:00Z"))).toBe("scheduled");
    expect(examPhase("scheduled", "2026-11-13", Date.parse("2026-11-13T01:00:00Z"))).toBe("live");
    expect(examPhase("scheduled", "2026-11-13", Date.parse("2026-11-13T06:00:00Z"))).toBe("closed");
  });

  it("a complete exam has no problems; missing marks, passage or image are reported", () => {
    expect(examProblems(fullExam(), { ielts: "A passage." })).toEqual([]);
    expect(examProblems(fullExam(), {})).toContain("IELTS Reading: add the reading passage.");
    const short = fullExam().filter((q, i) => i !== 0);
    expect(examProblems(short, { ielts: "x" })).toContain("General Knowledge: 9 of 10 marks filled.");
    const noImage = fullExam().map((q) => (q.section === "chart" ? { ...q, imagePath: null } : q));
    expect(examProblems(noImage, { ielts: "x" }).some((p) => p.includes("Upload the chart image"))).toBe(true);
  });

  it("checks each question type", () => {
    expect(questionProblems({ ...mcq("gk"), options: ["a", "a", "c", "d"] })).toContain("Two options are the same.");
    expect(questionProblems({ ...mcq("gk"), answer: "" })).toContain("Mark the correct option.");
    expect(questionProblems({ section: "ielts", kind: "tfng", question: "Statement", options: [], answer: "MAYBE", marks: 1 })).toContain("Choose TRUE, FALSE or NOT GIVEN.");
    expect(questionProblems({ section: "grammar", kind: "blank", question: "He go home.", options: [], answer: "goes", marks: 1 })).toContain("Put _____ where the answer goes.");
    expect(questionProblems({ section: "gk", kind: "tfng", question: "x", options: [], answer: "TRUE", marks: 1 })[0]).toMatch(/cannot have/);
  });
});

describe("question types per section", () => {
  it("every objective section can use MCQ, True/False and fill in the blank", () => {
    for (const section of ["gk", "grammar", "english1", "ielts"]) {
      expect(questionProblems({ section, kind: "tf", question: "Dhaka is the capital.", options: [], answer: "TRUE", marks: 1 })).toEqual([]);
      expect(questionProblems({ section, kind: "blank", question: "The capital is _____.", options: [], answer: "Dhaka", marks: 1 })).toEqual([]);
    }
  });
  it("Not Given only where there is a passage", () => {
    expect(questionProblems({ section: "gk", kind: "tfng", question: "x", options: [], answer: "TRUE", marks: 1 })[0]).toMatch(/cannot have/);
    expect(questionProblems({ section: "english1", kind: "tfng", question: "x", options: [], answer: "NOT GIVEN", marks: 1 })).toEqual([]);
  });
  it("True/False needs TRUE or FALSE", () => {
    expect(questionProblems({ section: "gk", kind: "tf", question: "x", options: [], answer: "NOT GIVEN", marks: 1 })).toContain("Choose TRUE or FALSE.");
  });
});

describe("IELTS second passage", () => {
  const withSecond = () => fullExam().map((q, i) => (q.section === "ielts" && i % 2 ? { ...q, passageNo: 2 } : q));
  it("questions on passage 2 need passage 2's text", () => {
    expect(examProblems(withSecond(), { ielts: "First." })).toContain("IELTS Reading: add passage 2, or move its questions to passage 1.");
    expect(examProblems(withSecond(), { ielts: "First.", ielts2: "Second." })).toEqual([]);
  });
  it("passage 2's text needs at least one question", () => {
    expect(examProblems(fullExam(), { ielts: "First.", ielts2: "Second." })).toContain("IELTS Reading: passage 2 has no questions yet.");
  });
  it("passage 2 is optional", () => {
    expect(examProblems(fullExam(), { ielts: "First." })).toEqual([]);
  });
});

import { buildExtractiveQuiz } from "@/lib/study/extractive";

describe("job-mode quiz options stay possible", () => {
  it("a percentage never becomes more than 100", () => {
    const q = buildExtractiveQuiz(
      "এইচএসসিতে পাসের হার কমেছে",
      "এবার পাস করেছেন ৫১ দশমিক ৬২ শতাংশ পরীক্ষার্থী। এ বছর সিলেট বোর্ডে পাসের হার ৮৯.৫০ শতাংশ, যা গত বছরের চেয়ে কম। মোট পরীক্ষার্থী ছিলেন ১২ লাখ ৩৪ হাজার জন।"
    );
    if (q) {
      for (const o of q.options) {
        const n = Number(o.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).match(/[0-9.]+/)?.[0]);
        if (/শতাংশ/.test(o)) expect(n).toBeLessThanOrEqual(100);
      }
    }
  });
});
