/**
 * Mộc Tinh on the 2D map (docs/td/BUILD_1B.md §13.1, R1): a placeholder in ink like everything on the map (a lumpy
 * canopy, amber eyes, root legs), never a model. It reads the world and the combat ring, never changes them. Under
 * the buildings: the warned branch's root vein (day 5 on), the lull's crack crawling to where it rises, Rễ Trồi's
 * striped ring sweeping round under each building it aims at, root spikes and dust. Over the enemies: the body with
 * its anticipation and follow-through (a bob and squash as it steps, the canopy lagging; leaning back before Quật
 * cành and overshooting after; sinking 5 % while it roots; tilting with stars in the stagger), the red arcs of Quật
 * cành and of the blow on the Bastion, Mầm Gỗ (a leafy dot that wobbles, wilting when it dies), the numbers its hits
 * leave. Particles come from a fixed pool. With reduced motion nothing shakes; every warning stays.
 */
import { MODES, TICK_HZ } from "../content/rules";
import { FX, type RareEvent } from "../sim/events";
import { SOURCE } from "../sim/stats";
import { BOSS } from "../sim/stores/boss";
import { bossSlot } from "../sim/systems/boss";
import type { World } from "../sim/world";

/** What DebugView lends: its context in metres, pixels in metres, a label in screen pixels at a world point. */
export type Pen = { ctx: CanvasRenderingContext2D; px(pixels: number): number; text(label: string, x: number, z: number, sizePx: number, color: string, weight?: number, edge?: string): void };

const C = { root: "#6b4a2a", warn: "#c23b22", amber: "#f2a33a", canopy: ["#2f5a26", "#3f6b2e", "#5f8f3e"], ink: "#2b2118", jade: "#0b8a78", sprout: "#5f9a3a", leaf: "#8cc152" } as const;
const POOL = 300;
const NEW_PER_FRAME = 40;
type Kind = 0 | 1 | 2 | 3 | 4; // dust, chip, spike, leaf, coin
type Floater = { x: number; z: number; text: string; color: string; size: number; at: number };

const ease = (t: number): number => 1 - (1 - t) * (1 - t);
/** Ease out past the end by 6 % and back (an ease-out-back with c = 1.3). */
const overshoot = (t: number): number => 1 + 2.3 * (t - 1) ** 3 + 1.3 * (t - 1) ** 2;
const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));
/** 0→1 over [from, to] ticks. */
const span = (tick: number, from: number, to: number): number => clamp01((tick - from) / Math.max(1, to - from));

export class BossView {
  private readonly px = new Float32Array(POOL);
  private readonly pz = new Float32Array(POOL);
  private readonly vx = new Float32Array(POOL);
  private readonly vz = new Float32Array(POOL);
  private readonly born = new Float64Array(POOL);
  private readonly life = new Float32Array(POOL);
  private readonly kind = new Uint8Array(POOL);
  private next = 0;
  private fresh = 0;
  private cursor = 0;
  private readonly numbers: Floater[] = [];
  /** Real-time stamps (ms) of the last hit flash, slam blow, stagger and retreat; buildings shaking until, by id. */
  private flashAt = -1e9;
  private slamAt = -1e9;
  private staggerAt = -1e9;
  private readonly shake = new Map<number, number>();
  private burnAt = -1e9;
  private wilts: { x: number; z: number; at: number }[] = [];
  private readonly still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Particle k of `kind` at (x, z) moving (vx, vz) m/s for `life` ms; at most 40 new a frame. */
  private emit(kind: Kind, x: number, z: number, vx: number, vz: number, life: number, now: number): void {
    if (this.fresh >= NEW_PER_FRAME) return;
    const k = this.next;
    this.next = (this.next + 1) % POOL;
    this.fresh += 1;
    [this.px[k], this.pz[k], this.vx[k], this.vz[k], this.born[k], this.life[k], this.kind[k]] = [x, z, vx, vz, now, life, kind];
  }

  private burst(kind: Kind, x: number, z: number, n: number, speed: number, life: number, now: number): void {
    for (let k = 0; k < n; k += 1) {
      const a = (k / n) * Math.PI * 2 + now * 0.37;
      this.emit(kind, x, z, Math.cos(a) * speed * (0.6 + ((k * 7) % 5) / 10), Math.sin(a) * speed * (0.6 + ((k * 3) % 5) / 10), life, now);
    }
  }

  /** A building's shake this frame (m), 150 ms after a root strike. */
  offset(id: number, now: number): number {
    const until = this.shake.get(id) ?? 0;
    return this.still || now > until ? 0 : Math.sin(now * 0.12) * 0.25;
  }

  /** This frame's rare events (main.ts hands them out) and the combat ring's boss hits and deaths. */
  read(events: readonly RareEvent[], w: World, now: number): void {
    this.fresh = 0;
    for (const event of events) {
      if (event.t === "stun") {
        this.shake.set(event.building, now + 150);
        const b = w.buildings.slotOf(event.building);
        if (b >= 0) {
          for (let k = 0; k < 6; k += 1) this.emit(2, w.buildings.x[b]! + Math.cos(k * 1.05) * 2.4, w.buildings.z[b]! + Math.sin(k * 1.05) * 2.4, 0, 0, 520, now);
          this.burst(0, w.buildings.x[b]!, w.buildings.z[b]!, 6, 2.2, 500, now);
        }
      } else if (event.t === "bossStrike" && event.hit && event.move === "slam") this.slamAt = now;
      else if (event.t === "bossPhase") this.staggerAt = now;
      else if (event.t === "bossRetreat") {
        const e = bossSlot(w);
        if (e >= 0) {
          this.burst(0, w.enemies.x[e]!, w.enemies.z[e]!, 16, 4, 1400, now);
          this.burst(3, w.enemies.x[e]!, w.enemies.z[e]! - 2, 10, 2.5, 1800, now);
          for (let k = 0; k < 12; k += 1) this.emit(4, w.enemies.x[e]!, w.enemies.z[e]!, -4 - (k % 4), -6 - (k % 3), 900 + k * 60, now);
        }
      }
    }
    const ring = w.events.ring;
    const sprout = w.c.enemies.findIndex((def) => def.id === w.c.content.boss?.summon.enemy);
    for (let i = Math.max(this.cursor, ring.written - ring.size); i < ring.written; i += 1) {
      const slot = i % ring.size;
      if (ring.kind[slot] === FX.death && ring.value[slot] === sprout) this.wilts.push({ x: ring.x[slot]!, z: ring.z[slot]!, at: now });
      if (ring.kind[slot] !== FX.bossHit) continue;
      const value = ring.value[slot]!;
      const [dmg, type, source] = [value >> 5, (value >> 3) & 3, value & 7];
      if (type === 2 && source === SOURCE.wordShot) {
        this.burnAt = now; // burning: a flame on the canopy, no number a tick
        continue;
      }
      this.flashAt = now;
      const [x, z] = [ring.x[slot]!, ring.z[slot]!];
      if (dmg >= 12) this.burst(1, x, z - 1, 4 + (dmg % 3), 4, 450, now);
      if (source === SOURCE.wordShot) this.numbers.push({ x, z: z - 3, text: String(dmg), color: C.jade, size: 22, at: now });
      else if (source === SOURCE.hero) this.numbers.push({ x: x + 1.5, z: z - 2, text: String(dmg), color: "#7a7468", size: 12, at: now });
    }
    this.cursor = ring.written;
    if (this.numbers.length > 24) this.numbers.splice(0, this.numbers.length - 24);
    this.wilts = this.wilts.filter((m) => now - m.at < 300);
  }

  /** Under the buildings: the root vein of the warned branch, the lull's crack, Rễ Trồi's rings, particles. */
  under(pen: Pen, w: World, now: number): void {
    const { ctx } = pen;
    const S = w.boss;
    const stage = w.c.content.stage;
    if (S.stage === BOSS.idle || stage === undefined) return this.particles(pen, now);
    const lane = w.lanes[S.route]!;
    const [from, to] = [stage.boss.emergeM, S.mergeM];
    const p = { x: 0, z: 0 };
    // The vein: brown, dashed, flowing slowly toward the Bastion.
    Object.assign(ctx, { strokeStyle: "rgba(107, 74, 42, 0.35)", lineWidth: pen.px(5), lineCap: "round" });
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
      if (S.stage === BOSS.lull && Math.floor(now / 90) % 2 === 0) this.emit(0, lane.point(head, 0, p).x, p.z, (Math.sin(now) - 0.5) * 1.5, -1, 450, now);
      // The ground bulges in the last 0.4 s before it breaks.
      const rise = S.stage === BOSS.emerge ? span(w.tick, S.emergeAt - 0.4 * TICK_HZ, S.emergeAt) : 0;
      if (rise > 0) this.ring(pen, lane.point(from, 0, p).x, p.z, 1 + 2 * rise, "rgba(107, 74, 42, " + (0.3 + 0.5 * rise).toFixed(2) + ")", 4);
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
        this.ring(pen, x, z, r, "rgba(194, 59, 34, 0.9)", 4);
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
    this.particles(pen, now);
  }

  private ring(pen: Pen, x: number, z: number, r: number, color: string, widthPx: number): void {
    Object.assign(pen.ctx, { strokeStyle: color, lineWidth: pen.px(widthPx) });
    pen.ctx.beginPath();
    pen.ctx.arc(x, z, r, 0, Math.PI * 2);
    pen.ctx.stroke();
  }

  private particles(pen: Pen, now: number): void {
    const { ctx } = pen;
    for (let k = 0; k < POOL; k += 1) {
      const age = (now - this.born[k]!) / this.life[k]!;
      if (!(age >= 0 && age < 1)) continue;
      const t = (now - this.born[k]!) / 1000;
      const [x, z] = [this.px[k]! + this.vx[k]! * t, this.pz[k]! + this.vz[k]! * t + (this.kind[k] === 3 ? t * t * 2 : 0)];
      ctx.globalAlpha = 1 - age;
      if (this.kind[k] === 2) {
        // A root spike: grows in 120 ms, fades by 400 ms more.
        const h = Math.min(1, (now - this.born[k]!) / 120) * 1.4;
        Object.assign(ctx, { fillStyle: C.root, strokeStyle: C.ink, lineWidth: pen.px(1) });
        ctx.beginPath();
        ctx.moveTo(x - 0.3, z);
        ctx.lineTo(x, z - h);
        ctx.lineTo(x + 0.3, z);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = ["rgba(160, 130, 90, 0.8)", "#8a5a2b", "", C.leaf, "#e0b33a"][this.kind[k]!]!;
        ctx.beginPath();
        ctx.arc(x, z, this.kind[k] === 0 ? 0.45 + age * 0.9 : this.kind[k] === 4 ? 0.35 : 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
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
    for (const m of this.wilts) this.dot(pen, m.x, m.z + (now - m.at) / 300, 0.5 * (1 - (now - m.at) / 300), "#8a6a3a");
    const S = w.boss;
    const e = bossSlot(w);
    const spec = w.c.content.boss;
    if (e >= 0 && spec !== undefined) this.body(pen, w, e, now);
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
    if (S.keepEnd >= 0) {
      const t = span(w.tick, S.keepEnd - Math.round(spec.keep.warnS * k * TICK_HZ), S.keepEnd);
      const [x, z] = w.map.keep;
      Object.assign(ctx, { strokeStyle: "rgba(194, 59, 34, " + (0.4 + 0.6 * t).toFixed(2) + ")", lineWidth: pen.px(8) });
      ctx.beginPath();
      ctx.arc(x, z, w.c.buildings[0]!.radius + 1, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();
    }
    if (e >= 0 && S.summonEnd >= 0) {
      const t = span(w.tick, S.summonEnd - Math.round(spec.summon.warnS * TICK_HZ), S.summonEnd);
      for (let n = 0; n < spec.summon.count; n += 1) {
        // Just outside the canopy (drawn 1.3× its body): four green nubs pushing up.
        const [x, z] = [w.enemies.x[e]! + Math.cos(n * 1.57 + 0.8) * 3.9, w.enemies.z[e]! + Math.sin(n * 1.57 + 0.8) * 3.9];
        this.dot(pen, x, z, 0.2 + 0.35 * ease(t), C.sprout);
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
    const x = x0 + dx;
    const z = z0 + dz + (1 - up) * 1.2;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, up * 1.4));
    // The amber ring at its feet, its root legs swaying with the step.
    this.ring(pen, x0, z0, r + 0.6, "rgba(242, 163, 58, 0.45)", 3);
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
      pen.text("Cháy ×1,25", x, z - r - 1.6, 12, "#c23b22", 800, "#c23b22");
    }
    // The stagger: stars going round over it, and the vulnerable ring counting down.
    if (w.tick < S.staggerUntil) {
      const left = (S.staggerUntil - w.tick) / TICK_HZ;
      for (let k = 0; k < 3; k += 1) pen.text("★", x + Math.cos(now * 0.006 + k * 2.1) * 2.2, z - r * 0.4 + Math.sin(now * 0.006 + k * 2.1) * 0.7, 20, "#ffb020", 900);
      Object.assign(ctx, { strokeStyle: "rgba(242, 163, 58, 0.9)", lineWidth: pen.px(4) });
      ctx.beginPath();
      ctx.arc(x0, z0, r + 1.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left / w.c.content.boss!.stagger.stunS));
      ctx.stroke();
      pen.text("Dễ Tổn Thương " + Math.ceil(left) + " s", x0, z0 - r - 3.2, 15, "#b86f00", 900, "#b86f00");
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

  /** A stunned building's mark: a grey ring and "Tê N s". */
  stunMark(pen: Pen, w: World, b: number): void {
    const left = (w.buildings.stunUntil[b]! - w.tick) / TICK_HZ;
    if (left <= 0) return;
    const r = w.c.buildings[w.buildings.def[b]!]!.radius;
    this.ring(pen, w.buildings.x[b]!, w.buildings.z[b]!, r + 0.5, "rgba(120, 120, 120, 0.9)", 3);
    pen.text("Tê " + Math.ceil(left) + " s", w.buildings.x[b]!, w.buildings.z[b]! - r - 1.2, 12, "#5a5a5a", 800);
  }
}
