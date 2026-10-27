/**
 * Spawning (TK 25.6 step 2): queued spawns whose tick has come enter at the gate, spread across the road by the spawn
 * stream, with the mode's hit points (BUILD_1A6 §2). Enemies may also come up along a road (the boss, its Mầm Gỗ, a
 * Nuppeppō's halves) and packs be queued into the running wave.
 */
import { packSchedule } from "../../content/compile";
import { MODES, PACE } from "../../content/rules";
import type { WaveEntry } from "../../content/types";
import { FX } from "../events";
import { STAT, bump } from "../stats";
import { BOSS } from "../stores/boss";
import type { World } from "../world";

const spot = { x: 0, z: 0 };

/** An enemy's hit points in the run's mode. */
export const maxHp = (w: World, enemy: number): number => Math.round(w.c.enemies[enemy]!.hp * MODES[w.mode].hpMul);

/** Puts enemy `index` on route `route` at `dist` m (lateral `lateral`) in wave `wave`; its slot, −1 none free. */
export function putEnemy(w: World, index: number, hp: number, route: number, wave: number, dist: number, lateral: number): number {
  const E = w.enemies;
  const slot = E.add(index, hp, w.c.enemies[index]!.altitude, route, wave, lateral);
  if (slot < 0) return -1;
  [E.dist[slot], E.born[slot]] = [dist, w.tick];
  w.lanes[route]!.point(dist, lateral, spot);
  [E.x[slot], E.z[slot]] = [spot.x, spot.z];
  w.waveAlive[wave] = (w.waveAlive[wave] ?? 0) + 1;
  bump(w.stats, STAT.spawned);
  w.events.ring.push(FX.spawn, spot.x, spot.z, index, w.tick);
  return slot;
}

/** Packs of `entries` leave the rift in the running wave from now on, one a ground route in turn (the boss's escort, the sandbox's `spawn`). */
export function queuePacks(w: World, entries: readonly WaveEntry[]): void {
  const [wave, grounds] = [w.wave, w.lanes.length - 1];
  const list = packSchedule(w.c, entries);
  for (const s of list) w.spawnQueue.push({ tick: w.tick + s.at, enemy: s.enemy, route: s.lane < 0 ? grounds : s.lane % grounds, wave });
  w.spawnQueue.sort((a, b) => a.tick - b.tick);
  [w.waveLeft[wave], w.waveAlive[wave]] = [(w.waveLeft[wave] ?? 0) + list.length, w.waveAlive[wave] ?? 0];
}

export function spawnEnemies(w: World): void {
  const E = w.enemies;
  while (w.spawnQueue.length > 0 && w.spawnQueue[0]!.tick <= w.tick) {
    const next = w.spawnQueue.shift()!;
    const def = w.c.enemies[next.enemy]!;
    const flying = def.altitude > 0;
    const spread = flying ? 1 : Math.max(0, w.map.roadHalfM - def.radius);
    const lateral = (w.rng.spawn.float() * 2 - 1) * spread;
    const elite = w.pace.elite > 0 && w.boss.stage < BOSS.lull ? 1 : 0; // never in the boss peak (BUILD_1B §5.5)
    const slot = E.add(next.enemy, Math.round(maxHp(w, next.enemy) * (elite === 1 ? PACE.eliteHp : 1)), def.altitude, next.route, next.wave, lateral);
    w.waveLeft[next.wave]! -= 1;
    if (slot >= 0) {
      w.pace.elite -= elite;
      E.elite[slot] = elite;
      E.born[slot] = w.tick;
      w.waveAlive[next.wave]! += 1;
      w.lanes[next.route]!.point(0, lateral, spot);
      E.x[slot] = spot.x;
      E.z[slot] = spot.z;
      bump(w.stats, STAT.spawned);
      w.events.ring.push(FX.spawn, spot.x, spot.z, next.enemy, w.tick);
    }
  }
}

/** The sandbox's load test (TK 25.12, __td.flood): n enemies of each kind but the boss in turn on the first half of the routes, evenly spaced, in the current wave. */
export function flood(w: World, n: number): void {
  const E = w.enemies;
  const grounds = w.lanes.length - 1;
  const kinds = w.c.enemies.filter((def) => !def.boss);
  for (let k = 0; k < n; k += 1) {
    const def = kinds[k % kinds.length]!;
    const route = def.altitude > 0 ? grounds : k % grounds;
    const spread = def.altitude > 0 ? 1 : Math.max(0, w.map.roadHalfM - def.radius);
    const slot = E.add(def.index, maxHp(w, def.index), def.altitude, route, w.wave, (((k * 0.618034) % 1) * 2 - 1) * spread);
    if (slot < 0) return;
    E.dist[slot] = (w.lanes[route]!.length * (k + 0.5)) / (2 * n);
    E.born[slot] = w.tick;
    w.lanes[route]!.point(E.dist[slot]!, E.lateral[slot]!, spot);
    E.x[slot] = spot.x;
    E.z[slot] = spot.z;
    w.waveAlive[w.wave] = (w.waveAlive[w.wave] ?? 0) + 1;
    bump(w.stats, STAT.spawned);
  }
}
