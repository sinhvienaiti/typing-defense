/**
 * The settings (SPLIT_PLAN D7): master, music and effects volumes 0–100, and "Nhịp tự điều theo cách bạn gõ"
 * (BALANCE.md §4.2, on by default: the run's pace k and the pace director; a run keeps the value it started
 * with), kept under td.settings; the card the title and the pause card open. Keyboard first: ↑ ↓ pick a row,
 * ← → move a volume by 10 or switch the pace, Enter or Esc closes; a click on a bar sets it, on the pace row switches it.
 */
import { safeLocalStorage } from "../kit/platform/safe-storage";

export type Settings = { master: number; music: number; sfx: number; pace: boolean };

const KEY = "td.settings";
const DEFAULTS: Settings = { master: 80, music: 60, sfx: 80, pace: true };
type Volume = Exclude<keyof Settings, "pace">;
export const SETTING_ROWS: readonly (readonly [Volume, string])[] = [["master", "Âm lượng chung"], ["music", "Nhạc"], ["sfx", "Tiếng trận và gõ"]];
export const PACE_LABEL = "Nhịp tự điều theo cách bạn gõ";
const ROWS = SETTING_ROWS.length + 1;

export function loadSettings(): Settings {
  const stored = safeLocalStorage.readJson(KEY) as Partial<Record<keyof Settings, unknown>> | null;
  const settings = { ...DEFAULTS };
  for (const [key] of SETTING_ROWS) {
    const value = stored?.[key];
    if (typeof value === "number" && value >= 0 && value <= 100) settings[key] = Math.round(value);
  }
  settings.pace = stored?.pace !== false;
  return settings;
}

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
    safeLocalStorage.writeJson(KEY, this.settings);
    this.changed(this.settings);
    this.render();
  }

  private set(value: number): void {
    const [key] = SETTING_ROWS[this.row]!;
    this.settings[key] = Math.max(0, Math.min(100, value));
    this.save();
  }

  private toggle(): void {
    this.row = SETTING_ROWS.length;
    this.settings.pace = !this.settings.pace;
    this.save();
  }

  /** A key while the card is open; true when it was the card's. */
  key(event: KeyboardEvent): boolean {
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
      this.row = (this.row + (event.code === "ArrowUp" ? ROWS - 1 : 1)) % ROWS;
      this.render();
    } else if ((event.code === "ArrowLeft" || event.code === "ArrowRight" || event.code === "Space") && this.row === SETTING_ROWS.length) this.toggle();
    else if (event.code === "ArrowLeft" || event.code === "ArrowRight") this.set(this.settings[SETTING_ROWS[this.row]![0]] + (event.code === "ArrowLeft" ? -10 : 10));
    else if (event.code === "Escape" || event.code === "Enter" || event.code === "NumpadEnter") this.done();
    else return false;
    return true;
  }

  private render(): void {
    this.el.innerHTML =
      SETTING_ROWS.map(([key, label], k) =>
        `<div class="td-set-row${k === this.row ? " is-focus" : ""}" data-key="${key}"><span>${label}</span><i class="td-set-bar"><i style="width:${this.settings[key]}%"></i></i><b>${this.settings[key]}</b></div>`).join("") +
      `<div class="td-set-row td-set-pace${this.row === SETTING_ROWS.length ? " is-focus" : ""}" data-key="pace"><span>${PACE_LABEL}<small>Áp dụng khi bắt đầu ván</small></span>` +
      `<b class="td-set-switch${this.settings.pace ? " is-on" : ""}">${this.settings.pace ? "Bật" : "Tắt"}</b></div>` +
      `<p class="td-set-hint">↑ ↓ chọn · ← → chỉnh · Enter xong</p><button class="vd-seal" type="button">Xong <kbd>Esc</kbd></button>`;
  }
}
