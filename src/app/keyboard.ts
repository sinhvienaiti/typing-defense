/**
 * Keyboard sounds from Typing Feel (parent docs/games/TYPING_FEEL_SERVICE.md §5.1–5.3): the catalogue and the sets are
 * read at run time from the build's VITE_TYPING_FEEL_ORIGIN, never copied into the game. A chunk main.ts asks for with
 * the page (requestKeyboardCatalogue), so nothing waits on the host; app/quick.ts builds the Sound panel at once and hands
 * the rest to startKeyboard. A saved set that cannot sound this session has Bamboo stand in for it, unsaved.
 */
import {
  KEYBOARD_CATALOG_TIMEOUT_MS, KEYBOARD_DECODE_BATCH_SIZE, loadKeyboardCatalog, settleKeyboardChoice, timedBytes, timedJson, typingFeelKeysBase,
  type KeyboardCatalog, type KeyboardSettlement, type KeyboardSoundChoice, type TypingSounds,
} from "../kit/feedback/typing-fx/audio";
import { BUILT_IN_KEYS, DEFAULT_KEYBOARD_SOUND } from "./prefs";

/** `<origin>/v1/keys/` from the build, or null: no origin, so Typing Feel is off (no network; Off and Bamboo only). */
export const KEYS_BASE: string | null = typingFeelKeysBase(import.meta.env.VITE_TYPING_FEEL_ORIGIN);
/** The game's own keys (view/audio-min.ts), right after Off with no family (so no heading above it). */
export const ORIGINAL_KEYS: KeyboardSoundChoice = { value: BUILT_IN_KEYS, label: "Bamboo (original)" };
/** Told once an origin is set and its catalogue did not load (§5.3); then once a set cannot sound and Bamboo stands in. */
export const KEYBOARD_UNAVAILABLE = "Keyboard sounds unavailable";
export const KEYBOARD_SET_UNAVAILABLE = "Keyboard set unavailable · Bamboo plays instead";
/** The catalogue revalidates (no-cache); a set manifest's URL is versioned, so the HTTP cache may answer it; 3 s each. */
export const catalogueJson = timedJson(KEYBOARD_CATALOG_TIMEOUT_MS);
export const manifestJson = timedJson(KEYBOARD_CATALOG_TIMEOUT_MS, { cache: "default" });
/** Samples and previews: a file not delivered in 8 s counts as missing, so a set's load always ends (§8.1). */
export const sampleBytes = timedBytes();

/** A catalogue request started with the page: its base (null: Typing Feel off) and the catalogue (never rejects). */
export type KeyboardFeed = { readonly base: string | null; readonly catalog: Promise<KeyboardCatalog> };

/** Off and Bamboo, then the sets in catalogue order with their `family`; no base: nothing is fetched ("missing"). */
export function requestKeyboardCatalogue(base: string | null = KEYS_BASE, fetchJson: (url: string) => Promise<unknown> = catalogueJson): KeyboardFeed {
  return { base, catalog: loadKeyboardCatalog(base, { extra: [ORIGINAL_KEYS], fallback: [], fetchJson }) };
}

/**
 * The kit's rule (Wordwoven's own, made common): a ready catalogue without the saved id moves it to the catalogue's
 * default, then Bright Clack, then the first set, then Bamboo, and asks for a save; one that did not load keeps it.
 */
export const settleKeyboard = (saved: string | null, catalog: KeyboardCatalog): KeyboardSettlement => settleKeyboardChoice(saved, catalog, ORIGINAL_KEYS, DEFAULT_KEYBOARD_SOUND);

/** What startKeyboard asks of the Sound panel's owner (app/quick.ts). */
export type KeyboardHost = {
  /** The keyboard id now (settings.keyboard). */
  current(): string;
  /** The catalogue settled the choice: take `id`; `save` only when it repaired the save. */
  choose(id: string, save: boolean): void;
  /** The catalogue as it came from `base` (for __td.keyboard()). */
  catalog?(catalog: KeyboardCatalog, base: string | null): void;
  /** The keyboard row takes the settled list (QuickSettings.setChoiceOptions), open or not. */
  list(options: readonly KeyboardSoundChoice[]): void;
  /** An origin is set and its catalogue did not load (404, HTML, no answer in 3 s, CORS, no usable set). */
  unavailable(): void;
  /** The saved set cannot sound this session: Bamboo plays in its place, unsaved; `told`: the page already said why, or must not. */
  standIn(id: string, told: boolean): void;
  /** Once, when the run may start: the set's first batch is in ("batch"), or its load ended without one ("ended"). */
  playable(by: "batch" | "ended"): void;
};

/**
 * Settles the saved choice (`saved`: the save's own field, prefs savedKeyboard) once the catalogue is in (no feed: asked
 * here), then loads that set without a preview, active from its first decoded batch. A choice the player made while
 * the catalogue loaded (Off or Bamboo: the pending list has nothing else) stands and is not saved again. `signal` aborts
 * on the player's pick: the startup load stops and leaves the panel's own load alone. Never rejects.
 */
export async function startKeyboard(
  sounds: TypingSounds, feed: KeyboardFeed | Promise<KeyboardFeed | null> | null, saved: string | null, host: KeyboardHost,
  options: { readonly fetchJson?: (url: string) => Promise<unknown>; readonly fetchBytes?: (url: string) => Promise<ArrayBuffer>; readonly signal?: AbortSignal } = {},
): Promise<void> {
  const { fetchJson = manifestJson, fetchBytes = sampleBytes, signal } = options;
  const pending = host.current();
  let told = false;
  const tell = (by: "batch" | "ended"): void => void (told || ((told = true), host.playable(by)));
  // The player moved on (a pick, or another id): their choice owns the player now.
  const left = (id: string): boolean => signal?.aborted === true || host.current() !== id;
  try {
    const given = (await feed) ?? requestKeyboardCatalogue();
    const catalog = await given.catalog;
    host.catalog?.(catalog, given.base);
    const settled = settleKeyboard(left(pending) ? host.current() : saved, catalog);
    host.choose(settled.id, settled.repaired);
    host.list(settled.options);
    const failed = given.base !== null && catalog.state !== "ready";
    if (failed) host.unavailable();
    const id = settled.id;
    const choice = settled.options.find((c) => c.value === id);
    if (left(id) || id === "off" || id === BUILT_IN_KEYS) return;
    if (!choice?.manifest || choice.disabled) return host.standIn(id, failed || given.base === null);
    let requested = 0;
    // The kit asks for batch n + 1 only once batch n has decoded: the first request past one batch means a batch is in.
    const counted = (url: string): Promise<ArrayBuffer> => ((requested++ === KEYBOARD_DECODE_BATCH_SIZE && tell("batch")), fetchBytes(url));
    const result = await sounds.loadKeyboardManifest(choice.manifest, id, choice.label, fetchJson, counted, true, signal).catch(() => null);
    // Picked away: a pick's abort released this load (the same set picked again is the panel's own load now).
    if (left(id)) return void (sounds.profile?.id !== id && sounds.release(id));
    // No sample (no manifest, a first batch that decoded nothing, blocked audio): Bamboo stands in.
    if (result === null || result.state === "pending") {
      sounds.use("off");
      host.standIn(id, false);
    } else tell("batch"); // A set no bigger than one batch: all of it decoded.
  } catch { /* A hook threw: the run starts without keyboard sounds. */ }
  finally { tell("ended"); }
}
