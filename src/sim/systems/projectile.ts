/**
 * Shots fly and land (TK 25.6 step 8). A shot follows its target while it
 * lives, then flies on to the last point it saw. On arrival a blast hurts
 * its target at whatever height the attack aimed (Draconis hits high
 * flyers), and every other enemy in its radius at a height blasts reach
 * (COMBAT.splashHits, TK 10.4: ground and low), from full damage at the
 * centre down to the rim's share (cannon: 50 %), times the enemy's blast
 * multiplier (Ma Trơi ×1.5); a single shot hurts its target if it still lives.
 * A burning shot (Draconis' Word Shot from a cannon) sets every enemy it hurts on fire. R3 (BUILD_1B §9.2): an enemy
 * under a Troll's dome takes a shot launched outside it ×0.3 (Tối Thượng's feathers fall from the sky, as before).
 */
import { ALTITUDES } from "../../content/compile";
import { COMBAT } from "../../content/rules";
import { FX } from "../events";
import { PROJECTILE } from "../stores/projectiles";
import type { World } from "../world";
import { burnTicks, damageEnemy } from "./combat";
import { domeMul, domesUp } from "./direct";

const BLAST_REACHES = ALTITUDES.map((altitude) => (COMBAT.splashHits as readonly string[]).includes(altitude));
const DOMES: number[] = [];

export function projectilesStep(w: World): void {
  const P = w.projectiles;
  const E = w.enemies;
  const domes = domesUp(w, DOMES);
  // ×1 with no dome up, so every run before R3's Troll multiplies exactly as it did.
  const cover = (p: number, e: number): number => (domes.length === 0 || P.kind[p] === PROJECTILE.feather ? 1 : domeMul(domes, E.x[e]!, E.z[e]!, P.ox[p]!, P.oz[p]!));
  for (let p = 0; p < P.top; p += 1) {
    if (P.used[p] === 0) continue;
    const t = E.slotOf(P.target[p]!);
    const alive = t >= 0 && E.dying[t] === 0;
    if (alive) {
      P.tx[p] = E.x[t]!;
      P.tz[p] = E.z[t]!;
    }
    const dx = P.tx[p]! - P.x[p]!;
    const dz = P.tz[p]! - P.z[p]!;
    const d = Math.sqrt(dx * dx + dz * dz);
    const speed = P.speed[p]!;
    if (d > speed) {
      P.x[p] = P.x[p]! + (dx / d) * speed;
      P.z[p] = P.z[p]! + (dz / d) * speed;
      continue;
    }
    const x = (P.x[p] = P.tx[p]!);
    const z = (P.z[p] = P.tz[p]!);
    const splash = P.splash[p]!;
    const burnUntil = P.burn[p] === 1 ? w.tick + burnTicks(w) : 0;
    if (splash > 0) {
      const fade = 1 - P.edge[p]!;
      for (let e = 0; e < E.top; e += 1) {
        if (E.used[e] === 0 || E.dying[e] !== 0 || (e !== t && !BLAST_REACHES[E.altitude[e]!])) continue;
        const ex = E.x[e]! - x;
        const ez = E.z[e]! - z;
        const d2 = ex * ex + ez * ez;
        if (d2 > splash * splash) continue;
        const share = 1 - (fade * Math.sqrt(d2)) / splash;
        damageEnemy(w, e, P.power[p]! * share * w.c.enemies[E.def[e]!]!.splashMul * cover(p, e), P.damageType[p]!, P.source[p]!, true);
        if (burnUntil > 0) [E.burnUntil[e], E.burnBy[e]] = [burnUntil, P.source[p]!];
      }
      w.events.ring.push(FX.burst, x, z, Math.round(splash * 100), w.tick);
    } else if (alive) {
      damageEnemy(w, t, P.power[p]! * cover(p, t), P.damageType[p]!, P.source[p]!);
      if (burnUntil > 0) [E.burnUntil[t], E.burnBy[t]] = [burnUntil, P.source[p]!];
      w.events.ring.push(FX.hit, x, z, P.crit[p]!, w.tick);
    }
    P.release(p);
  }
}
