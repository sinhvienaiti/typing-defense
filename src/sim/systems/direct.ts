/**
 * Direct calls and their verbs (BUILD_1B §9; R2 Ngắt, R3 Neo and Phá Khiên), where the village fights (an attack
 * building's rim within reachM: R2 learnt that by the rift no ring lit them): a Tanuki with 4 others within 6 m (9 m)
 * stands and drums; a Đầu Đàn with 4 others within 6 m (20 m) calls its pack on; a Troll (25 m) raises a 4 m dome
 * riding on it. Each lasts T = clamp(0.8 + k_d·(len + 1)·12 / E; 3; 7) s. A direct call of one known short word follows
 * the enemy, lit in a help ring and within the typing budget; at most 2 open (3 with the boss up), one more runs uncalled.
 * Typed: +2 gold (the leaf +5 more), Tối Thượng +3; the drum breaks (stunned 2 s), the pack stands 3 s and the leader
 * takes ×1.3 for 6 s, or the dome breaks (stunned 1.5 s, none for 10 s). Let run: a drum heals 25 % within 6 m (never
 * the boss); a pack walks on (the leader's +20 % aura, move.ts, is always on); a dome holds T (shots from outside ×0.3).
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

const [INTERRUPT, ANCHOR, SHIELD] = [0, 1, 2];

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

/** The verb (VERBS) of call c's enemy: what typing it breaks (the view's icon and name); Ngắt when it has gone. */
export function verbOf(w: World, c: number): number {
  const e = w.enemies.slotOf(w.calls.foe[c]!);
  return e < 0 ? INTERRUPT : w.c.enemies[w.enemies.def[e]!]!.ability?.verb ?? INTERRUPT;
}

/** The mechanic of enemy slot e ends: broken (ok) or let run; its cooldown starts (a broken dome's lock). A drummer stood for it. */
function end(w: World, e: number, ok: boolean): void {
  const E = w.enemies;
  const ability = w.c.enemies[E.def[e]!]!.ability!;
  [E.castEnd[e], E.abilityAt[e]] = [0, w.tick + (ok && ability.lock > 0 ? ability.lock : ability.cooldown)];
  if (ability.verb === INTERRUPT) E.stunUntil[e] = ok ? w.tick + ability.stun : w.tick;
  else if (ok) E.stunUntil[e] = Math.max(E.stunUntil[e]!, w.tick + ability.stun);
  bump(w.stats, ok ? STAT.directOk : STAT.directMissed);
  w.events.rare.push({ t: "direct", tick: w.tick, enemy: E.id(e), ok, x: E.x[e]!, z: E.z[e]!, verb: ability.verb });
}

/** Every enemy within r m of enemy slot e but the boss (e too), passed to `act`. */
function around(w: World, e: number, r: number, act: (o: number) => void): void {
  const E = w.enemies;
  for (let o = 0; o < E.top; o += 1) if (E.used[o] === 1 && E.dying[o] === 0 && !w.c.enemies[E.def[o]!]!.boss && near(E.x[o]!, E.z[o]!, E.x[e]!, E.z[e]!, r)) act(o);
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
  const ability = w.c.enemies[w.enemies.def[e]!]!.ability!;
  if (ability.verb !== ANCHOR) return;
  // Neo: the pack within its radius stands (the leader too), the leader takes more for a while.
  around(w, e, ability.radius, (o) => (w.enemies.stunUntil[o] = Math.max(w.enemies.stunUntil[o]!, w.tick + ability.freeze)));
  w.enemies.takenUntil[e] = w.tick + ability.taken;
}

/** Let run: a drum heals the enemies within its reach (the boss never); a pack walks on, a dome falls; its call closes. */
function letRun(w: World, e: number): void {
  const E = w.enemies;
  const ability = w.c.enemies[E.def[e]!]!.ability!;
  if (ability.verb === INTERRUPT)
    around(w, e, ability.radius, (o) => {
      const max = Math.round(maxHp(w, E.def[o]!) * (E.elite[o] === 1 ? PACE.eliteHp : 1));
      E.hp[o] = Math.min(max, E.hp[o]! + Math.round(max * ability.heal));
    });
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
    const until = (E.castEnd[e] = w.tick + directTicks(w));
    if (ability.verb === INTERRUPT) E.stunUntil[e] = until; // it stands and drums (a leader and a Troll walk on)
    w.events.rare.push({ t: "drum", tick: w.tick, enemy: E.id(e), end: until });
    let open = 0;
    for (let c = 0; c < C.top; c += 1) if (C.used[c] === 1 && C.kind[c] === CALL_KIND.direct) open += 1;
    if (open < (bossSlot(w) >= 0 ? DIRECT.openBoss : DIRECT.open)) makeCall(w, CALL_KIND.direct, 1, -1, -1, -1, -1, until - w.tick, -1, E.id(e));
  }
}

/** The domes up this tick (Phá Khiên let run: x, z, radius, ×outside a dome), into `out`. */
export function domesUp(w: World, out: number[]): number[] {
  const E = w.enemies;
  out.length = 0;
  for (let e = 0; e < E.top; e += 1) {
    const ability = E.used[e] === 1 && E.dying[e] === 0 && E.castEnd[e]! > w.tick ? w.c.enemies[E.def[e]!]!.ability : null;
    if (ability !== null && ability.verb === SHIELD) out.push(E.x[e]!, E.z[e]!, ability.dome, ability.outside);
  }
  return out;
}

/** A shot launched at (ox, oz) hurts at (x, z) ×outside when (x, z) is under a dome and (ox, oz) is not (BUILD_1B §9.2). */
export function domeMul(domes: readonly number[], x: number, z: number, ox: number, oz: number): number {
  for (let k = 0; k < domes.length; k += 4) if (near(x, z, domes[k]!, domes[k + 1]!, domes[k + 2]!) && !near(ox, oz, domes[k]!, domes[k + 1]!, domes[k + 2]!)) return domes[k + 3]!;
  return 1;
}
