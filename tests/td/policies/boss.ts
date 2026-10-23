/**
 * The bots at the boss peak (docs/td/BUILD_1B.md §18.1). On day 5 a good player adds a Tháp Cung by the warned branch
 * (`bossArcher`). Once the boss is up (or from the lull, with no enemy left of the night's first part: till then he
 * fights those as by night) Draconis goes to the attack building the boss will reach next on its road, the cannon
 * first for a good player (its Word Shots burn), and stays until the boss has passed (`heroBoss`). The no-type check
 * of B5 (`heroKite`): from the rise Draconis lands 6 m ahead of the boss on its road and throws fireballs until it is
 * within 3 m or past, then flies ahead again (the strongest way known to hurt it without typing, §6.3 item 7).
 */
import { canPlace } from "../../../src/sim/placement";
import { BOSS } from "../../../src/sim/stores/boss";
import { MODE } from "../../../src/sim/stores/walkers";
import { bossSlot } from "../../../src/sim/systems/boss";
import type { World } from "../../../src/sim/world";
import { ARCHER_EAST, ARCHER_WEST } from "./layouts";
import type { Rule } from "./stand";

const q = (metres: number): number => Math.round(metres * 4);
const spot = { x: 0, z: 0 };

/** The stretch [enter, leave] (m) of route `route` within reach of attack building b; null when none. */
function reachOn(w: World, route: number, b: number): [number, number] | null {
  const B = w.buildings;
  const range = w.c.buildings[B.def[b]!]!.attack!.levels[B.level[b]! - 1]!.range;
  const lane = w.lanes[route]!;
  let enter = -1;
  let leave = -1;
  for (let d = 0; d <= lane.length; d += 1) {
    lane.point(d, 0, spot);
    if ((spot.x - B.x[b]!) ** 2 + (spot.z - B.z[b]!) ** 2 > range * range) continue;
    if (enter < 0) enter = d;
    leave = d;
  }
  return enter < 0 ? null : [enter, leave];
}

/** Day 5, a good player: a Tháp Cung by the warned branch if none stands there yet (and nothing else was bought this tick). */
export function bossArcher(): Rule {
  return (bot, plan) => {
    const { w } = bot;
    if (w.sandbox || w.phase !== "day" || w.boss.stage !== BOSS.warned || w.tick % 60 !== 15 || plan.asked === w.tick) return;
    const at = w.boss.route === 0 ? ARCHER_WEST : ARCHER_EAST;
    const def = w.c.buildingIndex("archer");
    const B = w.buildings;
    if (B.live(1).some((b) => B.def[b] === def && Math.abs(B.x[b]! - at.x) < 3 && Math.abs(B.z[b]! - at.z) < 3)) return;
    const spec = w.c.buildings[def]!;
    if (w.gold < spec.gold[0]! * 1000 || w.wood < spec.wood[0]! || !canPlace(w, def, q(at.x), q(at.z)).ok) return;
    plan.asked = w.tick;
    bot.send({ t: "build", def, qx: q(at.x), qz: q(at.z) });
  };
}

/** From the lull: Draconis by the attack building whose stretch of the boss's road comes next (a cannon first when `cannonFirst`, within 15 m). */
export function heroBoss(every = 30, cannonFirst = false): Rule {
  return (bot) => {
    const { w } = bot;
    const A = w.agents;
    const B = w.buildings;
    const S = w.boss;
    if (S.stage < BOSS.lull || (S.stage < BOSS.fight && w.enemies.count > 0) || S.stage >= BOSS.retreat || w.tick % every !== 0 || w.typing.router.lock >= 0 || A.mode[0] === MODE.takeoff || A.mode[0] === MODE.fly) return;
    const e = bossSlot(w);
    const at = e >= 0 ? w.enemies.dist[e]! : (w.c.content.stage?.boss.emergeM ?? 0);
    let best = -1;
    let bestEnter = Infinity;
    let cannon = -1;
    let cannonEnter = Infinity;
    for (const b of B.live()) {
      if (B.ready[b] === 0 || w.c.buildings[B.def[b]!]!.attack === null) continue;
      const stretch = reachOn(w, S.route, b);
      if (stretch === null || stretch[1] < at) continue;
      if (stretch[0] < bestEnter) [best, bestEnter] = [b, stretch[0]];
      if (w.c.buildings[B.def[b]!]!.id === "cannon" && stretch[0] < cannonEnter) [cannon, cannonEnter] = [b, stretch[0]];
    }
    const pick = cannonFirst && cannon >= 0 && cannonEnter <= bestEnter + 15 ? cannon : best;
    if (pick >= 0 && A.goal[0] !== pick) bot.send({ t: "assignUnit", agent: 0, building: B.id(pick) });
  };
}

/** From the rise, the no-type check: land 6 m ahead of the boss on its road, shoot until it is within 3 m or past, again. */
export function heroKite(): Rule {
  return (bot) => {
    const { w } = bot;
    const A = w.agents;
    const e = bossSlot(w);
    if (w.boss.stage !== BOSS.fight || e < 0 || w.tick % 6 !== 0 || A.mode[0] !== MODE.stand) return;
    const E = w.enemies;
    const lane = w.lanes[E.route[e]!]!;
    const gap = Math.hypot(A.x[0]! - E.x[e]!, A.z[0]! - E.z[e]!);
    const ahead = lane.distAt(A.x[0]!, A.z[0]!) > E.dist[e]!;
    if (ahead && gap > 3 && gap <= w.c.hero.levels[0]!.range) return;
    lane.point(Math.min(lane.length - 1, E.dist[e]! + 6), 0, spot);
    bot.send({ t: "move", agent: 0, qx: q(spot.x), qz: q(spot.z) });
  };
}
