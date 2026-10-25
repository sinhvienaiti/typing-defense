/**
 * Học at the page (BUILD_1B §11.1, §11.3–§11.5, R3; docs/td/R3_PLAN.md §3.3), a chunk of its own. The store under
 * typing-defense.learn ({ v: 1, book: ids oldest first, ≤ 40; seen: id → times seen, ≤ 3 }) is the app's and the view's
 * only: never in the sim, never hashed (§11.1). Before a run planFor turns it into the run header's lists (a pure
 * function: the bots on Node call it too). During the run each word that shows bright counts as seen (the cards read it
 * for the meaning rule), and each word typed is one learning event, sent in batches every 5 s through the portal bridge;
 * a replayed day's events were dropped before anyone read them, so it sends none. At each day, night and the run's end
 * (won, lost, the page left) the run's book is folded into the store: the words redeemed or quizzed right leave it.
 */
import { buildCombatLearningEvent, buildRecallLearningEvent, type LearningEvent } from "../kit/learning";
import { safeLocalStorage } from "../kit/platform/safe-storage";
import type { VocabularyEntry } from "../kit/vocab/types";
import { CALL, LEARN } from "../content/rules";
import type { RareEvent } from "../sim/events";
import { CALL_KIND } from "../sim/stores/calls";
import type { LearnHeader } from "../sim/systems/learn";
import type { World } from "../sim/world";
import { wordText, type Deck } from "../typing/decks";
import { GAME_ID } from "./learning";

export const LEARN_KEY = "typing-defense.learn";
export type LearnStore = { v: 1; book: string[]; seen: Record<string, number> };
type Storage = Pick<typeof safeLocalStorage, "readJson" | "writeJson">;

/** The stored value, or an empty store when it is missing or not this shape (§11.3). */
export function readLearn(raw: unknown): LearnStore {
  const value = raw as Partial<LearnStore> | null;
  const book = Array.isArray(value?.book) ? value.book.filter((id): id is string => typeof id === "string").slice(-LEARN.bookSaved) : [];
  const seen: Record<string, number> = {};
  if (value?.v === 1 && value.seen !== null && typeof value.seen === "object") {
    for (const [id, times] of Object.entries(value.seen)) if (typeof times === "number" && times > 0) seen[id] = Math.min(LEARN.seenCap, Math.floor(times));
  }
  return { v: 1, book: value?.v === 1 ? book : [], seen };
}

/**
 * The run header's lists (§11.4; R3_PLAN §3.3): due, the saved book (≤ 40, words the deck still has); fresh, up to 24
 * words of the run's top level never seen, in deck order turned round by the seed (the sim deals 8 at most); book, the
 * saved book's newest 20 for the run's own book. A store with no book and nothing seen is the cold start: fresh only.
 */
export function planFor(deck: Deck, store: LearnStore, vocab: number, seed: number): LearnHeader {
  const known = new Set(deck.ids);
  const due = store.book.filter((id) => known.has(id)).slice(-LEARN.bookSaved);
  const pool: string[] = [];
  for (let word = 0; word < deck.count; word += 1) if (deck.level[word] === vocab && !((store.seen[deck.ids[word]!] ?? 0) > 0)) pool.push(deck.ids[word]!);
  const from = pool.length === 0 ? 0 : (seed >>> 0) % pool.length;
  return { book: due.slice(-CALL.review), due, fresh: [...pool.slice(from), ...pool.slice(0, from)].slice(0, LEARN.freshPlanned) };
}

/** The store after a run (§11.3): the saved book but the words that left it (redeemed, quizzed right) and the run's own, then the run's book; the newest 40, each once. */
export function foldBook(book: readonly string[], run: readonly string[], left: ReadonlySet<string>): string[] {
  const kept = book.filter((id) => !left.has(id) && !run.includes(id));
  return [...kept, ...run].slice(-LEARN.bookSaved);
}

/** One more sighting of `id`, at most seenCap; past seenIds ids the oldest goes (§11.1, R3_PLAN §3.3). */
export function countSeen(seen: Record<string, number>, id: string): void {
  if (seen[id] === undefined) {
    const ids = Object.keys(seen);
    for (let k = 0; k <= ids.length - LEARN.seenIds; k += 1) delete seen[ids[k]!];
  }
  seen[id] = Math.min(LEARN.seenCap, (seen[id] ?? 0) + 1);
}

const entryOf = (deck: Deck, item: number): VocabularyEntry => ({ id: deck.ids[item]!, en: wordText(deck, item), vi: deck.vi[item] ?? "", ipa: deck.ipa[item] ?? "" });

/** The learning event of a typed word (§11.5): a quiz is a recall typed right or not; any other word "correct" unless sloppy. */
export function learningEvent(deck: Deck, hit: Extract<RareEvent, { t: "wordHit" }>, at: string): LearningEvent {
  const entry = entryOf(deck, hit.item);
  if (hit.kind === CALL_KIND.quiz) {
    const perfect = hit.grade !== "sloppy" && hit.errors < CALL.reviewErrors;
    return buildRecallLearningEvent({ gameId: GAME_ID, result: { entry, completed: true, perfect, hintCount: 0, replayCount: 0, responseMs: hit.ms }, occurredAt: at });
  }
  return buildCombatLearningEvent({ gameId: GAME_ID, entry, perfect: hit.grade !== "sloppy", occurredAt: at });
}

/** The run's learner: the store, the header the run was planned with, the events waiting to be sent. */
export class Learner {
  readonly store: LearnStore;
  readonly header: LearnHeader;
  /** The last events sent (td-1b-learn reads them through __td.learning()). */
  readonly sent: LearningEvent[] = [];
  private readonly left = new Set<string>();
  private queue: LearningEvent[] = [];
  private sentAt = 0;

  /** `header`: a replayed day's, else planned now from the store. */
  constructor(private readonly deck: Deck, vocab: number, seed: number, private readonly send: (event: LearningEvent) => void, header?: LearnHeader, private readonly storage: Storage = safeLocalStorage) {
    this.store = readLearn(storage.readJson(LEARN_KEY));
    this.header = header ?? planFor(deck, this.store, vocab, seed);
  }

  /** Times the deck word was seen, this sighting included (§11.1). */
  seen(item: number): number {
    return this.store.seen[this.deck.ids[item]!] ?? 0;
  }

  /** This frame's events: sightings, typed words (their events), words that left the book; the store kept at each day, night and end. */
  read(events: readonly RareEvent[], w: World, now: number): void {
    for (const e of events) {
      if (e.t === "wordSpawn") countSeen(this.store.seen, this.deck.ids[e.item]!);
      else if (e.t === "wordHit") {
        this.queue.push(learningEvent(this.deck, e, new Date().toISOString()));
        if (e.kind === CALL_KIND.quiz && e.grade !== "sloppy" && e.errors < CALL.reviewErrors) this.left.add(this.deck.ids[e.item]!);
      } else if (e.t === "review" && e.redeemed) this.left.add(this.deck.ids[e.item]!);
      if (e.t === "phase" || e.t === "victory" || e.t === "defeat") this.save(w);
    }
    if (this.queue.length > 0 && now - this.sentAt >= LEARN.sendS * 1000) this.flush(now);
  }

  /** The waiting events go out (the page left: at once). */
  flush(now: number): void {
    for (const event of this.queue) this.send(event);
    this.sent.push(...this.queue);
    this.sent.splice(0, Math.max(0, this.sent.length - 50));
    [this.queue, this.sentAt] = [[], now];
  }

  /** The run's book folded into the store, and the store written (§11.3). */
  save(w: World): void {
    const T = w.typing;
    const run = Array.from(T.review.subarray(0, T.reviewN), (word) => this.deck.ids[word]!);
    this.store.book = foldBook(this.store.book, run, this.left);
    this.storage.writeJson(LEARN_KEY, this.store);
  }
}
