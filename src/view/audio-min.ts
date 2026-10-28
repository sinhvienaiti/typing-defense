/**
 * Lời Gọi's sound made in code (docs/td/BUILD_NOW.md §5.5, TK 24; SPLIT_PLAN §1.2), no files: bamboo, wood, bronze
 * bells and paper (folk.ts), the list and the prompts for the real files in docs/audio/THEME_SOUND_LIST.md. Buses (TK
 * 24.2): music (ducked under a spoken word), typing (its own light compressor), world, ui, a shared reverb, master and
 * a limiter; the settings set master, music and effects. A call that lights up rings its kind's alert (power a trống
 * cơm pair, build two bamboo taps, harvest a high bell, chop a low wood knock, mine a small clink, quiz a sáo call; at
 * most 3 a second); a right key is a bamboo tick a semitone higher per letter, a wrong or stray one a dull "tóc" 12 dB
 * lower; a finished word a đàn tranh note on the ngũ cung by chain tier (Perfect and Flash add a bell). Word Shots
 * whoosh, blasts thud, the ink folk puff like paper, a leak rings a gong; night and dawn have their own calls. The
 * title adds far villagers calling across the fields. Mộc Tinh (BUILD_1B §13.2): day 5's two low wood beats; the lull's
 * swelling rumble and a low drum every 3 s, faster at the end; the ground breaking and a roar as it rises and staggers;
 * Rễ Trồi's creak through its warning, a wooden "cộp" as it lands; Quật cành's whoosh and thud; the stagger's bell and
 * gong; the retreat's falling chord and leaves; the chest's coins up the scale. A direct word breaking its mechanic: a
 * drum's thump (Ngắt), a bronze stroke and knock (Neo), a stone dome cracking (Phá Khiên).
 * C10: every event reaches its sound through one id (sound-map.ts); a real file listed in the audio manifest plays in its
 * place (FileBank), and the ids added since have no code-made sound.
 */
import { TICK_HZ } from "../content/rules";
import type { RareEvent } from "../sim/events";
import { chainTier } from "../sim/systems/chain";
import type { World } from "../sim/world";
import type { Settings } from "../app/prefs";
import { chuong, giay, go, goi, note, reverbTail, roar, rumble, sao, tranh, trong, type Out } from "./folk";
import { FolkMusic } from "./music";
import { busOf, eventSounds, ringSound } from "./sound-map";

const ALERTS_PER_S = 3;
/** Each bus's gain at volume 100 (the settings square the slider: half the slider is a quarter of the power). */
const BASE = { music: 1, sfx: 1.4 } as const;
type Bus = "typing" | "world" | "ui";
/** The title's sounds: a menu step, a choice, a closed entry, a lantern lighting. */
export type UiSound = "move" | "pick" | "off" | "lamp";

export class TypingAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private duck!: GainNode;
  private sfx!: GainNode;
  private verb!: ConvolverNode;
  private readonly out = {} as Record<Bus, Out>;
  private music: FolkMusic | null = null;
  private quiet = false;
  private cursor = 0;
  private phase = "";
  /** Real-time stamps (ms) of the last sounds a cap counts. */
  private readonly last = { caps: {} as Record<string, number[]>, leak: -1e9, caller: 0, left: -1 };
  private files: FileBank | null = null;

  constructor(private settings: Settings) {}

  get muted(): boolean {
    return this.quiet;
  }

  set muted(on: boolean) {
    this.quiet = on;
    this.apply(this.settings);
  }

  /** Browsers start audio only from a gesture: call on the first key or click. */
  resume(): void {
    if (this.ctx !== null) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const ctx = (this.ctx = new AudioContext());
    const limiter = new DynamicsCompressorNode(ctx, { threshold: -3, ratio: 20, attack: 0.002, release: 0.12, knee: 0 });
    limiter.connect(ctx.destination);
    this.master = new GainNode(ctx);
    this.master.connect(limiter);
    this.verb = new ConvolverNode(ctx, { buffer: reverbTail(ctx, 0.8) });
    this.verb.connect(new GainNode(ctx, { gain: 0.5 })).connect(this.master);
    this.musicBus = new GainNode(ctx);
    this.duck = new GainNode(ctx);
    this.duck.connect(this.musicBus).connect(this.master);
    this.musicBus.connect(new GainNode(ctx, { gain: 0.3 })).connect(this.verb);
    this.sfx = new GainNode(ctx);
    this.sfx.connect(this.master);
    this.sfx.connect(new GainNode(ctx, { gain: 0.12 })).connect(this.verb);
    // Four houses at 1 s must not pile up: the typing bus has its own light compressor (TK 24.2).
    const typing = new DynamicsCompressorNode(ctx, { threshold: -18, ratio: 3, attack: 0.003, release: 0.1 });
    typing.connect(this.sfx);
    this.out.typing = { ctx, to: typing };
    this.out.world = { ctx, to: new GainNode(ctx, { gain: 0.9 }) };
    this.out.world.to.connect(this.sfx);
    this.out.ui = { ctx, to: this.sfx };
    this.music = new FolkMusic(ctx, this.duck);
    this.files = new FileBank(ctx);
    this.apply(this.settings);
  }

  /** Volumes from the settings (0–100), squared; mute holds the master at 0. */
  apply(settings: Settings): void {
    this.settings = settings;
    if (this.ctx === null) return;
    const t = this.ctx.currentTime;
    const v = (value: number, base = 1): number => base * (value / 100) ** 2;
    this.master.gain.setTargetAtTime(this.quiet ? 0 : v(settings.master), t, 0.03);
    this.musicBus.gain.setTargetAtTime(v(settings.music, BASE.music), t, 0.03);
    this.sfx.gain.setTargetAtTime(v(settings.sfx, BASE.sfx), t, 0.03);
  }

  /**
   * Each frame: the music's layer (calm on the title and by day, tension at night), the music ducked under a
   * word being spoken (TK 24.2 PRONUNCIATION_DUCK: −9 dB in 0.12 s, back in 0.5 s), on the title a villager
   * calling every 3–7 s from left or right; a wood-block knock each of the day's last 10 s, higher for the last 3 (the early call).
   */
  frame(w: World | null, now: number): void {
    if (this.ctx === null || this.music === null) return;
    const left = w !== null && w.phase === "day" ? Math.ceil((w.phaseEnd - w.tick) / TICK_HZ) : -1;
    const changed = left !== this.last.left;
    this.last.left = left;
    if (changed && left > 0 && left <= 10) this.play("day-countdown", this.ctx.currentTime, now, null, w);
    this.music.set(w !== null && w.phase === "night", w === null ? 0 : w.boss.stage === 2 || w.boss.stage === 3 ? 1 : w.boss.stage === 4 ? 2 : 0);
    this.music.update();
    const speaking = typeof speechSynthesis !== "undefined" && speechSynthesis.speaking;
    this.duck.gain.setTargetAtTime(speaking ? 0.35 : 1, this.ctx.currentTime, speaking ? 0.04 : 0.17);
    if (w === null && now > this.last.caller) {
      this.last.caller = now + 3000 + Math.random() * 4000;
      const pan = new StereoPannerNode(this.ctx, { pan: (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4) });
      pan.connect(this.out.world.to);
      goi({ ctx: this.ctx, to: pan }, this.ctx.currentTime + 0.05, Math.random() < 0.5 ? 210 : 290, 0.06);
    }
  }

  ui(sound: UiSound): void {
    if (this.ctx !== null) this.play("ui-" + sound, this.ctx.currentTime, performance.now(), null, null);
  }

  /** A capped sound: true (and counted) while fewer than `max` played in the last second. */
  private room(list: number[], now: number, max: number): boolean {
    while (list.length > 0 && now - list[0]! > 1000) list.shift();
    if (list.length >= max) return false;
    list.push(now);
    return true;
  }

  /** A call lights up: its kind's alert (CALL_KIND: power, build, harvest, chop, mine, quiz). */
  private alert(kind: number, t: number): void {
    const o = this.out.typing;
    if (kind === 0) [0, 0.11].forEach((at, k) => trong(o, t + at, k === 0 ? 0.42 : 0.3, 150));
    else if (kind === 1) [0, 0.13].forEach((at) => go(o, t + at, 540, 0.13, 0.06));
    else if (kind === 2) chuong(o, t, 1568, 0.05, 0.9);
    else if (kind === 3) {
      go(o, t, 185, 0.16, 0.09);
      giay(o, t + 0.02, 0.02, 0.08, 2400, 1400);
    } else if (kind === 4) [0, 0.06].forEach((at, k) => chuong(o, t + at, k === 0 ? 2637 : 3520, 0.025, 0.25));
    else [0, 0.13].forEach((at, k) => sao(o, t + at, note(k === 0 ? 12 : 14), 0.1, 0.05));
  }

  /**
   * C10: one id's sound (src/view/sound-map.ts): its real file when the manifest lists one (a key's pitch rises a semitone a
   * letter, the code only bends it), else the code-made sound it had (SYNTH); an id with neither is silent. Boss warnings are never capped.
   */
  private play(id: string, t: number, now: number, event: RareEvent | null, w: World | null): void {
    const cap = id.startsWith("call-") ? "call" : id; // the call alerts share theirs
    if (CAPS[cap] !== undefined && !this.room((this.last.caps[cap] ??= []), now, CAPS[cap]!)) return;
    const s = event?.t === "wordKey" && w !== null ? w.words.slotOf(event.word) : -1;
    const step = id === "key-right" ? Math.min(12, s >= 0 ? w!.words.typed[s]! : 8) : 0;
    if (this.files?.play(id, this.out[busOf(id)], t, 2 ** (step / 12))) return;
    const kind = CALL_IDS.indexOf(id);
    if (kind >= 0) return this.alert(kind, t);
    SYNTH[id]?.(this.out[busOf(id)], t, { e: (event ?? {}) as Partial<Record<string, number | string>>, step, chain: w?.typing.chain ?? 0, left: this.last.left });
  }

  /** This frame's rare events and the combat ring since the last call, each through its sound ids (sound-map.ts). */
  read(events: readonly RareEvent[], w: World, now: number): void {
    const ring = w.events.ring;
    const from = Math.max(this.cursor, ring.written - ring.size);
    this.cursor = ring.written;
    if (this.ctx === null || this.quiet) return;
    const t = this.ctx.currentTime;
    for (const event of events) {
      if (event.t === "phase") {
        if (event.phase === this.phase) continue;
        this.phase = event.phase;
      }
      for (const id of eventSounds(event)) this.play(id, t, now, event, w);
    }
    // At most 2 blasts and 3 ink puffs a frame; a leak's gong 0.8 s apart.
    const frame: Record<string, number> = { blast: 2, "ink-puff": 3 };
    for (let index = from; index < ring.written; index += 1) {
      const slot = index % ring.size;
      const id = ringSound(ring.kind[slot]!, ring.value[slot]!);
      if (id === null || (frame[id] !== undefined && frame[id]-- <= 0)) continue;
      if (id === "leak" && now - this.last.leak <= 800) continue;
      if (id === "leak") this.last.leak = now;
      this.play(id, t, now, null, w);
    }
  }
}

const CALL_IDS = ["call-power", "call-build", "call-harvest", "call-chop", "call-mine", "call-quiz"];
type Cue = { e: Partial<Record<string, number | string>>; step: number; chain: number; left: number };
const span = (q: Cue): number => ((q.e["end"] as number) - (q.e["tick"] as number)) / TICK_HZ;
/** The code-made sound of each id that had one before C10 (sound-map.ts SOUND_IDS.made); the new ids have none. */
const SYNTH: Readonly<Record<string, (o: Out, t: number, q: Cue) => void>> = {
  "key-wrong": (o, t) => go(o, t, 150, 0.04, 0.045),
  "key-right": (o, t, q) => go(o, t, 880 * 2 ** (q.step / 12), 0.08, 0.028),
  "word-hit": (o, t, q) => tranh(o, t, note(q.e["grade"] === "sloppy" ? 4 : 5 + Math.min(5, chainTier(q.chain) + 1)), q.e["grade"] === "sloppy" ? 0.07 : q.e["grade"] === "ok" ? 0.11 : 0.14, q.e["grade"] === "flash"),
  "word-hit-bell": (o, t) => chuong(o, t + 0.02, 2093, 0.03, 0.6),
  "chain-callout": (o, t) => [0, 0.12, 0.24].forEach((at, k) => sao(o, t + at, note(10 + k), 0.13, 0.05)),
  "night-fall": (o, t) => [[0, 0.32, 0.5].forEach((at) => trong(o, t + at, 0.4, 110)), chuong(o, t + 0.05, 98, 0.16, 3)],
  dawn: (o, t) => [0, 0.2, 0.4].forEach((at, k) => sao(o, t + at, note(7 + 2 * k), 0.25, 0.05)),
  // A direct word lands (BUILD_1B §9.2): a drum's thump (Ngắt); a low bronze stroke and a knock (Neo); stone grinding over a low blow (Phá Khiên, R3).
  "direct-break": (o, t) => trong(o, t, 0.35, 180),
  "direct-pin": (o, t) => [chuong(o, t, 147, 0.14, 1.6), go(o, t + 0.04, 260, 0.22, 0.08)],
  "direct-shield": (o, t) => [go(o, t, 95, 0.45, 0.14), giay(o, t + 0.02, 0.14, 0.45, 1400, 260), rumble(o, t + 0.05, 0.5, 0.25)],
  "helper-panic": (o, t) => [0, 0.1].forEach((at) => go(o, t + at, 1250, 0.05, 0.05)), // two quick high knocks (test pass 27/10)
  defeat: (o, t) => [chuong(o, t, 82.4, 0.2, 3.5), [0, 0.35, 0.7].forEach((at, k) => sao(o, t + 0.2 + at, note(7 - 2 * k), 0.4, 0.05))],
  "wordshot-fire": (o, t) => [giay(o, t, 0.07, 0.15, 4200, 1100), go(o, t, 1400, 0.03, 0.02)],
  "arrow-fire": (o, t) => giay(o, t, 0.018, 0.06, 2600, 1500),
  blast: (o, t) => [trong(o, t, 0.24, 70), giay(o, t, 0.05, 0.25, 1300, 300)],
  "ink-puff": (o, t) => giay(o, t, 0.03, 0.12, 1900, 600),
  coin: (o, t) => chuong(o, t + 0.03, 3136, 0.012, 0.3),
  leak: (o, t) => chuong(o, t, 220, 0.1, 1.2),
  // Mộc Tinh (BUILD_1B §13.2).
  "boss-warn": (o, t) => [0, 0.42].forEach((at) => go(o, t + at, 110, 0.35, 0.22)),
  "boss-lull": (o, t) => [rumble(o, t, 12, 0.3), [0, 3, 6, 9, 10.5, 11.2, 11.7].forEach((at) => trong(o, t + at, 0.35, 70))],
  "boss-emerge": (o, t) => [rumble(o, t, 0.35, 0.5), roar(o, t + 0.2, 0.35)],
  "boss-phase": (o, t) => [rumble(o, t, 0.35, 0.5), roar(o, t + 0.2, 0.35), chuong(o, t + 0.1, 1318.5, 0.08, 1.6), chuong(o, t + 0.3, 98, 0.18, 2.4)],
  "boss-roots": (o, t, q) => giay(o, t, 0.12, span(q), 500, 180),
  "boss-roots-hit": (o, t) => [go(o, t, 160, 0.4, 0.09), giay(o, t + 0.03, 0.08, 0.3, 900, 300)],
  "boss-slam": (o, t) => [giay(o, t, 0.14, 0.18, 2600, 500), trong(o, t + 0.12, 0.45, 60)],
  "boss-drain": (o, t, q) => [rumble(o, t, span(q), 0.25), giay(o, t, 0.1, span(q), 180, 520)], // R3: Rễ hút sinh khí draws in, then a knock and a low bell
  "boss-drain-hit": (o, t) => [go(o, t, 90, 0.45, 0.2), chuong(o, t + 0.05, 146.8, 0.08, 2.2)],
  "boss-retreat": (o, t) => [[0, 0.25, 0.5, 0.75].forEach((at, k) => tranh(o, t + at, note(7 - 2 * k), 0.12)), giay(o, t + 0.3, 0.06, 1.2, 1800, 700), Array.from({ length: 8 }, (_, k) => chuong(o, t + 1.2 + k * 0.08, note(5 + k) * 4, 0.02, 0.3))],
  "day-countdown": (o, t, q) => go(o, t, q.left <= 3 ? 1180 : 880, 0.07, 0.04),
  "ui-move": (o, t) => go(o, t, 980, 0.05, 0.03),
  "ui-pick": (o, t) => [go(o, t, 620, 0.09, 0.05), chuong(o, t + 0.04, 1318.5, 0.035, 0.7)],
  "ui-off": (o, t) => go(o, t, 170, 0.05, 0.05),
  "ui-lamp": (o, t) => [giay(o, t, 0.02, 0.22, 900, 2600), chuong(o, t + 0.12, 2093 * (0.9 + Math.random() * 0.2), 0.012, 0.6)],
};

/** Sounds a second at most (the rest are dropped): the call alerts, arrows, ink puffs, coins. */
const CAPS: Readonly<Record<string, number>> = {
  call: ALERTS_PER_S, "arrow-fire": 4, "ink-puff": 8, coin: 3,
};

/** Real files (AUDIO_PIPELINE §11, manifest v2 or v1), decoded once sound starts; none are listed yet. */
class FileBank {
  private readonly buffers = new Map<string, AudioBuffer[]>();

  constructor(ctx: AudioContext) {
    const base = "/assets/typing-defense/audio/";
    void fetch(base + "manifest.json").then((r) => (r.ok ? r.json() : null)).then(async (m: { sounds?: Record<string, string[] | { files?: string[] }> } | null) => {
      for (const [id, entry] of Object.entries(m?.sounds ?? {})) {
        const files = Array.isArray(entry) ? entry : (entry.files ?? []);
        const list = await Promise.all(files.map((file) => fetch(base + file).then((r) => r.arrayBuffer()).then((data) => ctx.decodeAudioData(data)).catch(() => null)));
        const ok = list.filter((b): b is AudioBuffer => b !== null);
        if (ok.length > 0) this.buffers.set(id, ok);
      }
    }).catch(() => undefined);
  }

  /** Plays one of id's files on `out` at `rate`; false when it has none. */
  play(id: string, out: Out, t: number, rate = 1): boolean {
    const list = this.buffers.get(id);
    if (list === undefined) return false;
    const source = new AudioBufferSourceNode(out.ctx, { buffer: list[Math.floor(Math.random() * list.length)]!, playbackRate: rate });
    source.connect(out.to);
    source.start(t);
    return true;
  }
}
