/**
 * The music placeholder made in code (TK 24.8; SPLIT_PLAN §1.2), on its own bus: one tempo (84 BPM), one
 * scale (ngũ cung, shared with the typing notes), two layers that start together and cross-fade over 2 s.
 * Calm (day, the title): đàn tranh figures over a low string, a sáo trúc phrase every four bars. Tension
 * (night): trống cơm, a low tranh ostinato, bamboo clicks on the off-beats, a bronze gong every four bars.
 * At night both play, the calm one 6 dB down. Eighths are scheduled a quarter second ahead from the frame
 * loop; a layer faded out schedules nothing.
 */
import { chuong, go, note, sao, tranh, trong } from "./folk";

const EIGHTH = 60 / 84 / 2;
const AHEAD = 0.25;
/** Calm figures: a scale step for each eighth of a bar (−99 a rest); one is picked per bar. */
const R = -99;
const FIGURES = [
  [5, R, 7, 8, 10, R, 8, 7],
  [3, R, 5, 7, 8, 7, 5, R],
  [5, 7, 8, R, 9, 8, 7, R],
  [2, R, 4, 5, 7, R, 5, 4],
  [7, R, 8, 10, 8, R, 7, 5],
] as const;
/** Low string under the calm layer, one per bar (C, A, F, G). */
const ROOTS = [0, -1, -3, -2] as const;
/** The tension layer by eighth: the low ostinato around D (R: none) and the drum (2 a full hit, 1 a soft one). */
const OSTINATO = [-4, R, 1, -4, -2, R, 1, R] as const;
const DRUM = [2, 0, 1, 0, 2, 1, 0, 1] as const;

export class FolkMusic {
  private readonly calm: GainNode;
  private readonly tense: GainNode;
  private next = 0;
  private eighth = 0;
  private figure = 0;
  private night: boolean | null = null;
  /** The sáo phrase being played: [eighth it starts on, scale step, eighths held]. */
  private phrase: [number, number, number][] = [];

  constructor(private readonly ctx: AudioContext, out: AudioNode) {
    this.calm = new GainNode(ctx, { gain: 0 });
    this.tense = new GainNode(ctx, { gain: 0 });
    this.calm.connect(out);
    this.tense.connect(out);
  }

  /** The night's layer on or off: a 2 s cross-fade (the first call fades the music in). */
  set(night: boolean): void {
    if (night === this.night) return;
    this.night = night;
    const t = this.ctx.currentTime;
    for (const [layer, to] of [[this.calm, night ? 0.5 : 1], [this.tense, night ? 1 : 0]] as const) {
      layer.gain.cancelScheduledValues(t);
      layer.gain.setValueAtTime(layer.gain.value, t);
      layer.gain.linearRampToValueAtTime(to, t + 2);
    }
  }

  /** Schedules the eighths that start within the next quarter second (back from a hidden tab: no backlog). */
  update(): void {
    const now = this.ctx.currentTime;
    if (this.night === null) return;
    if (this.next < now) this.next = now + 0.05;
    for (; this.next < now + AHEAD; this.next += EIGHTH, this.eighth += 1) this.play(this.next, this.eighth);
  }

  private play(t: number, k: number): void {
    const pos = k % 8;
    const bar = Math.floor(k / 8);
    const calm = { ctx: this.ctx, to: this.calm };
    const tense = { ctx: this.ctx, to: this.tense };
    if (pos === 0) this.figure = (this.figure + 1 + Math.floor(Math.random() * (FIGURES.length - 1))) % FIGURES.length;
    if (pos === 0) tranh(calm, t, note(ROOTS[bar % 4]! - 5), 0.07);
    const step = FIGURES[this.figure]![pos]!;
    if (step !== R && Math.random() > 0.12) tranh(calm, t, note(step), 0.055 + Math.random() * 0.02, Math.random() < 0.15);
    // Every fourth bar a sáo phrase: a short walk on the scale, held notes at its ends.
    if (bar % 4 === 2 && pos === 0) {
      let at = k;
      let s = 9 + Math.floor(Math.random() * 3);
      this.phrase = [2, 1, 1, 2, 4].map((hold) => {
        const one: [number, number, number] = [at, s, hold];
        at += hold;
        s += Math.random() < 0.6 ? -1 : 1;
        return one;
      });
    }
    for (const [at, s, hold] of this.phrase) if (at === k) sao(calm, t, note(s), hold * EIGHTH * 0.95, 0.045);
    if (this.night !== true && this.tense.gain.value < 0.01) return;
    if (DRUM[pos]! > 0) trong(tense, t, DRUM[pos] === 2 ? 0.32 : 0.16, DRUM[pos] === 2 ? 120 : 165);
    if (OSTINATO[pos] !== R) tranh(tense, t, note(OSTINATO[pos]!), 0.06);
    if (pos % 2 === 1) go(tense, t, 1250, 0.03, 0.03);
    if (bar % 4 === 0 && pos === 0) chuong(tense, t, 98, 0.12, 2.6);
  }
}
