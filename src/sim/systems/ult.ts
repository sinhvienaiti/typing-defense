/**
 * Tối Thượng, Mảnh Chữ and Chữ Chiêu (BUILD_1B §8; after step 7). The charge fills from typed words, broken mechanics,
 * Mảnh Chữ (enemies dying within 12 m of Draconis, the boss's stagger) and the night itself, never past full. Cast
 * (the `ult` command) within 20 m of Draconis once it is full and 45 s after the last: "Mưa Lông Lửa", a feather every
 * 10 ticks, each falling ~0.8 s onto the enemy with the most hit points in the 6 m it has not aimed at yet (round and
 * round; none: the spot) in a 1.5 m blast of 25 magic (the boss ×0.25: combat.ts). The Chữ Chiêu call (3 known short
 * words over Draconis, 4 s) brings 3 feathers a word 0.3 s later, a whole Perfect call one more. Once the last has
 * fallen and the call is over, the enemies left in the rain burn 3 s (never the boss). The app picks the spot (ultSpot)
 * and the command carries it, so a replay casts the same rain.
 */
import { ticks } from "../../content/compile";
import { BUILD, TICK_HZ, ULT } from "../../content/rules";
import { SOURCE, STAT, bump } from "../stats";
import { CALL_KIND } from "../stores/calls";
import { PROJECTILE } from "../stores/projectiles";
import type { World } from "../world";
import { makeCall } from "./calls";
import { locked, opensOn } from "./waves";

const FALL = ticks(ULT.fallS);
/** A feather comes down from the north-west at 12 m/s: FALL ticks onto a target standing still. */
const SPEED = 12 / TICK_HZ;
const FROM = [-0.6 * SPEED * FALL, -0.8 * SPEED * FALL] as const;

const near = (ax: number, az: number, bx: number, bz: number, r: number): boolean => (ax - bx) * (ax - bx) + (az - bz) * (az - bz) <= r * r;

/** Charge `points`, up to full. */
export function ultCharge(w: World, points: number): void {
  w.ult.charge = Math.min(ULT.max, w.ult.charge + points);
}

/** `shards` Mảnh Chữ of something brought down at (x, z): charge, if Draconis is within 12 m. */
export function ultShards(w: World, x: number, z: number, shards: number): void {
  if (shards <= 0 || !near(w.agents.x[0]!, w.agents.z[0]!, x, z, ULT.ringM)) return;
  bump(w.stats, STAT.shards, shards);
  ultCharge(w, ULT.shard * shards);
}

/** Where the app casts: the mouse on the field within 20 m of Draconis; else the enemy, within 14 m of him, with the most enemy hit points within 6 m of it; none: where he is. */
export function ultSpot(w: World, mouse: { x: number; z: number } | null): { x: number; z: number } {
  const [hx, hz] = [w.agents.x[0]!, w.agents.z[0]!];
  if (mouse !== null && near(mouse.x, mouse.z, hx, hz, ULT.castM)) return mouse;
  const E = w.enemies;
  let [best, most] = [{ x: hx, z: hz }, 0];
  for (let e = 0; e < E.top; e += 1) {
    if (E.used[e] === 0 || E.dying[e] !== 0 || !near(E.x[e]!, E.z[e]!, hx, hz, ULT.autoM)) continue;
    let sum = 0;
    for (let o = 0; o < E.top; o += 1) if (E.used[o] === 1 && E.dying[o] === 0 && near(E.x[o]!, E.z[o]!, E.x[e]!, E.z[e]!, ULT.areaM)) sum += E.hp[o]!;
    if (sum > most) [best, most] = [{ x: E.x[e]!, z: E.z[e]! }, sum];
  }
  return best;
}

/** Shut until the night of its unlock day (BUILD_1B §12 "dùng được từ Đêm 3"; test pass 27/10: day 3 already cast it). */
export const ultShut = (w: World): boolean => locked(w, "ult") || (w.day === opensOn(w, "ult") && w.phase === "day" && !w.sandbox);

/** The `ult` command: full, 45 s on, no rain falling, within 20 m of Draconis (quarter metres); the reason it may not, or null. */
export function castUlt(w: World, qx: number, qz: number): string | null {
  const U = w.ult;
  if (ultShut(w)) return "locked";
  if (!Number.isInteger(qx) || !Number.isInteger(qz)) return "bounds";
  if (U.charge < ULT.max) return "ultEmpty";
  if (U.on === 1 || w.tick - U.castAt < ticks(ULT.minGapS)) return "ultBusy";
  const [x, z] = [qx * BUILD.snapM, qz * BUILD.snapM];
  if (!near(x, z, w.agents.x[0]!, w.agents.z[0]!, ULT.castM)) return "ultFar";
  Object.assign(U, { charge: 0, castAt: w.tick, on: 1, x, z, left: ULT.feathers, nextAt: w.tick, lastAt: w.tick, due: 0, aimedN: 0 });
  const c = makeCall(w, CALL_KIND.ult, ULT.words, -1, -1, -1, -1, ticks(ULT.lifeS), 0); // over Draconis: always in his ring
  U.call = c < 0 ? -1 : w.calls.id(c);
  bump(w.stats, STAT.ultCasts);
  w.events.rare.push({ t: "ult", tick: w.tick, x, z });
  return null;
}

/** Chữ Chiêu: `n` feathers more, 0.3 s from now. */
export function ultFeathers(w: World, n: number): void {
  if (w.ult.on === 0 || n <= 0) return;
  [w.ult.due, w.ult.dueAt] = [w.ult.due + n, w.tick + ticks(ULT.delayS)];
}

/** The enemy with the most hit points in the rain not aimed at this round (a new round once each was), −1 none. */
function aim(w: World): number {
  const U = w.ult;
  const E = w.enemies;
  for (let round = 0; round < 2; round += 1) {
    let best = -1;
    for (let e = 0; e < E.top; e += 1) {
      if (E.used[e] === 0 || E.dying[e] !== 0 || !near(E.x[e]!, E.z[e]!, U.x, U.z, ULT.radiusM) || (best >= 0 && E.hp[e]! <= E.hp[best]!)) continue;
      let seen = false;
      for (let k = 0; k < U.aimedN && !seen; k += 1) seen = U.aimed[k] === E.id(e);
      if (!seen) best = e;
    }
    if (best >= 0) {
      if (U.aimedN === U.aimed.length) U.aimedN = 0;
      U.aimed[U.aimedN++] = E.id(best);
      return best;
    }
    U.aimedN = 0;
  }
  return -1;
}

function drop(w: World): void {
  const E = w.enemies;
  const P = w.projectiles;
  const e = aim(w);
  const [tx, tz] = e >= 0 ? [E.x[e]!, E.z[e]!] : [w.ult.x, w.ult.z];
  const p = P.add(PROJECTILE.feather, tx + FROM[0], tz + FROM[1], e >= 0 ? E.id(e) : -1, tx, tz, SPEED, SOURCE.ult);
  if (p < 0) return;
  [P.power[p], P.damageType[p], P.splash[p]] = [ULT.damage, 1, ULT.blastM];
  bump(w.stats, STAT.ultFeathers);
}

export function ultStep(w: World): void {
  const U = w.ult;
  if (w.phase === "night") ultCharge(w, ULT.nightPerS / TICK_HZ);
  if (U.on === 0) return;
  if (U.due > 0 && w.tick >= U.dueAt) [U.left, U.due] = [U.left + U.due, 0];
  if (U.left > 0 && w.tick >= U.nextAt) {
    drop(w);
    [U.left, U.nextAt, U.lastAt] = [U.left - 1, w.tick + ULT.everyTicks, w.tick];
  }
  if (U.left > 0 || U.due > 0 || w.calls.slotOf(U.call) >= 0 || w.tick < U.lastAt + FALL) return;
  // The rain is over: what is left in it burns (never the boss).
  const E = w.enemies;
  for (let e = 0; e < E.top; e += 1) {
    if (E.used[e] === 0 || E.dying[e] !== 0 || w.c.enemies[E.def[e]!]!.boss || !near(E.x[e]!, E.z[e]!, U.x, U.z, ULT.radiusM)) continue;
    [E.burnUntil[e], E.burnBy[e]] = [w.tick + ticks(ULT.burnS), SOURCE.ult];
  }
  U.on = 0;
}
