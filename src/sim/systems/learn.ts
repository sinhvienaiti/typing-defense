/**
 * Học in the sim (BUILD_1B §11.2–§11.4, R3; docs/td/R3_PLAN.md §3.2). The run header carries three lists of deck ids that
 * src/app/learn.ts plans before the run (a replay file carries them too): `book`, the saved review book, goes into the
 * run's book at tick 0 (its newest 20; an id not in the deck is dropped); `due` and `fresh` feed the study plan. An
 * economy call's next word (harvest, chop, build, mine) is, in order:
 * - a Từ Ôn: a book word due again 25–45 s after it went in, its letter free; one live, one a call of ≥ 4 words, typed
 *   back twice a run at most. Typed clean or Good at least: "Chuộc lại", +1 knowledge, out of the book; else it stays
 *   and comes back later (a sloppy one at the book's end).
 * - with a plan, a part drawn on the `words` stream (due 60 %, current 25 %, fresh 15 %; no due list: current 85 %,
 *   fresh 15 %), then the part's first word not dealt yet that fits E's band and a free letter (a due word is reviewed
 *   once a run, R3_PLAN §5 A15); 8 fresh words a run at most, none while the boss is up (its night). A part with
 *   nothing that fits falls back to the current levels.
 * - else the bag of the current levels, as before.
 * A header with no list draws nothing, so an old replay plays as it did. The store is hashed (sim/hash.ts).
 */
import { createRng } from "../../kit/platform/rng";
import { ticks } from "../../content/compile";
import { LEARN } from "../../content/rules";
import type { Deck } from "../../typing/decks";
import { KIND } from "../../typing/letters";
import { STAT, bump } from "../stats";
import { BOSS } from "../stores/boss";
import type { World } from "../world";

/** Deck ids (BUILD_1B §11.3, §11.4); all three empty: no plan. Cold start: no book, no due, fresh words only. */
export type LearnHeader = { book: readonly string[]; due: readonly string[]; fresh: readonly string[] };
export const NO_LEARN: LearnHeader = { book: [], due: [], fresh: [] };

/** The plan's lists as deck indices (a word dealt turns −1); counts; the live Từ Ôn's word slot (−1). */
export class LearnStore {
  readonly due: Int32Array;
  readonly fresh: Int32Array;
  dueDealt = 0;
  freshDealt = 0;
  live = -1;

  constructor(due: readonly number[], fresh: readonly number[]) {
    this.due = Int32Array.from(due);
    this.fresh = Int32Array.from(fresh);
  }
}

/** Deck indices of `list`'s ids, in order; ids the deck lacks are dropped. */
export function deckIndices(deck: Deck, list: readonly string[]): number[] {
  if (list.length === 0) return [];
  const at = new Map(deck.ids.map((id, word) => [id, word]));
  return list.flatMap((id) => (at.has(id) ? [at.get(id)!] : []));
}

export const createLearn = (deck: Deck, header: LearnHeader = NO_LEARN): LearnStore => new LearnStore(deckIndices(deck, header.due), deckIndices(deck, header.fresh));

/** When a word that goes into the book (or stays in it) comes back: 25–45 s on (the `words` stream). */
const backAt = (w: World): number => w.tick + ticks(LEARN.returnS[0]) + w.rng.words.int(0, ticks(LEARN.returnS[1] - LEARN.returnS[0]));

/**
 * The review book (BUILD_1A6 §7), oldest first, with each word's due tick and returns typed: `add` puts the word in (at
 * the end, keeping its returns when it was there), at most 20, the oldest out; else takes it out.
 */
export function review(w: World, word: number, add: boolean): void {
  const T = w.typing;
  const columns = [T.review, T.reviewAt, T.reviewBack];
  const at = T.review.subarray(0, T.reviewN).indexOf(word);
  const back = at >= 0 ? T.reviewBack[at]! : 0;
  if (at >= 0) for (const column of columns) column.copyWithin(at, at + 1, T.reviewN);
  if (at >= 0) T.reviewN -= 1;
  if (!add) return;
  if (T.reviewN === T.review.length) {
    for (const column of columns) column.copyWithin(0, 1, T.reviewN);
    T.reviewN -= 1;
  }
  [T.review[T.reviewN], T.reviewAt[T.reviewN], T.reviewBack[T.reviewN]] = [word, backAt(w), back];
  T.reviewN += 1;
}

/** The saved book at tick 0 (BUILD_1B §11.3): its newest CALL.review words, oldest first. */
export function loadBook(w: World, header: LearnHeader = NO_LEARN): void {
  for (const word of deckIndices(w.typing.deck, header.book).slice(-w.typing.review.length)) review(w, word, true);
}

/**
 * The run header's lists before the first step (the page plans them once its chunk is in, after the world was made; a
 * replayed day's header): the world as createWorld({ learn }) makes it. Nothing draws on the `words` stream before the first
 * step, so it starts again from the seed.
 */
export function setLearn(w: World, header: LearnHeader): void {
  if (w.tick !== 0) return;
  const T = w.typing;
  w.rng.words.state = createRng(w.seed).words.state;
  for (const column of [T.review, T.reviewAt, T.reviewBack]) column.fill(0);
  T.reviewN = 0;
  Object.assign(w.learn, createLearn(T.deck, header));
  loadBook(w, header);
}

/** A Từ Ôn for economy call c (word × 4 + 1), −1 none (§11.2). */
export function reviewNext(w: World, c: number): number {
  const T = w.typing;
  const C = w.calls;
  if (w.learn.live >= 0 || C.review[c] === 1 || C.words[c]! < LEARN.minCallWords) return -1;
  const free = T.letters.free(w.tick, w.vocab);
  for (let k = 0; k < T.reviewN; k += 1) {
    if (T.reviewAt[k]! > w.tick || T.reviewBack[k]! >= LEARN.returns) continue;
    if (T.letters.claim(T.deck, w.words, T.review[k]!, KIND.review, w.tick, w.vocab, C.last[c]!, free) === 1) return T.review[k]! * 4 + 1;
  }
  return -1;
}

/** The boss is up, or it is its night: no fresh word (§11.4). */
const bossUp = (w: World): boolean => w.boss.stage > BOSS.warned || (w.boss.stage === BOSS.warned && w.phase !== "day");

/** The first word of `list` not dealt yet that fits [lo, hi] and takes a free letter for call c: dealt now (word × 4 + 1), −1 none. */
function deal(w: World, c: number, list: Int32Array, lo: number, hi: number): number {
  const T = w.typing;
  const free = T.letters.free(w.tick, w.vocab);
  for (let at = 0; at < list.length; at += 1) {
    const word = list[at]!;
    if (word < 0 || T.deck.len[word]! < lo || T.deck.len[word]! > hi) continue;
    if (T.letters.claim(T.deck, w.words, word, KIND.call, w.tick, w.vocab, w.calls.last[c]!, free) !== 1) continue;
    list[at] = -1;
    return word * 4 + 1;
  }
  return -1;
}

/** With a plan, the drawn part's word for economy call c in E's band [lo, hi] (word × 4 + 1); −1: the current levels' bag (§11.4). */
export function planNext(w: World, c: number, lo: number, hi: number): number {
  const L = w.learn;
  if (L.due.length + L.fresh.length === 0) return -1;
  const roll = w.rng.words.float();
  if (roll >= 1 - (L.due.length > 0 ? LEARN.plan : LEARN.cold).fresh) {
    const pick = L.freshDealt < LEARN.freshMax && !bossUp(w) ? deal(w, c, L.fresh, lo, hi) : -1;
    if (pick >= 0) L.freshDealt += 1;
    if (pick >= 0) bump(w.stats, STAT.freshWords);
    return pick;
  }
  const pick = L.due.length > 0 && roll < LEARN.plan.due ? deal(w, c, L.due, lo, hi) : -1;
  if (pick >= 0) L.dueDealt += 1;
  return pick;
}

/** A Từ Ôn typed (§11.2): redeemed (clean, or Good at least) leaves the book with +1 knowledge; a miss goes to its end; else due again later. */
export function reviewTyped(w: World, word: number, redeemed: boolean, missed: boolean): void {
  const T = w.typing;
  const at = T.review.subarray(0, T.reviewN).indexOf(word);
  if (at >= 0) T.reviewBack[at] = T.reviewBack[at]! + 1;
  bump(w.stats, STAT.reviewBack);
  if (redeemed) {
    w.knowledge += 1;
    bump(w.stats, STAT.reviewRedeemed);
  }
  if (redeemed || missed) review(w, word, !redeemed);
  else if (at >= 0) T.reviewAt[at] = backAt(w);
  w.events.rare.push({ t: "review", tick: w.tick, item: word, redeemed });
}
