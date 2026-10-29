/**
 * Map 1's roads (docs/games/PATH_QUALITY.md; the owner, 29/10: no "finger smear"). The road is no painted band any more:
 * a field baked from the sim's lanes gives the ground shader (ground.ts) each point's distance across the road, its
 * distance along it and the road's half width there, so the road's material runs along the road at one texel density,
 * bends and all (§2.1); the shader cuts a core, a worn verge 0.3–0.8 m wide and the grass with noisy edges (§2.2), sinks
 * the core 5 cm under a lit and shaded lip (§2.4) and lays a paved plaza on junctions. The half width wanders ±14 %
 * along the road and grows at bends (+20 %) and junctions (+30 %) (§2.3). Dressing (§2.5), seeded: limestone curb stones
 * (props/da-ke) every 2–6 m on the verge, clustered on the outside of bends and paired at the bridge ends, a white stone
 * terrace (landmarks/them-da-trang) beside each junction. The sim's lanes, build spots and goldens do not change.
 * Textures by role from road.json (core, verge, plaza, edge decals): Codex 122's road-paved and 123's sheet c swap in
 * there once accepted. Pure parts (the field, the spots) take no DOM, for the tests.
 */
import * as THREE from "three";
import type { MapDef } from "../../content/types";
import { loadModel, ModelLibrary } from "../../kit/three/model-loader";
import type { Lane } from "../../sim/lanes";
import type { World } from "../../sim/world";
import { relight, type Tier3D } from "./stage";

/** The material's repeat along and across the road, m. */
export const ROAD_TILE_M = 8;
/** How far from a lane the field reaches, m (past the widest verge). */
const REACH_M = 5.5;
const SHARED_M = 0.4;

const hash = (a: number, b: number): number => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Smooth 1D value noise in [0, 1). */
const noise1 = (t: number, seed: number): number => {
  const i = Math.floor(t);
  const f = t - i;
  return hash(i, seed) + (hash(i + 1, seed) - hash(i, seed)) * f * f * (3 - 2 * f);
};
const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/** A dressing spot: curb stones or a terrace, at x, z, turned `yaw`, at `scale`. */
export type Dress = { kind: "stones" | "terrace"; x: number; z: number; yaw: number; scale: number };
export type RoadField = {
  /** Per texel: cos and sin of the distance along the road (period ROAD_TILE_M), the signed distance across, the half width. */
  field: Float32Array;
  /** Per texel: the junction plaza (0–255) in red. */
  plaza: Uint8Array;
  size: number;
  extent: number;
  junctions: [number, number][];
  bends: [number, number][];
  dressing: Dress[];
  /** Road-edge decal spots (Codex 123 sheet c, once accepted): [x, z, sheet 2, cell 0–7, turn, metres]. */
  edges: [number, number, number, number, number, number][];
  /** Half widths along each lane (every lane point), for the tests. */
  widths: Float32Array[];
};

/** The road field over [−extent, extent]², `size` px a side, and the dressing, for the lanes the ground draws. */
export function roadField(map: MapDef, lanes: readonly Lane[], extent: number, size = 512): RoadField {
  const step = lanes.map((l) => l.length / (l.xs.length - 1));
  // A lane point is its own where no earlier lane runs within 0.4 m (a shared stretch is drawn once, by the first lane).
  const own = lanes.map((lane, l) => Array.from(lane.xs, (x, i) => !lanes.slice(0, l).some((o) => o.xs.some((ox, j) => (ox - x) ** 2 + (o.zs[j]! - lane.zs[i]!) ** 2 < SHARED_M ** 2))));
  const junctions: [number, number][] = [];
  own.forEach((flags, l) => flags.forEach((f, i) => {
    if (l === 0 || i === 0 || f === flags[i - 1]) return;
    const [x, z] = [lanes[l]!.xs[i]!, lanes[l]!.zs[i]!];
    if (!junctions.some(([jx, jz]) => (jx - x) ** 2 + (jz - z) ** 2 < 16)) junctions.push([x, z]);
  }));
  const heading = (lane: Lane, at: number): number => {
    const [a, b] = [Math.min(lane.xs.length - 2, Math.max(0, at - 1)), Math.min(lane.xs.length - 1, Math.max(1, at + 1))];
    return Math.atan2(lane.zs[b]! - lane.zs[a]!, lane.xs[b]! - lane.xs[a]!);
  };
  // Bendiness: the heading's turn over ±3 m (0 straight, 1 from 0.6 rad).
  const bend = lanes.map((lane, l) => Array.from(lane.xs, (_, i) => Math.min(1, Math.abs(wrap(heading(lane, i + Math.round(3 / step[l]!)) - heading(lane, i - Math.round(3 / step[l]!)))) / 0.6)));
  const near = (x: number, z: number): number => Math.min(99, ...junctions.map(([jx, jz]) => Math.hypot(jx - x, jz - z)));
  const widths = lanes.map((lane, l) => Float32Array.from(lane.xs, (x, i) => map.roadHalfM * (1 + 0.28 * (noise1((i * step[l]!) / 9, l * 17 + 3) - 0.5)) * (1 + 0.2 * bend[l]![i]!) * (1 + 0.3 * smooth(7, 0, near(x, lane.zs[i]!)))));

  const px = (2 * extent) / size;
  const best = new Float32Array(size * size).fill(Infinity);
  const field = new Float32Array(size * size * 4);
  for (let k = 0; k < size * size; k += 1) field.set([1, 0, 99, map.roadHalfM], k * 4);
  const at = (m: number): number => Math.floor((m + extent) / px);
  lanes.forEach((lane, l) => {
    for (let i = 0; i + 1 < lane.xs.length; i += 1) {
      if (!own[l]![i] && !own[l]![i + 1]) continue;
      const [ax, az, bx, bz] = [lane.xs[i]!, lane.zs[i]!, lane.xs[i + 1]!, lane.zs[i + 1]!];
      const [dx, dz] = [bx - ax, bz - az];
      const len2 = dx * dx + dz * dz || 1;
      for (let row = Math.max(0, at(Math.min(az, bz) - REACH_M)); row <= Math.min(size - 1, at(Math.max(az, bz) + REACH_M)); row += 1) {
        for (let col = Math.max(0, at(Math.min(ax, bx) - REACH_M)); col <= Math.min(size - 1, at(Math.max(ax, bx) + REACH_M)); col += 1) {
          const [x, z] = [(col + 0.5) * px - extent, (row + 0.5) * px - extent];
          const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / len2));
          const [ox, oz] = [x - ax - t * dx, z - az - t * dz];
          const d = Math.sqrt(ox * ox + oz * oz);
          const k = row * size + col;
          if (d >= best[k]! || d > REACH_M) continue;
          best[k] = d;
          const s = ((i + t) * step[l]! * 2 * Math.PI) / ROAD_TILE_M;
          field.set([Math.cos(s), Math.sin(s), Math.sign(dx * oz - dz * ox) * d, widths[l]![i]! + (widths[l]![i + 1]! - widths[l]![i]!) * t], k * 4);
        }
      }
    }
  });
  const plaza = new Uint8Array(size * size * 4);
  for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) plaza[(row * size + col) * 4] = 255 * smooth(6.5, 3, near((col + 0.5) * px - extent, (row + 0.5) * px - extent));

  // Dressing, seeded: off the road, the water, the bridges, the Fort's and the ore's yards, and inside the field.
  const dressing: Dress[] = [];
  const edges: RoadField["edges"] = [];
  const wet = (x: number, z: number, m: number): boolean => [...map.water, ...map.bridges].some((r) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m);
  const yard = (x: number, z: number): boolean => Math.hypot(x - map.keep[0], z - map.keep[1]) < 9.5 || map.nodes.some((n) => Math.hypot(n.x - x, n.z - z) < 4.5);
  const offRoad = (x: number, z: number, m: number): boolean => lanes.every((lane, l) => lane.xs.every((lx, i) => (lx - x) ** 2 + (lane.zs[i]! - z) ** 2 > (widths[l]![i]! + m) ** 2));
  const free = (x: number, z: number): boolean => Math.max(Math.abs(x), Math.abs(z)) < map.halfM - 1 && !wet(x, z, 2.5) && !yard(x, z) && offRoad(x, z, 0.35);
  const put = (kind: Dress["kind"], x: number, z: number, yaw: number, scale: number): void => void (free(x, z) && dressing.push({ kind, x, z, yaw, scale }));
  lanes.forEach((lane, l) => {
    const n = lane.xs.length;
    for (let s = 3 + 3 * hash(l, 1); s < lane.length - 3; s += 2 + 3 * hash(s, l + 5)) {
      const i = Math.round(s / step[l]!);
      if (!own[l]![i] || near(lane.xs[i]!, lane.zs[i]!) < 6) continue;
      const th = heading(lane, i);
      const turn = wrap(heading(lane, Math.min(n - 1, i + 8)) - heading(lane, Math.max(0, i - 8)));
      // On a bend the stones gather on its outside; on a straight they alternate.
      const side = bend[l]![i]! > 0.35 ? -Math.sign(turn) || 1 : hash(i, l) < 0.5 ? 1 : -1;
      const off = widths[l]![i]! + 0.4 + 0.25 * hash(i, 9); // on the verge, at the core's lip (L3: a metre out they read as loose blocks)
      const [x, z] = [lane.xs[i]! - Math.sin(th) * off * side, lane.zs[i]! + Math.cos(th) * off * side];
      if (bend[l]![i]! > 0.35 || hash(i, l + 11) < 0.85) put("stones", x, z, -th + (hash(i, 3) - 0.5) * 0.5, 0.5 + 0.25 * hash(i, 4) + 0.15 * bend[l]![i]!);
      const e = widths[l]![i]! + 0.2;
      for (const k of [1, -1]) edges.push([lane.xs[i]! - Math.sin(th) * e * k, lane.zs[i]! + Math.cos(th) * e * k, 2, Math.floor(hash(i, k + l) * 8), -th, 1.6 + 0.8 * hash(i, 6)]);
    }
  });
  for (const [jx, jz] of junctions) {
    for (let a = 0; a < 8; a += 1) { // the terrace on the first free side of the junction
      const [x, z] = [jx + Math.cos(a * 0.785) * 6.5, jz + Math.sin(a * 0.785) * 6.5];
      if (!free(x, z) || !offRoad(x, z, 2.2)) continue;
      put("terrace", x, z, a * 0.785, 0.9);
      break;
    }
  }
  for (const r of map.bridges) for (const x of [r.x0 - 2.2, r.x1 + 2.2]) for (const dz of [-2.6, 2.6]) put("stones", x, (r.z0 + r.z1) / 2 + dz, Math.PI / 2, 0.55);
  const bends: [number, number][] = [];
  lanes.forEach((lane, l) => lane.xs.forEach((x, i) => bend[l]![i]! > 0.8 && own[l]![i] && !bends.some(([bx, bz]) => Math.hypot(bx - x, bz - lane.zs[i]!) < 10) && bends.push([x, lane.zs[i]!])));
  return { field, plaza, size, extent, junctions, bends, dressing, edges, widths };
}

/** The dressing's models, one instanced mesh per model mesh (no shadows: a low curb's drew a dark rim); hidden under any house. */
export class RoadDressing {
  private readonly meshes: { kind: Dress["kind"]; mesh: THREE.InstancedMesh; spots: Dress[]; high: number }[] = [];
  private readonly matrix = new THREE.Matrix4();
  private frame = 0;

  constructor(private readonly layer: THREE.Group, private readonly dressing: readonly Dress[], private readonly heightAt: (x: number, z: number) => number, tier: Tier3D) {
    const library = new ModelLibrary({ manifests: "/assets/typing-defense/models/manifest.json", kinds: ["props", "landmarks"] });
    const models: [Dress["kind"], string, string][] = [["stones", "props", "da-ke"], ["terrace", "landmarks", "them-da-trang"]];
    for (const [kind, folder, id] of models) {
      const spots = dressing.filter((d) => d.kind === kind);
      if (spots.length === 0) continue;
      void library.url(folder, id, tier).then((url) => (url === null ? null : loadModel(url))).then((gltf) => {
        if (!gltf) return;
        relight(gltf.scene);
        gltf.scene.updateMatrixWorld(true);
        const high = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3()).y;
        gltf.scene.traverse((o) => {
          const source = o as THREE.Mesh;
          if (!source.isMesh) return;
          const mesh = new THREE.InstancedMesh(source.geometry, source.material, spots.length);
          for (const m of [source.material].flat()) {
            if ("color" in m) (m.color as THREE.Color).multiplyScalar(kind === "stones" ? 1.05 : 1.3); // pale limestone, as the Fort's
            // The curb's dark mortar box read as a black outline at the play camera (L3): its darks lifted to warm stone.
            if (kind === "stones") {
              const relit = m.onBeforeCompile.bind(m);
              m.onBeforeCompile = (shader, renderer) => {
                relit(shader, renderer);
                // The model's dark mortar side faces away from every light and read as a black line at the play camera (L3):
                // its albedo floored to stone and a little of it as its own light, so no face of the curb goes black.
                shader.fragmentShader = shader.fragmentShader
                  .replace("#include <map_fragment>", "#include <map_fragment>\n  diffuseColor.rgb = max(diffuseColor.rgb, vec3(0.34, 0.31, 0.26));")
                  .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance += diffuseColor.rgb * 0.38;");
              };
            }
          }
          mesh.geometry.applyMatrix4(source.matrixWorld);
          [mesh.castShadow, mesh.receiveShadow] = [false, true]; // a low curb's shadow drew the dark rim (L3)
          mesh.userData["noAO"] = kind === "stones"; // nor the AO (stage.ts)
          this.meshes.push({ kind, mesh, spots, high });
          this.place(mesh, spots, null, high);
          this.layer.add(mesh);
        });
      }, () => undefined);
    }
  }

  private place(mesh: THREE.InstancedMesh, spots: readonly Dress[], w: World | null, high: number): void {
    const B = w?.buildings;
    spots.forEach((d, i) => {
      const under = B !== undefined && B.live().some((b) => Math.hypot(B.x[b]! - d.x, B.z[b]! - d.z) < w!.c.buildings[B.def[b]!]!.radius + 0.8);
      const s = under ? 0 : d.scale;
      // The curb: longer along the road, low, and set 60 % into the ground so only its stones' crowns show over the verge
      // (its dark base and the ambient occlusion where its side met the grass read as a black outline, L3).
      const size = d.kind === "stones" ? new THREE.Vector3(1.5 * s, 0.9 * s, 1.15 * s) : new THREE.Vector3(s, s, s);
      const sink = d.kind === "stones" ? 0.6 * high * size.y : 0.05;
      mesh.setMatrixAt(i, this.matrix.compose(new THREE.Vector3(d.x, this.heightAt(d.x, d.z) - sink, d.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), d.yaw), size));
    });
    mesh.instanceMatrix.needsUpdate = true;
  }

  /** Every 20 frames: stones and terraces under a house (built since) hide. */
  update(w: World): void {
    if ((this.frame += 1) % 20 === 0) for (const m of this.meshes) this.place(m.mesh, m.spots, w, m.high);
  }

  count(): number {
    return this.meshes.length;
  }
}
