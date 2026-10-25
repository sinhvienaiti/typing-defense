/**
 * The settings card (SPLIT_PLAN D7) the title and the pause card open, over app/prefs.ts (td.settings): the volumes,
 * "Nhịp tự điều theo cách bạn gõ" and the story's mode (BUILD_1B §14, R3: "Theo hồ sơ", Thư giãn, Cân bằng, Thử thách, Học;
 * set on the title it is the run's, during a run the next one's). A chunk of its own (BUILD_1B §20). Keyboard first: ↑ ↓
 * pick a row, ← → move a volume by 10, switch the pace or step the mode, Enter or Esc closes; a click on a bar sets it, on
 * the pace row switches it, on the mode row steps it.
 */
import { MODE_CHOICES, saveSettings, SETTING_ROWS, type Settings } from "../app/prefs";
import type { Mode } from "../content/types";

export const PACE_LABEL = "Nhịp tự điều theo cách bạn gõ";
const PACE_ROW = SETTING_ROWS.length;
const MODE_ROW = PACE_ROW + 1;
const ROWS = MODE_ROW + 1;
const MODE_NAMES: Readonly<Record<Mode, string>> = { relax: "Thư giãn", balanced: "Cân bằng", challenge: "Thử thách", learn: "Học" };
/** The mode row's value: the mode's name, or "Theo hồ sơ" (a child plays Thư giãn, anyone else Cân bằng). */
export const modeName = (mode: Mode | null): string => (mode === null ? "Theo hồ sơ" : MODE_NAMES[mode]);
/** ← → or a click on the mode row: the next choice, round. */
export const stepMode = (mode: Mode | null, by: number): Mode | null => MODE_CHOICES[(MODE_CHOICES.indexOf(mode) + by + MODE_CHOICES.length) % MODE_CHOICES.length]!;

export class SettingsCard {
  readonly el: HTMLElement;
  private row = 0;

  constructor(private readonly settings: Settings, private readonly changed: (settings: Settings) => void, private readonly done: () => void) {
    this.el = Object.assign(document.createElement("div"), { className: "td-settings", hidden: true });
    this.el.addEventListener("pointerdown", (event) => {
      const target = event.target as Element;
      const row = target.closest<HTMLElement>(".td-set-row");
      if (target.closest("button") !== null) return this.done();
      if (row === null) return;
      if (row.dataset.key === "pace") return this.toggle();
      if (row.dataset.key === "mode") return this.step(1);
      this.row = SETTING_ROWS.findIndex(([key]) => key === row.dataset.key);
      if (target.closest(".td-set-bar") === null) return this.render(); // the label picks the row
      const bar = row.querySelector(".td-set-bar")!.getBoundingClientRect();
      this.set(Math.round(((event.clientX - bar.left) / bar.width) * 10) * 10);
    });
  }

  open(): void {
    this.el.hidden = false;
    this.row = 0;
    this.render();
  }

  close(): void {
    this.el.hidden = true;
  }

  get shown(): boolean {
    return !this.el.hidden;
  }

  private save(): void {
    saveSettings(this.settings);
    this.changed(this.settings);
    this.render();
  }

  private set(value: number): void {
    const [key] = SETTING_ROWS[this.row]!;
    this.settings[key] = Math.max(0, Math.min(100, value));
    this.save();
  }

  private toggle(): void {
    this.row = PACE_ROW;
    this.settings.pace = !this.settings.pace;
    this.save();
  }

  private step(by: number): void {
    this.row = MODE_ROW;
    this.settings.mode = stepMode(this.settings.mode, by);
    this.save();
  }

  /** A key while the card is open; true when it was the card's. */
  key(event: KeyboardEvent): boolean {
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
      this.row = (this.row + (event.code === "ArrowUp" ? ROWS - 1 : 1)) % ROWS;
      this.render();
    } else if ((event.code === "ArrowLeft" || event.code === "ArrowRight" || event.code === "Space") && this.row === PACE_ROW) this.toggle();
    else if ((event.code === "ArrowLeft" || event.code === "ArrowRight" || event.code === "Space") && this.row === MODE_ROW) this.step(event.code === "ArrowLeft" ? -1 : 1);
    else if (event.code === "ArrowLeft" || event.code === "ArrowRight") this.set(this.settings[SETTING_ROWS[this.row]![0]] + (event.code === "ArrowLeft" ? -10 : 10));
    else if (event.code === "Escape" || event.code === "Enter" || event.code === "NumpadEnter") this.done();
    else return false;
    return true;
  }

  private render(): void {
    this.el.innerHTML =
      SETTING_ROWS.map(([key, label], k) =>
        `<div class="td-set-row${k === this.row ? " is-focus" : ""}" data-key="${key}"><span>${label}</span><i class="td-set-bar"><i style="width:${this.settings[key]}%"></i></i><b>${this.settings[key]}</b></div>`).join("") +
      `<div class="td-set-row td-set-pace${this.row === PACE_ROW ? " is-focus" : ""}" data-key="pace"><span>${PACE_LABEL}<small>Áp dụng khi bắt đầu ván</small></span>` +
      `<b class="td-set-switch${this.settings.pace ? " is-on" : ""}">${this.settings.pace ? "Bật" : "Tắt"}</b></div>` +
      `<div class="td-set-row td-set-pace${this.row === MODE_ROW ? " is-focus" : ""}" data-key="mode"><span>Chế độ (truyện)<small>Áp dụng khi bắt đầu ván</small></span>` +
      `<b class="td-set-switch td-set-mode is-on">‹ ${modeName(this.settings.mode)} ›</b></div>` +
      `<p class="td-set-hint">↑ ↓ chọn · ← → chỉnh · Enter xong</p><button class="vd-seal" type="button">Xong <kbd>Esc</kbd></button>`;
  }
}
