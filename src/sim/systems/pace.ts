/**
 * The run's pace (docs/games/BALANCE.md §4, §9.2; 25.6 after step 17). The header, recorded with the run, holds the
 * player's pace k and the "Nhịp tự điều" setting. k is the night's intensity and the day's call frequency: the pack
 * gaps and the day (the wave clock) ÷ k, enemies walk ×(1 + speedK·(k − 1)), the quiz and mine calls come ÷ k sooner.
 * A night (the wave, BALANCE.md §3 "thời gian đợt": the stage's flow) and a day each feed their FlowMeter: danger is
 * an enemy within PACE.dangerM of the Bastion, HP its lives, live words, words waiting at the bright-call cap, busy a
 * lock or a decision open (a call waiting, an order under way, a building the treasury affords), kills with their
 * path fraction. The phase's director judges every 5 s once the night's foes have walked in: at night a step is the
 * spawn interval ±7 %, one elite affix, the peak or the lull ±3 s, or a support drop near defeat (once a night); by
 * day only the call clocks move. The AttentionDirector keeps the typing budget: a call made sooner waits for room.
 * Meters, directors and what they changed are hashed; every step is a `pace` event.
 */
import { BANDS, bandModeFor } from "../../kit/balance/bands";
import { PaceDirector, type PaceDecision } from "../../kit/balance/director";
import { FlowMeter, type FlowSnapshot } from "../../kit/balance/flow";
import { ticks } from "../../content/compile";
import { BUILD, ECONOMY, MODES, PACE } from "../../content/rules";
import type { Mode } from "../../content/types";
import { STAT } from "../stats";
import { BOSS } from "../stores/boss";
import { CALL_KIND } from "../stores/calls";
import { MODE } from "../stores/walkers";
import type { World } from "../world";
import { slotsOpen } from "./agents";
import { bossWarning } from "./boss";
import { lit } from "./calls";
import { dayTicks } from "./waves";

/** The run header (BALANCE.md §4.1: set before the run, in the replay): pace k, rounded to 1/1000, and the director on or off. */
export type PaceHeader = { k: number; director: boolean };
export const PACE_OFF: PaceHeader = { k: 1, director: false };

export function createPace(mode: Mode, header: PaceHeader) {
  const band = BANDS[bandModeFor("adult", mode)];
  const off = header.director ? null : ("setting" as const);
  return {
    k: header.k, director: header.director, meter: new FlowMeter(), dayMeter: new FlowMeter(),
    night: new PaceDirector({ band, table: PACE.night, off }),
    day: new PaceDirector({ band: { ...band, p: {} }, table: PACE.day, off }),
    /** Night spawn interval and day call clocks, ‰ of the base; elite affixes waiting for the next spawns; ticks a step moves packs of a wave not yet begun. */
    spawn: 1000, calls: 1000, elite: 0, carry: 0, waveSize: 1, engaged: false,
    /** Enemies walk at ×foeSpeed: k's share of the night's clock (1 + speedK × (k − 1)). */
    foeSpeed: 1 + PACE.speedK * (header.k - 1),
    /** The phase last seen; Word Shot damage, other damage and dropped locks at the last tick; this tick's kills (path fractions). */
    phase: "" as string, seen: [0, 0, 0], kills: [] as number[],
  };
}

export type Pace = ReturnType<typeof createPace>;

/** The run header again before the first step (the title's settings changed): pace, the first day's length, E. */
export function setPace(w: World, header: PaceHeader & { expected: number }): void {
  if (w.tick !== 0) return;
  Object.assign(w.pace, createPace(w.mode, header));
  w.phaseEnd = dayTicks(w.mode, header.k);
  w.expected = header.expected;
}

/** A new mode (the sandbox): the directors judge against its band from now on. */
export function setPaceMode(w: World): void {
  const fresh = createPace(w.mode, w.pace);
  Object.assign(w.pace, { night: fresh.night, day: fresh.day });
}

/** Spawn gaps at the run's pace: the night director's interval, ÷ k. */
export const gapScale = (w: World): number => w.pace.spawn / 1000 / w.pace.k;
/** A call clock (seconds or a share) at the run's pace: the day director's scale, ÷ k. */
export const callScale = (w: World): number => w.pace.calls / 1000 / w.pace.k;

/** Queued spawns from index `from` move by `by` ticks (never before the next tick); none queued: the next wave's packs after its first. */
function shift(w: World, from: number, by: number): void {
  const Q = w.spawnQueue;
  if (from >= Q.length) w.pace.carry += by;
  for (let i = from; i < Q.length; i += 1) Q[i]!.tick = Math.max(w.tick + 1, Q[i]!.tick + by);
  Q.sort((a, b) => a.tick - b.tick);
}

/** Index of the first spawn after the next pack (a gap longer than two member gaps ends a pack). */
function afterPack(w: World): number {
  const Q = w.spawnQueue;
  let i = 1;
  while (i < Q.length && Q[i]!.tick - Q[i - 1]!.tick <= 2 * ticks(w.c.content.waves.memberGapS) * gapScale(w)) i += 1;
  return i;
}

function apply(w: World, director: PaceDirector, d: PaceDecision, night: boolean): void {
  const P = w.pace;
  if (!night) P.calls = d.spawnScale;
  else if (d.lever === "spawn") {
    for (const s of w.spawnQueue) s.tick = w.tick + 1 + Math.round(((s.tick - w.tick - 1) * d.spawnScale) / P.spawn);
    P.spawn = d.spawnScale;
  } else if (d.lever === "elite") {
    const taken = d.dir < 0 && P.elite === 0;
    P.elite = Math.max(0, P.elite + d.dir);
    director.report(d.id, taken ? 0 : d.dir * Math.round(((PACE.eliteHp - 1) * 1000) / P.waveSize));
  } else if (d.lever === "peak") shift(w, 0, d.amount);
  else if (d.lever === "lull") shift(w, afterPack(w), d.amount);
  else w.lives = Math.min(ECONOMY.lives, w.lives + PACE.supportLives);
  w.events.rare.push({ t: "pace", tick: w.tick, night, lever: d.lever, dir: d.dir, amount: d.amount, level: d.level });
}

/** What the meter reads this tick (BALANCE.md §3, §9.2). */
export function flowSnapshot(w: World): FlowSnapshot {
  const E = w.enemies;
  const C = w.calls;
  const A = w.agents;
  const [kx, kz] = w.map.keep;
  let danger = false;
  for (let e = 0; e < E.top; e += 1) {
    if (E.used[e] === 0 || E.dying[e] !== 0) continue;
    const d2 = (E.x[e]! - kx) * (E.x[e]! - kx) + (E.z[e]! - kz) * (E.z[e]! - kz);
    danger ||= d2 <= PACE.dangerM * PACE.dangerM;
    if (d2 <= PACE.engageM * PACE.engageM && !w.pace.engaged && w.phase === "night") {
      // The night's foes have walked in: from here the director judges (the approach from the gate is no lull to fill).
      w.pace.engaged = true;
      w.pace.meter.resetWindow();
    }
  }
  danger ||= bossWarning(w); // a boss move being warned (BUILD_1B §5.5)
  const lock = w.typing.router.lock;
  const locked = lock >= 0 ? w.words.call[lock]! : -1;
  let bright = 0;
  let waiting = 0;
  let busy = lock >= 0;
  for (let c = 0; c < C.top; c += 1) {
    if (C.used[c] === 0) continue;
    busy = true; // a call waits for an answer: someone to send, or the budget's pause left to the village (BUILD_1A6 §5.3)
    if (C.bright[c] === 1) bright += 1;
    // Words on calls in a ring kept waiting (at night economy calls wait their turn by rule: only power counts).
    else if (lit(w, c, locked) && (w.phase === "day" || C.kind[c] === CALL_KIND.power)) waiting += C.words[c]! - C.done[c]!;
  }
  for (let a = 0; a < slotsOpen(w) && !busy; a += 1) busy = A.mode[a] !== MODE.stand;
  // The shop is a decision too: the treasury affords the cheapest building and a place is free (TK 11.10).
  busy ||= w.buildings.count <= BUILD.caps.total && w.c.buildings.some((d) => d.placement !== "fixed" && w.gold >= d.gold[0]! * 1000 && w.wood >= d.wood[0]!);
  const s = w.stats;
  const seen = w.pace.seen;
  const now = [s[STAT.damageWordShot]!, s[STAT.damageTower]! + s[STAT.damageCrossbow]! + s[STAT.damageSoldier]! + s[STAT.damageHero]!, s[STAT.abandons]!];
  const damage = { typed: now[0]! - seen[0]!, other: now[1]! - seen[1]! };
  const abandons = now[2]! - seen[2]!;
  for (let k = 0; k < 3; k += 1) seen[k] = now[k]!;
  // At the bright-call cap the waiting words are a backlog; under it they wait for the typing budget's room, by design.
  const capped = bright >= MODES[w.mode].open && waiting > 0;
  return { danger, hp: w.lives / ECONOMY.lives, live: w.words.count, capped, backlog: capped ? waiting : 0, busy, kills: w.pace.kills, abandons, damage };
}

/**
 * After step 17: the phase's meter reads the tick (dawn is no one's), its director judges, a step acts at once. The
 * tick a night ends (its last kills, or the defeat) still belongs to the night's meter.
 */
export function paceStep(w: World): void {
  const P = w.pace;
  if (P.phase === "night" && w.phase !== "night") {
    P.meter.feed(flowSnapshot(w));
    P.kills.length = 0;
  }
  const night = w.phase === "night";
  if (P.phase !== w.phase) {
    P.phase = w.phase;
    P.engaged = false;
    if (night) P.night.beginWave(w.wave);
    else if (w.phase === "day") P.day.beginWave(w.day);
    (night ? P.meter : P.dayMeter).resetWindow();
  }
  if (!night && w.phase !== "day") return;
  const meter = night ? P.meter : P.dayMeter;
  const director = night ? P.night : P.day;
  meter.feed(flowSnapshot(w));
  P.kills.length = 0;
  if (w.boss.stage >= BOSS.lull) return; // the boss peak is scripted: the director stands still (BUILD_1B §5.5)
  const d = director.step(meter);
  if (d !== null) apply(w, director, d, night);
}

/** Every number of the pace state, for the world hash. */
export const paceState = (P: Pace): number[] => [P.k, P.director ? 1 : 0, P.spawn, P.calls, P.elite, P.carry, P.waveSize, P.engaged ? 1 : 0, P.foeSpeed, ...P.seen, ...P.meter.state(), ...P.dayMeter.state(), ...P.night.state(), ...P.day.state()];
