/**
 * The word cards on map 1's 3D view and their typing feel there (1C step C10, docs/td/BUILD_1C_MAP1.md §7, §8;
 * TYPING_BREAK_STUDY §5.3; ART_DIRECTION §2.5, §8.2; VFX_STANDARD §3). Effects go to fx-pool.ts's two layers.
 * - Anchors: a call's cards stand 0.6 m over its house's FX_top (else over the head of who calls) through the camera, the
 *   lane packer (words/lanes.ts) unchanged; its letters fly into the house's FX_core.
 * - A right key: its letter leaves the card in jade over a dark copy, trails gold motes (the woven thread) and flies into
 *   the core, which glows brighter as the word fills (§3.3 a key: R at the card and the source, F the charge). The lock
 *   rings the caller's ground. A slip stamps the letter typed in cinnabar and flicks it off, glints cinnabar, drops an ink
 *   drop that splashes on the ground, and the caller recoils. The edge tray's cards slide in and point at their caller.
 * - A word typed: its letters burst into the caller, which answers with a flash, a ring, motes and a dark puff. A power
 *   word's shot (Word Shot, the Fort's volley) has five phases: A the charge; R at the muzzle the same frame (C10 r4: a
 *   painted jade body on deep jade with an amber rim, a small white core ≤ 30 %, lowered under the card when it hides the
 *   flash; sparks, the house's kick, dark smoke 2–3 frames later); T a jade head over a
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
import { fitElement } from "../words/dom";
import { keepIn, type SafeFrame } from "../words/safe";
import { comboSide, trayPointer } from "../words/tray";
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
/** A flash's saturated rim and the deep jade laid under it (judge C10 r3: a white stone tower turned the body cream). */
const AMBER: Rgb = [1, 0.55, 0.12];
const DEEP: Rgb = [0.02, 0.3, 0.26];
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
/** A card's edge-tray side (0 left, 1 right, 2 top, 3 bottom), −1 on the field (cards.ts writes "" there, which Number reads as 0). */
const edgeOf = (el: HTMLElement): number => (el.dataset.edge ? Number(el.dataset.edge) : -1);
const DARK_HALO = "rgba(10, 14, 12, 0.85)";
/** The chain count's fill and halo by tier. */
const TIER_INK: readonly (readonly [string, string])[] = [["#fff6e0", DARK_HALO], ["#0e9c84", "rgba(255, 246, 224, 0.95)"], ["#ffb31f", DARK_HALO], ["#ff8a1c", DARK_HALO], ["#ffd84a", "rgba(110, 36, 0, 0.9)"]];

type Charge = { share: number; at: number; core: THREE.Vector3; tier: number };
/** Where a call's letters go, kept by call id: a one-word call is gone by the time its word is read. */
type Spot = { core: THREE.Vector3; kind: number; b: number; radius: number };
type Shot = { born: number; x0: number; z0: number; y0: number; total: number; word: string; side: number; trail: boolean; x: number; y: number; z: number; splash: number; bolt: boolean; frame: number; call: number };
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
  private plates: { x: number; y: number; w: number; h: number; mean: boolean; a?: number }[] = [];
  private last: THREE.Vector3 | null = null;
  private lastCard: CardView | null = null;
  private tag: { el: HTMLElement; at: number; x: number; y: number; half: number; h: number; w: number; side: number; card: CardView | null; call: number; seen?: number; lit: number } | null = null;
  /** Each call's last drawn column (CSS px: x, bottom, height, half width): two tray columns on one edge keep apart, the pointer's room. */
  private drawn = new Map<number, [number, number, number, number]>();
  /** This frame's tray anchors by call, and the pointers' boxes drawn (td-1c-words samples their pixels). */
  private trayAt = new Map<number, { x: number; y: number }>();
  private pointerBoxes: number[][] = [];
  /** The tray cards' live boxes as drawn last frame, by call: a click hits the card where it is, sliding or not. */
  private trayBoxes: [number, DOMRect][] = [];
  private readonly flies: Fly[] = [];
  private safe: SafeFrame | null = null;
  /** The last release (ms) and which way its shot runs on screen (−1 left, 1 right): the chain count stands on the other side. */
  private shotAt = -1e9;
  private shotSide = 0;
  /** This frame's edge tray: calls (by id) at each edge (0 left, 1 right, 2 top, 3 bottom), and the last frame's. */
  private tray: number[][] = [[], [], [], []];
  private trayLast = new Map<number, number>();
  private cursor = -1;
  private downAt = -1;
  private downKey = "";
  /** A slip's typed letter, stamped in cinnabar over the letter wanted and flicked off (judge C10 r3, fix 5). */
  private miss: HTMLElement | null = null;
  /** Calls (by id) in the edge tray: which way their caller lies on screen (unit), and each tray card's slide (ms, from). */
  private readonly dirs = new Map<number, [number, number]>();
  private readonly slides = new Map<number, { x: number; y: number; e: number; at: number; fx: number; fy: number }>();
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
  private marks = { release: [0, 0], impact: [0, 0], struck: [0, 0], card: [0, 0, 0, 0], combo: [0, 0], house: [0, 0] };
  private readonly v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

  constructor(private readonly stage: Stage, private readonly houses: Houses, private readonly map: MapDef) {
    addEventListener("keydown", this.down, { capture: true });
  }

  private readonly down = (event: KeyboardEvent): void => void ([this.downAt, this.downFrame, this.downKey] = [event.timeStamp, this.frames, event.key]);

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
    if (core || raw) return { x: s.x, y: s.y };
    // A call in the tray comes back only once its anchor is 24 px inside the screen: at the border it flapped in and out (judge C10 r5 runs).
    const m = this.trayLast.has(w.calls.id(c)) ? 24 : 0;
    if (!behind && s.x >= m && s.x <= width - m && s.y >= m && s.y <= height - m) return this.slide(w.calls.id(c), { x: s.x, y: s.y });
    const [mx, my] = [width / 2, height / 2];
    let [dx, dy] = [behind ? mx - s.x : s.x - mx, behind ? my - s.y : s.y - my];
    if (Math.abs(dx) + Math.abs(dy) < 1) dy = 1;
    const [hx, hy] = [mx - TRAY.margin, dy < 0 ? my - TRAY.top : height - TRAY.margin - my];
    const k = Math.min(hx / Math.max(1e-6, Math.abs(dx)), hy / Math.max(1e-6, Math.abs(dy)));
    const edge = k === hx / Math.max(1e-6, Math.abs(dx)) ? (dx < 0 ? 0 : 1) : dy < 0 ? 2 : 3;
    const id = w.calls.id(c);
    const list = this.tray[edge]!;
    if (!list.includes(id)) {
      if (list.length >= TRAY.perEdge || this.tray.reduce((n, l) => n + l.length, 0) >= TRAY.max) return this.slide(id, { x: s.x, y: s.y, edge: -2 });
      list.push(id);
    }
    const d = Math.hypot(dx, dy);
    this.dirs.set(id, [dx / d, dy / d]);
    const at = { x: mx + dx * k, y: my + dy * k };
    // Two columns on one edge keep 18 px apart along it, the field's rule (judge C10 r5: they overlapped by 12 px).
    const other = list.find((o) => o !== id);
    const o = other === undefined ? undefined : this.trayAt.get(other);
    if (o !== undefined) {
      const [mine, theirs] = [this.drawn.get(id), this.drawn.get(other!)];
      const side = edge <= 1;
      const need = side ? Math.max(mine?.[2] ?? 60, theirs?.[2] ?? 60) + 18 : (mine?.[3] ?? 100) + (theirs?.[3] ?? 100) + 18;
      const [p, q, lo, hi] = side ? [at.y, o.y, TRAY.top + need, height - TRAY.margin] : [at.x, o.x, TRAY.margin + need / 2, width - TRAY.margin - need / 2];
      if (Math.abs(p - q) < need) {
        const moved = q + (p >= q ? need : -need);
        const to = moved < lo || moved > hi ? q - (p >= q ? need : -need) : moved;
        if (side) at.y = to;
        else at.x = to;
      }
    }
    // A side column keeps 52 px a 720p step from the screen's edge: room for its V turned up to 60° (1080p). Its half as columnBox's.
    const room = (this.drawn.get(id)?.[3] ?? 100) + 9 + 52 * Math.max(1, height / 720);
    if (edge === 0) at.x = Math.max(at.x, room);
    if (edge === 1) at.x = Math.min(at.x, width - room);
    // A side column clears every HUD side panel it passes on its way from where it was drawn (as cards.ts would at its end),
    // so it slides down (or up) clear of them first and is never snapped under one mid-slide.
    const [x0, half, tall] = [this.drawn.get(id)?.[0] ?? at.x, (this.drawn.get(id)?.[3] ?? 100) + 9, this.drawn.get(id)?.[2] ?? 60];
    const [left, right] = [Math.min(x0, at.x) - half, Math.max(x0, at.x) + half];
    for (let pass = 0; edge <= 1 && pass < 2; pass += 1) for (const p of this.safe?.panels ?? []) if (p.left < right && p.right > left && p.top < at.y && at.y - tall < p.bottom) at.y = p.top > height / 2 ? p.top - 6 : p.bottom + 6 + tall;
    this.trayAt.set(id, at);
    return this.slide(id, { ...at, edge });
  }

  /**
   * A card going into the edge tray or out of it slides there in 0.3 s from its last anchor; cards.ts keeps the column's
   * parting offset, which springs back as the slide goes (judge C10 r5: the tray's own clamps on that anchor, the pointer's
   * room and the side panels, made it jump for a frame: the room is the target's now, the panels are tested where it was drawn).
   */
  private slide(id: number, p: { x: number; y: number; edge?: number }): { x: number; y: number; edge?: number } {
    const [now, e] = [performance.now(), p.edge ?? -1];
    let was = this.slides.get(id);
    if (was === undefined) {
      if (this.slides.size > 64) this.slides.delete(this.slides.keys().next().value!);
      this.slides.set(id, (was = { x: p.x, y: p.y, e, at: -1e9, fx: p.x, fy: p.y }));
    }
    if (was.e !== e && was.e !== -2 && e !== -2) [was.fx, was.fy, was.at] = [was.x, was.y, now];
    const u = Math.min(1, (now - was.at) / 300);
    // Into a side tray: down (or up) in the first 105 ms, across after 90 ms, so a card beside a HUD panel is clear of it first;
    // both legs ease in and out (an ease-out leg moved 40 px in its first frame).
    const ease = (t: number): number => 1 - (1 - Math.max(0, Math.min(1, t))) ** 3;
    const both = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
    const [kx, ky] = e === 0 || e === 1 ? [both((u - 0.3) / 0.7), both(u / 0.35)] : [ease(u), ease(u)];
    [was.x, was.y, was.e] = [was.fx + (p.x - was.fx) * kx, was.fy + (p.y - was.fy) * ky, e];
    return u >= 1 ? p : { ...p, x: was.x, y: was.y };
  }

  /** The call (id) whose tray card's live box holds CSS point (px, py), 6 px of slack round it; −1 none (judge C10 r5). */
  trayHit(px: number, py: number): number {
    const hit = this.trayBoxes.find(([, r]) => px >= r.left - 6 && px <= r.right + 6 && py >= r.top - 6 && py <= r.bottom + 6);
    return hit === undefined ? -1 : hit[0];
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

  /**
   * A tray card's letter `k` leaves past the card's outer edge towards the caller, clear of its word (judge C10 r5: one rising
   * through the word read as an extra capital, "A away"); null for a card on the field.
   */
  private exit(card: CardView, core: THREE.Vector3, out: THREE.Vector3, k = 0): THREE.Vector3 | null {
    const edge = edgeOf(card.el);
    if (edge < 0) return null;
    const r = card.el.getBoundingClientRect();
    const [gap, mx, my] = [26 + 12 * k, (r.left + r.right) / 2, (r.top + r.bottom) / 2];
    const [x, y] = [[r.left - gap, my], [r.right + gap, my], [mx, r.top - gap], [mx, r.bottom + gap]][edge]!;
    return this.ray(x!, y!, core.distanceTo(this.stage.camera.position), out);
  }

  private glyph(word: string, k: number): number {
    const g = word.toLowerCase().charCodeAt(k) - 97;
    return g >= 0 && g < 26 ? g : -1;
  }

  /** A letter flying from `from` into `to` over `life` s: jade over a dark copy, gold motes behind. */
  private letter(from: THREE.Vector3, to: THREE.Vector3, g: number, size: number, life: number, tier: number, delay = 0, end: ((bit: Bit) => void) | null = null, hot = 0.45 + 0.1 * tier, trail = 0.3, halo = 0.45, arc = 1.4): void {
    const fly = { x: from.x, y: from.y, z: from.z, to: to.clone(), arc, life, delay, turn: -0.14, spin: this.rnd(-2, 2) };
    if (g < 0) return void this.pool.add("glow", { ...fly, size: size * 0.6, rgb: JADE, hot: 0.4, trail: size * 0.25, end });
    this.pool.add("ink", { ...fly, size: size * 1.15, rgb: INK, alpha: 0.65, shape: SHAPE.letter, glyph: g });
    this.pool.add("glow", { ...fly, size: size * 1.7, rgb: JADE, alpha: halo });
    this.pool.add("glow", { ...fly, size, rgb: tier >= 3 ? GOLD : JADE, hot, shape: SHAPE.letter, glyph: g, trail: size * trail, end });
  }

  /** Sparks out of `at`, each starting `out` metres along its way (so a flash's sparks never pile into a white core). */
  private sparks(at: THREE.Vector3, count: number, speed: [number, number], dir: THREE.Vector3 | null, o: Partial<Bit> = {}, out = 0, tint: readonly [Rgb, Rgb] = [GOLD, HOT]): void {
    for (let k = 0; k < this.n(count); k += 1) {
      const [a, up] = [this.rnd(0, Math.PI * 2), this.rnd(0.2, 1)];
      const v = dir === null ? new THREE.Vector3(Math.cos(a) * (1 - up * 0.5), up, Math.sin(a) * (1 - up * 0.5)) : dir.clone().add(new THREE.Vector3(this.rnd(-0.5, 0.5), this.rnd(-0.3, 0.5), this.rnd(-0.5, 0.5))).normalize();
      const [x, y, z] = [at.x + v.x * out, at.y + v.y * out, at.z + v.z * out];
      v.multiplyScalar(this.rnd(speed[0], speed[1]));
      this.pool.add("glow", { x, y, z, vx: v.x, vy: v.y, vz: v.z, size: 0.3, length: this.rnd(1.4, 2.6), life: this.rnd(0.16, 0.28), drag: 3, rgb: tint[k % 3 === 0 ? 0 : 1], hot: 0.7, shape: SHAPE.spark, ...o });
    }
  }

  private smoke(at: THREE.Vector3, count: number, size: number, life: number, alpha = 0.45): void {
    for (let k = 0; k < this.n(count); k += 1) {
      this.pool.add("ink", { x: at.x + this.rnd(-0.5, 0.5), y: at.y + this.rnd(-0.2, 0.4), z: at.z + this.rnd(-0.5, 0.5), vy: this.rnd(0.8, 1.6), vx: this.rnd(-0.5, 0.5), drag: 1.2, size: size * this.rnd(0.8, 1.2), grow: 1.1, life: life * this.rnd(0.8, 1.2), delay: this.rnd(0.035, 0.06), rgb: INK, alpha, shape: SHAPE.smoke, hot: this.rnd(0, 9) });
    }
  }

  /** A hot flash: a jade (or gold) body with its small white core, a wider halo (amber), a dark (or deep jade) puff under both. */
  private flash(at: THREE.Vector3, size: number, rgb: Rgb, life = 0.1, dark = 0.55, under: Rgb = INK, halo: Rgb = GOLD, wide = 1.4): void {
    // The puff first, so the body reads jade (or gold) over a bright roof; only its middle turns white (§3.5, fx-pool.ts).
    this.pool.add("ink", { x: at.x, y: at.y, z: at.z, size: size * wide, life: life * 2.2, rgb: under, alpha: dark });
    this.pool.add("glow", { x: at.x, y: at.y, z: at.z, size, life, rgb, hot: 0.15, alpha: 0.5 });
    if (halo !== AMBER) return void this.pool.add("glow", { x: at.x, y: at.y, z: at.z, size: size * 1.9, life: life * 1.7, rgb: halo, alpha: 0.24 });
    // Amber only as a painted rim (normal blend: amber light over the jade body on a white stone tower added up to neutral white,
    // C10 r4 measure at 1920) round a faint jade halo.
    this.pool.add("glow", { x: at.x, y: at.y, z: at.z, size: size * 1.9, life: life * 1.7, rgb, alpha: 0.14 });
    this.pool.add("ink", { x: at.x, y: at.y, z: at.z, size: size * 1.06, grow: 0.18, life: life * 1.7, rgb: AMBER, alpha: 0.9, shape: SHAPE.ring });
  }

  /** A ring of light; `paint`: a normal-blended one, which keeps its hue over a flash (amber light over jade light reads white). */
  private ring(at: THREE.Vector3, radius: number, rgb: Rgb, life: number, flat: boolean, from = 0.45, hot = 0.45, paint = false): void {
    const size = (2 * radius) / 0.8; // the ring's band sits at 0.8 of the quad's half
    this.pool.add(paint ? "ink" : "glow", { x: at.x, y: flat ? heightAt(this.map, at.x, at.z) + 0.08 : at.y, z: at.z, size: size * from, grow: 1 / from - 1, life, rgb, hot, shape: SHAPE.ring, flat, alpha: paint ? 0.9 : 1 });
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
    const tray = edgeOf(card.el) >= 0;
    const from = this.exit(card, core, this.v[1]!) ?? this.under(card, typed - 1, core, this.v[1]!, 14 * px); // where the press ring stands, under the card (feel.css)
    [this.keyMs, this.keyFrames] = [this.downAt >= 0 ? performance.now() - this.downAt : -1, this.frames - this.downFrame + 1];
    if (result === KEY.wrong) {
      // A slip: the letter typed stamped in cinnabar over the one wanted and flicked off; a cinnabar glint at the card, an ink
      // drop (≥ 12 px at 720p) falling to the ground and splashing there; the caller recoils with a cinnabar ring (judge C10 r3).
      this.slip(card, typed);
      this.pool.add("glow", { x: from.x, y: from.y, z: from.z, size: 44 * px, life: 0.14, rgb: SEAL, hot: 0.25 });
      const floor = heightAt(this.map, from.x, from.z) + 0.05;
      const fall = Math.sqrt((2 * Math.max(0.5, from.y - floor)) / 40);
      const splash = (bit: Bit): void => {
        this.pool.add("ink", { x: bit.x, y: floor, z: bit.z, size: 3.2, grow: 0.5, life: 0.9, rgb: INK, alpha: 0.7, shape: SHAPE.smoke, flat: true });
        for (let k = 0; k < 5; k += 1) this.pool.add("ink", { x: bit.x, y: floor + 0.1, z: bit.z, vx: this.rnd(-3.5, 3.5), vy: this.rnd(2, 4), vz: this.rnd(-3.5, 3.5), gravity: 30, floor, size: 0.6, life: 0.35, rgb: INK, alpha: 0.85 });
      };
      const drop = { x: from.x, y: from.y, z: from.z, vy: 1.5, gravity: 40, floor, life: fall };
      this.pool.add("glow", { ...drop, size: 56 * px, rgb: SEAL, alpha: 0.45 });
      this.pool.add("ink", { ...drop, size: 52 * px, rgb: INK, alpha: 1, end: splash });
      this.pool.add("glow", { x: core.x, y: core.y, z: core.z, size: Math.max(2.4, spot.radius * 1.6), life: 0.12, rgb: SEAL, hot: 0.1, alpha: 0.75 });
      this.ring(core, Math.max(1.4, spot.radius * 0.9), SEAL, 0.2, false, 0.55, 0.1);
      if (spot.b >= 0 && !this.soft) this.houses.kick(spot.b, now, 0.5);
      const charge = this.charges.get(card.call);
      if (charge) charge.share *= 0.6;
      return;
    }
    // The key's brightest frame is its first (§5.6, judge C10 r2): a jade-white flash where the letter leaves the card.
    this.pool.add("glow", { x: from.x, y: from.y, z: from.z, size: 84 * px, life: 0.06, rgb: HOT, hot: 0.25, alpha: 1 });
    this.pool.add("glow", { x: from.x, y: from.y, z: from.z, size: 150 * px, life: 0.03, rgb: JADE, hot: 0.15, alpha: 0.5 });
    this.letter(from, core, this.glyph(card.word, typed - 1), 44 * px * (1 + 0.12 * tier), 0.3, tier, 0, () => {
      this.pool.add("glow", { x: core.x, y: core.y, z: core.z, size: 1.6 + 0.25 * tier, life: 0.12, rgb: JADE, hot: 0.25 });
      this.ring(core, 1.2 + 0.2 * tier, JADE, 0.18, false, 0.45, 0.3);
      this.sparks(core, 3 + tier, [6, 10], null, { life: 0.18, hot: 0.3 }, 0, [AMBER, JADE]);
    }, undefined, undefined, undefined, tray ? 0.5 : 1.4); // from a tray card, a flat path out past its edge
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
    const starts = Array.from({ length: len }, (_, k) => this.exit(card, core, new THREE.Vector3(), k) ?? this.under(card, k, core, new THREE.Vector3(), 14 * px));
    const arc = edgeOf(card.el) >= 0 ? 0.5 : 1.4;
    this.burst(card, now);
    for (let k = 0; k < len; k += 1) {
      const from = starts[k]!;
      const answer = (): void => this.answer(core, spot.radius, tier);
      const arrive = power ? null : k === 0 ? () => [this.struck(core, spot.radius), len === 1 && answer()] : k === Math.min(len - 1, 5) ? answer : null;
      // A power word's letters land in the muzzle as the shot leaves: jade, not white, inside its flash (§3.5). No gold trail on a
      // typed word's dive: its motes piled up over the first frames, so the burst was not the brightest (judge C10 r3, §5.6).
      this.letter(from, core, this.glyph(card.word, k), 44 * px * (power ? 0.85 : 1 + 0.1 * tier), power ? 0.08 : 0.05 + 0.01 * k, tier, 0, arrive, power ? 0 : 0.45 + 0.1 * tier, 0, power ? 0.22 : 0.45, arc);
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
    this.pool.add("glow", { x: core.x, y: core.y, z: core.z, size: Math.max(3.2, radius * 2.4), life: 0.05, rgb: [1, 0.93, 0.8], hot: 0.25, alpha: 0.55 });
    this.ring(core, 1.7, JADE, 0.2, false, 0.6, 0.3);
  }

  /** The letter a slip typed, in cinnabar beside the letter wanted (`typed` letters before it): stamped 1.8× → 1× in 2 frames, flicked off by 150 ms. */
  private slip(card: CardView, typed: number): void {
    const [root, ch] = [card.el.parentElement, this.downKey];
    if (root === null || ch.length !== 1 || this.soft) return;
    const el = (this.miss ??= root.appendChild(Object.assign(document.createElement("div"), { className: "td-fly" })));
    Object.assign(el.style, { color: "#e5452a", webkitTextStroke: "1.5px #3b0f07", textShadow: "0 2px 0 #3b0f07, 0 0 6px #fff4d6, 0 0 12px rgba(255, 244, 214, 0.9)", opacity: "1" });
    el.textContent = ch;
    const text = card.text;
    const scale = typed >= 2 ? 1.2 : 1.1; // a locked card's size (cards.ts), grown from its bottom
    // Half a cell up and right of the letter wanted, which stays readable under it (judge C10 r5: it was hidden 80–100 ms).
    const cell = (text.offsetWidth / Math.max(1, card.word.length)) * scale;
    const x = card.x + (text.offsetLeft + text.offsetWidth * ((typed + 0.5) / Math.max(1, card.word.length)) - card.half) * scale + cell * 0.5;
    const y = card.y + card.height - (card.height - text.offsetTop - text.offsetHeight / 2) * scale - text.offsetHeight * scale * 0.5;
    const at = (dx: number, dy: number, s: number, turn: number): string => "translate(" + (x + dx).toFixed(1) + "px," + (y + dy).toFixed(1) + "px) translate(-50%,-50%) scale(" + s + ") rotate(" + turn + "deg)";
    for (const old of el.getAnimations?.() ?? []) old.cancel();
    el.animate?.([{ transform: at(-4, -10, 1.8, -8), opacity: 1 }, { transform: at(0, 0, 1, 0), opacity: 1, offset: 0.24 }, { transform: at(0, 0, 1, 0), opacity: 1, offset: 0.4 }, { transform: at(22, -34, 0.85, 34), opacity: 0 }], { duration: 150, fill: "forwards" });
  }

  /** A typed card's letters burst out in front of it: DOM copies over the card, 1.7× → 1×, up and out from its word line (never over its meaning), gone in 120 ms. */
  private burst(card: CardView, now: number): void {
    const root = card.el.parentElement;
    if (root === null || this.soft) return;
    const text = card.text;
    const len = Math.min(12, card.word.length);
    const [left, width, high] = [text.offsetLeft, text.offsetWidth, text.offsetHeight]; // read once, then write (no layout per letter)
    const lift = card.height * 1.2 + high * 0.55; // above the card's top edge (it stands 1.2× from its bottom): never over its word (judge C10 r5)
    for (let k = 0; k < len; k += 1) {
      const fly = (this.flies[k] ??= { el: root.appendChild(Object.assign(document.createElement("div"), { className: "td-fly" })), at: 0, x: 0, y: 0, dx: 0, dy: 0 });
      const share = (k + 0.5) / len;
      fly.el.textContent = card.word[k]!;
      Object.assign(fly, { at: now, x: card.x + (left + width * share - card.half) * 1.2, y: card.y + card.height - lift, dx: (share - 0.5) * card.half * 2.4, dy: -card.height * (0.3 + 0.6 * Math.abs(share - 0.5)) });
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
      // Already 55 % out on its first frame (off the card's own letters, so that frame is the burst's brightest), fading after it.
      if (this.safe) {
        const x = fly.x + fly.dx, y = fly.y + fly.dy;
        const r = keepIn({ left: x - 32, top: y - 40, right: x + 32, bottom: y + 40 }, this.safe, this.safe.panels);
        fly.dx += r.left - (x - 32); fly.dy += r.top - (y - 40);
      }
      const e = 0.55 + 0.45 * (1 - (1 - Math.min(1, t / 110)) ** 2);
      fly.el.style.transform = "translate(" + (fly.x + fly.dx * e).toFixed(1) + "px," + (fly.y + fly.dy * e).toFixed(1) + "px) translate(-50%,-50%) scale(" + (2 - e).toFixed(3) + ")";
      fly.el.style.opacity = (t < 17 ? 1 : Math.max(0, 1 - (t - 17) / 95)).toFixed(2);
      if (this.safe) fitElement(fly.el, this.safe, 3);
    }
  }

  /** The caller's answer to a typed word that is no attack: a flash, a ground ring, motes rising, sparks. */
  private answer(core: THREE.Vector3, radius: number, tier: number): void {
    // Beat two, after the card's own burst (which stays the brightest frame): jade on deep jade, amber rim, short (judge C10 r3).
    this.flash(core, 4.2 + 0.4 * tier, JADE, 0.12, 0.5, DEEP, AMBER);
    this.ring(core, Math.max(2.5, radius * 1.5), JADE, 0.4, true);
    this.ring(core, 2.2, JADE, 0.22, false, 0.45, 0, true);
    this.sparks(core, 8 + tier, [9, 16], null, { hot: 0.3 }, 0, [AMBER, JADE]);
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
      const hs = this.stage.project(to.x, to.y, to.z);
      this.marks.house = [Math.round(hs.x), Math.round(hs.y)];
      const before = chainTier(Math.max(0, event.chain - 1));
      if (event.tier > before || event.callout) {
        // A tier: rings and sparks, no extra flash over the tower. Amber and jade with little white: a gold ring over a Word Shot's
        // jade body added up to a white arc (C10 r4 measure, 0.46–0.64 of the flash).
        this.ring(to, event.callout ? 8 : 4.5, AMBER, event.callout ? 0.6 : 0.4, event.callout, 0.65, 0, true);
        this.ring(to, 3, event.tier >= 2 ? AMBER : JADE, 0.3, false, 0.65, 0, true);
        this.sparks(to, event.callout ? 22 : 14, [12, 22], null, { hot: 0.3 }, 0, [GOLD, AMBER]);
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
    this.tag ??= { el: root.appendChild(Object.assign(document.createElement("div"), { className: "td-combo" })), at: 0, x: 0, y: 0, half: 0, h: 0, w: 0, side: 0, card: null, call: -1, lit: -1 };
    this.tag.el.textContent = "×" + chain;
    // Tiers that read on grass (judge C10 r3: pale mint did not): ivory, deep jade on an ivory halo, then amber to gold on a dark one.
    Object.assign(this.tag.el.style, { color: "#fffbea", textShadow: "0 3px 0 #1d1710, 0 0 8px " + TIER_INK[Math.min(4, tier)]![0] + ", 0 0 18px " + TIER_INK[Math.min(4, tier)]![0] });
    Object.assign(this.tag, { lit: tier, at: now, x: card.x, y: card.y + card.height / 2, half: card.half * 1.2 + 12, h: this.tag.el.offsetHeight, w: this.tag.el.offsetWidth, side: NaN, card, call: card.call });
    this.marks.combo = [Math.round(card.x), Math.round(card.y + card.height / 2)];
  }

  frame(cards: readonly CardView[], now: number, safe?: SafeFrame): void {
    this.safe = safe ?? { ...this.stage.size, panels: [] };
    // No plate under a card not shown (a call's next word waiting, one over the tray's cap) nor under a typed card bursting and
    // squeezing: that dark shadow hid a Word Shot's release under the card (judge C10 r3). None while a card slides into the tray
    // or out of it either: plates are drawn a frame late, so one trailed the fast card as a dark box (judge C10 r5).
    const sliding = (k: CardView): boolean => now - (this.slides.get(k.call)?.at ?? -1e9) < 340;
    this.plates = cards.filter((k) => k.el.style.opacity !== "0" && !sliding(k) && (k.leave === "" || (k.leave === "mean" && k.el.classList.contains("is-mean")))).map((k) => ({ x: k.x, y: k.y, w: 2 * k.half, h: k.height, mean: k.leave === "mean" }));
    // td-scale: how far each column's lowest card stands over its anchor (px; the lanes push a column down off the top edge).
    const w = this.w;
    const low = new Map<number, [number, number]>();
    for (const k of cards) if (k.leave === "" && k.slot >= 0) low.set(k.call, [Math.max(low.get(k.call)?.[0] ?? -1e9, k.y + k.height), Math.min(low.get(k.call)?.[1] ?? 1e9, k.y)]);
    this.drawn = new Map([...low].map(([call, [bottom, top]]) => {
      const k = cards.find((c) => c.call === call && c.leave === "")!;
      return [call, [k.x, bottom, bottom - top, Math.max(...cards.filter((c) => c.call === call).map((c) => c.half))]];
    }));
    this.gaps = w === null ? [] : [...low].flatMap(([call, [bottom, top]]) => (w.calls.slotOf(call) < 0 || this.tray.some((l) => l.includes(call)) || now - (this.slides.get(call)?.at ?? -1e9) < 300 ? [] : [{ call, gap: Math.round(this.anchor(w, w.calls.slotOf(call), false, true).y - bottom), top: Math.round(top) }])); // a call in the edge tray stands at the edge
    this.fliesFrame(now);
    if (this.miss) fitElement(this.miss, this.safe, 3);
    this.pointers(cards);
    this.trayLast = new Map(this.tray.flatMap((list, edge) => list.map((id) => [id, edge] as [number, number])));
    this.tray = [[], [], [], []];
    this.trayAt.clear();
    const tag = this.tag;
    if (tag === null) return;
    const t = now - tag.at;
    const scale = t < 0 ? 1 : t < 150 ? [3, 2.25, 1.6, 1.25, 1.1, 1][Math.floor(t / 30)]! : 1; // stamped 3× → 1× by frames (T10)
    if (t >= 34 && tag.lit >= 0) {
      // White-hot for its first two frames (the stamp is its brightest frame), then its tier's fill and halo.
      const [fill, halo] = TIER_INK[Math.min(4, tag.lit)]!;
      Object.assign(tag.el.style, { color: fill, textShadow: "0 3px 0 #1d1710, 0 0 3px " + halo + ", 0 0 10px " + halo });
      tag.lit = -1;
    }
    // It keeps beside its card as the card turns into the wider meaning strip (sliding out over 40 ms), never over it.
    const card = tag.card;
    if (card !== null && card.call === tag.call && (card.leave === "" || card.leave === "mean")) {
      [tag.x, tag.y] = [card.x, card.y + card.height / 2]; // anchored to its card, then to the meaning strip it turns into
      tag.half += (Math.max(tag.half, card.half + 12) - tag.half) * Math.min(1, (now - (tag.seen ?? now)) / 40);
    }
    tag.seen = now;
    const r = card?.el.getBoundingClientRect();
    const bounds = r ?? { left: tag.x - tag.half, top: tag.y - tag.h / 2, right: tag.x + tag.half, bottom: tag.y + tag.h / 2 };
    tag.el.dataset.own = r && card!.call === tag.call ? [r.left, r.top, r.right, r.bottom].map(Math.round).join() : ""; // td-1c-words: never over its own card
    // Its side is chosen once for the stamp's largest box (×3) and kept through the stamp (judge C10 r5: at 1920 the ×2.25 frame
    // fell back onto its own tray card, then flipped); at rest it may change sides as the card turns into its meaning strip.
    if (Number.isNaN(tag.side)) tag.side = comboSide(bounds, tag.w * 3 + 8, tag.h * 3 + 8, this.shotAt >= tag.at && this.shotSide !== 0 ? -this.shotSide : 1, this.safe, this.safe.panels).side;
    const pose = comboSide(bounds, tag.w * scale + 8, tag.h * scale + 8, tag.side, this.safe, this.safe.panels, t < 150);
    tag.side = pose.side;
    tag.el.style.transformOrigin = "0 0";
    tag.el.style.transform = `translate(${pose.box.left + 4}px,${pose.box.top + 4}px) scale(${scale.toFixed(3)})`;
    const fade = t < 700 ? 1 : Math.max(0, 1 - (t - 700) / 250);
    tag.el.style.opacity = fade.toFixed(2);
    // At rest a soft ink plate under the count, like the cards' (judge C10 r5: jade on grass, amber on sand read only by their outline).
    if (t >= 150 && fade > 0) this.plates.push({ x: pose.box.left + 4 + tag.w / 2, y: pose.box.top + 4, w: tag.w, h: tag.h, mean: false, a: fade });
  }

  /**
   * One symmetric V at every edge, pointing at the caller: two solid jade bars (4 px at 720p) in a full ink outline (8 px),
   * just outside the card's edge (judge C10 r5: thin streaks fading at both ends read as a 1 px hairline). A code-drawn mark
   * until Codex 165's tray-arrow art is accepted.
   */
  private pointers(cards: readonly CardView[]): void {
    const depth = 40, m = this.metres(depth);
    const safe = this.safe ?? { ...this.stage.size, panels: [] };
    const k720 = Math.max(1, this.stage.size.height / 720);
    this.pointerBoxes = [];
    this.trayBoxes = [];
    for (const k of cards) {
      const edge = edgeOf(k.el);
      const dir = k.leave === "" && edge >= 0 && this.tray[edge]?.includes(k.call) && Number(k.el.style.opacity) > 0 ? this.dirs.get(k.call) : undefined;
      if (!dir) continue;
      const card = k.el.getBoundingClientRect();
      this.trayBoxes.push([k.call, card]);
      const p = trayPointer(edge, dir, card, safe, safe.panels);
      this.pointerBoxes.push([p.box.left, p.box.top, p.box.right - p.box.left, p.box.bottom - p.box.top, edge].map(Math.round));
      const tip = this.ray(p.points[0][0], p.points[0][1], depth, this.v[0]!).clone();
      for (const point of p.points.slice(1)) {
        const end = this.ray(point[0], point[1], depth, this.v[1]!);
        const mid = tip.clone().lerp(end, 0.5);
        const long = tip.distanceTo(end);
        // fx-pool's plate shows about 0.79 of its length and 0.62 of its width solid: sized so the bars meet at the tip.
        const arm = { x: mid.x, y: mid.y, z: mid.z, along: tip.clone().sub(end), life: ONE_FRAME, shape: SHAPE.plate };
        this.pool.add("ink", { ...arm, length: (long + 8 * k720 * m) / 0.79, size: (8 * k720 * m) / 0.62, rgb: INK, alpha: 1 });
        this.pool.add("glow", { ...arm, length: (long + 2 * k720 * m) / 0.79, size: (4 * k720 * m) / 0.62, rgb: JADE, alpha: 1 });
      }
    }
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
      this.pool.add("ink", { x: at.x, y: at.y, z: at.z, size: (p.h / fh) * px, length: (p.w / fw) * px, along: right.clone(), life: ONE_FRAME, rgb: INK, alpha: (p.a ?? 1) * (p.mean ? 0.38 : 0.55), shape: SHAPE.plate });
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
      // A jade orb on deep jade with a small core and an amber halo as it fills (judge C10 r3: it was near solid white-gold).
      const at = { x: c.core.x, y: c.core.y, z: c.core.z, life: ONE_FRAME };
      this.pool.add("ink", { ...at, size: 2 + 3 * s, rgb: DEEP, alpha: 0.4 * s + 0.15 });
      this.pool.add("glow", { ...at, size: 1.2 + 2.6 * s, rgb: JADE, hot: 0.2, alpha: 0.45 + 0.3 * s });
      if (s > 0.4) this.pool.add("glow", { ...at, size: (1.2 + 2.6 * s) * 1.7, rgb: AMBER, alpha: 0.28 * s });
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
        // Which way it runs on screen: its word trails behind its head in reading order (judge C10 r5: cycled letters read "EYEEYE").
        const [sa, sb] = [this.stage.project(muzzle.x, muzzle.y, muzzle.z), this.stage.project(muzzle.x + P.tx[p]! - P.ox[p]!, muzzle.y, muzzle.z + P.tz[p]! - P.oz[p]!)];
        shot = { born: w.tick, x0: muzzle.x, z0: muzzle.z, y0: muzzle.y, total: Math.max(1, Math.hypot(P.tx[p]! - P.ox[p]!, P.tz[p]! - P.oz[p]!)), word, side: sb.x < sa.x - 4 ? -1 : 1, trail: ![...this.shots.values()].some((s) => s.trail && Math.abs(s.x0 - muzzle.x) < 0.1 && Math.abs(s.z0 - muzzle.z) < 0.1), x: muzzle.x, y: muzzle.y, z: muzzle.z, splash: P.splash[p]!, bolt, frame: 0, call: fired?.call ?? -1 };
        this.shots.set(id, shot);
        if (!twin) this.release(w, b, muzzle, new THREE.Vector3(P.tx[p]! - P.ox[p]!, 0, P.tz[p]! - P.oz[p]!).normalize(), now, bolt, shot.call);
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

  /**
   * Where a flash of `size` m at `at` shows: when the card of call `call` hides more than a third of it, lowered on screen (at its
   * depth, ≤ 1.6 of its radius: still on the tower) until its body is under the card's bottom (judge C10 r3, r5).
   */
  private clear(at: THREE.Vector3, size: number, call: number): THREE.Vector3 {
    const card = this.lastCard;
    const out = at.clone();
    if (card === null || card.call !== call) return out;
    const s = this.stage.project(at.x, at.y, at.z);
    const depth = at.distanceTo(this.stage.camera.position);
    const r = (0.42 * size) / this.metres(depth); // the amber halo's seen radius, px
    const bottom = card.y + card.height;
    this.marks.card = [card.x - card.half * 1.1, card.y - card.height * 0.1, card.x + card.half * 1.1, bottom].map(Math.round);
    const dy = Math.min(1.6 * r, bottom + 0.8 * r - s.y); // 0.8 r: its body (0.7 r) wholly under the card (judge C10 r5: 0.4 r hid its top third)
    return Math.abs(s.x - card.x) > card.half * 1.1 + r || dy <= 0 ? out : this.ray(s.x, s.y + dy, depth, out);
  }

  /** R at the muzzle, in the frame the shot leaves. */
  private release(w: World, b: number, muzzle: THREE.Vector3, dir: THREE.Vector3, now: number, bolt: boolean, call: number): void {
    const tier = chainTier(w.typing.chain);
    this.heading = [dir.x, dir.z];
    const size = (bolt ? 4.5 : 6.5) * (1 + 0.1 * tier);
    const at = this.clear(muzzle, size, call);
    const s = this.stage.project(at.x, at.y, at.z);
    this.marks.release = [Math.round(s.x), Math.round(s.y)];
    const ahead = this.stage.project(at.x + dir.x * 6, at.y, at.z + dir.z * 6);
    [this.shotAt, this.shotSide] = [now, Math.abs(ahead.x - s.x) > 4 ? Math.sign(ahead.x - s.x) : 0];
    // R is painted, not only lit (C10 r4: light added over a white stone tower always tends to white, whatever its hue): deep jade
    // under a jade body (normal blend, so it stays jade on any roof), an amber rim, then a small additive core (its white ≤ 30 % of
    // the body), a faint jade halo and jade sparks; the amber rim is its ring (a jade ring of light on it read white).
    const [o, body] = [{ x: at.x, y: at.y, z: at.z }, bolt ? GOLD : JADE];
    this.pool.add("ink", { ...o, size: size * 2, life: 0.22, rgb: DEEP, alpha: 0.86 });
    this.pool.add("ink", { ...o, size, life: 0.12, rgb: body, alpha: 0.92 });
    this.pool.add("ink", { ...o, size: size * 1.06, grow: 0.18, life: 0.17, rgb: AMBER, alpha: 0.9, shape: SHAPE.ring });
    this.pool.add("glow", { ...o, size: size * 0.5, life: 0.1, rgb: body, hot: 0.5, alpha: 0.9 });
    this.pool.add("glow", { ...o, size: size * 1.9, life: 0.17, rgb: body, alpha: 0.12 });
    // Lowered under the card: the muzzle above, where the word's letters and the charge land, gets its deep jade too.
    if (at.distanceToSquared(muzzle) > 0.01) this.pool.add("ink", { x: muzzle.x, y: muzzle.y, z: muzzle.z, size: size * 1.4, life: 0.22, rgb: DEEP, alpha: 0.85 });
    this.sparks(at, 10 + tier, [24, 40], dir.clone().setY(0.25), { hot: 0.1 }, size * 0.2, [JADE, JADE]);
    // Under the card that stands over the tower, the release still shows: a jade ring on the ground round its foot.
    if (b >= 0) this.ring(this.v[1]!.set(w.buildings.x[b]!, 0, w.buildings.z[b]!), Math.max(2.6, 1.4 * w.c.buildings[w.buildings.def[b]!]!.radius), JADE, 0.32, true, 0.75, 0.35);
    this.smoke(at, 4, 3.6, 0.9);
    if (b >= 0 && !this.soft) this.houses.kick(w.buildings.id(b), now);
    for (const [id, c] of this.charges) if (c.core.distanceToSquared(muzzle) < 64) [this.flash(c.core, 2.8, JADE, 0.08, 0.55, DEEP, JADE), this.charges.delete(id)]; // all jade: a HOT one was the white blob, an amber rim here read white under the landing letters
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
    // The word itself rides behind the head, a letter a cell apart along the path, in reading order on screen (the last letter
    // next to the head when it runs right, the first when it runs left); each shows once the head has gone that far.
    const word = shot.trail ? shot.word.slice(0, 8) : ""; // one word a volley: its shots' words piled up into "EAMMM" by the tower
    const cell = 1.55 * big;
    const gone = Math.hypot(x - shot.x0, z - shot.z0);
    for (let j = 0; j < word.length; j += 1) {
      const behind = cell * (shot.side < 0 ? j + 1 : word.length - j);
      if (behind >= gone) continue;
      const g = 1 - behind / gone;
      const [lx, lz] = [shot.x0 + (x - shot.x0) * g, shot.z0 + (z - shot.z0) * g];
      const fj = f * g;
      const at = { x: lx, y: shot.y0 + (1.2 - shot.y0) * fj + 0.08 * shot.total * Math.sin(Math.PI * fj) + heightAt(this.map, lx, lz) * fj, z: lz, life: ONE_FRAME, shape: SHAPE.letter, glyph: Math.max(0, this.glyph(word, j)) };
      this.pool.add("ink", { ...at, size: 1.9 * big, rgb: INK, alpha: 0.9 });
      this.pool.add("glow", { ...at, size: 1.6 * big, rgb: JADE, hot: 0.4 });
    }
  }

  /** I and F where a shot ended: flash, a ground ring of its splash radius, sparks, its letters scattering, smoke, embers, a scorch. */
  private impact(shot: Shot): void {
    const at = new THREE.Vector3(shot.x, shot.y, shot.z);
    const reach = Math.max(2, shot.splash);
    const s = this.stage.project(at.x, at.y, at.z);
    this.marks.impact = [Math.round(s.x), Math.round(s.y)];
    this.flash(at, Math.max(shot.bolt ? 4 : 6, 2.4 * shot.splash), shot.bolt ? GOLD : JADE, 0.12, 0.55, DEEP, AMBER);
    this.ring(at, reach, shot.bolt ? GOLD : JADE, 0.3, true);
    const floor = heightAt(this.map, at.x, at.z);
    this.sparks(at, shot.bolt ? 10 : 16, [12, 24], null, { gravity: 14, floor, life: this.rnd(0.3, 0.45), hot: 0.3 }, 0, [AMBER, JADE]);
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
    return { fxGlow: live.glow, fxInk: live.ink, fxShots: this.shots.size, keyMs: Math.round(this.keyMs * 10) / 10, keyFrames: this.keyFrames, answerMs: Math.round(this.answerMs), anchors: JSON.stringify(this.gaps), shotDx: this.heading[0]!, shotDz: this.heading[1]!, marks: JSON.stringify(this.marks), tag: tag ? JSON.stringify([tag.left, tag.top, tag.width, tag.height].map(Math.round)) : "", tray: JSON.stringify([...this.trayLast]), pointers: JSON.stringify(this.pointerBoxes) };
  }

  dispose(): void {
    removeEventListener("keydown", this.down, { capture: true });
    this.tag?.el.remove();
    for (const fly of this.flies) fly.el.remove();
    this.miss?.remove();
    this.pool.dispose();
  }
}
