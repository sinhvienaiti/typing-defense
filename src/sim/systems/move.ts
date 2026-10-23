/**
 * Enemies walk their lane (TK 25.6 step 4, 13). Blocked by enough soldiers
 * they stop; blocked by fewer than their weight they push on at half speed.
 * One that reaches the Bastion is marked leaked; the deaths system takes
 * the lives. The boss is never blocked, stands while stunned and stops short
 * of the Bastion to strike it (BUILD_1B §5.1, §5.3).
 */
import type { World } from "../world";

export const LEAKED = 2;
/** The boss sinking away (BUILD_1B §5.4): no target, no damage, left alone by the deaths system. */
export const SINKING = 3;
const spot = { x: 0, z: 0 };

export function moveEnemies(w: World): void {
  const E = w.enemies;
  const stop = w.c.content.boss?.keep.stopM ?? 0;
  for (let e = 0; e < E.top; e += 1) {
    if (E.used[e] === 0 || E.dying[e] !== 0 || E.stunUntil[e]! > w.tick) continue;
    const def = w.c.enemies[E.def[e]!]!;
    const block = E.block[e]!;
    const pace = block === 0 || def.unblockable ? 1 : block >= def.weight ? 0 : 0.5;
    const lane = w.lanes[E.route[e]!]!;
    let dist = E.dist[e]! + def.speed * pace * w.pace.foeSpeed;
    if (def.boss) dist = Math.min(dist, lane.length - stop);
    E.dist[e] = dist;
    if (dist >= lane.length) E.dying[e] = LEAKED;
    lane.point(dist, E.lateral[e]!, spot);
    E.x[e] = spot.x;
    E.z[e] = spot.z;
  }
}
