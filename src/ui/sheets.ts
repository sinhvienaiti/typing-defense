/**
 * The pause and results cards (SPLIT_PLAN D7): dó paper in the middle of the map, never a HUD panel (the word cards do
 * not part around them). Pause (Esc, the HUD's Ⅱ): Chơi tiếp, Cài đặt, Về màn đầu. Results (BUILD_1B §4.3, §13.1): "Giữ
 * được làng" with its stars stamped one by one, or "Lũy đã vỡ" with a hint read off the run, and on a story won the
 * best stars kept (R3: "Kỷ lục ★★", new or not); the numbers, "Từ cần ôn" (the review book's newest five with their
 * meaning); Chơi lại Ngày n (after a night past the first was lost), Chơi lại (từ đầu), Chép số chơi thử, Xem bản đồ,
 * Về màn đầu. Keyboard first: ↑ ↓ pick, Enter chooses, Esc goes back to the game (or closes the settings).
 */
import { starsFor } from "../app/prefs";
import { STAT } from "../sim/stats";
import { BOSS } from "../sim/stores/boss";
import { locked } from "../sim/systems/waves";
import type { World } from "../sim/world";
import { gloss, wordText } from "../typing/decks";
import type { SettingsCard } from "./settings";

export type SheetAction = "resume" | "settings" | "title" | "again" | "retry" | "copy" | "map";
type Button = readonly [action: SheetAction, label: string, key: string];
/**
 * The results card's run: a story or the sandbox, a "Chơi lại Ngày n" this run came from (0: none), whether its chunk is in
 * (R3 step 1), the story's best stars after this run and whether this win set them (R3, td.campaign), the lives the boss's blows took.
 */
export type ResultsOf = { story: boolean; retried: number; canRetry?: boolean; best?: number; record?: boolean; blows?: number };

const PAUSE: readonly Button[] = [["resume", "Chơi tiếp", "Esc"], ["settings", "Cài đặt", ""], ["title", "Về màn đầu", ""]];

export { starsFor };
/** The won card's record line: the best stars kept, "mới" when this win set them (none in the sandbox). */
export const recordLine = (best: number, record: boolean): string => (best <= 0 ? "" : `<p class="td-best">Kỷ lục${record ? " mới" : ""} <b>${"★".repeat(best)}</b></p>`);

/**
 * The loss card's hint, read off the run (BALANCE §4.3): before the boss, what the run lacked (a tower, a typed word; the
 * Pháo's fire once it opens: test pass 27/10); from the lull, enemies that got in when they took more lives than the boss's
 * `blows` (counted by the page); it passed the merge with less than half of what had to come off; Dồn lửa words left
 * untyped in the stagger; buildings rooted again and again.
 */
export function lossHint(w: World, blows = 0): string {
  const S = w.boss;
  const s = w.stats;
  const need = (S.hpMax * w.c.content.boss!.retreatPct) / 100;
  const tower = w.buildings.live().some((b) => w.c.buildings[w.buildings.def[b]!]!.def.family === "attack");
  if (S.stage < BOSS.lull) return !tower ? "Xây Archer Tower cạnh đường: Fort một mình không giữ nổi." : s[STAT.callWords] === 0 ? "Gõ chữ trên thẻ tháp (Bắn mạnh) khi quái tới gần." : "Gõ Bắn mạnh khi quái tới gần tháp" + (locked(w, "cannon") ? "; xây thêm tháp cạnh đường." : "; Word Shot của Cannon Tower cạnh Draconis làm quái cháy.");
  if (s[STAT.livesBoss]! - blows > blows || S.stage < BOSS.fight) return "Quái lọt vào Fort lúc Mộc Tinh tới: gõ Bắn mạnh ở tháp gần Fort.";
  if (S.mergeHp >= 0 && S.hpMax - S.mergeHp < need / 2) return "Thêm tháp trên nhánh rễ sáng.";
  if (S.phase === 2 && s[STAT.burstTyped]! < s[STAT.burstWords]!) return "Lúc nó choáng, gõ Bắn mạnh ngay.";
  if (s[STAT.rootsHits]! >= 6) return "Đặt Archer Tower xa đường hơn: rễ không với tới.";
  return "Dồn tháp và Draconis lên nhánh rễ sáng, gõ Bắn mạnh khi nó tới gần.";
}

export class Sheet {
  readonly el: HTMLElement;
  private buttons: readonly Button[] = [];
  private focus = 0;
  private kind = "";

  constructor(root: HTMLElement, private readonly settings: SettingsCard, private readonly act: (action: SheetAction) => void) {
    this.el = root.appendChild(Object.assign(document.createElement("section"), { className: "td-sheet vd-sheet", hidden: true }));
    this.el.addEventListener("pointerdown", (event) => {
      const button = (event.target as Element).closest<HTMLElement>("button[data-sheet]");
      if (button === null || event.button !== 0) return;
      event.preventDefault();
      this.choose(this.buttons.findIndex(([action]) => action === button.dataset.sheet));
    });
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  /** The card for this frame: "pause", "results" or "" (none); written only when it changes. */
  show(kind: "pause" | "results" | "", w: World, run: ResultsOf = { story: false, retried: 0 }): void {
    if (kind === this.kind) return;
    this.kind = kind;
    this.el.hidden = kind === "";
    this.settings.close();
    if (kind === "") return;
    const won = w.phase === "victory";
    // The sandbox too: its skipTo runs replay alike (BUILD_1B §19 td-1b-night5); not while app/retry.ts is missing (R3 step 1).
    const retry = !won && w.day >= 2 && run.canRetry !== false;
    this.buttons = kind === "pause" ? PAUSE : [
      ...(retry ? [["retry", "Chơi lại Ngày " + w.day, "Enter"] as const] : []),
      ["again", retry ? "Chơi lại từ đầu" : "Chơi lại", retry ? "" : "Enter"], ["copy", "Chép số chơi thử", ""], ["map", "Xem bản đồ", "Esc"], ["title", "Về màn đầu", ""],
    ];
    this.focus = 0;
    this.el.className = "td-sheet vd-sheet is-" + kind + (won ? " is-won" : "");
    const stats = w.stats;
    const row = (label: string, value: number | string): string => `<dt>${label}</dt><dd>${value}</dd>`;
    const { review, reviewN, deck } = w.typing;
    const words = Array.from(review.subarray(Math.max(0, reviewN - 5), reviewN)).reverse().map((word) => `<li><b>${wordText(deck, word)}</b> ${gloss(deck, word)}</li>`).join("");
    const stars = won ? starsFor(w.lives) : 0;
    this.el.innerHTML =
      (kind === "pause"
        ? `<h2>Tạm dừng</h2><p>Làng đứng yên chờ bạn. Chữ trên thẻ vẫn ở đó.</p>`
        : (won ? `<h2>Giữ được làng</h2><div class="td-stars">${[1, 2, 3].map((k) => `<i class="${k <= stars ? "on" : ""}">★</i>`).join("")}</div>${run.story ? recordLine(run.best ?? 0, run.record === true) : ""}<p>Mộc Tinh đã nhớ ra tên mình và lui về rừng.${run.retried > 0 ? " (chơi lại Ngày " + run.retried + ")" : ""}</p>`
          : `<h2>Fort đã vỡ</h2><p class="td-hint-line">${lossHint(w, run.blows)}</p>`) +
          `<dl>` + (won ? row("Chest", "+" + stats[STAT.goldChest]! / 1000 + " Gold") : "") + row("Mạng còn", w.lives) + row("Đêm đã giữ", won ? Math.max(w.day, stats[STAT.wavesCleared]!) : stats[STAT.wavesCleared]!) + row("Quái đã hạ", stats[STAT.kills]!) + row("Từ đã gõ", stats[STAT.callWords]!) + row("Lời gọi Hoàn hảo", stats[STAT.callsPerfect]!) + (w.mode === "learn" || w.knowledge > 0 ? row("Knowledge", w.knowledge) : "") + `</dl>` +
          (words === "" ? "" : `<div class="td-review"><small>Từ cần ôn</small><ul>${words}</ul></div>`)) +
      this.buttons.map(([action, label, key]) => `<button type="button" tabindex="-1" data-sheet="${action}">${label}${key === "" ? "" : `<kbd>${key}</kbd>`}</button>`).join("");
    this.el.appendChild(this.settings.el);
    this.paint();
  }

  private paint(): void {
    this.el.querySelectorAll("button[data-sheet]").forEach((button, k) => button.classList.toggle("is-focus", k === this.focus));
  }

  private choose(at: number): void {
    const action = this.buttons[at]?.[0];
    if (action === "settings") {
      this.el.querySelectorAll<HTMLElement>("button[data-sheet], p, dl, .td-stars, .td-review").forEach((el) => (el.hidden = true));
      this.settings.open();
    } else if (action !== undefined) this.act(action);
  }

  /** Settings closed: the card's own buttons come back. */
  settingsDone(): void {
    this.settings.close();
    this.el.querySelectorAll<HTMLElement>("button[data-sheet], p, dl, .td-stars, .td-review").forEach((el) => (el.hidden = false));
  }

  /** A key while the card is up; true when it was the card's (the rest go on to the game). */
  key(event: KeyboardEvent): boolean {
    if (this.settings.shown) return this.settings.key(event);
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
      this.focus = (this.focus + (event.code === "ArrowUp" ? this.buttons.length - 1 : 1)) % this.buttons.length;
      this.paint();
    } else if (event.code === "Enter" || event.code === "NumpadEnter") this.choose(this.focus);
    else if (event.code === "Escape") this.act(this.kind === "pause" ? "resume" : "map");
    else return false;
    return true;
  }
}
