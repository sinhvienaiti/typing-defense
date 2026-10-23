/**
 * Mộc Tinh, the boss peak at the end of the stage (BUILD_1B §4.4, §5; after step 9). Day 5 warns of it and picks
 * the branch it will walk. Once night 5's first part has spawned and ≤ 2 of it live (or 30 s on), a 12 s lull; then
 * two escort packs leave the rift and, 6 s later, the boss comes up at the fork. It walks on, never blocked, and
 * strikes after a warning: Rễ Trồi stuns the buildings within 8 m (no damage), Quật cành hits and knocks back the
 * soldiers in front, at 70 % it staggers (5 s still and vulnerable, every stun lifted, "Dồn lửa" power calls on the
 * nearest attack buildings in a help ring), in phase 2 it calls Mầm Gỗ, at the Bastion it strikes 3 lives a blow. At
 * 50 % it retreats: the chest is paid, 2 s later every enemy left melts and the stage is won.
 */
import { ticks } from "../../content/compile";
import { MODES } from "../../content/rules";
import { FX } from "../events";
import { STAT, bump } from "../stats";
import { BOSS } from "../stores/boss";
import { CALL_KIND } from "../stores/calls";
import type { World } from "../world";
import { inRing } from "./agents";
import { makeCall } from "./calls";
import { hurtSoldier } from "./combat";
import { SINKING } from "./move";
import { maxHp } from "./spawn";
import { enter } from "./waves";

const spot = { x: 0, z: 0 };
const order = new Int32Array(16);

/** Squared distance between two points. */
export const dist2 = (ax: number, az: number, bx: number, bz: number): number => (ax - bx) * (ax - bx) + (az - bz) * (az - bz);

/** A move's warning in the run's mode (§5.2). */
const warn = (w: World, seconds: number): number => ticks(seconds * MODES[w.mode].warnK);

/** The boss's enemy slot, −1 none. */
export const bossSlot = (w: World): number => (w.boss.e < 0 ? -1 : w.enemies.slotOf(w.boss.e));

/** A move is being warned: the flow meter's danger (§5.5). */
export const bossWarning = (w: World): boolean => w.boss.rootsEnd >= 0 || w.boss.slamEnd >= 0 || w.boss.keepEnd >= 0;

/** Its hit points at spawn: the enemy's × the mode's × (1 + kHp·max(0, k − 1)), at most ×kHpMax (§5.6). */
export function bossHp(w: World): number {
  const boss = w.c.content.boss!;
  const def = w.c.enemies[w.c.enemyIndex(boss.enemy)]!;
  return Math.round(def.hp * MODES[w.mode].hpMul * Math.min(boss.kHpMax, 1 + boss.kHp * Math.max(0, w.pace.k - 1)));
}

function warnDay(w: World): void {
  w.boss.stage = BOSS.warned;
  w.boss.route = w.rng.spawn.int(0, w.lanes.length - 2);
  w.events.rare.push({ t: "bossWarn", tick: w.tick, day: w.day, route: w.boss.route });
}

function lull(w: World): void {
  w.boss.stage = BOSS.lull;
  w.boss.lullEnd = w.tick + ticks(w.c.content.stage!.boss.lullS);
  w.events.rare.push({ t: "bossLull", tick: w.tick, end: w.boss.lullEnd });
}

/** The sandbox's `boss`: the peak now (warned if it was not, the night falls), from its lull. */
export function callBoss(w: World): boolean {
  if (w.c.content.boss === undefined || w.c.content.stage === undefined || w.boss.stage >= BOSS.lull) return false;
  if (w.boss.stage === BOSS.idle) warnDay(w);
  if (w.phase !== "night") enter(w, "night", -1);
  lull(w);
  return true;
}

/** The lull is over: the escort packs leave the rift, one a branch, in tonight's wave. */
function escort(w: World): void {
  const { escort: list } = w.c.content.stage!.boss;
  const { packGapS, memberGapS } = w.c.content.waves;
  const wave = w.wave;
  const grounds = w.lanes.length - 1;
  let at = w.tick;
  let pack = 0;
  for (const entry of list) {
    const enemy = w.c.enemyIndex(entry.enemy);
    const size = entry.pack ?? w.c.enemies[enemy]!.packSize;
    for (let k = 0; k < entry.count; k += size, pack += 1) {
      const n = Math.min(size, entry.count - k);
      for (let m = 0; m < n; m += 1) w.spawnQueue.push({ tick: at + m * ticks(memberGapS), enemy, route: pack % grounds, wave });
      at += (n - 1) * ticks(memberGapS) + ticks(packGapS);
    }
    w.waveLeft[wave] = (w.waveLeft[wave] ?? 0) + entry.count;
  }
  w.waveAlive[wave] ??= 0;
  w.spawnQueue.sort((a, b) => a.tick - b.tick);
  w.boss.stage = BOSS.emerge;
  w.boss.emergeAt = w.tick + ticks(w.c.content.stage!.boss.emergeAfterS);
}

/** Puts enemy `index` on route `route` at `dist` m (lateral `lateral`), in tonight's wave; its slot, −1 none free. */
function put(w: World, index: number, hp: number, route: number, dist: number, lateral: number): number {
  const E = w.enemies;
  const slot = E.add(index, hp, 0, route, w.wave, lateral);
  if (slot < 0) return -1;
  E.dist[slot] = dist;
  E.born[slot] = w.tick;
  w.lanes[route]!.point(dist, lateral, spot);
  [E.x[slot], E.z[slot]] = [spot.x, spot.z];
  w.waveAlive[w.wave] = (w.waveAlive[w.wave] ?? 0) + 1;
  bump(w.stats, STAT.spawned);
  w.events.ring.push(FX.spawn, spot.x, spot.z, index, w.tick);
  return slot;
}

/** It comes up at the fork on the warned branch. */
function rise(w: World): void {
  const S = w.boss;
  const hp = bossHp(w);
  const slot = put(w, w.c.enemyIndex(w.c.content.boss!.enemy), hp, S.route, w.c.content.stage!.boss.emergeM, 0);
  if (slot < 0) return;
  Object.assign(S, { e: w.enemies.id(slot), hpMax: hp, stage: BOSS.fight, phase: 1, rootsAt: -1, slamAt: w.tick, keepAt: w.tick });
  // The merge: where the branches meet again (the first point of the routes' common end).
  const [a, b] = [w.map.routes[0]!, w.map.routes[w.map.routes.length - 1]!];
  let k = 1;
  while (k < a.length && k < b.length && a[a.length - k - 1]!.join() === b[b.length - k - 1]!.join()) k += 1;
  S.mergeM = w.lanes[S.route]!.distAt(a[a.length - k]![0], a[a.length - k]![1]);
  w.events.rare.push({ t: "bossEmerge", tick: w.tick, route: S.route, hp });
}

/** The buildings (not the Bastion) whose rim lies within Rễ Trồi's reach of it, by id; written to S.targets when `keep`. */
function rootTargets(w: World, e: number, keep: boolean): number {
  const B = w.buildings;
  const reach = w.c.content.boss!.roots.radiusM;
  let n = 0;
  for (let b = 1; b < B.top && n < order.length; b += 1) {
    if (B.used[b] === 0 || B.ready[b] === 0) continue;
    const d = Math.sqrt(dist2(B.x[b]!, B.z[b]!, w.enemies.x[e]!, w.enemies.z[e]!));
    if (d - w.c.buildings[B.def[b]!]!.radius <= reach) order[n++] = B.id(b);
  }
  if (keep) {
    order.subarray(0, n).sort();
    w.boss.targets.set(order.subarray(0, n));
    w.boss.targetN = n;
  }
  return n;
}

function roots(w: World, e: number): void {
  const S = w.boss;
  const spec = w.c.content.boss!.roots;
  if (S.rootsEnd >= 0) {
    if (w.tick < S.rootsEnd) return;
    for (let k = 0; k < S.targetN; k += 1) {
      const b = w.buildings.slotOf(S.targets[k]!);
      if (b < 0) continue;
      w.buildings.stunUntil[b] = w.tick + ticks(spec.stunS);
      bump(w.stats, STAT.rootsHits);
      w.events.rare.push({ t: "stun", tick: w.tick, building: S.targets[k]!, until: w.buildings.stunUntil[b]! });
    }
    w.events.rare.push({ t: "bossStrike", tick: w.tick, move: "roots", hit: true, end: w.tick, count: S.targetN });
    [S.rootsEnd, S.targetN] = [-1, 0];
    return;
  }
  // The first 6 s after a building comes within reach; then every 12 s, a turn with none in reach passing by.
  if (S.rootsAt < 0) {
    if (rootTargets(w, e, false) > 0) S.rootsAt = w.tick + ticks(spec.firstS);
    return;
  }
  if (w.tick < S.rootsAt) return;
  S.rootsAt = w.tick + ticks(spec.everyS);
  if (rootTargets(w, e, true) === 0) return;
  S.rootsEnd = w.tick + warn(w, spec.warnS);
  w.events.rare.push({ t: "bossStrike", tick: w.tick, move: "roots", hit: false, end: S.rootsEnd, count: S.targetN });
}

/** Quật cành: soldiers within reach of its rim, in the 120° in front of it (toward the nearest when it began). */
function slam(w: World, e: number): void {
  const S = w.boss;
  const U = w.units;
  const E = w.enemies;
  const spec = w.c.content.boss!.slam;
  const reach = w.c.enemies[E.def[e]!]!.radius + spec.reachM;
  if (S.slamEnd >= 0) {
    if (w.tick < S.slamEnd) return;
    let hit = 0;
    for (let s = 0; s < U.top; s += 1) {
      if (U.used[s] === 0 || U.hp[s]! <= 0) continue;
      const [dx, dz] = [U.x[s]! - E.x[e]!, U.z[s]! - E.z[e]!];
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d > reach || dx * S.slamX + dz * S.slamZ < 0.5 * d) continue;
      hurtSoldier(w, s, spec.damage[0] + w.rng.combat.float() * (spec.damage[1] - spec.damage[0]));
      [U.x[s], U.z[s]] = [U.x[s]! + (dx / (d || 1)) * spec.knockM, U.z[s]! + (dz / (d || 1)) * spec.knockM];
      hit += 1;
    }
    S.slamEnd = -1;
    w.events.rare.push({ t: "bossStrike", tick: w.tick, move: "slam", hit: true, end: w.tick, count: hit });
    return;
  }
  if (w.tick < S.slamAt) return;
  let near = -1;
  let best = reach * reach;
  for (let s = 0; s < U.top; s += 1) {
    if (U.used[s] === 0 || U.hp[s]! <= 0) continue;
    const d2 = dist2(U.x[s]!, U.z[s]!, E.x[e]!, E.z[e]!);
    if (d2 <= best) [near, best] = [s, d2];
  }
  if (near < 0) return;
  const d = Math.sqrt(best) || 1;
  [S.slamX, S.slamZ] = [(U.x[near]! - E.x[e]!) / d, (U.z[near]! - E.z[e]!) / d];
  S.slamAt = w.tick + ticks(spec.everyS);
  S.slamEnd = w.tick + warn(w, spec.warnS);
  w.events.rare.push({ t: "bossStrike", tick: w.tick, move: "slam", hit: false, end: S.slamEnd, count: 1 });
}

/** Phase 2: Mầm Gỗ sprout at its feet (0.8 s), then walk on its road. */
function summon(w: World, e: number): void {
  const S = w.boss;
  const spec = w.c.content.boss!.summon;
  if (S.summonEnd >= 0) {
    if (w.tick < S.summonEnd) return;
    const index = w.c.enemyIndex(spec.enemy);
    const spread = Math.max(0, w.map.roadHalfM - w.c.enemies[index]!.radius);
    for (let k = 0; k < spec.count; k += 1) put(w, index, maxHp(w, index), S.route, w.enemies.dist[e]! + 0.5, (w.rng.spawn.float() * 2 - 1) * spread);
    S.summonEnd = -1;
    w.events.rare.push({ t: "bossStrike", tick: w.tick, move: "summon", hit: true, end: w.tick, count: spec.count });
    return;
  }
  if (w.tick < S.summonAt) return;
  S.summonAt = w.tick + ticks(spec.everyS);
  S.summonEnd = w.tick + ticks(spec.warnS);
  w.events.rare.push({ t: "bossStrike", tick: w.tick, move: "summon", hit: false, end: S.summonEnd, count: spec.count });
}

/** At the Bastion it stops and strikes it: −3 lives a blow, after a warning. */
function keepSlam(w: World, e: number): void {
  const S = w.boss;
  const spec = w.c.content.boss!.keep;
  if (w.enemies.dist[e]! < w.lanes[w.enemies.route[e]!]!.length - spec.stopM - 1e-9) return;
  if (S.keepEnd >= 0) {
    if (w.tick < S.keepEnd) return;
    const lost = Math.min(w.lives, spec.lives);
    w.lives -= lost;
    bump(w.stats, STAT.livesLost, lost);
    bump(w.stats, STAT.livesBoss, lost);
    S.keepEnd = -1;
    w.events.ring.push(FX.leak, w.map.keep[0], w.map.keep[1], lost, w.tick);
    w.events.rare.push({ t: "bossStrike", tick: w.tick, move: "keep", hit: true, end: w.tick, count: lost });
    return;
  }
  if (w.tick < S.keepAt) return;
  S.keepAt = w.tick + ticks(spec.everyS);
  S.keepEnd = w.tick + warn(w, spec.warnS);
  w.events.rare.push({ t: "bossStrike", tick: w.tick, move: "keep", hit: false, end: S.keepEnd, count: spec.lives });
}

/** At 70 %: 5 s still, vulnerable, the roots pulled back (every stun ends), the "Dồn lửa" calls (§5.2). */
function stagger(w: World, e: number): void {
  const S = w.boss;
  const B = w.buildings;
  const E = w.enemies;
  const spec = w.c.content.boss!.stagger;
  const end = w.tick + ticks(spec.stunS);
  Object.assign(S, { phase: 2, staggerUntil: end, vulnUntil: end, rootsEnd: -1, slamEnd: -1, keepEnd: -1, targetN: 0 });
  Object.assign(S, { rootsAt: S.rootsAt < 0 ? -1 : Math.max(S.rootsAt, end), slamAt: Math.max(S.slamAt, end), keepAt: Math.max(S.keepAt, end) });
  S.summonAt = end + ticks(w.c.content.boss!.summon.firstS);
  E.stunUntil[e] = end;
  for (let b = 0; b < B.top; b += 1) if (B.stunUntil[b]! > w.tick) B.stunUntil[b] = w.tick;
  // Attack buildings with it in reach + 2 m and in a help ring, nearest first, up to the mode's bright cap: a 1-word power call each.
  const near: [number, number][] = [];
  for (let b = 0; b < B.top; b += 1) {
    const attack = B.used[b] === 1 && B.ready[b] === 1 ? w.c.buildings[B.def[b]!]!.attack : null;
    if (attack === null || B.call[b]! >= 0 || !inRing(w, B.x[b]!, B.z[b]!)) continue;
    const d2 = dist2(B.x[b]!, B.z[b]!, E.x[e]!, E.z[e]!);
    const reach = attack.levels[B.level[b]! - 1]!.range + spec.burstReachM;
    if (d2 <= reach * reach) near.push([d2, b]);
  }
  near.sort((p, q) => p[0] - q[0] || B.id(p[1]) - B.id(q[1]));
  for (const [, b] of near.slice(0, MODES[w.mode].open)) {
    const c = makeCall(w, CALL_KIND.power, 1, -1, b, -1, -1, ticks(spec.burstLifeS));
    if (c < 0) continue;
    [B.call[b], B.powerAt[b], w.calls.burst[c]] = [c, w.tick, 1];
  }
  w.events.rare.push({ t: "bossPhase", tick: w.tick, phase: 2 });
}

/** At 50 %: it sinks away (2 s), the chest's gold paid now. */
function retreat(w: World, e: number): void {
  const gold = w.c.content.boss!.chestGold;
  Object.assign(w.boss, { stage: BOSS.retreat, sinkEnd: w.tick + ticks(w.c.content.boss!.retreatS), rootsEnd: -1, slamEnd: -1, keepEnd: -1, summonEnd: -1, targetN: 0 });
  w.enemies.dying[e] = SINKING;
  w.gold += gold * 1000;
  bump(w.stats, STAT.goldChest, gold * 1000);
  bump(w.stats, STAT.bossRetreats);
  w.events.rare.push({ t: "bossRetreat", tick: w.tick, gold });
}

/** Gone: every enemy left melts into ink (no gold, no leak), and the stage is won. */
function victory(w: World): void {
  const E = w.enemies;
  for (const e of E.live()) {
    w.events.ring.push(FX.death, E.x[e]!, E.z[e]!, E.def[e]!, w.tick);
    E.release(e);
  }
  w.spawnQueue.length = 0;
  for (let wave = 0; wave <= w.wave; wave += 1) [w.waveLeft[wave], w.waveAlive[wave]] = [0, 0];
  w.boss.stage = BOSS.done;
  w.phase = "victory";
  w.events.rare.push({ t: "victory", tick: w.tick });
}

function fight(w: World): void {
  const S = w.boss;
  const e = bossSlot(w);
  if (e < 0) return;
  const spec = w.c.content.boss!;
  const hp = w.enemies.hp[e]!;
  if (hp * 100 <= S.hpMax * spec.retreatPct) return retreat(w, e);
  if (S.phase === 1 && hp * 100 <= S.hpMax * spec.stagger.atPct) stagger(w, e);
  if (S.mergeHp < 0 && w.enemies.dist[e]! >= S.mergeM) S.mergeHp = hp;
  if (w.tick < S.staggerUntil) return;
  roots(w, e);
  slam(w, e);
  if (S.phase === 2) summon(w, e);
  keepSlam(w, e);
}

export function bossStep(w: World): void {
  const stage = w.c.content.stage;
  if (w.c.content.boss === undefined || stage === undefined) return;
  const S = w.boss;
  if (S.stage === BOSS.idle && w.phase === "day" && w.day === stage.boss.night) warnDay(w);
  else if (S.stage === BOSS.warned && w.phase === "night" && w.wave > 0 && w.waveLeft[w.wave] === 0) {
    if (S.lastSpawn < 0) S.lastSpawn = w.tick;
    if (w.waveAlive[w.wave]! <= stage.boss.lullAlive || w.tick >= S.lastSpawn + ticks(stage.boss.lullWaitS)) lull(w);
  } else if (S.stage === BOSS.lull && w.tick >= S.lullEnd) escort(w);
  else if (S.stage === BOSS.emerge && w.tick >= S.emergeAt) rise(w);
  else if (S.stage === BOSS.fight) fight(w);
  else if (S.stage === BOSS.retreat && w.tick >= S.sinkEnd) victory(w);
}
