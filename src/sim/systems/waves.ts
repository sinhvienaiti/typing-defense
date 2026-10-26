/**
 * Day, night and dawn (BUILD_1A6 §2; TK 18.3, 17.2). A run opens on Day 1;
 * when the day's clock runs out, or the player calls the night early
 * (Shift+Enter: up to 30 gold by the day's share left), the next
 * wave starts. The night ends when every wave has spawned and no enemy is
 * left: each wave pays 10 + 2 × its number; a 3 s dawn, then the next day.
 */
import { ticks, waveSchedule } from "../../content/compile";
import { CALL, ECONOMY, MODES, PHASE, TREE } from "../../content/rules";
import { STAT, bump } from "../stats";
import { BOSS } from "../stores/boss";
import { CALL_KIND } from "../stores/calls";
import { gapScale } from "./pace";
import type { Mode } from "../../content/types";
import type { World } from "../world";

export function enter(w: World, phase: "day" | "night" | "dawn", length: number): void {
  w.phase = phase;
  w.phaseEnd = length < 0 ? -1 : w.tick + length;
  if (phase === "day") w.dayStarts[w.day] = w.tick + 1;
  if (phase === "day") regrow(w);
  // Night falls: a chop call left open lives a power call's time; the villagers chop on alone (economy.ts: no new one by night).
  for (const c of phase === "night" ? w.calls.live() : []) if (w.calls.kind[c] === CALL_KIND.chop) w.calls.expire[c] = w.tick + ticks(CALL.powerLifeS);
  w.events.rare.push({ t: "phase", tick: w.tick, phase, day: w.day });
}

/** A new day (the owner's rule, 26/10/2026): every tree holds its whole reserve again; a stump grows back unless a building stands on it now. */
function regrow(w: World): void {
  const B = w.buildings;
  w.map.trees.forEach(([x, z], t) => {
    const near = (b: number): boolean => (B.x[b]! - x) * (B.x[b]! - x) + (B.z[b]! - z) * (B.z[b]! - z) < (w.c.buildings[B.def[b]!]!.radius + TREE.radiusM) * (w.c.buildings[B.def[b]!]!.radius + TREE.radiusM);
    if (w.trees.standing[t] === 0 && B.live().some(near)) return;
    [w.trees.standing[t], w.trees.left[t]] = [1, TREE.reserve];
  });
}

/** The day `key` (a building id, "keep2", "keep3", "upgrade") opens in the story (BUILD_1B §12); the sandbox opens all. */
export const opensOn = (w: World, key: string): number => (w.sandbox ? 1 : (w.c.content.stage?.unlock[key] ?? 1));
export const locked = (w: World, key: string): boolean => w.day < opensOn(w, key);

/** The sandbox's skipTo: day n of the stage, the nights before it counted as held (their enemies gone, no pay). */
export function skipTo(w: World, day: number): boolean {
  if (!(Number.isInteger(day) && day > w.wave && day <= (w.c.content.stage?.nights ?? w.c.content.waves.list.length)) || w.boss.stage >= BOSS.lull) return false;
  for (const e of w.enemies.live()) w.enemies.release(e);
  w.spawnQueue.length = 0;
  for (let wave = 1; wave < day; wave += 1) [w.waveLeft[wave], w.waveAlive[wave], w.waveEnded[wave]] = [0, 0, 1];
  [w.wave, w.day] = [day - 1, day];
  enter(w, "day", dayTicks(w.mode, w.pace.k));
  return true;
}

/** A day's ticks at pace k: the wave clock (BALANCE.md §4.1 "giờ đợt"), ÷ k. */
export const dayTicks = (mode: Mode, k: number): number => Math.round(ticks(MODES[mode].dayS) / k);

export function startWave(w: World): void {
  const wave = (w.wave += 1);
  const schedule = waveSchedule(w.c, wave, gapScale(w));
  const grounds = w.lanes.length - 1;
  // Packs take the ground routes in turn, from a side the spawn stream picks; a pace step taken when no spawn was left moves all but the first.
  const first = w.rng.spawn.int(0, grounds - 1);
  schedule.forEach((spawn, k) => {
    const at = k === 0 ? spawn.at : Math.max(1, spawn.at + w.pace.carry);
    w.spawnQueue.push({ tick: w.tick + at, enemy: spawn.enemy, route: spawn.lane < 0 ? grounds : (first + spawn.lane) % grounds, wave });
  });
  w.pace.carry = 0;
  w.pace.waveSize = Math.max(1, schedule.length);
  w.spawnQueue.sort((a, b) => a.tick - b.tick);
  w.waveLeft[wave] = schedule.length;
  w.waveAlive[wave] = 0;
  w.waveEnded[wave] = 0;
  w.events.rare.push({ t: "waveStart", tick: w.tick, wave });
}

/** The night falls: the next wave comes (the sandbox's "Sinh đêm" may add one to a night already running). */
export function startNight(w: World): void {
  if (w.phase !== "night") enter(w, "night", -1);
  startWave(w);
}

/**
 * The gold an early call on this tick pays: the call button shows it. Up to 30 by the day's share left, so it drains from
 * the day's first second (the owner's play-test, 26/10/2026: a flat 30 till the last 30 s read as no change).
 */
export const earlyCallBonus = (w: World): number =>
  w.phase === "day" ? Math.min(ECONOMY.earlyCall.goldCap, Math.ceil((ECONOMY.earlyCall.goldCap * Math.max(0, w.phaseEnd - w.tick)) / dayTicks(w.mode, w.pace.k))) : 0;

/** callNight (Shift+Enter): only by day. */
export function callNight(w: World): boolean {
  if (w.phase !== "day") return false;
  const bonus = earlyCallBonus(w);
  w.gold += bonus * 1000;
  bump(w.stats, STAT.goldEarly, bonus * 1000);
  w.events.rare.push({ t: "nightCalled", tick: w.tick, day: w.day, bonus });
  startNight(w);
  return true;
}

export function phaseStep(w: World): void {
  if (w.phase === "defeat" || w.phase === "victory") return;
  if (w.phase === "day" && w.tick >= w.phaseEnd) startNight(w);
  else if (w.phase === "dawn" && w.tick >= w.phaseEnd) {
    w.day += 1;
    enter(w, "day", dayTicks(w.mode, w.pace.k));
  }
  let open = 0;
  for (let wave = 1; wave <= w.wave; wave += 1) {
    if (w.waveEnded[wave] === 1) continue;
    if (w.waveLeft[wave]! > 0 || w.waveAlive[wave]! > 0) {
      open += 1;
      continue;
    }
    w.waveEnded[wave] = 1;
    const bonus = ECONOMY.waveBonus.base + ECONOMY.waveBonus.perWave * wave;
    w.gold += bonus * 1000;
    bump(w.stats, STAT.goldWave, bonus * 1000);
    bump(w.stats, STAT.wavesCleared);
    w.events.rare.push({ t: "waveEnd", tick: w.tick, wave, bonus });
  }
  // The boss night holds from its warning to the retreat (BUILD_1B §4.4).
  if (w.phase === "night" && open === 0 && !(w.boss.stage >= BOSS.warned && w.boss.stage < BOSS.done)) enter(w, "dawn", ticks(PHASE.dawnS));
}
