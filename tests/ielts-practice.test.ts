import { describe, expect, it } from "vitest";
import { buildIeltsPractice, isAcceptedAnswer, passageSentences } from "@/lib/study/ielts-practice";
import { englishTopic } from "@/lib/study/topics";

const story = {
  title: "Garment workers block Mirpur-10 again, demanding Tk 30,000 minimum wage",
  summary:
    "Garment workers are staging a protest by blocking the road at Mirpur 10 intersection in the capital, demanding that the minimum monthly wage be raised to Tk 30,000. At around 8:00 am today, workers from several garment factories blocked the road.",
  keyTakeaways: [
    "As a result of the blockade, the gates of Mirpur 10 metro station have been closed.",
    "The workers said they would continue the protest until 31 October unless the wage board acts.",
    "Factory owners said wages could rise by 70–80 per cent over three years.",
  ],
  factTable: [],
};
const others = [
  "West Indies defeated Bangladesh by eight wickets in the Mirpur Test on Saturday.",
  "Fishermen have returned to the sea after a 22-day fishing ban on hilsa catching.",
  "The public prosecutor's office in Switzerland's northern Aargau canton issued a statement.",
  "Researchers found a new species of frog in the Amazon rainforest last month.",
];

describe("IELTS reading practice", () => {
  const items = buildIeltsPractice(story, others);
  const passage = passageSentences(story).join(" ");

  it("builds up to 2 multiple-choice and 2 one-word completion questions", () => {
    expect(items.filter((i) => i.kind === "mcq").length).toBeLessThanOrEqual(2);
    expect(items.filter((i) => i.kind === "blank").length).toBeLessThanOrEqual(2);
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it("every correct answer is in the passage", () => {
    for (const it of items) {
      expect(passage).toContain(it.sourceSentence);
      const answer = it.kind === "mcq" ? it.options[it.correctIndex] : it.accepted[0];
      expect(it.sourceSentence.toLowerCase()).toContain(answer.toLowerCase());
    }
  });

  it("never asks about a place number or one end of a range", () => {
    const answers = items.filter((i) => i.kind === "mcq").map((i) => (i.kind === "mcq" ? i.options[i.correctIndex] : ""));
    expect(answers).not.toContain("10"); // "Mirpur 10" is a place
    expect(answers.some((a) => /^70|^80/.test(a))).toBe(false); // "70–80 per cent" is a range
  });

  it("keeps a day of the month between 1 and 31", () => {
    const day = buildIeltsPractice(
      { title: "Protest deadline", summary: "", keyTakeaways: ["The workers said they would continue the protest until 31 October unless the board acts."], factTable: [] },
      others
    ).find((i) => i.kind === "mcq" && i.question.includes("_____"));
    expect(day).toBeDefined();
    if (day && day.kind === "mcq")
      for (const o of day.options) {
        expect(Number(o)).toBeGreaterThanOrEqual(1);
        expect(Number(o)).toBeLessThanOrEqual(31);
      }
  });

  it("takes wrong statements only from other stories on other subjects", () => {
    const stmt = items.find((i) => i.kind === "mcq" && i.question.startsWith("Which of these statements"));
    if (stmt && stmt.kind === "mcq") {
      const wrong = stmt.options.filter((_, i) => i !== stmt.correctIndex);
      for (const w of wrong) expect(others).toContain(w);
    }
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
