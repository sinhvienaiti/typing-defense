/**
 * The 2D view's effects chunk (ticket 036, VFX_STANDARD §5.4 V4a), loaded once the page is usable. FxPipe: shots and
 * hits read from the combat ring for FxDraw. FxView (R2, BUILD_1B §13.3): Tối Thượng (Draconis' portrait sliding in
 * from the left, a shadow under each falling feather, the ember pool of its burn) and the direct calls' outcomes (a
 * broken drum bursting into letters, a heal ring spreading 6 m; R3: a pinned pack's ring closing in, a broken dome
 * bursting into stones), from the world and its events; it emits into fx-2d.ts's particle pool.
 */
import { ULT } from "../content/rules";
import { FX, type CombatRing, type RareEvent } from "../sim/events";
import { PROJECTILE } from "../sim/stores/projectiles";
import type { World } from "../sim/world";
import type { Pen } from "./boss-2d";
import type { Particles } from "./fx-2d";

/** What the pipe calls; kind: PROJECTILE of the shot (arrow, shell, bolt, fireball, wordShot); crit: 0 or 1; tick: the sim's. */
export interface FxDraw {
  muzzle(x: number, z: number, kind: number, tick: number): void; // a shot leaves its shooter at (x, z) m
  hit(x: number, z: number, crit: number, tick: number): void; // a single-target shot lands on its target at (x, z) m
}
export type FxStats = { read: number; fire: number; hit: number; lost: number };
const NO_DRAW: FxDraw = { muzzle() {}, hit() {} };

export class FxPipe {
  private cursor: number;
  private readCount = 0;
  private fireCount = 0;
  private hitCount = 0;
  private lostCount = 0;

  constructor(ring: CombatRing, private readonly draw: FxDraw = NO_DRAW) {
    this.cursor = ring.written;
  }

  read(ring: CombatRing): void {
    const end = ring.written;
    if (end - this.cursor > ring.size) {
      this.lostCount += end - ring.size - this.cursor;
      this.cursor = end - ring.size;
    }
    for (; this.cursor < end; this.cursor += 1) {
      const slot = this.cursor % ring.size;
      this.readCount += 1;
      if (ring.kind[slot] === FX.fire) {
        this.fireCount += 1;
        this.draw.muzzle(ring.x[slot]!, ring.z[slot]!, ring.value[slot]!, ring.tick[slot]!);
      } else if (ring.kind[slot] === FX.hit) {
        this.hitCount += 1;
        this.draw.hit(ring.x[slot]!, ring.z[slot]!, ring.value[slot]!, ring.tick[slot]!);
      }
    }
  }

  stats(): FxStats {
    return { read: this.readCount, fire: this.fireCount, hit: this.hitCount, lost: this.lostCount };
  }
}

/** A heal ring (0), a drum broken into letters (1), a pack pinned (2), a dome broken (3) or a word shot's hit (4, its word) at a world point, from a ring of 12. */
type Mark = { x: number; z: number; at: number; kind: number; text: string };
const SCRAPS = "ngatchu";
const ease = (t: number): number => 1 - (1 - t) * (1 - t);
/** A feather starts this far from where it lands (ult.ts: 12 m/s for ULT.fallS). */
const FALL_M = 12 * ULT.fallS;

export class FxView {
  private readonly marks: Mark[] = Array.from({ length: 12 }, () => ({ x: 0, z: 0, at: -1e9, kind: 0, text: "" }));
  private next = 0;
  private castAt = -1e9;
  private raining = false;
  private readonly embers = { x: 0, z: 0, at: -1e9 };

  constructor(private readonly fx: Particles) {}

  /** This frame's events (after BossView's, which starts the particles' frame). */
  read(events: readonly RareEvent[], w: World, now: number): void {
    for (const e of events) {
      if (e.t === "ult") this.castAt = now;
      if (e.t !== "direct" || (e.verb > 0 && !e.ok)) continue; // a pack let run walks on, a dome let run just ends
      Object.assign(this.marks[(this.next = (this.next + 1) % this.marks.length)]!, { x: e.x, z: e.z, at: now, kind: e.ok ? e.verb + 1 : 0, text: SCRAPS });
      const dome = e.verb === 2;
      if (e.ok) this.fx.burst(dome ? 6 : 1, e.x, e.z, dome ? 12 : 8, dome ? 6 : 4, dome ? 800 : 500, now);
    }
    if (this.raining && w.ult.on === 0) Object.assign(this.embers, { x: w.ult.x, z: w.ult.z, at: now });
    this.raining = w.ult.on === 1;
  }

  /** A word shot landed (test pass 27/10: a dot that vanished): a jade flash and its word's letters bursting out. */
  wordHit(x: number, z: number, text: string, now: number): void {
    Object.assign(this.marks[(this.next = (this.next + 1) % this.marks.length)]!, { x, z, at: now, kind: 4, text: text || "chu" });
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

  /** Over the enemies: heal rings spreading 6 m, broken drums and word shots' hits bursting into letters, pinned packs, broken domes. */
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
      } else if (m.kind % 4 > 1) { // 2 a pinned pack, 3 a broken dome; 4, a word shot's hit, bursts below
        // R3: a pinned pack's slate ring closes in from 6 m; a broken dome's grey ring flies out from 4 m.
        const pin = m.kind === 2;
        Object.assign(pen.ctx, { strokeStyle: (pin ? "rgba(74, 106, 138, " : "rgba(60, 67, 72, ") + (1 - age).toFixed(2) + ")", lineWidth: pen.px(5) });
        pen.ctx.beginPath();
        pen.ctx.arc(m.x, m.z, pin ? 6 - 5 * ease(age) : 4 + 2 * ease(age), 0, Math.PI * 2);
        pen.ctx.stroke();
        pen.text(pin ? "Đứng sững!" : "Vỡ vòm!", m.x, m.z + 2.4 + age, 16, pin ? "#2f4f6f" : "#2b2118", 900); // under it: its card hangs above
      } else {
        if (m.kind === 4 && age < 0.45) pen.text("✦", m.x, m.z, 40 * (1 - age), "rgba(127, 245, 224, " + (1 - age / 0.45).toFixed(2) + ")", 900);
        const n = m.text.length;
        for (let k = 0; k < n; k += 1) pen.text(m.text[k]!, m.x + Math.cos(k * 6.283 / n + 0.4) * 3 * ease(age), m.z + Math.sin(k * 6.283 / n + 0.4) * 3 * ease(age) - age, 16 - 6 * age, m.kind === 4 ? "#0b6f61" : "#2b2118", 900);
      }
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
