/**
 * Direct calls and Ngắt (BUILD_1B §9; after step 5). A Lửng Tanuki with `need` other enemies within 6 m, its cooldown
 * past and an attack building's rim within reachM (R2: where the fight is, as Neo and Phá Khiên ask; drums by the rift
 * were never lit nor worth breaking) stands and drums for T = clamp(0.8 + k_d·(len + 1)·12 / E; 3; 7) s (len: the longest of the short band;
 * the word itself comes when the call lights). A direct call of one known short word follows it, lit in a help ring
 * and within the typing budget like any call; at most 2 are open at once (3 with the boss up): one more drums uncalled,
 * as if let run. Its word typed: the drum is broken, the Tanuki stunned 2 s, its leaf +5 gold and +2, Tối Thượng +3.
 * Let run to its end: every enemy within 6 m (the Tanuki too, never the boss) heals 25 % of its hit points, its call
 * closes. Nothing else is lost either way.
 */
import { ticks } from "../../content/compile";
import { DIRECT, MODES, PACE } from "../../content/rules";
import { STAT, bump } from "../stats";
import { CALL_KIND } from "../stores/calls";
import type { World } from "../world";
import { bossSlot } from "./boss";
import { closeCall, expectedE, lengthBand, makeCall } from "./calls";
import { maxHp } from "./spawn";
import { ultCharge } from "./ult";

const near = (ax: number, az: number, bx: number, bz: number, r: number): boolean => (ax - bx) * (ax - bx) + (az - bz) * (az - bz) <= r * r;

/** The rim of a finished attack building (the Bastion, a tower) lies within `reach` m of (x, z): where the village fights. */
function byTheFight(w: World, x: number, z: number, reach: number): boolean {
  const B = w.buildings;
  for (let b = 0; b < B.top; b += 1) {
    const spec = B.used[b] === 1 && B.ready[b] === 1 ? w.c.buildings[B.def[b]!]! : null;
    if (spec !== null && spec.attack !== null && near(x, z, B.x[b]!, B.z[b]!, reach + spec.radius)) return true;
  }
  return false;
}

/** A direct call's window in ticks at the run's E and mode. */
export function directTicks(w: World): number {
  const E = expectedE(w);
  const len = lengthBand(E, true)[1];
  return ticks(Math.max(DIRECT.minS, Math.min(DIRECT.maxS, DIRECT.base + (MODES[w.mode].directK * (len + 1) * 12) / E)));
}

/** The mechanic of enemy slot e ends: broken (ok) or let run; its cooldown starts. */
function end(w: World, e: number, ok: boolean): void {
  const E = w.enemies;
  const ability = w.c.enemies[E.def[e]!]!.ability!;
  [E.castEnd[e], E.abilityAt[e], E.stunUntil[e]] = [0, w.tick + ability.cooldown, ok ? w.tick + ability.stun : w.tick];
  bump(w.stats, ok ? STAT.directOk : STAT.directMissed);
  w.events.rare.push({ t: "direct", tick: w.tick, enemy: E.id(e), ok, x: E.x[e]!, z: E.z[e]! });
}

/** Call c's word is typed (calls.ts): its enemy's drum breaks. */
export function breakDirect(w: World, c: number): void {
  const e = w.enemies.slotOf(w.calls.foe[c]!);
  if (e < 0 || w.enemies.castEnd[e] === 0) return;
  const gold = (w.c.enemies[w.enemies.def[e]!]!.ability!.gold + DIRECT.gold) * 1000;
  w.gold += gold;
  bump(w.stats, STAT.goldWord, gold);
  ultCharge(w, DIRECT.ult);
  end(w, e, true);
}

/** Let run: the enemies within its reach heal (the boss never), its call closes. */
function letRun(w: World, e: number): void {
  const E = w.enemies;
  const ability = w.c.enemies[E.def[e]!]!.ability!;
  for (let o = 0; o < E.top; o += 1) {
    if (E.used[o] === 0 || E.dying[o] !== 0 || w.c.enemies[E.def[o]!]!.boss || !near(E.x[o]!, E.z[o]!, E.x[e]!, E.z[e]!, ability.radius)) continue;
    const max = Math.round(maxHp(w, E.def[o]!) * (E.elite[o] === 1 ? PACE.eliteHp : 1));
    E.hp[o] = Math.min(max, E.hp[o]! + Math.round(max * ability.heal));
  }
  for (const c of w.calls.live()) if (w.calls.foe[c] === E.id(e)) closeCall(w, c);
  end(w, e, false);
}

export function directStep(w: World): void {
  const E = w.enemies;
  const C = w.calls;
  for (let e = 0; e < E.top; e += 1) {
    const ability = E.used[e] === 1 && E.dying[e] === 0 ? w.c.enemies[E.def[e]!]!.ability : null;
    if (ability === null) continue;
    if (E.castEnd[e]! > 0) {
      if (w.tick >= E.castEnd[e]!) letRun(w, e);
      continue;
    }
    if (w.tick < E.abilityAt[e]! || E.stunUntil[e]! > w.tick || (ability.reach > 0 && !byTheFight(w, E.x[e]!, E.z[e]!, ability.reach))) continue;
    let others = 0;
    for (let o = 0; o < E.top && others < ability.need; o += 1) if (o !== e && E.used[o] === 1 && E.dying[o] === 0 && near(E.x[o]!, E.z[o]!, E.x[e]!, E.z[e]!, ability.radius)) others += 1;
    if (others < ability.need) continue;
    const until = w.tick + directTicks(w);
    [E.castEnd[e], E.stunUntil[e]] = [until, until]; // it stands and drums
    w.events.rare.push({ t: "drum", tick: w.tick, enemy: E.id(e), end: until });
    let open = 0;
    for (let c = 0; c < C.top; c += 1) if (C.used[c] === 1 && C.kind[c] === CALL_KIND.direct) open += 1;
    if (open < (bossSlot(w) >= 0 ? DIRECT.openBoss : DIRECT.open)) makeCall(w, CALL_KIND.direct, 1, -1, -1, -1, -1, until - w.tick, -1, E.id(e));
  }
}
