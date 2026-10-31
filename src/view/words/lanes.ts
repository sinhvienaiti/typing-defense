/** Pure word-card layout (TK 23.4): clock rise up to 240 px; measured cards, including meanings, keep their full boxes. */
export const COLUMN = { rise: 120, gap: 40, max: 240, push: 240, clear: 10 } as const;

/** Heights (px above the roof) of a column's cards, newest first: `ages` and `lives` in seconds; `gap` at least 40 px. */
export function columnHeights(ages: readonly number[], lives: readonly number[], out: number[], gap: number = COLUMN.gap): number[] {
  out.length = ages.length;
  for (let k = 0; k < ages.length; k += 1) {
    const clock = Math.min(COLUMN.rise, (COLUMN.rise * Math.max(0, ages[k]!)) / lives[k]!);
    out[k] = Math.min(COLUMN.max, k === 0 ? clock : Math.max(clock, out[k - 1]! + gap));
  }
  return out;
}

/** Measured cards, newest lowest; departing meanings (slot −1) occupy space without lock scaling or a rise cap. */
export function columnBox(cards: readonly { height: number; half: number; slot: number }[], lock: number): { heights: number[]; tallest: number; half: number } {
  const gap = Math.max(COLUMN.gap, Math.ceil(1.2 * Math.max(...cards.map((card) => card.height))) + 4);
  const heights = cards.map((_, k) => k * gap);
  const tallest = Math.max(...cards.map((card, k) => heights[k]! + card.height * (card.slot >= 0 && card.slot === lock ? 1.2 : 1)));
  const half = Math.max(...cards.map((card) => (card.slot >= 0 && card.slot === lock ? card.half * 1.2 + 18 : card.half))) + 9;
  return { heights, tallest, half };
}

/** A column on screen: its roof's x, its vertical extent (top < bottom), its widest card's half width; `lo`–`hi` where it may stand; `at` where it stood last frame. */
export type LaneBox = { x: number; top: number; bottom: number; half: number; lo?: number; hi?: number; at?: number };
export type Rect = { left: number; top: number; right: number; bottom: number };

/**
 * `lane` with `lo`–`hi` kept clear of the side panels it meets at its height (CSS px): a panel left of the middle
 * pushes `lo` past its right edge, one right of it pulls `hi` before its left edge; one across the middle (the word
 * strip) is no side panel. `keep` (test pass 27/10/2026): boxes of the action on the field (the boss, the rain), which
 * a lane meeting one at its height stands beside, on the side it stood last frame (`at`, else its roof's): never flips.
 */
export function besidePanels(lane: LaneBox, panels: readonly Rect[], middle: number, keep: readonly Rect[] = [], gap = 6): LaneBox {
  let [lo, hi] = [-Infinity, Infinity];
  for (const p of panels) {
    if (p.top >= lane.bottom || lane.top >= p.bottom || (p.left < middle && p.right > middle)) continue;
    if (p.right <= middle) lo = Math.max(lo, p.right + gap);
    else hi = Math.min(hi, p.left - gap);
  }
  for (const p of keep) if (p.top < lane.bottom && lane.top < p.bottom) [lo, hi] = (lane.at ?? lane.x) < (p.left + p.right) / 2 ? [lo, Math.min(hi, p.left - gap)] : [Math.max(lo, p.right + gap), hi];
  return { ...lane, lo, hi };
}

/** Whether two lanes that share some height come within 2 px side by side with the offsets `out` (`clear` is 10). */
export function lanesTouch(lanes: readonly LaneBox[], out: readonly number[]): boolean {
  return lanes.some((a, i) => lanes.some((b, j) => j > i && a.top < b.bottom && b.top < a.bottom && Math.abs(a.x + out[i]! - b.x - out[j]!) < a.half + b.half + 2));
}

/**
 * Sideways offsets that keep overlapping columns `clear` px apart: the one whose roof is further left goes left (ties:
 * the earlier lane), each by at most `push` (COLUMN.push, the cards' last resort a longer one: test pass 27/10, four
 * columns at neighbouring trees with a meaning strip at 1920 × 1080 need more than 240 px); a lane with `lo`–`hi` is put back
 * inside them every pass, so its neighbours make way; then each column is moved inside [left, right].
 */
export function spreadLanes(lanes: readonly LaneBox[], left: number, right: number, out: number[], push: number = COLUMN.push): number[] {
  const order = lanes.map((_, index) => index).sort((a, b) => lanes[a]!.x - lanes[b]!.x || a - b);
  out.length = lanes.length;
  out.fill(0);
  // `push` caps what parting adds, counted from where a lane's own bounds put it (an edge tray past a panel still parts).
  const high = lanes.map((lane) => Math.max(push, (lane.lo ?? -Infinity) + lane.half - lane.x + push));
  const low = lanes.map((lane) => Math.min(-push, (lane.hi ?? Infinity) - lane.half - lane.x - push));
  for (let pass = 0; pass < 40; pass += 1) {
    let moved = false;
    for (let i = 0; i < order.length; i += 1) {
      for (let j = i + 1; j < order.length; j += 1) {
        const a = lanes[order[i]!]!;
        const b = lanes[order[j]!]!;
        if (a.top >= b.bottom || b.top >= a.bottom) continue;
        const gap = b.x + out[order[j]!]! - b.half - (a.x + out[order[i]!]! + a.half);
        if (gap >= COLUMN.clear - 0.01) continue;
        const half = (COLUMN.clear - gap) / 2;
        out[order[i]!] = Math.max(low[order[i]!]!, out[order[i]!]! - half);
        out[order[j]!] = Math.min(high[order[j]!]!, out[order[j]!]! + half);
        moved = true;
      }
    }
    lanes.forEach((lane, index) => {
      const x = lane.x + out[index]!;
      const to = x - lane.half < (lane.lo ?? -Infinity) ? lane.lo! + lane.half : x + lane.half > (lane.hi ?? Infinity) ? lane.hi! - lane.half : x;
      moved ||= Math.abs(to - x) > 0.01;
      out[index] = out[index]! + to - x;
    });
    if (!moved) break;
  }
  lanes.forEach((lane, index) => {
    const x = lane.x + out[index]!;
    const [lo, hi] = [Math.max(left, lane.lo ?? left), Math.min(right, lane.hi ?? right)];
    if (x - lane.half < lo) out[index] = out[index]! + lo - (x - lane.half);
    else if (x + lane.half > hi) out[index] = out[index]! - (x + lane.half - hi);
  });
  return out;
}
