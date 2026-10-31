/**
 * The settings kept under td.settings (SPLIT_PLAN D7): master, music and effects volumes 0–100, "Nhịp tự điều
 * theo cách bạn gõ" (BALANCE.md §4.2, on by default; a run keeps the value it started with) and the story's mode (BUILD_1B
 * §14, R3; null: by the profile). Read at boot; the card that changes them (ui/settings.ts) loads with the title or the
 * pause card (BUILD_1B §20: not in the start chunk). The stars of each stage won are kept under td.campaign (§4.3, R3).
 * Tickets 192/193 add mute, the interface volume, the keyboard sound (a Typing Feel set's id, "bamboo" or "off") and its
 * volume, changed in the Settings and Sound panels (app/quick.ts). The keyboard sound is written only once the save owns
 * one (parent docs/games/TYPING_FEEL_SERVICE.md §4.5): until then the page follows the Typing Feel catalogue's default.
 * The Settings panel adds reduced motion (`motion`, on top of the system's setting) and the learning switches: the
 * Vietnamese meaning (`meaning`) and the IPA (`ipa`), both on by default (parent IN_GAME_SETTINGS.md §3).
 */
import { safeLocalStorage } from "../kit/platform/safe-storage";
import { STARS } from "../content/rules";
import type { Mode } from "../content/types";

export type Settings = { master: number; music: number; sfx: number; pace: boolean; mode: Mode | null; muted: boolean; ui: number; keyboard: string; keyboardVolume: number; motion: boolean; meaning: boolean; ipa: boolean };
export type Volume = "master" | "music" | "sfx";
type Storage = Pick<typeof safeLocalStorage, "readJson" | "writeJson">;

const KEY = "td.settings";
/** Owner's ticket-189 choice, 2026-10-30: the hard default until the Typing Feel catalogue's `default` settles it (app/keyboard.ts). */
export const DEFAULT_KEYBOARD_SOUND = "bright-clack";
export const BUILT_IN_KEYS = "bamboo";
const DEFAULTS: Settings = { master: 80, music: 60, sfx: 80, pace: true, mode: null, muted: false, ui: 80, keyboard: DEFAULT_KEYBOARD_SOUND, keyboardVolume: 100, motion: false, meaning: true, ipa: true };
export const SETTING_ROWS: readonly (readonly [Volume, string])[] = [["master", "Master volume"], ["music", "Music"], ["sfx", "Effects"]];
/** The modes the settings card steps through, null ("theo hồ sơ") first. */
export const MODE_CHOICES: readonly (Mode | null)[] = [null, "relax", "balanced", "challenge", "learn"];

export function loadSettings(storage: Storage = safeLocalStorage): Settings {
  const stored = storage.readJson(KEY) as Partial<Record<keyof Settings, unknown>> | null;
  const settings = { ...DEFAULTS };
  for (const [key] of SETTING_ROWS) {
    const value = stored?.[key];
    if (typeof value === "number" && value >= 0 && value <= 100) settings[key] = Math.round(value);
  }
  settings.pace = stored?.pace !== false;
  settings.mode = MODE_CHOICES.find((mode) => mode !== null && mode === stored?.mode) ?? null;
  for (const key of ["ui", "keyboardVolume"] as const) {
    const value = stored?.[key];
    if (typeof value === "number" && Number.isFinite(value)) settings[key] = Math.round(Math.max(0, Math.min(100, value)));
  }
  settings.ui = typeof stored?.ui === "number" ? settings.ui : settings.sfx;
  settings.muted = stored?.muted === true;
  for (const key of ["motion", "meaning", "ipa"] as const) {
    const value = stored?.[key];
    if (typeof value === "boolean") settings[key] = value;
  }
  if (typeof stored?.keyboard === "string" && /^[a-z0-9][a-z0-9-]{0,31}$/.test(stored.keyboard)) settings.keyboard = stored.keyboard;
  if (typeof stored?.keyboard === "string") keyboardOwned.add(settings);
  return settings;
}

/** The save's own keyboard field, read before the hard default fills it in (TYPING_FEEL_SERVICE.md §5.1 step 4); null: none. */
export function savedKeyboard(storage: Storage = safeLocalStorage): string | null {
  const stored = storage.readJson(KEY) as { keyboard?: unknown } | null;
  return stored !== null && typeof stored === "object" && typeof stored.keyboard === "string" ? stored.keyboard : null;
}

/** Settings whose save holds a keyboard sound (it had one, the catalogue repaired it, or the player picked one): only these write it (§4.5). */
const keyboardOwned = new WeakSet<Settings>();
export const ownKeyboard = (s: Settings): void => void keyboardOwned.add(s);
export const ownsKeyboard = (s: Settings): boolean => keyboardOwned.has(s);
/** The save without the keyboard sound until it owns one: it follows the catalogue's default, not what played meanwhile. */
export function storedSettings(s: Settings): Settings | Omit<Settings, "keyboard"> {
  const { keyboard: _unowned, ...rest } = s;
  return keyboardOwned.has(s) ? s : rest;
}

export const saveSettings = (settings: Settings): void => {
  safeLocalStorage.writeJson(KEY, storedSettings(settings));
};

/** Bamboo (view/audio-min.ts) plays when chosen, or stands in for the chosen set that cannot sound this session (`standIn`, never saved). */
export const bambooKeys = (s: Pick<Settings, "keyboard">, standIn: string | null): boolean => s.keyboard === BUILT_IN_KEYS || (standIn !== null && standIn !== "off" && s.keyboard === standIn);

/** The story's mode (§14, R3): the one set, else by the profile: a child plays Thư giãn, anyone else Cân bằng (BALANCE §3). */
export const storyMode = (settings: Pick<Settings, "mode">, child: boolean): Mode => settings.mode ?? (child ? "relax" : "balanced");

/** Stars for the lives left (TK 20.2): 18–20 three, 6–17 two, 1–5 one. */
export const starsFor = (lives: number): number => STARS.filter((least) => lives >= least).length;

const CAMPAIGN = "td.campaign";
/** The best stars of each stage won: { v: 1, best: { "w1-silverfall": 0–3 } }; anything else reads as none. */
export function bestStars(storage: Storage = safeLocalStorage): Record<string, number> {
  const stored = storage.readJson(CAMPAIGN) as { v?: unknown; best?: Record<string, unknown> } | null;
  const best: Record<string, number> = {};
  if (stored?.v !== 1 || stored.best === null || typeof stored.best !== "object") return best;
  for (const [stage, stars] of Object.entries(stored.best)) if (typeof stars === "number" && stars >= 0 && stars <= 3) best[stage] = Math.floor(stars);
  return best;
}

/** A stage won with `lives` left (a replayed day's win too): its stars kept when they beat the best; the best now, and whether it is new. */
export function keepStars(stage: string, lives: number, storage: Storage = safeLocalStorage): { stars: number; best: number; record: boolean } {
  const best = bestStars(storage);
  const stars = starsFor(lives);
  const record = stars > (best[stage] ?? 0);
  if (record) storage.writeJson(CAMPAIGN, { v: 1, best: { ...best, [stage]: stars } });
  return { stars, best: Math.max(stars, best[stage] ?? 0), record };
}
