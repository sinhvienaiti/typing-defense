/**
 * The 1A picture (docs/td/BUILD_NOW.md §5.1, BUILD_1A6 §9): the world seen
 * from above on a Canvas 2D, no media. Grass, lanes, the Silver Stream and
 * its bridges, ore nodes, trees (stumps once felled, a gold rim when marked),
 * buildings as discs of their true radius (a site dashed, its progress an
 * arc), a farm's four plots by stage with a harvest bar, a tower's five power
 * charges, enemies as ink-purple dots sized by tier, soldiers, the NPC workers
 * lettered (a miner by each mine) with "!" at work and "…" when their call
 * waits, shots and short-lived hit marks read from the combat ring; the hero
 * and the helpers with their paths and the selected one's help ring; Word
 * Shots with a jade head trailing their word; a dim call's faded bubble (no
 * word: walk over to help), an arrow at the edge for a call off screen; the
 * player's hand. The camera zooms and pans. It reads the world and never changes it.
 * Painted in the Văn Điền palette (SPLIT_PLAN D7; theme.css): terraced paddies in the field, ripe paddies
 * and stilt-house roofs beyond a bamboo hedge, a silver stream, earth paths, trees as bamboo clumps. The
 * ground that does not change is painted once per camera into a second canvas; at night an indigo wash
 * falls on it and the buildings glow like lanterns (eased over ~1 s, the picture's own clock).
 */
import { AGENT, BUILD, FARM, TICK_HZ, TREE } from "../content/rules";
import { FX } from "../sim/events";
import { MODE, PATH_MAX } from "../sim/stores/agents";
import { PLOT } from "../sim/stores/buildings";
import { CALL_STATE } from "../sim/stores/calls";
import { TASK } from "../sim/stores/npcs";
import { PROJECTILE } from "../sim/stores/projectiles";
import { slotsOpen } from "../sim/systems/agents";
import { plotAt } from "../sim/systems/economy";
import type { World } from "../sim/world";
import { wordText } from "../typing/decks";
import { BossView, type Pen } from "./boss-2d";
import { CALL_COLOR, CALL_ICON, pips, ROOF_M } from "./words/cards";

/** The Văn Điền palette (theme.css --vd-*): paddies, bamboo, silver water, earth paths; the meaning colours as TK 23.3. */
const COLOR = {
  paddy: ["#93c45a", "#86b84f", "#9dcb66", "#8abd54", "#a5d39c"], dike: "#5c8a36", ripe: ["#d6ae4c", "#c9a043", "#ddb95e", "#c39a40"], ripeDike: "#8a6a2a",
  hedge: "#2b4a22", hedgeLeaf: "#3f6b2e", hedgeTop: "#5f8f3e", roof: ["#d4b06a", "#9a7440", "#b8914f"], roofRidge: "#5b3a1c",
  road: "#c8a06a", roadEdge: "#7d5a33", water: "#8fc3cf", waterEdge: "#4f8796", ripple: "rgba(255, 255, 255, 0.55)", bridge: "#8a5a2b",
  ink: "#2b2118", paper: "#fff4d6", ore: "#c98a2e", soldier: "#3b7ddd", enemyHp: "#ff4a4a", buildingHp: "#ffb020", jade: "#0b8a78", lamp: "#ffb84d",
  bamboo: "#2f5a26", culm: "#7fae4a", stump: "#8a6a3a", plots: ["#8b5a2b", "#b5e48c", "#4f9a2f", "#e9c46a"], rift: "#2a1840",
} as const;
/** Ground darkness by phase (night at full, dawn halfway) and the ms it takes to get there. */
const DARK = { night: 1, dawn: 0.45, ms: 1200 } as const;
/** A seeded wobble for the painting: the same picture every frame and load. */
const wob = (k: number): number => {
  const x = Math.sin(k * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
/** NPC letters (§9): N farmer, D villager, X builder; M the miner by a mine. */
const NPC_LETTER = ["N", "D", "X"];
const NPC_FILL = ["#f4d35e", "#c8b6a6", "#d9a066"];

const FONT = '"Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif';
/** How long a hit mark stays, in ticks. */
const MARK_TICKS = 24;
/** Draconis from above, nose up: a body and two swept wings, in metres. */
const DRAGON = new Path2D("M0 -1.15L0.35 -0.15L1.3 0.7L0.27 0.4L0 0.85L-0.27 0.4L-1.3 0.7L-0.35 -0.15Z");
/** The rally flag: a pole up from the point, a pennant at its top. */
const FLAG = new Path2D("M0 0V-1.6L1.1 -1.25L0 -0.9Z");

type Mark = { kind: number; x: number; z: number; value: number; tick: number };
/** The player's hand (app/selection.ts): the selected agent, the building and the dim call in focus by id, the build menu's kind and ghost. */
export type Hand = { agent: number; focus: number; call: number; kind: number; ghost(): { x: number; z: number; reason: string } | null };
type Bubble = { id: number; x: number; y: number; w: number; h: number };

export class DebugView {
  private ctx: CanvasRenderingContext2D;
  private readonly screen: CanvasRenderingContext2D;
  /** The painted ground for the current camera, and the camera it was painted for. */
  private readonly base = document.createElement("canvas");
  private baseKey = "";
  private dark = 0;
  private darkAt = -1;
  private scale = 1;
  private ox = 0;
  private oy = 0;
  private ratio = 1;
  /** The scale at zoom 1, and the middle of the area the field fits in (canvas px): zoom and pan stay around them. */
  private readonly fit = { scale: 1, x: 0, y: 0 };
  private readCursor = 0;
  private readonly marks: Mark[] = [];
  /** The dim bubbles drawn last frame, CSS px: what a click hits. */
  private readonly bubbles: Bubble[] = [];
  /** Mộc Tinh's layers (BUILD_1B §13.1); main.ts hands it each frame's events. */
  readonly boss = new BossView();
  private readonly pen: Pen = { ctx: null as unknown as CanvasRenderingContext2D, px: (pixels) => this.px(pixels), text: (label, x, z, size, color, weight, edge) => this.text(label, x, z, size, color, weight, edge) };

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (ctx === null) throw new Error("typing defense: no 2D canvas");
    this.ctx = this.screen = ctx;
  }

  /** Fits the field (with a margin) into the canvas between the `top` px the boss bar keeps and the `bottom` px the word strip keeps. */
  resize(cssWidth: number, cssHeight: number, ratio: number, halfM: number, bottom: number, top = 0): void {
    this.ratio = ratio;
    this.canvas.width = Math.round(cssWidth * ratio);
    this.canvas.height = Math.round(cssHeight * ratio);
    this.fit.scale = this.scale = (Math.min(cssWidth, cssHeight - bottom - top) / (halfM * 2 + 4)) * ratio;
    this.fit.x = this.ox = this.canvas.width / 2;
    this.fit.y = this.oy = (top + (cssHeight - bottom - top) / 2) * ratio;
  }

  /** Moves the field `dx`, `dy` CSS px; its centre stays within half its size of the middle. */
  panBy(dx: number, dy: number): void {
    const room = this.scale * 50;
    this.ox = Math.max(this.fit.x - room, Math.min(this.fit.x + room, this.ox + dx * this.ratio));
    this.oy = Math.max(this.fit.y - room, Math.min(this.fit.y + room, this.oy + dy * this.ratio));
  }

  /** Zooms 1–2.5× (BUILD_NOW §5.4) about the point under (px, py). */
  zoomAt(px: number, py: number, factor: number): void {
    const k = Math.max(this.fit.scale, Math.min(2.5 * this.fit.scale, this.scale * factor)) / this.scale;
    this.scale *= k;
    this.ox = px * this.ratio - k * (px * this.ratio - this.ox);
    this.oy = py * this.ratio - k * (py * this.ratio - this.oy);
    this.panBy(0, 0);
  }

  /** Screen point (CSS px) of a world point. */
  project(x: number, z: number): { x: number; y: number } {
    return { x: (this.ox + x * this.scale) / this.ratio, y: (this.oy + z * this.scale) / this.ratio };
  }

  unproject(px: number, py: number): { x: number; z: number } {
    return { x: (px * this.ratio - this.ox) / this.scale, z: (py * this.ratio - this.oy) / this.scale };
  }

  /** The call (id) whose dim bubble is under the CSS point, −1 none. */
  callAt(px: number, py: number): number {
    return this.bubbles.find((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h)?.id ?? -1;
  }

  draw(w: World, hand: Hand): void {
    this.paintBase(w);
    const { ctx } = this;
    const now = performance.now();
    // The ground shakes ≤ 2 px in the lull and as the boss breaks out (none with reduced motion).
    const [qx, qy] = this.boss.quake(w, now);
    [this.ox, this.oy] = [this.ox + qx, this.oy + qy];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.base, qx, qy);
    ctx.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
    this.pen.ctx = ctx;
    this.night(w);
    this.nodes(w);
    this.trees(w);
    this.boss.under(this.pen, w, now);
    this.buildings(w, hand, now);
    this.ghost(w, hand);
    this.soldiers(w);
    this.enemies(w);
    this.boss.over(this.pen, w, now);
    this.boss.marks(this.pen, w);
    this.npcs(w);
    this.agents(w, hand);
    this.shots(w);
    this.readMarks(w);
    this.drawMarks(w);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.boss.sky(ctx, w, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
    this.calls(w, hand);
    [this.ox, this.oy] = [this.ox - qx, this.oy - qy];
  }

  private px(pixels: number): number {
    return (pixels * this.ratio) / this.scale;
  }

  private disc(x: number, z: number, r: number, fill: string | null, stroke: string | null, strokePx = 1.5): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.arc(x, z, r, 0, Math.PI * 2);
    if (fill !== null) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke !== null) {
      ctx.lineWidth = this.px(strokePx);
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  /** A label in screen pixels at a world point; with `edge`, on a paper chip edged in that colour (TK 12.5's reason chip). */
  private text(label: string, x: number, z: number, sizePx: number, color: string, weight = 800, edge = ""): void {
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = weight + " " + Math.round(sizePx * this.ratio) + "px " + FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (edge !== "") {
      const half = ctx.measureText(label).width / 2 + 0.6 * sizePx * this.ratio;
      ctx.beginPath();
      ctx.roundRect(this.ox + x * this.scale - half, this.oy + z * this.scale - 0.85 * sizePx * this.ratio, half * 2, 1.7 * sizePx * this.ratio, 6 * this.ratio);
      Object.assign(ctx, { fillStyle: COLOR.paper, strokeStyle: edge, lineWidth: 2 * this.ratio });
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.fillText(label, this.ox + x * this.scale, this.oy + z * this.scale);
    ctx.restore();
  }

  private bar(x: number, z: number, width: number, share: number, color: string): void {
    const { ctx } = this;
    const h = this.px(4);
    ctx.fillStyle = COLOR.ink;
    ctx.fillRect(x - width / 2 - this.px(1), z - this.px(1), width + this.px(2), h + this.px(2));
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, z, width * Math.max(0, Math.min(1, share)), h);
  }

  /** The ground that never changes, painted again only when the camera or the canvas does. */
  private paintBase(w: World): void {
    const key = [this.canvas.width, this.canvas.height, this.scale, this.ox, this.oy].join();
    if (key === this.baseKey) return;
    this.baseKey = key;
    [this.base.width, this.base.height] = [this.canvas.width, this.canvas.height];
    this.ctx = this.base.getContext("2d")!;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = COLOR.ripe[1];
    this.ctx.fillRect(0, 0, this.base.width, this.base.height);
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
    this.fields(w);
    this.ground(w);
    this.ctx = this.screen;
  }

  /** Rice drawn small over a paddy: a tile of seedlings or ears, its size in screen pixels, fixed to the ground. */
  private rice(color: string): CanvasPattern {
    const tile = Object.assign(document.createElement("canvas"), { width: 18, height: 14 });
    const t = tile.getContext("2d")!;
    Object.assign(t, { strokeStyle: color, lineWidth: 1.3, lineCap: "round" });
    t.beginPath();
    for (const [x, y] of [[3, 4], [10, 11], [15, 4]] as const) {
      t.moveTo(x, y + 2.5);
      t.lineTo(x + 0.6, y - 2);
      t.moveTo(x, y + 2.5);
      t.lineTo(x - 2, y - 0.5);
    }
    t.stroke();
    const pattern = this.ctx.createPattern(tile, "repeat")!;
    pattern.setTransform(new DOMMatrix().scaleSelf(this.ratio / this.scale));
    return pattern;
  }

  /**
   * Paddies: terraces whose dikes follow slow waves, green in the field (one in five flooded), ripe gold beyond
   * it out to what the camera can see; the village out there (hipped thatch roofs, a pond, bamboo); the bamboo
   * hedge (lũy tre) round the field.
   */
  private fields(w: World): void {
    const { ctx } = this;
    const half = w.map.halfM;
    const view = { x0: -this.ox / this.scale, z0: -this.oy / this.scale, x1: (this.canvas.width - this.ox) / this.scale, z1: (this.canvas.height - this.oy) / this.scale };
    const band = (k: number, x: number): number => k * 4 + 1.3 * Math.sin(x * 0.085 + k * 0.7) + 0.6 * Math.sin(x * 0.21 + k * 1.9);
    const terraces = (x0: number, x1: number, z0: number, z1: number, fills: readonly string[], dike: string, rice: string): void => {
      for (let k = Math.floor(z0 / 4) - 1; k * 4 < z1 + 4; k += 1) {
        ctx.beginPath();
        for (let x = x0 - 3; x <= x1 + 3; x += 3) ctx.lineTo(x, band(k, x));
        for (let x = x1 + 3; x >= x0 - 3; x -= 3) ctx.lineTo(x, band(k + 1, x));
        ctx.fillStyle = fills[((k % fills.length) + fills.length) % fills.length]!;
        ctx.fill();
      }
      Object.assign(ctx, { fillStyle: this.rice(rice), globalAlpha: 0.55 });
      ctx.fillRect(x0 - 3, z0 - 4, x1 - x0 + 6, z1 - z0 + 8);
      Object.assign(ctx, { strokeStyle: dike, lineWidth: this.px(1.5), globalAlpha: 0.75 });
      ctx.beginPath();
      for (let k = Math.floor(z0 / 4) - 1; k * 4 < z1 + 4; k += 1) {
        ctx.moveTo(x0 - 3, band(k, x0 - 3));
        for (let x = x0; x <= x1 + 3; x += 3) ctx.lineTo(x, band(k, x));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    terraces(view.x0, view.x1, view.z0, view.z1, COLOR.ripe, COLOR.ripeDike, "rgba(120, 82, 20, 0.55)");
    // The village beyond the hedge, east and west of the Bastion: a pond, hipped thatch roofs, bamboo by each house.
    const clumps: [number, number, number][] = [];
    ctx.beginPath();
    ctx.ellipse(-half - 15, 30, 5.5, 3.6, 0.3, 0, Math.PI * 2);
    Object.assign(ctx, { fillStyle: COLOR.water, strokeStyle: COLOR.waterEdge, lineWidth: this.px(2) });
    ctx.fill();
    ctx.stroke();
    for (let k = 0; k < 12; k += 1) {
      const x = (k % 2 === 0 ? -1 : 1) * (half + 9 + wob(k) * 16);
      const z = -2 + Math.floor(k / 2) * 9 + wob(k + 3) * 4;
      if (Math.hypot(x + half + 15, z - 30) < 9) continue;
      this.roof(x, z, 7 + wob(k + 5) * 2, 4.4);
      clumps.push([x + 5.5, z - 2.5, 1.5], [x - 5, z + 3, 1.3]);
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(-half, -half, half * 2, half * 2);
    ctx.clip();
    terraces(-half, half, -half, half, COLOR.paddy, COLOR.dike, "rgba(46, 84, 24, 0.5)");
    ctx.restore();
    // The bamboo hedge: clumps along the field's edge, just outside it.
    for (let d = -half - 1; d <= half + 1; d += 2.6) {
      for (const [x, z] of [[d, -half - 1.6], [d, half + 1.6], [-half - 1.6, d], [half + 1.6, d]] as const) clumps.push([x + (wob(d * 7 + x) - 0.5), z + (wob(d * 3 + z) - 0.5), 1.4 + wob(d + x + z) * 0.6]);
    }
    for (const [fill, grow, dx] of [[COLOR.hedge, 0.25, 0.3], [COLOR.hedgeLeaf, 0, 0], [COLOR.hedgeTop, -0.6, -0.35]] as const) {
      ctx.beginPath();
      for (const [x, z, r] of clumps) {
        ctx.moveTo(x + dx + r + grow, z + dx);
        ctx.arc(x + dx, z + dx, r + grow, 0, Math.PI * 2);
      }
      ctx.fillStyle = fill;
      ctx.fill();
    }
  }

  /** A hipped thatch roof from above, `w` × `d` m, its ridge east to west: a light north face, a dark south one. */
  private roof(x: number, z: number, w: number, d: number): void {
    const { ctx } = this;
    const [a, b, r] = [w / 2, d / 2, (w - d) / 2];
    ctx.fillStyle = "rgba(43, 33, 24, 0.3)";
    ctx.fillRect(x - a + 0.7, z - b + 0.9, w, d);
    const faces: [string, number[]][] = [
      [COLOR.roof[0], [-a, -b, a, -b, r, 0, -r, 0]], [COLOR.roof[1], [-a, b, a, b, r, 0, -r, 0]], [COLOR.roof[2], [-a, -b, -r, 0, -a, b]], [COLOR.roof[2], [a, -b, r, 0, a, b]],
    ];
    Object.assign(ctx, { strokeStyle: COLOR.roofRidge, lineWidth: this.px(1.2), lineJoin: "round" });
    for (const [fill, points] of faces) {
      ctx.beginPath();
      for (let k = 0; k < points.length; k += 2) ctx.lineTo(x + points[k]!, z + points[k + 1]!);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();
    }
  }

  private ground(w: World): void {
    const { ctx } = this;
    // The silver stream: water edged in a darker line, ripples drawn across it.
    for (const rect of w.map.water) {
      Object.assign(ctx, { fillStyle: COLOR.water, strokeStyle: COLOR.waterEdge, lineWidth: this.px(1.5) });
      ctx.fillRect(rect.x0, rect.z0, rect.x1 - rect.x0, rect.z1 - rect.z0);
      ctx.beginPath();
      ctx.moveTo(rect.x0, rect.z0);
      ctx.lineTo(rect.x0, rect.z1);
      ctx.moveTo(rect.x1, rect.z0);
      ctx.lineTo(rect.x1, rect.z1);
      ctx.stroke();
      Object.assign(ctx, { strokeStyle: COLOR.ripple, lineWidth: this.px(1.2) });
      ctx.beginPath();
      for (let z = rect.z0 + 1; z < rect.z1; z += 2.3) {
        const x = rect.x0 + 0.5 + wob(z) * (rect.x1 - rect.x0 - 1.6);
        ctx.moveTo(x, z);
        ctx.quadraticCurveTo(x + 0.3, z - 0.35, x + 0.8, z);
      }
      ctx.stroke();
    }
    // Roads: a dark rim, then the dirt on top, so the fork reads as one road.
    const lanes = w.lanes.slice(0, -1);
    for (const [color, extra] of [[COLOR.roadEdge, this.px(3)], [COLOR.road, 0]] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = w.map.roadHalfM * 2 + extra;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const lane of lanes) {
        ctx.beginPath();
        for (let index = 0; index < lane.xs.length; index += 4) ctx.lineTo(lane.xs[index]!, lane.zs[index]!);
        ctx.lineTo(lane.xs[lane.xs.length - 1]!, lane.zs[lane.zs.length - 1]!);
        ctx.stroke();
      }
    }
    for (const rect of w.map.bridges) {
      ctx.fillStyle = COLOR.bridge;
      ctx.fillRect(rect.x0 - 0.3, rect.z0, rect.x1 - rect.x0 + 0.6, rect.z1 - rect.z0);
      ctx.strokeStyle = COLOR.ink;
      ctx.lineWidth = this.px(1);
      ctx.beginPath();
      for (let x = rect.x0 + 0.5; x < rect.x1; x += 0.75) ctx.rect(x, rect.z0, 0, rect.z1 - rect.z0);
      ctx.stroke();
    }
    // The flying route: a faint dashed line.
    const fly = w.lanes[w.lanes.length - 1]!;
    ctx.setLineDash([this.px(6), this.px(6)]);
    ctx.strokeStyle = "rgba(255, 244, 214, 0.75)";
    ctx.lineWidth = this.px(1.5);
    ctx.beginPath();
    for (let index = 0; index < fly.xs.length; index += 8) ctx.lineTo(fly.xs[index]!, fly.zs[index]!);
    ctx.stroke();
    // No building inside this ring around the Bastion.
    this.disc(w.map.keep[0], w.map.keep[1], BUILD.keepClearM, null, "rgba(43, 33, 24, 0.55)");
    ctx.setLineDash([]);
    // The rift: a pool of Mực Câm ink with splashes round it.
    const [gx, gz] = w.map.gate;
    for (let k = 0; k < 7; k += 1) this.disc(gx + Math.cos(k * 0.9) * (2.6 + wob(k) * 1.2), gz + Math.sin(k * 0.9) * (2.6 + wob(k) * 1.2), 0.35 + wob(k + 7) * 0.45, COLOR.rift, null);
    this.disc(gx, gz, 2.4, COLOR.rift, COLOR.ink, 2);
    this.disc(gx, gz, 1.3, "#5b3a8c", null);
  }

  /** Ore nodes no mine stands on: a ring and its stars. */
  private nodes(w: World): void {
    w.map.nodes.forEach((node, index) => {
      if (w.buildings.live(1).some((b) => w.buildings.node[b] === index)) return; // a mine stands on it
      this.disc(node.x, node.z, BUILD.footprintR.L, "rgba(201, 138, 46, 0.25)", COLOR.ore, 2);
      this.text("★".repeat(node.richness), node.x, node.z, 12, COLOR.ore);
    });
  }

  /**
   * Bamboo clumps from above: a dark round clump edged in ink (a gold rim when marked) with five light culm
   * tops in it, a cut ring once felled; the chop's bar under it. One path per layer for every tree.
   */
  private trees(w: World): void {
    const { ctx } = this;
    const r = TREE.radiusM;
    const standing = w.map.trees.filter((_, t) => w.trees.standing[t] === 1);
    ctx.beginPath();
    for (const [x, z] of standing) {
      ctx.moveTo(x + r, z);
      ctx.arc(x, z, r, 0, Math.PI * 2);
    }
    Object.assign(ctx, { fillStyle: COLOR.bamboo, strokeStyle: COLOR.ink, lineWidth: this.px(1) });
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (const [x, z] of standing) {
      for (let k = 0; k < 5; k += 1) {
        const a = k * 1.2566 + x;
        ctx.moveTo(x + Math.cos(a) * r * 0.48 + r * 0.2, z + Math.sin(a) * r * 0.48);
        ctx.arc(x + Math.cos(a) * r * 0.48, z + Math.sin(a) * r * 0.48, r * 0.2, 0, Math.PI * 2);
      }
    }
    ctx.fillStyle = COLOR.culm;
    ctx.fill();
    w.map.trees.forEach(([x, z], t) => {
      if (w.trees.standing[t] === 0) return this.disc(x, z, 0.45, COLOR.stump, COLOR.ink, 1);
      if (w.trees.marked[t] === 1) this.disc(x, z, r, null, COLOR.lamp, 3.5);
      if (w.trees.progress[t]! > 0) this.bar(x, z + r + 0.4, 2.4, w.trees.progress[t]!, COLOR.lamp);
    });
  }

  /** Night falls on the ground (not on what stands on it): an indigo wash, the buildings glowing like lanterns. */
  private night(w: World): void {
    const now = performance.now();
    const target = w.phase === "night" ? DARK.night : w.phase === "dawn" ? DARK.dawn : 0;
    this.dark += (target - this.dark) * Math.min(1, this.darkAt < 0 ? 1 : (now - this.darkAt) / DARK.ms);
    this.darkAt = now;
    if (this.dark < 0.01) return;
    const { ctx } = this;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(22, 26, 74, " + (0.5 * this.dark).toFixed(3) + ")";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    ctx.globalCompositeOperation = "lighter";
    const B = w.buildings;
    for (const b of B.live()) {
      if (B.ready[b] === 0) continue;
      const reach = w.c.buildings[B.def[b]!]!.radius + 4;
      const glow = ctx.createRadialGradient(B.x[b]!, B.z[b]!, 0, B.x[b]!, B.z[b]!, reach);
      glow.addColorStop(0, "rgba(255, 170, 70, " + (0.35 * this.dark).toFixed(3) + ")");
      glow.addColorStop(1, "rgba(255, 170, 70, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(B.x[b]! - reach, B.z[b]! - reach, reach * 2, reach * 2);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  private buildings(w: World, hand: Hand, now: number): void {
    const B = w.buildings;
    const { ctx } = this;
    for (let b = 0; b < B.top; b += 1) {
      if (B.used[b] === 0) continue;
      const spec = w.c.buildings[B.def[b]!]!;
      const x = B.x[b]! + this.boss.offset(B.id(b), now);
      const z = B.z[b]!;
      const stunned = B.stunUntil[b]! > w.tick;
      const r = spec.radius;
      const level = B.level[b]!;
      const site = B.ready[b] === 0;
      if (B.id(b) === hand.focus) this.disc(x, z, r + 0.7, "rgba(127, 245, 224, 0.35)", COLOR.jade, 3);
      if (spec.attack !== null && !site) this.disc(x, z, spec.attack.levels[level - 1]!.range, null, stunned ? "rgba(120, 120, 120, 0.55)" : "rgba(43, 33, 24, 0.22)", stunned ? 2 : 1);
      if (site) ctx.setLineDash([this.px(4), this.px(3)]);
      this.disc(x, z, r, site ? "rgba(255, 244, 214, 0.6)" : spec.def.view.color, COLOR.ink, 2);
      ctx.setLineDash([]);
      if (!site && !spec.farm) this.disc(x, z, r * 0.74, null, "rgba(255, 244, 214, 0.45)", 1.5); // the roof's ridge ring
      if (B.upTo[b]! > 0) {
        Object.assign(ctx, { strokeStyle: COLOR.jade, lineWidth: this.px(4) });
        ctx.beginPath();
        ctx.arc(x, z, r + 0.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * B.progress[b]!);
        ctx.stroke();
      }
      if (spec.farm && !site) {
        // Soil, seedlings (the first half of growing), green rice, ripe gold; a ripe plot being cut shows its bar.
        for (let p = 0; p < FARM.plots; p += 1) {
          const at = plotAt(w, b, p);
          const stage = B.plot[b * FARM.plots + p]!;
          const work = B.plotWork[b * FARM.plots + p]!;
          ctx.fillStyle = COLOR.plots[stage === PLOT.ripe ? 3 : stage === PLOT.growing ? (work < 0.5 ? 1 : 2) : 0]!;
          ctx.fillRect(at.x - 0.9, at.z - 0.9, 1.8, 1.8);
          Object.assign(ctx, { strokeStyle: COLOR.ink, lineWidth: this.px(1) });
          ctx.strokeRect(at.x - 0.9, at.z - 0.9, 1.8, 1.8);
          if (stage === PLOT.ripe && work > 0) this.bar(at.x, at.z + 0.5, 1.6, work, COLOR.jade);
        }
      } else this.text(spec.def.view.short, x, z - 0.2, b === 0 ? 15 : 14, COLOR.ink);
      // Level marks under the letter (the Bastion has 4 levels).
      for (let mark = 0; mark < level; mark += 1) {
        ctx.fillStyle = COLOR.ink;
        ctx.fillRect(x - 0.6 * level + mark * 1.2 + 0.25, z + r * 0.45, 0.7, this.px(3));
      }
      // Five power charges under a tower (§4.5), at least 7 px across at any zoom.
      const [pip, step] = [Math.max(0.35, this.px(3.5)), Math.max(0.95, this.px(9))];
      for (let k = 0; spec.attack !== null && !site && k < 5; k += 1) this.disc(x + (k - 2) * step, z + r + pip + 0.4, pip, k < B.charges[b]! ? COLOR.jade : COLOR.paper, COLOR.ink, 1);
      if (spec.mine !== null && !site) this.worker(x - r - 0.2, z + r * 0.5, "M", "#e0b33a", B.call[b]!, w); // the miner never stops
      else if (B.call[b]! >= 0) this.text(w.calls.state[B.call[b]!] === CALL_STATE.queued ? "…" : "!", x, z - r - 1.2, 14, COLOR.ink);
      if (spec.hp[0] > 0 && B.hp[b]! < spec.hp[level - 1]!) this.bar(x, z + r + 0.5, r * 2, B.hp[b]! / spec.hp[level - 1]!, COLOR.buildingHp);
      if (spec.barracks !== null) this.shape(FLAG, B.rallyX[b]!, B.rallyZ[b]!, COLOR.soldier);
      if (spec.mine !== null && B.pile[b]! > 0) this.text("+" + Math.floor(B.pile[b]! / 1000), x + r + 1.2, z, 11, "#7a4f12");
    }
  }

  /** A worker: a small lettered dot; over it "!" at work (call −1: working alone, −2: idle) or "…" while its call waits in the queue. */
  private worker(x: number, z: number, letter: string, fill: string, call: number, w: World): void {
    this.disc(x, z, 0.7, fill, COLOR.ink, 1.2);
    this.text(letter, x, z, 10, COLOR.ink);
    if (call >= -1) this.text(call >= 0 && w.calls.state[call] === CALL_STATE.queued ? "…" : "!", x, z - 1.3, 13, COLOR.ink);
  }

  private npcs(w: World): void {
    const N = w.npcs;
    for (let n = 0; n < N.top; n += 1) {
      if (N.used[n] === 0) continue;
      this.worker(N.x[n]!, N.z[n]!, NPC_LETTER[N.kind[n]!]!, NPC_FILL[N.kind[n]!]!, N.task[n] === TASK.working ? N.call[n]! : -2, w);
    }
  }

  /**
   * Open calls (BUILD_1A6 §9): one off the zoom-1 field's picture is an arrow at its edge in the kind's colour; a
   * dim one on screen is a faded bubble over its caller with the kind's icon and its word dots, no word (the help
   * ring lights it), stacked up out of each other's way; the one Tab is on gets a jade rim. Screen pixels; the
   * bubbles are kept (CSS px) for clicks.
   */
  private calls(w: World, hand: Hand): void {
    const { ctx, ratio } = this;
    const C = w.calls;
    const half = this.fit.scale * (w.map.halfM + 2) - 22 * ratio;
    const dim: (Bubble & { c: number })[] = [];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textBaseline = "middle";
    for (const c of C.live()) {
      if (C.state[c] !== CALL_STATE.open) continue;
      const kind = C.kind[c]!;
      const dx = this.ox + C.x[c]! * this.scale - this.fit.x;
      const dy = this.oy + C.z[c]! * this.scale - this.fit.y;
      const out = Math.max(Math.abs(dx), Math.abs(dy)) / half;
      if (out > 1) {
        const [ax, ay, angle] = [this.fit.x + dx / out, this.fit.y + dy / out, Math.atan2(dy, dx)];
        ctx.beginPath();
        for (const [r, a] of [[16, 0], [9, 2.4], [9, -2.4]] as const) ctx.lineTo(ax + Math.cos(angle + a) * r * ratio, ay + Math.sin(angle + a) * r * ratio);
        Object.assign(ctx, { fillStyle: CALL_COLOR[kind], strokeStyle: COLOR.ink, lineWidth: 2 * ratio });
        ctx.fill();
        ctx.stroke();
      } else if (C.bright[c] === 0) {
        const w2 = (pips(w, c).length * 8 + 30) * ratio; // its word card is the bright one's bubble
        let y = this.oy + (C.z[c]! - ROOF_M) * this.scale - 24 * ratio;
        const x = this.ox + C.x[c]! * this.scale - w2 / 2;
        for (let k = 0; k < dim.length; k += 1) {
          const b = dim[k]!;
          if (x < b.x + b.w && b.x < x + w2 && y < b.y + b.h && b.y < y + 24 * ratio) [y, k] = [b.y - 27 * ratio, -1];
        }
        dim.push({ id: C.id(c), c, x, y, w: w2, h: 24 * ratio });
      }
    }
    this.bubbles.length = 0;
    for (const b of dim) {
      const kind = C.kind[b.c]!;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 7 * ratio);
      Object.assign(ctx, { fillStyle: COLOR.paper, strokeStyle: CALL_COLOR[kind], lineWidth: 2 * ratio });
      ctx.fill();
      ctx.stroke();
      ctx.font = Math.round(14 * ratio) + "px " + FONT;
      ctx.fillText(CALL_ICON[kind]!, b.x + 6 * ratio, b.y + b.h / 2 + ratio);
      Object.assign(ctx, { font: "700 " + Math.round(9 * ratio) + "px " + FONT, fillStyle: COLOR.ink });
      ctx.fillText(pips(w, b.c), b.x + 26 * ratio, b.y + b.h / 2);
      ctx.globalAlpha = 1;
      if (b.id === hand.call) Object.assign(ctx, { strokeStyle: COLOR.jade, lineWidth: 3 * ratio }).stroke();
      this.bubbles.push({ id: b.id, x: b.x / ratio, y: b.y / ratio, w: b.w / ratio, h: b.h / ratio });
    }
    ctx.restore();
  }

  /** The build ghost (TK 12.5): the kind's disc and reach; where it may not stand, a red ring and the reason on a chip under it. */
  private ghost(w: World, hand: Hand): void {
    const g = hand.ghost();
    const spec = w.c.buildings[hand.kind]!;
    if (g === null) return;
    if (spec.attack !== null) this.disc(g.x, g.z, spec.attack.levels[0]!.range, null, "rgba(43, 33, 24, 0.35)", 1);
    this.disc(g.x, g.z, spec.radius, spec.def.view.color + "99", g.reason === "" ? COLOR.ink : COLOR.enemyHp, 3);
    if (g.reason !== "") this.text(g.reason, g.x, g.z + spec.radius + this.px(18), 14, COLOR.ink, 800, COLOR.ink);
  }

  /** A shape drawn in metres about (x, z), filled and edged in ink. */
  private shape(path: Path2D, x: number, z: number, fill: string): void {
    const { ctx } = this;
    ctx.translate(x, z);
    Object.assign(ctx, { fillStyle: fill, strokeStyle: COLOR.ink, lineWidth: this.px(1.5) });
    ctx.fill(path);
    ctx.stroke(path);
    ctx.translate(-x, -z);
  }

  private soldiers(w: World): void {
    const U = w.units;
    for (let s = 0; s < U.top; s += 1) {
      if (U.used[s] === 0 || U.hp[s]! <= 0) continue;
      this.disc(U.x[s]!, U.z[s]!, 0.55, COLOR.soldier, U.contact[s] === 1 ? COLOR.paper : COLOR.ink, U.contact[s] === 1 ? 2 : 1.2);
      const max = w.c.buildings[w.buildings.def[U.barracks[s]!]!]!.barracks!.levels[w.buildings.level[U.barracks[s]!]! - 1]!.hp;
      if (U.hp[s]! < max) this.bar(U.x[s]!, U.z[s]! - 1.1, 1.2, U.hp[s]! / max, COLOR.soldier);
    }
  }

  private enemies(w: World): void {
    const E = w.enemies;
    // At night the ink folk get a pale rim, so dark bodies stay clear on the darkened road (one path for all).
    if (this.dark > 0.2) {
      const { ctx } = this;
      ctx.beginPath();
      for (let e = 0; e < E.top; e += 1) {
        if (E.used[e] === 0 || w.c.enemies[E.def[e]!]!.boss) continue;
        const r = w.c.enemies[E.def[e]!]!.radius + this.px(2.5);
        ctx.moveTo(E.x[e]! + r, E.z[e]!);
        ctx.arc(E.x[e]!, E.z[e]!, r, 0, Math.PI * 2);
      }
      ctx.fillStyle = "rgba(255, 236, 190, " + (0.6 * this.dark).toFixed(2) + ")";
      ctx.fill();
    }
    for (let e = 0; e < E.top; e += 1) {
      if (E.used[e] === 0) continue;
      const def = w.c.enemies[E.def[e]!]!;
      const x = E.x[e]!;
      const z = E.z[e]!;
      if (def.boss || def.id === w.c.content.boss?.summon.enemy) continue; // boss-2d.ts draws Mộc Tinh and its sprouts
      if (def.altitude > 0) {
        // Flyers: a ground shadow, the body lifted, a soft glow ring.
        this.disc(x + 0.5, z + 0.9, def.radius * 0.8, "rgba(43, 33, 24, 0.25)", null);
        this.disc(x, z, def.radius + 0.45, "rgba(186, 160, 255, 0.35)", null);
      }
      if (E.elite[e] === 1) this.disc(x, z, def.radius + 0.35, null, COLOR.buildingHp, 2.5); // an elite (the pace director, BALANCE.md §4.2)
      this.disc(x, z, def.radius, def.def.view.color, COLOR.ink, def.armor > 0 ? 3 : 1.2);
      if (E.hp[e]! < def.hp) this.bar(x, z - def.radius - 0.7, Math.max(1.4, def.radius * 2), E.hp[e]! / def.hp, COLOR.enemyHp);
    }
  }

  private polyline(points: ArrayLike<number>, color: string, dash: number, widthPx = 3): void {
    const { ctx } = this;
    Object.assign(ctx, { strokeStyle: color, lineWidth: this.px(widthPx) });
    ctx.setLineDash(dash > 0 ? [this.px(dash), this.px(dash * 0.7)] : []);
    ctx.beginPath();
    for (let k = 0; k < points.length; k += 2) ctx.lineTo(points[k]!, points[k + 1]!);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** A walker's path ahead, dashed; Thư Đồng as lettered discs, Draconis a winged triangle over its shadow. */
  private agents(w: World, hand: Hand): void {
    const A = w.agents;
    const B = w.buildings;
    for (let a = 0; a < A.top; a += 1) {
      if (a >= slotsOpen(w) && A.goal[a]! < 0 && A.mode[a] === MODE.stand) continue; // a closed slot's helper waits inside the Bastion
      const view = a === 0 ? w.c.content.hero.view : w.c.content.helpers[a - 1]!.view;
      const left = (A.until[a]! - w.tick) / ((A.mode[a] === MODE.land ? w.c.content.hero.landS : w.c.content.hero.takeoffS) * TICK_HZ);
      const up = A.mode[a] === MODE.fly ? 1 : A.mode[a] === MODE.takeoff ? 1 - left : A.mode[a] === MODE.land ? left : 0; // height 0–1: the body lifts off its shadow
      let x = A.x[a]!;
      let z = A.z[a]!;
      // Perched on an eave, or low over one, Draconis is drawn 1 m out from it: the letter and the level marks stay readable.
      for (let b = 0; a === 0 && b < B.top; b += 1) {
        if (B.used[b] === 0) continue;
        const dx = A.x[a]! - B.x[b]!;
        const dz = A.z[a]! - B.z[b]!;
        const d = Math.sqrt(dx * dx + dz * dz);
        const out = (w.c.buildings[B.def[b]!]!.radius + 1 - d) * (1 - up);
        if (d === 0 || out <= 0) continue;
        x += (dx / d) * out;
        z += (dz / d) * out;
      }
      if (a === hand.agent) this.disc(x, z, a === 0 ? 1.6 : 1.3, null, COLOR.jade, 3);
      if (a === hand.agent) this.disc(A.x[a]!, A.z[a]!, a === 0 ? AGENT.heroRingM : AGENT.helperRingM, "rgba(11, 138, 120, 0.06)", COLOR.jade, 1); // the help ring (§6)
      if (A.mode[a] === MODE.walk) this.polyline([x, z, ...A.path.subarray((a * PATH_MAX + A.next[a]!) * 2, (a * PATH_MAX + A.pathN[a]!) * 2)], view.color, 7);
      if (a > 0) {
        this.disc(x, z, 0.85, view.color, COLOR.ink, 1.5);
        this.text(view.short, x, z, 10, COLOR.ink);
        continue;
      }
      if (up > 0) this.disc(x + 0.9 * up, z + 1.4 * up, 0.9, "rgba(43, 33, 24, 0.25)", null);
      this.shape(DRAGON, x, z - 0.8 * up, view.color);
    }
  }

  private shots(w: World): void {
    const P = w.projectiles;
    for (let p = 0; p < P.top; p += 1) {
      if (P.used[p] === 0) continue;
      const x = P.x[p]!;
      const z = P.z[p]!;
      const kind = P.kind[p]!;
      if (kind === PROJECTILE.wordShot) {
        this.wordShot(w, x, z, P.tx[p]! - x, P.tz[p]! - z, P.word[p]!);
        continue;
      }
      if (kind === PROJECTILE.shell) {
        this.disc(x + 0.35, z + 0.6, 0.3, "rgba(43, 33, 24, 0.3)", null);
        this.disc(x, z, 0.38, COLOR.ink, null);
        continue;
      }
      const dx = P.tx[p]! - x;
      const dz = P.tz[p]! - z;
      const back = (kind === PROJECTILE.bolt ? 1.4 : 1.1) / (Math.sqrt(dx * dx + dz * dz) || 1);
      this.polyline([x - dx * back, z - dz * back, x, z], kind === PROJECTILE.bolt ? COLOR.paper : COLOR.ink, 0, kind === PROJECTILE.bolt ? 3 : 2);
    }
  }

  /** A jade head with the word's letters trailing behind it. */
  private wordShot(w: World, x: number, z: number, dx: number, dz: number, word: number): void {
    const d = Math.sqrt(dx * dx + dz * dz) || 1;
    const text = word >= 0 ? wordText(w.typing.deck, word) : "";
    for (let k = 0; k < text.length; k += 1) this.text(text[text.length - 1 - k]!, x - (dx / d) * 0.9 * (k + 1), z - (dz / d) * 0.9 * (k + 1), 11, "rgba(11, 138, 120, " + (0.9 - k * 0.1).toFixed(2) + ")");
    this.disc(x, z, 0.45, "#7ff5e0", COLOR.jade, 2);
  }

  private readMarks(w: World): void {
    const ring = w.events.ring;
    if (ring.written - this.readCursor > ring.size) this.readCursor = ring.written - ring.size;
    for (; this.readCursor < ring.written; this.readCursor += 1) {
      const slot = this.readCursor % ring.size;
      const kind = ring.kind[slot]!;
      if (kind === FX.death || kind === FX.burst || kind === FX.leak || kind === FX.coin || kind === FX.soldierDown || kind === FX.fizzle) {
        this.marks.push({ kind, x: ring.x[slot]!, z: ring.z[slot]!, value: ring.value[slot]!, tick: ring.tick[slot]! });
      }
    }
    while (this.marks.length > 0 && (w.tick - this.marks[0]!.tick > MARK_TICKS || this.marks.length > 200)) this.marks.shift();
  }

  private drawMarks(w: World): void {
    for (const mark of this.marks) {
      const age = Math.max(0, w.tick - mark.tick) / MARK_TICKS;
      const alpha = (1 - age).toFixed(2);
      if (mark.kind === FX.burst) this.disc(mark.x, mark.z, (mark.value / 100) * (0.4 + 0.6 * age), null, "rgba(255, 176, 32, " + alpha + ")", 3);
      else if (mark.kind === FX.death) this.disc(mark.x, mark.z, 0.6 + age * 1.4, "rgba(91, 58, 140, " + (0.5 * (1 - age)).toFixed(2) + ")", null);
      else if (mark.kind === FX.soldierDown) this.disc(mark.x, mark.z, 0.5 + age, null, "rgba(59, 125, 221, " + alpha + ")", 2);
      else if (mark.kind === FX.leak) this.disc(mark.x, mark.z, 1 + age * 4, null, "rgba(255, 74, 74, " + alpha + ")", 3);
      else if (mark.kind === FX.fizzle) this.disc(mark.x, mark.z - 2 - age * 3, 0.4 + age * 1.6, null, "rgba(127, 245, 224, " + alpha + ")", 2);
      else this.text("+" + mark.value, mark.x, mark.z - 1 - age * 2.5, 12, "rgba(201, 138, 46, " + alpha + ")");
    }
  }
}
