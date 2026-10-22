/**
 * Lời Gọi's sound made in code (docs/td/BUILD_NOW.md §5.5, TK 24; SPLIT_PLAN §1.2), no files: bamboo, wood,
 * bronze bells and paper (folk.ts), the list and the prompts for the real files in
 * docs/audio/THEME_SOUND_LIST.md. Buses (TK 24.2): music (ducked under a spoken word), typing (its own light
 * compressor), world, ui, a shared reverb, master and a limiter; the settings set master, music and effects.
 * A call that lights up rings its kind's alert (power a trống cơm pair, build two bamboo taps, harvest a high
 * bell, chop a low wood knock, mine a small clink, quiz a sáo call; at most 3 a second); a right key is a
 * bamboo tick a semitone higher per letter, a wrong or stray one a dull "tóc" 12 dB lower; a finished word a
 * đàn tranh note on the ngũ cung by chain tier (Perfect and Flash add a bell). Word Shots whoosh, blasts thud,
 * the ink folk puff like paper, a leak rings a gong; night and dawn have their own calls. The title adds far
 * villagers calling across the fields.
 */
import { FX, type RareEvent } from "../sim/events";
import { PROJECTILE } from "../sim/stores/projectiles";
import { chainTier } from "../sim/systems/chain";
import type { World } from "../sim/world";
import { KEY } from "../typing/router";
import type { Settings } from "../ui/settings";
import { chuong, giay, go, goi, note, reverbTail, sao, tranh, trong, type Out } from "./folk";
import { FolkMusic } from "./music";

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
  private alerts: number[] = [];
  private cursor = 0;
  private phase = "";
  /** Real-time stamps (ms) of the last sounds a cap counts. */
  private readonly last = { arrow: [] as number[], puff: [] as number[], coin: [] as number[], leak: -1e9, caller: 0 };

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
   * calling every 3–7 s from left or right.
   */
  frame(w: World | null, now: number): void {
    if (this.ctx === null || this.music === null) return;
    this.music.set(w !== null && w.phase === "night");
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
    if (this.ctx === null) return;
    const o = this.out.ui;
    const t = this.ctx.currentTime;
    if (sound === "move") go(o, t, 980, 0.05, 0.03);
    else if (sound === "pick") {
      go(o, t, 620, 0.09, 0.05);
      chuong(o, t + 0.04, 1318.5, 0.035, 0.7);
    } else if (sound === "off") go(o, t, 170, 0.05, 0.05);
    else {
      giay(o, t, 0.02, 0.22, 900, 2600);
      chuong(o, t + 0.12, 2093 * (0.9 + Math.random() * 0.2), 0.012, 0.6);
    }
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

  /** This frame's rare events and the combat ring since the last call. */
  read(events: readonly RareEvent[], w: World, now: number): void {
    const ring = w.events.ring;
    const from = Math.max(this.cursor, ring.written - ring.size);
    this.cursor = ring.written;
    if (this.ctx === null || this.quiet) return;
    const t = this.ctx.currentTime;
    const typing = this.out.typing;
    const world = this.out.world;
    for (const event of events) {
      if (event.t === "call" && event.state === "bright") {
        if (this.room(this.alerts, now, ALERTS_PER_S)) this.alert(event.kind, t);
      } else if (event.t === "wordKey") {
        const s = w.words.slotOf(event.word);
        if (event.result === KEY.wrong || event.result === KEY.stray) go(typing, t, 150, 0.04, 0.045);
        else if (event.result !== KEY.group) go(typing, t, 880 * 2 ** (Math.min(12, s >= 0 ? w.words.typed[s]! : 8) / 12), 0.08, 0.028);
      } else if (event.t === "wordHit") {
        const step = event.grade === "sloppy" ? 4 : 5 + Math.min(5, chainTier(w.typing.chain) + 1);
        tranh(typing, t, note(step), event.grade === "sloppy" ? 0.07 : event.grade === "ok" ? 0.11 : 0.14, event.grade === "flash");
        if (event.grade === "perfect" || event.grade === "flash") chuong(typing, t + 0.02, 2093, 0.03, 0.6);
      } else if (event.t === "chain" && event.callout) [0, 0.12, 0.24].forEach((at, k) => sao(typing, t + at, note(10 + k), 0.13, 0.05));
      else if (event.t === "phase" && event.phase !== this.phase) {
        this.phase = event.phase;
        if (event.phase === "night") {
          [0, 0.32, 0.5].forEach((at) => trong(world, t + at, 0.4, 110));
          chuong(world, t + 0.05, 98, 0.16, 3);
        } else if (event.phase === "dawn") [0, 0.2, 0.4].forEach((at, k) => sao(world, t + at, note(7 + 2 * k), 0.25, 0.05));
      } else if (event.t === "defeat") {
        chuong(world, t, 82.4, 0.2, 3.5);
        [0, 0.35, 0.7].forEach((at, k) => sao(world, t + 0.2 + at, note(7 - 2 * k), 0.4, 0.05));
      }
    }
    let blasts = 0;
    let puffs = 0;
    for (let index = from; index < ring.written; index += 1) {
      const slot = index % ring.size;
      const kind = ring.kind[slot]!;
      if (kind === FX.fire && ring.value[slot] === PROJECTILE.wordShot) {
        giay(world, t, 0.07, 0.15, 4200, 1100);
        go(world, t, 1400, 0.03, 0.02);
      } else if (kind === FX.fire && ring.value[slot] === PROJECTILE.arrow && this.room(this.last.arrow, now, 4)) giay(world, t, 0.018, 0.06, 2600, 1500);
      else if (kind === FX.burst && blasts++ < 2) {
        trong(world, t, 0.24, 70);
        giay(world, t, 0.05, 0.25, 1300, 300);
      } else if (kind === FX.death && puffs++ < 3 && this.room(this.last.puff, now, 8)) giay(world, t, 0.03, 0.12, 1900, 600);
      else if (kind === FX.coin && this.room(this.last.coin, now, 3)) chuong(world, t + 0.03, 3136, 0.012, 0.3);
      else if (kind === FX.leak && now - this.last.leak > 800) {
        this.last.leak = now;
        chuong(world, t, 220, 0.1, 1.2);
      }
    }
  }
}
