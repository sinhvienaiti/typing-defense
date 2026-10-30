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
import { QuickSettings, defaultSoundRows, QUICK_ICON_NAMES, type QuickRow, type QuickValue } from "../kit/ui/quick-settings";
import { bambooKeys, MODE_CHOICES, ownKeyboard, ownsKeyboard, saveSettings, type Settings } from "./prefs";
import { KEYBOARD_SET_UNAVAILABLE, KEYBOARD_UNAVAILABLE, manifestJson, ORIGINAL_KEYS, sampleBytes, startKeyboard, type KeyboardFeed } from "./keyboard";
import { modeName } from "../ui/settings";
import type { RareEvent } from "../sim/events";
import { KEY } from "../typing/router";
import type { TypingAudio } from "../view/audio-min";
export const QUICK_ART = "/assets/typing-defense/ui/quick-settings/";
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
    icons: Object.fromEntries(QUICK_ICON_NAMES.filter((name) => name !== "vol-voice").map((name) => [name, QUICK_ART + name + ".128.png"])),
    skin: { panel: QUICK_ART + "panel-large.v2.alpha.png", button: QUICK_ART + "button.v2.alpha.png" },
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
