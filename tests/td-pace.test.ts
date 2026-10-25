import { describe, expect, it } from "vitest";
import { C_REF, loadSkill, paceHeader, saveSkill, SKILL_KEY, SkillTally } from "../src/app/skill";
import { GAME_ID } from "../src/app/learning";
import { BANDS, capacity, effectiveE, newSkillProfile, serializeSkill, skillStorageKey, STANDARD_BOTS, updateSkill, type PaceDecision } from "../src/kit/balance";
import { safeLocalStorage } from "../src/kit/platform/safe-storage";
import { ticks, waveSchedule } from "../src/content/compile";
import { CALL, ECONOMY, MODES, PACE } from "../src/content/rules";
import type { RareEvent } from "../src/sim/events";
import { hashHex } from "../src/sim/hash";
import { STAT } from "../src/sim/stats";
import { flowSnapshot, paceState, setPace } from "../src/sim/systems/pace";
import { startNight } from "../src/sim/systems/waves";
import { createWorld, step } from "../src/sim/world";
import { runBot } from "./td/bot";
import { HANDS } from "./td/balance";
import { heroDay, heroNight } from "./td/policies/hero";
import { STANDARD } from "./td/policies/layouts";
import { Plan } from "./td/policies/stand";
import { enemyPoint, goTo, run, send, world } from "./td/fixtures";
import { realDeck, smallDeck } from "./td/typing";

/** BALANCE.md step 4 in Lời Gọi (§9.2): the profile, the run header, pace k, the flow snapshot and the pace director. */
const deck = smallDeck(["apple", "bread", "cider", "dream", "eagle", "fable", "grape", "house", "ivory", "lemon", "mango", "olive", "peach", "river", "stone", "tiger"]);
const STANDARD_BOT = STANDARD_BOTS.find((bot) => bot.id === "standard")!;

describe("the skill profile (BALANCE.md §2)", () => {
  it("is kept under the kit's key typing-defense.skill and reads back the same; text it cannot read gives the defaults", () => {
    expect(SKILL_KEY).toBe(skillStorageKey(GAME_ID));
    const measured = updateSkill(newSkillProfile("adult", "balanced"), { outcome: "won", words: 60, wpm: 52, keys: 400, correctKeys: 380, cv: 0.2 }).profile;
    expect(saveSkill(measured)).toBeTypeOf("boolean");
    expect(loadSkill("balanced")).toEqual(JSON.parse(serializeSkill(measured)));
    safeLocalStorage.setItem(SKILL_KEY, "{not json");
    expect(loadSkill("balanced")).toEqual(newSkillProfile("adult", "balanced"));
    safeLocalStorage.removeItem(SKILL_KEY);
  });

  it("folds a day and night from the sim's events: words, their speed and evenness, keys, slips, recognition by familiarity; the outcome by the dawn or the defeat", () => {
    const w = createWorld({ seed: 1, deck });
    const tally = new SkillTally(w);
    const hit = (len: number, ms: number, errors: number, fam: number, wait: number): RareEvent =>
      ({ t: "wordHit", tick: 0, word: 0, call: 0, grade: errors > 1 ? "sloppy" : errors === 1 ? "ok" : "perfect", errors, quality: 1, len, ms, wait, fam, item: 0, kind: 2 });
    // Eight five-letter words at 240 ms a letter (50 WPM), one with a slip; then dawn on day 2.
    const words = Array.from({ length: 8 }, (_, k) => hit(5, k === 0 ? 1200 : 960, k === 0 ? 1 : 0, k < 2 ? 2 : 0, 60));
    w.stats[STAT.keys] = 41;
    w.stats[STAT.keyErrors] = 1;
    expect(tally.read(words, w)).toBeNull();
    const sample = tally.read([{ t: "phase", tick: 0, phase: "day", day: 2 }], w)!;
    expect(sample.outcome).toBe("won");
    expect(sample.words).toBe(8);
    expect(sample.wpm).toBeCloseTo((32 / 5) * (60000 / (1200 + 7 * 960)), 6);
    expect([sample.keys, sample.correctKeys, sample.cleanWords, sample.session?.first]).toEqual([41, 40, 7, true]);
    expect(sample.cv!).toBeGreaterThan(0);
    expect(sample.byFamiliarity!.new!.recognize).toBeCloseTo(1, 6);
    expect(sample.byFamiliarity!.new!.words).toBe(2);
    expect(updateSkill(newSkillProfile(), sample).accepted).toBe(true);
    // The next cycle starts empty: too short to count, but the defeat is its outcome.
    const lost = tally.read([hit(5, 900, 0, 0, 30), { t: "defeat", tick: 0 }], w)!;
    expect([lost.outcome, lost.words, lost.session?.first]).toEqual(["lost", 1, false]);
    expect(updateSkill(newSkillProfile(), lost).reason).toBe("short");
  });
});

describe("the run header and pace k (BALANCE.md §4.1)", () => {
  it("gives the standard bot k = 1 (C_ref is its capacity); faster and cleaner is above, slower below, within 0.75–1.30", () => {
    expect(C_REF).toBeCloseTo(capacity(effectiveE({ e: STANDARD_BOT.wpm, a: STANDARD_BOT.accuracy, cv: STANDARD_BOT.cv }), 4.5, 1), 9);
    const at = (wpm: number, a: number, cv: number) => paceHeader(updateSkill(newSkillProfile(), { outcome: "won", words: 60, wpm, keys: 400, correctKeys: Math.round(400 * a), cv }).profile, true);
    expect(at(35, 0.95, 0.25)).toEqual({ k: 1, director: true, expected: 35 });
    expect(at(70, 0.97, 0.15).k).toBe(1.3);
    expect(at(25, 0.92, 0.35).k).toBe(0.75);
    expect(at(50, 0.85, 0.35).k).toBeLessThan(at(50, 0.96, 0.2).k);
    // Nothing measured: the mode's defaults (Cân bằng is the standard player).
    expect(paceHeader(newSkillProfile(), false)).toEqual({ k: 1, director: false, expected: 35 });
  });

  it("divides the night's pack gaps, the day's clock, the quiz and the mine's call by k, and walks the enemies at 1 + speedK·(k − 1)", () => {
    const fast = createWorld({ seed: 1, deck, pace: { k: 1.3, director: false } });
    const slow = createWorld({ seed: 1, deck, pace: { k: 0.75, director: false } });
    expect(fast.phaseEnd).toBe(Math.round(ticks(MODES.balanced.dayS) / 1.3));
    expect(slow.phaseEnd).toBe(Math.round(ticks(MODES.balanced.dayS) / 0.75));
    const gaps = (k: number) => waveSchedule(fast.c, 5, 1 / k).map((spawn) => spawn.at);
    expect(gaps(1.3).at(-1)!).toBeLessThan(gaps(1).at(-1)!);
    expect(gaps(0.75).at(-1)!).toBeGreaterThan(gaps(1).at(-1)!);
    expect(fast.pace.foeSpeed).toBeCloseTo(1 + PACE.speedK * 0.3, 9);
    // The helpers' quiz: a helper out, a word in the review book.
    for (const w of [fast, slow]) {
      send(w, { t: "sandbox", op: { op: "keepLevel", value: 2 } });
      w.typing.review[0] = 0;
      w.typing.reviewN = 1;
      run(w, 2);
    }
    expect(fast.agents.quizAt[1]! - fast.tick).toBeLessThan(slow.agents.quizAt[1]! - slow.tick);
    expect(Math.abs(fast.agents.quizAt[1]! - fast.tick - Math.round(ticks(CALL.quizEveryS) / 1.3))).toBeLessThanOrEqual(2);
  });

  it("keeps the attention budget at every k: the R3 typist at 35 WPM never types more than 8 s in 20 s, director on", () => {
    const real = realDeck();
    for (const k of [0.75, 1.3]) {
      const r = runBot({ seed: 3, deck: real, hands: HANDS, expected: 35, mode: "balanced", nights: 2, pace: { k, director: true }, plan: () => new Plan(STANDARD, [heroDay(), heroNight()]) });
      expect(r.windowMax, "k " + k).toBeLessThanOrEqual(ticks(MODES.balanced.typeS));
      expect(r.stats.callWords).toBeGreaterThan(10);
    }
  });

  it("is the run's: the same seed, commands and header step to the same hash; another k or the director's setting does not", () => {
    const hashes = (pace: { k: number; director: boolean }) => {
      const w = createWorld({ seed: 4, deck, pace });
      startNight(w);
      for (let t = 0; t < 1800; t += 1) step(w);
      return hashHex(w);
    };
    expect(hashes({ k: 1.1, director: true })).toBe(hashes({ k: 1.1, director: true }));
    expect(hashes({ k: 1.1, director: true })).not.toBe(hashes({ k: 1, director: true }));
    expect(hashes({ k: 1, director: true })).not.toBe(hashes({ k: 1, director: false }));
  });

  it("can be set again before the first step only (the title's settings)", () => {
    const w = createWorld({ seed: 1, deck });
    setPace(w, { k: 1.2, director: true, expected: 50 });
    expect([w.pace.k, w.pace.director, w.expected, w.phaseEnd]).toEqual([1.2, true, 50, Math.round(ticks(MODES.balanced.dayS) / 1.2)]);
    step(w);
    setPace(w, { k: 0.8, director: false, expected: 20 });
    expect([w.pace.k, w.expected]).toEqual([1.2, 50]);
  });
});

describe("the flow snapshot (BALANCE.md §3, §9.2)", () => {
  it("reads danger near the Bastion, lives, live words, waiting words at the cap, busy and kills with their path fraction", () => {
    const w = world({ deck, gold: 0 });
    const calm = flowSnapshot(w);
    expect([calm.danger, calm.hp, calm.live, calm.capped, calm.backlog]).toEqual([false, 1, 0, false, 0]);
    const [kx, kz] = w.map.keep;
    const e = enemyPoint(w, "cuong-thi", kx, kz - PACE.dangerM + 1);
    w.lives = 15;
    const near = flowSnapshot(w);
    expect([near.danger, near.hp]).toEqual([true, 15 / ECONOMY.lives]);
    w.enemies.x[e] = kx + PACE.dangerM + 1;
    expect(flowSnapshot(w).danger).toBe(false);
    // A kill's path fraction reaches the meter on its tick.
    w.enemies.hp[e] = 0;
    w.enemies.dying[e] = 1;
    w.enemies.dist[e] = w.lanes[0]!.length / 2;
    w.enemies.route[e] = 0;
    startNight(w);
    step(w);
    expect(w.pace.meter.summary("quit").kills).toBe(1);
    expect(w.pace.meter.summary("quit").q).toBe(500);
  });

  it("counts a call waiting for an answer, an order under way or an affordable building as a decision open (busy); none of it is idle", () => {
    const w = world({ deck, gold: 0, wood: 0 });
    expect(flowSnapshot(w).busy).toBe(false);
    w.gold = 1000 * 1000;
    w.wood = 1000;
    expect(flowSnapshot(w).busy).toBe(true);
    w.gold = 0;
    send(w, { t: "move", agent: 0, qx: 0, qz: 0 });
    expect(flowSnapshot(w).busy).toBe(true);
    goTo(w, 0, 0, 0);
    w.gold = 0;
    for (const c of w.calls.live()) w.calls.release(c);
    expect(flowSnapshot(w).busy).toBe(false);
    w.typing.router.lock = 0;
    expect(flowSnapshot(w).busy).toBe(true);
  });
});

describe("the pace director in the sim (BALANCE.md §4.2, the step table of §9.2)", () => {
  /** A night under way with spawns queued; the director's decision is applied as the sim would. */
  function night(k = 1) {
    const w = createWorld({ seed: 2, deck, pace: { k, director: true } });
    startNight(w);
    return w;
  }
  const decide = (w: ReturnType<typeof night>, lever: PaceDecision["lever"], dir: 1 | -1) => {
    // Feeds the night meter windows that are too calm (no danger) or too hot (lives falling) until the director steps with `lever`.
    const before = w.pace.night.log.length;
    for (let t = 0; t < 60 * 60 && w.pace.night.log.length === before; t += 1) {
      if (dir < 0 && t % 30 === 0) w.lives = Math.max(1, w.lives - 1);
      step(w);
      for (const e of w.enemies.live()) w.enemies.dist[e] = 0; // nobody comes near: calm
    }
    return w.pace.night.log.at(-1)!;
  };

  it("steps a calm night harder after three calm windows: the spawn interval −7 % on what is still queued, then one elite affix (×1.6 hit points at spawn)", () => {
    const w = night();
    // A spawn far ahead, so the step finds something queued: its time from now shrinks by 7 %.
    w.spawnQueue.push({ tick: 20000, enemy: 0, route: 0, wave: w.wave });
    w.waveLeft[w.wave]! += 1;
    const first = decide(w, "spawn", 1);
    expect([first.lever, first.dir, first.spawnScale]).toEqual(["spawn", 1, 1000 - PACE.night.spawnStep]);
    expect(w.pace.spawn).toBe(930);
    const far = w.spawnQueue.at(-1)!.tick;
    expect(Math.abs(far - (first.tick + 1 + Math.round((20000 - first.tick - 1) * 0.93)))).toBeLessThanOrEqual(1);
    expect(w.events.rare.some((event) => event.t === "pace" && event.lever === "spawn")).toBe(true);
    // The night director makes at most 2 steps a wave; a new wave lets it step again.
    w.pace.night.beginWave(w.wave + 1);
    const second = decide(w, "elite", 1);
    expect(second.lever).toBe("elite");
    expect(w.pace.elite).toBe(1);
    w.spawnQueue.unshift({ tick: w.tick, enemy: 0, route: 0, wave: w.wave });
    w.waveLeft[w.wave]! += 1;
    step(w);
    const elite = w.enemies.live().find((e) => w.enemies.elite[e] === 1)!;
    expect(w.enemies.hp[elite]).toBe(Math.round(w.c.enemies[0]!.hp * PACE.eliteHp));
    expect(w.pace.elite).toBe(0);
  });

  it("near defeat drops support once a night (+2 lives, never over the start), and the director's state is in the hash", () => {
    const w = night();
    w.pace.engaged = true;
    w.lives = 6;
    const d = decide(w, "support", -1);
    expect([d.lever, d.dir]).toEqual(["support", -1]);
    expect(w.pace.night.summary().supports).toBe(1);
    const a = createWorld({ seed: 2, deck, pace: { k: 1, director: true } });
    const b = createWorld({ seed: 2, deck, pace: { k: 1, director: true } });
    b.pace.night.beginWave(3);
    expect(hashHex(a)).not.toBe(hashHex(b));
    expect(paceState(a.pace).length).toBeGreaterThan(30);
  });

  it("by day moves only the call clocks, and does nothing at all when the setting is off", () => {
    const w = createWorld({ seed: 2, deck, pace: { k: 1, director: true } });
    for (let t = 0; t < ticks(70) && w.pace.day.log.length === 0; t += 1) step(w);
    for (const event of w.pace.day.log) expect(event.lever).toBe("spawn");
    if (w.pace.day.log.length > 0) expect(w.pace.calls).not.toBe(1000);
    const off = createWorld({ seed: 2, deck, pace: { k: 1, director: false } });
    startNight(off);
    for (let t = 0; t < ticks(60); t += 1) step(off);
    expect(off.pace.night.log.length + off.pace.day.log.length).toBe(0);
    expect(BANDS.balanced.p.min).toBe(150);
  });
});
