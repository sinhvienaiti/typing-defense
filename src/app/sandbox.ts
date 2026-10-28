/**
 * The sandbox panel (docs/td/BUILD_NOW.md §5.3, BUILD_1A6 §9; F9 hides it), a chunk of its own (BUILD_1B §20).
 * Its buttons, and the level row of a building's card, are `sb:<op>:<value>` actions that become `sandbox`
 * commands (sandboxOp in app/selection.ts), so a run's log replays them. Test pass 27/10: the day jumps and the boss
 * (BUILD_1B §14) have buttons, not only __td.
 */
import { MODE_IDS } from "../sim/commands";
import type { World } from "../sim/world";
import { button, seg } from "../ui/hud";

export function sandboxHtml(w: World): string {
  return (
    `<b>Sandbox</b><kbd>F9</kbd>` +
    seg("Fort", "sb:keepLevel", ["1", "2", "3", "4"], ["1", "2", "3", "4"], String(w.buildings.level[0])) +
    `<div class="td-row td-wide"><small>Stock</small>${button("sb:gold:100", "+100 Gold")}${button("sb:gold:1000", "+1000 Gold")}${button("sb:wood:50", "+50 Wood")}</div>` +
    `<div class="td-row"><small>WPM</small>${[-5, -1, 1, 5].map((d) => button("sb:expected:" + Math.max(12, Math.min(140, w.expected + d)), (d > 0 ? "+" : "−") + Math.abs(d))).join("")}<b>${w.expected}</b></div>` +
    seg("Mode", "sb:mode", MODE_IDS, ["Relaxed", "Balanced", "Challenge", "Learn"], w.mode, true) +
    seg("Words", "sb:vocab", ["1", "3", "5"], ["Lv. 1", "1–3", "1–5"], String(w.vocab)) +
    seg("Speed", "sb:speed", ["0.75", "1", "2"], ["0.75×", "1×", "2×"], String(w.speed)) +
    `<div class="td-row td-wide">${button("sb:preset", "Preset")}${button("sb:night", "New night")}${button("sb:ult", "Fill Ultimate", "=")}</div>` +
    `<div class="td-row"><small>Day</small>${[2, 3, 4, 5].map((d) => button("sb:skipTo:" + d, String(d), "", " title=\"Skip to Day " + d + '"')).join("")}${button("sb:boss", "Boss", "", " title=\"Summon Mộc Tinh\"")}</div>` +
    `<div class="td-row"><small>Spawn</small>${button("sb:spawn:tanuki", "Raccoon Dog", "", " title=\"+1 Raccoon Dog, 8 Hopping Zombies after 6 s (Stop)\"")}${button("sb:spawn:nuppeppo", "3 Split Blob", "", ' title="+3 Split Blob"')}</div>` +
    `<div class="td-row"><small>Spawn</small>${button("sb:spawn:cuong-thi-lead", "Zombie Leader", "", " title=\"+1 Zombie Leader and 5 Hopping Zombies (Pin)\"")}${button("sb:spawn:troll", "Troll", "", " title=\"+1 Troll (Shatter)\"")}</div>` +
    `<div class="td-row"><small>Pace</small><span>k ×${w.pace.k.toFixed(2)} · adaptive ${w.pace.director ? "On" : "Off"}</span></div>`
  );
}
