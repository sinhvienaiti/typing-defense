/**
 * Văn Điền instruments made in code (TK 24.6, 24.8; SPLIT_PLAN §1.2), no files: a đàn tranh pluck, a sáo
 * trúc note, a trống cơm hit, a bronze bell, a bamboo or wood knock, a paper puff and a far villager's
 * call. Each schedules its nodes at time t into `to` and lets them go when done. Placeholders until the
 * real files of docs/audio/THEME_SOUND_LIST.md arrive.
 */
export type Out = { ctx: AudioContext; to: AudioNode };

/** Ngũ cung (Hò, Xự, Xang, Xê, Cống ≈ C D F G A): semitones over C. Typing notes and music share it (TK 24.8). */
export const NGU_CUNG = [0, 2, 5, 7, 9] as const;
/** Frequency of scale step k (0 = C4; 5 = C5), negative steps below. */
export const note = (k: number): number => 261.63 * 2 ** ((Math.floor(k / 5) * 12 + NGU_CUNG[((k % 5) + 5) % 5]!) / 12);

let noiseData: AudioBuffer | null = null;

function envelope(o: Out, t: number, peak: number, attack: number, decay: number, to: AudioNode = o.to): GainNode {
  const g = new GainNode(o.ctx, { gain: 0 });
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(to);
  return g;
}

/** A fixed gain into `to`. */
function level(o: Out, gain: number, to: AudioNode): GainNode {
  const g = new GainNode(o.ctx, { gain });
  g.connect(to);
  return g;
}

function tone(o: Out, type: OscillatorType, freq: number, t: number, end: number, to: AudioNode): OscillatorNode {
  const n = new OscillatorNode(o.ctx, { type, frequency: freq });
  n.connect(to);
  n.start(t);
  n.stop(end);
  return n;
}

/** Filtered noise from t to end. */
function hiss(o: Out, t: number, end: number, type: BiquadFilterType, freq: number, q: number, to: AudioNode): BiquadFilterNode {
  if (noiseData === null || noiseData.sampleRate !== o.ctx.sampleRate) {
    noiseData = o.ctx.createBuffer(1, o.ctx.sampleRate, o.ctx.sampleRate);
    const data = noiseData.getChannelData(0);
    for (let k = 0; k < data.length; k += 1) data[k] = Math.random() * 2 - 1;
  }
  const filter = new BiquadFilterNode(o.ctx, { type, frequency: freq, Q: q });
  const source = new AudioBufferSourceNode(o.ctx, { buffer: noiseData, loop: true, playbackRate: 0.9 + Math.random() * 0.2 });
  source.connect(filter).connect(to);
  source.start(t, Math.random() * 0.8);
  source.stop(end);
  return filter;
}

/** Đàn tranh: a bright string that darkens as it rings; `slide` bends up into the note (vuốt). */
export function tranh(o: Out, t: number, freq: number, gain: number, slide = false): void {
  const ring = 0.7 + 180 / freq;
  const lp = new BiquadFilterNode(o.ctx, { type: "lowpass", frequency: Math.min(9000, freq * 8), Q: 0.7 });
  lp.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 1.8), t + 0.3);
  lp.connect(envelope(o, t, gain, 0.003, ring));
  for (const [type, mul, mix] of [["triangle", 1, 1], ["sawtooth", 1, 0.3], ["sine", 2, 0.22]] as const) {
    const n = tone(o, type, freq * mul, t, t + ring + 0.05, level(o, mix, lp));
    if (slide) {
      n.frequency.setValueAtTime(freq * mul * 0.944, t);
      n.frequency.exponentialRampToValueAtTime(freq * mul, t + 0.09);
    }
  }
}

/** Sáo trúc: a breathy sine with a late vibrato, `length` s held. */
export function sao(o: Out, t: number, freq: number, length: number, gain: number): void {
  const end = t + length + 0.14;
  const g = new GainNode(o.ctx, { gain: 0 });
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.06);
  g.gain.setValueAtTime(gain, t + Math.max(0.07, length - 0.08));
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  g.connect(o.to);
  const body = tone(o, "sine", freq, t, end, g);
  const over = tone(o, "triangle", freq * 2, t, end, level(o, 0.1, g));
  const depth = new GainNode(o.ctx, { gain: 0 });
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(freq * 0.007, t + Math.min(0.35, length));
  tone(o, "sine", 5.3, t, end, depth);
  depth.connect(body.frequency);
  depth.connect(over.frequency);
  hiss(o, t, end, "bandpass", freq * 1.4, 2, level(o, 0.25, g));
}

/** Trống cơm: a tuned skin that drops in pitch, with a soft slap. */
export function trong(o: Out, t: number, gain: number, pitch = 140): void {
  const n = tone(o, "sine", pitch * 1.7, t, t + 0.4, envelope(o, t, gain, 0.002, 0.32));
  n.frequency.exponentialRampToValueAtTime(pitch, t + 0.05);
  n.frequency.exponentialRampToValueAtTime(pitch * 0.82, t + 0.35);
  hiss(o, t, t + 0.06, "lowpass", 1300, 0.7, envelope(o, t, gain * 0.45, 0.001, 0.045));
}

/** A bronze bell or gong: four inharmonic partials, the high ones dying first. */
export function chuong(o: Out, t: number, freq: number, gain: number, length = 1.4): void {
  for (const [mul, share, life] of [[1, 1, 1], [2.76, 0.45, 0.5], [5.4, 0.22, 0.28], [8.93, 0.1, 0.16]] as const) {
    tone(o, "sine", freq * mul, t, t + length * life + 0.05, envelope(o, t, gain * share, 0.002, length * life));
  }
}

/** Bamboo or wood knocked: a short hollow tone and a click (`hollow` s: longer is a bigger tube). */
export function go(o: Out, t: number, freq: number, gain: number, hollow = 0.05): void {
  const n = tone(o, "sine", freq, t, t + hollow + 0.03, envelope(o, t, gain, 0.001, hollow));
  n.frequency.exponentialRampToValueAtTime(freq * 0.96, t + hollow);
  hiss(o, t, t + 0.03, "bandpass", freq * 2.3, 3, envelope(o, t, gain * 0.8, 0.001, 0.022));
}

/** Paper: a soft puff or rustle, the band sliding from `from` to `to` Hz. */
export function giay(o: Out, t: number, gain: number, length = 0.16, from = 3000, to = 900): void {
  hiss(o, t, t + length + 0.03, "bandpass", from, 0.9, envelope(o, t, gain, 0.012, length)).frequency.exponentialRampToValueAtTime(to, t + length);
}

/** The ground: a low noise swelling over `length` s (the lull), or a short break (`length` ≤ 0.4). */
export function rumble(o: Out, t: number, length: number, gain: number): void {
  const g = new GainNode(o.ctx, { gain: 0.0001 });
  g.gain.exponentialRampToValueAtTime(gain, t + length * 0.9);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length + 0.3);
  g.connect(o.to);
  hiss(o, t, t + length + 0.35, "lowpass", 140, 0.8, g);
}

/** Mộc Tinh's roar: low noise and a falling saw through a lowpass. */
export function roar(o: Out, t: number, gain: number): void {
  const lp = new BiquadFilterNode(o.ctx, { type: "lowpass", frequency: 700, Q: 2 });
  lp.connect(envelope(o, t, gain, 0.05, 1.1));
  tone(o, "sawtooth", 160, t, t + 1.2, lp).frequency.exponentialRampToValueAtTime(55, t + 1.1);
  hiss(o, t, t + 1.2, "bandpass", 320, 1.2, lp);
}

/** A villager calling across the fields, far off: "Ơ… ơi!" (a voice through two vowel formants, rising, then falling). */
export function goi(o: Out, t: number, f0: number, gain: number): void {
  const end = t + 1.3;
  const g = new GainNode(o.ctx, { gain: 0 });
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.12);
  g.gain.setValueAtTime(gain, t + 0.95);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  const far = new BiquadFilterNode(o.ctx, { type: "lowpass", frequency: 2200 });
  far.connect(g).connect(o.to);
  const formants = [[560, 360, 1], [1150, 2250, 0.5]].map(([from, to, share]) => {
    const band = new BiquadFilterNode(o.ctx, { type: "bandpass", frequency: from!, Q: 7 });
    band.frequency.setValueAtTime(from!, t + 0.5);
    band.frequency.linearRampToValueAtTime(to!, t + 0.7);
    band.connect(level(o, share! * 6, far));
    return band;
  });
  const voice = new OscillatorNode(o.ctx, { type: "sawtooth", frequency: f0 * 0.9 });
  voice.frequency.linearRampToValueAtTime(f0 * 1.08, t + 0.3);
  voice.frequency.setValueAtTime(f0 * 1.08, t + 0.55);
  voice.frequency.linearRampToValueAtTime(f0 * 1.26, t + 0.72);
  voice.frequency.linearRampToValueAtTime(f0 * 0.98, end);
  for (const band of formants) voice.connect(band);
  voice.start(t);
  voice.stop(end + 0.05);
}

/** A room's tail made in code: decaying noise, `seconds` long (TK 24.4: the meadow's 0.6–0.9 s). */
export function reverbTail(ctx: AudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(2, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let k = 0; k < data.length; k += 1) data[k] = (Math.random() * 2 - 1) * (1 - k / data.length) ** 2.6;
  }
  return buffer;
}
