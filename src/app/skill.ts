/**
 * The player's skill profile (docs/games/BALANCE.md §2, §4.1, §9.2): kept under the kit's key typing-defense.skill,
 * folded after each day and night (a held night, or the lost run) from what the sim tells: each word's letters,
 * first-to-last key time, time to its first key and familiarity (wordHit), the keys, slips, Backspaces and dropped
 * locks, the lives and the flow meter. The kit's updateSkill weighs a cycle 0.25 and leaves out short, AFK and
 * wildly-off ones. Before a run the blended profile gives the header: E (word length, the scoring clock) and pace k
 * against the standard bot, whose capacity is C_ref (so it plays at k = 1), with the director on or off.
 */
import { blendSkill, capacity, effectiveE, paceK, parseSkill, serializeSkill, STANDARD_BOTS, updateSkill, type Familiarity, type SkillMode, type SkillProfile, type SkillSample } from "../kit/balance";
import { safeLocalStorage } from "../kit/platform/safe-storage";
import { ECONOMY, EXPECTED } from "../content/rules";
import type { RareEvent } from "../sim/events";
import { STAT } from "../sim/stats";
import { lengthBand } from "../sim/systems/calls";
import type { PaceHeader } from "../sim/systems/pace";
import type { World } from "../sim/world";

/** skillStorageKey("typing-defense") (BALANCE.md §2; a test holds them equal). */
export const SKILL_KEY = "typing-defense.skill";

export const loadSkill = (mode: SkillMode): SkillProfile => parseSkill(safeLocalStorage.getItem(SKILL_KEY), "adult", mode);
export const saveSkill = (profile: SkillProfile): boolean => safeLocalStorage.setItem(SKILL_KEY, serializeSkill(profile));

/** ℓ̄ at E: the middle of its word band (TK 6.3). */
const meanLength = (e: number): number => (lengthBand(e)[0] + lengthBand(e)[1]) / 2;
const STANDARD = STANDARD_BOTS.find((bot) => bot.id === "standard")!;
/** C_ref: the standard bot's capacity at its own E_eff (35 WPM, 95 %, CV 0.25), so it plays at k = 1. */
export const C_REF = capacity(effectiveE({ e: STANDARD.wpm, a: STANDARD.accuracy, cv: STANDARD.cv }), meanLength(STANDARD.wpm), 1);

/** The run header from a profile: E (B of the sandbox) and pace k, two-way, from E_eff (BALANCE.md §4.1). */
export function paceHeader(profile: SkillProfile, director: boolean): PaceHeader & { expected: number } {
  const view = blendSkill(profile);
  const k = paceK(effectiveE(view), { len: meanLength(view.e), d: 1, ref: C_REF });
  return { k, director, expected: Math.max(EXPECTED.min, Math.min(EXPECTED.max, Math.round(view.e))) };
}

const FAMILIARITY: readonly Familiarity[] = ["known", "learning", "new"];
const COUNTERS = [STAT.keys, STAT.keyErrors, STAT.strays, STAT.backspaces, STAT.abandons] as const;

/** One day and night's typing, read from the sim's events; `read` returns the cycle's sample when it ends. */
export class SkillTally {
  private words = 0;
  private letters = 0;
  private ms = 0;
  private sum = 0;
  private sumSq = 0;
  private clean = 0;
  private sloppy = 0;
  private fam = FAMILIARITY.map(() => ({ words: 0, wait: 0, letters: 0, ms: 0 }));
  private base: number[] = [];
  private flow = { i: 0, n: 0, ticks: 0 };
  private cycles = 0;

  constructor(w: World) {
    this.reset(w);
  }

  private reset(w: World): void {
    this.words = this.letters = this.ms = this.sum = this.sumSq = this.clean = this.sloppy = 0;
    this.fam = FAMILIARITY.map(() => ({ words: 0, wait: 0, letters: 0, ms: 0 }));
    this.base = COUNTERS.map((stat) => w.stats[stat]!);
    const flow = w.pace.meter.summary("quit");
    this.flow = { i: (flow.i * flow.ticks) / 1000, n: flow.n, ticks: flow.ticks };
  }

  read(events: readonly RareEvent[], w: World): SkillSample | null {
    let ended: "won" | "lost" | null = null;
    for (const event of events) {
      if (event.t === "wordHit" && event.len > 1 && event.ms > 0) {
        const perLetter = event.ms / (event.len - 1);
        this.words += 1;
        this.letters += event.len - 1;
        this.ms += event.ms;
        this.sum += perLetter;
        this.sumSq += perLetter * perLetter;
        if (event.errors === 0) this.clean += 1;
        if (event.grade === "sloppy") this.sloppy += 1;
        const fam = this.fam[event.fam]!;
        [fam.words, fam.wait, fam.letters, fam.ms] = [fam.words + 1, fam.wait + event.wait / 60, fam.letters + event.len - 1, fam.ms + event.ms];
      } else if (event.t === "phase" && event.phase === "day" && event.day > 1) ended = "won";
      else if (event.t === "defeat") ended = "lost";
    }
    return ended === null ? null : this.sample(w, ended);
  }

  /** The cycle so far as a sample (a page closed mid-cycle: "quit"), then a fresh tally. */
  sample(w: World, outcome: SkillSample["outcome"]): SkillSample {
    const [keys, errors, strays, backspaces, abandons] = COUNTERS.map((stat, k) => w.stats[stat]! - this.base[k]!);
    const mean = this.words > 0 ? this.sum / this.words : 0;
    const flow = w.pace.meter.summary("quit");
    const ticks = flow.ticks - this.flow.ticks;
    const byFamiliarity: SkillSample["byFamiliarity"] = Object.fromEntries(FAMILIARITY.map((name, k) => {
      const f = this.fam[k]!;
      return [name, { words: f.words, wpm: f.ms > 0 ? (f.letters / 5) * (60000 / f.ms) : undefined, recognize: f.words > 0 ? f.wait / f.words : undefined }];
    }));
    const sample: SkillSample = {
      outcome, words: this.words, wpm: this.ms > 0 ? (this.letters / 5) * (60000 / this.ms) : undefined,
      keys: keys!, correctKeys: keys! - errors! - strays!, backspaces, cleanWords: this.clean, sloppyWords: this.sloppy, abandons,
      cv: mean > 0 && this.words > 1 ? Math.sqrt(Math.max(0, this.sumSq / this.words - mean * mean)) / mean : undefined,
      byFamiliarity, safety: outcome === "lost" ? 0 : w.lives / ECONOMY.lives, idle: ticks > 0 ? ((flow.i * flow.ticks) / 1000 - this.flow.i) / ticks : undefined,
      nearMisses: flow.n - this.flow.n, session: { first: this.cycles === 0 },
    };
    this.cycles += 1;
    this.reset(w);
    return sample;
  }
}
