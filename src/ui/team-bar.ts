/**
 * The team bar (BUILD_NOW §5.3, BUILD_1A6 §9, TK 23.5, 23.7): Draconis and the Thư Đồng with their number keys and a
 * badge for the building each was sent to, a closed slot's Bastion level, and the "Đang gọi n/N" chip: bright calls
 * against the mode's cap (BUILD_1A6 §5.3).
 */
import { MODES, ULT } from "../content/rules";
import type { ViewBlock } from "../content/types";
import { slotsOpen } from "../sim/systems/agents";
import type { World } from "../sim/world";

export const agentView = (w: World, a: number): ViewBlock => (a === 0 ? w.c.content.hero.view : w.c.content.helpers[a - 1]!.view);
const buildingView = (w: World, b: number): ViewBlock => w.c.buildings[w.buildings.def[b]!]!.def.view;

export function teamHtml(w: World, selected: number): string {
  const { agents: A, calls: C } = w;
  const bright = C.live().filter((c) => C.bright[c] === 1).length;
  const portraits = A.live().map((a) => {
    const view = agentView(w, a);
    const opensAt = w.c.content.buildings[0]!.keep!.levels.findIndex((level) => level.slots > a) + 1;
    if (a >= slotsOpen(w)) return `<button class="td-agent is-locked" disabled title="Fort level ${opensAt}">${view.short}<small>Fort ${opensAt}</small></button>`;
    const goal = A.goal[a]!;
    const badge = goal < 0 ? "" : `<em style="--fam:${buildingView(w, goal).color}" title="${buildingView(w, goal).name}">${buildingView(w, goal).short}</em>`;
    // Draconis' lantern carries Tối Thượng's charge in a ring (BUILD_1B §13.3), in steps of 5 % so the HTML changes seldom.
    const charge = Math.floor(w.ult.charge / 5) * 5;
    const ring = a === 0 ? `<b class="td-ult${charge >= ULT.max ? " is-full" : ""}" style="--ult:${charge}%" title="Ultimate ${charge} %"></b>` : "";
    return `<button class="td-agent${a === selected ? " is-on" : ""}" data-act="agent:${a}" style="--c:${view.color}" title="${view.name}">${ring}<i>${a + 1}</i>${view.short}${badge}</button>`;
  });
  return (
    `<div class="td-row"><span><b>${selected + 1} · ${agentView(w, selected).name}</b></span><span class="td-load" title="Lit calls / limit">Calling ${bright}/${MODES[w.mode].open}</span></div>` +
    `<div class="td-agents">${portraits.join("")}</div>`
  );
}
