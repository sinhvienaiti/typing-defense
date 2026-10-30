import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { SLICE_1A } from "../src/content/slice-1a";
import { BUILD } from "../src/content/rules";
import { groundLanes } from "../src/sim/lanes";
import { BORDER_M, heightAt } from "../src/view/3d/ground";
import { roadField } from "../src/view/3d/road";
import { buildableAt, sceneryLayout, SCENERY_BUDGET, type SceneryEntry, type SceneryInput, type SceneryTier } from "../src/view/3d/scenery-layout";
import { inspectLayout } from "../scripts/td/scenery-layout-sheet";

// Independent of the live set: ticket 199 metadata must not change this golden.
const SAMPLE: readonly [string, string, number, number][] = [
  ["almond-tree", "tree", 18, 14], ["mountain-pine", "tree", 14, 10],
  ["bamboo-clump", "bamboo", 16, 16], ["canopy-block", "canopy", 10, 14],
  ["fern", "bush", 2.3, 1.5], ["reed-clump", "grass", 3, 2.2],
  ["tall-grass", "grass", 2.5, 1.7], ["wildflowers", "flower", 1, 0.8],
  ["raspberry-bush", "bush", 1.8, 1.2], ["rock-medium", "rock", 3.4, 2.561141],
  ["rock-small", "rock", 0.664719, 0.594675], ["rotten-log", "log", 2.368047, 2.462413],
  ["tree-stump", "stump", 2.3, 1.465127],
];
const sample: SceneryEntry[] = SAMPLE.flatMap(([type, kind, a, b]) => [a, b].map((heightM, i) => ({ id: `${type}-v${i + 3}`, type, kind, variant: `v${i + 3}`, heightM })));
const map = SLICE_1A.map, lanes = groundLanes(map.routes);
const road = roadField(map, lanes, map.halfM + BORDER_M);
const base = {
  map,
  houses: (map.preset ?? []).map(([id, x, z]) => ({ x, z, r: BUILD.footprintR[SLICE_1A.buildings.find((b) => b.id === id)!.footprint] })),
  roadHalf: road.widths,
  dressing: road.dressing.map((d) => ({ x: d.x, z: d.z, r: (d.kind === "stones" ? 1 : 3) * d.scale })),
  heightAt: (x: number, z: number) => heightAt(map, x, z),
};
const input: SceneryInput = { ...base, set: sample };
const tiers: SceneryTier[] = ["low", "medium", "high"];
const setPath = new URL("../scripts/td/scenery-set.json", import.meta.url);
const real = existsSync(setPath) ? JSON.parse(readFileSync(setPath, "utf8")) as (SceneryEntry & { accepted: boolean })[] : undefined;
const goldenPath = new URL("./golden/td-scenery-layout.json", import.meta.url);
function hash(items: ReturnType<typeof sceneryLayout>["items"]): string {
  const json = JSON.stringify(items.map((p) => ({ ...p, x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100,
    r: Math.round(p.r * 100) / 100, scale: Math.round(p.scale * 1000) / 1000, tint: Math.round(p.tint * 1000) / 1000, shade: Math.round(p.shade * 1000) / 1000 })));
  let h = 2166136261;
  for (let j = 0; j < json.length; j++) h = Math.imul(h ^ json.charCodeAt(j), 16777619) >>> 0;
  return h.toString(16).padStart(8, "0");
}
function freeze<T>(v: T): T {
  // ECMAScript forbids freezing nonempty typed arrays; snapshot their bytes below.
  if (v && typeof v === "object" && !ArrayBuffer.isView(v)) { Object.values(v).forEach(freeze); Object.freeze(v); }
  return v;
}
describe("202: pure seeded scenery layout", () => {
  it("has only permitted imports and arithmetic", () => {
    const source = readFileSync(new URL("../src/view/3d/scenery-layout.ts", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    const imports = [...source.matchAll(/(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    expect(imports.length).toBeGreaterThan(0);
    expect(imports.every((p) => ["../../sim/lanes", "../../content/rules", "../../content/types"].includes(p!))).toBe(true);
    expect(source).not.toMatch(/\b(?:Date|performance)\b|Math\.(?:random|sin|cos|atan2|exp|pow|hypot|ceil)\b|\*\*/);
    expect(source).not.toMatch(/\b(?:three|require|fetch)\b/);
  });
  it("is deterministic, seed sensitive, sorted, and preserves frozen inputs", () => {
    const frozen = freeze({ ...structuredClone({ ...base, heightAt: undefined, set: sample }), heightAt: base.heightAt });
    const before = JSON.stringify(frozen), a = sceneryLayout(frozen, "high");
    expect(sceneryLayout(frozen, "high")).toEqual(a);
    expect(hash(sceneryLayout({ ...frozen, seed: 1 }, "high").items)).not.toBe(hash(a.items));
    expect(JSON.stringify(frozen)).toBe(before);
    expect(a.items).toEqual([...a.items].sort((a, b) => a.sprite < b.sprite ? -1 : a.sprite > b.sprite ? 1 : a.z - b.z || a.x - b.x));
  });
  it("matches nine sample-only FNV-1a goldens", () => {
    const actual = Object.fromEntries([undefined, 1, 20261030].map((seed) => [seed ?? "default", Object.fromEntries(tiers.map((tier) => [tier, hash(sceneryLayout({ ...input, seed }, tier).items)]))]));
    if (process.env.UPDATE_SCENERY_GOLDEN === "1") writeFileSync(goldenPath, JSON.stringify(actual, null, 2) + "\n");
    expect(actual).toEqual(JSON.parse(readFileSync(goldenPath, "utf8")));
  });
  it("has a conservative road fallback and never substitutes missing types", () => {
    const fallback = { ...input, roadHalf: undefined };
    expect(inspectLayout(fallback, sceneryLayout(fallback, "high")).forbidden.road).toBe(0);
    const only = sceneryLayout({ ...input, set: sample.filter((s) => s.kind === "tree") }, "high");
    expect(only.items.every((s) => s.kind === "tree")).toBe(true);
    expect(only.items.length).toBeLessThan(sceneryLayout(input, "high").items.length);
    expect(sceneryLayout({ ...input, set: [] }, "high").items).toEqual([]);
  });
});
function suite(name: string, set: readonly SceneryEntry[], seeds: readonly (number | undefined)[], clustering: boolean) {
  describe(name, () => {
    for (const seed of seeds) {
      const i = { ...input, set, seed }, layouts = tiers.map((tier) => sceneryLayout(i, tier));
      it(`seed ${seed ?? "default"}: budgets and exact nested subsets`, () => {
        for (const [n, l] of layouts.entries()) {
          expect(l.items.length).toBeGreaterThan(0);
          expect(l.items.filter((p) => !p.cross).length).toBeLessThanOrEqual(SCENERY_BUDGET[l.tier].large);
          expect(l.items.filter((p) => p.cross).length).toBeLessThanOrEqual(SCENERY_BUDGET[l.tier].cross);
          if (n > 0) { const higher = new Set(l.items.map((p) => JSON.stringify(p)));
            expect(layouts[n - 1]!.items.every((p) => higher.has(JSON.stringify(p)))).toBe(true);
            expect(l.items.length).toBeGreaterThanOrEqual(layouts[n - 1]!.items.length);
          }
        }
      });
      for (const l of layouts) {
        const s = inspectLayout(i, l);
        it(`seed ${seed ?? "default"}, ${l.tier}: fixed footprints agree with sim`, () => {
          expect(s.fixedOnBuildable).toBe(0); expect(s.simAccepted).toBe(0); expect(s.simControl).toBe(true);
          if (set.some((entry) => entry.kind === "rock")) expect(s.simPoints).toBeGreaterThan(0);
          expect(l.items.filter((p) => p.zone === "field").every((p) => p.clearOnBuild)).toBe(true);
          expect(buildableAt(i, 35, 15)).toBe(true);
        });
        it(`seed ${seed ?? "default"}, ${l.tier}: exclusions, trees, spacing`, () => {
          expect(Object.values(s.forbidden).every((n) => n === 0), JSON.stringify(s.forbidden)).toBe(true);
          expect(s.treeDistance).toBeGreaterThanOrEqual(4 - 1e-9); expect(s.spacingRatio).toBeGreaterThanOrEqual(0.8 - 1e-9);
        });
        it(`seed ${seed ?? "default"}, ${l.tier}: variants and variation`, () => {
          expect(s.sameVariant).toBe(0); expect(s.badScale).toBe(0); expect(s.badTint).toBe(0);
          for (const f of Object.values(s.flips)) if (f.count >= 20) { expect(f.ratio).toBeGreaterThanOrEqual(0.4); expect(f.ratio).toBeLessThanOrEqual(0.6); }
        });
        it(`seed ${seed ?? "default"}, ${l.tier}: forest rows, growth, shade, gaps`, () => {
          expect(s.forest.badZone).toBe(0); expect(s.forest.badShade).toBe(0);
          for (const n of s.forest.rowsPerEdge) { expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(4); }
          for (const r of s.forest.scaleRatios) expect(r).toBeGreaterThanOrEqual(1.05);
          expect(s.forest.unexplainedGaps).toBe(0);
          expect(s.forest.frontDistanceRangeM[0]).toBeGreaterThanOrEqual(2);
          expect(s.forest.frontDistanceRangeM[1]).toBeLessThanOrEqual(6);
          for (const gap of s.forest.rowSpacingM) { expect(gap).toBeGreaterThanOrEqual(5); expect(gap).toBeLessThanOrEqual(9); }
        });
        if (clustering && l.tier === "high") it(`seed ${seed ?? "default"}: clustered field VMR`, () => expect(s.vmr).toBeGreaterThanOrEqual(1.5));
      }
    }
  });
}
suite("sample 26 entries", sample, [undefined, 1, 20261030], true);
describe.skipIf(!real)("real set (skipped only if ticket 199 set is absent)", () => {
  if (real) { suite("accepted", real.filter((s) => s.accepted), [undefined], false); suite("all", real, [undefined], false); }
  it("resolves every accepted layout sprite against ticket 199's runtime manifest", () => {
    const accepted = real!.filter((s) => s.accepted);
    const manifest = JSON.parse(readFileSync(new URL("../public/assets/typing-defense/scenery/manifest.json", import.meta.url), "utf8")) as { sprites: SceneryEntry[] };
    const metadata = ({ id, type, variant, kind, heightM }: SceneryEntry) => ({ id, type, variant, kind, heightM });
    const byId = (a: SceneryEntry, b: SceneryEntry) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    expect(manifest.sprites.map(metadata).sort(byId)).toEqual(accepted.map(metadata).sort(byId));
    const ids = new Set(manifest.sprites.map((s) => s.id));
    for (const tier of tiers) expect(sceneryLayout({ ...input, set: accepted }, tier).items.every((p) => ids.has(p.sprite))).toBe(true);
  });
});
