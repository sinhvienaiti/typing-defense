/**
 * Enemies walk their lane (TK 25.6 step 4, 13). Blocked by enough soldiers
 * they stop; blocked by fewer than their weight they push on at half speed.
 * One that reaches the Bastion is marked leaked; the deaths system takes
 * the lives. The boss is never blocked, stands while stunned and stops short
 * of the Bastion to strike it (BUILD_1B §5.1, §5.3). R3 (§9.2, §10 "dẫn bầy"): a Cương Thi Đầu Đàn hurries every
 * enemy within its radius but the boss (×auraSpeed, itself too), always, and leads them: on its road none walks on
 * past DIRECT.leadM ahead of it (they wait for it), so the pack Neo pins stays by its leader.
 */
import { DIRECT } from "../../content/rules";
import type { World } from "../world";

export const LEAKED = 2;
/** The boss sinking away (BUILD_1B §5.4): no target, no damage, left alone by the deaths system. */
export const SINKING = 3;
const spot = { x: 0, z: 0 };
/** This tick's auras: x, z, radius², ×speed, the leader's road, distance along it and slot. */
const RUSH: number[] = [];

export function moveEnemies(w: World): void {
  const E = w.enemies;
  const stop = w.c.content.boss?.keep.stopM ?? 0;
  RUSH.length = 0;
  for (let e = 0; e < E.top; e += 1) {
    const aura = E.used[e] === 1 && E.dying[e] === 0 ? (w.c.enemies[E.def[e]!]!.ability?.aura ?? 1) : 1;
    const r = aura === 1 ? 0 : w.c.enemies[E.def[e]!]!.ability!.radius;
    if (aura !== 1) RUSH.push(E.x[e]!, E.z[e]!, r * r, aura, E.route[e]!, E.dist[e]!, e);
  }
  for (let e = 0; e < E.top; e += 1) {
    if (E.used[e] === 0 || E.dying[e] !== 0 || E.stunUntil[e]! > w.tick) continue;
    const def = w.c.enemies[E.def[e]!]!;
    const block = E.block[e]!;
    const pace = block === 0 || def.unblockable ? 1 : block >= def.weight ? 0 : 0.5;
    const lane = w.lanes[E.route[e]!]!;
    let [rush, cap] = [1, Infinity];
    for (let k = 0; k < RUSH.length && !def.boss; k += 7) {
      const [dx, dz] = [E.x[e]! - RUSH[k]!, E.z[e]! - RUSH[k + 1]!];
      if (dx * dx + dz * dz > RUSH[k + 2]!) continue;
      rush = RUSH[k + 3]!;
      if (RUSH[k + 4] === E.route[e] && RUSH[k + 6] !== e) cap = Math.min(cap, RUSH[k + 5]! + DIRECT.leadM);
    }
    let dist = E.dist[e]! + def.speed * pace * rush * w.pace.foeSpeed;
    if (cap < dist) dist = Math.max(E.dist[e]!, cap);
    if (def.boss) dist = Math.min(dist, lane.length - stop);
    E.dist[e] = dist;
    if (dist >= lane.length) E.dying[e] = LEAKED;
    lane.point(dist, E.lateral[e]!, spot);
    E.x[e] = spot.x;
    E.z[e] = spot.z;
  }
}
