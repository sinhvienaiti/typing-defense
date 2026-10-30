/** Wordwoven's real channels and settings on the shared overlay; no simulation state. */
import { loadKeyboardCatalog, TypingSounds, type KeyboardSoundChoice } from "../kit/feedback/typing-fx/audio";
import { QuickSettings, defaultSoundRows, QUICK_ICON_NAMES, type QuickRow, type QuickValue } from "../kit/ui/quick-settings";
import { BUILT_IN_KEYS, MODE_CHOICES, saveSettings, type Settings } from "./prefs";
import { modeName } from "../ui/settings";
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
export type QuickHooks = { audio(): TypingAudio | null; quit(): void; countdown(): number; notice(text: string): void };
export type GameQuick = QuickSettings & { typed(space: boolean, native?: boolean): void; wake(): void; sync(): void };
export async function mountQuick(s: Settings, hooks: QuickHooks): Promise<GameQuick> {
  const sounds = new TypingSounds();
  const catalog = await loadKeyboardCatalog(KEYS_BASE, { fallback: [], extra: [ORIGINAL_KEYS] });
  if (catalog.state !== "ready") hooks.notice("Keyboard catalogue unavailable · Bamboo and Off remain available");
  const levels = (): void => {
    sounds.muted = s.muted || s.master === 0 || s.keyboard === "off";
    sounds.setVolume(sounds.muted ? 0 : s.master * s.keyboardVolume / 10000);
    hooks.audio()?.apply(s);
  };
  const panel = new QuickSettings({
    getValues: () => quickValues(s), settingsRows: settingsRows(), soundRows: soundRows(catalog.options), keyboardSounds: sounds,
    icons: Object.fromEntries(QUICK_ICON_NAMES.filter((name) => name !== "vol-voice").map((name) => [name, QUICK_ART + name + ".128.png"])),
    skin: { panel: QUICK_ART + "panel-large.v2.alpha.png", button: QUICK_ART + "button.v2.alpha.png" },
    onChange: (id, value) => { if (applyQuick(s, id, value)) { levels(); saveSettings(s); } },
    onPreview: (group) => { if (group === "keyboard" && s.keyboard !== BUILT_IN_KEYS) sounds.play("key"); else hooks.audio()?.preview(group); },
    onPause: () => { hooks.audio()?.resume(); sounds.resume(); }, onQuit: hooks.quit, countdownMs: hooks.countdown,
  });
  panel.root.classList.add("td-quick");
  document.body.classList.add("has-quick-settings");
  levels();
  const initial = catalog.options.find((choice) => choice.value === s.keyboard);
  if (initial?.manifest) void sounds.loadKeyboardManifest(initial.manifest, initial.value, initial.label).then((result) => {
    if (s.keyboard === initial.value) sounds.use(result.state === "pending" ? "off" : initial.value);
    if (result.state !== "ready") hooks.notice("Keyboard samples unavailable or incomplete · choose another sound to retry");
  });
  return Object.assign(panel, {
    typed(space: boolean, native = false): void {
      if (panel.blocking) return;
      if (s.keyboard === BUILT_IN_KEYS) { if (space || native) hooks.audio()?.key(space); }
      else sounds.play(space ? "space" : "key");
    },
    wake(): void { sounds.resume(); },
    sync(): void { levels(); panel.refresh(); },
  });
}
