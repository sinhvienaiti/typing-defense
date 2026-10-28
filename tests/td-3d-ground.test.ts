import { describe, expect, it } from "vitest";
import { SLICE_1A } from "../src/content/slice-1a";
import { groundLanes } from "../src/sim/lanes";
import { BED_M, BORDER_M, decalSpots, groundMasks, heightAt, streamX } from "../src/view/3d/ground";

/**
 * 1C step C3 (docs/td/BUILD_1C_MAP1.md §8): map 1's 3D ground lines up with the sim's map. The field is flat where the
 * sim walks; the stream's bed lies inside its rect and its water never leaves it; the road mask's edge is within 0.25 m
 * of the sim's road (roadHalfM from groundLanes); the stone yard covers the Fort's ring; decals keep the decor rules.
 * Node only: the masks are plain bytes.
 */
const map = SLICE_1A.map;
const lanes = groundLanes(map.routes);
const { mask, extent, size } = groundMasks(map, lanes);
/** A mask channel at a ground point, sampled bilinearly as the GPU does, 0–1. */
function sample(channel: number, x: number, z: number): number {
  const fx = ((x + extent) / (2 * extent)) * size - 0.5;
  const fz = ((z + extent) / (2 * extent)) * size - 0.5;
  const [c0, r0] = [Math.floor(fx), Math.floor(fz)];
  const [tx, tz] = [fx - c0, fz - r0];
  const at = (c: number, r: number) => mask[(Math.min(size - 1, Math.max(0, r)) * size + Math.min(size - 1, Math.max(0, c))) * 4 + channel]! / 255;
  return (at(c0, r0) * (1 - tx) + at(c0 + 1, r0) * tx) * (1 - tz) + (at(c0, r0 + 1) * (1 - tx) + at(c0 + 1, r0 + 1) * tx) * tz;
}

describe("map 1's 3D ground (src/view/3d/ground.ts)", () => {
  it("is flat where the sim walks, rises in the border and stands as a cliff at the stream's head", () => {
    for (const [x, z] of [map.keep, map.gate, [0, 0], [30, -30], [-40, 40], ...map.trees.slice(0, 8)] as [number, number][]) expect(Math.abs(heightAt(map, x, z))).toBeLessThan(1e-9);
    expect(heightAt(map, map.halfM + BORDER_M - 1, map.halfM + BORDER_M - 1)).toBeGreaterThan(2);
    expect(heightAt(map, map.halfM + 20, -6)).toBeGreaterThan(6); // Đồi Cầu Vồng
    const stream = map.water[0]!;
    expect(heightAt(map, (stream.x0 + stream.x1) / 2 + 9, -map.halfM - 14)).toBeGreaterThan(8); // Thác Bạc's cliff beside the falls
  });

  it("keeps the stream's water and bed inside its rect, the banks walkable beside it", () => {
    for (const rect of map.water) {
      const half = (rect.x1 - rect.x0) / 2 - 0.35;
      for (let z = rect.z0; z <= rect.z1; z += 0.5) {
        const x = streamX(rect, z);
        expect(x - half).toBeGreaterThanOrEqual(rect.x0 - 1e-9);
        expect(x + half).toBeLessThanOrEqual(rect.x1 + 1e-9);
        expect(heightAt(map, x, z)).toBeLessThanOrEqual(BED_M + 0.15);
        for (const side of [rect.x0 - 0.3, rect.x1 + 0.3]) expect(heightAt(map, side, z)).toBeGreaterThan(-0.1);
        for (const side of [rect.x0 - 1.5, rect.x1 + 1.5]) expect(Math.abs(heightAt(map, side, z))).toBeLessThan(1e-6);
      }
    }
  });

  it("paints the road where the sim's road is: its edge within 0.25 m of roadHalfM all along every lane", () => {
    let worst = 0;
    let checked = 0;
    for (const lane of lanes) {
      for (let i = 10; i + 1 < lane.xs.length - 10; i += 11) {
        const [x, z] = [lane.xs[i]!, lane.zs[i]!];
        const [dx, dz] = [lane.xs[i + 1]! - x, lane.zs[i + 1]! - z];
        const [nx, nz] = [-dz / Math.hypot(dx, dz), dx / Math.hypot(dx, dz)];
        expect(sample(0, x, z)).toBeGreaterThan(0.9);
        for (const side of [1, -1]) {
          let edge = 0;
          for (let d = 0; d < map.roadHalfM + 2; d += 0.02) {
            if (sample(0, x + nx * d * side, z + nz * d * side) < 0.5) {
              edge = d;
              break;
            }
          }
          // Where two lanes run close (the fork), the edge is the other lane's: skip those points.
          const otherNear = lanes.some((other) => other !== lane && other.xs.some((ox, j) => Math.hypot(ox - (x + nx * edge * side), other.zs[j]! - (z + nz * edge * side)) < map.roadHalfM + 0.5));
          if (otherNear) continue;
          worst = Math.max(worst, Math.abs(edge - map.roadHalfM));
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThan(40);
    expect(worst).toBeLessThan(0.25);
  });

  it("lays the stone yard over the Fort's ring and the ore, the bank along the stream", () => {
    const [kx, kz] = map.keep;
    for (const [dx, dz] of [[0, 0], [5, 0], [0, -6], [-4.5, 4]] as const) expect(sample(2, kx + dx, kz + dz)).toBeGreaterThan(0.95);
    expect(sample(2, kx + 10, kz - 10)).toBeLessThan(0.05);
    for (const node of map.nodes) expect(sample(2, node.x, node.z)).toBeGreaterThan(0.95);
    const rect = map.water[0]!;
    expect(sample(1, rect.x1 + 0.5, 0)).toBeGreaterThan(0.5);
    expect(sample(1, rect.x1 + 2, 0)).toBeLessThan(0.05);
  });

  it("puts decals by the decor rules: flowers and clover off the roads and the water, the right cells, 4 m or so", () => {
    const spots = decalSpots(map, lanes);
    expect(spots.length).toBeGreaterThan(45);
    expect(spots.length).toBeLessThan(100);
    for (const [x, z, sheet, cell, , metres] of spots) {
      expect([0, 1]).toContain(sheet);
      expect(cell).toBeGreaterThanOrEqual(0);
      expect(cell).toBeLessThan(8);
      expect(metres).toBeGreaterThan(1.5);
      expect(metres).toBeLessThan(7);
      if (sheet === 1 && [0, 1, 7].includes(cell)) {
        expect(sample(0, x, z)).toBeLessThan(0.01);
        expect(map.water.some((r) => x > r.x0 - 1 && x < r.x1 + 1)).toBe(false);
      }
    }
    expect(decalSpots(map, lanes)).toEqual(spots); // the same on every load
  });
});
