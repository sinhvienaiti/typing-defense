import { describe, expect, it } from "vitest";
import type { Mode } from "../src/content/types";
import { Sheet } from "../src/ui/sheets";
import { WordCards } from "../src/view/words/cards";
import { columnBox, COLUMN, lanesTouch, spreadLanes } from "../src/view/words/lanes";
import { world } from "./td/fixtures";
import { callWord } from "./td/typing";

describe("103 A6: Knowledge on the results card", () => {
  it.each<[Mode, number, boolean]>([["balanced", 0, false], ["learn", 0, true], ["challenge", 3, true]])(
    "%s with %i Knowledge: visible %s", (mode, knowledge, visible) => {
      for (const phase of ["victory", "defeat"] as const) {
        const w = world({ mode });
        Object.assign(w, { phase, knowledge });
        const el = { innerHTML: "", appendChild() {}, querySelectorAll: () => [] };
        // Exercise the HTML writer without a browser or a DOM dependency.
        const sheet = Object.assign(Object.create(Sheet.prototype), { el, settings: { close() {}, el: {} } }) as Sheet;
        sheet.show("results", w);
        expect(el.innerHTML.includes("Knowledge")).toBe(visible);
        if (visible) expect(el.innerHTML).toContain(`<dt>Knowledge</dt><dd>${knowledge}</dd>`);
      }
    },
  );
});

describe("103 A8: measured meaning strips take space in the column", () => {
  const live = { height: 58, half: 75, slot: 0 };
  const mean = { height: 34, half: 180, slot: -1 };

  it("keeps an upper meaning strip clear of the next word in the same column", () => {
    const box = columnBox([live, mean], 0);
    const lowerTop = -box.heights[0]! - live.height * 1.2;
    const meaningBottom = -box.heights[1]!;
    expect(lowerTop - meaningBottom).toBeGreaterThanOrEqual(4);
    expect(box.half).toBeGreaterThanOrEqual(mean.half);
    expect(box.tallest).toBeGreaterThanOrEqual(box.heights[1]! + mean.height);
  });

  it("reserves every meaning box even when the old 240 px rise is full", () => {
    const cards = [live, ...Array.from({ length: 5 }, () => mean)];
    const box = columnBox(cards, 0);
    expect(box.heights.at(-1)).toBeGreaterThan(COLUMN.max);
    for (let k = 1; k < cards.length; k += 1) {
      const lower = cards[k - 1]!;
      expect(box.heights[k]! - box.heights[k - 1]! - lower.height * (lower.slot === 0 ? 1.2 : 1)).toBeGreaterThanOrEqual(4);
    }
  });

  it("uses the full meaning width and height when separating neighbouring columns", () => {
    const box = columnBox([live, mean], -1);
    const lanes = [{ x: 600, top: 500 - box.tallest, bottom: 500, half: box.half }, { x: 680, top: 390, bottom: 430, half: 75 }];
    expect(lanesTouch(lanes, [0, 0])).toBe(true);
    expect(lanesTouch(lanes, spreadLanes(lanes, 8, 1272, []))).toBe(false);
    expect(box.half).toBe(mean.half + 9); // slot −1 is a departing card, never a lock.
  });
});

describe("103 A8: draw includes mean cards for exactly 1000 ms", () => {
  it.each([1280, 1920])("keeps the meaning strips above the next word at width %i", (width) => {
    const w = world();
    const s = callWord(w, 0);
    const c = w.words.call[s]!;
    const node = () => ({ style: { setProperty() {} }, classList: { add() {}, toggle() {} } });
    const card = (slot: number, leave: string, height: number, half: number) => ({
      el: node(), bar: node(), id: slot < 0 ? 999 : w.words.id(s), slot, call: w.calls.id(c), leave, leaveAt: 0,
      height, half, typed: w.words.typed[s], pink: false, tier: w.words.tier[s], dots: "", learn: true, late: false,
      lockedAt: -1, shakeUntil: 0, pinkUntil: 0, x: width / 2, y: 450, ax: NaN, ay: NaN,
    });
    const live = card(s, "", 58, 75);
    const means = Array.from({ length: 5 }, () => card(-1, "mean", 34, 180));
    const view = Object.assign(Object.create(WordCards.prototype), {
      cards: [live, ...means], stamps: [], byId: new Map([[live.id, live]]), offsets: new Map(), last: 0, frame: 0,
      project: () => ({ x: width / 2, y: 600 }),
    }) as WordCards;
    for (const now of [0, 500, 999]) {
      view.draw(w, now, width, 720);
      const stacked = [live, ...means];
      for (let k = 1; k < stacked.length; k += 1) {
        const upper = stacked[k]!;
        const lower = stacked[k - 1]!;
        expect(upper.y + upper.height).toBeLessThanOrEqual(lower.y - 4);
        expect(upper.el.style).toHaveProperty("transform");
        expect(upper.leave).toBe("mean");
      }
    }
    view.draw(w, 1000, width, 720);
    expect(means.every((meaning) => meaning.leave === "fold")).toBe(true);
  });
});
