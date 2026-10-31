/**
 * The title screen (SPLIT_PLAN §1.2, D7; TK 22.1, 22.9): the accepted painted backdrop and logo
 * under the menu. Nothing on it is drawn in code (owner, 28/10: no code-drawn stand-ins);
 * without the file the screen is one flat colour and the console says which file failed. Keyboard first: ↑ ↓ pick,
 * Enter or 1–5 choose, Esc goes back to the run left open; while the title is up it takes every key and the world
 * does not step. "Profile" opens the typing profile (BALANCE.md §2) in the menu's place, as "Settings" opens the
 * settings. Those two cards are chunks of their own (BUILD_1B §20, R2 review fix 2): asked for when picked, an error
 * sound if one cannot load. "Start" shows the best stars of map 1 once it was won (td.campaign, BUILD_1B §4.3, R3).
 */
import type { UiSound } from "../view/audio-min";
import type { ProfileCard } from "./profile";
import type { SettingsCard } from "./settings";
import { artHtml, bindArt } from "./art";

export type TitleChoice = "start" | "continue" | "learn";
type EntryId = TitleChoice | "settings" | "profile";

const ENTRIES: readonly (readonly [EntryId, string, string])[] = [
  ["start", "Start", "Map 1 · Silverfall Meadow"],
  ["continue", "Resume", "Resume your run · Esc"],
  ["settings", "Settings", "Music and sound volume"],
  ["learn", "Learn", "Learn: meanings shown, Space pauses"],
  ["profile", "Profile", "Speed, accuracy, a typing tip"],
];
/** The best stars on "Bắt đầu" (none before a win). */
export const bestHtml = (best: number): string => (best <= 0 ? "" : ` · <span class="tt-stars" aria-label="Best ${best} star${best === 1 ? "" : "s"}">${"★".repeat(best)}${"☆".repeat(3 - best)}</span>`);

export class TitleScreen {
  readonly el: HTMLElement;
  private readonly entries: HTMLElement[];
  private readonly menu: HTMLElement;
  private focus = 0;
  private readonly off = new Set<EntryId>();
  private settings: SettingsCard | null = null;
  private profile: ProfileCard | null = null;
  /** A card's chunk is on its way: picks wait. */
  private pending = false;

  constructor(
    root: HTMLElement,
    private readonly hooks: { choose(choice: TitleChoice): void; sound(sound: UiSound): void; wake(): void; profile(card: ProfileCard): void },
    private readonly cards: { settings(): Promise<SettingsCard | null>; profile(): Promise<ProfileCard | null> },
    learn: boolean,
  ) {
    this.el = Object.assign(document.createElement("div"), { className: "tt-screen", hidden: true });
    this.el.innerHTML =
      artHtml("title-backdrop", "tt-art") +
      `<header class="tt-head"><h1 class="tt-name">${artHtml("logo", "tt-logo", "Wordwoven")}<span class="tt-logo-fallback" hidden aria-hidden="true">Wordwoven</span></h1>` +
      `<p class="tt-sub">Defend your village, one word at a time.</p></header>` +
      `<nav class="tt-menu vd-sheet" aria-label="Title">${ENTRIES.map(([id, label, sub], k) => `<div class="tt-entry" role="button" data-entry="${id}"><kbd>${k + 1}</kbd><b>${label}</b><small>${sub}</small></div>`).join("")}</nav>` +
      `<p class="tt-keys">↑ ↓ select · Enter play · 1–5 quick pick</p>`;
    this.menu = this.el.querySelector(".tt-menu")!;
    this.entries = [...this.el.querySelectorAll<HTMLElement>(".tt-entry")];
    if (!learn) this.off.add("learn");
    root.appendChild(this.el);
    this.el.addEventListener("pointerdown", (event) => {
      this.hooks.wake();
      const entry = (event.target as Element).closest<HTMLElement>(".tt-entry");
      if (entry === null || this.settings?.shown === true || this.profile?.shown === true) return;
      event.preventDefault();
      this.pick(this.entries.indexOf(entry));
    });
    this.el.addEventListener("pointermove", (event) => {
      const at = this.entries.indexOf((event.target as Element).closest<HTMLElement>(".tt-entry")!);
      if (at >= 0 && at !== this.focus && !this.off.has(ENTRIES[at]![0])) this.move(at);
    });
    bindArt(this.el.querySelector<HTMLImageElement>(".tt-art")!, "title-backdrop", {
      loaded: () => { this.el.classList.add("has-art"); this.el.classList.remove("no-art"); },
      failed: () => { this.el.classList.remove("has-art"); this.el.classList.add("no-art"); },
    });
    bindArt(this.el.querySelector<HTMLImageElement>(".tt-logo")!, "logo", { fallback: this.el.querySelector<HTMLElement>(".tt-logo-fallback")! });
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  /** Shows the title; "Resume" is open only with a run left to go back to; `best`: map 1's stars. */
  show(canContinue: boolean, best = 0): void {
    this.el.hidden = false;
    this.entries[0]!.querySelector("small")!.innerHTML = ENTRIES[0]![2] + bestHtml(best);
    if (canContinue) this.off.delete("continue");
    else this.off.add("continue");
    this.settings?.close();
    this.profile?.close();
    this.entries.forEach((entry) => (entry.hidden = false));
    this.entries.forEach((entry, k) => entry.classList.toggle("is-off", this.off.has(ENTRIES[k]![0])));
    this.move(canContinue ? 1 : 0, false);
  }

  hide(): void {
    this.el.hidden = true;
    this.settings?.close();
    this.profile?.close();
  }

  private move(to: number, sound = true): void {
    this.focus = to;
    this.entries.forEach((entry, k) => entry.classList.toggle("is-focus", k === to));
    if (sound) this.hooks.sound("move");
  }

  private pick(at: number): void {
    const id = ENTRIES[at]?.[0];
    if (id === undefined) return;
    if (this.off.has(id)) return this.hooks.sound("off");
    if (id !== "settings" && id !== "profile") {
      this.hooks.sound("pick");
      return this.hooks.choose(id);
    }
    if (this.pending) return;
    this.pending = true;
    void this.card(id).then((card) => {
      this.pending = false;
      // Its chunk did not load (logged): the menu stays and says so under the entry (test pass 27/10: nothing showed).
      if (card === null) return (this.entries[at]!.querySelector("small")!.textContent = "Load failed · F5 to retry"), this.hooks.sound("off");
      if (this.el.hidden) return;
      this.hooks.sound("pick");
      this.entries.forEach((entry) => (entry.hidden = true));
      if (id === "settings") this.settings!.open();
      else this.hooks.profile(this.profile!);
    });
  }

  /** The settings or profile card, its chunk loaded on first use and its element put in the menu. */
  private async card(id: "settings" | "profile"): Promise<SettingsCard | ProfileCard | null> {
    const card = id === "settings" ? (this.settings ??= await this.cards.settings()) : (this.profile ??= await this.cards.profile());
    if (card !== null && !card.el.isConnected) this.menu.append(card.el);
    return card;
  }

  /** Settings or the profile closed: the entries come back, the focus on the entry that opened it. */
  settingsDone(): void {
    const at = this.profile?.shown === true ? ENTRIES.findIndex(([id]) => id === "profile") : 2;
    this.settings?.close();
    this.profile?.close();
    this.entries.forEach((entry) => (entry.hidden = false));
    this.move(at, false);
  }

  /** Every key while the title is up; true when the page should not act on it (its default). */
  key(event: KeyboardEvent): boolean {
    this.hooks.wake();
    if (event.repeat && !event.code.startsWith("Arrow")) return true;
    if (this.settings?.shown === true) return this.settings.key(event);
    if (this.profile?.shown === true) return this.profile.key(event);
    const step = event.code === "ArrowDown" || (event.code === "Tab" && !event.shiftKey) ? 1 : event.code === "ArrowUp" || event.code === "Tab" ? -1 : 0;
    if (step !== 0) {
      let to = this.focus;
      do to = (to + step + ENTRIES.length) % ENTRIES.length;
      while (this.off.has(ENTRIES[to]![0]));
      this.move(to);
    } else if (event.code === "Enter" || event.code === "NumpadEnter" || event.code === "Space") this.pick(this.focus);
    else if (/^Digit[1-5]$/.test(event.code)) this.pick(Number(event.code.slice(5)) - 1);
    else if (event.code === "Escape" && !this.off.has("continue")) this.pick(1);
    else return false;
    return true;
  }
}
