/**
 * The Settings gear and the Sound speaker (parent docs/games/IN_GAME_SETTINGS.md, tickets 192/193): the kit's two
 * panels over Wordwoven's real channels and settings, the Typing Feel keyboard sets (app/keyboard.ts, parent
 * docs/games/TYPING_FEEL_SERVICE.md §5.1–5.3: read at run time, none copied into the game) and the original Bamboo keys
 * (view/audio-min.ts). Both panels are built at once: the keyboard row opens with the pending list (Off, Bamboo, the
 * chosen set "Loading…") and takes the settled list when the catalogue main.ts asked for arrives. No simulation state: a
 * letter's sound follows the simulation's verdict (read), so a wrong or stray key keeps the kit's damped cue on the
 * chosen set's own files.
 */
import { pendingKeyboardChoices, TypingSounds, type KeyboardSoundChoice, type TypingSoundEvent } from "../kit/feedback/typing-fx/audio";
import { QuickSettings, defaultSoundRows, QUICK_ICON_NAMES, type QuickIcons, type QuickRow, type QuickSkin, type QuickValue } from "../kit/ui/quick-settings";
import { bambooKeys, MODE_CHOICES, ownKeyboard, ownsKeyboard, saveSettings, type Settings } from "./prefs";
import { KEYBOARD_SET_UNAVAILABLE, KEYBOARD_UNAVAILABLE, manifestJson, ORIGINAL_KEYS, sampleBytes, startKeyboard, type KeyboardFeed } from "./keyboard";
import { modeName } from "../ui/settings";
import type { RareEvent } from "../sim/events";
import { KEY } from "../typing/router";
import type { TypingAudio } from "../view/audio-min";
export const QUICK_ART = "/assets/typing-defense/ui/quick-settings/";
/**
 * The 160 button art (2079 x 502) as a nine-slice: cut 170 px top and bottom, 260 px at the sides (the medallion and
 * cloud-scroll corners), as quick.css cuts the buttons. Keyboard sound rows draw it at 12 / 170 of its size (12 px
 * edges, 18 px sides at 720p).
 */
export const PLATE_SLICE = [170, 260] as const;
const ROW_EDGE = [12, 18] as const;
/**
 * Frame, button (115/160) and slider art (225). At 1080p the groove is drawn about 15 CSS px tall and the knob box
 * 42 px: the 1024 x 64 groove and the 128 px knob.
 * - The fill layer runs on the 225 groove until the 244 fill art is accepted: `sliderEmpty` is the groove (quick.css
 *   dims and greys it, so the jade never reads full at 0) and the fill falls back to the same groove, lit.
 * - Keyboard sound rows are 160 button plates, the chosen row the 160 button-active plate (`buttonActive`, also the
 *   pressed and chosen buttons). The 245 list-row art drops in here.
 */
export const QUICK_SKIN: QuickSkin = {
  panel: QUICK_ART + "panel-large.v2.alpha.png",
  button: QUICK_ART + "button.v2.alpha.png",
  buttonActive: QUICK_ART + "button-active.v2.alpha.png",
  sliderTrack: QUICK_ART + "slider-track.png",
  sliderThumb: QUICK_ART + "slider-thumb.128.png",
  sliderEmpty: QUICK_ART + "slider-track.png",
  listRow: { slice: PLATE_SLICE, edge: ROW_EDGE },
};
/** The 180 icons the game has (no Voice row); Keyboard volume reuses the keyboard icon until its own (ticket 244) is accepted. */
export const QUICK_ICONS: QuickIcons = {
  ...Object.fromEntries(QUICK_ICON_NAMES.filter((name) => name !== "vol-voice").map((name) => [name, QUICK_ART + name + ".128.png"])),
  "vol-keyboard-volume": QUICK_ART + "vol-keyboard.128.png",
};
/**
 * The keyboard rows' plate at the panel's scale (quick.css scales the 34 px rows by --kit-qs-s; the kit's own values
 * are these at scale 1): the edges and the label clear of the corners.
 */
const scaled = (n: number): string => `calc(${n}px * var(--kit-qs-s))`;
export const LIST_ROW_VARS: Readonly<Record<string, string>> = {
  "--kit-qs-list-edge": ROW_EDGE.map(scaled).join(" "),
  "--kit-qs-list-active-edge": ROW_EDGE.map(scaled).join(" "),
  "--kit-qs-list-inset": `${scaled(2)} 0px`,
  "--kit-qs-list-text-x": scaled(ROW_EDGE[1] + 4),
};
/** Art the kit's skin has no field for, passed to quick.css as variables on the layer: the 180 muted speaker for the Master row. */
export const QUICK_ART_VARS: Readonly<Record<string, string>> = {
  "--td-qs-icon-muted": QUICK_ART + "hud-sound-muted.128.png",
};
/** The Mute button's label while muted; its own label ("Mute") comes back when unmuted. */
export const UNMUTE_LABEL = "Unmute";
/**
 * The kit draws no muted state on the Master row (only the corner speaker changes). While Mute is pressed the row takes
 * `td-quick__row--muted` (quick.css dims the groove and strikes the number) and the button reads "Unmute"; muted or at 0
 * the row takes `td-quick__row--silent` (the muted speaker art). It follows what the kit draws (the button's
 * aria-pressed, the number's text), so a change in the panel, a refresh() and a reopened panel all repaint it.
 */
export function watchMute(root: HTMLElement): void {
  const row = root.querySelector<HTMLElement>('.kit-qs__row[data-row="master"]');
  const button = row?.querySelector<HTMLButtonElement>('.kit-qs__btn[data-toggle="muted"]');
  const number = row?.querySelector<HTMLElement>(".kit-qs__num");
  if (!row || !button || !number) return;
  const label = button.textContent ?? "";
  const paint = (): void => {
    const muted = button.getAttribute("aria-pressed") === "true";
    row.classList.toggle("td-quick__row--muted", muted);
    row.classList.toggle("td-quick__row--silent", muted || number.textContent === "0");
    const text = muted ? UNMUTE_LABEL : label;
    if (button.textContent !== text) button.textContent = text;
  };
  const observer = new MutationObserver(paint);
  observer.observe(button, { attributes: true, attributeFilter: ["aria-pressed"] });
  observer.observe(number, { childList: true, characterData: true, subtree: true });
  paint();
}
export const settingsRows = (): QuickRow[] => [
  { kind: "heading", id: "gameHeading", label: "Game · new runs" },
  { kind: "toggle", id: "pace", label: "Pace adapts to your typing", default: true },
  { kind: "choice", id: "mode", label: "Story mode", options: MODE_CHOICES.map((mode) => ({ value: mode ?? "profile", label: modeName(mode) })), default: "profile" },
  { kind: "button", id: "resume", label: "Resume", action: "resume", primary: true },
  { kind: "button", id: "quit", label: "Quit to title", action: "quit" },
];
export const soundRows = (choices: readonly KeyboardSoundChoice[]): QuickRow[] => defaultSoundRows({ keyboardProfiles: choices }).filter((row) => row.id !== "voice");
export const quickValues = (s: Settings): Record<string, QuickValue> => ({ master: s.master, muted: s.muted, music: s.music, effects: s.sfx, ui: s.ui, keyboard: s.keyboard, keyboardVolume: s.keyboardVolume, pace: s.pace, mode: s.mode ?? "profile" });
export function applyQuick(s: Settings, id: string, value: QuickValue): boolean {
  if (id === "keyboard" && typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,31}$/.test(value)) s.keyboard = value;
  else if (id === "mode" && (value === "profile" || MODE_CHOICES.includes(value as Settings["mode"]))) s.mode = value === "profile" ? null : value as Settings["mode"];
  else if ((id === "pace" || id === "muted") && typeof value === "boolean") s[id] = value;
  else if (["master", "music", "effects", "ui", "keyboardVolume"].includes(id) && typeof value === "number" && Number.isFinite(value)) s[id === "effects" ? "sfx" : id as "master" | "music" | "ui" | "keyboardVolume"] = Math.round(Math.max(0, Math.min(100, value)));
  else return false;
  return true;
}
/** A letter's sound from the router's verdict (wordKey): a wrong or a stray key plays the kit's damped cue (TYPING_SOUND_MAP). */
export const letterSound = (result: number): TypingSoundEvent => (result === KEY.wrong ? "wrong" : result === KEY.stray ? "stray" : "key");

/**
 * `saved`: the save's own keyboard field (prefs savedKeyboard), read with the page; `feed`: the catalogue main.ts asked
 * for then (none: asked here); `standIn`: Bamboo now stands in for that set (null: no longer), for the sound chunk;
 * `playable`: the saved set's first batch is in ("batch"), or its load ended without one ("ended"; main.ts's KeyboardGate).
 */
export type QuickHooks = {
  audio(): TypingAudio | null; quit(): void; countdown(): number; notice(text: string): void;
  readonly saved: string | null; readonly feed?: KeyboardFeed | Promise<KeyboardFeed | null>; standIn?(id: string | null): void; playable?(by: "batch" | "ended"): void;
};
/**
 * `typed`: a key the simulation does not voice (the space between words, Backspace, text in a native field), at the
 * key. `read`: this frame's rare events; each letter's verdict plays the chosen Typing Feel set (Bamboo's is audio-min's).
 * `standIn`: the chosen set Bamboo stands in for this session, never saved; `keyboard`: what __td.keyboard() shows.
 */
export type GameQuick = QuickSettings & { typed(space: boolean, native?: boolean): void; read(events: readonly RareEvent[]): void; wake(): void; sync(): void; standIn(): string | null; keyboard(): object };
/**
 * Builds both panels at once and starts the keyboard sounds (startKeyboard): nothing here waits on the Typing Feel host.
 * A set that cannot sound, the saved one or one picked in the panel, has Bamboo stand in for it, unsaved, until the next
 * pick. The keyboard field is saved only when the catalogue repaired it or the player picked one.
 */
export function mountQuick(s: Settings, hooks: QuickHooks): GameQuick {
  const sounds = new TypingSounds();
  let standIn: string | null = null;
  /** The saved set's load at startup; a keyboard pick in the panel aborts it, which releases what it decoded. */
  const startup = new AbortController();
  const probe = { base: null as string | null, state: "loading", revision: "", defaultId: "", sets: 0, families: 0 };
  const bamboo = (): boolean => bambooKeys(s, standIn);
  const levels = (): void => {
    sounds.muted = s.muted || s.master === 0 || s.keyboard === "off";
    sounds.setVolume(sounds.muted ? 0 : s.master * s.keyboardVolume / 10000);
    hooks.audio()?.apply(s);
  };
  const setStandIn = (id: string | null, notice = false): void => {
    standIn = id;
    hooks.standIn?.(id);
    levels();
    if (notice) hooks.notice(KEYBOARD_SET_UNAVAILABLE);
  };
  const panel = new QuickSettings({
    getValues: () => quickValues(s), settingsRows: settingsRows(), keyboardSounds: sounds,
    // Off, Bamboo and the chosen set "Loading…" until the catalogue settles the list (startKeyboard below).
    soundRows: soundRows(pendingKeyboardChoices(s.keyboard, ORIGINAL_KEYS)),
    // A picked set's manifest (3 s, HTTP cache: its URL is versioned), its samples and every preview (8 s a file).
    keyboardFetch: { fetchJson: manifestJson, fetchBytes: sampleBytes },
    onKeyboardFail: (choice) => { if (choice.value === s.keyboard) setStandIn(choice.value, true); },
    icons: QUICK_ICONS,
    skin: QUICK_SKIN,
    onChange: (id, value) => {
      if (!applyQuick(s, id, value)) return;
      if (id === "keyboard") {
        // The player's own keyboard sound: it goes into the save, ends Bamboo's stand-in and stops the startup load.
        ownKeyboard(s);
        if (standIn !== null) setStandIn(null);
        startup.abort();
      }
      levels();
      saveSettings(s);
    },
    onPreview: (group) => { if (group === "keyboard" && !bamboo()) sounds.play("key"); else hooks.audio()?.preview(group); },
    onPause: () => { hooks.audio()?.resume(); sounds.resume(); }, onQuit: hooks.quit, countdownMs: hooks.countdown,
  });
  panel.root.classList.add("td-quick");
  for (const [name, url] of Object.entries(QUICK_ART_VARS)) panel.root.style.setProperty(name, `url(${JSON.stringify(url)})`);
  for (const [name, value] of Object.entries(LIST_ROW_VARS)) panel.root.style.setProperty(name, value);
  watchMute(panel.root);
  document.body.classList.add("has-quick-settings");
  levels();
  // The catalogue settles the saved choice when it comes (a host that failed keeps it), then the set loads.
  void startKeyboard(sounds, hooks.feed ?? null, hooks.saved, {
    current: () => s.keyboard,
    choose: (id, save) => {
      s.keyboard = id;
      if (save) ownKeyboard(s);
      levels();
      if (save) saveSettings(s);
    },
    catalog: (catalog, base) => {
      const sets = catalog.options.filter((choice) => choice.manifest !== undefined);
      Object.assign(probe, { base, state: catalog.state, revision: catalog.revision ?? "", defaultId: catalog.defaultId ?? "", sets: sets.length, families: new Set(sets.map((c) => c.family)).size });
    },
    list: (options) => void panel.setChoiceOptions("keyboard", options),
    unavailable: () => hooks.notice(KEYBOARD_UNAVAILABLE),
    standIn: (id, told) => setStandIn(id, !told),
    playable: (by) => hooks.playable?.(by),
  }, { signal: startup.signal });
  return Object.assign(panel, {
    typed(space: boolean, native = false): void {
      if (panel.blocking) return;
      if (bamboo()) { if (space || native) hooks.audio()?.key(space); }
      else sounds.play(space ? "space" : "key");
    },
    read(events: readonly RareEvent[]): void {
      if (panel.blocking || bamboo()) return;
      // A tier-2 pair's first letter (KEY.group) and a soft switch are right keys too.
      for (const event of events) if (event.t === "wordKey") sounds.play(letterSound(event.result));
    },
    wake(): void { sounds.resume(); },
    sync(): void { levels(); panel.refresh(); },
    standIn: (): string | null => standIn,
    keyboard: () => ({ ...probe, id: s.keyboard, saved: hooks.saved, owned: ownsKeyboard(s), standIn, profile: sounds.profile?.id ?? null, stats: { ...sounds.stats } }),
  });
}
