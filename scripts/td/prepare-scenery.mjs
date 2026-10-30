#!/usr/bin/env node
/** C9: accepted painted billboards, deterministic WebP atlases; no runtime or source-art writes.
 * node scripts/td/prepare-scenery.mjs [--check] [--pending] [--review]
 * Image IO uses ImageMagick raw RGBA; cwebp -exact preserves transparent bleed RGB.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const MAGICK = process.env.ART_MAGICK || 'magick';
const IO = { maxBuffer: 320 * 1024 * 1024 };
const SET = join(ROOT, 'scripts/td/scenery-set.json');
const HIGH = 4096, MARGIN = 8, BLEED = 8;
const round = n => Math.round(n * 1e6) / 1e6;
const sha = b => createHash('sha256').update(b).digest('hex');
const align = n => Math.ceil(n / 4) * 4;
const solid = (a, p) => a[p * 4 + 3] >= 128;
const run = args => execFileSync(MAGICK, args, IO);
export function readRGBA(path) {
  const [width, height] = run(['identify', '-format', '%w %h', path]).toString().split(' ').map(Number);
  return { width, height, data: new Uint8Array(run([path, '-depth', '8', 'rgba:-'])) };
}
function raw(data, w, h, args) {
  return new Uint8Array(execFileSync(MAGICK, ['-size', `${w}x${h}`, '-depth', '8', 'rgba:-', ...args], { ...IO, input: data }));
}
export function resizeRGBA(data, w, h, nw, nh) {
  if (w === nw && h === nh) return data.slice();
  // RGB is already dilated beneath alpha. Resize those straight channels
  // independently: associated-alpha Lanczos divides by tiny ringing alpha
  // and can manufacture saturated key colours from an otherwise clean edge.
  const rgb = raw(data, w, h, ['-alpha', 'off', '-filter', 'Lanczos', '-resize', `${nw}x${nh}!`, '-depth', '8', 'rgba:-']);
  const alpha = raw(data, w, h, ['-alpha', 'extract', '-filter', 'Lanczos', '-resize', `${nw}x${nh}!`, '-depth', '8', 'gray:-']);
  for (let p = 0; p < nw * nh; p++) rgb[p * 4 + 3] = alpha[p];
  return rgb;
}
export function isKey(data, i, key) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const target = key === '#0000FF' ? [0, 0, 255] : [255, 0, 255];
  if (Math.max(...target.map((v, c) => Math.abs(data[i + c] - v))) <= 60) return true;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!mx || d / mx <= .5) return false;
  let hue = d === 0 ? 0 : mx === r ? 60 * ((g - b) / d) : mx === g ? 60 * (2 + (b - r) / d) : 60 * (4 + (r - g) / d);
  hue = (hue + 360) % 360;
  const delta = Math.abs(hue - (key === '#0000FF' ? 240 : 300));
  return Math.min(delta, 360 - delta) <= 20;
}
export function keyAlpha(input, key, ticket = 116) {
  const a = input.slice();
  for (let i = 0; i < a.length; i += 4) {
    let background = isKey(a, i, key);
    if (ticket === 116) {
      const r = a[i], g = a[i + 1], b = a[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      let hue = d === 0 ? 0 : mx === r ? 60 * ((g - b) / d) : mx === g ? 60 * (2 + (b - r) / d) : 60 * (4 + (r - g) / d);
      hue = (hue + 360) % 360;
      background = Math.max(255 - r, g, 255 - b) <= 60 || (hue >= 250 && hue <= 345 && mx > 0 && d / mx > .15);
    }
    a[i + 3] = background ? 0 : 255;
  }
  return a;
}
export function tightBox(a, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let p = 0; p < w * h; p++) if (solid(a, p)) {
    const x = p % w, y = Math.floor(p / w);
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (x1 < 0) throw new Error('Empty alpha mask');
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}
export function findFoot(a, w, h) {
  const [, top, , height] = tightBox(a, w, h), bottom = top + height - 1;
  const band = Math.max(1, Math.ceil(height * .02));
  let xsum = 0, count = 0;
  for (let y = bottom - band + 1; y <= bottom; y++) for (let x = 0; x < w; x++) if (solid(a, y * w + x)) { xsum += x + .5; count++; }
  // Pixel centres on x; bottom edge of the lowest solid row on y.
  return { x: xsum / count, y: bottom + 1 };
}
function crop(a, w, box) {
  const [x, y, bw, bh] = box, out = new Uint8Array(bw * bh * 4);
  for (let j = 0; j < bh; j++) out.set(a.subarray(((y + j) * w + x) * 4, ((y + j) * w + x + bw) * 4), j * bw * 4);
  return out;
}
/** Chebyshev distance to opposite mask; outside-of-image is transparent. */
export function edgeDistances(a, w, h, inside = true) {
  const d = new Float32Array(w * h), inf = w + h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x, active = solid(a, p) === inside;
    d[p] = active ? (inside && (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? 1 : inf) : 0;
    if (x) d[p] = Math.min(d[p], d[p - 1] + 1);
    if (y) { d[p] = Math.min(d[p], d[p - w] + 1); if (x) d[p] = Math.min(d[p], d[p - w - 1] + 1); if (x + 1 < w) d[p] = Math.min(d[p], d[p - w + 1] + 1); }
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const p = y * w + x;
    if (x + 1 < w) d[p] = Math.min(d[p], d[p + 1] + 1);
    if (y + 1 < h) { d[p] = Math.min(d[p], d[p + w] + 1); if (x) d[p] = Math.min(d[p], d[p + w - 1] + 1); if (x + 1 < w) d[p] = Math.min(d[p], d[p + w + 1] + 1); }
  }
  return d;
}
export function removeKeyEdge(a, w, h, key) {
  const out = a.slice(), d = edgeDistances(a, w, h), bad = [];
  const donors = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const keyed = isKey(a, p * 4, key);
    if (a[p * 4 + 3] > 0 && d[p] <= 2 && keyed) bad.push(p);
    donors[p] = solid(a, p) && !keyed ? 1 : 0;
  }
  // Stable nearest valid donor, with all decisions based on original RGB.
  for (const p of bad) {
    const x = p % w, y = Math.floor(p / w); let best = -1;
    for (let r = 1; r <= 32 && best < 0; r++) for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r) && best < 0; yy++) for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) {
      const q = yy * w + xx;
      if (donors[q]) { best = q; break; }
    }
    if (best < 0) throw new Error(`Cannot repair keyed edge at ${x},${y} without changing art`);
    out.set(a.subarray(best * 4, best * 4 + 3), p * 4);
  }
  return { data: out, count: bad.length };
}
export function bleedColors(a, w, h, radius = 8) {
  const out = a.slice(), seen = new Uint8Array(w * h);
  let frontier = [];
  for (let p = 0; p < w * h; p++) {
    if (a[p * 4 + 3] > 0) { seen[p] = 1; frontier.push(p); }
    // Never retain the source key beyond the bleed: lossy WebP's chroma filter
    // can otherwise draw it back across the eight-pixel band.
    else out.fill(0, p * 4, p * 4 + 3);
  }
  for (let step = 0; step < radius; step++) {
    const next = [];
    for (const p of frontier) {
      const x = p % w, y = Math.floor(p / w);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const q = yy * w + xx;
        if (seen[q]) continue;
        seen[q] = 1; out.set(out.subarray(p * 4, p * 4 + 3), q * 4); next.push(q);
      }
    }
    frontier = next;
  }
  return out;
}
function blur(field, w, h, radius = 2) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), den = radius * 2 + 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let n = 0; for (let k = -radius; k <= radius; k++) n += field[y * w + Math.max(0, Math.min(w - 1, x + k))]; tmp[y * w + x] = n / den;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let n = 0; for (let k = -radius; k <= radius; k++) n += tmp[Math.max(0, Math.min(h - 1, y + k)) * w + x]; out[y * w + x] = n / den;
  }
  return out;
}
export function makeNormals(a, w, h) {
  const d = edgeDistances(a, w, h), field = new Float32Array(w * h);
  let peak = 1; for (const n of d) peak = Math.max(peak, n);
  for (let p = 0; p < d.length; p++) field[p] = peak * .65 * Math.sin(Math.PI * .5 * d[p] / peak);
  const smoothed = blur(blur(field, w, h), w, h), out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x;
    if (!solid(a, p)) { out.set([128, 128, 255, 255], p * 4); continue; }
    const nx = -(smoothed[y * w + Math.min(w - 1, x + 1)] - smoothed[y * w + Math.max(0, x - 1)]) / 2;
    const ny = (smoothed[Math.min(h - 1, y + 1) * w + x] - smoothed[Math.max(0, y - 1) * w + x]) / 2;
    const len = Math.hypot(nx, ny, 1);
    out.set([Math.round((nx / len * .5 + .5) * 255), Math.round((ny / len * .5 + .5) * 255), Math.round((1 / len * .5 + .5) * 255), 255], p * 4);
  }
  return out;
}
/** MaxRects, fixed height/width/id ordering, no rotations. */
export function packRects(items, size = HIGH) {
  let free = [{ x: 0, y: 0, width: size, height: size }];
  const out = [];
  const sorted = items.map(r => ({ ...r, width: align(r.width), height: align(r.height) })).sort((a, b) => b.height - a.height || b.width - a.width || a.id.localeCompare(b.id, 'en'));
  for (const item of sorted) {
    const candidates = free.filter(r => item.width <= r.width && item.height <= r.height).sort((a, b) => Math.min(a.width - item.width, a.height - item.height) - Math.min(b.width - item.width, b.height - item.height) || a.y - b.y || a.x - b.x);
    if (!candidates.length) throw new Error(`Cannot fit ${item.id} into ${size} atlas`);
    const r = { ...item, x: candidates[0].x, y: candidates[0].y }; out.push(r);
    const split = [];
    for (const f of free) {
      if (r.x >= f.x + f.width || r.x + r.width <= f.x || r.y >= f.y + f.height || r.y + r.height <= f.y) { split.push(f); continue; }
      if (r.x > f.x) split.push({ ...f, width: r.x - f.x });
      if (r.x + r.width < f.x + f.width) split.push({ ...f, x: r.x + r.width, width: f.x + f.width - r.x - r.width });
      if (r.y > f.y) split.push({ ...f, height: r.y - f.y });
      if (r.y + r.height < f.y + f.height) split.push({ ...f, y: r.y + r.height, height: f.y + f.height - r.y - r.height });
    }
    free = split.filter((a, i) => !split.some((b, j) => i !== j && a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height && (a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height || j < i)));
  }
  return out.sort((a, b) => a.id.localeCompare(b.id, 'en'));
}
function place(dst, dw, src, sw, sh, x, y) {
  for (let row = 0; row < sh; row++) dst.set(src.subarray(row * sw * 4, (row + 1) * sw * 4), ((y + row) * dw + x) * 4);
}
function padded(a, w, h, rw, rh, margin = MARGIN) {
  const out = new Uint8Array(rw * rh * 4); place(out, rw, a, w, h, margin, margin); return out;
}
function blank(w, h, rgba = [0, 0, 0, 0]) {
  const out = new Uint8Array(w * h * 4); for (let p = 0; p < w * h; p++) out.set(rgba, p * 4); return out;
}
function validateSet(items) {
  const ids = new Set(), kinds = ['tree', 'bamboo', 'canopy', 'bush', 'grass', 'flower', 'rock', 'log', 'stump'];
  for (const s of items) {
    if (ids.has(s.id) || !(s.heightM > 0) || !kinds.includes(s.kind)) throw new Error(`Invalid scenery entry: ${s.id}`);
    if (s.ink !== false) throw new Error(`ink:true is unsupported: ${s.id}; outline drawing is disabled`);
    if (!['#FF00FF', '#0000FF'].includes(s.key)) throw new Error(`Invalid key: ${s.id}`);
    ids.add(s.id);
  }
}
function inputs(items) {
  const sources = items.map(s => ({ id: s.id, source: sha(readFileSync(join(ROOT, 'art-src', s.src))), alpha: s.alpha && existsSync(join(ROOT, 'art-src', s.alpha)) ? sha(readFileSync(join(ROOT, 'art-src', s.alpha))) : null }));
  const recipe = sha(Buffer.concat([readFileSync(fileURLToPath(import.meta.url)), readFileSync(SET), Buffer.from(JSON.stringify(sources)), run(['-version']), execFileSync('cwebp', ['-version'])]));
  return { recipe, sources };
}
function fresh(manifestPath, out, recipe) {
  if (!existsSync(manifestPath)) return false;
  try {
    const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
    return m.build.recipe === recipe && Object.entries(m.build.outputs).length === 5 && Object.entries(m.build.outputs).every(([file, hash]) => existsSync(join(out, file)) && sha(readFileSync(join(out, file))) === hash);
  } catch { return false; }
}
function load(s) {
  const im = readRGBA(join(ROOT, 'art-src', s.src)); let maxDifference = null;
  if (s.alpha && existsSync(join(ROOT, 'art-src', s.alpha))) {
    const mask = readRGBA(join(ROOT, 'art-src', s.alpha));
    if (im.width !== mask.width || im.height !== mask.height) throw new Error(`Alpha size mismatch: ${s.id}`);
    maxDifference = 0;
    for (let i = 0; i < im.data.length; i += 4) {
      if (mask.data[i + 3] >= 128) for (let c = 0; c < 3; c++) maxDifference = Math.max(maxDifference, Math.abs(mask.data[i + c] - im.data[i + c]));
      im.data[i + 3] = mask.data[i + 3];
    }
    if (maxDifference > 2) throw new Error(`RGB/alpha source mismatch: ${s.id}: ${maxDifference}/255`);
  } else im.data = keyAlpha(im.data, s.key, s.ticket);
  const box = tightBox(im.data, im.width, im.height), cut = crop(im.data, im.width, box);
  const fixed = removeKeyEdge(cut, box[2], box[3], s.key);
  return { ...s, sourceSize: [im.width, im.height], box, cut: bleedColors(fixed.data, box[2], box[3]), repairedPixels: fixed.count, alphaRGBMaxDifference: maxDifference };
}
function plan(sources) {
  for (let density = 72; density >= 64; density -= .25) {
    const dims = sources.map(s => {
      const h = Math.min(s.box[3], Math.floor(s.heightM * density)), w = Math.max(1, Math.round(s.box[2] * h / s.box[3]));
      return { id: s.id, width: w + MARGIN * 2, height: h + MARGIN * 2, contentWidth: w, contentHeight: h };
    });
    try { return { density, rects: packRects(dims) }; } catch { /* Try one common lower density, never below 64. */ }
  }
  throw new Error('Cannot fit atlas at 64 px/m; Claude must approve any lower density');
}
/** Decisions 30/10 12:58 and 13:28. Count raw hue matches separately from exemptions. */
export function keyExemption(a, i, outsideDistance) {
  if (Math.max(a[i], a[i + 1], a[i + 2]) / 255 < .25) return 'dark';
  const luma = (.2126 * a[i] + .7152 * a[i + 1] + .0722 * a[i + 2]) / 255;
  return a[i + 3] === 0 && outsideDistance >= 3 && luma < .2 ? 'transparent' : null;
}
export function auditEdgeKeys(a, w, h, key, bleed = BLEED) {
  const inside = edgeDistances(a, w, h), outside = edgeDistances(a, w, h, false);
  let count = 0, darkExempt = 0, transparentExempt = 0;
  for (let p = 0; p < w * h; p++) {
    if (!(solid(a, p) ? inside[p] <= 2 : outside[p] <= bleed) || !isKey(a, p * 4, key)) continue;
    const exemption = keyExemption(a, p * 4, outside[p]);
    if (exemption === 'dark') darkExempt++;
    else if (exemption === 'transparent') transparentExempt++;
    else count++;
  }
  return { count, exempt: darkExempt + transparentExempt, darkExempt, transparentExempt };
}
function encode(data, size, normal = false, shadow = false, quality = 90) {
  const args = shadow ? ['-alpha', 'off', '-colorspace', 'Gray'] : normal ? ['-alpha', 'off'] : [];
  // The installed IM WebP delegate does not consistently honour exact for lossy RGB;
  // cwebp explicitly receives -exact after IM's raw RGBA -> PNG stream.
  const png = raw(data, size, size, [...args, '-define', 'webp:alpha-quality=100', '-define', 'webp:exact=true', 'png:-']);
  return execFileSync('cwebp', ['-quiet', '-q', String(quality), ...(!normal && !shadow ? ['-sharp_yuv'] : []), '-alpha_q', '100', '-exact', '-m', '6', '-metadata', 'none', '-o', '-', '--', '-'], { ...IO, input: png });
}
function writeChanged(path, bytes) {
  if (existsSync(path) && readFileSync(path).equals(Buffer.from(bytes))) return false;
  mkdirSync(resolve(path, '..'), { recursive: true }); writeFileSync(path, bytes); console.log(`wrote ${path.slice(ROOT.length + 1)} (${bytes.length} bytes)`); return true;
}
export function build({ pending = false, check = false, review = false } = {}) {
  const start = performance.now(), all = JSON.parse(readFileSync(SET, 'utf8')); validateSet(all);
  const items = all.filter(s => pending || s.accepted).sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const out = join(ROOT, pending ? 'tmp/199/pending' : 'public/assets/typing-defense/scenery');
  const manifestPath = join(out, 'manifest.json'), fingerprint = inputs(items);
  if (fresh(manifestPath, out, fingerprint.recipe)) {
    console.log(`scenery ${pending ? 'pending' : 'accepted'}: fresh; 0 files written; ${((performance.now() - start) / 1000).toFixed(3)} s`);
    if (review && !check) createReview(JSON.parse(readFileSync(manifestPath, 'utf8')), out, pending ? out : undefined);
    return;
  }
  if (check) throw new Error(`Missing or stale scenery ${pending ? 'pending' : 'accepted'} atlas/manifest (source, alpha, recipe or output hash changed)`);
  const sources = items.map(load), { density, rects } = plan(sources);
  const color = blank(HIGH, HIGH), normal = blank(HIGH, HIGH, [128, 128, 255, 255]);
  const mediumColor = blank(HIGH / 2, HIGH / 2), mediumNormal = blank(HIGH / 2, HIGH / 2, [128, 128, 255, 255]);
  const shadow = blank(HIGH / 4, HIGH / 4, [0, 0, 0, 255]), sprites = [], metrics = [];
  for (const s of sources) {
    const r = rects.find(r => r.id === s.id), w = r.contentWidth, h = r.contentHeight;
    const resized = resizeRGBA(s.cut, s.box[2], s.box[3], w, h);
    // Lanczos can produce keyed low-alpha ringing. Repair only its edge band,
    // before the transparent RGB is extended; never touch the interior.
    const highFixed = removeKeyEdge(resized, w, h, s.key);
    const pad = padded(highFixed.data, w, h, r.width, r.height);
    const col = bleedColors(pad, r.width, r.height), nor = makeNormals(pad, r.width, r.height);
    const mediumFixed = removeKeyEdge(resizeRGBA(col, r.width, r.height, r.width / 2, r.height / 2), r.width / 2, r.height / 2, s.key);
    const med = bleedColors(mediumFixed.data, r.width / 2, r.height / 2, 4);
    const medNor = makeNormals(med, r.width / 2, r.height / 2);
    place(color, HIGH, col, r.width, r.height, r.x, r.y); place(normal, HIGH, nor, r.width, r.height, r.x, r.y);
    place(mediumColor, HIGH / 2, med, r.width / 2, r.height / 2, r.x / 2, r.y / 2); place(mediumNormal, HIGH / 2, medNor, r.width / 2, r.height / 2, r.x / 2, r.y / 2);
    const sw = r.width / 4, sh = r.height / 4, small = resizeRGBA(col, r.width, r.height, sw, sh), field = new Float32Array(sw * sh);
    for (let p = 0; p < field.length; p++) field[p] = small[p * 4 + 3];
    const soft = blur(field, sw, sh, 1), shade = blank(sw, sh, [0, 0, 0, 255]);
    for (let p = 0; p < field.length; p++) for (let c = 0; c < 3; c++) shade[p * 4 + c] = Math.round(soft[p]);
    place(shadow, HIGH / 4, shade, sw, sh, r.x / 4, r.y / 4);
    const foot = findFoot(col, r.width, r.height), pxPerM = h / s.heightM;
    let minZ = 255; for (let p = 0; p < col.length / 4; p++) if (solid(col, p)) minZ = Math.min(minZ, nor[p * 4 + 2]);
    sprites.push({ id: s.id, type: s.type, variant: s.variant, kind: s.kind, ink: false, key: s.key, uv: [r.x / HIGH, r.y / HIGH, (r.x + r.width) / HIGH, (r.y + r.height) / HIGH].map(round), rect: [r.x, r.y, r.x + r.width, r.y + r.height], px: [r.width, r.height], foot: [foot.x / r.width, 1 - foot.y / r.height].map(round), heightM: s.heightM, sizeM: [r.width / pxPerM, r.height / pxPerM].map(round), pxPerM: round(pxPerM), source: s.src, sha256: fingerprint.sources.find(f => f.id === s.id).source });
    metrics.push({ id: s.id, sourceSize: s.sourceSize, tightBox: s.box, rect: [r.x, r.y, r.width, r.height], pxPerM: round(pxPerM), foot: sprites.at(-1).foot, footOffsetPercent: round((foot.x / r.width - .5) * 100), flagFoot: Math.abs(foot.x / r.width - .5) > .15, repairedPixels: s.repairedPixels + highFixed.count, sourceRepairedPixels: s.repairedPixels, resizeRepairedPixels: highFixed.count, mediumRepairedPixels: mediumFixed.count, edgeKeyPixels: auditEdgeKeys(col, r.width, r.height, s.key).count, alphaRGBMaxDifference: s.alphaRGBMaxDifference, minZ: round(minZ / 255 * 2 - 1) });
  }
  const buffers = {
    'meadow/color.high.webp': encode(color, HIGH), 'meadow/normal.high.webp': encode(normal, HIGH, true),
    'meadow/color.medium.webp': encode(mediumColor, HIGH / 2), 'meadow/normal.medium.webp': encode(mediumNormal, HIGH / 2, true),
    'meadow/shadow.high.webp': encode(shadow, HIGH / 4, false, true),
  };
  const m = { version: 1, region: 'meadow', format: 'webp', uvOrigin: 'top-left', alphaCutoff: .5, marginPx: MARGIN, bleedPx: BLEED,
    tiers: { high: { size: HIGH, color: 'meadow/color.high.webp', normal: 'meadow/normal.high.webp' }, medium: { size: HIGH / 2, color: 'meadow/color.medium.webp', normal: 'meadow/normal.medium.webp' } },
    shadow: { size: HIGH / 4, file: 'meadow/shadow.high.webp', tiers: ['high'] }, normal: { space: 'tangent', x: 'right', y: 'up', encode: 'n*0.5+0.5', colorSpace: 'linear', z: 'camera' }, densityPxPerM: density, pending, sprites,
    build: { recipe: fingerprint.recipe, outputs: Object.fromEntries(Object.entries(buffers).map(([f, b]) => [f, sha(b)])) } };
  const result = { densityPxPerM: density, occupancyPercent: round(rects.reduce((n, r) => n + r.width * r.height, 0) / HIGH ** 2 * 100), sprites: metrics, files: Object.fromEntries(Object.entries(buffers).map(([f, b]) => [f, { bytes: b.length, sha256: sha(b) }])) };
  // Retry only the lossy colour codec, preserving alpha and all painted input bytes.
  const attempts = [];
  let failures = [], quality = 90;
  for (quality of [90, 92, 95]) {
    if (quality !== 90) {
      buffers['meadow/color.high.webp'] = encode(color, HIGH, false, false, quality);
      buffers['meadow/color.medium.webp'] = encode(mediumColor, HIGH / 2, false, false, quality);
    }
    const decoded = Object.fromEntries(Object.entries(buffers).filter(([f]) => !f.includes('shadow')).map(([f, b]) => [f, new Uint8Array(execFileSync(MAGICK, ['webp:-', '-depth', '8', 'rgba:-'], { ...IO, input: b }))]));
    failures = [];
    for (const [tier, scale] of [['high', 1], ['medium', .5]]) for (const s of sprites) {
      const [x0, y0, x1, y1] = s.rect.map(n => n * scale), w = x1 - x0, h = y1 - y0, size = HIGH * scale;
      const c = crop(decoded[`meadow/color.${tier}.webp`], size, [x0, y0, w, h]), n = crop(decoded[`meadow/normal.${tier}.webp`], size, [x0, y0, w, h]);
      let minZ = 255; for (let p = 0; p < w * h; p++) if (solid(c, p)) minZ = Math.min(minZ, n[p * 4 + 2]);
      const audit = auditEdgeKeys(c, w, h, s.key, BLEED * scale), metric = metrics.find(m => m.id === s.id);
      metric[`decoded${tier}EdgeKeyPixels`] = audit.count;
      metric[`decoded${tier}ExemptKeyPixels`] = audit.exempt;
      metric[`decoded${tier}DarkExemptPixels`] = audit.darkExempt;
      metric[`decoded${tier}TransparentExemptPixels`] = audit.transparentExempt;
      metric[`decoded${tier}MinZ`] = round(minZ / 255 * 2 - 1);
      console.log(`audit q${quality} ${tier} ${s.id}: key=${audit.count}, exempt=${audit.exempt} (dark=${audit.darkExempt}, alpha0=${audit.transparentExempt}), minZ=${round(minZ / 255 * 2 - 1)}`);
      if (minZ <= 127) throw new Error(`Decoded normal z is not positive: ${tier} ${s.id}`);
      if (audit.count) {
        const inside = edgeDistances(c, w, h), outside = edgeDistances(c, w, h, false), pixels = [];
        for (let p = 0; p < w * h; p++) if ((solid(c, p) ? inside[p] <= 2 : outside[p] <= BLEED * scale) && isKey(c, p * 4, s.key) && !keyExemption(c, p * 4, outside[p])) pixels.push({ xy: [p % w, Math.floor(p / w)], rgba: [...c.subarray(p * 4, p * 4 + 4)] });
        failures.push({ tier, id: s.id, keyPixels: audit.count, maxRGBA: pixels.reduce((a, p) => a.map((v, i) => Math.max(v, p.rgba[i])), [0, 0, 0, 0]), pixels });
      }
    }
    attempts.push({ quality, edgeKeyPixels: failures.reduce((n, f) => n + f.keyPixels, 0), files: Object.fromEntries(Object.entries(buffers).map(([f, b]) => [f, b.length])), sprites: metrics.map(s => ({ id: s.id, high: { count: s.decodedhighEdgeKeyPixels, darkExempt: s.decodedhighDarkExemptPixels, transparentExempt: s.decodedhighTransparentExemptPixels }, medium: { count: s.decodedmediumEdgeKeyPixels, darkExempt: s.decodedmediumDarkExemptPixels, transparentExempt: s.decodedmediumTransparentExemptPixels } })) });
    if (!failures.length) break;
  }
  result.audit = { quality, attempts, failures };
  m.build.colorQuality = quality;
  m.build.edgeKeyPixels = failures.reduce((n, f) => n + f.keyPixels, 0);
  if (failures.length) m.build.edgeReview = { decision: '2026-10-30 13:28', quality, failures };
  m.build.outputs = Object.fromEntries(Object.entries(buffers).map(([f, b]) => [f, sha(b)]));
  result.files = Object.fromEntries(Object.entries(buffers).map(([f, b]) => [f, { bytes: b.length, sha256: sha(b) }]));
  // 13:28: any q95 residual is reported for visual judging, never a publishing blocker.
  if (failures.length) console.warn(`q95 retains ${m.build.edgeKeyPixels} bright keyed edge pixels; see metrics.json and edges-x4.jpg for Claude review`);
  for (const [f, b] of Object.entries(buffers)) writeChanged(join(out, f), b);
  writeChanged(manifestPath, JSON.stringify(m, null, 2) + '\n');

  writeChanged(join(ROOT, pending ? 'tmp/199/pending/metrics.json' : 'tmp/199/metrics.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(`scenery ${pending ? 'pending' : 'accepted'}: ${sprites.length} sprites, ${density} px/m, ${result.occupancyPercent}% full; ${((performance.now() - start) / 1000).toFixed(3)} s`);
  if (review || (failures.length && !pending)) createReview(m, out, pending ? out : undefined);
}

// Review sheets are diagnostics only; never shipped or baked into the color atlas.
export function createReview(m, out, dir = join(ROOT, 'tmp/199')) {
  const work = join(dir, 'work'); mkdirSync(work, { recursive: true });
  const font = '/System/Library/Fonts/Supplemental/Arial.ttf';
  const save = (name, data, w, h) => { const p = join(work, name + '.png'); raw(data, w, h, [p]); return p; };
  const jpg = (args, dest) => {
    let bytes;
    for (let quality = 83; quality >= 35; quality -= 4) {
      bytes = run([...args, '-strip', '-quality', String(quality), 'jpg:-']);
      if (bytes.length < 1000000) { writeChanged(join(dir, dest), bytes); return; }
    }
    throw new Error(`Review sheet exceeds 1 MB: ${dest}`);
  };
  const color = readRGBA(join(out, m.tiers.high.color)), normal = readRGBA(join(out, m.tiers.high.normal));
  const checker = join(work, 'checker.png'); run(['-size', '4096x4096', 'pattern:checkerboard', '-colorspace', 'sRGB', checker]);
  const composite = join(work, 'atlas-color.png'); run([checker, '-colorspace', 'sRGB', '-type', 'TrueColor', join(out, m.tiers.high.color), '-compose', 'over', '-composite', '-resize', '1024x1024', composite]);
  const side = join(work, 'atlas-side.png'); run(['(', join(out, m.tiers.high.normal), '-resize', '512x512', ')', '(', join(out, m.shadow.file), '-resize', '512x512', ')', '-append', side]);
  jpg([composite, side, '+append', '-resize', '2048x'], 'atlas.jpg');
  const rows = [], edgeRows = [];
  for (const s of m.sprites) {
    const [x, y, x1, y1] = s.rect, w = x1 - x, h = y1 - y;
    const c = crop(color.data, HIGH, [x, y, w, h]), n = crop(normal.data, HIGH, [x, y, w, h]);
    const lit = c.slice();
    for (let p = 0; p < w * h; p++) {
      const nx = n[p * 4] / 255 * 2 - 1, ny = n[p * 4 + 1] / 255 * 2 - 1, nz = n[p * 4 + 2] / 255 * 2 - 1;
      const light = -.45 * nx + .6 * ny + .66 * nz, ramp = light < .25 ? .55 : light < .65 ? .8 : 1;
      const bottom = 1 - .25 * Math.max(0, (Math.floor(p / w) / h - .7) / .3);
      for (let k = 0; k < 3; k++) lit[p * 4 + k] = Math.round(c[p * 4 + k] * ramp * bottom);
    }
    const cp = save(s.id + '-color', c, w, h), np = save(s.id + '-normal', n, w, h), lp = save(s.id + '-lit', lit, w, h);
    const entry = JSON.parse(readFileSync(SET, 'utf8')).find(e => e.id === s.id);
    const original = readRGBA(join(ROOT, 'art-src', s.source));
    const mask = entry.alpha && existsSync(join(ROOT, 'art-src', entry.alpha)) ? readRGBA(join(ROOT, 'art-src', entry.alpha)).data : keyAlpha(original.data, entry.key, entry.ticket);
    for (let i = 3; i < original.data.length; i += 4) original.data[i] = mask[i];
    const box = tightBox(original.data, original.width, original.height);
    const ch = Math.round(s.heightM * s.pxPerM), cw = Math.max(1, Math.round(box[2] * ch / box[3]));
    const before = save(s.id + '-before', padded(resizeRGBA(crop(original.data, original.width, box), box[2], box[3], cw, ch), cw, ch, w, h), w, h);
    const panels = [];
    for (const [label, path] of [['Ảnh giao 116', before], ['Ô atlas', cp], ['Pháp tuyến', np], ['Chiếu sáng thử', lp]]) {
      const panel = join(work, s.id + '-' + panels.length + '.png');
      const args = [path, '-resize', '470x320', '-background', '#3f5a48', '-gravity', 'center', '-extent', '480x350', '-alpha', 'remove', '-font', font, '-fill', 'white', '-pointsize', '18', '-gravity', 'south', '-annotate', '+0+4', label];
      if (label === 'Ô atlas' || label === 'Chiếu sáng thử') {
        const scale = Math.min(470 / w, 320 / h), fx = (480 - w * scale) / 2 + s.foot[0] * w * scale, fy = (350 - h * scale) / 2 + (1 - s.foot[1]) * h * scale;
        args.push('-stroke', '#ffcf50', '-strokewidth', '2', '-draw', `line ${fx - 12},${fy} ${fx + 12},${fy}`);
      }
      run([...args, panel]); panels.push(panel);
    }
    const row = join(work, s.id + '-row.png'); run([...panels, '+append', '-background', '#182c25', '-splice', '0x32', '-font', font, '-fill', 'white', '-pointsize', '21', '-gravity', 'northwest', '-annotate', '+10+4', `${s.id} · ${s.heightM} m · ${s.pxPerM} px/m`, row]); rows.push(row);
    const distances = edgeDistances(c, w, h), outside = edgeDistances(c, w, h, false), candidates = [];
    for (let p = 0; p < w * h; p++) if (solid(c, p) ? distances[p] <= 2 : outside[p] <= BLEED) {
      const i = p * 4, r = c[i], g = c[i + 1], b = c[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      let hue = !d ? 0 : mx === r ? 60 * ((g - b) / d) : mx === g ? 60 * (2 + (b - r) / d) : 60 * (4 + (r - g) / d);
      hue = (hue + 360) % 360;
      const delta = Math.abs(hue - (s.key === '#0000FF' ? 240 : 300));
      const exempt = keyExemption(c, i, outside[p]);
      const risk = (isKey(c, i, s.key) && !exempt ? 1000000 : 0) + (mx ? d / mx : 0) / (1 + Math.min(delta, 360 - delta));
      candidates.push({ p, risk });
    }
    candidates.sort((a, b) => b.risk - a.risk || a.p - b.p);
    const chosen = [];
    for (const candidate of candidates) if (chosen.every(q => Math.hypot(candidate.p % w - q % w, Math.floor(candidate.p / w) - Math.floor(q / w)) > 64)) { chosen.push(candidate.p); if (chosen.length === 2) break; }
    const edges = [];
    for (const [idx, p] of chosen.entries()) {
      const xx = Math.max(0, Math.min(w - 48, p % w - 24)), yy = Math.max(0, Math.min(h - 48, Math.floor(p / w) - 24));
      for (const [label, bg] of [['jade', '#3f5a48'], ['white', 'white']]) {
        const ep = join(work, `${s.id}-edge-${idx}-${label}.png`);
        run([cp, '-crop', `48x48+${xx}+${yy}`, '+repage', '-background', bg, '-alpha', 'remove', '-filter', 'point', '-resize', '400%', ep]); edges.push(ep);
      }
    }
    const er = join(work, s.id + '-edges.png'); run([...edges, '+append', '-background', '#182c25', '-splice', '0x30', '-font', font, '-fill', 'white', '-pointsize', '17', '-gravity', 'northwest', '-annotate', '+8+4', `${s.id} · 2 mép có RGB gần khóa nhất, cách nhau >64 px · ×4`, er]); edgeRows.push(er);
  }
  jpg([...rows, '-append'], 'sprites.jpg');
  for (const f of m.build.edgeReview?.failures || []) {
    const s = m.sprites.find(s => s.id === f.id), scale = f.tier === 'high' ? 1 : .5;
    const [x, y, x1, y1] = s.rect.map(v => v * scale), w = x1 - x, h = y1 - y;
    const source = join(out, m.tiers[f.tier].color), panels = [];
    for (const pixel of f.pixels) {
      const xx = Math.max(0, Math.min(w - 24, pixel.xy[0] - 12)), yy = Math.max(0, Math.min(h - 24, pixel.xy[1] - 12));
      const pair = [];
      for (const bg of ['#3f5a48', 'white']) {
        const dest = join(work, `residual-${f.id}-${f.tier}-${panels.length}-${pair.length}.png`);
        run([source, '-crop', `24x24+${x + xx}+${y + yy}`, '+repage', '-background', bg, '-alpha', 'remove', '-filter', 'point', '-resize', '400%', dest]); pair.push(dest);
      }
      const panel = join(work, `residual-${f.id}-${f.tier}-${panels.length}.png`);
      run([...pair, '+append', '-background', '#182c25', '-gravity', 'south', '-splice', '0x28', '-font', font, '-fill', 'white', '-pointsize', '10', '-annotate', '+0+3', `${pixel.xy.join(',')} · ${pixel.rgba.join(',')}`, panel]); panels.push(panel);
    }
    // Four pixel pairs per row, retaining an exact nearest-neighbour x4 scale.
    for (let i = 0; i < panels.length; i += 4) {
      const row = join(work, `residual-${f.id}-${f.tier}-row-${i}.png`);
      run([...panels.slice(i, i + 4), '+append', '-background', '#182c25', '-gravity', 'northwest', '-extent', '768x124', '-splice', '0x25', '-font', font, '-fill', 'white', '-pointsize', '15', '-annotate', '+8+3', `${f.id} · ${f.tier} · điểm còn lại q95 ×4`, row]); edgeRows.push(row);
    }
  }
  jpg([...edgeRows, '-append'], 'edges-x4.jpg');
  console.log(`review: ${dir.slice(ROOT.length + 1)}/{atlas,sprites,edges-x4}.jpg`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    for (const arg of args) if (!['--pending', '--check', '--review'].includes(arg)) throw new Error(`Unknown option: ${arg}`);
    build({ pending: args.includes('--pending'), check: args.includes('--check'), review: args.includes('--review') });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
