/** Settings in td.settings; story stars in td.campaign. */
import { safeLocalStorage } from "../kit/platform/safe-storage";
import { STARS } from "../content/rules";
import type { Mode } from "../content/types";

export type Settings = { master: number; music: number; sfx: number; pace: boolean; mode: Mode | null; muted: boolean; ui: number; keyboard: string; keyboardVolume: number };
export type Volume = "master" | "music" | "sfx";
type Storage = Pick<typeof safeLocalStorage, "readJson" | "writeJson">;

const KEY = "td.settings";
/** Owner's ticket-189 choice, 2026-10-30. */
export const DEFAULT_KEYBOARD_SOUND = "bright-clack";
export const BUILT_IN_KEYS = "bamboo";
const DEFAULTS: Settings = { master: 80, music: 60, sfx: 80, pace: true, mode: null, muted: false, ui: 80, keyboard: DEFAULT_KEYBOARD_SOUND, keyboardVolume: 100 };
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
  if (typeof stored?.keyboard === "string" && /^[a-z0-9][a-z0-9-]{0,31}$/.test(stored.keyboard)) settings.keyboard = stored.keyboard;
  return settings;
}

export const saveSettings = (settings: Settings): void => {
  safeLocalStorage.writeJson(KEY, settings);
};

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
