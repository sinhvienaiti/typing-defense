import { describe, expect, it } from "vitest";
import { Selection } from "../src/app/selection";
import { dockHtml } from "../src/ui/build-menu";
import { BossBanner } from "../src/ui/hud";
import { DOES, doesLine, TIPS } from "../src/ui/tips";
import { run, send, world } from "./td/fixtures";

/**
 * R3 (docs/td/BUILD_1B.md §12; R3_PLAN §3.5): the teaching table of map 1. Each story day and night has Bà Cú Mực's row,
 * shown at its start in the frame at the top (one sentence a line, 3.8 s each, two at most) with its chip till the phase
 * ends; a building opened by day says what it does on its card until its row has come. The sandbox skips the table.
 */
const syllables = (text: string): number => text.split(/\s+/).filter((part) => /[\p{L}\p{N}]/u.test(part)).length;
const sentences = (text: string): string[] => text.split(/(?<=[.!?])\s+/);
const story = () => world({ sandbox: false, gold: 1000 });
/** The frame's text with a chip's parts joined again (they wrap between parts only). */
const plainOf = (html: string): string => html.replace(/<\/?span>/g, "");
/** The world on the first tick of day `day` or night `day` (the story: day n, then its night by the early call). */
function at(phase: "day" | "night", day: number) {
  const w = story();
  run(w, 1);
  while (w.day < day || w.phase !== "day") {
    if (w.phase === "day") send(w, { t: "callNight" });
    w.enemies.live().forEach((e) => (w.enemies.hp[e] = 0));
    run(w, 30);
  }
  if (phase === "night") send(w, { t: "callNight" });
  return w;
}

describe("the table (§12)", () => {
  it("has a row for every day and night of the stage: a line of two sentences at most and 14 syllables, a chip of 8", () => {
    expect(Object.keys(TIPS).sort()).toEqual(["day1", "day2", "day3", "day4", "day5", "night1", "night2", "night3", "night4", "night5"]);
    for (const [key, { line, chip }] of Object.entries(TIPS)) {
      expect([key, sentences(line).length <= 2, syllables(line) <= 14, syllables(chip) <= 8]).toEqual([key, true, true, true]);
      // One sentence a line stays one line in the boss bar at 1280 × 720 (review R1), two in the side frame: 54 characters with "Bà Cú Mực: ".
      for (const part of sentences(line)) expect([key, part, ("Bà Cú Mực: " + part).length <= 54]).toEqual([key, part, true]);
    }
  });

  it("every building the player can build says what it does, or a row teaches it (§12: Trại Lính, Mỏ, Tháp Pháo open later)", () => {
    const w = story();
    for (const spec of w.c.buildings.slice(1)) expect([spec.id, DOES[spec.id] !== undefined]).toEqual([spec.id, true]);
    for (const [id, { line, taught }] of Object.entries(DOES)) {
      expect([id, syllables(line) <= 12]).toEqual([id, true]);
      if (taught !== undefined) expect(TIPS[taught]).toBeDefined();
    }
  });
});

describe("the teaching frame (BossBanner, R3)", () => {
  it("at a story day's start: its two sentences one after the other, 3.8 s each, the chip till the phase ends", () => {
    const w = story();
    const banner = new BossBanner();
    banner.tips = TIPS;
    banner.read([], w, 0);
    expect(banner.teachHtml(w)).toBe(""); // tick 0: the title is up, nothing has begun
    run(w, 1);
    banner.read([], w, 0);
    const first = plainOf(banner.teachHtml(w));
    expect(first).toContain("Bà Cú Mực: " + sentences(TIPS.day1!.line)[0]);
    expect(first).toContain(TIPS.day1!.chip);
    banner.read([], w, 3900);
    expect(banner.teachHtml(w)).toContain("Bà Cú Mực: " + sentences(TIPS.day1!.line)[1]);
    banner.read([], w, 7700);
    const later = plainOf(banner.teachHtml(w));
    expect(later).not.toContain("Bà Cú Mực");
    expect(later).toContain(TIPS.day1!.chip); // the chip stays
    send(w, { t: "callNight" });
    banner.read([], w, 8000);
    expect(banner.teachHtml(w)).toContain("Bà Cú Mực: " + sentences(TIPS.night1!.line)[0]);
    expect(plainOf(banner.teachHtml(w))).toContain(TIPS.night1!.chip);
    expect(plainOf(banner.teachHtml(w))).not.toContain(TIPS.day1!.chip);
  });

  it("at most two lines a phase, none twice; a day replayed (its events gone) gets its row; the sandbox shows the boss's rows only; no table, no row", () => {
    const w = at("day", 3);
    const banner = new BossBanner();
    banner.tips = TIPS;
    const said = new Set<string>();
    for (let now = 0; now < 30_000; now += 500) {
      banner.read([], w, now);
      const line = /<p class="td-say">([^<]*)<\/p>/.exec(banner.teachHtml(w))?.[1];
      if (line !== undefined) said.add(line);
    }
    expect([...said]).toEqual(sentences(TIPS.day3!.line).map((part) => "Bà Cú Mực: " + part));
    const sandbox = world({ gold: 1000 });
    run(sandbox, 2);
    const plain = new BossBanner();
    plain.tips = TIPS;
    plain.read([], sandbox, 0);
    expect(plain.teachHtml(sandbox)).toBe("");
    // The sandbox keeps the boss's rows (R1): its `boss` warns Mộc Tinh and the night falls.
    send(sandbox, { t: "sandbox", op: { op: "boss" } });
    plain.read([], sandbox, 100);
    expect(plain.html(sandbox, 100)).toContain("Bà Cú Mực: " + sentences(TIPS.night5!.line)[0]);
    const none = new BossBanner();
    none.read([], w, 0);
    expect(none.teachHtml(w)).toBe("");
  });
});

describe("what a building does (§12: on its card, read when wanted)", () => {
  it("in the story, once open, until its row: Tháp Cung on day 1 only, Trại Lính from day 2, never in the sandbox", () => {
    const day1 = story();
    run(day1, 1);
    expect([doesLine(day1, "archer"), doesLine(day1, "farm"), doesLine(day1, "barracks")]).toEqual([DOES.archer!.line, "", ""]);
    const night1 = at("night", 1);
    expect(doesLine(night1, "archer")).toBe("");
    const day2 = at("day", 2);
    expect([doesLine(day2, "barracks"), doesLine(day2, "cannon")]).toEqual([DOES.barracks!.line, ""]);
    expect(doesLine(at("day", 3), "cannon")).toBe(DOES.cannon!.line);
    const sandbox = world({ gold: 1000 });
    expect(doesLine(sandbox, "barracks")).toBe("");
  });

  it("the build menu says it for the kind picked, a building's card under its name", () => {
    const w = at("day", 2);
    const sel = new Selection(w, () => undefined);
    sel.act("build");
    sel.act("pick:" + w.c.buildings.findIndex((spec) => spec.id === "barracks"));
    expect(dockHtml(w, sel, doesLine)).toContain(`<p class="td-does">${DOES.barracks!.line}</p>`);
    expect(dockHtml(w, sel)).not.toContain("td-does");
  });
});
