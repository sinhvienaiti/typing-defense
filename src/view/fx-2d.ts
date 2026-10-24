/**
 * The 2D map's particles (docs/td/BUILD_1B.md §16, §20): one fixed pool of 300 (no allocation a frame), at most 40 new
 * a frame. Kinds: dust that swells, wood chips, root spikes that grow then fade, leaves that fall, coins, embers.
 * Positions are metres; the pen draws in the map's transform. R2 (§13.3): FxView draws Tối Thượng (Draconis' portrait
 * sliding in from the left, a shadow under each falling feather, the ember pool of its burn) and the direct calls'
 * outcomes (a broken drum bursting into letters, a heal ring spreading 6 m), from the world and its events.
 */
import { ULT } from "../content/rules";
import type { RareEvent } from "../sim/events";
import { PROJECTILE } from "../sim/stores/projectiles";
import type { World } from "../sim/world";
import type { Pen } from "./boss-2d";

const POOL = 300;
const NEW_PER_FRAME = 40;
const FILL = ["rgba(160, 130, 90, 0.8)", "#8a5a2b", "", "#8cc152", "#e0b33a", "#f26322"] as const;
export type Kind = 0 | 1 | 2 | 3 | 4 | 5; // dust, chip, spike, leaf, coin, ember

export class Particles {
  private readonly px = new Float32Array(POOL);
  private readonly pz = new Float32Array(POOL);
  private readonly vx = new Float32Array(POOL);
  private readonly vz = new Float32Array(POOL);
  private readonly born = new Float64Array(POOL);
  private readonly life = new Float32Array(POOL);
  private readonly kind = new Uint8Array(POOL);
  private next = 0;
  private fresh = 0;

  /** A new frame: its 40 new ones start again. */
  frame(): void {
    this.fresh = 0;
  }

  /** A particle of `kind` at (x, z) moving (vx, vz) m/s for `life` ms. */
  emit(kind: Kind, x: number, z: number, vx: number, vz: number, life: number, now: number): void {
    if (this.fresh >= NEW_PER_FRAME) return;
    const k = this.next;
    this.next = (this.next + 1) % POOL;
    this.fresh += 1;
    [this.px[k], this.pz[k], this.vx[k], this.vz[k], this.born[k], this.life[k], this.kind[k]] = [x, z, vx, vz, now, life, kind];
  }

  /** n of them flying out of (x, z) at about `speed`. */
  burst(kind: Kind, x: number, z: number, n: number, speed: number, life: number, now: number): void {
    for (let k = 0; k < n; k += 1) {
      const a = (k / n) * Math.PI * 2 + now * 0.37;
      this.emit(kind, x, z, Math.cos(a) * speed * (0.6 + ((k * 7) % 5) / 10), Math.sin(a) * speed * (0.6 + ((k * 3) % 5) / 10), life, now);
    }
  }

  draw(pen: Pen, now: number, root: string, ink: string): void {
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
        Object.assign(ctx, { fillStyle: root, strokeStyle: ink, lineWidth: pen.px(1) });
        ctx.beginPath();
        ctx.moveTo(x - 0.3, z);
        ctx.lineTo(x, z - h);
        ctx.lineTo(x + 0.3, z);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = FILL[this.kind[k]!]!;
        ctx.beginPath();
        ctx.arc(x, z, this.kind[k] === 0 ? 0.45 + age * 0.9 : this.kind[k] === 4 ? 0.35 : 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

/** A heal ring (0) or a drum broken into letters (1) at a world point, reused from a ring of 12. */
type Mark = { x: number; z: number; at: number; kind: number };
const SCRAPS = "ngatchu";
const ease = (t: number): number => 1 - (1 - t) * (1 - t);
/** A feather starts this far from where it lands (ult.ts: 12 m/s for ULT.fallS). */
const FALL_M = 12 * ULT.fallS;

export class FxView {
  private readonly marks: Mark[] = Array.from({ length: 12 }, () => ({ x: 0, z: 0, at: -1e9, kind: 0 }));
  private next = 0;
  private castAt = -1e9;
  private raining = false;
  private readonly embers = { x: 0, z: 0, at: -1e9 };

  constructor(private readonly fx: Particles) {}

  /** This frame's events (after BossView's, which starts the particles' frame). */
  read(events: readonly RareEvent[], w: World, now: number): void {
    for (const e of events) {
      if (e.t === "ult") this.castAt = now;
      if (e.t !== "direct") continue;
      Object.assign(this.marks[(this.next = (this.next + 1) % this.marks.length)]!, { x: e.x, z: e.z, at: now, kind: e.ok ? 1 : 0 });
      if (e.ok) this.fx.burst(1, e.x, e.z, 8, 4, 500, now);
    }
    if (this.raining && w.ult.on === 0) Object.assign(this.embers, { x: w.ult.x, z: w.ult.z, at: now });
    this.raining = w.ult.on === 1;
  }

  /** Under the enemies: the rain's ring, a shadow under each feather (darker as it nears), the ember pool of its burn. */
  under(pen: Pen, w: World, now: number): void {
    const { ctx } = pen;
    const ember = (now - this.embers.at) / (ULT.burnS * 1000);
    if (ember < 1) {
      ctx.fillStyle = "rgba(214, 64, 30, " + (0.32 * (1 - ember)).toFixed(2) + ")";
      ctx.beginPath();
      ctx.arc(this.embers.x, this.embers.z, ULT.radiusM * (0.85 + 0.15 * ember), 0, Math.PI * 2);
      ctx.fill();
      if (Math.floor(now / 90) % 2 === 0) this.fx.emit(5, this.embers.x + Math.sin(now) * 4, this.embers.z + Math.cos(now * 1.3) * 4, 0, -1.6, 700, now);
    }
    if (w.ult.on === 1) {
      ctx.setLineDash([pen.px(9), pen.px(6)]);
      Object.assign(ctx, { strokeStyle: "rgba(242, 99, 34, 0.7)", lineWidth: pen.px(3) });
      ctx.beginPath();
      ctx.arc(w.ult.x, w.ult.z, ULT.radiusM, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const P = w.projectiles;
    for (let p = 0; p < P.top; p += 1) {
      if (P.used[p] === 0 || P.kind[p] !== PROJECTILE.feather) continue;
      const t = Math.max(0, Math.min(1, 1 - Math.hypot(P.tx[p]! - P.x[p]!, P.tz[p]! - P.z[p]!) / FALL_M));
      ctx.fillStyle = "rgba(43, 33, 24, " + (0.15 + 0.35 * t).toFixed(2) + ")";
      ctx.beginPath();
      ctx.ellipse(P.tx[p]!, P.tz[p]!, 0.5 + 1.0 * t, 0.35 + 0.7 * t, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Over the enemies: heal rings spreading 6 m, broken drums bursting into letters. */
  over(pen: Pen, now: number): void {
    for (const m of this.marks) {
      const age = (now - m.at) / 700;
      if (!(age >= 0 && age < 1)) continue;
      if (m.kind === 0) {
        Object.assign(pen.ctx, { strokeStyle: "rgba(95, 154, 58, " + (1 - age).toFixed(2) + ")", lineWidth: pen.px(5) });
        pen.ctx.beginPath();
        pen.ctx.arc(m.x, m.z, 0.8 + 5.2 * ease(age), 0, Math.PI * 2);
        pen.ctx.stroke();
        if (age < 0.6) pen.text("+25 %", m.x, m.z - 1.5 - age * 2, 14, "#3f7a1e", 900);
      } else for (let k = 0; k < SCRAPS.length; k += 1) pen.text(SCRAPS[k]!, m.x + Math.cos(k * 0.9) * 3 * ease(age), m.z + Math.sin(k * 0.9) * 3 * ease(age) - age, 16 - 6 * age, "#2b2118", 900);
    }
  }

  /** Screen pixels: Draconis' portrait slides in from the left edge over 0.6 s, holds, slides back (a placeholder in ink on paper). */
  portrait(ctx: CanvasRenderingContext2D, height: number, ratio: number, now: number): void {
    const t = (now - this.castAt) / 1000;
    if (!(t >= 0 && t < 1.9)) return;
    const k = ratio;
    const [w, h] = [170 * k, 120 * k];
    const x = -w + (w + 16 * k) * (t < 0.6 ? ease(t / 0.6) : t > 1.5 ? 1 - ease((t - 1.5) / 0.4) : 1);
    const y = height * 0.3;
    ctx.save();
    Object.assign(ctx, { fillStyle: "#fff4d6", strokeStyle: "#2b2118", lineWidth: 3 * k });
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10 * k);
    ctx.fill();
    ctx.stroke();
    // A dragon's head in ink: the jaw and snout, a horn, the eye, a flame from the mouth.
    const [cx, cy] = [x + 62 * k, y + 64 * k];
    Object.assign(ctx, { fillStyle: "#f2994a", lineWidth: 2.5 * k });
    ctx.beginPath();
    ctx.moveTo(cx - 34 * k, cy - 10 * k);
    ctx.quadraticCurveTo(cx - 10 * k, cy - 44 * k, cx + 30 * k, cy - 16 * k);
    ctx.lineTo(cx + 50 * k, cy - 6 * k);
    ctx.lineTo(cx + 28 * k, cy + 8 * k);
    ctx.quadraticCurveTo(cx - 6 * k, cy + 30 * k, cx - 34 * k, cy - 10 * k);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 14 * k, cy - 28 * k);
    ctx.lineTo(cx - 30 * k, cy - 48 * k);
    ctx.stroke();
    Object.assign(ctx, { fillStyle: "#2b2118" });
    ctx.beginPath();
    ctx.arc(cx + 8 * k, cy - 16 * k, 4 * k, 0, Math.PI * 2);
    ctx.fill();
    Object.assign(ctx, { fillStyle: "rgba(242, 99, 34, " + (0.6 + 0.3 * Math.sin(now * 0.03)).toFixed(2) + ")" });
    ctx.beginPath();
    ctx.ellipse(cx + 70 * k, cy - 2 * k, 18 * k, 8 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    Object.assign(ctx, { fillStyle: "#2b2118", font: "800 " + Math.round(15 * k) + 'px "Be Vietnam Pro", sans-serif', textAlign: "left", textBaseline: "alphabetic" });
    ctx.fillText("Tối Thượng!", x + 12 * k, y + h - 10 * k);
    ctx.restore();
  }
}
