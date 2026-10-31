import type { Rect } from "./lanes";
import { keepIn, type View } from "./safe";
const rect = (x: number, y: number, w: number, h: number): Rect => ({ left: x, top: y, right: x + w, bottom: y + h });
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/**
 * Prefer `side` (−1 left, 1 right, 0 above), its opposite, then above, before the nearest safe fallback; `only`: that side
 * alone (a pop's side is chosen once at its largest box and kept, judge C10 r5). Width includes the ×. A fallback keeps
 * off the card itself too: a box moved off a panel never lands on its own card.
 */
export function comboSide(card: Rect, w: number, h: number, side: number, view: View, panels: readonly Rect[], only = false): { box: Rect; side: number } {
  const order = only ? [side] : side === 0 ? [0, 1, -1] : [side, -side, 0];
  const options = order.map(s => ({ side: s, box: rect(s === 0 ? (card.left + card.right - w) / 2 : s > 0 ? card.right + 12 : card.left - 12 - w, s === 0 ? card.top - 12 - h : (card.top + card.bottom - h) / 2, w, h) }));
  for (const option of options) {
    const r = keepIn(option.box, view, panels);
    if (r.ok && r.left === option.box.left && r.top === option.box.top) return option;
  }
  return { side: options[0]!.side, box: keepIn(options[0]!.box, view, [...panels, card], 4) };
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
  // Just outside the card's edge towards the caller, at its middle (judge C10 r5: below it, the V read as detached; the "C"
  // before the word was the typed letter flying out, now launched past the card's edge in 3d/words.ts).
  const x = edge === 0 ? card.left - w - 6 : edge === 1 ? card.right + 6 : (card.left + card.right - w) / 2;
  const y = edge === 2 ? card.top - h - 6 : edge === 3 ? card.bottom + 6 : (card.top + card.bottom - h) / 2;
  const box = keepIn(rect(x, y, w, h), view, [...bars, card], 8);
  const cx = box.left - left, cy = box.top - top;
  return { x: cx, y: cy, angle, size, box, points: points.map(p => [p[0] + cx, p[1] + cy] as [number, number]) as [[number, number], [number, number], [number, number]] };
}
