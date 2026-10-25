import { describe, expect, it } from "vitest";
import { countSeen, foldBook, Learner, LEARN_KEY, learningEvent, planFor, readLearn } from "../src/app/learn";
import { GAME_ID } from "../src/app/learning";
import { LEARN } from "../src/content/rules";
import type { RareEvent } from "../src/sim/events";
import { CALL_KIND } from "../src/sim/stores/calls";
import { review } from "../src/sim/systems/learn";
import { createWorld } from "../src/sim/world";
import { compileDeck } from "../src/typing/decks";
import { meaningShown } from "../src/view/words/cards";

/** R3 (docs/td/BUILD_1B.md §11.1, §11.3–§11.5; R3_PLAN §3.3, §3.4): Học at the page, src/app/learn.ts, and the cards' meaning rule. */
const deck = compileDeck(Array.from({ length: 60 }, (_, k) => ({ id: "L" + (k < 30 ? 1 : 3) + "-" + k, text: "w" + String.fromCharCode(97 + (k % 26)) + String.fromCharCode(97 + Math.floor(k / 26)) + "x", level: k < 30 ? 1 : 3, vi: "nghĩa " + k })));
type Hit = Extract<RareEvent, { t: "wordHit" }>;
const hit = (item: number, grade: Hit["grade"], errors: number, kind: number = CALL_KIND.chop): Hit => ({ t: "wordHit", tick: 0, word: 1, call: 1, grade, errors, quality: 1, len: 4, ms: 900, wait: 30, fam: 0, item, kind });
const memory = () => {
  const data = new Map<string, unknown>();
  return { data, readJson: (key: string) => data.get(key) ?? null, writeJson: (key: string, value: unknown) => (data.set(key, JSON.parse(JSON.stringify(value))), true) };
};

describe("the store and the plan (§11.3, §11.4)", () => {
  it("reads only its own shape: a missing or foreign value is the empty store; seen counts stop at 3", () => {
    expect(readLearn(null)).toEqual({ v: 1, book: [], seen: {} });
    expect(readLearn({ v: 2, book: ["a"], seen: { a: 1 } })).toEqual({ v: 1, book: [], seen: {} });
    const many = Array.from({ length: 50 }, (_, k) => "id" + k);
    expect(readLearn({ v: 1, book: [...many, 7], seen: { a: 9, b: -1, c: "x" } })).toEqual({ v: 1, book: many.slice(-LEARN.bookSaved), seen: { a: 3 } });
  });

  it("cold start: no book, nothing seen: due empty, 24 fresh words of the top level turned round by the seed", () => {
    const cold = planFor(deck, readLearn(null), 3, 7);
    expect([cold.book, cold.due, cold.fresh.length]).toEqual([[], [], LEARN.freshPlanned]);
    expect(cold.fresh.every((id) => id.startsWith("L3-"))).toBe(true);
    expect(cold.fresh[0]).toBe("L3-" + (30 + (7 % 30)));
    expect(planFor(deck, readLearn(null), 3, 8).fresh[0]).not.toBe(cold.fresh[0]);
  });

  it("warm: due is the saved book (≤ 40, ids the deck has), book its newest 20; fresh leaves out every word seen", () => {
    const store = readLearn({ v: 1, book: [...Array.from({ length: 30 }, (_, k) => "L1-" + k), "gone"], seen: { "L3-31": 1, "L3-32": 3 } });
    const plan = planFor(deck, store, 3, 0);
    expect(plan.due).toEqual(Array.from({ length: 30 }, (_, k) => "L1-" + k));
    expect(plan.book).toEqual(plan.due.slice(-20));
    expect(plan.fresh).not.toContain("L3-31");
    expect(plan.fresh).not.toContain("L3-32");
  });

  it("after a run: the saved book less the words redeemed or quizzed right, then the run's book; each once, the newest 40", () => {
    expect(foldBook(["a", "b", "c", "d"], ["c", "e"], new Set(["b"]))).toEqual(["a", "d", "c", "e"]);
    const long = Array.from({ length: 45 }, (_, k) => "s" + k);
    expect(foldBook(long, ["x"], new Set())).toEqual([...long.slice(-39), "x"]);
    expect(foldBook(["a"], ["a"], new Set(["a"]))).toEqual(["a"]); // redeemed, then in the book again this run
  });

  it("counts a word seen up to 3 times; past 3,000 ids the oldest goes", () => {
    const seen: Record<string, number> = {};
    for (let k = 0; k < 5; k += 1) countSeen(seen, "a");
    expect(seen.a).toBe(LEARN.seenCap);
    for (let k = 0; k < LEARN.seenIds; k += 1) countSeen(seen, "id" + k);
    expect([Object.keys(seen).length, seen.a, seen["id0"], seen["id" + (LEARN.seenIds - 1)]]).toEqual([LEARN.seenIds, undefined, 1, 1]);
  });
});

describe("learning events (§11.5)", () => {
  it("a call's word is a typing event, correct unless sloppy; a quiz a recall, right unless sloppy or 2 errors; this game's id", () => {
    const at = "2026-10-25T12:00:00.000Z";
    const clean = learningEvent(deck, hit(3, "ok", 1), at);
    expect(clean).toMatchObject({ gameId: GAME_ID, activityType: "typing", result: "correct", entityId: "wdax", occurredAt: at, expectedAnswer: "wdax" });
    expect(learningEvent(deck, hit(3, "sloppy", 2), at)).toMatchObject({ result: "wrong", errorType: "spelling" });
    expect(learningEvent(deck, hit(4, "good", 0, CALL_KIND.quiz), at)).toMatchObject({ activityType: "recall", result: "correct", responseMs: 900 });
    expect(learningEvent(deck, hit(4, "ok", 2, CALL_KIND.quiz), at)).toMatchObject({ activityType: "recall", result: "wrong" });
  });

  it("the learner counts sightings, sends typed words every 5 s in a batch, keeps the book at each day, night and end", () => {
    const storage = memory();
    storage.writeJson(LEARN_KEY, { v: 1, book: ["L1-0", "L1-1"], seen: {} });
    const sent: unknown[] = [];
    const w = createWorld({ seed: 1, deck });
    const learner = new Learner(deck, 3, 1, (event) => sent.push(event), undefined, storage);
    expect(learner.header.due).toEqual(["L1-0", "L1-1"]);
    learner.read([{ t: "wordSpawn", tick: 0, word: 1, call: 1, item: 5 }], w, 0);
    expect(learner.seen(5)).toBe(1);
    learner.read([hit(5, "perfect", 0)], w, 1000);
    learner.read([hit(6, "perfect", 0), hit(7, "sloppy", 2)], w, 3000);
    expect(sent.length).toBe(0); // within the first 5 s: waiting
    learner.read([], w, 6100);
    expect([sent.length, learner.sent.length]).toEqual([3, 3]);
    // The run's book: L1-0 redeemed (a review event), L1-1 quizzed right, L1-9 typed sloppy this run.
    review(w, 9, true);
    learner.read([{ t: "review", tick: 0, item: 0, redeemed: true }, hit(1, "good", 0, CALL_KIND.quiz), { t: "phase", tick: 0, phase: "night", day: 1 }], w, 6200);
    expect(storage.data.get(LEARN_KEY)).toMatchObject({ v: 1, book: ["L1-9"], seen: { "L1-5": 1 } });
  });

  it("a replayed day's header is kept as given, not planned again", () => {
    const header = { book: ["L1-3"], due: ["L1-3"], fresh: [] };
    expect(new Learner(deck, 3, 1, () => {}, header, memory()).header).toBe(header);
  });
});

describe("the meaning under a word before it is typed (§11.1)", () => {
  it("always in Học, Thư giãn and for a child; Cân bằng the first two sightings, Thử thách the first; unknown counts show it", () => {
    for (const mode of ["learn", "relax"] as const) expect(meaningShown(mode, false, 3)).toBe(true);
    expect(meaningShown("balanced", true, 3)).toBe(true);
    expect([1, 2, 3].map((seen) => meaningShown("balanced", false, seen))).toEqual([true, true, false]);
    expect([1, 2].map((seen) => meaningShown("challenge", false, seen))).toEqual([true, false]);
    expect(meaningShown("challenge", false, null)).toBe(true);
  });
});
