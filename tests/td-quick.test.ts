// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { installKeys } from "../src/app/input";
import { KEYBOARD_SET_UNAVAILABLE, KEYBOARD_UNAVAILABLE, requestKeyboardCatalogue } from "../src/app/keyboard";
import { bambooKeys, BUILT_IN_KEYS, DEFAULT_KEYBOARD_SOUND, loadSettings, savedKeyboard, type Settings } from "../src/app/prefs";
import { applyQuick, mountQuick, quickValues, settingsRows, soundRows, type GameQuick } from "../src/app/quick";
import { Session } from "../src/app/session";
import { KEYBOARD_DECODE_BATCH_SIZE, KEYBOARD_FIRST_BATCH_SPACES, TYPING_SOUND_MAP } from "../src/kit/feedback/typing-fx/audio";
import { safeLocalStorage } from "../src/kit/platform/safe-storage";
import { hashHex } from "../src/sim/hash";
import type { TypingAudio } from "../src/view/audio-min";
import { catalogue, FEEL_BASE, SAMPLE_FAMILIES, SAMPLE_IDS, SAMPLE_SETS, sampleFiles, serve, setDir, type Reply } from "./feel-fixture";
import { callWord, smallDeck, wordOf } from "./td/typing";

/**
 * The Settings gear and Sound speaker in Wordwoven (parent docs/games/IN_GAME_SETTINGS.md, tickets 192/193) through
 * the kit's real panels: applyQuick and the saved values, F1/F2/Esc and the corner buttons, letters held back and the
 * session frozen (hash, tick, log) while a panel or its 3-2-1 is up, the keys routed as src/main.ts routes them, and the
 * keyboard sets read from Typing Feel (parent docs/games/TYPING_FEEL_SERVICE.md §5.1–5.3, §8.1): the panel built at once
 * with the pending list, the saved set active from its first decoded batch, a catalogue without the saved id, one that
 * fails (404, HTML with status 200, not JSON, CORS) or comes late while the panel is open, no origin at all, a set that
 * cannot sound (Bamboo stands in, unsaved), and wrong or stray letters keeping the kit's damped cue. Happy DOM and a fake
 * WebAudio; the host is the sample one of tests/feel-fixture.ts behind a stubbed fetch (no network, no parent repo); the
 * samples are fake bytes naming their URL.
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

const CATALOGUE = FEEL_BASE + "keys-manifest.json";
/** A fake sample lasts what the test says (the owner picks' natural tails below), else 0.2 s. */
const lengths = new Map<string, number>();
/** A sample set other than the catalogue's default (Bright Clack). */
const OTHER = "deep";
/** How the sample host answers the catalogue: as it should, or broken as §8.1 lists it. */
type CatalogueReply = "ok" | "404" | "html" | "json" | "cors";
const net = {
  catalogue: "ok" as CatalogueReply,
  root: catalogue(),
  /** The catalogue's answer waits until the test lets it go (a late catalogue). */
  holdCatalogue: false,
  heldCatalogue: [] as (() => void)[],
  /** Samples of `holdSet` past the first `holdAfter` wait until the test lets them go. */
  holdAfter: Infinity,
  holdSet: DEFAULT_KEYBOARD_SOUND,
  served: new Map<string, number>(),
  held: [] as (() => void)[],
  /** Sets whose manifest, or whose every sample, answers 404. */
  broken: new Map<string, "manifest" | "samples">(),
  /** Every request: its URL and the cache mode it asked for. */
  calls: [] as { url: string; cache: RequestCache | undefined }[],
};
/** A fetch answer as the kit's timedJson and timedBytes read it; a sample's bytes name its URL. */
function respond(url: string, reply: Reply): Response {
  return {
    ok: reply.status >= 200 && reply.status < 300, status: reply.status, headers: new Headers(reply.type ? { "content-type": reply.type } : {}),
    text: async () => reply.text ?? "", json: async () => JSON.parse(reply.text ?? ""), arrayBuffer: async () => new TextEncoder().encode(url).buffer as ArrayBuffer,
  } as unknown as Response;
}
const setOf = (url: string): string => (url.startsWith(FEEL_BASE + "sets/") ? url.slice((FEEL_BASE + "sets/").length).split("/")[0]! : "");
const fetchStub = vi.fn(async (url: string, init?: RequestInit) => {
  net.calls.push({ url, cache: init?.cache });
  if (url === CATALOGUE) {
    if (net.holdCatalogue) await new Promise<void>((go) => net.heldCatalogue.push(go));
    if (net.catalogue === "cors") throw new TypeError("Failed to fetch");
    if (net.catalogue === "404") return respond(url, { status: 404 });
    if (net.catalogue === "html") return respond(url, { status: 200, type: "text/html", text: "<!doctype html><html><body>app</body></html>" });
    if (net.catalogue === "json") return respond(url, { status: 200, type: "application/json", text: "{ not json" });
  }
  const set = setOf(url);
  const broken = net.broken.get(set);
  if (broken === "manifest" && url.endsWith("/keys-manifest.json")) return respond(url, { status: 404 });
  const sample = /\/(key|space)-\d+\.ogg$/.test(url);
  if (broken === "samples" && sample) return respond(url, { status: 404 });
  if (sample) {
    const n = (net.served.get(set) ?? 0) + 1;
    net.served.set(set, n);
    if (set === net.holdSet && n > net.holdAfter) await new Promise<void>((go) => net.held.push(go));
  }
  return respond(url, serve(url, net.root));
});

const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
/** Lets fetches, decodes and the kit's batch turns run out. */
const settle = async (): Promise<void> => { for (let k = 0; k < 12; k += 1) await wait(1); };
const ctx = (): TestContext | undefined => contexts.at(-1);
const played = (): TestSource[] => (ctx()?.sources ?? []).filter((source) => source.buffer?.url.includes("/key-") || source.buffer?.url.includes("/space-"));
const decodedOf = (set: string): string[] => (ctx()?.decoded ?? []).filter((url) => url.startsWith(setDir(set)) && !url.endsWith("/preview.ogg"));
const urls = (): string[] => net.calls.map((call) => call.url);
const press = (key: string, code: string, target: EventTarget = document.body): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", { key, code, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};
const option = (value: string) => document.querySelector<HTMLButtonElement>(`[role="option"][data-value="${value}"]`);
const values = (scope: ParentNode = document.querySelector(".kit-keyboards__list")!): string[] => [...scope.querySelectorAll<HTMLElement>('[role="option"]')].map((button) => button.dataset.value!);
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
/** What main.ts's hooks were told: Bamboo's stand-in (main hands it to the sound chunk) and the keyboard gate. */
const told = { standIn: [] as (string | null)[], playable: [] as string[] };
let quits = 0;
/**
 * A page with `saved` as the stored td.settings (null: none): the settings, the raw keyboard field and the catalogue
 * asked for with the page from `base` (null: no origin), then the panels; by default the catalogue and the saved set's
 * load run out first (`wait: false`: not).
 */
async function mount(saved: Partial<Settings> | null = null, options: { countdown?: number; base?: string | null; wait?: boolean } = {}): Promise<GameQuick> {
  localStorage.clear();
  if (saved !== null) localStorage.setItem("td.settings", JSON.stringify(saved));
  settings = loadSettings();
  page.quick = mountQuick(settings, {
    audio: () => fakeAudio, quit: () => void (quits += 1), countdown: () => options.countdown ?? 2, notice: (text) => void notices.push(text),
    saved: savedKeyboard(), feed: requestKeyboardCatalogue(options.base === undefined ? FEEL_BASE : options.base),
    standIn: (id) => void told.standIn.push(id), playable: (by) => void told.playable.push(by),
  });
  if (options.wait !== false) await settle();
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
  lengths.clear();
  Object.assign(told, { standIn: [], playable: [] });
  Object.assign(page, { titleUp: false, halted: false, quick: null, session: null, acts: [], bamboo: [] });
  Object.assign(net, { catalogue: "ok", root: catalogue(), holdCatalogue: false, heldCatalogue: [], holdAfter: Infinity, holdSet: DEFAULT_KEYBOARD_SOUND, served: new Map(), held: [], broken: new Map(), calls: [] });
  fetchStub.mockClear();
  vi.stubGlobal("AudioContext", TestContext);
  vi.stubGlobal("GainNode", TestGain);
  vi.stubGlobal("AudioBufferSourceNode", TestSource);
  vi.stubGlobal("fetch", fetchStub);
  // No pitch or level jitter: a voice's level is the event's own (TYPING_SOUND_MAP).
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});
afterEach(async () => {
  for (const go of [...net.held.splice(0), ...net.heldCatalogue.splice(0)]) go();
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
    const quick = await mount(null, { countdown: 50 });
    press("F1", "F1");
    document.querySelector<HTMLButtonElement>('[data-action="quit"]')!.click();
    expect([quits, quick.panel, quick.blocking]).toEqual([1, null, false]);
  });
});

describe("play held behind a panel", () => {
  it("letters, Backspace and Space are held back; the session's hash, tick and log stay as they were through the 3-2-1", async () => {
    const quick = await mount(null, { countdown: 10 });
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
    expect(played().at(-1)!.buffer!.url).toContain(setDir(DEFAULT_KEYBOARD_SOUND) + "key-");
    press(" ", "Space");
    expect(played().at(-1)!.buffer!.url).toContain(setDir(DEFAULT_KEYBOARD_SOUND) + "space-");
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
    expect(played().every((source) => source.buffer!.url.startsWith(setDir(DEFAULT_KEYBOARD_SOUND) + "key-"))).toBe(true);
  });
});

describe("the saved keyboard set at startup", () => {
  it("is active from its first decoded batch (12 keys and 4 spaces): a letter and the first space sound while the rest still loads; the run's gate is told once", async () => {
    net.holdAfter = KEYBOARD_DECODE_BATCH_SIZE;
    await mount();
    const first = decodedOf(DEFAULT_KEYBOARD_SOUND);
    expect(first).toHaveLength(KEYBOARD_DECODE_BATCH_SIZE);
    expect(first.filter((url) => url.includes("/space-"))).toHaveLength(KEYBOARD_FIRST_BATCH_SPACES);
    expect(told.playable).toEqual(["batch"]);
    newRun();
    frame(0);
    press("c", "KeyC");
    frame(20);
    expect(played().at(-1)?.buffer?.url).toContain(setDir(DEFAULT_KEYBOARD_SOUND) + "key-");
    press(" ", "Space");
    expect(played().at(-1)?.buffer?.url).toContain(setDir(DEFAULT_KEYBOARD_SOUND) + "space-");
    for (const go of net.held.splice(0)) go();
    await settle();
    expect(decodedOf(DEFAULT_KEYBOARD_SOUND).length).toBeGreaterThan(KEYBOARD_DECODE_BATCH_SIZE);
    expect([notices, told.playable, told.standIn]).toEqual([[], ["batch"], []]);
  });

  it("picked away from before it finished, it is released: none of its other files decode, and the new set plays", async () => {
    net.holdAfter = KEYBOARD_DECODE_BATCH_SIZE;
    await mount();
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
    expect(played().at(-1)?.buffer?.url).toContain(setDir(OTHER) + "key-");
    expect(notices).toEqual([]);
  });

  it("a catalogue without the saved set moves it to the catalogue's default, saved once; the panel repairs nothing more (review 30/10, low)", async () => {
    net.root = catalogue({ default: "deep-amber" });
    const writes = vi.spyOn(safeLocalStorage, "writeJson");
    await mount({ keyboard: "removed-pack" });
    expect(settings.keyboard).toBe("deep-amber");
    expect(writes.mock.calls.filter(([key]) => key === "td.settings").map(([, value]) => (value as Settings).keyboard)).toEqual(["deep-amber"]);
    press("F2", "F2");
    expect(option("deep-amber")!.getAttribute("aria-selected")).toBe("true");
    expect(values()).toEqual(["off", BUILT_IN_KEYS, ...SAMPLE_IDS]);
    expect(decodedOf("deep-amber").length).toBeGreaterThan(0);
    expect(writes.mock.calls.filter(([key]) => key === "td.settings")).toHaveLength(1);
    expect(notices).toEqual([]);
  });

  it("Off and Bamboo survive a restart as saved, and load no set", async () => {
    for (const keyboard of ["off", BUILT_IN_KEYS]) {
      await mount({ keyboard });
      expect([settings.keyboard, stored()?.keyboard, page.quick!.standIn(), told.playable]).toEqual([keyboard, keyboard, null, ["ended"]]);
      expect(urls()).toEqual([CATALOGUE]);
      page.quick!.destroy();
      Object.assign(told, { playable: [] });
      net.calls.length = 0;
    }
  });

  it("a save without a keyboard sound follows the catalogue's default and never writes it on an unrelated change; the player's pick is written", async () => {
    net.root = catalogue({ default: "deep-amber" });
    await mount({ master: 70 });
    expect(settings.keyboard).toBe("deep-amber");
    document.querySelector<HTMLButtonElement>('.kit-qs__corner[data-panel="sound"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-toggle="muted"]')!.click();
    expect(stored()).toMatchObject({ master: 70, muted: true });
    expect(stored()).not.toHaveProperty("keyboard");
    option("solid")!.click();
    expect(stored()?.keyboard).toBe("solid");
    document.querySelector<HTMLButtonElement>('[data-toggle="muted"]')!.click();
    expect(stored()).toMatchObject({ muted: false, keyboard: "solid" });
  });
});

describe("Typing Feel down or missing (§5.3, §8.1): the saved set stays, Bamboo stands in, the run is not held", () => {
  it("no origin: nothing is fetched, no notice; Off, Bamboo and the saved set shown unavailable; the save keeps it; Bamboo stands in until a pick", async () => {
    await mount({ keyboard: "hail-stone" }, { base: null });
    expect([fetchStub.mock.calls.length, notices, told.playable, told.standIn]).toEqual([0, [], ["ended"], ["hail-stone"]]);
    press("F2", "F2");
    expect(values()).toEqual(["off", BUILT_IN_KEYS, "hail-stone"]);
    const saved = option("hail-stone")!;
    expect([saved.disabled, saved.getAttribute("aria-selected"), saved.textContent]).toEqual([true, "true", "Saved sound unavailable"]);
    expect([settings.keyboard, stored()?.keyboard, page.quick!.standIn(), bambooKeys(settings, page.quick!.standIn())]).toEqual(["hail-stone", "hail-stone", "hail-stone", true]);
    press("Escape", "Escape");
    await wait(20);
    // Bamboo's space at the key (its letters come from audio-min's own read of the verdicts); no sample.
    newRun();
    frame(0);
    press("c", "KeyC");
    frame(20);
    press(" ", "Space");
    expect([played(), page.bamboo]).toEqual([[], [true]]);
    press("F2", "F2");
    option("off")!.click();
    expect([page.quick!.standIn(), told.standIn.at(-1), stored()?.keyboard]).toEqual([null, null, "off"]);
  });

  it("no origin and no saved sound: Bamboo plays, and the save stays without a keyboard sound", async () => {
    await mount({ master: 70 }, { base: null });
    expect([settings.keyboard, page.quick!.standIn(), fetchStub.mock.calls.length]).toEqual([BUILT_IN_KEYS, null, 0]);
    press("F2", "F2");
    expect(values()).toEqual(["off", BUILT_IN_KEYS]);
    document.querySelector<HTMLButtonElement>('[data-toggle="muted"]')!.click();
    expect(stored()).not.toHaveProperty("keyboard");
  });

  it.each([
    ["404", "a 404"],
    ["html", "HTML with status 200 (an SPA fallback)"],
    ["json", "a body that is not JSON"],
    ["cors", "a CORS failure"],
  ] as const)("%s: %s keeps the saved set (shown unavailable), says \"Keyboard sounds unavailable\" once, asks for no set, and Bamboo stands in", async (reply, _what) => {
    net.catalogue = reply;
    await mount({ keyboard: OTHER, master: 70 });
    expect(notices).toEqual([KEYBOARD_UNAVAILABLE]);
    expect([settings.keyboard, stored()?.keyboard, page.quick!.standIn(), told.playable]).toEqual([OTHER, OTHER, OTHER, ["ended"]]);
    expect(urls()).toEqual([CATALOGUE]);
    page.quick!.typed(true);
    expect([page.bamboo, played()]).toEqual([[true], []]);
    press("F2", "F2");
    const saved = option(OTHER)!;
    expect([saved.disabled, saved.getAttribute("aria-selected"), saved.textContent]).toEqual([true, "true", "Saved sound unavailable"]);
    expect(option(BUILT_IN_KEYS)!.getAttribute("aria-selected")).toBe("false");
    // An unrelated change keeps the saved set in the save.
    document.querySelector<HTMLButtonElement>('[data-toggle="muted"]')!.click();
    expect(stored()).toMatchObject({ muted: true, keyboard: OTHER });
  });

  it.each(["manifest", "samples"] as const)("the saved set's %s fails: Bamboo stands in, one notice, the save keeps the set; a sample failure stops after the first batch", async (broken) => {
    net.broken.set("hail-stone", broken);
    await mount({ keyboard: "hail-stone" });
    expect([notices, page.quick!.standIn(), settings.keyboard, stored()?.keyboard, told.playable]).toEqual([[KEYBOARD_SET_UNAVAILABLE], "hail-stone", "hail-stone", "hail-stone", ["ended"]]);
    const samples = urls().filter((url) => /\/(key|space)-\d+\.ogg$/.test(url));
    expect(samples).toHaveLength(broken === "manifest" ? 0 : KEYBOARD_DECODE_BATCH_SIZE);
    page.quick!.typed(true);
    expect([page.bamboo, played()]).toEqual([[true], []]);
    press("F2", "F2");
    option(BUILT_IN_KEYS)!.click();
    expect([page.quick!.standIn(), stored()?.keyboard]).toEqual([null, BUILT_IN_KEYS]);
  });

  it("a set picked in the panel that cannot sound: Bamboo stands in, unsaved, until the next pick", async () => {
    net.broken.set("solid", "samples");
    await mount();
    press("F2", "F2");
    option("solid")!.click();
    await settle();
    expect([page.quick!.standIn(), stored()?.keyboard, notices]).toEqual(["solid", "solid", [KEYBOARD_SET_UNAVAILABLE]]);
    option(OTHER)!.click();
    await settle();
    expect([page.quick!.standIn(), stored()?.keyboard, decodedOf(OTHER).length]).toEqual([null, OTHER, sampleFiles(OTHER).key.length + sampleFiles(OTHER).space.length]);
  });
});

describe("a late catalogue (§5.1 steps 4–5): the panel is built at once and takes the list when it comes", () => {
  it("open before the catalogue: Off, Bamboo and the saved set \"Loading…\"; the list is replaced in place, the saved set selected and loaded, no preview played", async () => {
    net.holdCatalogue = true;
    await mount({ keyboard: "hail-stone" });
    press("F2", "F2");
    expect(values()).toEqual(["off", BUILT_IN_KEYS, "hail-stone"]);
    expect([option("hail-stone")!.disabled, option("hail-stone")!.getAttribute("aria-selected"), option("hail-stone")!.textContent]).toEqual([true, "true", "Loading…"]);
    expect(told.playable).toEqual([]);
    for (const go of net.heldCatalogue.splice(0)) go();
    await settle();
    expect(page.quick!.panel).toBe("sound");
    expect(values()).toEqual(["off", BUILT_IN_KEYS, ...SAMPLE_IDS]);
    expect([option("hail-stone")!.disabled, option("hail-stone")!.getAttribute("aria-selected")]).toEqual([false, "true"]);
    expect(decodedOf("hail-stone").length).toBeGreaterThan(0);
    expect(urls().filter((url) => url.endsWith("/preview.ogg"))).toEqual([]);
    expect([stored()?.keyboard, notices, told.playable]).toEqual(["hail-stone", [], ["batch"]]);
  });

  it("Bamboo picked while the catalogue loads stands: the late list keeps it selected, nothing else is saved and no set loads", async () => {
    net.holdCatalogue = true;
    await mount({ keyboard: "hail-stone" });
    press("F2", "F2");
    option(BUILT_IN_KEYS)!.click();
    expect(stored()?.keyboard).toBe(BUILT_IN_KEYS);
    for (const go of net.heldCatalogue.splice(0)) go();
    await settle();
    expect(values()).toEqual(["off", BUILT_IN_KEYS, ...SAMPLE_IDS]);
    expect(option(BUILT_IN_KEYS)!.getAttribute("aria-selected")).toBe("true");
    expect([settings.keyboard, stored()?.keyboard, urls(), page.quick!.standIn()]).toEqual([BUILT_IN_KEYS, BUILT_IN_KEYS, [CATALOGUE], null]);
  });
});

describe("fetches (§5.1, §8.1)", () => {
  it("the catalogue revalidates (no-cache); set manifests may come from the HTTP cache, at startup and from the panel; samples and previews come from the feel host only", async () => {
    await mount();
    press("F2", "F2");
    option("hail-stone")!.click();
    await settle();
    const caches = (pattern: RegExp) => net.calls.filter((call) => pattern.test(call.url)).map((call) => call.cache);
    expect(caches(/\/v1\/keys\/keys-manifest\.json$/)).toEqual(["no-cache"]);
    expect(caches(/\/sets\/.+\/keys-manifest\.json$/)).toEqual(["default", "default"]);
    expect(urls().every((url) => url.startsWith(FEEL_BASE))).toBe(true);
    expect(urls().filter((url) => url.endsWith("/preview.ogg"))).toEqual([setDir("hail-stone") + "preview.ogg"]);
  });
});

describe("Typing Feel sets on the sample host: the owner's picks Raindrop Tile and Hail Stone", () => {
  /** The owner's unscored picks (natural Firefly takes with kept tails); the fake lengths stand for their longest samples. */
  const PICKS = [
    { id: "hail-stone", name: "Hail Stone", family: "Solid", keyMs: 450, spaceMs: 535 },
    { id: "raindrop-tile", name: "Raindrop Tile", family: "Crisp", keyMs: 450, spaceMs: 535 },
  ] as const;
  const counts = (id: string) => SAMPLE_SETS.find((set) => set.id === id)!;

  it("the Sound panel offers Off, Bamboo and the sets in catalogue order under one heading per family; the picks read without a score", async () => {
    await mount();
    press("F2", "F2");
    expect(values()).toEqual(["off", BUILT_IN_KEYS, ...SAMPLE_IDS]);
    const headings = [...document.querySelectorAll(".kit-keyboards__list .kit-keyboards__family")].map((heading) => heading.textContent).filter(Boolean);
    expect(headings).toEqual(SAMPLE_FAMILIES);
    const group = (family: string): Element => [...document.querySelectorAll('.kit-keyboards__list [role="group"]')].find((g) => g.querySelector(".kit-keyboards__family")?.textContent === family)!;
    expect(values(group("Solid"))).toEqual(["solid", "hail-stone"]);
    expect(values(group("Crisp"))).toEqual(["raindrop-tile"]);
    for (const pick of PICKS) expect(option(pick.id)!.textContent).toBe(pick.name);
    expect(option(DEFAULT_KEYBOARD_SOUND)!.getAttribute("aria-selected")).toBe("true");
  });

  it.each(PICKS)("$name, picked in the panel, is saved, all its samples decode, and letters and the space play its own files", async (pick) => {
    await mount();
    press("F2", "F2");
    option(pick.id)!.click();
    await settle();
    expect(stored()?.keyboard).toBe(pick.id);
    expect(decodedOf(pick.id)).toHaveLength(counts(pick.id).keys + counts(pick.id).spaces);
    press("Escape", "Escape");
    await wait(20);
    newRun();
    frame(0);
    press("c", "KeyC");
    frame(20);
    expect(played().at(-1)!.buffer!.url).toContain(setDir(pick.id) + "key-");
    press(" ", "Space");
    expect(played().at(-1)!.buffer!.url).toContain(setDir(pick.id) + "space-");
    expect(notices).toEqual([]);
  });

  it.each(PICKS)("$name: its tails ring out, at 12 keys a second (about 145 WPM) no key sound is cut, nor a space at 3 a second", async (pick) => {
    const files = sampleFiles(pick.id);
    for (const url of files.key) lengths.set(url, pick.keyMs / 1000);
    for (const url of files.space) lengths.set(url, pick.spaceMs / 1000);
    await mount({ keyboard: pick.id });
    expect(decodedOf(pick.id)).toHaveLength(files.key.length + files.space.length);
    const clock = ctx()!;
    for (let i = 0; i < 36; i += 1) {
      clock.currentTime = i / 12;
      page.quick!.typed(false);
    }
    for (let i = 0; i < 9; i += 1) {
      clock.currentTime = 4 + i / 3;
      page.quick!.typed(true);
    }
    const keys = played().filter((source) => source.buffer!.url.startsWith(setDir(pick.id) + "key-"));
    const spaces = played().filter((source) => source.buffer!.url.startsWith(setDir(pick.id) + "space-"));
    expect([keys.length, spaces.length]).toEqual([36, 9]);
    // A shuffled round plays every variant once before any twice.
    expect(new Set(keys.map((s) => s.buffer!.url)).size).toBe(files.key.length);
    expect([...keys, ...spaces].filter((source) => source.stopped !== null).map((source) => source.buffer!.url)).toEqual([]);
  });
});

describe("the panels' art (115/160 frame and button, 225 sliders)", () => {
  /** Rule bodies of src/ui/quick.css by selector (comments dropped, whitespace folded) and every rule head. */
  const sheet = (): { rules: Map<string, string>; heads: string[] } => {
    const rules = new Map<string, string>();
    const heads: string[] = [];
    const css = readFileSync(join(__dirname, "..", "src/ui/quick.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, head, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      heads.push(head!.trim());
      for (const selector of head!.split(",").map((part) => part.trim()).filter(Boolean)) {
        rules.set(selector, (rules.get(selector) ?? "") + body!.replace(/\s+/g, " ").trim() + " ");
      }
    }
    return { rules, heads };
  };

  it("sliders wear the 225 jade groove in three slices and the limestone knob, with no kit colour under either", async () => {
    await mount();
    const root = document.querySelector<HTMLElement>(".td-quick")!;
    expect(root.classList.contains("kit-qs--skin-slider")).toBe(true);
    expect(root.style.getPropertyValue("--kit-qs-skin-track")).toContain("/assets/typing-defense/ui/quick-settings/slider-track.png");
    expect(root.style.getPropertyValue("--kit-qs-skin-thumb")).toContain("/assets/typing-defense/ui/quick-settings/slider-thumb.128.png");
    expect(root.style.getPropertyValue("--kit-qs-skin-panel")).toContain("panel-large.v2.alpha.png");
    press("F2", "F2");
    expect(document.querySelector('[data-row="master"] input[type="range"]')!.classList.contains("kit-qs__range")).toBe(true);
    // A DOM stub has no cascade: read the sheet. The 64 px cloud-scroll caps keep their proportion (10 x 10 at scale 1)
    // and only the jade middle stretches; the round knob and the capped groove would show the kit's flat colours.
    const { rules, heads } = sheet();
    const at = (pseudo: string) => rules.get(`.td-quick.kit-qs--skin-slider .kit-qs__range${pseudo}`) ?? "";
    for (const track of ["::-webkit-slider-runnable-track", "::-moz-range-track"]) {
      expect(at(track), track).toContain("background: none;");
      expect(at(track), track).toContain("border-image: var(--kit-qs-skin-track) 0 64 fill / 0 calc(10px * var(--kit-qs-s)) stretch;");
    }
    // The knob box is 32 px (about 22 px of knob at 720p), centred on the 10 px groove; the range box holds it.
    for (const thumb of ["::-webkit-slider-thumb", "::-moz-range-thumb"]) {
      expect(at(thumb), thumb).toContain("background-color: transparent;");
      expect(at(thumb), thumb).toContain("width: calc(32px * var(--kit-qs-s));");
      expect(at(thumb), thumb).toContain("height: calc(32px * var(--kit-qs-s));");
    }
    expect(at("::-webkit-slider-thumb")).toContain("margin-top: calc(-11px * var(--kit-qs-s));");
    expect(at("")).toContain("height: calc(32px * var(--kit-qs-s));");
    // One unknown pseudo-element drops a whole rule: WebKit and Gecko never share one.
    expect(heads.filter((head) => head.includes("::-webkit-") && head.includes("::-moz-"))).toEqual([]);
  });

  it("the knob answers hover, press and keyboard focus with its own light, and the range shows a hand", () => {
    const { rules } = sheet();
    const at = (state: string) => rules.get(`.td-quick.kit-qs--skin-slider .kit-qs__range${state}`) ?? "";
    expect(at("")).toContain("cursor: pointer;");
    expect(at(":active")).toContain("cursor: grabbing;");
    // The kit's flat 2 px box around the whole range gives way to a lantern ring of light on the knob and a warm groove.
    expect(at(":focus-visible")).toContain("outline: none;");
    for (const [thumb, track] of [["::-webkit-slider-thumb", "::-webkit-slider-runnable-track"], ["::-moz-range-thumb", "::-moz-range-track"]] as const) {
      expect(at(`:hover${thumb}`), thumb).toMatch(/filter: brightness\(1\.15\) drop-shadow\(/);
      expect(at(`:active${thumb}`), thumb).toContain("transform: scale(1.08);");
      expect(at(`:focus-visible${thumb}`), thumb).toContain("drop-shadow(0 0 1px #ffb84d) drop-shadow(0 0 1px #ffb84d)");
      expect(at(`:focus-visible${track}`), track).toContain("filter: drop-shadow(");
    }
  });

  it("the frame is a 9-slice whose centre is one stretched copy of the art's middle, never tiles", () => {
    const panel = sheet().rules.get(".td-quick.kit-qs .kit-qs__panel") ?? "";
    // No `fill`: with "round" the frame's own middle was tiled at its 38 px scale (138 px tiles, seams behind the rows).
    expect(panel).toContain("border-image: var(--kit-qs-skin-panel) 210 / calc(38px * var(--kit-qs-s)) / 0 round;");
    expect(panel).not.toContain("fill");
    expect(panel).toContain("border: calc(18px * var(--kit-qs-s)) solid transparent;");
    expect(panel).toContain("background: var(--kit-qs-skin-panel) center / calc(max(100% - 40px * var(--kit-qs-s), 1px) * 1.5505) calc(max(100% - 40px * var(--kit-qs-s), 1px) * 1.5738) no-repeat padding-box transparent;");
  });

  it("a chosen chip, a pressed Mute and a switched-on switch wear the 160 button-active plate, not an orange outline", async () => {
    await mount();
    const root = document.querySelector<HTMLElement>(".td-quick")!;
    expect(root.style.getPropertyValue("--td-qs-button-active")).toContain("/assets/typing-defense/ui/quick-settings/button-active.v2.alpha.png");
    const { rules } = sheet();
    for (const state of [".kit-qs__opt input:checked + .kit-qs__chip", '.kit-qs__btn[aria-pressed="true"]', '.kit-qs__btn[aria-checked="true"]']) {
      const body = rules.get(`.td-quick.kit-qs ${state}`) ?? "";
      expect(body, state).toContain("border-image-source: var(--td-qs-button-active, var(--kit-qs-skin-button));");
      expect(body, state).toContain("color: var(--vd-quick-accent);");
    }
    expect([...rules.values()].some((body) => body.includes("outline: 2px solid var(--vd-lantern)"))).toBe(false);
    expect(rules.get(".td-quick.kit-qs .kit-qs__btn:hover")).toContain("filter: brightness(1.18);");
  });

  it("muted, the Master row dims and strikes its number, shows the muted speaker and the button reads Unmute", async () => {
    await mount();
    const root = document.querySelector<HTMLElement>(".td-quick")!;
    expect(root.style.getPropertyValue("--td-qs-icon-muted")).toContain("/assets/typing-defense/ui/quick-settings/hud-sound-muted.128.png");
    press("F2", "F2");
    const master = document.querySelector<HTMLElement>('.kit-qs__dialog[data-panel="sound"] [data-row="master"]')!;
    const mute = master.querySelector<HTMLButtonElement>('[data-toggle="muted"]')!;
    expect(mute.textContent).toBe("Mute");
    mute.click();
    await settle();
    expect(mute.getAttribute("aria-pressed")).toBe("true");
    expect(mute.textContent).toBe("Unmute");
    expect(master.classList.contains("td-quick__row--muted")).toBe(true);
    expect(master.classList.contains("td-quick__row--silent")).toBe(true);
    expect(stored()?.muted).toBe(true);
    mute.click();
    await settle();
    expect(mute.textContent).toBe("Mute");
    expect(master.classList.contains("td-quick__row--muted")).toBe(false);
    expect(master.classList.contains("td-quick__row--silent")).toBe(false);
    const range = master.querySelector<HTMLInputElement>('input[type="range"]')!;
    range.value = "0";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(master.classList.contains("td-quick__row--silent")).toBe(true);
    expect(master.classList.contains("td-quick__row--muted")).toBe(false);
    const { rules } = sheet();
    expect(rules.get(".td-quick .td-quick__row--muted .kit-qs__range")).toContain("filter: grayscale(0.7) brightness(0.6);");
    expect(rules.get(".td-quick .td-quick__row--muted .kit-qs__num")).toContain("text-decoration: line-through;");
    expect(rules.get(".td-quick .td-quick__row--silent .kit-qs__icon-cell")).toContain("background: var(--td-qs-icon-muted) center / contain no-repeat;");
    expect(rules.get(".td-quick .td-quick__row--silent .kit-qs__icon")).toContain("opacity: 0;");
    expect(rules.get(".td-quick.kit-qs .kit-qs__btn[data-toggle]")).toContain("min-width: calc(38px + 60px * var(--kit-qs-s));");
  });

  it("every Sound row with a groove or the keyboard list takes the one label column, so the grooves start at one x", async () => {
    await mount();
    press("F2", "F2");
    const aligned = ".td-quick .kit-qs__dialog[data-panel=\"sound\"] .kit-qs__row:not(.kit-qs__row--slot)";
    expect(sheet().rules.get(aligned)).toContain("grid-template-columns: calc(24px * var(--kit-qs-s)) 9em minmax(0, 1fr);");
    const matched = new Set(document.querySelectorAll(aligned));
    const sound = document.querySelector('.kit-qs__dialog[data-panel="sound"]')!;
    const ranges = [...sound.querySelectorAll('input[type="range"]')].map((input) => input.closest(".kit-qs__row")!);
    expect(ranges.length).toBeGreaterThanOrEqual(5);
    for (const line of [...ranges, sound.querySelector('[data-row="keyboard"]')!]) expect(matched.has(line), (line as HTMLElement).dataset.row).toBe(true);
    // The Settings rows keep their own columns ("Pace adapts to your typing" on one line).
    expect([...document.querySelectorAll('.kit-qs__dialog[data-panel="settings"] .kit-qs__row')].some((line) => matched.has(line))).toBe(false);
  });

  it("Resume, the primary button, reads in gold lettering on the dark button art, not the kit's ink", async () => {
    await mount();
    press("F1", "F1");
    const resume = document.querySelector<HTMLButtonElement>('.kit-qs__dialog[data-panel="settings"] [data-action="resume"]')!;
    expect(resume.classList.contains("kit-qs__btn--primary")).toBe(true);
    expect(sheet().rules.get(".td-quick .kit-qs__btn--primary")).toContain("color: var(--vd-quick-accent);");
  });
});

describe("no keyboard set is copied into the game (B5)", () => {
  it("media.md5 holds no audio/keys line, and the game's own code names no keys folder of its own", () => {
    const root = join(__dirname, "..");
    expect(readFileSync(join(root, "media.md5"), "utf8").split("\n").filter((line) => line.includes("/audio/keys/"))).toEqual([]);
    for (const file of ["src/app/keyboard.ts", "src/app/quick.ts", "src/main.ts"]) expect(readFileSync(join(root, file), "utf8"), file).not.toMatch(/assets\/typing-defense\/audio\/keys/);
  });
});
