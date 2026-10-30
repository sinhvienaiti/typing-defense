/**
 * The Settings gear and the Sound speaker (parent docs/games/IN_GAME_SETTINGS.md, tickets 192/193): the kit's two
 * panels over Wordwoven's real channels and settings, the Firefly keyboard sets from public/.../audio/keys and the
 * original Bamboo keys (view/audio-min.ts). No simulation state: a letter's sound follows the simulation's verdict
 * (read), so a wrong or stray key keeps the kit's damped cue on the chosen set's own files.
 */
import { loadKeyboardCatalog, TypingSounds, type KeyboardCatalog, type KeyboardSoundChoice, type TypingSoundEvent } from "../kit/feedback/typing-fx/audio";
import { QuickSettings, defaultSoundRows, QUICK_ICON_NAMES, type QuickRow, type QuickValue } from "../kit/ui/quick-settings";
import { BUILT_IN_KEYS, DEFAULT_KEYBOARD_SOUND, MODE_CHOICES, saveSettings, type Settings } from "./prefs";
import { modeName } from "../ui/settings";
import type { RareEvent } from "../sim/events";
import { KEY } from "../typing/router";
import type { TypingAudio } from "../view/audio-min";
export const KEYS_BASE = "/assets/typing-defense/audio/keys/";
export const QUICK_ART = "/assets/typing-defense/ui/quick-settings/";
export const ORIGINAL_KEYS: KeyboardSoundChoice = { value: BUILT_IN_KEYS, label: "Bamboo (original)" };
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
 * The saved set against the catalogue, settled before the kit reads it (the kit would take the first choice after Off:
 * Bamboo). A loaded catalogue without it: the owner's default (else its first set), to be saved. A catalogue that did
 * not load: the saved id stays, shown as an unavailable choice, so one failed fetch never overwrites the player's set.
 */
export function keyboardChoices(s: Settings, catalog: KeyboardCatalog): { options: readonly KeyboardSoundChoice[]; repaired: boolean } {
  const options = catalog.options;
  if (options.some((choice) => choice.value === s.keyboard)) return { options, repaired: false };
  if (catalog.state !== "ready") return { options: [...options, { value: s.keyboard, label: "Saved sound", note: "unavailable", disabled: true }], repaired: false };
  s.keyboard = (options.find((choice) => choice.value === DEFAULT_KEYBOARD_SOUND) ?? options.find((choice) => choice.manifest !== undefined) ?? ORIGINAL_KEYS).value;
  return { options, repaired: true };
}

export type QuickHooks = { audio(): TypingAudio | null; quit(): void; countdown(): number; notice(text: string): void };
/**
 * `typed`: a key the simulation does not voice (the space between words, Backspace, text in a native field), at the
 * key. `read`: this frame's rare events; each letter's verdict plays the chosen Firefly set (Bamboo's is audio-min's).
 */
export type GameQuick = QuickSettings & { typed(space: boolean, native?: boolean): void; read(events: readonly RareEvent[]): void; wake(): void; sync(): void };
export async function mountQuick(s: Settings, hooks: QuickHooks): Promise<GameQuick> {
  const sounds = new TypingSounds();
  const catalog = await loadKeyboardCatalog(KEYS_BASE, { fallback: [], extra: [ORIGINAL_KEYS] });
  if (catalog.state !== "ready") hooks.notice("Keyboard catalogue unavailable · Bamboo and Off remain available");
  const { options, repaired } = keyboardChoices(s, catalog);
  if (repaired) saveSettings(s);
  /** The saved set's load at startup; a choice in the panel aborts it, which releases what it decoded. */
  let startup: AbortController | null = null;
  const levels = (): void => {
    sounds.muted = s.muted || s.master === 0 || s.keyboard === "off";
    sounds.setVolume(sounds.muted ? 0 : s.master * s.keyboardVolume / 10000);
    hooks.audio()?.apply(s);
  };
  const panel = new QuickSettings({
    getValues: () => quickValues(s), settingsRows: settingsRows(), soundRows: soundRows(options), keyboardSounds: sounds,
    icons: Object.fromEntries(QUICK_ICON_NAMES.filter((name) => name !== "vol-voice").map((name) => [name, QUICK_ART + name + ".128.png"])),
    skin: { panel: QUICK_ART + "panel-large.v2.alpha.png", button: QUICK_ART + "button.v2.alpha.png" },
    onChange: (id, value) => {
      if (!applyQuick(s, id, value)) return;
      if (id === "keyboard") {
        startup?.abort();
        startup = null;
      }
      levels();
      saveSettings(s);
    },
    onPreview: (group) => { if (group === "keyboard" && s.keyboard !== BUILT_IN_KEYS) sounds.play("key"); else hooks.audio()?.preview(group); },
    onPause: () => { hooks.audio()?.resume(); sounds.resume(); }, onQuit: hooks.quit, countdownMs: hooks.countdown,
  });
  panel.root.classList.add("td-quick");
  document.body.classList.add("has-quick-settings");
  levels();
  const initial = options.find((choice) => choice.value === s.keyboard);
  if (initial?.manifest) {
    const abort = (startup = new AbortController());
    // Active from its first decoded batch, as the kit's picker and Dragonhold load a set: the rest decodes behind it.
    void sounds.loadKeyboardManifest(initial.manifest, initial.value, initial.label, undefined, undefined, true, abort.signal).then((result) => {
      if (abort.signal.aborted) return;
      startup = null;
      if (result.state === "pending") sounds.use("off");
      if (result.state !== "ready") hooks.notice("Keyboard samples unavailable or incomplete · choose another sound to retry");
    });
  }
  return Object.assign(panel, {
    typed(space: boolean, native = false): void {
      if (panel.blocking) return;
      if (s.keyboard === BUILT_IN_KEYS) { if (space || native) hooks.audio()?.key(space); }
      else sounds.play(space ? "space" : "key");
    },
    read(events: readonly RareEvent[]): void {
      if (panel.blocking || s.keyboard === BUILT_IN_KEYS) return;
      // A tier-2 pair's first letter (KEY.group) and a soft switch are right keys too.
      for (const event of events) if (event.t === "wordKey") sounds.play(letterSound(event.result));
    },
    wake(): void { sounds.resume(); },
    sync(): void { levels(); panel.refresh(); },
  });
}
