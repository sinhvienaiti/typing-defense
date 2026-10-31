/**
 * C9 data contract (MAP_FACTORY §6.4, TK §23.10). Metres on the sim's x/z plane:
 * +x east, +z south (toward the Fort); origin at the field centre. No y is stored.
 * `sprite` is the manifest id. Apply `scale` to the sprite's authored heightM and
 * quad size about its foot; mirror its UVs with `flip`. Multiply brightness by
 * tint * shade. `r` already includes scale and is a ground-footprint radius.
 * row -1 is ordinary decor, rows 0..3 are front-to-back forest; edge 0..3 means
 * north/east/south/west, slot is the square-perimeter sample (both -1 elsewhere).
 * zone records classification, clearOnBuild permits felling on house overlap;
 * cross requests two perpendicular grass/flower quads. The caller supplies
 * accepted assets only for play, or accepted plus pending assets for review.
 * Results sort by sprite, then z, then x; tier selection retains whole nearest-
 * neighbour components so variant colours and every item field survive thinning.
 */
import { groundLanes } from "../../sim/lanes";
import { BUILD, TREE } from "../../content/rules";
import type { MapDef } from "../../content/types";

export type SceneryTier = "low" | "medium" | "high";
export type SceneryZone = "field" | "band" | "keep" | "water" | "ring";
export type SceneryEntry = { id: string; type: string; variant: string; kind: string; heightM: number };
export type SceneryInput = {
  map: MapDef;
  houses: readonly { x: number; z: number; r: number }[];
  set: readonly SceneryEntry[];
  roadHalf?: readonly Float32Array[];
  dressing?: readonly { x: number; z: number; r: number }[];
  heightAt?: (x: number, z: number) => number;
  seed?: number;
};
export type SceneryItem = {
  sprite: string; type: string; kind: string; variant: string;
  x: number; z: number; r: number; scale: number; flip: boolean;
  tint: number; shade: number; row: number; zone: SceneryZone;
  clearOnBuild: boolean; cross: boolean;
  edge: number; slot: number;
};
export type SceneryLayout = { seed: number; tier: SceneryTier; items: SceneryItem[]; counts: Record<string, number> };
export const SCENERY_BUDGET: Record<SceneryTier, { large: number; cross: number }> = {
  low: { large: 600, cross: 0 }, medium: { large: 1000, cross: 1600 }, high: { large: 1500, cross: 4000 },
};
// Initial ground-foot ratios, not crown radii; tune only after the 3D review.
export const FOOT: Readonly<Record<string, number>> = {
  tree: 0.075, bamboo: 0.075, canopy: 0.22, bush: 0.22, grass: 0.08,
  flower: 0.14, rock: 0.32, log: 0.38, stump: 0.3,
};
export const SCENERY_TUNING = {
  borderM: 40, vergeM: 0.8, fallbackRoadK: 1.5, keepYardM: 7, yardSoftM: 1.5,
  oreMinM: 3.7, oreBaseM: 2.2, oreRichnessK: 0.5, treeClearM: 4,
  gateHalfM: 6, slopeSpanM: 2, slopeRiseM: 1.4, bankM: 0.6,
  scaleMin: 0.85, scaleRange: 0.3, tintMin: 0.96, tintRange: 0.08,
  forestRows: 4, forestFrontM: 5, forestRowM: 7, forestStepM: 6,
  forestCornerM: 10, forestPhase: 0.25, forestStagger: 0.5, forestGrowth: 1.12, forestShade: 0.92,
  forestJitterMin: 0.97, forestJitterRange: 0.06,
  clusterMinM: 20, clusterRangeM: 10, densityCut: 0.56,
  poissonK: 0.8, poissonCandidateFootM: 0.7, poissonTries: 24, reseedTries: 18000, crossTries: 24000,
  gridM: 8, roadIndexReachM: 12, fieldTallRoadM: 6,
} as const;
// Universal slots retain allocations of missing types as holes, never substitutes.
// [type, kind, maximum authored height fallback, field large weight]
export const SCENERY_TYPES: readonly (readonly [string, string, number, number])[] = [
  ["almond-tree", "tree", 18, 3], ["mountain-pine", "tree", 14, 3],
  ["bamboo-clump", "bamboo", 16, 4], ["canopy-block", "canopy", 14, 0],
  ["fern", "bush", 2.3, 25], ["reed-clump", "grass", 3, 0],
  ["tall-grass", "grass", 2.5, 0], ["wildflowers", "flower", 1, 0],
  ["raspberry-bush", "bush", 1.8, 25], ["rock-medium", "rock", 3.4, 8],
  ["rock-small", "rock", 0.664719, 20], ["rotten-log", "log", 2.462413, 6],
  ["tree-stump", "stump", 2.3, 6],
];
export const SCENERY_MIX = {
  forestFront: [["canopy-block", 70], ["almond-tree", 10], ["mountain-pine", 10], ["bamboo-clump", 10]],
  forestBack: [["canopy-block", 100]],
  crossField: [["tall-grass", 65], ["wildflowers", 35]],
  crossWater: [["reed-clump", 100]],
} as const;
const T = SCENERY_TUNING;
const sq = (x: number) => x * x;
const gap2 = (a: { x: number; z: number }, b: { x: number; z: number }) => sq(a.x - b.x) + sq(a.z - b.z);
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
function fnv(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}
function hash(x: number, z: number, seed: number): number {
  let h = Math.imul(x ^ seed, 374761393) ^ Math.imul(z, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function random(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function density(x: number, z: number, seed: number, cell: number): number {
  const a = x / cell, b = z / cell, ix = Math.floor(a), iz = Math.floor(b);
  let u = a - ix, v = b - iz;
  u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
  const p = hash(ix, iz, seed), q = hash(ix + 1, iz, seed), r = hash(ix, iz + 1, seed), s = hash(ix + 1, iz + 1, seed);
  return (p + (q - p) * u) * (1 - v) + (r + (s - r) * u) * v;
}
type Rect = MapDef["water"][number];
const rectGap2 = (r: Rect, x: number, z: number) => sq(Math.max(r.x0 - x, x - r.x1, 0)) + sq(Math.max(r.z0 - z, z - r.z1, 0));
const contains = (r: Rect, x: number, z: number) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
function extended(input: SceneryInput): Rect[] {
  const h = input.map.halfM, e = h + T.borderM;
  return input.map.water.map((r) => ({ x0: r.x0 <= -h ? -e : r.x0, x1: r.x1 >= h ? e : r.x1,
    z0: r.z0 <= -h ? -e : r.z0, z1: r.z1 >= h ? e : r.z1 }));
}
function bank(r: Rect, x: number, z: number): number {
  return r.z1 - r.z0 >= r.x1 - r.x0 ? Math.min(x - r.x0, r.x1 - x) : Math.min(z - r.z0, r.z1 - z);
}
function steep(input: SceneryInput, x: number, z: number): boolean {
  const h = input.heightAt;
  if (!h) return false;
  const d = T.slopeSpanM / 2;
  // Axis and diagonal diameters, each 2 m: avoid missing a diagonal cliff.
  const a = d / Math.sqrt(2);
  return Math.max(Math.abs(h(x - d, z) - h(x + d, z)), Math.abs(h(x, z - d) - h(x, z + d)),
    Math.abs(h(x - a, z - a) - h(x + a, z + a)), Math.abs(h(x - a, z + a) - h(x + a, z - a))) > T.slopeRiseM;
}
type Segment = { ax: number; az: number; dx: number; dz: number; len2: number; half: number };
function context(input: SceneryInput) {
  const lanes = groundLanes(input.map.routes), cells = new Map<string, Segment[]>();
  for (const [l, lane] of lanes.entries()) for (let i = 0; i + 1 < lane.xs.length; i++) {
    const ax = lane.xs[i]!, az = lane.zs[i]!, bx = lane.xs[i + 1]!, bz = lane.zs[i + 1]!;
    const half = input.roadHalf?.[l] ? Math.max(input.roadHalf[l]![i]!, input.roadHalf[l]![i + 1]!) : input.map.roadHalfM * T.fallbackRoadK;
    const s = { ax, az, dx: bx - ax, dz: bz - az, len2: sq(bx - ax) + sq(bz - az), half };
    for (let ix = Math.floor((Math.min(ax, bx) - T.roadIndexReachM) / T.gridM); ix <= Math.floor((Math.max(ax, bx) + T.roadIndexReachM) / T.gridM); ix++)
      for (let iz = Math.floor((Math.min(az, bz) - T.roadIndexReachM) / T.gridM); iz <= Math.floor((Math.max(az, bz) + T.roadIndexReachM) / T.gridM); iz++) {
        const key = `${ix},${iz}`, list = cells.get(key) ?? []; list.push(s); cells.set(key, list);
      }
  }
  const road = (x: number, z: number, r: number, tall = false): boolean => {
    for (const s of cells.get(`${Math.floor(x / T.gridM)},${Math.floor(z / T.gridM)}`) ?? []) {
      const f = Math.max(0, Math.min(1, ((x - s.ax) * s.dx + (z - s.az) * s.dz) / (s.len2 || 1)));
      if (sq(x - s.ax - f * s.dx) + sq(z - s.az - f * s.dz) < sq(tall ? T.fieldTallRoadM : s.half + T.vergeM + r)) return true;
    }
    return false;
  };
  return { lanes, road, water: extended(input) };
}
/** Point buildability, excluding economy/phase/path checks and house radius. It mirrors sim terrain rules, not visual road widths. */
export function buildableAt(input: SceneryInput, x: number, z: number): boolean {
  const m = input.map;
  if (Math.max(Math.abs(x), Math.abs(z)) > m.buildHalfM) return false;
  if ([...m.water, ...m.bridges].some((r) => contains(r, x, z))) return false;
  if (sq(x - m.keep[0]) + sq(z - m.keep[1]) < sq(BUILD.keepClearM)) return false;
  if (input.houses.some((h) => gap2(h, { x, z }) < sq(h.r + BUILD.gapM))) return false;
  if (m.trees.some(([tx, tz]) => sq(tx - x) + sq(tz - z) < sq(TREE.radiusM))) return false;
  return !groundLanes(m.routes).some((l) => l.gap2(x, z) < sq(BUILD.roadClearM));
}
type Context = ReturnType<typeof context>;
function allowed(input: SceneryInput, c: Context, p: SceneryItem): boolean {
  const m = input.map, { x, z, r } = p, e = m.halfM + T.borderM;
  if (Math.max(Math.abs(x), Math.abs(z)) + r > e || c.road(x, z, r)) return false;
  if ((input.dressing ?? []).some((d) => gap2(d, p) < sq(d.r + r))) return false;
  if (m.bridges.some((b) => rectGap2(b, x, z) < sq(r))) return false;
  if (sq(x - m.keep[0]) + sq(z - m.keep[1]) < sq(T.keepYardM + T.yardSoftM + r)) return false;
  if (input.houses.some((h) => gap2(h, p) < sq(h.r + BUILD.gapM + r))) return false;
  if (m.nodes.some((n) => gap2(n, p) < sq(Math.max(T.oreMinM, T.oreBaseM + T.oreRichnessK * n.richness + T.yardSoftM) + r))) return false;
  const treeR = p.kind === "tree" || p.kind === "bamboo" || p.kind === "canopy" ? Math.max(T.treeClearM, TREE.radiusM + r) : TREE.radiusM + r;
  if (m.trees.some(([tx, tz]) => sq(tx - x) + sq(tz - z) < sq(treeR))) return false;
  if (!p.cross && Math.abs(x - m.gate[0]) <= T.gateHalfM && z <= -m.buildHalfM) return false;
  if (p.kind !== "rock" && steep(input, x, z)) return false;
  const water = c.water.find((w) => contains(w, x, z));
  if (water) {
    if ((p.type !== "reed-clump" && p.kind !== "rock") || bank(water, x, z) > T.bankM) return false;
    // A fixed foot must fit entirely inside sim-forbidden water, even by a bridge end.
    if (x - r < water.x0 || x + r > water.x1 || z - r < water.z0 || z + r > water.z1) return false;
    p.zone = "water";
  } else {
    if (c.water.some((w) => rectGap2(w, x, z) < sq(r))) return false;
    const keepD = Math.sqrt(sq(x - m.keep[0]) + sq(z - m.keep[1]));
    if (keepD <= BUILD.keepClearM) {
      if (!p.cross || keepD + r > BUILD.keepClearM) return false;
      p.zone = "keep";
    } else {
      const out = Math.max(Math.abs(x), Math.abs(z));
      p.zone = out > m.halfM ? "ring" : out > m.buildHalfM ? "band" : "field";
      if (p.zone !== "field") {
        // Exact distance to the buildable square, including rounded corner feet.
        if (sq(Math.max(Math.abs(x) - m.buildHalfM, 0)) + sq(Math.max(Math.abs(z) - m.buildHalfM, 0)) < sq(r)) return false;
      }
    }
  }
  if (p.zone === "field" && (p.kind === "tree" || p.kind === "bamboo" || p.kind === "canopy") && c.road(x, z, 0, true)) return false;
  p.clearOnBuild = p.zone === "field";
  return p.row < 0 || p.zone === "ring";
}
function weighted(mix: readonly (readonly [string, number])[], u: number): string {
  let sum = 0;
  for (const [, w] of mix) sum += w;
  let at = u * sum;
  for (const [type, w] of mix) { at -= w; if (at < 0) return type; }
  return mix[mix.length - 1]![0];
}
/** Rounded square without transcendental arithmetic; continuous across edge joins. */
function forestSpot(half: number, along: number, corner: number): { x: number; z: number; edge: number } {
  const edge = Math.floor(along / (2 * half)), t = along - edge * 2 * half - half;
  let x = edge === 0 ? t : edge === 1 ? half : edge === 2 ? -t : -half;
  let z = edge === 0 ? -half : edge === 1 ? t : edge === 2 ? half : -t;
  const inset = half - corner;
  const cx = Math.max(-inset, Math.min(inset, x)), cz = Math.max(-inset, Math.min(inset, z));
  const dx = x - cx, dz = z - cz, d = Math.sqrt(dx * dx + dz * dz);
  x = cx + dx * corner / d; z = cz + dz * corner / d;
  return { x, z, edge };
}
type Group = { items: SceneryItem[]; priority: number; order: number };
function colourGroups(items: SceneryItem[], entries: Map<string, SceneryEntry[]>, seed: number): Group[] {
  const types = new Map<string, SceneryItem[]>();
  for (const p of items) { const list = types.get(p.type) ?? []; list.push(p); types.set(p.type, list); }
  const groups: Group[] = [];
  let serial = 0;
  for (const [type, points] of types) {
    const variants = entries.get(type)!;
    const links: number[][] = points.map(() => []);
    // Exact nearest search pruned by the x distance; no spatial approximation.
    const ordered = points.map((p, index) => ({ p, index })).sort((a, b) => a.p.x - b.p.x || a.p.z - b.p.z);
    for (let at = 0; at < ordered.length; at++) {
      const { p, index } = ordered[at]!;
      let near = -1, best = Infinity;
      const visit = (candidate: { p: SceneryItem; index: number }): boolean => {
        if (sq(candidate.p.x - p.x) > best) return false;
        const d = gap2(p, candidate.p);
        if (d < best || (d === best && near >= 0 && (candidate.p.x < points[near]!.x || (candidate.p.x === points[near]!.x && candidate.p.z < points[near]!.z)))) {
          best = d; near = candidate.index;
        }
        return true;
      };
      for (let k = at - 1; k >= 0; k--) if (!visit(ordered[k]!)) break;
      for (let k = at + 1; k < ordered.length; k++) if (!visit(ordered[k]!)) break;
      if (near >= 0) { links[index]!.push(near); links[near]!.push(index); }
    }
    const colours = new Int8Array(points.length).fill(-1);
    for (let root = 0; root < points.length; root++) if (colours[root] === -1) {
      colours[root] = hash(root, fnv(type), seed) < 0.5 ? 0 : 1;
      const queue = [root], group: SceneryItem[] = [];
      for (let at = 0; at < queue.length; at++) {
        const index = queue[at]!, p = points[index]!, entry = variants[Math.min(colours[index]!, variants.length - 1)]!;
        p.sprite = entry.id; p.variant = entry.variant; p.r = FOOT[p.kind]! * entry.heightM * p.scale;
        group.push(p);
        for (const other of links[index]!) if (colours[other] === -1) { colours[other] = 1 - colours[index]!; queue.push(other); }
      }
      groups.push({ items: group, priority: Math.min(...group.map((p) => p.row >= 0 ? 0 : p.zone === "field" ? 2 : 1)), order: hash(serial++, fnv(type), seed) });
    }
  }
  groups.sort((a, b) => a.priority - b.priority || a.order - b.order);
  // Balance mirror counts for each type in every retained prefix, not just High.
  const flips = new Map<string, number>();
  for (const g of groups) for (const p of g.items) { const n = flips.get(p.type) ?? 0; p.flip = n - Math.floor(n / 2) * 2 === 0; flips.set(p.type, n + 1); }
  return groups;
}
export function sceneryLayout(input: SceneryInput, tier: SceneryTier): SceneryLayout {
  const seed = (input.seed ?? fnv(input.map.id)) >>> 0, rng = random(seed), c = context(input);
  const entries = new Map<string, SceneryEntry[]>();
  for (const s of [...input.set].sort((a, b) => compare(a.id, b.id))) {
    if (!FOOT[s.kind] || s.heightM <= 0) continue;
    const list = entries.get(s.type) ?? []; list.push(s); entries.set(s.type, list);
  }
  const catalog = new Map(SCENERY_TYPES.map(([type, kind, height]) => [type, { kind, height: Math.max(height, ...(entries.get(type) ?? []).map((e) => e.heightM)) }]));
  const large: SceneryItem[] = [], crosses: SceneryItem[] = [], grid = new Map<string, SceneryItem[]>();
  const make = (type: string, x: number, z: number, row = -1, edge = -1, slot = -1): SceneryItem => {
    const info = catalog.get(type)!;
    let growth = 1, shade = 1;
    for (let i = 0; i < row; i++) { growth *= T.forestGrowth; shade *= T.forestShade; }
    const scale = row < 0 ? T.scaleMin + T.scaleRange * rng() : growth * (T.forestJitterMin + T.forestJitterRange * rng());
    return { sprite: "", type, kind: info.kind, variant: "", x, z, r: FOOT[info.kind]! * info.height * scale,
      scale, flip: false, tint: T.tintMin + T.tintRange * rng(), shade, row, zone: "field", clearOnBuild: true,
      cross: info.kind === "grass" || info.kind === "flower", edge, slot };
  };
  for (let row = 0; row < T.forestRows; row++) {
    const half = input.map.halfM + T.forestFrontM + row * T.forestRowM;
    const count = Math.floor(8 * half / T.forestStepM), step = 8 * half / count;
    for (let slot = 0; slot < count; slot++) {
      let along = (slot + T.forestPhase + (row - Math.floor(row / 2) * 2) * T.forestStagger) * step;
      along -= Math.floor(along / (8 * half)) * 8 * half;
      const spot = forestSpot(half, along, T.forestCornerM + row * T.forestRowM);
      const type = weighted(row === 0 ? SCENERY_MIX.forestFront : SCENERY_MIX.forestBack, rng());
      const p = make(type, spot.x, spot.z, row, spot.edge, slot);
      if (allowed(input, c, p)) large.push(p);
    }
  }
  const mix = SCENERY_TYPES.filter((s) => s[3] > 0).map((s) => [s[0], s[3]] as const);
  const cluster = T.clusterMinM + T.clusterRangeM * rng();
  const active: SceneryItem[] = [];
  const tryLarge = (x: number, z: number): boolean => {
    if (Math.max(Math.abs(x), Math.abs(z)) > input.map.halfM) return false;
    if (density(x, z, seed, cluster) < T.densityCut) return false;
    const p = make(weighted(mix, rng()), x, z);
    if (!allowed(input, c, p)) return false;
    const gx = Math.floor(x / T.gridM), gz = Math.floor(z / T.gridM);
    for (let ix = gx - 1; ix <= gx + 1; ix++) for (let iz = gz - 1; iz <= gz + 1; iz++)
      for (const q of grid.get(`${ix},${iz}`) ?? []) if (gap2(p, q) < sq(T.poissonK * (p.r + q.r))) return false;
    const key = `${gx},${gz}`, list = grid.get(key) ?? []; list.push(p); grid.set(key, list);
    large.push(p); active.push(p); return true;
  };
  // Bridson active list, variable radii; integer-hashed value-noise gates the clusters.
  // Uniform reseeds allow separated clusters, rather than flooding one connected patch.
  let reseeds = 0;
  while (large.length < SCENERY_BUDGET.high.large && reseeds < T.reseedTries) {
    reseeds++;
    tryLarge((rng() * 2 - 1) * input.map.halfM, (rng() * 2 - 1) * input.map.halfM);
    if (active.length === 0) continue;
    const at = Math.floor(rng() * active.length), anchor = active[at]!;
    let found = false;
    for (let k = 0; k < T.poissonTries && large.length < SCENERY_BUDGET.high.large; k++) {
      const dx = rng() * 2 - 1, dz = rng() * 2 - 1, norm = Math.sqrt(dx * dx + dz * dz) || 1;
      const distance = (anchor.r + T.poissonCandidateFootM) * T.poissonK * (1 + rng());
      if (tryLarge(anchor.x + dx / norm * distance, anchor.z + dz / norm * distance)) found = true;
    }
    if (!found) { active[at] = active[active.length - 1]!; active.pop(); }
  }
  for (let tries = 0; crosses.length < SCENERY_BUDGET.high.cross && tries < T.crossTries; tries++) {
    const x = (rng() * 2 - 1) * input.map.halfM, z = (rng() * 2 - 1) * input.map.halfM;
    if (density(x, z, seed, cluster) < T.densityCut) continue;
    const wet = c.water.some((w) => contains(w, x, z));
    const p = make(weighted(wet ? SCENERY_MIX.crossWater : SCENERY_MIX.crossField, rng()), x, z);
    if (allowed(input, c, p)) crosses.push(p);
  }
  const groups = colourGroups([...large, ...crosses].filter((p) => entries.has(p.type)), entries, seed);
  const budget = SCENERY_BUDGET[tier], items: SceneryItem[] = [];
  let usedLarge = 0, usedCross = 0, stopLarge = false, stopCross = false;
  for (const g of groups) {
    const cross = g.items[0]!.cross;
    if (cross) {
      if (stopCross || usedCross + g.items.length > budget.cross) { stopCross = true; continue; }
      usedCross += g.items.length;
    } else {
      if (stopLarge || usedLarge + g.items.length > budget.large) { stopLarge = true; continue; }
      usedLarge += g.items.length;
    }
    items.push(...g.items);
  }
  items.sort((a, b) => compare(a.sprite, b.sprite) || a.z - b.z || a.x - b.x);
  const counts: Record<string, number> = { large: usedLarge, cross: usedCross, total: items.length };
  for (const p of items) { const key = `${p.zone}.${p.kind}`; counts[key] = (counts[key] ?? 0) + 1; }
  return { seed, tier, items, counts };
}
