/**
 * The pause and results cards (SPLIT_PLAN D7): dó paper in the middle of the map, never a HUD panel (the
 * word cards do not part around them). Pause (Esc, the HUD's Ⅱ): Chơi tiếp, Cài đặt, Về màn đầu. Results
 * (the Bastion lost): the run's numbers, Chơi lại, Xem bản đồ, Về màn đầu. Keyboard first: ↑ ↓ pick,
 * Enter chooses, Esc goes back to the game (or closes the settings).
 */
import { STAT } from "../sim/stats";
import type { World } from "../sim/world";
import type { SettingsCard } from "./settings";

export type SheetAction = "resume" | "settings" | "title" | "again" | "map";
type Button = readonly [action: SheetAction, label: string, key: string];

const PAUSE: readonly Button[] = [["resume", "Chơi tiếp", "Esc"], ["settings", "Cài đặt", ""], ["title", "Về màn đầu", ""]];
const RESULTS: readonly Button[] = [["again", "Chơi lại", "Enter"], ["map", "Xem bản đồ", "Esc"], ["title", "Về màn đầu", ""]];

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
  show(kind: "pause" | "results" | "", w: World): void {
    if (kind === this.kind) return;
    this.kind = kind;
    this.el.hidden = kind === "";
    this.settings.close();
    if (kind === "") return;
    this.buttons = kind === "pause" ? PAUSE : RESULTS;
    this.focus = 0;
    this.el.className = "td-sheet vd-sheet is-" + kind;
    const stats = w.stats;
    const row = (label: string, value: number): string => `<dt>${label}</dt><dd>${value}</dd>`;
    this.el.innerHTML =
      (kind === "pause"
        ? `<h2>Tạm dừng</h2><p>Làng đứng yên chờ anh. Chữ trên thẻ vẫn ở đó.</p>`
        : `<h2>Lũy đã thất thủ</h2><p>Mực Câm tràn qua cổng làng. Đêm sau giữ chặt hơn nhé.</p><dl>` +
          row("Đêm đã giữ", stats[STAT.wavesCleared]!) + row("Quái đã hạ", stats[STAT.kills]!) + row("Từ đã gõ", stats[STAT.callWords]!) + row("Từ Hoàn hảo", stats[STAT.wordsPerfect]!) + row("Tri thức", w.knowledge) + row("Sổ ôn", w.typing.reviewN) + `</dl>`) +
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
      this.el.querySelectorAll<HTMLElement>("button[data-sheet], p, dl").forEach((el) => (el.hidden = true));
      this.settings.open();
    } else if (action !== undefined) this.act(action);
  }

  /** Settings closed: the card's own buttons come back. */
  settingsDone(): void {
    this.settings.close();
    this.el.querySelectorAll<HTMLElement>("button[data-sheet], p, dl").forEach((el) => (el.hidden = false));
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
