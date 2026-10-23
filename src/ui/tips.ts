/**
 * The map 1 tutorial table's rows R1 shows (docs/td/BUILD_1B.md §12): Bà Cú Mực's line and a tip chip at the start
 * of day 5 and night 5, and Mộc Tinh's own lines (TK 22.7). Text only; the boss banner (hud.ts) shows them.
 */
export const TIPS: Readonly<Record<string, { line: string; chip: string }>> = {
  day5: { line: "Đêm nay Mộc Tinh thức dậy. Dồn tháp lên nhánh rễ sáng.", chip: "Boss rút ở 50 % máu" },
  night5: { line: "Rễ trồi làm nhà tê. Lửa của chữ mới làm nó cháy.", chip: "Choáng: gõ Bắn mạnh ngay" },
};

export const BOSS_LINES = { rise: "Tên ta ở đâu?", roots: "Rễ ơi, mọc lên!", stagger: "Cái tên đó... quen quá...", retreat: "À... ta nhớ rồi." } as const;
