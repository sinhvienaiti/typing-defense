import { describe, expect, it } from "vitest";
import { CALL, LEARN } from "../src/content/rules";
import { hashHex } from "../src/sim/hash";
import { CALL_KIND, CALL_STATE } from "../src/sim/stores/calls";
import { STAT } from "../src/sim/stats";
import { BOSS } from "../src/sim/stores/boss";
import { closeCall, giveWord, makeCall } from "../src/sim/systems/calls";
import { planNext, review, setLearn } from "../src/sim/systems/learn";
import { KIND } from "../src/typing/letters";
import { createWorld, type World } from "../src/sim/world";
import { compileDeck, gloss, wordText } from "../src/typing/decks";
import { run, send, world } from "./td/fixtures";
import { callWord, realDeck, smallDeck, type, wordOf } from "./td/typing";

/** Learning (docs/td/BUILD_1A6.md §6–§7): meanings for the view, the review book, the helpers' quizzes. */
const T = (seconds: number) => Math.round(seconds * 60);
const WORDS = ["apple", "bread", "cider", "dream", "eagle", "fable", "grape", "house", "ivory", "lemon", "mango", "night", "olive", "peach", "river", "stone", "tiger", "uncle", "vivid", "water", "yacht", "kitten"];
const deck = smallDeck(WORDS);
const book = (w: World): string[] => Array.from(w.typing.review.subarray(0, w.typing.reviewN), (word) => wordText(w.typing.deck, word));
const quizzes = (w: World): number[] => w.calls.live().filter((c) => w.calls.kind[c] === CALL_KIND.quiz);

/** A world whose Bastion lets `helpers` Thư Đồng out (they wait west of it), in the relax mode unless asked. */
function school(helpers = 1, options: Parameters<typeof world>[0] = {}): World {
  const w = world({ deck, mode: "relax", ...options });
  send(w, { t: "sandbox", op: { op: "keepLevel", value: helpers + 1 } });
  return w;
}

describe("decks carry meanings for the view (§7)", () => {
  it("take vi and ipa from the vocabulary; the deck's hash, and so the world's, ignore them", () => {
    const plain = compileDeck([{ id: "a", text: "good", level: 1 }, { id: "b", text: "cold", level: 1 }]);
    const rich = compileDeck([{ id: "a", text: "good", level: 1, vi: "tốt; hay", ipa: "/ɡʊd/" }, { id: "b", text: "cold", level: 1, vi: "lạnh; rét", ipa: "/koʊld/" }]);
    expect(rich.hash).toBe(plain.hash);
    expect([rich.vi[0], rich.ipa[1], plain.vi[0], plain.ipa[0]]).toEqual(["tốt; hay", "/koʊld/", "", ""]);
    expect(hashHex(createWorld({ seed: 1, deck: rich }))).toBe(hashHex(createWorld({ seed: 1, deck: plain })));
    const real = realDeck();
    expect([real.vi[wordOf(real, "good")], real.ipa[wordOf(real, "good")]]).toEqual(["tốt; hay", "/ɡʊd/"]);
    expect(real.vi.filter((vi) => vi !== "").length).toBe(real.count);
  });

  it("a card's gloss leaves notes in brackets out, keeps the first sense, then more while within 22 letters; a long one is cut", () => {
    const long = "một nghĩa rất dài không có dấu chấm phẩy nào";
    const d = compileDeck([
      { id: "a", text: "sad", level: 1, vi: "buồn; buồn bả; buồn rầu" }, { id: "b", text: "good", level: 1, vi: "tốt; hay" }, { id: "c", text: "long", level: 1, vi: long },
      { id: "d", text: "none", level: 1 }, { id: "e", text: "lot", level: 1, vi: "nhiều, vô số (theo sau bởi of)" },
    ]);
    expect([0, 1, 2, 3, 4].map((word) => gloss(d, word))).toEqual(["buồn; buồn bả", "tốt; hay", "một nghĩa rất dài không…", "", "nhiều, vô số"]);
  });

  it("a long meaning keeps its words whole: up to its last comma that fits, else its last whole word (review R2)", () => {
    const d = compileDeck([
      { id: "a", text: "never", level: 1, vi: "chưa bao giờ, không bao giờ" }, { id: "b", text: "teacher", level: 1, vi: "giáo viên, thầy giáo, cô giáo" },
      { id: "c", text: "built", level: 1, vi: "(xà phòng) có thêm chất phụ gia tẩy rửa" },
    ]);
    expect([0, 1, 2].map((word) => gloss(d, word))).toEqual(["chưa bao giờ", "giáo viên, thầy giáo", "có thêm chất phụ gia tẩy…"]);
    const real = realDeck();
    for (let word = 0; word < real.count; word += 1) {
      const text = gloss(real, word);
      expect(text.length, real.vi[word]).toBeLessThanOrEqual(26);
      if (text.endsWith("…")) expect(real.vi[word]).toContain(text.slice(0, -1) + " "); // cut between words
    }
  });
});

describe("the review book (§7)", () => {
  it("takes a word typed sloppy, never a clean one or one with a single error", () => {
    const w = world({ deck });
    callWord(w, wordOf(deck, "apple"));
    type(w, "azzpple");
    callWord(w, wordOf(deck, "bread"));
    type(w, "bzread");
    callWord(w, wordOf(deck, "cider"));
    type(w, "cider");
    expect(book(w)).toEqual(["apple"]);
    expect(CALL.reviewErrors).toBe(2); // ≥ 2 errors: on a word of 3–8 letters always sloppy too
  });

  it("holds 20 words, oldest first: a 21st pushes the oldest out, a word again moves to the end, a quiz typed right takes it out", () => {
    const w = world({ deck });
    for (let word = 0; word < 21; word += 1) review(w, word, true);
    expect(book(w)).toEqual(WORDS.slice(1, 21));
    review(w, 5, true);
    expect(book(w)).toEqual([...WORDS.slice(1, 5), ...WORDS.slice(6, 21), WORDS[5]]);
    review(w, 7, false);
    review(w, 0, false); // not in it: nothing changes
    expect(book(w)).toEqual([...WORDS.slice(1, 5), ...WORDS.slice(6, 7), ...WORDS.slice(8, 21), WORDS[5]]);
  });

  it("is in the hash", () => {
    const [a, b] = [world({ deck }), world({ deck })];
    review(b, 3, true);
    expect(hashHex(a)).not.toBe(hashHex(b));
  });
});

describe("quizzes (§6, §7)", () => {
  it("none while the book is empty; then by day a helper asks one, at the helper, lit by its ring, the book's word under the meaning", () => {
    const w = school();
    run(w, T(30));
    expect(quizzes(w)).toEqual([]);
    review(w, wordOf(deck, "grape"), true);
    run(w, 1);
    const [c] = quizzes(w);
    const C = w.calls;
    expect([C.agent[c!], C.state[c!], C.bright[c!], C.words[c!], C.x[c!], C.z[c!]]).toEqual([1, CALL_STATE.open, 1, 1, w.agents.x[1], w.agents.z[1]]);
    expect(wordText(deck, w.words.word[C.word[c!]!]!)).toBe("grape");
  });

  it("asks the oldest word of the book whose first letter is free and that is not live already", () => {
    const w = school();
    for (const text of ["grape", "lemon", "river"]) review(w, wordOf(deck, text), true);
    callWord(w, wordOf(deck, "grape")); // live on another call: its letter is taken
    run(w, 1);
    const [c] = quizzes(w);
    expect(wordText(deck, w.words.word[w.calls.word[c!]!]!)).toBe("lemon");
  });

  it("typed right: the word leaves the book, +1 knowledge and +1 for the whole Perfect call; typed sloppy it stays, +1 only", () => {
    const w = school();
    review(w, wordOf(deck, "grape"), true);
    run(w, 1);
    type(w, "grape", 60, true);
    expect([book(w), w.knowledge, quizzes(w)]).toEqual([[], 2, []]);
    const other = school();
    review(other, wordOf(deck, "lemon"), true);
    run(other, 1);
    type(other, "lzzemon", 60, true);
    expect([book(other), other.knowledge, quizzes(other)]).toEqual([["lemon"], 1, []]);
  });

  it("a helper asks every 25 s at most, one live quiz each; never more quizzes than words in the book", () => {
    const w = school(3);
    review(w, wordOf(deck, "grape"), true);
    run(w, 1);
    expect(quizzes(w).length).toBe(1); // three helpers, one word
    review(w, wordOf(deck, "lemon"), true);
    review(w, wordOf(deck, "river"), true);
    run(w, 1);
    expect(quizzes(w).map((c) => w.calls.agent[c])).toEqual([1, 2, 3]);
    const asked = w.tick;
    type(w, wordText(deck, w.words.word[w.calls.word[quizzes(w)[0]!]!]!), 60, true);
    review(w, wordOf(deck, "stone"), true);
    for (; w.tick < asked + T(CALL.quizEveryS) - 2; ) run(w, 1);
    expect(quizzes(w).map((c) => w.calls.agent[c])).toEqual([2, 3]); // helper 1 waits its 25 s
    run(w, 3);
    expect(quizzes(w).map((c) => w.calls.agent[c]).sort()).toEqual([1, 2, 3]);
  });

  it("never hold the cap: at the cap a quiz nobody is typing dims for another call in a ring; the one being typed stays", () => {
    const w = school(2); // relax: 2 bright at most
    review(w, wordOf(deck, "grape"), true);
    review(w, wordOf(deck, "lemon"), true);
    run(w, 1);
    const [first, second] = quizzes(w);
    expect([w.calls.bright[first!], w.calls.bright[second!]]).toEqual([1, 1]);
    type(w, wordText(deck, w.words.word[w.calls.word[first!]!]!)[0]!, 60, true);
    const build = makeCall(w, CALL_KIND.build, 2, -1, 0, -1, -1); // the Bastion's, in the hero's ring
    run(w, 1);
    expect([w.calls.bright[first!], w.calls.bright[second!], w.calls.bright[build], w.calls.word[second!]]).toEqual([1, 0, 1, -1]);
    const mine = makeCall(w, CALL_KIND.mine, 2, -1, 0, -1, -1);
    run(w, 1);
    expect([w.calls.bright[first!], w.calls.bright[mine]]).toEqual([1, 0]); // nothing left to give way
  });

  it("end with their day (a locked one waits for its word); none are asked at night", () => {
    const w = school(2);
    review(w, wordOf(deck, "grape"), true);
    review(w, wordOf(deck, "lemon"), true);
    run(w, 1);
    const [first] = quizzes(w);
    const word = wordText(deck, w.words.word[w.calls.word[first!]!]!);
    type(w, word[0]!, 60, true);
    send(w, { t: "callNight" });
    expect(quizzes(w)).toEqual([first]); // the locked one stays
    type(w, word.slice(1), 60, true);
    run(w, T(30));
    expect([quizzes(w), w.knowledge]).toEqual([[], 2]);
  });
});

/** R3 (docs/td/BUILD_1B.md §11.2–§11.4, R3_PLAN §3.2): Từ Ôn, the saved book, the study plan, in the sim. */
describe("Từ Ôn: a book word comes back in an economy call (§11.2)", () => {
  const R = (w: World, kind: number = CALL_KIND.chop, words = 4): number => {
    const c = makeCall(w, kind, words, -1, 0, kind === CALL_KIND.chop ? 0 : -1, kind === CALL_KIND.harvest ? 0 : -1);
    [w.calls.state[c], w.calls.bright[c]] = [CALL_STATE.open, 1];
    return c;
  };
  const dealt = (w: World, c: number): { text: string; back: boolean } => {
    giveWord(w, c);
    const s = w.calls.word[c]!;
    return { text: s < 0 ? "" : wordText(deck, w.words.word[s]!), back: s >= 0 && w.words.kind[s] === KIND.review };
  };

  it("is due 25–45 s after it went in, then is the next word of a call of 4 words, never of a shorter one", () => {
    const w = world({ deck });
    review(w, wordOf(deck, "grape"), true);
    const due = w.typing.reviewAt[0]!;
    expect(due - w.tick).toBeGreaterThanOrEqual(T(LEARN.returnS[0]));
    expect(due - w.tick).toBeLessThanOrEqual(T(LEARN.returnS[1]));
    run(w, due - w.tick - 1);
    expect(dealt(w, R(w)).back).toBe(false); // a tick early
    run(w, 1);
    expect(dealt(w, R(w, CALL_KIND.harvest, 3))).toMatchObject({ back: false }); // Gặt asks 3 words: no room for one
    expect(dealt(w, R(w))).toEqual({ text: "grape", back: true });
    expect(w.learn.live).toBe(w.words.live().find((s) => w.words.kind[s] === KIND.review));
  });

  it("one live at a time and one a call; never in a power, quiz, Chữ Chiêu or direct call", () => {
    const w = world({ deck });
    for (const text of ["grape", "lemon"]) review(w, wordOf(deck, text), true);
    run(w, T(46));
    for (const kind of [CALL_KIND.power, CALL_KIND.ult, CALL_KIND.direct]) expect(dealt(w, R(w, kind, 4)).back, "kind " + kind).toBe(false);
    const c = R(w);
    expect(dealt(w, c).back).toBe(true);
    expect(dealt(w, R(w)).back).toBe(false); // one live
    type(w, w.words.live().map((s) => wordText(deck, w.words.word[s]!)).find((t) => t === "grape" || t === "lemon")!, 60, true);
    expect(w.learn.live).toBe(-1);
    expect(w.words.kind[w.calls.word[c]!]).not.toBe(KIND.review); // the same call's next word: it had its Từ Ôn
  });

  it("typed clean: Chuộc lại, +1 knowledge, out of the book, a review event; Vừa with one error stays and comes back later", () => {
    const w = world({ deck });
    review(w, wordOf(deck, "grape"), true);
    run(w, T(46));
    expect(dealt(w, R(w)).back).toBe(true);
    const events = type(w, "grape", 60, true);
    expect([book(w), w.knowledge, w.stats[STAT.reviewRedeemed], w.stats[STAT.reviewBack]]).toEqual([[], 1, 1, 1]);
    expect(events.find((e) => e.t === "review")).toMatchObject({ item: wordOf(deck, "grape"), redeemed: true });
    const other = world({ deck, mode: "challenge" });
    review(other, wordOf(other.typing.deck, "lemon"), true);
    run(other, T(46));
    expect(dealt(other, R(other)).back).toBe(true);
    const hit = type(other, "lzemon", 900).find((e) => e.t === "wordHit");
    expect(hit).toMatchObject({ errors: 1, grade: "ok" });
    expect([book(other), other.knowledge, other.typing.reviewBack[0], other.typing.reviewAt[0]! - other.tick >= T(LEARN.returnS[0]) - 1]).toEqual([["lemon"], 0, 1, true]);
  });

  it("typed sloppy it goes to the book's end with its returns kept, and comes back twice a run at most", () => {
    const w = world({ deck });
    for (const text of ["grape", "lemon"]) review(w, wordOf(deck, text), true);
    for (let round = 1; round <= 3; round += 1) {
      run(w, T(46));
      const c = R(w);
      const got = dealt(w, c);
      if (round === 3) {
        expect(got.back).toBe(false); // returns used up: grape may still come from the bag, as a plain word
        break;
      }
      expect(got).toEqual({ text: "grape", back: true });
      type(w, "gzzrape", 60, true);
      expect([book(w).at(-1), w.typing.reviewBack[w.typing.reviewN - 1]]).toEqual(["grape", round]);
      // lemon is due too: type it right so grape is the only due word next round
      if (round === 1) w.typing.reviewAt[0] = w.tick + T(100);
    }
  });
});

describe("the saved book and the study plan from the run header (§11.3, §11.4)", () => {
  const words = Array.from({ length: 120 }, (_, k) => "w" + String.fromCharCode(97 + (k % 26)) + String.fromCharCode(97 + Math.floor(k / 26)) + "x");
  const big = compileDeck(words.map((text, k) => ({ id: "id" + k, text, level: k < 60 ? 1 : 3 })));

  it("loads the book's newest 20 at tick 0, oldest first, each due 25–45 s on; ids the deck lacks are dropped", () => {
    const ids = [...Array.from({ length: 24 }, (_, k) => "id" + k), "gone"];
    const w = createWorld({ seed: 1, deck: big, learn: { book: ids, due: [], fresh: [] } });
    expect(Array.from(w.typing.review.subarray(0, w.typing.reviewN), (word) => big.ids[word])).toEqual(ids.slice(4, 24));
    for (let k = 0; k < 20; k += 1) expect(w.typing.reviewAt[k]).toBeGreaterThanOrEqual(T(25));
  });

  it("no lists: nothing drawn, the same world as no header; setLearn before the first step is createWorld({ learn })", () => {
    const empty = createWorld({ seed: 3, deck: big, learn: { book: [], due: [], fresh: [] } });
    const none = createWorld({ seed: 3, deck: big });
    run(empty, T(30));
    run(none, T(30));
    expect(hashHex(empty)).toBe(hashHex(none));
    const header = { book: ["id1", "id2"], due: ["id1", "id2", "id3"], fresh: ["id70", "id71"] };
    const made = createWorld({ seed: 3, deck: big, learn: header });
    const later = createWorld({ seed: 3, deck: big });
    setLearn(later, { book: ["id9"], due: ["id9"], fresh: [] });
    setLearn(later, header);
    expect(hashHex(later)).toBe(hashHex(made));
    expect(hashHex(made)).not.toBe(hashHex(none)); // the header is in the hash
    run(later, 1);
    setLearn(later, { book: [], due: [], fresh: [] }); // too late: ignored
    expect(later.typing.reviewN).toBe(2);
  });

  it("draws due 60 %, current 25 %, fresh 15 % (8 a run at most); no due list: fresh 15 %, the rest current; each due word once", () => {
    const due = Array.from({ length: 60 }, (_, k) => "id" + k);
    const fresh = Array.from({ length: 60 }, (_, k) => "id" + (60 + k));
    const w = createWorld({ seed: 5, deck: big, learn: { book: [], due, fresh } });
    const c = makeCall(w, CALL_KIND.chop, 4, -1, 0, 0, -1);
    const parts = { due: 0, fresh: 0, current: 0 };
    for (let k = 0; k < 80; k += 1) {
      const pick = planNext(w, c, 3, 8);
      const id = pick < 0 ? "" : big.ids[pick >> 2]!;
      parts[pick < 0 ? "current" : due.includes(id) ? "due" : "fresh"] += 1;
    }
    expect(parts.fresh).toBe(LEARN.freshMax);
    expect(parts.due / 80).toBeGreaterThan(0.52);
    expect(parts.due / 80).toBeLessThan(0.68);
    expect(w.learn.dueDealt).toBe(parts.due);
    // every due word once: past the list, its share falls back to the current levels
    for (let k = 0; k < 200; k += 1) planNext(w, c, 3, 8);
    expect([w.learn.dueDealt, Array.from(w.learn.due).every((word) => word === -1)]).toEqual([60, true]);
    const cold = createWorld({ seed: 5, deck: big, learn: { book: [], due: [], fresh } });
    let coldFresh = 0;
    const cc = makeCall(cold, CALL_KIND.chop, 4, -1, 0, 0, -1);
    for (let k = 0; k < 40; k += 1) if (planNext(cold, cc, 3, 8) >= 0) coldFresh += 1;
    expect(coldFresh).toBeGreaterThanOrEqual(2);
    expect(coldFresh).toBeLessThanOrEqual(LEARN.freshMax);
  });

  it("keeps E's band and free letters; no fresh word while the boss is up; never in a power, direct or Chữ Chiêu call", () => {
    const fresh = Array.from({ length: 30 }, (_, k) => "id" + (60 + k));
    const w = createWorld({ seed: 2, deck: big, learn: { book: [], due: [], fresh } });
    const c = makeCall(w, CALL_KIND.chop, 4, -1, 0, 0, -1);
    expect(Array.from({ length: 50 }, () => planNext(w, c, 3, 3)).every((pick) => pick < 0)).toBe(true); // every word has 4 letters
    w.boss.stage = BOSS.lull;
    expect(Array.from({ length: 50 }, () => planNext(w, c, 3, 8)).every((pick) => pick < 0)).toBe(true);
    w.boss.stage = BOSS.idle;
    for (const kind of [CALL_KIND.power, CALL_KIND.direct, CALL_KIND.ult]) {
      for (let k = 0; k < 20; k += 1) {
        const p = makeCall(w, kind, 1, -1, 0, -1, -1);
        [w.calls.state[p], w.calls.bright[p]] = [CALL_STATE.open, 1];
        giveWord(w, p);
        const s = w.calls.word[p]!;
        if (s >= 0) expect(fresh, "kind " + kind).not.toContain(big.ids[w.words.word[s]!]);
        closeCall(w, p);
      }
    }
    expect(w.stats[STAT.freshWords]).toBe(0);
  });
});
