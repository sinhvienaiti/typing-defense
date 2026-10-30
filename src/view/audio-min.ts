/**
 * Lời Gọi's sound made in code (docs/td/BUILD_NOW.md §5.5, TK 24; SPLIT_PLAN §1.2), no files: bamboo, wood, bronze
 * bells and paper (folk.ts), the list and the prompts for the real files in docs/audio/THEME_SOUND_LIST.md. Buses (TK
 * 24.2): music (ducked under a spoken word), typing (its own light compressor), world, ui (the Interface volume, ticket
 * 193), keys (the original Bamboo keys at Master × Keyboard volume, silent with any other keyboard sound: a Firefly set
 * plays in app/quick.ts), a shared reverb, master and a limiter; the settings set master, music, effects and interface.
 * A call that lights up rings its kind's alert (power a trống cơm pair, build two bamboo taps, harvest a high bell, chop
 * a low wood knock, mine a small clink, quiz a sáo call; at most 3 a second); with Bamboo chosen, a right key is a
 * bamboo tick a semitone higher per letter, a wrong or stray one a dull "tóc" 12 dB lower; a finished word a đàn tranh
 * note on the ngũ cung by chain tier (Perfect and Flash add a bell). Word Shots whoosh, blasts thud, the ink folk puff
 * like paper, a leak rings a gong; night and dawn have their own calls. The title adds far villagers calling across
 * the fields. Mộc Tinh (BUILD_1B §13.2): day 5's two low wood beats; the lull's
 * swelling rumble and a low drum every 3 s, faster at the end; the ground breaking and a roar as it rises and staggers;
 * Rễ Trồi's creak through its warning, a wooden "cộp" as it lands; Quật cành's whoosh and thud; the stagger's bell and
 * gong; the retreat's falling chord and leaves; the chest's coins up the scale. A direct word breaking its mechanic: a
 * drum's thump (Ngắt), a bronze stroke and knock (Neo), a stone dome cracking (Phá Khiên).
 */
import { TICK_HZ } from "../content/rules";
import { FX, type RareEvent } from "../sim/events";
import { PROJECTILE } from "../sim/stores/projectiles";
import { chainTier } from "../sim/systems/chain";
import type { World } from "../sim/world";
import { KEY } from "../typing/router";
import { BUILT_IN_KEYS, type Settings } from "../app/prefs";
import { chuong, giay, go, goi, note, reverbTail, roar, rumble, sao, tranh, trong, type Out } from "./folk";
import { FolkMusic } from "./music";

const ALERTS_PER_S = 3;
/** Each bus's gain at volume 100 (the settings square the slider: half the slider is a quarter of the power). */
const BASE = { music: 1, sfx: 1.4 } as const;
type Bus = "typing" | "world" | "ui" | "keys";
/** The title's sounds: a menu step, a choice, a closed entry, a lantern lighting. */
export type UiSound = "move" | "pick" | "off" | "lamp";

export class TypingAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private duck!: GainNode;
  private sfx!: GainNode;
  private uiBus!: GainNode;
  private keyBus!: GainNode;
  private verb!: ConvolverNode;
  private readonly out = {} as Record<Bus, Out>;
  private music: FolkMusic | null = null;
  private alerts: number[] = [];
  private cursor = 0;
  private phase = "";
  /** Real-time stamps (ms) of the last sounds a cap counts. */
  private readonly last = { arrow: [] as number[], puff: [] as number[], coin: [] as number[], leak: -1e9, caller: 0, left: -1 };

  constructor(private settings: Settings) {}

  get muted(): boolean {
    return this.settings.muted;
  }

  set muted(on: boolean) {
    this.settings.muted = on;
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
    this.uiBus = new GainNode(ctx);
    this.uiBus.connect(this.master);
    this.keyBus = new GainNode(ctx);
    this.keyBus.connect(limiter);
    this.out.ui = { ctx, to: this.uiBus };
    this.out.keys = { ctx, to: this.keyBus };
    this.music = new FolkMusic(ctx, this.duck);
    this.apply(this.settings);
  }

  /** Volumes from the settings (0–100), squared; mute holds the master at 0. The Bamboo keys: linear, Master × Keyboard. */
  apply(settings: Settings): void {
    this.settings = settings;
    if (this.ctx === null) return;
    const t = this.ctx.currentTime;
    const v = (value: number, base = 1): number => base * (value / 100) ** 2;
    this.master.gain.setTargetAtTime(settings.muted ? 0 : v(settings.master), t, 0.03);
    this.musicBus.gain.setTargetAtTime(v(settings.music, BASE.music), t, 0.03);
    this.sfx.gain.setTargetAtTime(v(settings.sfx, BASE.sfx), t, 0.03);
    this.uiBus.gain.setTargetAtTime(v(settings.ui, BASE.sfx), t, 0.03);
    this.keyBus.gain.setTargetAtTime(settings.muted || settings.keyboard !== BUILT_IN_KEYS ? 0 : settings.master * settings.keyboardVolume / 10000, t, 0.03);
  }

  /** The original bamboo keys, independently of the combat and completion sounds. */
  key(space = false, wrong = false, step = 0): void {
    if (this.ctx === null || this.settings.keyboard !== BUILT_IN_KEYS || this.settings.muted || this.settings.master === 0 || this.settings.keyboardVolume === 0) return;
    go(this.out.keys, this.ctx.currentTime, wrong ? 150 : space ? 620 : 880 * 2 ** (Math.min(12, step) / 12), wrong ? 0.04 : 0.08, wrong ? 0.045 : space ? 0.05 : 0.028);
  }

  /** Slider samples use the same channel as play. */
  preview(group: string): void {
    this.resume();
    if (group === "master") go({ ctx: this.ctx!, to: this.master }, this.ctx!.currentTime, 620, 0.09, 0.05);
    else if (group === "ui") this.ui("pick");
    else if (group === "keyboard") this.key();
    else if (group === "music") tranh({ ctx: this.ctx!, to: this.duck }, this.ctx!.currentTime, note(5), 0.1);
    else go(this.out.world, this.ctx!.currentTime, 620, 0.09, 0.05);
  }

  /**
   * Each frame: the music's layer (calm on the title and by day, tension at night), the music ducked under a
   * word being spoken (TK 24.2 PRONUNCIATION_DUCK: −9 dB in 0.12 s, back in 0.5 s), on the title a villager
   * calling every 3–7 s from left or right; a wood-block knock each of the day's last 10 s, higher for the last 3 (the early call).
   */
  frame(w: World | null, now: number): void {
    if (this.ctx === null || this.music === null) return;
    const left = w !== null && w.phase === "day" ? Math.ceil((w.phaseEnd - w.tick) / TICK_HZ) : -1;
    if (left !== this.last.left && left > 0 && left <= 10) go(this.out.ui, this.ctx.currentTime, left <= 3 ? 1180 : 880, 0.07, 0.04);
    this.last.left = left;
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

  /** Mộc Tinh's sounds (BUILD_1B §13.2); a warning's sound is never capped. */
  private boss(event: RareEvent, t: number): void {
    const world = this.out.world;
    if (event.t === "bossWarn") [0, 0.42].forEach((at) => go(world, t + at, 110, 0.35, 0.22));
    else if (event.t === "bossLull") {
      rumble(world, t, 12, 0.3);
      [0, 3, 6, 9, 10.5, 11.2, 11.7].forEach((at) => trong(world, t + at, 0.35, 70));
    } else if (event.t === "bossEmerge" || event.t === "bossPhase") {
      rumble(world, t, 0.35, 0.5);
      roar(world, t + 0.2, 0.35);
      if (event.t === "bossPhase") [chuong(world, t + 0.1, 1318.5, 0.08, 1.6), chuong(world, t + 0.3, 98, 0.18, 2.4)];
    } else if (event.t === "bossStrike" && !event.hit && event.move === "roots") giay(world, t, 0.12, (event.end - event.tick) / 60, 500, 180);
    else if (event.t === "bossStrike" && event.hit && event.move === "roots") [go(world, t, 160, 0.4, 0.09), giay(world, t + 0.03, 0.08, 0.3, 900, 300)];
    else if (event.t === "bossStrike" && event.hit && (event.move === "slam" || event.move === "keep")) [giay(world, t, 0.14, 0.18, 2600, 500), trong(world, t + 0.12, 0.45, 60)];
    else if (event.t === "bossStrike" && event.move === "drain") event.hit ? [go(world, t, 90, 0.45, 0.2), chuong(world, t + 0.05, 146.8, 0.08, 2.2)] : [rumble(world, t, (event.end - event.tick) / TICK_HZ, 0.25), giay(world, t, 0.1, (event.end - event.tick) / TICK_HZ, 180, 520)]; // R3: Rễ hút sinh khí draws in, then a knock and a low bell
    else if (event.t === "bossRetreat") {
      [0, 0.25, 0.5, 0.75].forEach((at, k) => tranh(world, t + at, note(7 - 2 * k), 0.12));
      giay(world, t + 0.3, 0.06, 1.2, 1800, 700);
      for (let k = 0; k < 8; k += 1) chuong(world, t + 1.2 + k * 0.08, note(5 + k) * 4, 0.02, 0.3);
    }
  }

  /** This frame's rare events and the combat ring since the last call. */
  read(events: readonly RareEvent[], w: World, now: number): void {
    const ring = w.events.ring;
    const from = Math.max(this.cursor, ring.written - ring.size);
    this.cursor = ring.written;
    if (this.ctx === null || this.settings.muted) return;
    const t = this.ctx.currentTime;
    const typing = this.out.typing;
    const world = this.out.world;
    for (const event of events) {
      if (event.t === "call" && event.state === "bright") {
        if (this.room(this.alerts, now, ALERTS_PER_S)) this.alert(event.kind, t);
      } else if (event.t === "wordKey") {
        const s = w.words.slotOf(event.word);
        if (event.result !== KEY.group) this.key(false, event.result === KEY.wrong || event.result === KEY.stray, s >= 0 ? w.words.typed[s]! : 8);
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
      } else if (event.t === "direct" && event.ok) {
        // A direct word lands (BUILD_1B §9.2): the drum breaks with a skin's thump; Neo pins the pack with a low bronze stroke
        // and a knock; the Troll's dome cracks, stone grinding over a low wooden blow (R3).
        if (event.verb === 0) trong(world, t, 0.35, 180);
        else if (event.verb === 1) [chuong(world, t, 147, 0.14, 1.6), go(world, t + 0.04, 260, 0.22, 0.08)];
        else [go(world, t, 95, 0.45, 0.14), giay(world, t + 0.02, 0.14, 0.45, 1400, 260), rumble(world, t + 0.05, 0.5, 0.25)];
      } else if (event.t === "panic") [0, 0.1].forEach((at) => go(world, t + at, 1250, 0.05, 0.05)); // a helper runs: two quick high knocks (test pass 27/10)
      else if (event.t.startsWith("boss")) this.boss(event, t);
      else if (event.t === "defeat") {
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
