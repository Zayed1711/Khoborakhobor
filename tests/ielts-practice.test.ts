import { describe, expect, it } from "vitest";
import { buildIeltsPractice, isAcceptedAnswer } from "@/lib/study/ielts-practice";
import { extractPassage, sentencesOf } from "@/lib/study/passage";
import { englishTopic } from "@/lib/study/topics";

const title = "Garment workers block Mirpur-10 again, demanding Tk 30,000 minimum wage";
const article = `
<p>Garment workers are staging a protest by blocking the road at Mirpur 10 intersection.Workers demand that the minimum monthly wage be raised to Tk 30,000.</p>
<p>Garment workers are staging a protest by blocking the road at Mirpur 10 intersection.</p>
<p>At around 8:00 am today, Sunday, workers from several garment factories blocked the road. This has disrupted traffic in the surrounding area.</p>
<p>“Everyone tries to beat us, if we get in a comfort zone we get in trouble.</p>
<p>As a result of the blockade, the gates of Mirpur 10 metro station have been closed. Police said 12 platoons of officers were sent to the area.</p>
<p>The workers said they would continue the protest until 31 October unless the wage board acts. Factory owners said wages could rise by 70–80 per cent over three years.</p>
<p>Read more: Garment sector news</p>
<p>The wage board met for 10 hours on Tuesday but reached no decision on the new minimum wage for workers.</p>
`;

describe("reading passage (a part of the article)", () => {
  const passage = extractPassage(article);
  const text = passage.flat().join(" ");
  const words = text.split(/\s+/).length;

  it("is 40–150 words of whole sentences from the opening", () => {
    expect(words).toBeGreaterThanOrEqual(40);
    expect(words).toBeLessThanOrEqual(150);
    expect(text.startsWith("Garment workers are staging a protest")).toBe(true);
  });

  it("restores missing spaces and drops repeated sentences", () => {
    expect(text).toContain("intersection. Workers demand");
    expect(text.split("Garment workers are staging a protest").length).toBe(2);
  });

  it("leaves out publisher chrome and quotes without a speaker", () => {
    expect(text).not.toContain("Read more");
    expect(text).not.toContain("Everyone tries to beat us");
  });

  it("keeps abbreviations inside their sentence", () => {
    expect(sentencesOf("Deputy Commissioner Md. Nurul Karim said five platoons were deployed. More will follow.")).toEqual([
      "Deputy Commissioner Md. Nurul Karim said five platoons were deployed.",
      "More will follow.",
    ]);
  });

  it("is empty when the article text is missing", () => {
    expect(extractPassage("")).toEqual([]);
  });
});

describe("IELTS reading practice (from the passage only)", () => {
  const passage = extractPassage(article).flat();
  const text = passage.join(" ");
  const items = buildIeltsPractice(passage, title);

  it("builds 3–4 questions of mixed types", () => {
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.length).toBeLessThanOrEqual(4);
    expect(new Set(items.map((i) => i.kind)).size).toBeGreaterThanOrEqual(2);
  });

  it("every question is answerable from the passage alone", () => {
    for (const it of items) {
      expect(text).toContain(it.sourceSentence);
      if (it.kind === "mcq") expect(it.sourceSentence).toContain(it.options[it.correctIndex]);
      if (it.kind === "blank") expect(it.sourceSentence.toLowerCase()).toContain(it.accepted[0]);
      if (it.kind === "tf" && it.answer === "TRUE") expect(it.question).toBe(it.sourceSentence);
      if (it.kind === "tf" && it.answer === "FALSE") expect(it.question).not.toBe(it.sourceSentence);
    }
  });

  it("never asks about a place number, time, range or compound word", () => {
    const answers = items.filter((i) => i.kind === "mcq").map((i) => (i.kind === "mcq" ? i.options[i.correctIndex] : ""));
    for (const bad of ["10", "8", "70", "80"]) expect(answers).not.toContain(bad);
    const tenMan = buildIeltsPractice(["Bournemouth came from behind to win 3-1 at 10-man Sparta Prague on Thursday night."], "Bournemouth stay perfect");
    expect(tenMan.filter((i) => i.kind === "mcq")).toEqual([]);
  });

  it("keeps a day of the month between 1 and 31", () => {
    const day = buildIeltsPractice(["The workers said they would continue the protest until 31 October unless the board acts."], "Protest deadline").find(
      (i) => i.kind === "mcq"
    );
    expect(day).toBeDefined();
    if (day && day.kind === "mcq")
      for (const o of day.options) {
        expect(Number(o)).toBeGreaterThanOrEqual(1);
        expect(Number(o)).toBeLessThanOrEqual(31);
      }
  });

  it("uses no sentences from other stories", () => {
    for (const it of items) if (it.kind === "mcq") for (const o of it.options) expect(o.length).toBeLessThan(40);
  });

  it("accepts a typed answer regardless of case, spacing and singular/plural", () => {
    expect(isAcceptedAnswer(" Workers ", ["workers", "worker"])).toBe(true);
    expect(isAcceptedAnswer("worker", ["workers", "worker"])).toBe(true);
    expect(isAcceptedAnswer("owners", ["workers", "worker"])).toBe(false);
    expect(isAcceptedAnswer("", ["workers"])).toBe(false);
  });
});


describe("English topics", () => {
  it.each([
    ["HSC results: Sylhet Board pass rate stands at 50.90pc", "Education"],
    ["Government forms new wage board to increase garment workers' salaries", "Economy"],
    ["Hilsa returns to Fishery Ghat as ban ends", "Environment"],
    ["US approves $2.1 billion Patriot missile sale to Ukraine", "International"],
    ["West Indies crush Bangladesh by eight wickets in Mirpur Test", "Sport & Culture"],
    ["Dengue cases rise as hospitals fill up", "Health"],
  ])("%s → %s", (title, topic) => {
    expect(englishTopic(title)).toBe(topic);
  });
});

describe("practice edge cases from real stories", () => {
  it("skips stock codes and repeats the same blank answer only once", () => {
    const items = buildIeltsPractice(
      [
        "It is home to oil giant Saudi Aramco's 2222.SE headquarters in the Eastern Region of the kingdom.",
        "Fishermen have returned to the sea after the fishing ban on hilsa ended this week.",
        "With the return of hilsa after the ban, the fishing port has once again come alive.",
      ],
      "Hilsa returns to Fishery Ghat as ban ends"
    );
    expect(items.some((i) => i.kind === "mcq" && i.options.includes("2222"))).toBe(false);
    expect(items.filter((i) => i.kind === "blank").length).toBe(1);
  });
});
