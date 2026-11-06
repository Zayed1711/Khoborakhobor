import { describe, expect, it } from "vitest";
import { isEarlyBirdWindow, trialDaysLeft } from "@/lib/early-bird";

// Dhaka is UTC+6
const at = (dhaka: string) => Date.parse(dhaka + "+06:00");

describe("early-bird notice window", () => {
  it("starts on 28 Nov and ends after 2 Dec, Dhaka time", () => {
    expect(isEarlyBirdWindow(at("2026-11-27T23:59:00"))).toBe(false);
    expect(isEarlyBirdWindow(at("2026-11-28T00:00:00"))).toBe(true);
    expect(isEarlyBirdWindow(at("2026-12-02T23:59:00"))).toBe(true);
    expect(isEarlyBirdWindow(at("2026-12-03T00:00:00"))).toBe(false);
  });
  it("counts the days left, today included", () => {
    expect(trialDaysLeft(at("2026-11-28T09:00:00"))).toBe(5);
    expect(trialDaysLeft(at("2026-12-02T09:00:00"))).toBe(1);
    expect(trialDaysLeft(at("2026-12-05T09:00:00"))).toBe(0);
  });
});
