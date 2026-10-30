import type { Rect } from "./lanes";
import { keepIn, type View } from "./safe";
const rect = (x: number, y: number, w: number, h: number): Rect => ({ left: x, top: y, right: x + w, bottom: y + h });
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/** Prefer today's side, its opposite, then above, before using the nearest safe fallback. Width includes the ×. */
export function comboSide(card: Rect, w: number, h: number, side: number, view: View, panels: readonly Rect[]): { box: Rect; side: number } {
  const first = side === -1 ? -1 : 1;
  const options = [first, -first, 0].map(s => ({ side: s, box: rect(s === 0 ? (card.left + card.right - w) / 2 : s > 0 ? card.right + 12 : card.left - 12 - w, s === 0 ? card.top - 12 - h : (card.top + card.bottom - h) / 2, w, h) }));
  for (const option of options) {
    const r = keepIn(option.box, view, panels);
    if (r.ok && r.left === option.box.left && r.top === option.box.top) return option;
  }
  return { side: first, box: keepIn(options[0]!.box, view, panels) };
}

/** A single 90° V in CSS pixels, its heading limited to 60° about the edge normal. Local geometry never changes. */
export function trayPointer(edge: number, dir: readonly number[], card: Rect, view: View, bars: readonly Rect[]) {
  const normal = [Math.PI, 0, -Math.PI / 2, Math.PI / 2][edge] ?? 0;
  const delta = Math.atan2(Math.sin(Math.atan2(dir[1]!, dir[0]!) - normal), Math.cos(Math.atan2(dir[1]!, dir[0]!) - normal));
  const angle = normal + clamp(delta, -Math.PI / 3, Math.PI / 3), size = 16 * Math.max(1, view.height / 720);
  const c = Math.cos(angle), s = Math.sin(angle);
  const points = [[size / 2, 0], [-size / 2, -size], [-size / 2, size]].map(([x, y]) => [x! * c - y! * s, x! * s + y! * c] as [number, number]);
  const left = Math.min(...points.map(p => p[0])) - 3, top = Math.min(...points.map(p => p[1])) - 3;
  const w = Math.max(...points.map(p => p[0])) - left + 3, h = Math.max(...points.map(p => p[1])) - top + 3;
  // The left pointer sits below the word line, so it cannot read as an extra first letter.
  const x = edge === 0 ? card.left - w - 6 : edge === 1 ? card.right + 6 : (card.left + card.right - w) / 2;
  const y = edge === 0 ? card.bottom + 8 : edge === 2 ? card.top - h - 6 : edge === 3 ? card.bottom + 6 : (card.top + card.bottom - h) / 2;
  const box = keepIn(rect(x, y, w, h), view, [...bars, card], 8);
  const cx = box.left - left, cy = box.top - top;
  return { x: cx, y: cy, angle, size, box, points: points.map(p => [p[0] + cx, p[1] + cy] as [number, number]) as [[number, number], [number, number], [number, number]] };
}
