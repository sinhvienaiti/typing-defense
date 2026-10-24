/**
 * The bots' R2 habits (docs/td/BUILD_1B.md §18.1 R2). Tối Thượng (`ultRule`): once full, open and 45 s on, cast at the
 * app's spot (ultSpot, as the `=` key does with the mouse off the map) when the boss is within 12 m of Draconis or 5
 * enemies stand within 6 m of an enemy in his 14 m ring; a poor player casts as soon as it is full. Its Chữ Chiêu and
 * the direct calls are typed like any call (tests/td/human.ts: a word that runs out, the telegraph reflex). A good
 * player takes a helper off a building Rễ Trồi warns of (`dodgeRoots`: home, held there until the strike is over).
 */
import { ticks } from "../../../src/content/compile";
import { PANIC, ULT } from "../../../src/content/rules";
import { slotsOpen } from "../../../src/sim/systems/agents";
import { bossSlot } from "../../../src/sim/systems/boss";
import { ultSpot } from "../../../src/sim/systems/ult";
import { locked } from "../../../src/sim/systems/waves";
import type { World } from "../../../src/sim/world";
import type { Rule } from "./stand";

const near = (ax: number, az: number, bx: number, bz: number, r: number): boolean => (ax - bx) * (ax - bx) + (az - bz) * (az - bz) <= r * r;

/** 5 enemies (or more) within 6 m of one enemy within 14 m of Draconis. */
function crowd(w: World): boolean {
  const E = w.enemies;
  for (let e = 0; e < E.top; e += 1) {
    if (E.used[e] === 0 || E.dying[e] !== 0 || !near(E.x[e]!, E.z[e]!, w.agents.x[0]!, w.agents.z[0]!, ULT.autoM)) continue;
    let n = 0;
    for (let o = 0; o < E.top && n < 5; o += 1) if (E.used[o] === 1 && E.dying[o] === 0 && near(E.x[o]!, E.z[o]!, E.x[e]!, E.z[e]!, ULT.areaM)) n += 1;
    if (n >= 5) return true;
  }
  return false;
}

export function ultRule(poor = false): Rule {
  return (bot) => {
    const { w } = bot;
    const U = w.ult;
    if (U.charge < ULT.max || U.on === 1 || w.tick % 6 !== 0 || locked(w, "ult") || w.tick - U.castAt < ticks(ULT.minGapS)) return;
    const e = bossSlot(w);
    const boss = e >= 0 && near(w.enemies.x[e]!, w.enemies.z[e]!, w.agents.x[0]!, w.agents.z[0]!, ULT.ringM);
    if (!poor && !boss && !crowd(w)) return;
    const at = boss ? { x: w.enemies.x[e]!, z: w.enemies.z[e]! } : ultSpot(w, null);
    bot.send({ t: "ult", qx: Math.round(at.x * 4), qz: Math.round(at.z * 4) });
  };
}

/** Good tactics: while Rễ Trồi is warned, a helper within 6 m of a building it aims at goes home, held there until it struck. */
export function dodgeRoots(): Rule {
  const held = new Map<number, number>();
  return (bot, plan) => {
    const { w } = bot;
    const S = w.boss;
    for (const [a, until] of held) if (w.tick >= until) held.delete(a);
    plan.hold = held;
    if (S.rootsEnd < 0 || w.tick % 6 !== 0) return;
    for (let a = 1; a < slotsOpen(w); a += 1) {
      if (held.has(a) || w.agents.panic[a] !== 0) continue;
      for (let k = 0; k < S.targetN; k += 1) {
        const b = w.buildings.slotOf(S.targets[k]!);
        if (b < 0 || !near(w.agents.x[a]!, w.agents.z[a]!, w.buildings.x[b]!, w.buildings.z[b]!, w.c.buildings[w.buildings.def[b]!]!.radius + PANIC.m)) continue;
        held.set(a, S.rootsEnd + 30);
        bot.send({ t: "recall", agent: a });
        break;
      }
    }
  };
}
