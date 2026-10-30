import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
// @ts-ignore JavaScript preparation tool deliberately has no runtime dependency on TS.
import { packRects, findFoot, removeKeyEdge, bleedColors, makeNormals, isKey, edgeDistances, auditEdgeKeys, keyExemption } from '../scripts/td/prepare-scenery.mjs';

const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const set = () => json('../scripts/td/scenery-set.json');
const manifest = () => json('../public/assets/typing-defense/scenery/manifest.json');
function fixture(w: number, h: number, solid: (x: number, y: number) => boolean) {
  const a = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    a.set([40, 110, 60, solid(x, y) ? 255 : 0], i);
  }
  return a;
}
const overlaps = (a: number[], b: number[]) => a[0]! < b[2]! && b[0]! < a[2]! && a[1]! < b[3]! && b[1]! < a[3]!;

describe('scenery preparation: pure contracts', () => {
  it('packs deterministic, aligned, bounded, non-overlapping rects and rejects overflow', () => {
    const input = [{ id: 'b', width: 30, height: 45 }, { id: 'a', width: 31, height: 17 }, { id: 'c', width: 16, height: 8 }];
    const out = packRects(input, 128);
    expect(out).toEqual(packRects([...input].reverse(), 128));
    for (const r of out) for (const n of [r.x, r.y, r.width, r.height]) expect(n % 4).toBe(0);
    for (const r of out) { expect(r.x + r.width).toBeLessThanOrEqual(128); expect(r.y + r.height).toBeLessThanOrEqual(128); }
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j];
      expect(overlaps([a.x, a.y, a.x + a.width, a.y + a.height], [b.x, b.y, b.x + b.width, b.y + b.height])).toBe(false);
    }
    expect(() => packRects([{ id: 'huge', width: 129, height: 4 }], 128)).toThrow(/fit/i);
    expect(() => packRects(Array.from({ length: 5 }, (_, i) => ({ id: String(i), width: 64, height: 64 })), 128)).toThrow(/fit/i);
  });
  it('anchors on the bottom row and the off-centre trunk, ignoring canopy centre', () => {
    const a = fixture(100, 100, (x, y) => (y >= 5 && y < 60 && x >= 5 && x < 95) || (y >= 55 && y <= 94 && x >= 68 && x <= 72));
    expect(findFoot(a, 100, 100)).toEqual({ x: 70.5, y: 95 });
  });
  it('repairs only keyed pixels in the inner two-pixel band and bleeds eight pixels', () => {
    const w = 40, h = 40;
    const a = fixture(w, h, (x, y) => x >= 10 && x < 30 && y >= 10 && y < 30);
    for (let y = 10; y < 30; y++) for (let x = 10; x < 30; x++) if (x < 12 || x >= 28 || y < 12 || y >= 28) a.set([250, 5, 249, 255], (y * w + x) * 4);
    const before = a.slice();
    const fixed = removeKeyEdge(a, w, h, '#FF00FF');
    expect(fixed.count).toBe(144);
    const result = bleedColors(fixed.data, w, h, 8);
    const dist = edgeDistances(a, w, h, false);
    for (let p = 0; p < w * h; p++) {
      if (a[p * 4 + 3]! >= 128 || dist[p] <= 8) expect(isKey(result, p * 4, '#FF00FF')).toBe(false);
      const x = p % w, y = Math.floor(p / w);
      if (x >= 12 && x < 28 && y >= 12 && y < 28) expect([...result.slice(p * 4, p * 4 + 4)]).toEqual([...before.slice(p * 4, p * 4 + 4)]);
      expect(result[p * 4 + 3]).toBe(before[p * 4 + 3]);
    }
  });
  it('makes outward tangent normals on a disc, positive z inside and flat outside', () => {
    const a = fixture(65, 65, (x, y) => (x - 32) ** 2 + (y - 32) ** 2 <= 24 ** 2);
    const n = makeNormals(a, 65, 65);
    for (let p = 0; p < 65 * 65; p++) {
      if (a[p * 4 + 3]! >= 128) expect(n[p * 4 + 2]).toBeGreaterThan(127);
      else expect([...n.slice(p * 4, p * 4 + 4)]).toEqual([128, 128, 255, 255]);
    }
    expect(n[(32 * 65 + 52) * 4]).toBeGreaterThan(128);
    expect(n[(32 * 65 + 12) * 4]).toBeLessThan(128);
    expect(n[(12 * 65 + 32) * 4 + 1]).toBeGreaterThan(128);
  });
  it('discards hidden key RGB and repairs keyed antialias pixels before bleeding', () => {
    const w = 40, h = 40;
    const a = fixture(w, h, (x, y) => x >= 10 && x < 30 && y >= 10 && y < 30);
    for (let p = 0; p < w * h; p++) if (!a[p * 4 + 3]) a.set([255, 0, 255, 0], p * 4);
    a.set([255, 0, 255, 16], (9 * w + 20) * 4);
    const fixed = removeKeyEdge(a, w, h, '#FF00FF');
    expect(fixed.count).toBe(1);
    const b = bleedColors(fixed.data, w, h, 8);
    for (let p = 0; p < w * h; p++) expect(isKey(b, p * 4, '#FF00FF')).toBe(false);
    expect(b[(9 * w + 20) * 4 + 3]).toBe(16);
  });
  it('leaves keyed paint in the interior byte-for-byte unchanged', () => {
    const a = fixture(30, 30, (x, y) => x >= 5 && x < 25 && y >= 5 && y < 25);
    const i = (15 * 30 + 15) * 4;
    a.set([255, 0, 255, 255], i);
    const b = bleedColors(removeKeyEdge(a, 30, 30, '#FF00FF').data, 30, 30);
    expect([...b.slice(i, i + 4)]).toEqual([255, 0, 255, 255]);
  });
  it('applies the 13:28 dark exemption at every alpha and preserves the 12:58 transparent exemption', () => {
    const w = 24, h = 24;
    const original = fixture(w, h, (x, y) => x >= 8 && x < 16 && y >= 8 && y < 16);
    const check = (x: number, rgba: number[]) => {
      const a = original.slice(); a.set(rgba, (12 * w + x) * 4);
      return auditEdgeKeys(a, w, h, '#FF00FF');
    };
    const dark = { count: 0, exempt: 1, darkExempt: 1, transparentExempt: 0 };
    const transparent = { count: 0, exempt: 1, darkExempt: 0, transparentExempt: 1 };
    const bad = { count: 1, exempt: 0, darkExempt: 0, transparentExempt: 0 };
    for (const x of [4, 5, 6, 8]) for (const alpha of [0, 1, 127, 128, 255]) {
      expect(check(x, [36, 14, 39, alpha])).toEqual(dark);
    }
    expect(check(8, [63, 0, 63, 255])).toEqual(dark); // V < .25
    expect(check(8, [64, 0, 64, 255])).toEqual(bad); // V >= .25
    expect(check(5, [179, 0, 179, 0])).toEqual(transparent);
    expect(check(6, [179, 0, 179, 0])).toEqual(bad); // only 2 px away
    expect(check(5, [179, 0, 179, 1])).toEqual(bad);
    expect(check(5, [180, 0, 180, 0])).toEqual(bad); // luma >= .2
    expect(check(5, [255, 0, 255, 0])).toEqual(bad);
    const blue = original.slice(); blue.set([4, 8, 40, 255], (12 * w + 8) * 4);
    expect(auditEdgeKeys(blue, w, h, '#0000FF')).toEqual(dark);
  });
  it('lists 26 unique sprites and leaves tickets 117/118 pending', () => {
    const items = set();
    expect(items).toHaveLength(26);
    expect(new Set(items.map((s: any) => s.id)).size).toBe(26);
    for (const s of items) { expect(s.heightM).toBeGreaterThan(0); expect(s.ink).toBe(false); if ([117, 118].includes(s.ticket)) expect(s.accepted).toBe(false); }
    expect(items.filter((s: any) => s.accepted)).toHaveLength(8);
  });
  it('always validates the tracked manifest without needing media', () => {
    const m = manifest();
    const ids = set().filter((s: any) => s.accepted).map((s: any) => s.id).sort();
    expect(m.sprites.map((s: any) => s.id).sort()).toEqual(ids);
    expect(m.uvOrigin).toBe('top-left');
    for (const s of m.sprites) {
      for (const n of [...s.uv, ...s.foot]) { expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThanOrEqual(1); }
      for (let j = 0; j < 2; j++) expect(s.sizeM[j]).toBeCloseTo(s.px[j] / s.pxPerM, 4);
      for (const n of s.px) expect(n % 4).toBe(0);
      for (const other of m.sprites) if (s.id !== other.id) expect(overlaps(s.uv, other.uv)).toBe(false);
    }
  });
});

const magick = process.env.ART_MAGICK || 'magick';
let tool = false;
try { execFileSync(magick, ['-version'], { stdio: 'ignore' }); tool = true; } catch { /* Media-free CI. */ }
const base = new URL('../public/assets/typing-defense/scenery/', import.meta.url);
const media = ['color.high.webp', 'normal.high.webp', 'color.medium.webp', 'normal.medium.webp', 'shadow.high.webp'];
it.skipIf(!tool || media.some(f => !existsSync(new URL('meadow/' + f, base))))('decoded atlases keep dimensions, positive z and zero unreported keyed pixels (13:28 decision)', () => {
  const m = manifest();
  for (const [tier, size] of [['high', 4096], ['medium', 2048]] as const) {
    const colorPath = new URL(m.tiers[tier].color, base).pathname;
    const normalPath = new URL(m.tiers[tier].normal, base).pathname;
    for (const path of [colorPath, normalPath]) expect(execFileSync(magick, ['identify', '-format', '%wx%h', path]).toString()).toBe(`${size}x${size}`);
    const opts = { maxBuffer: 160 * 1024 * 1024 };
    const c = execFileSync(magick, [colorPath, '-depth', '8', 'rgba:-'], opts);
    const n = execFileSync(magick, [normalPath, '-depth', '8', 'rgba:-'], opts);
    let badZ = 0, keyed = 0, reported = 0;
    for (const s of m.sprites) {
      const [x0, y0, x1, y1] = s.rect.map((v: number) => Math.round(v * size / 4096));
      const w = x1 - x0, h = y1 - y0, sprite = new Uint8Array(w * h * 4);
      for (let y = 0; y < h; y++) sprite.set(c.subarray(((y + y0) * size + x0) * 4, ((y + y0) * size + x1) * 4), y * w * 4);
      const audit = auditEdgeKeys(sprite, w, h, s.key, 8 * size / 4096);
      keyed += audit.count;
      // The coordinator explicitly allows q95 residuals for visual judging.
      // Every such pixel must be listed exactly; unseen or changed pixels still fail.
      const review = m.build.edgeReview;
      const records = review?.failures.filter((f: any) => f.id === s.id && f.tier === tier) || [];
      expect(records.length).toBeLessThanOrEqual(1);
      const pixels = records[0]?.pixels || [];
      expect(audit.count).toBe(pixels.length);
      if (pixels.length) {
        expect(review.decision).toBe('2026-10-30 13:28');
        expect(review.quality).toBe(95); expect(m.build.colorQuality).toBe(95);
        expect(records[0].keyPixels).toBe(pixels.length);
        expect(new Set(pixels.map((p: any) => p.xy.join(','))).size).toBe(pixels.length);
        const outside = edgeDistances(sprite, w, h, false);
        for (const p of pixels) {
          expect(p.xy[0]).toBeGreaterThanOrEqual(0); expect(p.xy[0]).toBeLessThan(w);
          expect(p.xy[1]).toBeGreaterThanOrEqual(0); expect(p.xy[1]).toBeLessThan(h);
          const offset = p.xy[1] * w + p.xy[0];
          expect([...sprite.subarray(offset * 4, offset * 4 + 4)]).toEqual(p.rgba);
          expect(isKey(sprite, offset * 4, s.key)).toBe(true);
          expect(keyExemption(sprite, offset * 4, outside[offset])).toBe(null);
        }
      }
      reported += pixels.length;
      console.log(`decoded ${tier} ${s.id}: key=${audit.count}, exempt=${audit.exempt} (dark=${audit.darkExempt}, alpha0=${audit.transparentExempt})`);
      for (let p = 0; p < w * h; p++) {
        const global = ((Math.floor(p / w) + y0) * size + p % w + x0) * 4;
        if (sprite[p * 4 + 3]! >= 128 && n[global + 2]! <= 127) badZ++;
      }
    }
    expect(badZ).toBe(0); expect(keyed - reported).toBe(0);
  }
  expect(execFileSync(magick, ['identify', '-format', '%wx%h', new URL(m.shadow.file, base).pathname]).toString()).toBe('1024x1024');
}, 120000);
