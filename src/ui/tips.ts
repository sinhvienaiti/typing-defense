/**
 * The map 1 teaching table (docs/td/BUILD_1B.md §12; R1 its two boss rows, R3 the rest; docs/td/R3_PLAN.md §3.5). At the
 * start of each story day and night Bà Cú Mực says the row's line (two sentences at most, one a line) and its tip chip stays
 * in the teaching frame till the phase ends (ui/hud.ts BossBanner; R3_PLAN §5 A9). What a building opened by day does is a
 * line on its card and on its build-menu row while picked, in the story, until the row that teaches it has come (§12: read
 * when wanted, never shown by itself). Text only, a chunk of its own: the frame and the cards show none of it before it is
 * in. The sandbox skips the table but the boss's two rows (R1: its `boss` and `skipTo` warn Mộc Tinh).
 */
import { locked } from "../sim/systems/waves";
import type { World } from "../sim/world";

export type Tip = { line: string; chip: string };

/** One row a phase, day1 … night5; each line ≤ 14 syllables, each chip ≤ 8 (tests/td-tips.test.ts). */
export const TIPS: Readonly<Record<string, Tip>> = {
  day1: { line: "Rice is ripe: Farmer calls. Send Draconis; type the bubble's words.", chip: "First letter selects · Esc exits" },
  night1: { line: "At night, towers call for help. Type to fire a Word Shot.", chip: "Skipped calls cost nothing" },
  day2: { line: "Build with Wood; trees regrow each dawn. Click a tree to chop.", chip: "Shift + \\ hires Villager" },
  night2: { line: "Ghost Flame flies over Soldiers. Archer Tower and Draconis can hit it.", chip: "" },
  day3: { line: "Upgrade Fort to free Chấm. Helpers speed up work.", chip: "1–4 select · Enter send" },
  night3: { line: "Charge full: press = near foes. Type for more fire feathers.", chip: "= Ultimate near foes" },
  day4: { line: "Level 2 buildings are stronger. Sell for a 60% refund.", chip: "Sell: click twice" },
  night4: { line: "Raccoon Dog drums to heal. Type its word to Stop it.", chip: "Type foe words to break skills" },
  day5: { line: "Tonight Mộc Tinh awakens. Line the glowing root with towers.", chip: "Boss flees at 50% HP" },
  night5: { line: "Rising roots stun buildings. Fresh words set him ablaze.", chip: "Stunned: type Power now" },
};

/** What each building does; `taught`: the row that says it, after which its card drops the line. */
export const DOES: Readonly<Record<string, { line: string; taught?: string }>> = {
  farm: { line: "Sow Seeds; ripe Rice calls for Reap.", taught: "day1" },
  archer: { line: "Hits nearby foes, even flyers.", taught: "night1" },
  barracks: { line: "Soldiers block foes on roads for towers to shoot." },
  "gold-mine": { line: "Needs ore; half-full Gold calls for Dig." },
  cannon: { line: "Blasts hit groups of ground foes." },
};

/** A row's place in the stage: day 1 is 0, night 1 is 1 …; −1 for no row. */
const order = (key: string): number => {
  const m = /^(day|night)(\d+)$/.exec(key);
  return m === null ? -1 : (Number(m[2]) - 1) * 2 + (m[1] === "night" ? 1 : 0);
};

/** The building's line now: the story only, once it is open (the menu says the day it opens), until its row has come. */
export function doesLine(w: World, id: string): string {
  const does = DOES[id];
  if (w.sandbox || does === undefined || locked(w, id)) return "";
  const now = order((w.phase === "day" ? "day" : "night") + w.day);
  return does.taught !== undefined && now >= order(does.taught) ? "" : does.line;
}
