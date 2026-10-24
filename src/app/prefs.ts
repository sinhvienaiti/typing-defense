/**
 * The settings kept under td.settings (SPLIT_PLAN D7): master, music and effects volumes 0–100, and "Nhịp tự điều
 * theo cách bạn gõ" (BALANCE.md §4.2, on by default; a run keeps the value it started with). Read at boot; the card
 * that changes them (ui/settings.ts) loads with the title or the pause card (BUILD_1B §20: not in the start chunk).
 */
import { safeLocalStorage } from "../kit/platform/safe-storage";

export type Settings = { master: number; music: number; sfx: number; pace: boolean };
export type Volume = Exclude<keyof Settings, "pace">;

const KEY = "td.settings";
const DEFAULTS: Settings = { master: 80, music: 60, sfx: 80, pace: true };
export const SETTING_ROWS: readonly (readonly [Volume, string])[] = [["master", "Âm lượng chung"], ["music", "Nhạc"], ["sfx", "Tiếng trận và gõ"]];

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

export const saveSettings = (settings: Settings): void => {
  safeLocalStorage.writeJson(KEY, settings);
};
