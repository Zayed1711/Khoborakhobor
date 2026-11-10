import { describe, it, expect } from "vitest";
import { checkFacts, generateFacts, numbersIn, nameFound, wordsOf, storyLang, trimBody, DEFAULT_MODELS } from "@/lib/study/ai-facts";

const BN_TITLE = "পোশাকশ্রমিকদের মজুরি বাড়াতে নতুন মজুরি বোর্ড গঠন";
const BN_BODY =
  "সরকার পোশাকশ্রমিকদের মজুরি পুনর্নির্ধারণে নতুন মজুরি বোর্ড গঠন করেছে। শ্রম ও কর্মসংস্থান মন্ত্রণালয় সোমবার ঢাকায় এ বিষয়ে প্রজ্ঞাপন জারি করেছে। " +
  "বোর্ডে মালিক ও শ্রমিকপক্ষের প্রতিনিধিরা থাকবেন। বর্তমানে ন্যূনতম মজুরি ১২,৫০০ টাকা। বোর্ডকে ৬ মাসের মধ্যে সুপারিশ দিতে বলা হয়েছে। " +
  "দেশে প্রায় ৪০ লাখ পোশাকশ্রমিক কাজ করেন এবং রপ্তানি আয়ের ৮৪ শতাংশ আসে এই খাত থেকে। শ্রমিক সংগঠনগুলো মজুরি বাড়ানোর দাবি জানিয়ে আসছিল।";
const BN_ARTICLE = { title: BN_TITLE, body: BN_BODY };

const goodBn = {
  summary:
    "পোশাকশ্রমিকদের ন্যূনতম মজুরি নতুন করে ঠিক করতে সরকার একটি মজুরি বোর্ড করেছে, যেখানে মালিক ও শ্রমিক দুই পক্ষই থাকবে। " +
    "বর্তমান মজুরি ১২,৫০০ টাকা এবং বোর্ডকে ৬ মাসে সুপারিশ জমা দিতে হবে। প্রায় ৪০ লাখ শ্রমিকের এই খাত থেকেই রপ্তানি আয়ের বড় অংশ আসে।",
  who: ["শ্রম ও কর্মসংস্থান মন্ত্রণালয়", "মজুরি বোর্ড"],
  what: "পোশাকশ্রমিকদের মজুরি পুনর্নির্ধারণে নতুন মজুরি বোর্ড গঠন।",
  when: "",
  where: "ঢাকা",
  numbers: [
    { label: "বর্তমান ন্যূনতম মজুরি", value: "১২,৫০০ টাকা" },
    { label: "পোশাকশ্রমিক", value: "৪০ লাখ" },
  ],
  gkCategory: "Economy & Finance",
  examScore: 8,
};

describe("text helpers", () => {
  it("reads Bengali and English digits the same, without thousands commas", () => {
    expect(numbersIn("১২,৫০০ টাকা ও ৮৪ শতাংশ")).toEqual(["12500", "84"]);
    expect(numbersIn("12,500 and 2.5%")).toEqual(["12500", "2.5"]);
    expect(numbersIn("০৫ জন")).toEqual(["5"]);
  });
  it("finds names with Bengali case endings", () => {
    const src = ` ${wordsOf("মার্কিন প্রেসিডেন্ট ডোনাল্ড ট্রাম্পের বক্তব্য").join(" ")} `;
    expect(nameFound("ডোনাল্ড ট্রাম্প", src)).toBe(true);
    expect(nameFound("জো বাইডেন", src)).toBe(false);
  });
  it("detects the story language from the title", () => {
    expect(storyLang(BN_TITLE)).toBe("bn");
    expect(storyLang("US approves missile sale")).toBe("en");
  });
  it("trims long articles", () => {
    expect(trimBody(Array(2000).fill("w").join(" ")).split(" ").length).toBe(1201);
  });
});

describe("checkFacts", () => {
  it("accepts a grounded Bengali answer", () => {
    const r = checkFacts(goodBn, BN_ARTICLE, "bn");
    expect(r.problems).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.facts?.numbers).toHaveLength(2);
    expect(r.facts?.examScore).toBe(8);
  });

  it("rejects a summary with a number that is not in the article", () => {
    const r = checkFacts({ ...goodBn, summary: goodBn.summary.replace("১২,৫০০", "১৫,০০০") }, BN_ARTICLE, "bn");
    expect(r.ok).toBe(false);
    expect(r.problems.join()).toMatch(/15000/);
  });

  it("rejects the wrong language, filler, and missing full stop", () => {
    expect(checkFacts({ ...goodBn, summary: "The government formed a new wage board for garment workers to review the minimum wage of 12,500 taka, and the board must give its advice within 6 months, covering about 40 lakh workers." }, BN_ARTICLE, "bn").ok).toBe(false);
    expect(checkFacts({ ...goodBn, summary: "এই প্রতিবেদনে " + goodBn.summary }, BN_ARTICLE, "bn").problems.join()).toMatch(/filler/);
    expect(checkFacts({ ...goodBn, summary: goodBn.summary.replace(/।$/, "") }, BN_ARTICLE, "bn").problems.join()).toMatch(/full sentence/);
  });

  it("rejects summaries that are too short or copied word for word", () => {
    expect(checkFacts({ ...goodBn, summary: "সরকার মজুরি বোর্ড গঠন করেছে।" }, BN_ARTICLE, "bn").ok).toBe(false);
    const copied = BN_BODY.split("। ").slice(0, 4).join("। ") + "।";
    const r = checkFacts({ ...goodBn, summary: copied }, BN_ARTICLE, "bn");
    expect(r.ok).toBe(false);
    expect(r.problems.join()).toMatch(/copies/);
  });

  it("drops invented names, places, dates and figures but keeps the rest", () => {
    const r = checkFacts(
      {
        ...goodBn,
        who: ["শ্রম ও কর্মসংস্থান মন্ত্রণালয়", "বিজিএমইএ"],
        when: "৭ নভেম্বর ২০২৬",
        where: "চট্টগ্রাম",
        numbers: [...goodBn.numbers, { label: "বোনাস", value: "৫,০০০ টাকা" }],
      },
      BN_ARTICLE,
      "bn"
    );
    expect(r.ok).toBe(true);
    expect(r.facts?.who).toEqual(["শ্রম ও কর্মসংস্থান মন্ত্রণালয়"]);
    expect(r.facts?.when).toBe("");
    expect(r.facts?.where).toBe("");
    expect(r.facts?.numbers).toHaveLength(2);
  });

  it("drops a date with no number in it (today, Sunday)", () => {
    expect(checkFacts({ ...goodBn, when: "সোমবার" }, BN_ARTICLE, "bn").facts?.when).toBe("");
  });

  it("keeps the category and score inside their allowed ranges", () => {
    const r = checkFacts({ ...goodBn, gkCategory: "Gossip", examScore: 42 }, BN_ARTICLE, "bn");
    expect(r.facts?.gkCategory).toBe("Other");
    expect(r.facts?.examScore).toBeNull();
  });
});

describe("generateFacts cascade", () => {
  const long = { title: BN_TITLE, body: (BN_BODY + " ").repeat(3) };
  const ok = (obj: unknown) => async () => ({ ok: true as const, text: JSON.stringify(obj), tokensIn: 900, tokensOut: 200 });

  it("uses the cheap model when its answer passes", async () => {
    const out = await generateFacts(long, { busyWaitMs: 0, models: ["cheap", "strong"], call: ok(goodBn) });
    expect(out.status).toBe("ok");
    expect(out.model).toBe("cheap");
    expect(out.calls).toBe(1);
  });

  it("retries once with the stronger model, then gives up", async () => {
    const seen: string[] = [];
    const bad = { ...goodBn, summary: goodBn.summary.replace("১২,৫০০", "৯৯,৯৯৯") };
    const out = await generateFacts(long, {
      models: ["cheap", "strong"],
      call: async (o) => {
        seen.push(o.model);
        return { ok: true, text: JSON.stringify(o.model === "strong" ? goodBn : bad), tokensIn: 1, tokensOut: 1 };
      },
    });
    expect(seen).toEqual(["cheap", "strong"]);
    expect(out.model).toBe("strong");

    const fail = await generateFacts(long, { busyWaitMs: 0, models: ["cheap", "strong"], call: ok(bad) });
    expect(fail.status).toBe("failed");
    expect(fail.facts).toBeNull();
    expect(fail.calls).toBe(2);
  });

  it("waits and retries the same model once when Google is busy", async () => {
    const seen: string[] = [];
    let n = 0;
    const out = await generateFacts(long, {
      busyWaitMs: 0,
      models: ["cheap", "strong"],
      call: async (o) => {
        seen.push(o.model);
        return n++ === 0 ? { ok: false, error: "HTTP 503", retryable: true } : { ok: true, text: JSON.stringify(goodBn), tokensIn: 1, tokensOut: 1 };
      },
    });
    expect(seen).toEqual(["cheap", "cheap"]);
    expect(out.status).toBe("ok");
    expect(out.calls).toBe(2);
  });

  it("respects the call budget and stops on a non-retryable error", async () => {
    const one = await generateFacts(long, { busyWaitMs: 0, models: ["cheap", "strong"], maxCalls: 1, call: ok({ summary: "x" }) });
    expect(one.calls).toBe(1);
    const noKey = await generateFacts(long, {
      models: ["cheap", "strong"],
      call: async () => ({ ok: false, error: "GEMINI_API_KEY is not set", retryable: false }),
    });
    expect(noKey.calls).toBe(1);
    expect(noKey.status).toBe("failed");
  });

  it("after a copied summary, tells the next model to rewrite in its own words", async () => {
    const copied = { ...goodBn, summary: BN_BODY.split("। ").slice(0, 4).join("। ") + "।" };
    const users: string[] = [];
    const out = await generateFacts(long, {
      busyWaitMs: 0,
      models: ["lite-a", "lite-b"],
      call: async (o) => {
        users.push(o.user);
        return { ok: true, text: JSON.stringify(o.model === "lite-a" ? copied : goodBn), tokensIn: 1, tokensOut: 1 };
      },
    });
    expect(out.status).toBe("ok");
    expect(users[0]).not.toMatch(/own words/);
    expect(users[1]).toMatch(/own words/);
  });

  it("marks a story for a later try only when Google never answered", async () => {
    const busy = await generateFacts(long, { busyWaitMs: 0, models: ["a", "b"], call: async () => ({ ok: false, error: "HTTP 503", retryable: true }) });
    expect(busy.retryLater).toBe(true);
    const bad = await generateFacts(long, { busyWaitMs: 0, models: ["a", "b"], call: ok({ ...goodBn, summary: "ছোট।" }) });
    expect(bad.retryLater).toBe(false);
    const noKey = await generateFacts(long, { models: ["a"], call: async () => ({ ok: false, error: "GEMINI_API_KEY is not set", retryable: false }) });
    expect(noKey.retryLater).toBe(false);
  });

  it("uses only the cheap lite models by default", () => {
    expect(DEFAULT_MODELS.every((m) => m.includes("lite"))).toBe(true);
    expect(new Set(DEFAULT_MODELS).size).toBe(DEFAULT_MODELS.length);
  });

  it("skips stories with too little text without calling the AI", async () => {
    let called = false;
    const out = await generateFacts({ title: BN_TITLE, body: "ছোট খবর।" }, { call: async () => { called = true; return { ok: false, error: "", retryable: false }; } });
    expect(called).toBe(false);
    expect(out.calls).toBe(0);
  });
});
