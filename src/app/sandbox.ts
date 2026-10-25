/**
 * The sandbox panel (docs/td/BUILD_NOW.md §5.3, BUILD_1A6 §9; F9 hides it), a chunk of its own (BUILD_1B §20).
 * Its buttons, and the level row of a building's card, are `sb:<op>:<value>` actions that become `sandbox`
 * commands (sandboxOp in app/selection.ts), so a run's log replays them.
 */
import { MODE_IDS } from "../sim/commands";
import type { World } from "../sim/world";
import { button, seg } from "../ui/hud";

export function sandboxHtml(w: World): string {
  return (
    `<b>Hộp cát</b><kbd>F9</kbd>` +
    seg("Lũy", "sb:keepLevel", ["1", "2", "3", "4"], ["1", "2", "3", "4"], String(w.buildings.level[0])) +
    `<div class="td-row"><small>Kho</small>${button("sb:gold:100", "+100 vàng")}${button("sb:gold:1000", "+1000")}${button("sb:wood:50", "+50 gỗ")}</div>` +
    `<div class="td-row"><small>Tốc E</small>${[-5, -1, 1, 5].map((d) => button("sb:expected:" + Math.max(12, Math.min(140, w.expected + d)), (d > 0 ? "+" : "−") + Math.abs(d))).join("")}<b>${w.expected}</b></div>` +
    seg("Chế độ", "sb:mode", MODE_IDS, ["Thư giãn", "Cân bằng", "Thử thách", "Học"], w.mode, true) +
    seg("Từ vựng", "sb:vocab", ["1", "3", "5"], ["Cấp 1", "1–3", "1–5"], String(w.vocab)) +
    seg("Tốc game", "sb:speed", ["0.75", "1", "2"], ["0,75×", "1×", "2×"], String(w.speed)) +
    `<div class="td-row">${button("sb:preset", "Đặt sẵn")}${button("sb:night", "Sinh đêm")}${button("sb:ult", "Nạp =", "", ' title="Tối Thượng đầy"')}</div>` +
    `<div class="td-row"><small>Gọi</small>${button("sb:spawn:tanuki", "Tanuki", "", ' title="+1 Lửng Tanuki (Ngắt)"')}${button("sb:spawn:nuppeppo", "3 Nupp.", "", ' title="+3 Nuppeppō"')}</div>` +
    `<div class="td-row"><small>Gọi</small>${button("sb:spawn:cuong-thi-lead", "Đầu Đàn", "", ' title="+1 Cương Thi Đầu Đàn và 5 Cương Thi (Neo)"')}${button("sb:spawn:troll", "Troll", "", ' title="+1 Quỷ Núi Troll (Phá Khiên)"')}</div>` +
    `<div class="td-row"><small>Nhịp</small><span>k ×${w.pace.k.toFixed(2).replace(".", ",")} · tự điều ${w.pace.director ? "Bật" : "Tắt"}</span></div>`
  );
}
