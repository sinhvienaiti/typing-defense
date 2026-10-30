import type { Rect } from "./lanes";
export type View = { width: number; height: number };
export type SafeFrame = View & { panels: readonly Rect[] };
const rect = (x: number, y: number, w: number, h: number): Rect => ({ left: x, top: y, right: x + w, bottom: y + h });
const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(Math.max(lo, hi), x));
/** Nearest translation in the rectangular free space. Its boundary coordinates suffice for an exact minimum.
 * With no valid placement, return the nearest screen-clamped position and ok=false. */
export function keepIn(box: Rect, view: View, panels: readonly Rect[], pad = 8): Rect & { ok: boolean } {
  const w = box.right - box.left, h = box.bottom - box.top;
  // Forbidden positions of the top-left corner (the box expanded into each panel).
  const ps = panels.map(p => [p.left - pad - w, p.top - pad - h, p.right + pad, p.bottom + pad] as const);
  const xs = [box.left, ...ps.flatMap(p => [p[0], p[2]])].map(x => clamp(x, pad, view.width - pad - w));
  const ys = [box.top, ...ps.flatMap(p => [p[1], p[3]])].map(y => clamp(y, pad, view.height - pad - h));
  let best = rect(xs[0]!, ys[0]!, w, h), cost = Infinity;
  search: for (const x of xs) for (const y of ys) {
    const distance = (x - box.left) ** 2 + (y - box.top) ** 2;
    if (distance >= cost || ps.some(p => x > p[0] && x < p[2] && y > p[1] && y < p[3])) continue;
    best = rect(x, y, w, h); cost = distance;
    if (!cost) break search;
  }
  return { ...best, ok: cost < Infinity && w <= view.width - 2 * pad && h <= view.height - 2 * pad };
}
