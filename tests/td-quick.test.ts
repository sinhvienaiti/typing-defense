// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { installKeys } from "../src/app/input";
import { BUILT_IN_KEYS, DEFAULT_KEYBOARD_SOUND, loadSettings, type Settings } from "../src/app/prefs";
import { applyQuick, KEYS_BASE, mountQuick, ORIGINAL_KEYS, quickValues, settingsRows, soundRows, type GameQuick } from "../src/app/quick";
import { Session } from "../src/app/session";
import { KEYBOARD_DECODE_BATCH_SIZE, keyboardFiles, loadKeyboardCatalog, TYPING_SOUND_MAP, TYPING_SOUND_SET } from "../src/kit/feedback/typing-fx/audio";
import { hashHex } from "../src/sim/hash";
import type { TypingAudio } from "../src/view/audio-min";
import { callWord, smallDeck, wordOf } from "./td/typing";

/**
 * The Settings gear and Sound speaker in Wordwoven (parent docs/games/IN_GAME_SETTINGS.md, tickets 192/193) through
 * the kit's real panels: applyQuick and the saved values, F1/F2/Esc and the corner buttons, letters held back and the
 * session frozen (hash, tick, log) while a panel or its 3-2-1 is up, the keys routed as src/main.ts routes them, the
 * saved Firefly set active from its first decoded batch (and released when the player picks another first), an
 * unknown saved set repaired to the owner's default, and wrong or stray letters keeping the kit's damped cue.
 * Happy DOM and a fake WebAudio; the catalogue JSON is the game's own, the samples are fake bytes naming their URL.
 */
class Param {
  value = 1;
  setValueAtTime(value: number): void { this.value = value; }
  setTargetAtTime(value: number): void { this.value = value; }
  linearRampToValueAtTime(value: number): void { this.value = value; }
  cancelScheduledValues(): void {}
}
class TestGain {
  gain = new Param();
  target: unknown = null;
  constructor(_ctx?: unknown, options?: { gain?: number }) { if (options?.gain !== undefined) this.gain.value = options.gain; }
  connect(target: unknown): unknown { this.target = target; return target; }
  disconnect(): void {}
}
/** One played sample: its URL (the fake bytes) and the level its voice was set to when it started. */
class TestSource {
  buffer: { url: string } | null = null;
  target: unknown = null;
  onended: (() => void) | null = null;
  level = -1;
  constructor(ctx: TestContext, options?: { buffer: { url: string } }) {
    if (options) this.buffer = options.buffer;
    ctx.sources.push(this);
  }
  connect(target: unknown): void { this.target = target; }
  disconnect(): void {}
  /** When the kit cut it (a stolen voice), else null: a sample that rang to its end. */
  stopped: number | null = null;
  start(): void { this.level = (this.target as TestGain | null)?.gain.value ?? -1; }
  stop(when = 0): void { this.stopped = when; }
}
class TestContext {
  currentTime = 0;
  state = "running";
  destination = {};
  sources: TestSource[] = [];
  decoded: string[] = [];
  constructor() { contexts.push(this); }
  async decodeAudioData(bytes: ArrayBuffer): Promise<{ duration: number; url: string }> {
    const url = new TextDecoder().decode(bytes);
    this.decoded.push(url);
    return { duration: lengths.get(url) ?? 0.2, url };
  }
  async resume(): Promise<void> { this.state = "running"; }
  createGain(): TestGain { return new TestGain(); }
  createBufferSource(): TestSource { return new TestSource(this); }
}
const contexts: TestContext[] = [];

const CATALOGUE = KEYS_BASE + "keys-manifest.json";
type Profile = { id: string; name: string; family: string; score: number | null; ownerPick?: boolean; manifest: string; preview: string; order: number };
const catalogue = JSON.parse(readFileSync(new URL("../public" + CATALOGUE, import.meta.url), "utf8")) as { profiles: Profile[] };
type SetManifest = { schema?: string; id?: string; preview?: string; files?: { file: string; set: string; durationMs?: number }[] };
const setManifest = (p: Profile): SetManifest => JSON.parse(readFileSync(new URL("../public" + KEYS_BASE + p.manifest, import.meta.url), "utf8")) as SetManifest;
/** A fake sample lasts what its set's manifest says (`durationMs`, schema /2: Raindrop Tile's natural tails), else 0.2 s. */
const lengths = new Map<string, number>();
for (const p of catalogue.profiles) for (const f of setManifest(p).files ?? []) if (typeof f.durationMs === "number") lengths.set(KEYS_BASE + p.manifest.slice(0, p.manifest.lastIndexOf("/") + 1) + f.file, f.durationMs / 1000);
/** A Firefly set other than the default, from the game's own catalogue (the list may change; the default stays). */
const OTHER = catalogue.profiles.map((p) => p.id).find((id) => id !== DEFAULT_KEYBOARD_SOUND)!;
const net = { catalogueDown: false, holdAfter: Infinity, holdSet: DEFAULT_KEYBOARD_SOUND, served: new Map<string, number>(), held: [] as (() => void)[] };
const fetchStub = vi.fn(async (url: string) => {
  if (url === CATALOGUE && net.catalogueDown) return { ok: false, status: 503, json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0) };
  if (url.endsWith(".json")) return { ok: true, status: 200, json: async () => JSON.parse(readFileSync(new URL("../public" + url, import.meta.url), "utf8")) };
  const set = url.slice(KEYS_BASE.length).split("/")[0]!;
  const n = (net.served.get(set) ?? 0) + 1;
  net.served.set(set, n);
  if (set === net.holdSet && n > net.holdAfter && !url.endsWith("/preview.ogg")) await new Promise<void>((go) => net.held.push(go));
  return { ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode(url).buffer };
});

const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
/** Lets fetches, decodes and the kit's batch turns run out. */
const settle = async (): Promise<void> => { for (let k = 0; k < 12; k += 1) await wait(1); };
const ctx = (): TestContext | undefined => contexts.at(-1);
const played = (): TestSource[] => (ctx()?.sources ?? []).filter((source) => source.buffer?.url.includes("/key-") || source.buffer?.url.includes("/space-"));
const decodedOf = (set: string): string[] => (ctx()?.decoded ?? []).filter((url) => url.startsWith(KEYS_BASE + set + "/") && !url.endsWith("/preview.ogg"));
const press = (key: string, code: string, target: EventTarget = document.body): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};
const option = (value: string) => document.querySelector<HTMLButtonElement>(`[role="option"][data-value="${value}"]`);
const stored = (): Partial<Settings> | null => JSON.parse(localStorage.getItem("td.settings") ?? "null") as Partial<Settings> | null;

/** The page as src/main.ts wires it: the title, the selection's halt, the session, installKeys and the frame. */
const page = { titleUp: false, halted: false, quick: null as GameQuick | null, session: null as Session | null, acts: [] as string[], bamboo: [] as boolean[] };
const fakeAudio = { key: (space = false) => void page.bamboo.push(space), apply() {}, preview() {}, resume() {} } as unknown as TypingAudio;
const deck = smallDeck(["cat", "dog", "fish"]);
function newRun(): Session {
  const session = new Session({ seed: 3, deck });
  for (const text of ["cat", "dog"]) callWord(session.world, wordOf(deck, text));
  page.session = session;
  return session;
}
/** One frame of src/main.ts's update: the session held behind an overlay, then the letters' verdicts to the sound. */
function frame(now: number): void {
  const session = page.session!;
  const quick = page.quick;
  session.paused = page.halted || page.titleUp || quick?.blocking === true;
  session.frame(now);
  quick?.read(session.world.events.rare.splice(0));
}
let settings: Settings;
const notices: string[] = [];
let quits = 0;
async function mount(saved: Partial<Settings> = {}, countdown = 2): Promise<GameQuick> {
  localStorage.clear();
  if (Object.keys(saved).length > 0) localStorage.setItem("td.settings", JSON.stringify(saved));
  settings = loadSettings();
  page.quick = await mountQuick(settings, { audio: () => fakeAudio, quit: () => void (quits += 1), countdown: () => countdown, notice: (text) => void notices.push(text) });
  return page.quick;
}

beforeAll(() => {
  // Once, as the page does: installKeys has no removal.
  installKeys(window, {
    send: (command) => !page.titleUp && !page.quick?.blocking && !page.halted && (page.session!.send(command), true),
    blocked: () => page.titleUp || page.quick?.blocking === true,
    typed: (space, native) => { if (!page.halted || native) page.quick?.typed(space, native); },
    act: (action) => void page.acts.push(action),
    onVietnamese: () => {},
    allowUntrusted: true,
  });
});
beforeEach(() => {
  contexts.length = 0;
  notices.length = 0;
  quits = 0;
  Object.assign(page, { titleUp: false, halted: false, quick: null, session: null, acts: [], bamboo: [] });
  Object.assign(net, { catalogueDown: false, holdAfter: Infinity, holdSet: DEFAULT_KEYBOARD_SOUND, served: new Map(), held: [] });
  vi.stubGlobal("AudioContext", TestContext);
  vi.stubGlobal("GainNode", TestGain);
  vi.stubGlobal("AudioBufferSourceNode", TestSource);
  vi.stubGlobal("fetch", fetchStub);
  // No pitch or level jitter: a voice's level is the event's own (TYPING_SOUND_MAP).
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});
afterEach(async () => {
  for (const go of net.held.splice(0)) go();
  page.quick?.destroy();
  await settle();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("applyQuick and the saved values (tickets 192/193)", () => {
  it("maps every row onto one setting, clamps volumes to 0–100 and refuses what the game has not got", () => {
    const s = loadSettings({ readJson: () => null, writeJson: () => true });
    for (const [id, value] of [["master", 40], ["muted", true], ["music", 30], ["effects", 55.4], ["ui", 25], ["keyboardVolume", 120], ["keyboard", "warm-amber"], ["pace", false], ["mode", "learn"]] as const) expect(applyQuick(s, id, value), id).toBe(true);
    expect(s).toMatchObject({ master: 40, muted: true, music: 30, sfx: 55, ui: 25, keyboardVolume: 100, keyboard: "warm-amber", pace: false, mode: "learn" });
    expect(applyQuick(s, "master", -3)).toBe(true);
    expect(s.master).toBe(0);
    expect(applyQuick(s, "mode", "profile")).toBe(true);
    expect(s.mode).toBeNull();
    for (const [id, value] of [["master", Number.NaN], ["music", "loud"], ["mode", "hard"], ["keyboard", "Bad Id!"], ["keyboard", 3], ["pace", "yes"], ["muted", 1], ["voice", 50], ["quality", "low"]] as const) expect(applyQuick(s, id, value), `${id}=${String(value)}`).toBe(false);
    expect(quickValues(s)).toEqual({ master: 0, muted: true, music: 30, effects: 55, ui: 25, keyboard: "warm-amber", keyboardVolume: 100, pace: false, mode: "profile" });
  });

  it("offers only real rows: no Voice slider, no typing-effect or graphics rows the game does not draw", () => {
    expect(soundRows([]).map((row) => row.id)).toEqual(["master", "music", "effects", "keyboard", "keyboardVolume", "ui"]);
    expect(settingsRows().map((row) => row.id)).toEqual(["gameHeading", "pace", "mode", "resume", "quit"]);
  });

  it("the panels save each change at once and read it back on the next page", async () => {
    await mount();
    press("F2", "F2");
    const slider = document.querySelector<HTMLInputElement>('[data-row="keyboardVolume"] input')!;
    slider.value = "60";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector<HTMLButtonElement>('[data-toggle="muted"]')!.click();
    option(OTHER)!.click();
    press("F1", "F1");
    document.querySelector<HTMLInputElement>('[data-row="mode"] input[value="challenge"]')!.click();
    expect(stored()).toMatchObject({ keyboardVolume: 60, muted: true, keyboard: OTHER, mode: "challenge" });
    expect(loadSettings()).toMatchObject({ keyboardVolume: 60, muted: true, keyboard: OTHER, mode: "challenge" });
  });
});

describe("F1, F2, Esc and the corner buttons", () => {
  it("open, switch and close both panels by key and by mouse, on the title and in play", async () => {
    const quick = await mount();
    for (const titleUp of [true, false]) {
      page.titleUp = titleUp;
      press("F1", "F1");
      expect([quick.panel, quick.blocking]).toEqual(["settings", true]);
      press("F2", "F2");
      expect(quick.panel).toBe("sound");
      press("F2", "F2");
      expect(quick.panel).toBeNull();
      await wait(20);
      document.querySelector<HTMLButtonElement>('.kit-qs__corner[data-panel="settings"]')!.click();
      expect(quick.panel).toBe("settings");
      press("Escape", "Escape");
      expect(quick.panel).toBeNull();
      await wait(20);
      expect(quick.blocking).toBe(false);
      document.querySelector<HTMLButtonElement>('.kit-qs__corner[data-panel="sound"]')!.click();
      document.querySelector<HTMLButtonElement>('.kit-qs__dialog[data-panel="sound"] .kit-qs__close')!.click();
      await wait(20);
      expect(quick.blocking).toBe(false);
    }
    expect(page.acts).toEqual([]); // Esc closed the panel: never the game's own Esc (the pause card)
  });

  it("Quit to title closes at once, with no countdown", async () => {
    const quick = await mount({}, 50);
    press("F1", "F1");
    document.querySelector<HTMLButtonElement>('[data-action="quit"]')!.click();
    expect([quits, quick.panel, quick.blocking]).toEqual([1, null, false]);
  });
});

describe("play held behind a panel", () => {
  it("letters, Backspace and Space are held back; the session's hash, tick and log stay as they were through the 3-2-1", async () => {
    const quick = await mount({}, 10);
    const session = newRun();
    frame(0);
    frame(40);
    const before = { hash: hashHex(session.world), tick: session.world.tick, log: session.log.length };
    press("F2", "F2");
    press("c", "KeyC");
    press("Backspace", "Backspace");
    press(" ", "Space");
    frame(80);
    frame(400);
    expect({ hash: hashHex(session.world), tick: session.world.tick, log: session.log.length }).toEqual(before);
    press("Escape", "Escape");
    expect(quick.blocking).toBe(true);
    expect(document.querySelector(".kit-qs__digit")!.textContent).toBe("3");
    press("c", "KeyC");
    frame(500);
    expect({ hash: hashHex(session.world), tick: session.world.tick, log: session.log.length }).toEqual(before);
    await wait(60);
    expect(quick.blocking).toBe(false);
    press("c", "KeyC");
    frame(520);
    frame(540);
    expect(session.world.tick).toBeGreaterThan(before.tick);
    expect(session.log.filter((command) => command.t === "key")).toHaveLength(1);
    expect(page.acts).toEqual([]);
  });

  it("an open panel keeps its own keys: a slider's arrows stay native and its letters never reach the run", async () => {
    await mount();
    const session = newRun();
    press("F2", "F2");
    const slider = document.querySelector<HTMLInputElement>('[data-row="master"] input')!;
    expect(press("ArrowRight", "ArrowRight", slider).defaultPrevented).toBe(false);
    press("a", "KeyA", slider);
    frame(0);
    frame(100);
    expect(session.log).toEqual([]);
  });
});

describe("keys routed as the page routes them", () => {
  it("a letter sounds from the simulation's verdict, once; the word space and Backspace at the key; a later Space is the pause", async () => {
    await mount();
    await settle();
    newRun();
    frame(0);
    const before = played().length;
    press("c", "KeyC");
    expect(played()).toHaveLength(before); // nothing at keydown: the sim has not judged it yet
    frame(20);
    expect(played()).toHaveLength(before + 1);
    expect(played().at(-1)!.buffer!.url).toContain(`/${DEFAULT_KEYBOARD_SOUND}/key-`);
    press(" ", "Space");
    expect(played().at(-1)!.buffer!.url).toContain(`/${DEFAULT_KEYBOARD_SOUND}/space-`);
    press("Backspace", "Backspace");
    expect(played().at(-1)!.buffer!.url).toContain("/key-");
    expect(played()).toHaveLength(before + 3);
    expect(page.acts).toEqual([]);
    const late = new KeyboardEvent("keydown", { key: " ", code: "Space", bubbles: true, cancelable: true });
    Object.defineProperty(late, "timeStamp", { value: performance.now() + 5000 });
    document.body.dispatchEvent(late);
    expect(page.acts).toEqual(["space"]);
  });

  it("text typed in a native field plays the chosen set and never reaches the run", async () => {
    await mount();
    await settle();
    const session = newRun();
    for (const tag of ["input", "textarea", "div"]) {
      const field = document.createElement(tag);
      if (tag === "input") (field as HTMLInputElement).type = "text";
      if (tag === "div") field.setAttribute("contenteditable", "");
      document.body.append(field);
      const before = played().length;
      press("b", "KeyB", field);
      press(" ", "Space", field);
      press("Backspace", "Backspace", field);
      expect(played().slice(before).map((source) => source.buffer!.url.split("/").at(-1)!.split("-")[0])).toEqual(["key", "space", "key"]);
      field.remove();
    }
    frame(0);
    frame(100);
    expect(session.log).toEqual([]);
  });

  it("Bamboo keeps the game's own synthesized keys and plays no Firefly sample; Off plays nothing", async () => {
    await mount({ keyboard: BUILT_IN_KEYS });
    newRun();
    frame(0);
    press("c", "KeyC");
    frame(20);
    press(" ", "Space");
    expect(played()).toEqual([]);
    expect(page.bamboo).toEqual([true]); // the letter's bamboo tick comes from audio-min's own read of the same verdict
    page.quick!.destroy();
    await mount({ keyboard: "off" });
    await settle();
    newRun();
    frame(0);
    press("c", "KeyC");
    frame(20);
    press(" ", "Space");
    expect(played()).toEqual([]);
  });
});

describe("wrong and stray letters on a Firefly set (review 30/10, medium)", () => {
  it("a right letter plays the key cue, a wrong one the kit's damped wrong cue, a stray one its quieter stray cue, all from the set's files", async () => {
    await mount();
    await settle();
    newRun();
    frame(0);
    const levels: number[] = [];
    let now = 0;
    for (const [key, code] of [["c", "KeyC"], ["x", "KeyX"], ["Backspace", "Backspace"], ["z", "KeyZ"]] as const) {
      const before = played().length;
      press(key, code);
      frame((now += 20));
      // Backspace sounds at the key (key cue); the letters at their verdict.
      levels.push(...played().slice(before).map((source) => source.level));
    }
    expect(levels).toEqual([TYPING_SOUND_MAP.key.gain, TYPING_SOUND_MAP.wrong.gain, TYPING_SOUND_MAP.key.gain, TYPING_SOUND_MAP.stray.gain]);
    expect(played().every((source) => source.buffer!.url.startsWith(KEYS_BASE + DEFAULT_KEYBOARD_SOUND + "/key-"))).toBe(true);
  });
});

describe("the saved keyboard set at startup", () => {
  it("the game's catalogue holds the owner's default", () => {
    expect(catalogue.profiles.map((p) => p.id)).toContain(DEFAULT_KEYBOARD_SOUND);
  });

  it("is active from its first decoded batch: a letter sounds while the rest of the set still loads", async () => {
    net.holdAfter = KEYBOARD_DECODE_BATCH_SIZE;
    await mount();
    await settle();
    expect(decodedOf(DEFAULT_KEYBOARD_SOUND)).toHaveLength(KEYBOARD_DECODE_BATCH_SIZE);
    newRun();
    frame(0);
    press("c", "KeyC");
    frame(20);
    expect(played().at(-1)?.buffer?.url).toContain(`/${DEFAULT_KEYBOARD_SOUND}/key-`);
    for (const go of net.held.splice(0)) go();
    await settle();
    expect(decodedOf(DEFAULT_KEYBOARD_SOUND).length).toBeGreaterThan(KEYBOARD_DECODE_BATCH_SIZE);
    expect(notices).toEqual([]);
  });

  it("picked away from before it finished, it is released: none of its other files decode, and the new set plays", async () => {
    net.holdAfter = KEYBOARD_DECODE_BATCH_SIZE;
    await mount();
    await settle();
    press("F2", "F2");
    option(OTHER)!.click();
    for (const go of net.held.splice(0)) go();
    await settle();
    expect(decodedOf(DEFAULT_KEYBOARD_SOUND)).toHaveLength(KEYBOARD_DECODE_BATCH_SIZE);
    press("Escape", "Escape");
    await wait(20);
    newRun();
    frame(0);
    press("c", "KeyC");
    frame(20);
    expect(played().at(-1)?.buffer?.url).toContain(`/${OTHER}/key-`);
    expect(notices).toEqual([]);
  });

  it("an unknown saved set falls back to the owner's default, saved, not to Bamboo (review 30/10, low)", async () => {
    await mount({ keyboard: "removed-pack" });
    expect(settings.keyboard).toBe(DEFAULT_KEYBOARD_SOUND);
    expect(stored()?.keyboard).toBe(DEFAULT_KEYBOARD_SOUND);
    press("F2", "F2");
    expect(option(DEFAULT_KEYBOARD_SOUND)!.getAttribute("aria-selected")).toBe("true");
    await settle();
    expect(decodedOf(DEFAULT_KEYBOARD_SOUND).length).toBeGreaterThan(0);
  });

  it("a catalogue that fails to load keeps the saved set (shown unavailable) and never saves Bamboo over it", async () => {
    net.catalogueDown = true;
    await mount({ keyboard: OTHER, master: 70 });
    expect(notices).toEqual(["Keyboard catalogue unavailable · Bamboo and Off remain available"]);
    expect(settings.keyboard).toBe(OTHER);
    press("F2", "F2");
    expect(stored()?.keyboard).toBe(OTHER);
    const saved = option(OTHER)!;
    expect([saved.disabled, saved.getAttribute("aria-selected"), saved.textContent]).toEqual([true, "true", "Saved sound unavailable"]);
    expect(option(BUILT_IN_KEYS)!.getAttribute("aria-selected")).toBe("false");
  });

  it("Off and Bamboo survive a restart as saved", async () => {
    for (const keyboard of ["off", BUILT_IN_KEYS]) {
      await mount({ keyboard });
      expect([settings.keyboard, stored()?.keyboard]).toEqual([keyboard, keyboard]);
      page.quick!.destroy();
    }
  });
});

describe("33 Firefly sets: Raindrop Tile, the owner's pick (30/10)", () => {
  const RAIN = "raindrop-tile";
  const profile = (id: string): Profile => catalogue.profiles.find((p) => p.id === id)!;
  const byOrder = (): Profile[] => [...catalogue.profiles].sort((a, b) => a.order - b.order);

  it("the catalogue lists 33 sets in order 0–32; Raindrop Tile closes the Crisp family after Crisp Silk, unscored as the owner's pick", () => {
    const ids = catalogue.profiles.map((p) => p.id);
    expect([ids.length, new Set(ids).size]).toEqual([33, 33]);
    expect(byOrder().map((p) => p.order)).toEqual(Array.from({ length: 33 }, (_, i) => i));
    expect(profile(RAIN)).toMatchObject({ name: "Raindrop Tile", family: "Crisp", score: null, ownerPick: true, manifest: "raindrop-tile/keys-manifest.json", preview: "raindrop-tile/preview.ogg" });
    expect([profile("crisp-silk").order + 1, profile("clear").order - 1]).toEqual([profile(RAIN).order, profile(RAIN).order]);
    // No invented score: only the owner's pick goes without one.
    expect(catalogue.profiles.filter((p) => !(typeof p.score === "number" && Number.isFinite(p.score))).map((p) => p.id)).toEqual([RAIN]);
    const families: Record<string, number> = {};
    for (const p of catalogue.profiles) families[p.family] = (families[p.family] ?? 0) + 1;
    expect(families).toEqual({ Deep: 3, Warm: 6, Rounded: 1, Solid: 2, Crisp: 7, Clear: 4, "Bright Clack": 10 });
    expect(DEFAULT_KEYBOARD_SOUND).toBe("bright-clack");
  });

  it("every set names key and space files the kit reads; each sample and preview has one media.md5 line and no line is stale", () => {
    const root = "public" + KEYS_BASE;
    const lines = readFileSync(join(__dirname, "..", "media.md5"), "utf8").split("\n").filter((line) => line.includes("  " + root));
    for (const line of lines) expect(line).toMatch(/^[0-9a-f]{32} {2}\S+\.ogg$/);
    const listed = lines.map((line) => line.slice(34));
    const wanted = new Set<string>();
    for (const p of catalogue.profiles) {
      const files = keyboardFiles(setManifest(p), root + p.manifest.slice(0, p.manifest.lastIndexOf("/") + 1));
      expect(files.key.length, p.id).toBeGreaterThanOrEqual(TYPING_SOUND_SET.key.want);
      expect(files.space.length, p.id).toBeGreaterThanOrEqual(TYPING_SOUND_SET.space.want);
      for (const file of [...files.key, ...files.space, root + p.preview]) wanted.add(file);
    }
    expect(listed.length).toBe(new Set(listed).size);
    expect([...wanted].filter((file) => !listed.includes(file))).toEqual([]);
    expect(listed.filter((file) => !wanted.has(file))).toEqual([]);
  });

  it("Raindrop Tile's manifest (schema /2): 17 keys with natural tails up to 450 ms, 8 spaces, its preview", () => {
    const rain = setManifest(profile(RAIN));
    expect([rain.schema, rain.id, rain.preview]).toEqual(["typing-keys-firefly/2", RAIN, "preview.ogg"]);
    const keys = rain.files!.filter((f) => f.set === "key");
    const spaces = rain.files!.filter((f) => f.set === "space");
    expect([keys.length, spaces.length]).toEqual([17, 8]);
    for (const f of keys) expect(f.durationMs, f.file).toBeGreaterThan(0);
    expect(Math.max(...keys.map((f) => f.durationMs!))).toBe(450);
  });

  it("the Sound panel offers Off, Bamboo and the 33 sets in catalogue order; Raindrop Tile is in the Crisp group, read without a score", async () => {
    const read = await loadKeyboardCatalog(KEYS_BASE, { fallback: [], extra: [ORIGINAL_KEYS] });
    const rain = read.options.find((choice) => choice.value === RAIN)!;
    expect(read.state).toBe("ready");
    expect(rain).toEqual({ value: RAIN, label: "Raindrop Tile", family: "Crisp", manifest: KEYS_BASE + "raindrop-tile/keys-manifest.json", preview: KEYS_BASE + "raindrop-tile/preview.ogg" });
    await mount();
    press("F2", "F2");
    const values = (scope: ParentNode): string[] => [...scope.querySelectorAll<HTMLElement>('[role="option"]')].map((button) => button.dataset.value!);
    expect(values(document.querySelector(".kit-keyboards__list")!)).toEqual(["off", BUILT_IN_KEYS, ...byOrder().map((p) => p.id)]);
    const crisp = [...document.querySelectorAll('.kit-keyboards__list [role="group"]')].find((group) => group.querySelector(".kit-keyboards__family")?.textContent === "Crisp")!;
    expect(values(crisp)).toEqual(["crisp", "crisp-amber", "crisp-cedar", "crisp-pebble", "crisp-slate", "crisp-silk", RAIN]);
    expect(option(RAIN)!.textContent).toBe("Raindrop Tile");
    expect(option(DEFAULT_KEYBOARD_SOUND)!.getAttribute("aria-selected")).toBe("true");
  });

  it("picked in the panel it is saved, all 25 samples decode, and letters and the space play its own files", async () => {
    await mount();
    await settle();
    press("F2", "F2");
    option(RAIN)!.click();
    await settle();
    expect(stored()?.keyboard).toBe(RAIN);
    expect(decodedOf(RAIN)).toHaveLength(25);
    press("Escape", "Escape");
    await wait(20);
    newRun();
    frame(0);
    press("c", "KeyC");
    frame(20);
    expect(played().at(-1)!.buffer!.url).toContain(`/${RAIN}/key-`);
    press(" ", "Space");
    expect(played().at(-1)!.buffer!.url).toContain(`/${RAIN}/space-`);
    expect(notices).toEqual([]);
  });

  it("its tails ring out: at 12 keys a second (about 145 WPM) no key sound is cut, nor a space at 3 a second", async () => {
    await mount({ keyboard: RAIN });
    await settle();
    expect(decodedOf(RAIN)).toHaveLength(25);
    const clock = ctx()!;
    for (let i = 0; i < 36; i += 1) {
      clock.currentTime = i / 12;
      page.quick!.typed(false);
    }
    for (let i = 0; i < 9; i += 1) {
      clock.currentTime = 4 + i / 3;
      page.quick!.typed(true);
    }
    const keys = played().filter((source) => source.buffer!.url.includes(`/${RAIN}/key-`));
    const spaces = played().filter((source) => source.buffer!.url.includes(`/${RAIN}/space-`));
    expect([keys.length, spaces.length]).toEqual([36, 9]);
    // Every variant played twice or more, so the 450 ms and 535 ms samples were among them.
    expect([Math.max(...keys.map((s) => lengths.get(s.buffer!.url)!)), Math.max(...spaces.map((s) => lengths.get(s.buffer!.url)!))]).toEqual([0.45, 0.535]);
    expect([...keys, ...spaces].filter((source) => source.stopped !== null).map((source) => source.buffer!.url)).toEqual([]);
  });
});
