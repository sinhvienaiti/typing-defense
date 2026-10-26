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
  day1: { line: "Lúa chín, bác nông dân gọi. Đưa Draconis tới, gõ chữ trên bong bóng.", chip: "Gõ chữ đầu để chọn · Esc để thôi" },
  night1: { line: "Đêm xuống, tháp gọi khi quái tới gần. Gõ là bắn Phát Chữ.", chip: "Bỏ qua lời gọi không mất gì" },
  day2: { line: "Gỗ để xây nhà; cây mọc lại mỗi sáng. Bấm cây để chặt.", chip: "Shift + \\ thuê dân" },
  night2: { line: "Ma Trơi bay qua đầu lính. Tháp Cung và Draconis bắn được.", chip: "" },
  day3: { line: "Nâng Lũy thì Chấm ra giúp. Thư Đồng làm việc nhanh hơn.", chip: "1–4 chọn người · Enter gửi đi" },
  night3: { line: "Lông lửa đầy rồi! Bấm = rồi gõ thêm chữ cho mưa to hơn.", chip: "= Tối Thượng" },
  day4: { line: "Nhà cấp 2 mạnh hơn. Bán lại được sáu phần mười.", chip: "Bán: bấm hai lần" },
  night4: { line: "Tanuki đánh trống hồi máu. Gõ chữ trên đầu nó để Ngắt.", chip: "Chữ trên quái: gõ để phá chiêu" },
  day5: { line: "Đêm nay Mộc Tinh thức dậy. Dồn tháp lên nhánh rễ sáng.", chip: "Boss rút ở 50 % máu" },
  night5: { line: "Rễ trồi làm nhà tê. Lửa của chữ mới làm nó cháy.", chip: "Choáng: gõ Bắn mạnh ngay" },
};

/** What each building does; `taught`: the row that says it, after which its card drops the line. */
export const DOES: Readonly<Record<string, { line: string; taught?: string }>> = {
  farm: { line: "Gieo hạt; lúa chín thì gọi Gặt.", taught: "day1" },
  archer: { line: "Bắn quái gần, cả quái bay.", taught: "night1" },
  barracks: { line: "Lính chặn quái trên đường cho tháp bắn." },
  "gold-mine": { line: "Đặt trên quặng; vàng đầy nửa thì gọi Đào." },
  cannon: { line: "Đạn nổ trúng cả bầy dưới đất." },
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
