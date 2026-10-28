import { describe, expect, it } from "vitest";
import { bestStars, keepStars, loadSettings, MODE_CHOICES, starsFor, storyMode } from "../src/app/prefs";
import { modeName, stepMode } from "../src/ui/settings";
import { recordLine } from "../src/ui/sheets";
import { bestHtml } from "../src/ui/title";

/**
 * R3 (docs/td/BUILD_1B.md §14, §4.3; R3_PLAN §3.6): the "Chế độ" row of the settings (td.settings, null: by the profile)
 * and the best stars of each stage won (td.campaign), on "Bắt đầu" and the won card.
 */
const memory = (data: Record<string, unknown> = {}) => {
  const map = new Map(Object.entries(data));
  return { map, readJson: (key: string) => map.get(key) ?? null, writeJson: (key: string, value: unknown) => (map.set(key, JSON.parse(JSON.stringify(value))), true) };
};

describe("the story's mode (§14)", () => {
  it("reads a mode the game has, else none (by the profile); the volumes and the pace as before", () => {
    expect(loadSettings(memory()).mode).toBeNull();
    expect(loadSettings(memory({ "td.settings": { master: 50, mode: "challenge" } }))).toEqual({ master: 50, music: 60, sfx: 80, pace: true, mode: "challenge" });
    for (const bad of ["hard", 3, null, "theo hồ sơ"]) expect(loadSettings(memory({ "td.settings": { mode: bad } })).mode).toBeNull();
  });

  it("none set: a child plays Thư giãn, anyone else Cân bằng (BALANCE §3); a mode set is played by both", () => {
    const by = (mode: (typeof MODE_CHOICES)[number]) => ({ master: 80, music: 60, sfx: 80, pace: true, mode });
    expect([storyMode(by(null), true), storyMode(by(null), false)]).toEqual(["relax", "balanced"]);
    expect([storyMode(by("challenge"), true), storyMode(by("learn"), false)]).toEqual(["challenge", "learn"]);
  });

  it("the row steps round the choices both ways and names each", () => {
    const seen: (string | null)[] = [];
    let mode: (typeof MODE_CHOICES)[number] = null;
    for (let k = 0; k < 5; k += 1) seen.push((mode = stepMode(mode, 1)));
    expect(seen).toEqual(["relax", "balanced", "challenge", "learn", null]);
    expect(stepMode(null, -1)).toBe("learn");
    expect(MODE_CHOICES.map(modeName)).toEqual(["By profile", "Relaxed", "Balanced", "Challenge", "Learn"]);
  });
});

describe("the best stars (§4.3, td.campaign)", () => {
  it("stars by the lives left: 18–20 three, 6–17 two, 1–5 one", () => {
    expect([20, 18, 17, 6, 5, 1, 0].map(starsFor)).toEqual([3, 3, 2, 2, 1, 1, 0]);
  });

  it("a win keeps its stars when they beat the best, per stage; anything else in the store reads as none", () => {
    const storage = memory();
    expect(keepStars("w1-silverfall", 10, storage)).toEqual({ stars: 2, best: 2, record: true });
    expect(keepStars("w1-silverfall", 3, storage)).toEqual({ stars: 1, best: 2, record: false });
    expect(storage.map.get("td.campaign")).toEqual({ v: 1, best: { "w1-silverfall": 2 } });
    expect(keepStars("w1-silverfall", 19, storage)).toEqual({ stars: 3, best: 3, record: true });
    expect(keepStars("w2", 7, storage).record).toBe(true);
    expect(bestStars(storage)).toEqual({ "w1-silverfall": 3, w2: 2 });
    for (const bad of [null, { v: 2, best: { a: 3 } }, { v: 1, best: "x" }, { v: 1, best: { a: 9, b: "3", c: 2 } }]) expect(bestStars(memory({ "td.campaign": bad }))).toEqual(bad !== null && (bad as { best: unknown }).best !== "x" && (bad as { v: number }).v === 1 ? { c: 2 } : {});
  });

  it("shows on Bắt đầu once won, and on the won card (new or not)", () => {
    expect(bestHtml(0)).toBe("");
    expect(bestHtml(2)).toContain("★★☆");
    expect(recordLine(0, false)).toBe("");
    expect(recordLine(2, false)).toBe('<p class="td-best">Best <b>★★</b></p>');
    expect(recordLine(3, true)).toContain("New best");
  });
});
