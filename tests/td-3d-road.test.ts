import { describe, expect, it } from "vitest";
import { SLICE_1A } from "../src/content/slice-1a";
import { groundLanes } from "../src/sim/lanes";
import { BORDER_M } from "../src/view/3d/ground";
import { roadField } from "../src/view/3d/road";

/**
 * C10 (docs/games/PATH_QUALITY.md §2, §4): map 1's roads from the sim's lanes. The half width wanders ±10–20 % and grows
 * at bends and junctions; the field puts the road where the lanes are (distance across ≈ 0 on a lane); the dressing is
 * seeded (the same each load), off every road, the water, the bridges and the yards, every 2–6 m along a road.
 */
const map = SLICE_1A.map;
const lanes = groundLanes(map.routes); // the 3D view draws w.lanes without the fly route the world adds: these
const extent = map.halfM + BORDER_M;
const road = roadField(map, lanes, extent, 256);

describe("C10: map 1's road field and dressing", () => {
  it("varies the half width by 10–20 % along each lane, wider at bends and junctions", () => {
    for (const w of road.widths) {
      const [lo, hi] = [Math.min(...w), Math.max(...w)];
      expect(lo).toBeGreaterThan(map.roadHalfM * 0.84);
      expect(hi).toBeLessThan(map.roadHalfM * 1.75);
      expect((hi - lo) / map.roadHalfM).toBeGreaterThan(0.1);
    }
    expect(road.junctions.length).toBeGreaterThan(0);
    expect(road.bends.length).toBeGreaterThan(0);
  });

  it("puts the road on the lanes: the distance across is near 0 on a lane point", () => {
    const px = (2 * extent) / road.size;
    for (const lane of lanes) {
      for (let i = 20; i < lane.xs.length - 20; i += 37) {
        const [col, row] = [Math.floor((lane.xs[i]! + extent) / px), Math.floor((lane.zs[i]! + extent) / px)];
        expect(Math.abs(road.field[(row * road.size + col) * 4 + 2]!)).toBeLessThan(px);
      }
    }
  });

  it("dresses the edges off the roads, the water, the bridges and the yards, the same on every load", () => {
    expect(roadField(map, lanes, extent, 256).dressing).toEqual(road.dressing);
    expect(road.dressing.filter((d) => d.kind === "stones").length).toBeGreaterThan(30);
    expect(road.dressing.some((d) => d.kind === "terrace")).toBe(true);
    for (const d of road.dressing) {
      for (const [l, lane] of lanes.entries()) lane.xs.forEach((x, i) => expect(Math.hypot(x - d.x, lane.zs[i]! - d.z)).toBeGreaterThan(road.widths[l]![i]! + 0.3));
      for (const r of [...map.water, ...map.bridges]) expect(d.x > r.x0 - 2 && d.x < r.x1 + 2 && d.z > r.z0 - 2 && d.z < r.z1 + 2).toBe(false);
      expect(Math.hypot(d.x - map.keep[0], d.z - map.keep[1])).toBeGreaterThan(9);
    }
  });
});
