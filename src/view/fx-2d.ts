/**
 * The 2D map's particles (docs/td/BUILD_1B.md §16, §20): one fixed pool of 300 (no allocation a frame), at most 40 new
 * a frame. Kinds: dust that swells, wood chips, root spikes that grow then fade, leaves that fall, coins. Positions are
 * metres; the pen draws in the map's transform.
 */
import type { Pen } from "./boss-2d";

const POOL = 300;
const NEW_PER_FRAME = 40;
const FILL = ["rgba(160, 130, 90, 0.8)", "#8a5a2b", "", "#8cc152", "#e0b33a"] as const;
export type Kind = 0 | 1 | 2 | 3 | 4; // dust, chip, spike, leaf, coin

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
