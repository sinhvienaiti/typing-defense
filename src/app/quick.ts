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
import { QuickSettings, defaultSoundRows, type QuickContext, type QuickIcons, type QuickRow, type QuickSkin, type QuickValue } from "../kit/ui/quick-settings";
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
 * Frame, button (115/160) and slider art (225 knob, 244 groove pair). At 1080p the groove is drawn about 15 CSS px tall
 * and the knob box 42 px: the 1024 x 64 groove and the 128 px knob.
 * - The fill layer: the 244 pair (accepted 31/10), the dark unpolished stone groove right of the knob and the bright
 *   polished jade fill left of it, drawn as painted (no filter). The two match each other (IoU 0.9996); both sit 8 px in
 *   from the old 225 groove's ends, so quick.css cuts both 0 72 (groove and fill variables). The 225 track stays as
 *   `sliderTrack` (the kit's fallback only).
 * - Keyboard sound rows are 160 button plates, the chosen row the 160 button-active plate (`buttonActive`, also the
 *   pressed and chosen buttons). The 245 list-row art drops in here.
 */
export const QUICK_SKIN: QuickSkin = {
  panel: QUICK_ART + "panel-large.v2.alpha.png",
  button: QUICK_ART + "button.v2.alpha.png",
  buttonActive: QUICK_ART + "button-active.v2.alpha.png",
  sliderTrack: QUICK_ART + "slider-track.png",
  sliderThumb: QUICK_ART + "slider-thumb.128.png",
  sliderEmpty: QUICK_ART + "slider-empty.png",
  sliderFill: QUICK_ART + "slider-fill.png",
  listRow: { slice: PLATE_SLICE, edge: ROW_EDGE },
};
/**
 * Icon files by kit name, all 128 px (no Voice row, so no vol-voice). Ticket 180 drew the set; ticket 244 (accepted
 * 31/10) redrew three as r2 (the jade key with sound waves, the cursor on a jade seal, a solid gold gear on a jade
 * plate for the corner Settings button) and added Keyboard volume's own icon (a key and level bars).
 */
export const QUICK_ICON_FILES = {
  "hud-settings": "hud-settings.r2.128.png",
  "hud-sound": "hud-sound.128.png",
  "hud-sound-muted": "hud-sound-muted.128.png",
  "vol-master": "vol-master.128.png",
  "vol-music": "vol-music.128.png",
  "vol-effects": "vol-effects.128.png",
  "vol-keyboard": "vol-keyboard.r2.128.png",
  "vol-keyboard-volume": "vol-keyboard-volume.128.png",
  "vol-interface": "vol-interface.r2.128.png",
} as const satisfies QuickIcons;
export const QUICK_ICONS: QuickIcons = Object.fromEntries(Object.entries(QUICK_ICON_FILES).map(([name, file]) => [name, QUICK_ART + file]));
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
/**
 * The resume 3-2-1's medallion (judges 31/10: the digit was plain text, barely seen on the field): the game's crest, the
 * results card's (ui/art.ts), behind the gold number; quick.css draws it through --td-qs-medallion.
 */
export const QUICK_COUNT_ART = "/assets/typing-defense/ui/crest.256.webp";
/**
 * The muted Master row is the kit's since parent fc7f4a11 (toggle.pressedLabel "Unmute", mutedIcon hud-sound-muted,
 * kit-qs__row--muted): it replaced this game's own watcher and its CSS.
 */
/** An on/off setting as two chips, so its state reads at a glance (judges 31/10: one "On" plate was ambiguous). */
const ON_OFF = [{ value: "on", label: "On" }, { value: "off", label: "Off" }] as const;
const onOff = (id: string, label: string, on: boolean, icon?: string): QuickRow => ({ kind: "choice", id, label, ...(icon ? { icon } : {}), options: ON_OFF, default: on ? "on" : "off" });
/** The switches the Settings panel shows as chips, by row id: the Settings field each one sets. */
export const SWITCHES = { motion: "motion", meaning: "meaning", ipa: "ipa", pace: "pace" } as const;
/**
 * Settings (IN_GAME_SETTINGS §3): Graphics has reduced motion only (the Quality row comes with the 3D view at C13,
 * BUILD_1C_MAP1 §2: no unfinished 3D in players' hands); Learning the meaning and the IPA (cards and the word strip);
 * no typing-effect rows (Wordwoven draws its own C10 key stamps, not the kit's letter styles). Row icons by the kit's
 * names wait for their art (an empty cell keeps the column).
 */
export const settingsRows = (): QuickRow[] => [
  { kind: "heading", id: "graphicsHeading", label: "Graphics" },
  onOff("motion", "Reduced motion", false, "gfx-motion"),
  { kind: "heading", id: "learningHeading", label: "Learning" },
  onOff("meaning", "Show Vietnamese meaning", true, "learn-meaning"),
  onOff("ipa", "Show pronunciation", true, "learn-ipa"),
  { kind: "heading", id: "gameHeading", label: "Game · new runs" },
  onOff("pace", "Pace adapts to your typing", true),
  { kind: "choice", id: "mode", label: "Story mode", options: MODE_CHOICES.map((mode) => ({ value: mode ?? "profile", label: modeName(mode) })), default: "profile" },
  { kind: "button", id: "resume", label: "Resume", action: "resume", primary: true },
  { kind: "button", id: "quit", label: "Quit to title", action: "quit" },
];
export const soundRows = (choices: readonly KeyboardSoundChoice[]): QuickRow[] => defaultSoundRows({ keyboardProfiles: choices }).filter((row) => row.id !== "voice");
/** `reducedMotion` is the kit's own switch (it stills the 3-2-1); the row that sets it is `motion`. */
export const quickValues = (s: Settings): Record<string, QuickValue> => ({
  master: s.master, muted: s.muted, music: s.music, effects: s.sfx, ui: s.ui, keyboard: s.keyboard, keyboardVolume: s.keyboardVolume, mode: s.mode ?? "profile",
  ...Object.fromEntries(Object.entries(SWITCHES).map(([id, key]) => [id, s[key] ? "on" : "off"])), reducedMotion: s.motion,
});
export function applyQuick(s: Settings, id: string, value: QuickValue): boolean {
  if (id === "keyboard" && typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,31}$/.test(value)) s.keyboard = value;
  else if (id === "mode" && (value === "profile" || MODE_CHOICES.includes(value as Settings["mode"]))) s.mode = value === "profile" ? null : value as Settings["mode"];
  else if (Object.hasOwn(SWITCHES, id) && (value === "on" || value === "off" || typeof value === "boolean")) s[SWITCHES[id as keyof typeof SWITCHES]] = value === "on" || value === true;
  else if (id === "muted" && typeof value === "boolean") s.muted = value;
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
  /** "title" while the title is up (no Resume, no Quit to title); unset: always play. */
  context?(): QuickContext;
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
  /** The sound levels, and reduced motion on the page (`td-still`: td.css, feel.css and the 2D boss layer read it). */
  const levels = (): void => {
    sounds.muted = s.muted || s.master === 0 || s.keyboard === "off";
    sounds.setVolume(sounds.muted ? 0 : s.master * s.keyboardVolume / 10000);
    hooks.audio()?.apply(s);
    document.documentElement.classList.toggle("td-still", s.motion);
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
      // The kit's own reducedMotion (its 3-2-1) follows the motion row.
      if (id === "motion") panel.refresh();
    },
    onPreview: (group) => { if (group === "keyboard" && !bamboo()) sounds.play("key"); else hooks.audio()?.preview(group); },
    onPause: () => { hooks.audio()?.resume(); sounds.resume(); }, onQuit: hooks.quit, countdownMs: hooks.countdown,
    context: () => hooks.context?.() ?? "play",
  });
  panel.root.classList.add("td-quick");
  panel.root.style.setProperty("--td-qs-medallion", `url(${JSON.stringify(QUICK_COUNT_ART)})`);
  for (const [name, value] of Object.entries(LIST_ROW_VARS)) panel.root.style.setProperty(name, value);
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
