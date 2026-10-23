/**
 * A human-like typist for the Lời Gọi bots (docs/games/BALANCE.md §6): the kit's HumanTypist plans each word (the
 * time to see it by familiarity, a log-normal speed with spread CV, wrong keys at 1 − a, then a Backspace or a
 * dropped lock by chance, slower in a crowd and as fatigue builds), and the plan is played through the game's own
 * commands (`key`, `unlock` for Esc) on its ticks. The router keeps no wrong letter and the card never shows one, so
 * a key the plan calls right is the locked word's next letter and a planned Backspace has nothing to erase (its
 * moment passes, no key is sent); letters a plan did not cover are planned again at the same pace (no second look). Targets come by the typist's mix: the most dangerous (a power
 * word, which runs out), the nearest the hero, the first shown; a power word that cannot be finished in time is let
 * go. After a placement or a menu the hands rest a moment (lookAway). Its draws use a stream of its own.
 */
import { HumanTypist, KeyPlayer, type TypistParams } from "../../src/kit/balance/typist";
import type { Familiarity } from "../../src/kit/balance/profile";
import type { RngStream } from "../../src/kit/platform/rng";
import type { CommandBody } from "../../src/sim/commands";
import { CALL_KIND } from "../../src/sim/stores/calls";
import type { World } from "../../src/sim/world";

const MS = 1000 / 60;

/** The word's familiarity as the sim tells it in `wordHit` (calls.ts): a quiz is being learned, the run's top level is new. */
export function familiarity(w: World, s: number): Familiarity {
  if (w.calls.kind[w.words.call[s]!] === CALL_KIND.quiz) return "learning";
  return w.vocab > 1 && w.typing.deck.level[w.words.word[s]!] === w.vocab ? "new" : "known";
}

export class HumanHands {
  readonly typist: HumanTypist;
  /** The word id typed now, its plan, and the tick the hands are free again after a look away. */
  private target = -1;
  private player: KeyPlayer | null = null;
  private restUntil = 0;
  private pendingRest = 0;
  /** Power words already weighed: a new one may pull the hands off a word not begun (the telegraph reflex). */
  private readonly weighed = new Set<number>();
  private readonly wrong: RngStream;

  constructor(readonly params: TypistParams, rng: RngStream, wrong: RngStream) {
    this.typist = new HumanTypist(params, rng);
    this.wrong = wrong;
  }

  /** A placement or a menu: the hands wait while the eyes are away, once the word in hand is done (a lock is not held through a menu). */
  lookAway(): void {
    this.pendingRest += this.typist.lookAway();
  }

  /** Plans the letters of word slot s still to type; `fresh`: the word is new to the eyes (else no second look). Returns the ticks to its first key. */
  private plan(w: World, s: number, start: (recognize: number) => number, fresh: boolean): void {
    const W = w.words;
    const { deck } = w.typing;
    const word = W.word[s]!;
    let text = "";
    for (let k = W.typed[s]!; k < deck.len[word]!; k += 1) text += String.fromCharCode(97 + deck.letters[deck.start[word]! + k]!);
    const typed = this.typist.word(text, { familiarity: familiarity(w, s), live: W.count, minute: w.tick / 3600 });
    const events = fresh ? typed.events : typed.events.map((event) => ({ ...event, at: Math.max(0, event.at - typed.recognize) }));
    this.target = W.id(s);
    this.player = new KeyPlayer({ ...typed, events }, start(fresh ? typed.recognize : 0));
  }

  /** Picks the next word: power words that can still be finished, by the typist's mix (danger, nearest the hero, first shown). */
  private choose(w: World): number {
    const W = w.words;
    const C = w.calls;
    const live = W.live().filter((s) => {
      const expire = C.expire[W.call[s]!]!;
      return expire < 0 || (expire - w.tick) * MS >= ((w.typing.deck.len[W.word[s]!]! + 1) * 12000) / Math.max(1, this.params.wpm) + 400;
    });
    const options = live.map((s) => {
      const c = W.call[s]!;
      return { danger: C.kind[c] === CALL_KIND.power ? 2 : C.kind[c] === CALL_KIND.quiz ? 0 : 1, distance: Math.hypot(C.x[c]! - w.agents.x[0]!, C.z[c]! - w.agents.z[0]!), shown: W.born[s]! };
    });
    const pick = this.typist.choose(options);
    return pick < 0 ? -1 : live[pick]!;
  }

  /** This tick's typing commands. */
  keys(w: World): CommandBody[] {
    if (this.pendingRest > 0 && w.typing.router.lock < 0) [this.restUntil, this.pendingRest] = [w.tick + this.pendingRest, 0];
    if (!(this.params.wpm > 0) || w.tick < this.restUntil) return [];
    const W = w.words;
    const T = w.typing;
    const lock = T.router.lock;
    let s = this.target >= 0 ? W.slotOf(this.target) : -1;
    // A power call lights while the word in hand is not begun: by reflex (BALANCE.md §2 factor 9) the hands go to it;
    // its first letter takes the lock from a call's next word (the router's soft switch).
    const current = s >= 0 ? s : lock;
    if (current < 0 || (W.typed[current] === 0 && w.calls.kind[W.call[current]!] !== CALL_KIND.power)) {
      for (const p of W.live()) {
        if (w.calls.kind[W.call[p]!] !== CALL_KIND.power || this.weighed.has(W.id(p))) continue;
        this.weighed.add(W.id(p));
        if (current < 0 || !this.typist.handlesTelegraph()) continue;
        const born = W.born[p]!;
        this.plan(w, p, (recognize) => Math.max(born, w.tick - recognize), true);
        s = p;
        break;
      }
    }
    if (lock >= 0 && lock !== s && W.typed[lock]! > 0) {
      // The lock is on another word with letters typed (a soft switch took it there): go on with that one.
      s = lock;
      this.plan(w, s, () => W.born[lock]!, W.typed[lock] === 0);
    } else if (s < 0) {
      s = this.choose(w);
      if (s < 0) return [];
      // Seen while the hands were busy, the look may be over: the first key comes now at the earliest.
      const born = W.born[s]!;
      this.plan(w, s, (recognize) => Math.max(born, w.tick - recognize), true);
    }
    const out: CommandBody[] = [];
    const word = W.word[s]!;
    const len = T.deck.len[word]!;
    let typed = W.typed[s]!;
    for (const event of this.player!.due(w.tick)) {
      const at = w.tick * MS + out.length;
      if (event.kind === "abandon") {
        if (T.router.lock >= 0 || typed > 0) out.push({ t: "unlock" });
        this.target = -1;
        this.player = null;
        return out;
      }
      // A slip never shows on the card (the router keeps no wrong letter), so the Backspace the habit plans has nothing
      // to erase: the moment passes (its time stays in the plan) and no right letter is taken back.
      if (event.kind === "backspace") continue;
      const right = T.deck.letters[T.deck.start[word]! + typed]!;
      if (event.correct) {
        out.push({ t: "key", letter: right, atMs: at });
        typed += 1;
        if (typed >= len) return out;
        continue;
      }
      // A slip: a letter that is neither the right one nor another live word's first (no accidental switch).
      let slip = (right + 1 + this.wrong.int(0, 24)) % 26;
      while (slip === right || T.letters.owner[slip]! >= 0) slip = (slip + 1) % 26;
      out.push({ t: "key", letter: slip, atMs: at });
    }
    if (this.player!.done && out.length === 0) this.plan(w, s, () => w.tick, false);
    return out;
  }
}
