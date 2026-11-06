import { describe, expect, it } from "vitest";
import { ENGLISH_TOPICS, englishTopic } from "@/lib/study/topics";
import { WRITING_MAX_WORDS, WRITING_MIN_WORDS, wordCount, writingTaskFor } from "@/lib/study/writing-prompts";

const task = (title: string, summary = "") => writingTaskFor({ id: title, title, summary }, englishTopic(title, summary));

describe("writing task follows the story's core theme", () => {
  // Real headlines from the live site that used to get an unrelated prompt
  it.each([
    ["Bournemouth stay perfect in Europa League as Milan lose again", "Football"],
    ["West Indies crush Bangladesh by eight wickets in Mirpur Test", "Cricket"],
    ["Gold price drops by Tk2,739 per bhori", "Gold & prices"],
    ["India makes visa mandatory for 6 minority groups from Bangladesh, Afghanistan, Pakistan", "Visas, borders & refugees"],
    ["Bangladesh seeks climate justice, grants, accountability at COP31", "Climate change"],
    ["DMP bans rallies, protests around parliament ahead of Nov 9 session", "Protests & public order"],
    ["Islami Bank to increase authorised capital by Tk 80 billion", "Banking & loans"],
    ["Developing countries' external debt hit record $9.4t in 2025: World Bank", "Debt & development"],
    ["Global tech stocks plunge as US midterms add to AI slowdown fears", "Stock markets"],
    ["Kumarkhali loses Tk 35C in potential farm output annually to waterlogging", "Farming & food"],
    ["45th BCS: Re-verification begins for candidates left out of gazette, decision expected this week", "BCS & government jobs"],
    ["Undertrial prisoner in murder case dies in Kashimpur Central Jail", "Prisons"],
    ["Garment workers block Mirpur-10 again, demanding Tk 30,000 minimum wage", "Wages & workers"],
    ["HSC results: Sylhet Board pass rate stands at 50.90pc", "Exams & results"],
    ["Hilsa returns to Fishery Ghat as ban ends", "Rivers & fishing"],
  ])("%s → %s", (title, theme) => {
    expect(task(title).theme).toBe(theme);
  });

  it("the football story gets a football prompt, not a protest one", () => {
    const t = task("Bournemouth stay perfect in Europa League as Milan lose again", "Bournemouth extended their perfect Europa League record on Thursday.");
    expect(t.prompt.toLowerCase()).toContain("football");
  });

  it("a story always gets the same prompt", () => {
    expect(task("Gold price drops by Tk2,739 per bhori")).toEqual(task("Gold price drops by Tk2,739 per bhori"));
  });

  it("falls back to the broad topic when no theme fits", () => {
    const t = writingTaskFor({ id: "x", title: "Something entirely unusual happened today" }, "Society");
    expect(t.theme).toBe("Society");
    expect(t.prompt.length).toBeGreaterThan(40);
  });

  it("every broad topic has a fallback prompt", () => {
    for (const topic of ENGLISH_TOPICS) expect(writingTaskFor({ id: "z", title: "Zzz qqq" }, topic).prompt.length).toBeGreaterThan(40);
  });

  it("counts words and keeps sensible limits", () => {
    expect(wordCount("  In my opinion,\n exams   are fair. ")).toBe(6);
    expect(wordCount("")).toBe(0);
    expect(WRITING_MIN_WORDS).toBeLessThan(WRITING_MAX_WORDS);
  });
});
