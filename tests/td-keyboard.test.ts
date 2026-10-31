import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KEYBOARD_GATE_MS, KeyboardGate } from "../src/app/keyboard-gate";
import { ORIGINAL_KEYS, requestKeyboardCatalogue, settleKeyboard, startKeyboard, type KeyboardFeed, type KeyboardHost } from "../src/app/keyboard";
import { bambooKeys, BUILT_IN_KEYS, loadSettings, ownKeyboard, ownsKeyboard, savedKeyboard, storedSettings, type Settings } from "../src/app/prefs";
import { KEYBOARD_CATALOG_TIMEOUT_MS, KEYBOARD_DECODE_BATCH_SIZE, KEYBOARD_SAMPLE_TIMEOUT_MS, TypingSounds } from "../src/kit/feedback/typing-fx/audio";
import { feelOrigin, feelPreconnect } from "../vite.config";
import { catalogue, FEEL_BASE, serve, setManifest, setPath, type Reply } from "./feel-fixture";

/**
 * Wordwoven's keyboard sounds from Typing Feel without a page (parent docs/games/TYPING_FEEL_SERVICE.md §5.1–5.3, §8.1):
 * the run's 1.5 s gate (app/keyboard-gate.ts) against a host that hangs (the catalogue, a set manifest, its samples),
 * what startKeyboard settles and asks for, and the save's keyboard field (app/prefs.ts). A sample host
 * (tests/feel-fixture.ts) behind a stubbed fetch, fake timers and a fake WebAudio: no network, no parent repo.
 */
class Gain {
  gain = { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {} };
  constructor(_ctx?: unknown, options?: { gain?: number }) { if (options?.gain !== undefined) this.gain.value = options.gain; }
  connect(target: unknown): unknown { return target; }
  disconnect(): void {}
}
class Context {
  currentTime = 0;
  state = "running";
  destination = {};
  async decodeAudioData(bytes: ArrayBuffer): Promise<{ duration: number; url: string }> { return { duration: 0.2, url: new TextDecoder().decode(bytes) }; }
  async resume(): Promise<void> {}
}

let calls: string[];
/** A fetch answer as the kit's timedJson and timedBytes read it; a sample's bytes name its URL. */
function respond(url: string, reply: Reply): Response {
  return {
    ok: reply.status >= 200 && reply.status < 300, status: reply.status, headers: new Headers(reply.type ? { "content-type": reply.type } : {}),
    text: async () => reply.text ?? "", json: async () => JSON.parse(reply.text ?? ""), arrayBuffer: async () => new TextEncoder().encode(url).buffer as ArrayBuffer,
  } as unknown as Response;
}
/** A promise that never settles: a host that took the request and never answers. */
const never = (): Promise<Response> => new Promise<Response>(() => {});
/** The sample host behind fetch; `hang` names the requests that never get an answer. */
function host(hang: (url: string) => boolean = () => false): void {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    calls.push(url);
    return hang(url) ? never() : respond(url, serve(url, catalogue()));
  }));
}
const flush = async (): Promise<void> => { for (let i = 0; i < 200; i += 1) await Promise.resolve(); };

/** The page as main.ts and app/quick.ts wire startKeyboard: the gate, the settings, and what the hooks were told. */
function page(saved: string | null) {
  const s: Settings = loadSettings({ readJson: () => (saved === null ? {} : { keyboard: saved }), writeJson: () => true });
  const gate = new KeyboardGate(KEYBOARD_GATE_MS, () => Date.now());
  const seen = { saves: 0, unavailable: 0, standIn: null as string | null, told: null as boolean | null, list: [] as string[][] };
  const hooks: KeyboardHost = {
    current: () => s.keyboard,
    choose: (id, save) => { s.keyboard = id; if (save) seen.saves += 1; },
    list: (options) => void seen.list.push(options.map((choice) => choice.value)),
    unavailable: () => void (seen.unavailable += 1),
    standIn: (id, told) => { seen.standIn = id; seen.told = told; },
    playable: (by) => gate.open(by),
  };
  const sounds = new TypingSounds({ context: new Context() as unknown as AudioContext });
  return { s, gate, seen, hooks, sounds };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  calls = [];
  vi.stubGlobal("GainNode", Gain);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the run's keyboard gate (app/keyboard-gate.ts)", () => {
  it("opens 1.5 s after the page started when nothing opened it, once, and leaves no timer", async () => {
    const gate = new KeyboardGate(KEYBOARD_GATE_MS, () => Date.now());
    await vi.advanceTimersByTimeAsync(KEYBOARD_GATE_MS - 1);
    expect(gate.isOpen).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect([gate.isOpen, gate.openedAt, gate.by]).toEqual([true, KEYBOARD_GATE_MS, "time"]);
    gate.open("batch");
    expect([gate.openedAt, gate.by, vi.getTimerCount()]).toEqual([KEYBOARD_GATE_MS, "time", 0]);
  });

  it("opens at once when the set says so, keeps why, and its timer is cleared", async () => {
    const gate = new KeyboardGate(KEYBOARD_GATE_MS, () => Date.now());
    await vi.advanceTimersByTimeAsync(40);
    gate.open("ended");
    expect([gate.isOpen, gate.openedAt, gate.by, vi.getTimerCount()]).toEqual([true, 40, "ended", 0]);
  });
});

describe("a Typing Feel host that hangs (§5.3 row 2, §8.1): the run starts within 1.5 s, the save keeps its set", () => {
  it("the catalogue never answers: the gate opens at 1.5 s; at 3 s the catalogue is given up, told once, the saved set stays (unavailable) and Bamboo stands in", async () => {
    host((url) => url === FEEL_BASE + "keys-manifest.json");
    const p = page("hail-stone");
    const done = startKeyboard(p.sounds, requestKeyboardCatalogue(FEEL_BASE), "hail-stone", p.hooks);
    await vi.advanceTimersByTimeAsync(KEYBOARD_GATE_MS);
    expect([p.gate.isOpen, p.gate.openedAt, p.gate.by]).toEqual([true, KEYBOARD_GATE_MS, "time"]);
    expect(p.seen.unavailable).toBe(0);
    await vi.advanceTimersByTimeAsync(KEYBOARD_CATALOG_TIMEOUT_MS - KEYBOARD_GATE_MS);
    await done;
    expect(p.seen).toMatchObject({ unavailable: 1, saves: 0, standIn: "hail-stone", told: true });
    expect(p.seen.list).toEqual([["off", BUILT_IN_KEYS, "hail-stone"]]);
    expect([p.s.keyboard, calls, vi.getTimerCount()]).toEqual(["hail-stone", [FEEL_BASE + "keys-manifest.json"], 0]);
  });

  it("a set's samples never answer: the gate opens at 1.5 s; after one 8 s sample timeout the first batch (16 files) is all that was asked, and Bamboo stands in", async () => {
    host((url) => /\/(key|space)-\d+\.ogg$/.test(url));
    const p = page("hail-stone");
    const done = startKeyboard(p.sounds, requestKeyboardCatalogue(FEEL_BASE), "hail-stone", p.hooks);
    await vi.advanceTimersByTimeAsync(KEYBOARD_GATE_MS);
    expect([p.gate.isOpen, p.gate.by, p.seen.standIn]).toEqual([true, "time", null]);
    await vi.advanceTimersByTimeAsync(KEYBOARD_SAMPLE_TIMEOUT_MS);
    await done;
    const samples = calls.filter((url) => url.endsWith(".ogg"));
    expect([samples.length, p.seen.standIn, p.seen.told, p.seen.unavailable, p.seen.saves]).toEqual([KEYBOARD_DECODE_BATCH_SIZE, "hail-stone", false, 0, 0]);
    expect([p.s.keyboard, p.sounds.profile, vi.getTimerCount()]).toEqual(["hail-stone", null, 0]);
  });

  it("a set's manifest never answers: given up after 3 s, no sample is asked for, Bamboo stands in", async () => {
    host((url) => url.startsWith(FEEL_BASE + "sets/") && url.endsWith("/keys-manifest.json"));
    const p = page("hail-stone");
    const done = startKeyboard(p.sounds, requestKeyboardCatalogue(FEEL_BASE), "hail-stone", p.hooks);
    await vi.advanceTimersByTimeAsync(KEYBOARD_GATE_MS);
    expect([p.gate.isOpen, p.gate.by]).toEqual([true, "time"]);
    await vi.advanceTimersByTimeAsync(KEYBOARD_CATALOG_TIMEOUT_MS);
    await done;
    expect([calls.filter((url) => url.endsWith(".ogg")), p.seen.standIn, vi.getTimerCount()]).toEqual([[], "hail-stone", 0]);
  });

  it("a host that answers: the gate opens on the set's first decoded batch, well before 1.5 s", async () => {
    host();
    const p = page("hail-stone");
    const done = startKeyboard(p.sounds, requestKeyboardCatalogue(FEEL_BASE), "hail-stone", p.hooks);
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    expect([p.gate.isOpen, p.gate.by, p.gate.openedAt]).toEqual([true, "batch", 0]);
    await vi.runAllTimersAsync();
    await done;
    expect([p.sounds.profile?.id, p.seen.standIn, p.seen.unavailable]).toEqual(["hail-stone", null, 0]);
  });

  it("no origin: nothing is fetched, nothing is told, the gate opens at once, and Bamboo stands in for the saved set", async () => {
    host();
    const p = page("hail-stone");
    await startKeyboard(p.sounds, requestKeyboardCatalogue(null), "hail-stone", p.hooks);
    expect([calls, p.gate.by, p.seen.unavailable, p.seen.standIn, p.seen.told, p.seen.saves, vi.getTimerCount()]).toEqual([[], "ended", 0, "hail-stone", true, 0, 0]);
  });

  it("a set no bigger than one batch: the gate opens by \"batch\" once all of it decoded", async () => {
    const small = FEEL_BASE + setPath("hail-stone") + "keys-manifest.json";
    const manifest = setManifest("hail-stone") as { files: unknown[] };
    const text = JSON.stringify({ ...manifest, files: [...manifest.files.slice(0, 8), ...manifest.files.slice(-2)] });
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(url);
      return respond(url, url === small ? { status: 200, type: "application/json", text } : serve(url, catalogue()));
    }));
    const p = page("hail-stone");
    await startKeyboard(p.sounds, requestKeyboardCatalogue(FEEL_BASE), "hail-stone", p.hooks);
    expect([p.gate.by, calls.filter((url) => url.endsWith(".ogg")).length, p.sounds.profile?.id, p.seen.standIn]).toEqual(["batch", 10, "hail-stone", null]);
  });

  it("a host that is down: the gate opens at once and says the load ended without a set (not \"batch\", not by time)", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => { calls.push(url); throw new TypeError("Failed to fetch"); }));
    const p = page("hail-stone");
    await startKeyboard(p.sounds, requestKeyboardCatalogue(FEEL_BASE), "hail-stone", p.hooks);
    expect([p.gate.isOpen, p.gate.by, p.gate.openedAt, p.seen.unavailable, p.seen.standIn, vi.getTimerCount()]).toEqual([true, "ended", 0, 1, "hail-stone", 0]);
  });

  it("main.ts's feed given up (its chunk did not load): the catalogue is asked here instead", async () => {
    host();
    const p = page(null);
    const feed: Promise<KeyboardFeed | null> = Promise.resolve(null);
    await startKeyboard(p.sounds, feed, null, p.hooks);
    // The game's own base is null in tests (no VITE_TYPING_FEEL_ORIGIN): Bamboo, nothing fetched.
    expect([calls, p.s.keyboard, p.seen.saves, p.gate.by]).toEqual([[], BUILT_IN_KEYS, 0, "ended"]);
  });
});

describe("the save's keyboard field (app/prefs.ts, §4.5)", () => {
  const memory = (stored: unknown) => ({ readJson: () => stored, writeJson: () => true });

  it("savedKeyboard reads the raw field before the hard default fills it in; anything but a string is none", () => {
    expect(savedKeyboard(memory({ keyboard: "hail-stone" }))).toBe("hail-stone");
    expect(savedKeyboard(memory({ keyboard: "Bad Id!" }))).toBe("Bad Id!");
    for (const stored of [null, {}, { keyboard: 3 }, "text", 7]) expect(savedKeyboard(memory(stored))).toBeNull();
    expect(loadSettings(memory({})).keyboard).toBe("bright-clack");
  });

  it("the keyboard field is written only once the save owns one: it had one, or ownKeyboard (a repair or the player's pick)", () => {
    const fresh = loadSettings(memory({ master: 40 }));
    expect(ownsKeyboard(fresh)).toBe(false);
    expect(storedSettings(fresh)).not.toHaveProperty("keyboard");
    expect(storedSettings(fresh)).toMatchObject({ master: 40, keyboardVolume: 100 });
    ownKeyboard(fresh);
    expect(storedSettings(fresh)).toBe(fresh);
    const had = loadSettings(memory({ keyboard: "off" }));
    expect([ownsKeyboard(had), (storedSettings(had) as Settings).keyboard]).toEqual([true, "off"]);
    // An invalid id is a field too: the catalogue repairs it, and that repair is saved.
    expect(ownsKeyboard(loadSettings(memory({ keyboard: "Bad Id!" })))).toBe(true);
  });

  it("bambooKeys: Bamboo plays when chosen, or while it stands in for the chosen set (never for Off)", () => {
    expect(bambooKeys({ keyboard: BUILT_IN_KEYS }, null)).toBe(true);
    expect(bambooKeys({ keyboard: "hail-stone" }, null)).toBe(false);
    expect(bambooKeys({ keyboard: "hail-stone" }, "hail-stone")).toBe(true);
    expect(bambooKeys({ keyboard: "deep" }, "hail-stone")).toBe(false);
    expect(bambooKeys({ keyboard: "off" }, "off")).toBe(false);
  });

  it("settleKeyboard: Bamboo is the game's own sound and Bright Clack the fallback default when the catalogue names none", () => {
    const missing = { options: [{ value: "off", label: "Off" }, ORIGINAL_KEYS], state: "missing" as const };
    expect(settleKeyboard(null, missing)).toEqual({ id: BUILT_IN_KEYS, options: missing.options, repaired: false });
    const ready = { options: [{ value: "off", label: "Off" }, ORIGINAL_KEYS, { value: "deep", label: "Deep", manifest: "m" }, { value: "bright-clack", label: "Bright Clack", manifest: "m" }], state: "ready" as const };
    expect(settleKeyboard("retired", ready)).toMatchObject({ id: "bright-clack", repaired: true });
  });
});

describe("the preconnect tag (vite.config.ts)", () => {
  it("only a build with a usable origin gets one, reduced to the origin", () => {
    expect(feelOrigin(undefined)).toBeNull();
    expect(feelOrigin("")).toBeNull();
    expect(feelOrigin("ftp://feel.test")).toBeNull();
    expect(feelOrigin("https://user:pw@feel.test")).toBeNull();
    expect(feelOrigin("https://feel.test/?x=1")).toBeNull();
    expect(feelOrigin(" https://feel.typing-game.local/ ")).toBe("https://feel.typing-game.local");
    const tags = (origin: string | null) => (feelPreconnect(origin).transformIndexHtml as () => unknown)();
    expect(tags(null)).toEqual([]);
    expect(tags("https://feel.typing-game.local")).toEqual([{ tag: "link", attrs: { rel: "preconnect", href: "https://feel.typing-game.local", crossorigin: true }, injectTo: "head" }]);
  });
});
