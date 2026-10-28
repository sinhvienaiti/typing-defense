/**
 * Mộc Tinh on the 2D map (docs/td/BUILD_1B.md §13.1, R1): a placeholder in ink like everything on the map (a lumpy
 * canopy, amber eyes, root legs), never a model. It reads the world and the combat ring, never changes them. Under
 * the buildings: the warned branch's root vein (day 5 on), the lull's crack crawling to where it rises, Rễ Trồi's
 * striped ring sweeping round under each building it aims at, root spikes and dust. Over the enemies: the body with
 * its anticipation and follow-through (a bob and squash as it steps, the canopy lagging; leaning back before Quật
 * cành and overshooting after; sinking 5 % while it roots; tilting with stars in the stagger), the red arcs of Quật
 * cành and of the blow on the Bastion, Mầm Gỗ (a leafy dot that wobbles, wilting when it dies), the numbers its hits
 * leave; stunned buildings' marks over all of it (1B R1 review). At the Bastion the body fades so the Bastion and the
 * blow's arc under it read. R2's polish: the vein swells with each drum of the lull, leaves fall as it walks, wood chips
 * fly off a rooted building, soil at the sprouts, bark at the stagger, stone at the Bastion's blow, a big hit shakes it.
 * R3: Rễ hút sinh khí's root crawling to the Bastion, its ring, the leaves drawn off. Particles come from the fixed pool
 * of fx-2d.ts; nothing is allocated a frame. With reduced motion nothing shakes; every warning stays.
 */
import { MODES, TICK_HZ } from "../content/rules";
import { FX, type RareEvent } from "../sim/events";
import { SOURCE } from "../sim/stats";
import { BOSS } from "../sim/stores/boss";
import { bossSlot } from "../sim/systems/boss";
import type { World } from "../sim/world";
import { Particles } from "./fx-2d";

/** What DebugView lends: its context in metres, pixels in metres, a label in screen pixels at a world point. */
export type Pen = { ctx: CanvasRenderingContext2D; px(pixels: number): number; text(label: string, x: number, z: number, sizePx: number, color: string, weight?: number, edge?: string): void };

const C = { root: "#6b4a2a", warn: "#c23b22", amber: "#f2a33a", canopy: ["#2f5a26", "#3f6b2e", "#5f8f3e"], ink: "#2b2118", jade: "#0b8a78", sprout: "#5f9a3a", leaf: "#8cc152" } as const;
/** A hit's number or a wilting sprout, reused from a ring (at −1e9: none). */
type Floater = { x: number; z: number; text: string; color: string; size: number; at: number };
const floaters = (n: number): Floater[] => Array.from({ length: n }, () => ({ x: 0, z: 0, text: "", color: "", size: 0, at: -1e9 }));
const P = { x: 0, z: 0 };

const ease = (t: number): number => 1 - (1 - t) * (1 - t);
/** Ease out past the end by 6 % and back (an ease-out-back with c = 1.3). */
const overshoot = (t: number): number => 1 + 2.3 * (t - 1) ** 3 + 1.3 * (t - 1) ** 2;
const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));
/** 0→1 over [from, to] ticks. */
const span = (tick: number, from: number, to: number): number => clamp01((tick - from) / Math.max(1, to - from));

export class BossView {
  /** The map's one particle pool (FxView in fx-pipe.ts emits into it too); drawn under the buildings. */
  readonly fx = new Particles();
  private leafAt2 = 0; // the last leaf it shed (ms)
  private bigHitAt = -1e9;
  private cursor = 0;
  private readonly numbers = floaters(24);
  private readonly wilts = floaters(16);
  private readonly rings = [0, 0];
  /** Real-time stamps (ms) of the last hit flash, slam blow, stagger and retreat; buildings shaking until, by id. */
  private flashAt = -1e9;
  private slamAt = -1e9;
  private staggerAt = -1e9;
  private readonly shake = new Map<number, number>();
  private burnAt = -1e9;
  private drainAt = -1e9; // R3: the last drain (ms)
  private readonly still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** The next floater of the numbers' ring (0) or the wilts' (1), set. */
  private float(k: 0 | 1, x: number, z: number, text: string, color: string, size: number, now: number): void {
    const list = k === 0 ? this.numbers : this.wilts;
    Object.assign(list[(this.rings[k] = (this.rings[k]! + 1) % list.length)]!, { x, z, text, color, size, at: now });
  }

  /** A building's shake this frame (m), 150 ms after a root strike. */
  offset(id: number, now: number): number {
    const until = this.shake.get(id) ?? 0;
    return this.still || now > until ? 0 : Math.sin(now * 0.12) * 0.25;
  }

  /** This frame's rare events (main.ts hands them out) and the combat ring's boss hits and deaths. */
  read(events: readonly RareEvent[], w: World, now: number): void {
    this.fx.frame();
    const fx = this.fx;
    for (const event of events) {
      if (event.t === "stun") {
        this.shake.set(event.building, now + 150);
        const b = w.buildings.slotOf(event.building);
        if (b >= 0) {
          for (let k = 0; k < 6; k += 1) fx.emit(2, w.buildings.x[b]! + Math.cos(k * 1.05) * 2.4, w.buildings.z[b]! + Math.sin(k * 1.05) * 2.4, 0, 0, 520, now);
          fx.burst(0, w.buildings.x[b]!, w.buildings.z[b]!, 6, 2.2, 500, now);
          fx.burst(1, w.buildings.x[b]!, w.buildings.z[b]! - 1, 5, 3.5, 420, now); // R2: wood chips
        }
      } else if (event.t === "bossStrike" && event.hit && event.move === "slam") this.slamAt = now;
      else if (event.t === "bossEmerge") {
        // R2: stones fly, rootlets whip out past the bark (R2 review: big and inked enough to read at 1280 × 720).
        const p = w.lanes[event.route]!.point(w.c.content.stage!.boss.emergeM, 0, P);
        fx.burst(0, p.x, p.z, 8, 5, 800, now);
        for (let k = 0; k < 10; k += 1) fx.emit(6, p.x + Math.cos(k * 0.63) * 2.4, p.z + Math.sin(k * 0.63) * 2.4, Math.cos(k * 0.63) * (4 + (k % 3)), Math.sin(k * 0.63) * (4 + (k % 3)), 1300, now, 2.4); // from the bark's edge
        for (let k = 0; k < 8; k += 1) fx.emit(7, p.x + Math.cos(k * 0.785) * 2.2, p.z + Math.sin(k * 0.785) * 2.2, Math.cos(k * 0.785), Math.sin(k * 0.785), 1200, now, 3.6);
      } else if (event.t === "bossStrike" && event.hit && event.move === "summon" && bossSlot(w) >= 0) fx.burst(0, w.enemies.x[bossSlot(w)]!, w.enemies.z[bossSlot(w)]!, 10, 3, 600, now); // R2: soil
      else if (event.t === "bossStrike" && event.hit && event.move === "keep") fx.burst(0, w.map.keep[0], w.map.keep[1] - 2, 10, 4.5, 650, now); // R2: stone chips
      else if (event.t === "bossStrike" && event.hit && event.move === "drain" && bossSlot(w) >= 0) {
        // R3, Rễ hút sinh khí: the life drawn off the Bastion, embers along the root to its canopy after the pulse (under()).
        const [x, z, e] = [w.map.keep[0], w.map.keep[1], bossSlot(w)];
        this.drainAt = now;
        for (let k = 0; k < 14; k += 1) fx.emit(5, x, z - 1, (w.enemies.x[e]! - x) / (1 + k * 0.06), (w.enemies.z[e]! - z - 2) / (1 + k * 0.06), 1000, now);
      }
      else if (event.t === "bossPhase") {
        this.staggerAt = now;
        if (bossSlot(w) >= 0) fx.burst(1, w.enemies.x[bossSlot(w)]!, w.enemies.z[bossSlot(w)]!, 14, 6, 700, now); // R2: bark bursts off
      } else if (event.t === "bossRetreat") {
        const e = bossSlot(w);
        if (e >= 0) {
          fx.burst(0, w.enemies.x[e]!, w.enemies.z[e]!, 16, 4, 1400, now);
          fx.burst(3, w.enemies.x[e]!, w.enemies.z[e]! - 2, 10, 2.5, 1800, now);
          for (let k = 0; k < 12; k += 1) fx.emit(4, w.enemies.x[e]!, w.enemies.z[e]!, -4 - (k % 4), -6 - (k % 3), 900 + k * 60, now);
        }
      }
    }
    const ring = w.events.ring;
    const sprout = w.c.enemies.findIndex((def) => def.id === w.c.content.boss?.summon.enemy);
    for (let i = Math.max(this.cursor, ring.written - ring.size); i < ring.written; i += 1) {
      const slot = i % ring.size;
      if (ring.kind[slot] === FX.death && ring.value[slot] === sprout) this.float(1, ring.x[slot]!, ring.z[slot]!, "", "", 0, now);
      if (ring.kind[slot] !== FX.bossHit) continue;
      const value = ring.value[slot]!;
      const [dmg, type, source] = [value >> 5, (value >> 3) & 3, value & 7];
      if (type === 2 && source === SOURCE.wordShot) {
        this.burnAt = now; // burning: a flame on the canopy, no number a tick
        continue;
      }
      this.flashAt = now;
      if (dmg >= 40) this.bigHitAt = now; // R2: a big hit shakes it 1–2 px
      const [x, z] = [ring.x[slot]!, ring.z[slot]!];
      if (dmg >= 12) fx.burst(1, x, z - 1, 4 + (dmg % 3), 4, 450, now);
      if (source === SOURCE.wordShot) this.float(0, x, z - 3, String(dmg), C.jade, 22, now);
      else if (source === SOURCE.hero) this.float(0, x + 1.5, z - 2, String(dmg), "#7a7468", 12, now);
    }
    this.cursor = ring.written;
  }

  /** Under the buildings: the root vein of the warned branch, the lull's crack, Rễ Trồi's rings, particles. */
  under(pen: Pen, w: World, now: number): void {
    const { ctx } = pen;
    const S = w.boss;
    const stage = w.c.content.stage;
    if (S.stage === BOSS.idle || stage === undefined) return this.fx.draw(pen, now, C.root, C.ink);
    const lane = w.lanes[S.route]!;
    const [from, to] = [stage.boss.emergeM, S.mergeM];
    const p = P;
    // The vein: brown, dashed, flowing slowly toward the Bastion; in the lull it swells with each drum (R2).
    const beat = S.stage === BOSS.lull ? (w.tick - S.lullEnd + stage.boss.lullS * TICK_HZ) % (3 * TICK_HZ) : 99;
    Object.assign(ctx, { strokeStyle: "rgba(107, 74, 42, " + (beat < 20 ? 0.6 : 0.35) + ")", lineWidth: pen.px(beat < 20 ? 8 : 5), lineCap: "round" });
    ctx.setLineDash([pen.px(10), pen.px(7)]);
    ctx.lineDashOffset = -now * 0.012;
    ctx.beginPath();
    for (let d = from; d <= to; d += 2) ctx.lineTo(lane.point(d, 0, p).x, p.z);
    ctx.stroke();
    ctx.setLineDash([]);
    // The crack crawls from the rift to where it rises over the lull; then it stays, open.
    if (S.stage >= BOSS.lull && S.stage < BOSS.retreat) {
      const head = S.stage === BOSS.lull ? from * span(w.tick, S.lullEnd - stage.boss.lullS * TICK_HZ, S.lullEnd) : from;
      Object.assign(ctx, { strokeStyle: C.ink, lineWidth: pen.px(2.5) });
      ctx.beginPath();
      for (let d = 0; d <= head; d += 1.2) ctx.lineTo(lane.point(d, Math.sin(d * 2.7) * 0.5, p).x, p.z);
      ctx.stroke();
      if (S.stage === BOSS.lull && Math.floor(now / 90) % 2 === 0) this.fx.emit(0, lane.point(head, 0, p).x, p.z, (Math.sin(now) - 0.5) * 1.5, -1, 450, now);
      // The ground bulges in the last 0.4 s before it breaks.
      const rise = S.stage === BOSS.emerge ? span(w.tick, S.emergeAt - 0.4 * TICK_HZ, S.emergeAt) : 0;
      if (rise > 0) this.circle(pen, lane.point(from, 0, p).x, p.z, 1 + 2 * rise, "rgba(107, 74, 42, " + (0.3 + 0.5 * rise).toFixed(2) + ")", 4);
    }
    // Rễ Trồi's warning: under each building aimed at, a striped red ring and a sweep going round the warning's time.
    const e = bossSlot(w);
    if (S.rootsEnd >= 0 && e >= 0) {
      const warn = Math.round(w.c.content.boss!.roots.warnS * MODES[w.mode].warnK * TICK_HZ);
      const t = span(w.tick, S.rootsEnd - warn, S.rootsEnd);
      for (let k = 0; k < S.targetN; k += 1) {
        const b = w.buildings.slotOf(S.targets[k]!);
        if (b < 0) continue;
        const [x, z, r] = [w.buildings.x[b]!, w.buildings.z[b]!, w.c.buildings[w.buildings.def[b]!]!.radius + 1.4 + (t > 0.8 ? (t - 0.8) * 1.5 : 0)];
        ctx.fillStyle = "rgba(194, 59, 34, " + (0.18 + 0.22 * t).toFixed(2) + ")";
        ctx.beginPath();
        ctx.arc(x, z, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.setLineDash([pen.px(7), pen.px(5)]);
        this.circle(pen, x, z, r, "rgba(194, 59, 34, 0.9)", 4);
        ctx.setLineDash([]);
        Object.assign(ctx, { strokeStyle: C.warn, lineWidth: pen.px(8) });
        ctx.beginPath();
        ctx.arc(x, z, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t);
        ctx.stroke();
        // A crack runs from its feet to the building.
        Object.assign(ctx, { strokeStyle: "rgba(43, 33, 24, 0.7)", lineWidth: pen.px(2) });
        ctx.beginPath();
        for (let s = 0; s <= 1; s += 0.1) ctx.lineTo(w.enemies.x[e]! + (x - w.enemies.x[e]!) * s * t + Math.sin(s * 19) * 0.3, w.enemies.z[e]! + (z - w.enemies.z[e]!) * s * t + Math.cos(s * 17) * 0.3);
        ctx.stroke();
      }
    }
    // R3, Rễ hút sinh khí: over its warning a root crawls from its feet to the Bastion, ink-edged so it reads on the road;
    // at the drain an amber pulse (the life) runs up it to the canopy in 0.7 s.
    const pulse = (now - this.drainAt) / 700;
    if (e >= 0 && (S.drainEnd >= 0 || pulse < 1)) {
      const t = S.drainEnd < 0 ? 1 : ease(span(w.tick, S.drainEnd - Math.round(w.c.content.boss!.drain.warnS * MODES[w.mode].warnK * TICK_HZ), S.drainEnd));
      const [x, z, kx, kz] = [w.enemies.x[e]!, w.enemies.z[e]!, w.map.keep[0], w.map.keep[1]];
      ctx.beginPath();
      for (let s = 0; s <= 1; s += 0.04) ctx.lineTo(x + (kx - x) * s * t + Math.sin(s * 23) * 0.7, z + (kz - z) * s * t + Math.cos(s * 19) * 0.7);
      Object.assign(ctx, { strokeStyle: C.ink, lineWidth: pen.px(11), lineCap: "round" });
      ctx.stroke();
      Object.assign(ctx, { strokeStyle: C.root, lineWidth: pen.px(6) });
      ctx.stroke();
      if (pulse < 1) this.dot(pen, kx + (x - kx) * ease(pulse), kz + (z - kz) * ease(pulse), 1.1 - 0.5 * pulse, C.amber);
    }
    this.fx.draw(pen, now, C.root, C.ink);
  }

  private circle(pen: Pen, x: number, z: number, r: number, color: string, widthPx: number): void {
    Object.assign(pen.ctx, { strokeStyle: color, lineWidth: pen.px(widthPx) });
    pen.ctx.beginPath();
    pen.ctx.arc(x, z, r, 0, Math.PI * 2);
    pen.ctx.stroke();
  }

  /** Mộc Tinh's body and its warnings, Mầm Gỗ, the numbers. Over the other enemies. */
  over(pen: Pen, w: World, now: number): void {
    const { ctx } = pen;
    const E = w.enemies;
    const sprout = w.c.enemies.findIndex((def) => def.id === w.c.content.boss?.summon.enemy);
    for (let s = 0; s < E.top; s += 1) {
      if (E.used[s] === 0 || E.def[s] !== sprout) continue;
      // Mầm Gỗ: a leafy dot that wobbles as it walks.
      const wob = Math.sin(now * 0.02 + s) * 0.15;
      this.dot(pen, E.x[s]! + wob, E.z[s]!, 0.5, C.sprout);
      for (const side of [-1, 1]) this.leafAt(pen, E.x[s]! + wob + side * 0.35, E.z[s]! - 0.45, side);
    }
    for (const m of this.wilts) if (now - m.at < 300) this.dot(pen, m.x, m.z + (now - m.at) / 300, 0.5 * (1 - (now - m.at) / 300), "#8a6a3a");
    const S = w.boss;
    const e = bossSlot(w);
    const spec = w.c.content.boss;
    if (e >= 0 && spec !== undefined) this.body(pen, w, e, now);
    // R2: Quật cành's blow flashes the soldiers it threw white for 60 ms.
    if (e >= 0 && spec !== undefined && now - this.slamAt < 60) {
      const reach = w.c.enemies[E.def[e]!]!.radius + spec.slam.reachM + spec.slam.knockM + 0.5;
      for (const u of w.units.live()) if ((w.units.x[u]! - E.x[e]!) ** 2 + (w.units.z[u]! - E.z[e]!) ** 2 <= reach * reach) this.dot(pen, w.units.x[u]!, w.units.z[u]!, 0.75, "#ffffff");
    }
    if (spec !== undefined && S.stage >= BOSS.lull) this.warnings(pen, w, e, now);
    for (const n of this.numbers) {
      const age = (now - n.at) / 900;
      if (age < 1) pen.text(n.text, n.x, n.z - age * 2.5, n.size, n.color, 900);
    }
  }

  private dot(pen: Pen, x: number, z: number, r: number, fill: string): void {
    Object.assign(pen.ctx, { fillStyle: fill, strokeStyle: C.ink, lineWidth: pen.px(1.2) });
    pen.ctx.beginPath();
    pen.ctx.arc(x, z, Math.max(0.01, r), 0, Math.PI * 2);
    pen.ctx.fill();
    pen.ctx.stroke();
  }

  private leafAt(pen: Pen, x: number, z: number, side: number): void {
    pen.ctx.fillStyle = C.leaf;
    pen.ctx.beginPath();
    pen.ctx.ellipse(x, z, 0.32, 0.16, side * 0.6, 0, Math.PI * 2);
    pen.ctx.fill();
  }

  /** Quật cành's arc, the blow on the Bastion's arc, the sprouts nudging up: red where it will land, darkening to the hit. */
  private warnings(pen: Pen, w: World, e: number, now: number): void {
    const { ctx } = pen;
    const S = w.boss;
    const spec = w.c.content.boss!;
    const k = MODES[w.mode].warnK;
    if (e >= 0 && S.slamEnd >= 0) {
      const t = span(w.tick, S.slamEnd - Math.round(spec.slam.warnS * k * TICK_HZ), S.slamEnd);
      const a = Math.atan2(S.slamZ, S.slamX);
      const r = w.c.enemies[w.enemies.def[e]!]!.radius + spec.slam.reachM;
      // Over the body: the sector it will sweep, filling up red as the blow nears, edged in vermilion.
      ctx.fillStyle = "rgba(194, 59, 34, " + (0.12 + 0.3 * t).toFixed(2) + ")";
      ctx.beginPath();
      ctx.moveTo(w.enemies.x[e]!, w.enemies.z[e]!);
      ctx.arc(w.enemies.x[e]!, w.enemies.z[e]!, r * (0.3 + 0.7 * ease(t)), a - Math.PI / 3, a + Math.PI / 3);
      ctx.closePath();
      ctx.fill();
      Object.assign(ctx, { strokeStyle: "rgba(194, 59, 34, 0.9)", lineWidth: pen.px(5) });
      ctx.beginPath();
      ctx.arc(w.enemies.x[e]!, w.enemies.z[e]!, r, a - Math.PI / 3, a + Math.PI / 3);
      ctx.stroke();
    }
    const sweep = (now - this.slamAt) / 200;
    if (e >= 0 && sweep < 1) {
      Object.assign(ctx, { strokeStyle: "rgba(255, 244, 214, " + (1 - sweep).toFixed(2) + ")", lineWidth: pen.px(7) });
      const a = Math.atan2(S.slamZ, S.slamX);
      ctx.beginPath();
      ctx.arc(w.enemies.x[e]!, w.enemies.z[e]!, w.c.enemies[w.enemies.def[e]!]!.radius + 2, a - Math.PI / 3, a - Math.PI / 3 + (Math.PI * 2 * ease(sweep)) / 3);
      ctx.stroke();
    }
    const blow = S.keepEnd >= 0 ? "keep" : S.drainEnd >= 0 ? "drain" : null;
    if (blow !== null) {
      // Under the Bastion, where no call's bubble sits (review R1): a ring closing round it and the lives it will cost (R3: the drain's too).
      const t = span(w.tick, S[`${blow}End`] - Math.round(spec[blow].warnS * k * TICK_HZ), S[`${blow}End`]);
      const [x, z, r] = [w.map.keep[0], w.map.keep[1], w.c.buildings[0]!.radius + 1];
      Object.assign(ctx, { strokeStyle: "rgba(194, 59, 34, " + (0.4 + 0.6 * t).toFixed(2) + ")", lineWidth: pen.px(8) });
      ctx.beginPath();
      ctx.arc(x, z, r, Math.PI * (0.5 - t), Math.PI * (0.5 + t));
      ctx.stroke();
      pen.text("−" + spec[blow].lives + " mạng", x, z + r + 2, 16, C.warn, 900, C.warn);
    }
    if (e >= 0 && S.summonEnd >= 0) {
      const t = span(w.tick, S.summonEnd - Math.round(spec.summon.warnS * TICK_HZ), S.summonEnd);
      for (let n = 0; n < spec.summon.count; n += 1) {
        // Just outside the canopy (drawn 1.3× its body): four green nubs pushing up.
        const [x, z] = [w.enemies.x[e]! + Math.cos(n * 1.57 + 0.8) * 3.9, w.enemies.z[e]! + Math.sin(n * 1.57 + 0.8) * 3.9];
        this.circle(pen, x, z, 1.1, "rgba(255, 244, 214, " + (0.4 + 0.5 * t).toFixed(2) + ")", 3); // a pale ring on the grass (test pass 27/10)
        this.dot(pen, x, z, 0.3 + 0.5 * ease(t), C.sprout);
        this.leafAt(pen, x + 0.2, z - 0.3 * t, 1);
      }
    }
  }

  /** The body: a lumpy canopy in three inks over root legs, amber eyes, its moves' anticipation and follow-through. */
  private body(pen: Pen, w: World, e: number, now: number): void {
    const { ctx } = pen;
    const S = w.boss;
    const E = w.enemies;
    const [x0, z0] = [E.x[e]!, E.z[e]!];
    // Drawn 1.3× its body radius (≈ 6.5 m across): it has to read at a glance among the towers (§13.1).
    const r = w.c.enemies[E.def[e]!]!.radius * 1.3;
    const walking = E.stunUntil[e]! <= w.tick && S.stage === BOSS.fight;
    const step = walking ? now * 0.006 : 0;
    // The rise: 0.8 s up, easing out past the top by 6 % and back. The retreat: down and away in 2 s.
    const up = S.stage === BOSS.retreat ? 1 - span(w.tick, S.sinkEnd - w.c.content.boss!.retreatS * TICK_HZ, S.sinkEnd) : overshoot(span(w.tick, S.emergeAt, S.emergeAt + 0.8 * TICK_HZ));
    let [dx, dz, tilt, squash] = [0, 0, 0, 1 - 0.04 * Math.abs(Math.sin(step))];
    // Quật cành: it leans back before, overshoots after (150 ms).
    if (S.slamEnd >= 0) {
      const t = span(w.tick, S.slamEnd - Math.round(w.c.content.boss!.slam.warnS * MODES[w.mode].warnK * TICK_HZ), S.slamEnd);
      [dx, dz, tilt] = [-S.slamX * 0.9 * ease(t), -S.slamZ * 0.9 * ease(t), -0.12 * ease(t) * Math.sign(S.slamX || 1)];
    } else if (now - this.slamAt < 300) {
      const t = (now - this.slamAt) / 300;
      const over = t < 0.5 ? t * 2 : 2 - t * 2;
      [dx, dz, tilt] = [S.slamX * 1.1 * over, S.slamZ * 1.1 * over, 0.1 * over * Math.sign(S.slamX || 1)];
    }
    if (S.rootsEnd >= 0) squash *= 0.95;
    if (w.tick < S.staggerUntil) tilt = 0.22 * Math.sin(Math.min(1, (now - this.staggerAt) / 250) * Math.PI * 0.5);
    // R2: leaves fall as it walks; a big hit shakes it 1–2 px.
    if (walking && now - this.leafAt2 > 380) {
      this.leafAt2 = now;
      this.fx.emit(3, x0 + Math.sin(now) * r, z0 - r * 0.4, Math.sin(now * 1.7) * 0.8, 0.5, 1500, now);
    }
    const x = x0 + dx + (!this.still && now - this.bigHitAt < 160 ? Math.sin(now * 0.9) * 0.3 : 0);
    const z = z0 + dz + (1 - up) * 1.2;
    ctx.save();
    const atKeep = E.dist[e]! >= w.lanes[E.route[e]!]!.length - w.c.content.boss!.keep.stopM - 1;
    ctx.globalAlpha = Math.max(0, Math.min(atKeep ? 0.55 : 1, up * 1.4));
    // The amber ring at its feet (R2: as it retreats the light goes out from the rim in), its root legs swaying with the step.
    this.circle(pen, x0, z0, (r + 0.6) * (S.stage === BOSS.retreat ? up : 1), "rgba(242, 163, 58, 0.45)", 3);
    Object.assign(ctx, { strokeStyle: C.root, lineWidth: pen.px(4), lineCap: "round" });
    for (let k = 0; k < 6; k += 1) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      const sway = Math.sin(step + k * 1.3) * 0.35;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.5, z + Math.sin(a) * r * 0.5);
      ctx.quadraticCurveTo(x + Math.cos(a + sway) * r * 1.05, z + Math.sin(a + sway) * r * 1.05, x + Math.cos(a + sway * 2) * r * 1.3, z + Math.sin(a + sway * 2) * r * 1.3);
      ctx.stroke();
    }
    ctx.translate(x, z);
    ctx.rotate(tilt);
    ctx.scale(up * (2 - squash), up * squash);
    // The canopy lags half a step behind the body.
    const lag = Math.sin(step - Math.PI / 2) * 0.25;
    const flash = now - this.flashAt < 60;
    C.canopy.forEach((fill, layer) => {
      ctx.fillStyle = flash ? "#fff4d6" : fill;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = pen.px(layer === 0 ? 2.5 : 1.2);
      ctx.beginPath();
      const rr = r * (1 - layer * 0.22);
      for (let k = 0; k <= 9; k += 1) {
        const a = (k / 9) * Math.PI * 2;
        const lump = 1 + 0.08 * Math.sin(k * 2.3 + layer);
        ctx.lineTo(lag * layer + Math.cos(a) * rr * lump, -layer * 0.35 + Math.sin(a) * rr * lump);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    for (const side of [-1, 1]) {
      Object.assign(ctx, { fillStyle: "#ffb020", strokeStyle: C.ink, lineWidth: pen.px(1.5) });
      ctx.beginPath();
      ctx.ellipse(side * 0.9 + lag, -0.25, 0.48, 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    // Burning: a small flame on the canopy and its label.
    if (now - this.burnAt < 250) {
      const f = 0.6 + 0.2 * Math.sin(now * 0.05);
      Object.assign(ctx, { fillStyle: "rgba(242, 99, 34, 0.85)" });
      ctx.beginPath();
      ctx.ellipse(x + 1, z - r * 0.6, 0.45 * f, 0.9 * f, 0, 0, Math.PI * 2);
      ctx.fill();
      pen.text("Cháy ×1,25", x, z + r + 1.6, 12, "#c23b22", 800, "#c23b22"); // under it: the hits' numbers rise over it (test pass 27/10)
    }
    // The stagger: stars going round over it, and the vulnerable ring counting down.
    if (w.tick < S.staggerUntil) {
      const left = (S.staggerUntil - w.tick) / TICK_HZ;
      for (let k = 0; k < 3; k += 1) pen.text("★", x + Math.cos(now * 0.006 + k * 2.1) * 2.2, z - r * 0.4 + Math.sin(now * 0.006 + k * 2.1) * 0.7, 20, "#ffb020", 900);
      Object.assign(ctx, { strokeStyle: "rgba(242, 163, 58, 0.9)", lineWidth: pen.px(4) });
      ctx.beginPath();
      ctx.arc(x0, z0, r + 1.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left / w.c.content.boss!.stagger.stunS));
      ctx.stroke(); // its countdown is on the boss bar, clear of the word cards (review R1)
    }
  }

  /** The stagger's amber sky: ≤ 0.2 over the map, fading out at its end (TK 20.6). */
  sky(ctx: CanvasRenderingContext2D, w: World, width: number, height: number): void {
    if (w.tick >= w.boss.staggerUntil) return;
    const left = (w.boss.staggerUntil - w.tick) / (w.c.content.boss!.stagger.stunS * TICK_HZ);
    ctx.fillStyle = "rgba(255, 176, 32, " + (0.18 * Math.min(1, left * 3)).toFixed(3) + ")";
    ctx.fillRect(0, 0, width, height);
  }

  /** The screen shake (px) for the lull and the rise: ≤ 2 px, none with reduced motion. */
  quake(w: World, now: number): [number, number] {
    const S = w.boss;
    const on = S.stage === BOSS.lull || (S.stage === BOSS.emerge && S.emergeAt - w.tick < 0.4 * TICK_HZ) || (S.stage === BOSS.fight && w.tick - S.emergeAt < 0.8 * TICK_HZ);
    return this.still || !on ? [0, 0] : [Math.sin(now * 0.09) * 1.5, Math.cos(now * 0.11) * 1.2];
  }

  /** Stunned buildings' marks, over the boss (review R1): a grey ring and "Tê N s" on a paper chip. */
  marks(pen: Pen, w: World): void {
    const B = w.buildings;
    for (let b = 0; b < B.top; b += 1) {
      const left = (B.stunUntil[b]! - w.tick) / TICK_HZ;
      if (B.used[b] === 0 || left <= 0) continue;
      const r = w.c.buildings[B.def[b]!]!.radius;
      this.circle(pen, B.x[b]!, B.z[b]!, r + 0.5, "rgba(120, 120, 120, 0.9)", 3);
      pen.text("Tê " + Math.ceil(left) + " s", B.x[b]!, B.z[b]! + r + 1.6, 15, "#4a4a4a", 900, "#7a7a7a");
    }
  }
}
