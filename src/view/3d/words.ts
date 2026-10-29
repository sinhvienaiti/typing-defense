/**
 * The word cards on map 1's 3D view and their typing feel there (1C step C10, docs/td/BUILD_1C_MAP1.md §7, §8;
 * TYPING_BREAK_STUDY §5.3; ART_DIRECTION §2.5, §8.2; VFX_STANDARD §3). Effects go to fx-pool.ts's two layers.
 * - Anchors: a call's cards stand 0.6 m over its house's FX_top (else over the head of who calls) through the camera, the
 *   lane packer (words/lanes.ts) unchanged; its letters fly into the house's FX_core.
 * - A right key: its letter leaves the card in jade over a dark copy, trails gold motes (the woven thread) and flies into
 *   the core, which glows brighter as the word fills (§3.3 a key: R at the card and the source, F the charge). The lock
 *   rings the caller's ground. A slip glints cinnabar and drops an ink drop that splashes on the ground.
 * - A word typed: its letters burst into the caller, which answers with a flash, a ring, motes and a dark puff. A power
 *   word's shot (Word Shot, the Fort's volley) has five phases: A the charge; R at the muzzle the same frame (a flash with
 *   a white core ≤ 30 %, a gold halo, a ring, sparks, the house's kick, dark smoke 2–3 frames later); T a jade head over a
 *   dark one, the word's own letters trailing; I a flash, a ground ring of the splash radius, sparks, the letters
 *   scattering, smoke; F embers and a scorch. A shot with no target fizzles in smoke.
 * - The chain: each step threads beads from the last helped house to this one in 0.45 s and pops its count by the card;
 *   a tier up and a callout burst bigger; letters, sparks and the cards' stamps grow with the tier.
 * - A dark plate under each card, so the ground there reads ≤ 0.6 luma (§2.5).
 * It reads the world and never changes it; its random stream is its own, seeded (§3.1 rule 4). Reduced motion: fewer,
 * smaller bits and no house kick (§3.8).
 */
import * as THREE from "three";
import type { MapDef } from "../../content/types";
import { FX, type RareEvent } from "../../sim/events";
import { CALL_KIND } from "../../sim/stores/calls";
import { PROJECTILE } from "../../sim/stores/projectiles";
import { chainTier } from "../../sim/systems/chain";
import type { World } from "../../sim/world";
import { wordText } from "../../typing/decks";
import { KEY } from "../../typing/router";
import type { CardFeel, CardView } from "../words/cards";
import { FxPool, SHAPE, type Bit, type Rgb } from "./fx-pool";
import { heightAt } from "./ground";
import type { Houses } from "./houses";
import type { Stage } from "./stage";

const JADE: Rgb = [0.1, 0.86, 0.72];
const HOT: Rgb = [0.6, 1, 0.92];
const GOLD: Rgb = [1, 0.76, 0.33];
const EMBER: Rgb = [1, 0.58, 0.2];
const INK: Rgb = [0.03, 0.07, 0.07];
const SEAL: Rgb = [0.9, 0.24, 0.12];
/** Cards stand this far over FX_top; heads of who calls when it is no house (villager, helper, Draconis, an enemy). */
const OVER_M = 0.6;
const HEAD_M = { villager: 1.8, helper: 1.4, hero: 3, enemy: 1.8 } as const;
const ONE_FRAME = 0.001;
/** Flashes of a card's own frame (TYPING_BREAK_STUDY T3): the lock bursts white-jade, a slip turns it cinnabar, a typed word white-gold. */
const LOCK: Keyframe = { boxShadow: "0 0 0 4px #fff, 0 0 28px 10px rgba(25, 201, 168, 0.9)", borderColor: "#7ff5e0" };
const SLIP: Keyframe = { borderColor: "#c23b22", color: "#c23b22", boxShadow: "0 0 0 3px rgba(194, 59, 34, 0.9), 0 0 18px 5px rgba(194, 59, 34, 0.6)" };
/** A one-shot flash back to the card's CSS look (Web Animations: it restarts every time). */
const frameFlash = (el: HTMLElement, from: Keyframe, ms: number, hold = 0): void => void el.animate?.([from, { ...from, offset: hold }, {}], { duration: ms, easing: "cubic-bezier(0.1, 0.8, 0.2, 1)" });
const BEADS = 16;

type Charge = { share: number; at: number; core: THREE.Vector3; tier: number };
/** Where a call's letters go, kept by call id: a one-word call is gone by the time its word is read. */
type Spot = { core: THREE.Vector3; kind: number; b: number; radius: number };
type Shot = { born: number; x0: number; z0: number; y0: number; total: number; word: string; k: number; x: number; y: number; z: number; splash: number; bolt: boolean; frame: number; call: number };
/** A typed card's letter flying out in front of it (DOM, over the card), `t` ms after `at`. */
type Fly = { el: HTMLElement; at: number; x: number; y: number; dx: number; dy: number };
/** The edge tray (TYPING_DEFENSE_DESIGN, "Khay mép"): a call off screen stands at the edge towards it, ≤ 2 an edge, ≤ 6 in all. */
const TRAY = { margin: 24, top: 72, perEdge: 2, max: 6 } as const;

export class WordFeel implements CardFeel {
  readonly pool = new FxPool(480);
  private w: World | null = null;
  private seed = 20261029;
  private readonly soft = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  private readonly charges = new Map<number, Charge>();
  private readonly spots = new Map<number, Spot>();
  private readonly shots = new Map<number, Shot>();
  /** Buildings (by id) whose power word was typed this tick: their volley carries the word (the Fort's bolts). */
  private readonly fired = new Map<number, { word: string; tick: number; call: number }>();
  private plates: { x: number; y: number; w: number; h: number; mean: boolean }[] = [];
  private last: THREE.Vector3 | null = null;
  private lastCard: CardView | null = null;
  private tag: { el: HTMLElement; at: number; x: number; y: number; half: number; h: number; w: number; side: number; card: CardView | null; call: number; seen?: number } | null = null;
  private readonly flies: Fly[] = [];
  /** The last release (ms) and which way its shot runs on screen (−1 left, 1 right): the chain count stands on the other side. */
  private shotAt = -1e9;
  private shotSide = 0;
  /** This frame's edge tray: calls (by id) at each edge (0 left, 1 right, 2 top, 3 bottom), and the last frame's. */
  private tray: number[][] = [[], [], [], []];
  private trayLast = new Map<number, number>();
  private cursor = -1;
  private downAt = -1;
  /** Frames drawn, the count at the last keydown, and the last key's keydown → effect in ms and in frames (1: the next one drawn). */
  private frames = 0;
  private downFrame = 0;
  private keyMs = -1;
  private keyFrames = -1;
  /** The last word's keydown → the caller's first flash (T9), ms. */
  private answerMs = -1;
  /** The last shot's heading (world x, z): the scenario keeps a shot the cards do not hide (towards the camera). */
  private heading = [0, 0];
  /** Screen points (CSS px) of the last release and impact (scenario td-1c-words measures its flashes there). */
  private marks = { release: [0, 0], impact: [0, 0], struck: [0, 0] };
  private readonly v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

  constructor(private readonly stage: Stage, private readonly houses: Houses, private readonly map: MapDef) {
    addEventListener("keydown", this.down, { capture: true });
  }

  private readonly down = (event: KeyboardEvent): void => void ([this.downAt, this.downFrame] = [event.timeStamp, this.frames]);

  private rnd(lo = 0, hi = 1): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return lo + ((hi - lo) * this.seed) / 2147483647;
  }

  /** How many of `n` bits to start (reduced motion: 0.6 of them). */
  private n(count: number): number {
    return Math.max(1, Math.round(count * (this.soft ? 0.6 : 1)));
  }

  /** The world point of call c: 0.6 m over its house's FX_top (`core`: its FX_core), else over the head of who calls. */
  private point(w: World, c: number, core: boolean, out: THREE.Vector3): THREE.Vector3 {
    const C = w.calls;
    const [x, z] = [C.x[c]!, C.z[c]!];
    const ground = heightAt(this.map, x, z);
    const b = C.npc[c]! < 0 && C.agent[c]! < 0 && C.foe[c]! < 0 ? C.b[c]! : -1;
    if (b >= 0 && w.buildings.used[b] === 1) {
      const at = this.houses.point(w.buildings.id(b), core ? "FX_core" : "FX_top", out);
      if (at !== null) return core ? at : at.setY(at.y + OVER_M);
      const r = w.c.buildings[w.buildings.def[b]!]!.radius;
      return out.set(x, ground + (core ? r : 2 * r + OVER_M), z);
    }
    const head = C.foe[c]! >= 0 ? HEAD_M.enemy : C.agent[c]! === 0 ? HEAD_M.hero : C.agent[c]! > 0 ? HEAD_M.helper : HEAD_M.villager;
    return out.set(x, ground + (core ? head * 0.7 : head + OVER_M), z);
  }

  /**
   * CSS px where call c's cards stand (`core`: where its letters go). One off screen goes to the edge tray: the point where
   * the line from the screen's middle towards it meets the tray's frame, with its edge; over the tray's cap, edge −2 (unseen).
   */
  anchor(w: World, c: number, core: boolean, raw = false): { x: number; y: number; edge?: number } {
    this.spot(w, w.calls.id(c));
    const p = this.point(w, c, core, this.v[0]!);
    const s = this.stage.project(p.x, p.y, p.z);
    const { width, height } = this.stage.size;
    const behind = this.v[1]!.copy(p).applyMatrix4(this.stage.camera.matrixWorldInverse).z > 0;
    if (core || raw || (!behind && s.x >= 0 && s.x <= width && s.y >= 0 && s.y <= height)) return { x: s.x, y: s.y };
    const [mx, my] = [width / 2, height / 2];
    let [dx, dy] = [behind ? mx - s.x : s.x - mx, behind ? my - s.y : s.y - my];
    if (Math.abs(dx) + Math.abs(dy) < 1) dy = 1;
    const [hx, hy] = [mx - TRAY.margin, dy < 0 ? my - TRAY.top : height - TRAY.margin - my];
    const k = Math.min(hx / Math.max(1e-6, Math.abs(dx)), hy / Math.max(1e-6, Math.abs(dy)));
    const edge = k === hx / Math.max(1e-6, Math.abs(dx)) ? (dx < 0 ? 0 : 1) : dy < 0 ? 2 : 3;
    const id = w.calls.id(c);
    const list = this.tray[edge]!;
    if (!list.includes(id)) {
      if (list.length >= TRAY.perEdge || this.tray.reduce((n, l) => n + l.length, 0) >= TRAY.max) return { x: s.x, y: s.y, edge: -2 };
      list.push(id);
    }
    return { x: mx + dx * k, y: my + dy * k, edge };
  }

  /** The ground point of call `id` when it stands in the edge tray (a click there glides the camera to it), else null. */
  trayCall(id: number): { x: number; z: number } | null {
    const w = this.w;
    const c = w === null || id < 0 || !this.trayLast.has(id) ? -1 : w.calls.slotOf(id);
    return c < 0 ? null : { x: w!.calls.x[c]!, z: w!.calls.z[c]! };
  }

  /** Whether call `call`'s typed word keeps its meaning back: a Word Shot of its house is still in flight. */
  hold(call: number): boolean {
    for (const s of this.shots.values()) if (s.call === call) return true;
    for (const f of this.fired.values()) if (f.call === call) return true;
    return false;
  }

  /** The world point on the camera ray through CSS point (px, py), `depth` metres from the camera. */
  private ray(px: number, py: number, depth: number, out: THREE.Vector3): THREE.Vector3 {
    const camera = this.stage.camera;
    const { width, height } = this.stage.size;
    out.set((px / width) * 2 - 1, 1 - (py / height) * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    return out.multiplyScalar(depth).add(camera.position);
  }

  /** Metres a CSS px spans `depth` metres from the camera. */
  private metres(depth: number): number {
    return (2 * depth * Math.tan((this.stage.camera.fov * Math.PI) / 360)) / this.stage.size.height;
  }

  /** Call `id`'s spot: fresh while it lives, else the last one kept. */
  private spot(w: World, id: number): Spot | null {
    const c = w.calls.slotOf(id);
    if (c < 0) return this.spots.get(id) ?? null;
    const b = w.calls.npc[c]! < 0 && w.calls.agent[c]! < 0 && w.calls.foe[c]! < 0 ? w.calls.b[c]! : -1;
    const radius = b >= 0 && w.buildings.used[b] === 1 ? w.c.buildings[w.buildings.def[b]!]!.radius : 1;
    const spot = this.spots.get(id) ?? { core: new THREE.Vector3(), kind: 0, b: -1, radius: 1 };
    Object.assign(spot, { kind: w.calls.kind[c]!, b: b >= 0 ? w.buildings.id(b) : -1, radius });
    this.point(w, c, true, spot.core);
    if (this.spots.size > 64) this.spots.delete(this.spots.keys().next().value!);
    this.spots.set(id, spot);
    return spot;
  }

  /** Just under letter k of the card (so it shows from its first frame), at the depth of `core`. */
  private under(card: CardView, k: number, core: THREE.Vector3, out: THREE.Vector3, below = 0): THREE.Vector3 {
    const text = card.text;
    const share = (Math.max(0, k) + 0.5) / Math.max(1, card.word.length);
    const x = card.x - card.half + text.offsetLeft + text.offsetWidth * share;
    const depth = core.distanceTo(this.stage.camera.position);
    return this.ray(x, card.y + card.height + 4 + below / this.metres(depth), depth, out);
  }

  private glyph(word: string, k: number): number {
    const g = word.toLowerCase().charCodeAt(k) - 97;
    return g >= 0 && g < 26 ? g : -1;
  }

  /** A letter flying from `from` into `to` over `life` s: jade over a dark copy, gold motes behind. */
  private letter(from: THREE.Vector3, to: THREE.Vector3, g: number, size: number, life: number, tier: number, delay = 0, end: ((bit: Bit) => void) | null = null): void {
    const fly = { x: from.x, y: from.y, z: from.z, to: to.clone(), arc: 1.4, life, delay, turn: -0.14, spin: this.rnd(-2, 2) };
    if (g < 0) return void this.pool.add("glow", { ...fly, size: size * 0.6, rgb: JADE, hot: 0.4, trail: size * 0.25, end });
    this.pool.add("ink", { ...fly, size: size * 1.15, rgb: INK, alpha: 0.65, shape: SHAPE.letter, glyph: g });
    this.pool.add("glow", { ...fly, size: size * 1.7, rgb: JADE, alpha: 0.45 });
    this.pool.add("glow", { ...fly, size, rgb: tier >= 3 ? GOLD : JADE, hot: 0.45 + 0.1 * tier, shape: SHAPE.letter, glyph: g, trail: size * 0.3, end });
  }

  /** Sparks out of `at`, each starting `out` metres along its way (so a flash's sparks never pile into a white core). */
  private sparks(at: THREE.Vector3, count: number, speed: [number, number], dir: THREE.Vector3 | null, o: Partial<Bit> = {}, out = 0): void {
    for (let k = 0; k < this.n(count); k += 1) {
      const [a, up] = [this.rnd(0, Math.PI * 2), this.rnd(0.2, 1)];
      const v = dir === null ? new THREE.Vector3(Math.cos(a) * (1 - up * 0.5), up, Math.sin(a) * (1 - up * 0.5)) : dir.clone().add(new THREE.Vector3(this.rnd(-0.5, 0.5), this.rnd(-0.3, 0.5), this.rnd(-0.5, 0.5))).normalize();
      const [x, y, z] = [at.x + v.x * out, at.y + v.y * out, at.z + v.z * out];
      v.multiplyScalar(this.rnd(speed[0], speed[1]));
      this.pool.add("glow", { x, y, z, vx: v.x, vy: v.y, vz: v.z, size: 0.3, length: this.rnd(1.4, 2.6), life: this.rnd(0.16, 0.28), drag: 3, rgb: k % 3 === 0 ? GOLD : HOT, hot: 0.7, shape: SHAPE.spark, ...o });
    }
  }

  private smoke(at: THREE.Vector3, count: number, size: number, life: number, alpha = 0.45): void {
    for (let k = 0; k < this.n(count); k += 1) {
      this.pool.add("ink", { x: at.x + this.rnd(-0.5, 0.5), y: at.y + this.rnd(-0.2, 0.4), z: at.z + this.rnd(-0.5, 0.5), vy: this.rnd(0.8, 1.6), vx: this.rnd(-0.5, 0.5), drag: 1.2, size: size * this.rnd(0.8, 1.2), grow: 1.1, life: life * this.rnd(0.8, 1.2), delay: this.rnd(0.035, 0.06), rgb: INK, alpha, shape: SHAPE.smoke, hot: this.rnd(0, 9) });
    }
  }

  /** A hot flash: a jade (or gold) body with its white core, a wider gold halo, a dark puff under both. */
  private flash(at: THREE.Vector3, size: number, rgb: Rgb, life = 0.1, dark = 0.55): void {
    // The dark puff first, so the body reads jade (or gold) over a bright roof; only the middle 30 % turns white (§3.5).
    this.pool.add("ink", { x: at.x, y: at.y, z: at.z, size: size * 1.4, life: life * 2.2, rgb: INK, alpha: dark });
    this.pool.add("glow", { x: at.x, y: at.y, z: at.z, size, life, rgb, hot: 0.15, alpha: 0.5 });
    this.pool.add("glow", { x: at.x, y: at.y, z: at.z, size: size * 1.9, life: life * 1.7, rgb: GOLD, alpha: 0.24 });
  }

  private ring(at: THREE.Vector3, radius: number, rgb: Rgb, life: number, flat: boolean, from = 0.45, hot = 0.45): void {
    const size = (2 * radius) / 0.8; // the ring's band sits at 0.8 of the quad's half
    this.pool.add("glow", { x: at.x, y: flat ? heightAt(this.map, at.x, at.z) + 0.08 : at.y, z: at.z, size: size * from, grow: 1 / from - 1, life, rgb, hot, shape: SHAPE.ring, flat });
  }

  key(card: CardView, result: number, typed: number, now: number): void {
    const w = this.w;
    const spot = w === null ? null : this.spot(w, card.call);
    if (w === null || spot === null || result === KEY.stray || result === KEY.group) return;
    if (result === KEY.wrong) frameFlash(card.el, SLIP, 300, 0.35);
    else if (result === KEY.lock || result === KEY.switch) frameFlash(card.el, LOCK, 160);
    const tier = chainTier(w.typing.chain);
    const core = spot.core.clone();
    const px = this.metres(core.distanceTo(this.stage.camera.position));
    const from = this.under(card, typed - 1, core, this.v[1]!, 14 * px); // where the press ring stands, under the card (feel.css)
    [this.keyMs, this.keyFrames] = [this.downAt >= 0 ? performance.now() - this.downAt : -1, this.frames - this.downFrame + 1];
    if (result === KEY.wrong) {
      // A slip: a cinnabar glint at the card, an ink drop falling to the ground and splashing there.
      this.pool.add("glow", { x: from.x, y: from.y, z: from.z, size: 44 * px, life: 0.14, rgb: SEAL, hot: 0.25 });
      const floor = heightAt(this.map, from.x, from.z) + 0.05;
      const fall = Math.sqrt((2 * Math.max(0.5, from.y - floor)) / 40);
      const splash = (bit: Bit): void => {
        this.pool.add("ink", { x: bit.x, y: floor, z: bit.z, size: 2.4, grow: 0.5, life: 0.9, rgb: INK, alpha: 0.65, shape: SHAPE.smoke, flat: true });
        for (let k = 0; k < 4; k += 1) this.pool.add("ink", { x: bit.x, y: floor + 0.1, z: bit.z, vx: this.rnd(-3, 3), vy: this.rnd(2, 4), vz: this.rnd(-3, 3), gravity: 30, floor, size: 0.45, life: 0.35, rgb: INK, alpha: 0.85 });
      };
      const drop = { x: from.x, y: from.y, z: from.z, vy: 1.5, gravity: 40, floor, life: fall };
      this.pool.add("glow", { ...drop, size: 40 * px, rgb: SEAL, alpha: 0.45 });
      this.pool.add("ink", { ...drop, size: 24 * px, rgb: INK, alpha: 0.95, end: splash });
      const charge = this.charges.get(card.call);
      if (charge) charge.share *= 0.6;
      return;
    }
    // The key's brightest frame is its first (§5.6, judge C10 r2): a jade-white flash where the letter leaves the card.
    this.pool.add("glow", { x: from.x, y: from.y, z: from.z, size: 84 * px, life: 0.06, rgb: HOT, hot: 0.25, alpha: 1 });
    this.pool.add("glow", { x: from.x, y: from.y, z: from.z, size: 150 * px, life: 0.03, rgb: JADE, hot: 0.15, alpha: 0.5 });
    this.letter(from, core, this.glyph(card.word, typed - 1), 44 * px * (1 + 0.12 * tier), 0.3, tier, 0, () => {
      this.pool.add("glow", { x: core.x, y: core.y, z: core.z, size: 1.6 + 0.25 * tier, life: 0.12, rgb: GOLD, hot: 0.3 });
      this.ring(core, 1.2 + 0.2 * tier, HOT, 0.18, false);
      this.sparks(core, 3 + tier, [6, 10], null, { life: 0.18 });
    });
    this.sparks(from, 2 + tier, [6, 10], null, { size: 0.2, length: 1.1, life: 0.16 });
    if (result === KEY.lock || result === KEY.switch) this.ring(core, Math.max(2.5, spot.radius * 1.3), JADE, 0.35, true);
    this.charges.set(card.call, { share: typed / Math.max(1, card.word.length), at: now, core, tier });
  }

  done(card: CardView, now: number): void {
    const w = this.w;
    const spot = w === null ? null : this.spot(w, card.call);
    if (w === null || spot === null) return;
    const tier = chainTier(w.typing.chain);
    const core = spot.core.clone();
    const power = spot.kind === CALL_KIND.power;
    const px = this.metres(core.distanceTo(this.stage.camera.position));
    const len = card.word.length;
    // The card bursts and squeezes where it stands (cards.ts); copies of its letters burst out in front of it (DOM, over the
    // card), and its letters dive from under it into the caller. The first to land flashes the caller warm white for 40 ms
    // with a small jade ring (T9, within 120 ms); the big answer follows. A power word's shot leaves at once and carries them.
    const starts = Array.from({ length: len }, (_, k) => this.under(card, k, core, new THREE.Vector3(), 14 * px));
    this.burst(card, now);
    for (let k = 0; k < len; k += 1) {
      const from = starts[k]!;
      const answer = (): void => this.answer(core, spot.radius, tier);
      const arrive = power ? null : k === 0 ? () => [this.struck(core, spot.radius), len === 1 && answer()] : k === Math.min(len - 1, 5) ? answer : null;
      this.letter(from, core, this.glyph(card.word, k), 44 * px * (1 + 0.1 * tier), power ? 0.12 : 0.05 + 0.01 * k, tier, 0, arrive);
    }
    if (power && spot.b >= 0) this.fired.set(spot.b, { word: card.word, tick: w.tick, call: card.call });
    else this.charges.delete(card.call);
    this.last = core;
    this.lastCard = card;
    void now;
  }

  /** T9: the caller flashes warm white for about 40 ms as the first letter lands, with a small jade ring. */
  private struck(core: THREE.Vector3, radius: number): void {
    const s = this.stage.project(core.x, core.y, core.z);
    this.marks.struck = [Math.round(s.x), Math.round(s.y)];
    this.answerMs = this.downAt >= 0 ? performance.now() - this.downAt : -1;
    this.pool.add("glow", { x: core.x, y: core.y, z: core.z, size: Math.max(3.2, radius * 2.4), life: 0.05, rgb: [1, 0.93, 0.8], hot: 0.25, alpha: 0.8 });
    this.ring(core, 1.7, JADE, 0.2, false, 0.6, 0.3);
  }

  /** A typed card's letters burst out in front of it: DOM copies over the card, 1.7× → 1×, out and down towards the caller, gone in 120 ms. */
  private burst(card: CardView, now: number): void {
    const root = card.el.parentElement;
    if (root === null || this.soft) return;
    const text = card.text;
    const len = Math.min(12, card.word.length);
    const [left, width, top, high] = [text.offsetLeft, text.offsetWidth, text.offsetTop, text.offsetHeight]; // read once, then write (no layout per letter)
    const lift = (card.height - top - high / 2) * 1.2; // the card stands 1.2× from its bottom
    for (let k = 0; k < len; k += 1) {
      const fly = (this.flies[k] ??= { el: root.appendChild(Object.assign(document.createElement("div"), { className: "td-fly" })), at: 0, x: 0, y: 0, dx: 0, dy: 0 });
      const share = (k + 0.5) / len;
      fly.el.textContent = card.word[k]!;
      Object.assign(fly, { at: now, x: card.x + (left + width * share - card.half) * 1.2, y: card.y + card.height - lift, dx: (share - 0.5) * card.half * 1.3, dy: card.height * (0.7 + 0.3 * Math.abs(share - 0.5)) });
    }
    this.fliesFrame(now);
  }

  private fliesFrame(now: number): void {
    for (const fly of this.flies) {
      const t = now - fly.at;
      if (t > 140) {
        if (fly.el.style.opacity !== "0") fly.el.style.opacity = "0";
        continue;
      }
      const e = 1 - (1 - Math.min(1, t / 110)) ** 2;
      fly.el.style.transform = "translate(" + (fly.x + fly.dx * e).toFixed(1) + "px," + (fly.y + fly.dy * e).toFixed(1) + "px) translate(-50%,-50%) scale(" + (1.7 - 0.7 * e).toFixed(3) + ")";
      fly.el.style.opacity = (t < 60 ? 1 : Math.max(0, 1 - (t - 60) / 60)).toFixed(2);
    }
  }

  /** The caller's answer to a typed word that is no attack: a flash, a ground ring, motes rising, sparks. */
  private answer(core: THREE.Vector3, radius: number, tier: number): void {
    this.flash(core, 5 + 0.4 * tier, GOLD, 0.14);
    this.ring(core, Math.max(2.5, radius * 1.5), JADE, 0.4, true);
    this.ring(core, 2.2, HOT, 0.22, false);
    this.sparks(core, 8 + tier, [9, 16], null);
    for (let k = 0; k < this.n(8); k += 1) this.pool.add("glow", { x: core.x + this.rnd(-1.5, 1.5), y: core.y, z: core.z + this.rnd(-1.5, 1.5), vy: this.rnd(2.5, 4.5), drag: 0.8, size: 0.5, life: this.rnd(0.8, 1.1), rgb: GOLD, hot: 0.5 });
  }

  /** This frame's rare events: the chain's steps. */
  read(events: readonly RareEvent[], w: World, now: number): void {
    this.w = w;
    for (const event of events) {
      if (event.t !== "chain" || this.last === null) continue;
      const to = this.last;
      const from = this.thread;
      if (from !== null && from.distanceToSquared(to) > 1) {
        // A solid thread (≥ 3 px): streaks laid end to end along a raised arc, swept from the last house to this one.
        const arc = (t: number): THREE.Vector3 => from.clone().lerp(to, t).setY(from.y + (to.y - from.y) * t + 10 * t * (1 - t));
        for (let k = 0; k < BEADS; k += 1) {
          const [a, b] = [arc(k / BEADS), arc((k + 1) / BEADS)];
          const mid = a.clone().lerp(b, 0.5);
          const piece = { x: mid.x, y: mid.y, z: mid.z, along: b.clone().sub(a), length: a.distanceTo(b) * 1.35, delay: 0.014 * k, life: 0.45 - 0.008 * k, shape: SHAPE.spark };
          this.pool.add("ink", { ...piece, size: 0.7, rgb: INK, alpha: 0.5 });
          this.pool.add("glow", { ...piece, size: 0.42, rgb: event.tier >= 2 ? GOLD : JADE, hot: 0.5 });
        }
      }
      this.thread = to.clone();
      const before = chainTier(Math.max(0, event.chain - 1));
      if (event.tier > before || event.callout) {
        // A tier: rings and sparks, no extra flash over the tower (the white core stays ≤ 30 %).
        this.ring(to, event.callout ? 8 : 4.5, GOLD, event.callout ? 0.6 : 0.4, event.callout, 0.45, 0.3);
        this.ring(to, 3, event.tier >= 2 ? GOLD : JADE, 0.3, false, 0.45, 0.3);
        this.sparks(to, event.callout ? 22 : 14, [12, 22], null, { rgb: GOLD });
        for (let k = 0; k < this.n(10); k += 1) this.pool.add("glow", { x: to.x + this.rnd(-2, 2), y: to.y, z: to.z + this.rnd(-2, 2), vy: this.rnd(3, 5), drag: 0.8, size: 0.45, life: this.rnd(0.7, 1), rgb: GOLD, hot: 0.4 });
      }
      if (this.lastCard !== null && event.chain >= 2) this.combo(this.lastCard, event.chain, event.tier, now);
    }
  }

  private thread: THREE.Vector3 | null = null;
  private gaps: { call: number; gap: number; top: number }[] = [];

  /**
   * The chain's count beside the card it grew on, outside the word line (judge C10 r2: it covered the last letter), on the
   * side away from a Word Shot's path: stamped 3× → 1× in 150 ms, then ≥ 20 px tall at 720p (feel.css), fading from 0.7 s.
   */
  private combo(card: CardView, chain: number, tier: number, now: number): void {
    const root = card.el.parentElement;
    if (root === null) return;
    this.tag ??= { el: root.appendChild(Object.assign(document.createElement("div"), { className: "td-combo" })), at: 0, x: 0, y: 0, half: 0, h: 0, w: 0, side: 0, card: null, call: -1 };
    this.tag.el.textContent = "×" + chain;
    this.tag.el.classList.toggle("is-gold", tier >= 2);
    this.tag.el.style.color = ["#e9fff9", "#9ff7e6", "#ffe3a0", "#ffc061", "#ff9f43"][Math.min(4, tier)]!;
    Object.assign(this.tag, { at: now, x: card.x, y: card.y + card.height / 2, half: card.half * 1.2 + 12, h: this.tag.el.offsetHeight, w: this.tag.el.offsetWidth, side: 0, card, call: card.call });
  }

  frame(cards: readonly CardView[], now: number): void {
    this.plates = cards.filter((k) => k.leave === "" || k.leave === "mean").map((k) => ({ x: k.x, y: k.y, w: 2 * k.half, h: k.height, mean: k.leave === "mean" }));
    // td-scale: how far each column's lowest card stands over its anchor (px; the lanes push a column down off the top edge).
    const w = this.w;
    const low = new Map<number, [number, number]>();
    for (const k of cards) if (k.leave === "" && k.slot >= 0) low.set(k.call, [Math.max(low.get(k.call)?.[0] ?? -1e9, k.y + k.height), Math.min(low.get(k.call)?.[1] ?? 1e9, k.y)]);
    this.gaps = w === null ? [] : [...low].flatMap(([call, [bottom, top]]) => (w.calls.slotOf(call) < 0 || this.tray.some((l) => l.includes(call)) ? [] : [{ call, gap: Math.round(this.anchor(w, w.calls.slotOf(call), false, true).y - bottom), top: Math.round(top) }])); // a call in the edge tray stands at the edge
    this.fliesFrame(now);
    this.trayLast = new Map(this.tray.flatMap((list, edge) => list.map((id) => [id, edge] as [number, number])));
    this.tray = [[], [], [], []];
    const tag = this.tag;
    if (tag === null) return;
    const t = now - tag.at;
    if (tag.side === 0) tag.side = this.shotAt >= tag.at && this.shotSide !== 0 ? -this.shotSide : 1;
    const scale = t < 0 ? 1 : t < 150 ? [3, 2.25, 1.6, 1.25, 1.1, 1][Math.floor(t / 30)]! : 1; // stamped 3× → 1× by frames (T10)
    // It keeps beside its card as the card turns into the wider meaning strip (sliding out over 40 ms), never over it.
    const card = tag.card;
    if (card !== null && card.call === tag.call && (card.leave === "" || card.leave === "mean")) {
      tag.x = card.x;
      tag.half += (Math.max(tag.half, card.half + 12) - tag.half) * Math.min(1, (now - (tag.seen ?? now)) / 40);
    }
    tag.seen = now;
    const x = tag.side > 0 ? tag.x + tag.half : tag.x - tag.half - tag.w;
    tag.el.style.transformOrigin = tag.side > 0 ? "0 50%" : "100% 50%"; // it grows away from the card
    tag.el.style.transform = "translate(" + x.toFixed(1) + "px," + (tag.y - tag.h / 2 - Math.min(4, t / 150)).toFixed(1) + "px) scale(" + scale.toFixed(3) + ")";
    tag.el.style.opacity = (t < 700 ? 1 : Math.max(0, 1 - (t - 700) / 250)).toFixed(2);
  }

  /** Before the stage renders: the plates, the charges, the shots in flight, then the pool. */
  update(w: World, now: number, dt: number): void {
    this.w = w;
    const camera = this.stage.camera;
    const right = this.v[2]!.setFromMatrixColumn(camera.matrixWorld, 0);
    const depth = 40;
    const px = this.metres(depth);
    for (const p of this.plates) {
      const at = this.ray(p.x, p.y + p.h / 2, depth, this.v[0]!);
      const [fh, fw] = p.mean ? [0.62, 0.78] : [0.45, 0.62]; // a meaning strip's plate hugs it and is lighter (judge r2: a smudge on the grass)
      this.pool.add("ink", { x: at.x, y: at.y, z: at.z, size: (p.h / fh) * px, length: (p.w / fw) * px, along: right.clone(), life: ONE_FRAME, rgb: INK, alpha: p.mean ? 0.38 : 0.55, shape: SHAPE.plate });
    }
    this.charge(w, now);
    this.flights(w, now);
    for (const [id, f] of this.fired) if (w.tick - f.tick > 2) this.fired.delete(id);
    this.pool.update(dt);
    this.pool.born = 0;
    this.frames += 1;
  }

  /** The locked call's core glows brighter as its word fills; a call let go fades in 0.25 s. */
  private charge(w: World, now: number): void {
    const lock = w.typing.router.lock;
    const held = lock >= 0 ? w.calls.id(w.words.call[lock]!) : -1;
    for (const [id, c] of this.charges) {
      const fade = id === held ? 1 : 1 - (now - c.at) / 250;
      if (fade <= 0 && id !== held) {
        this.charges.delete(id);
        continue;
      }
      const s = c.share * Math.max(0, Math.min(1, fade));
      const at = { x: c.core.x, y: c.core.y, z: c.core.z, life: ONE_FRAME };
      this.pool.add("ink", { ...at, size: 2 + 3 * s, rgb: INK, alpha: 0.3 * s + 0.12 });
      this.pool.add("glow", { ...at, size: 1.2 + 2.6 * s, rgb: s > 0.7 ? GOLD : JADE, hot: 0.3, alpha: 0.55 + 0.45 * s });
      if (s > 0.25 && this.rnd() < 0.2 + 0.1 * c.tier) {
        const a = this.rnd(0, Math.PI * 2);
        this.pool.add("glow", { x: c.core.x + Math.cos(a) * 2, y: c.core.y + this.rnd(-0.6, 0.6), z: c.core.z + Math.sin(a) * 2, vx: -Math.sin(a) * 7, vz: Math.cos(a) * 7, vy: 0.5, size: 0.22, length: 1.2, life: 0.2, rgb: GOLD, hot: 0.6, shape: SHAPE.spark });
      }
    }
  }

  /** Word Shots and a power word's volley in flight: R when one appears, T while it flies, I and F where it ends. */
  private flights(w: World, now: number): void {
    const P = w.projectiles;
    const B = w.buildings;
    const seen = new Set<number>();
    for (let p = 0; p < P.top; p += 1) {
      if (P.used[p] === 0 || (P.kind[p] !== PROJECTILE.wordShot && P.kind[p] !== PROJECTILE.bolt)) continue;
      const id = P.id(p);
      let shot = this.shots.get(id);
      if (shot === undefined) {
        const b = B.live().find((s) => B.x[s] === P.ox[p] && B.z[s] === P.oz[p]) ?? -1;
        const fired = b >= 0 ? this.fired.get(B.id(b)) : undefined;
        const bolt = P.kind[p] === PROJECTILE.bolt;
        if (bolt && fired === undefined) continue; // a crossbow's own bolt: C11's
        const word = P.word[p]! >= 0 ? wordText(w.typing.deck, P.word[p]!) : (fired?.word ?? "");
        const muzzle = this.muzzle(w, b, P.ox[p]!, P.oz[p]!, this.v[0]!);
        const twin = [...this.shots.values()].some((s) => s.born === w.tick && Math.abs(s.x0 - muzzle.x) < 0.1 && Math.abs(s.z0 - muzzle.z) < 0.1);
        shot = { born: w.tick, x0: muzzle.x, z0: muzzle.z, y0: muzzle.y, total: Math.max(1, Math.hypot(P.tx[p]! - P.ox[p]!, P.tz[p]! - P.oz[p]!)), word, k: 0, x: muzzle.x, y: muzzle.y, z: muzzle.z, splash: P.splash[p]!, bolt, frame: 0, call: fired?.call ?? -1 };
        this.shots.set(id, shot);
        if (!twin) this.release(w, b, muzzle, new THREE.Vector3(P.tx[p]! - P.ox[p]!, 0, P.tz[p]! - P.oz[p]!).normalize(), now, bolt);
      }
      seen.add(id);
      this.fly(shot, P.x[p]!, P.z[p]!, P.tx[p]!, P.tz[p]!);
    }
    for (const [id, shot] of this.shots) if (!seen.has(id)) [this.impact(shot), this.shots.delete(id)];
    // A word with no enemy in reach: the tower fizzles (the combat ring's FX.fizzle).
    const ring = w.events.ring;
    if (this.cursor < 0) this.cursor = ring.written;
    for (let i = Math.max(this.cursor, ring.written - ring.size); i < ring.written; i += 1) {
      const slot = i % ring.size;
      if (ring.kind[slot] !== FX.fizzle) continue;
      const b = ring.value[slot]!;
      const at = this.muzzle(w, b, ring.x[slot]!, ring.z[slot]!, this.v[0]!);
      this.smoke(at, 4, 3.2, 0.8, 0.5);
      this.sparks(at, 5, [2, 4], new THREE.Vector3(0, -1, 0), { rgb: JADE, hot: 0.2 });
      this.fired.delete(B.used[b] === 1 ? B.id(b) : -1);
    }
    this.cursor = ring.written;
  }

  /** Where house b's shots leave: its kit's or its own FX_muzzle, else its FX_top, else over its middle. */
  private muzzle(w: World, b: number, x: number, z: number, out: THREE.Vector3): THREE.Vector3 {
    const id = b >= 0 && w.buildings.used[b] === 1 ? w.buildings.id(b) : -1;
    return this.houses.point(id, "FX_muzzle", out) ?? this.houses.point(id, "FX_top", out) ?? out.set(x, heightAt(this.map, x, z) + 4, z);
  }

  /** R at the muzzle, in the frame the shot leaves. */
  private release(w: World, b: number, at: THREE.Vector3, dir: THREE.Vector3, now: number, bolt: boolean): void {
    const tier = chainTier(w.typing.chain);
    this.heading = [dir.x, dir.z];
    const s = this.stage.project(at.x, at.y, at.z);
    this.marks.release = [Math.round(s.x), Math.round(s.y)];
    const ahead = this.stage.project(at.x + dir.x * 6, at.y, at.z + dir.z * 6);
    [this.shotAt, this.shotSide] = [now, Math.abs(ahead.x - s.x) > 4 ? Math.sign(ahead.x - s.x) : 0];
    const size = (bolt ? 4.5 : 6.5) * (1 + 0.1 * tier);
    this.flash(at, size, bolt ? GOLD : JADE, 0.1, 0.72); // a white stone tower under it: a deeper puff
    this.ring(at, bolt ? 2.4 : 3.4, HOT, 0.2, false, 0.65, 0.2);
    this.sparks(at, 10 + tier, [24, 40], dir.clone().setY(0.25), {}, size * 0.2);
    // Under the card that stands over the tower, the release still shows: a jade ring on the ground round its foot.
    if (b >= 0) this.ring(this.v[1]!.set(w.buildings.x[b]!, 0, w.buildings.z[b]!), Math.max(2.6, 1.4 * w.c.buildings[w.buildings.def[b]!]!.radius), JADE, 0.32, true, 0.5, 0.35);
    this.smoke(at, 4, 3.6, 0.9);
    if (b >= 0 && !this.soft) this.houses.kick(w.buildings.id(b), now);
    for (const [id, c] of this.charges) if (c.core.distanceToSquared(at) < 64) [this.flash(c.core, 2.8, JADE, 0.08), this.charges.delete(id)]; // jade: a HOT one here was the white blob
  }

  /** T: the head over its dark twin, its letters trailing, a gold spark behind. */
  private fly(shot: Shot, x: number, z: number, tx: number, tz: number): void {
    const f = Math.min(1, 1 - Math.hypot(tx - x, tz - z) / shot.total);
    const y = shot.y0 + (1.2 - shot.y0) * f + 0.08 * shot.total * Math.sin(Math.PI * f) + heightAt(this.map, x, z) * f;
    const v = new THREE.Vector3(x - shot.x, y - shot.y, z - shot.z);
    [shot.x, shot.y, shot.z] = [x, y, z];
    shot.frame += 1;
    const head = { x, y, z, life: ONE_FRAME };
    const big = shot.bolt ? 0.7 : 1;
    this.pool.add("ink", { ...head, size: 4 * big, rgb: INK, alpha: 0.38 });
    this.pool.add("glow", { ...head, size: 5.4 * big, rgb: GOLD, alpha: 0.45 });
    this.pool.add("glow", { ...head, size: 3 * big, rgb: shot.bolt ? GOLD : JADE, hot: 0.3 });
    const back = v.clone().normalize().multiplyScalar(-3.2 * big);
    if (v.lengthSq() > 1e-6) this.pool.add("glow", { ...head, x: x + back.x, y: y + back.y, z: z + back.z, along: v.clone(), length: 7 * big, size: 1.1 * big, rgb: JADE, alpha: 0.55, shape: SHAPE.spark, hot: 0.4 }); // the streak behind it
    this.pool.add("glow", { x, y, z, vx: -v.x * 20, vy: -v.y * 20, vz: -v.z * 20, size: 0.4, length: 3, life: 0.12, rgb: GOLD, hot: 0.5, shape: SHAPE.spark });
    if (shot.word.length > 0 && shot.frame % 2 === 1) {
      const g = this.glyph(shot.word, shot.k++ % shot.word.length);
      const trail = { x, y, z, vy: -0.6, drag: 2, life: 0.34, turn: this.rnd(-0.3, 0.3), spin: this.rnd(-1.5, 1.5), shape: SHAPE.letter, glyph: Math.max(0, g) };
      this.pool.add("ink", { ...trail, size: 1.9, rgb: INK, alpha: 0.9 });
      this.pool.add("glow", { ...trail, size: 1.6, rgb: JADE, hot: 0.4 });
    }
  }

  /** I and F where a shot ended: flash, a ground ring of its splash radius, sparks, its letters scattering, smoke, embers, a scorch. */
  private impact(shot: Shot): void {
    const at = new THREE.Vector3(shot.x, shot.y, shot.z);
    const reach = Math.max(2, shot.splash);
    const s = this.stage.project(at.x, at.y, at.z);
    this.marks.impact = [Math.round(s.x), Math.round(s.y)];
    this.flash(at, Math.max(shot.bolt ? 4 : 6, 2.4 * shot.splash), shot.bolt ? GOLD : JADE, 0.12);
    this.ring(at, reach, shot.bolt ? GOLD : JADE, 0.3, true);
    const floor = heightAt(this.map, at.x, at.z);
    this.sparks(at, shot.bolt ? 10 : 16, [12, 24], null, { gravity: 14, floor, life: this.rnd(0.3, 0.45) });
    for (let k = 0; k < Math.min(8, shot.word.length); k += 1) {
      const a = this.rnd(0, Math.PI * 2);
      this.pool.add("glow", { x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * this.rnd(5, 9), vy: this.rnd(6, 9), vz: Math.sin(a) * this.rnd(5, 9), gravity: 10, floor, size: 1.7, life: 0.6, rgb: JADE, hot: 0.4, shape: SHAPE.letter, glyph: Math.max(0, this.glyph(shot.word, k)), spin: this.rnd(-3, 3) });
    }
    this.smoke(at, 5, 4.4, 1.2, 0.5);
    for (let k = 0; k < this.n(8); k += 1) this.pool.add("glow", { x: at.x + this.rnd(-reach, reach) * 0.5, y: floor + 0.3, z: at.z + this.rnd(-reach, reach) * 0.5, vy: this.rnd(1.6, 3.2), drag: 0.7, size: 0.4, life: this.rnd(1, 1.5), delay: 0.1, rgb: k % 2 === 0 ? EMBER : GOLD, hot: 0.5 });
    this.pool.add("ink", { x: at.x, y: floor + 0.04, z: at.z, size: 2.4 * reach, life: 2.8, rgb: INK, alpha: 0.75, shape: SHAPE.smoke, flat: true, hot: 3.7 }); // the scorch
    this.pool.add("glow", { x: at.x, y: floor + 0.06, z: at.z, size: 2.2 * reach, grow: 0.25, life: 1.2, rgb: JADE, alpha: 0.5, shape: SHAPE.ring, flat: true }); // the splash's rim
  }

  /** __td.view(): live bits per layer, bits started last frame, the last key's keydown → effect in ms. */
  stats(): Record<string, number | string> {
    const live = this.pool.count();
    const tag = this.tag?.el.getBoundingClientRect();
    return { fxGlow: live.glow, fxInk: live.ink, fxShots: this.shots.size, keyMs: Math.round(this.keyMs * 10) / 10, keyFrames: this.keyFrames, answerMs: Math.round(this.answerMs), anchors: JSON.stringify(this.gaps), shotDx: this.heading[0]!, shotDz: this.heading[1]!, marks: JSON.stringify(this.marks), tag: tag ? JSON.stringify([tag.left, tag.top, tag.width, tag.height].map(Math.round)) : "", tray: JSON.stringify([...this.trayLast]) };
  }

  dispose(): void {
    removeEventListener("keydown", this.down, { capture: true });
    this.tag?.el.remove();
    for (const fly of this.flies) fly.el.remove();
    this.pool.dispose();
  }
}
