/**
 * Map 1's ground (1C step C3, docs/td/BUILD_1C_MAP1.md §8; MAP_FACTORY §8.1, decor rules §6.4): the 96 m field and a
 * 40 m border as one heightfield (flat where the sim walks; the stream's bed; the border rising to Đồi Cầu Vồng in the
 * east and the cliff of Thác Bạc at the stream's head, outside the field), painted by a shader that tiles Codex 095's
 * meadow tiles (8 m) through masks baked from the sim's map: roads along groundLanes with worn edges and ruts turned with
 * the road, the stream's banks, the stone yard round the Fort and the ore. The stream winds a little inside its rect;
 * the two Wooden Bridges (props/cau-go) sit on the bridge rects; Codex 097's decals lie by the decor rules (flowers and
 * clover in the grass, pebbles by the road, worn earth at the gate and the Fort; soil and leaves come with the trees, C7).
 * Missing tiles keep flat colours. Pure parts (heights, masks, decal spots) take no DOM, for the tests.
 * C10 (PATH_QUALITY.md): the roads come from road.ts's field, not the road mask: material along the road, a core, a worn
 * verge and grass with noisy edges, the core sunk under a lit lip, plazas on junctions; road.ts dresses their edges.
 */
import * as THREE from "three";
import type { MapDef } from "../../content/types";
import { loadModel, ModelLibrary } from "../../kit/three/model-loader";
import type { Lane } from "../../sim/lanes";
import type { World } from "../../sim/world";
import { RoadDressing, roadField, ROAD_TILE_M } from "./road";
import ROAD from "./road.json";
import { relight, type Tier3D } from "./stage";

/** The border round the field, m (BUILD_1C_MAP1 §8 C3), the masks' size and a tile's size. */
export const BORDER_M = 40;
const MASK_PX = 512;
const TILE_M = 8;
const FADE = { road: 0.5, worn: 1.6, bank: 1.3, yard: 1.5 } as const;
export const BED_M = -0.55;
const WATER_Y = -0.18;

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** A seeded hash in [0, 1): the same ground on every load. */
const hash = (x: number, z: number): number => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const bump = (x: number, z: number, cx: number, cz: number, r: number, h: number): number => h * smooth(r, 0, Math.sqrt((x - cx) ** 2 + (z - cz) ** 2));

/** Where the stream's water runs: its rect's middle, winding ±0.35 m. */
export const streamX = (rect: { x0: number; x1: number }, z: number): number => (rect.x0 + rect.x1) / 2 + 0.35 * Math.sin(z * 0.11 + 0.6);

/** Ground height, m: 0 on the field (where the sim walks), the stream's bed, the border rising, the hill and the cliff. */
export function heightAt(map: MapDef, x: number, z: number): number {
  const h = map.halfM;
  const out = Math.max(Math.abs(x), Math.abs(z)) - h;
  if (out <= 0 && !map.water.some((r) => x > r.x0 - 1 && x < r.x1 + 1)) return 0;
  const rim = smooth(0, 8, out); // nothing rises on the field itself
  let y = out <= 0 ? 0 : 4.5 * smooth(0, BORDER_M, out) ** 1.4 + 0.8 * (hash(Math.round(x / 6), Math.round(z / 6)) - 0.5) * smooth(0, 10, out);
  y += bump(x, z, h + 20, -6, 26, 9) * rim; // Đồi Cầu Vồng, east of the field
  for (const rect of map.water) {
    const head = rect.z0 <= -h ? -h - 14 : -Infinity; // Thác Bạc's cliff stands where the stream comes in
    if (head > -Infinity) y += bump(x, z, (rect.x0 + rect.x1) / 2, head, 22, 16) * rim;
    const half = (rect.x1 - rect.x0) / 2;
    const across = Math.abs(x - streamX(rect, z));
    if (z > head + 6) y = Math.min(y, BED_M + (0 - BED_M) * smooth(half - 0.9, half + 0.25, across) + Math.max(0, y) * smooth(half, half + 6, across));
  }
  return y;
}

type Masks = { mask: Uint8Array<ArrayBuffer>; dir: Uint8Array<ArrayBuffer>; extent: number; size: number };
/**
 * The paint masks over [−extent, extent]², `size` px a side: RGBA = road, bank, stone yard, worn edge (0–255); and the
 * road's direction as (cos 2θ, sin 2θ) in RG, so the ruts turn with it.
 */
export function groundMasks(map: MapDef, lanes: readonly Lane[], size = MASK_PX): Masks {
  const extent = map.halfM + BORDER_M;
  const px = (2 * extent) / size;
  const dist = new Float32Array(size * size).fill(Infinity);
  const ang = new Float32Array(size * size);
  const at = (m: number): number => Math.floor((m + extent) / px);
  const reach = map.roadHalfM + FADE.worn + 1;
  for (const lane of lanes) {
    for (let i = 0; i + 1 < lane.xs.length; i += 1) {
      const [ax, az, bx, bz] = [lane.xs[i]!, lane.zs[i]!, lane.xs[i + 1]!, lane.zs[i + 1]!];
      const [dx, dz] = [bx - ax, bz - az];
      const len2 = dx * dx + dz * dz || 1;
      for (let row = Math.max(0, at(Math.min(az, bz) - reach)); row <= Math.min(size - 1, at(Math.max(az, bz) + reach)); row += 1) {
        for (let col = Math.max(0, at(Math.min(ax, bx) - reach)); col <= Math.min(size - 1, at(Math.max(ax, bx) + reach)); col += 1) {
          const [x, z] = [(col + 0.5) * px - extent, (row + 0.5) * px - extent];
          const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / len2));
          const d = Math.sqrt((x - ax - t * dx) ** 2 + (z - az - t * dz) ** 2);
          const k = row * size + col;
          if (d < dist[k]!) [dist[k], ang[k]] = [d, Math.atan2(dz, dx)];
        }
      }
    }
  }
  const mask = new Uint8Array(size * size * 4);
  const dir = new Uint8Array(size * size * 4);
  const yards: [number, number, number][] = [[map.keep[0], map.keep[1], 7], ...map.nodes.map((n): [number, number, number] => [n.x, n.z, 2.2 + 0.5 * n.richness])];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const k = row * size + col;
      const [x, z] = [(col + 0.5) * px - extent, (row + 0.5) * px - extent];
      const d = dist[k]!;
      const road = smooth(map.roadHalfM + FADE.road, map.roadHalfM - FADE.road, d);
      let bank = 0;
      for (const rect of map.water) {
        const outX = Math.max(rect.x0 - x, x - rect.x1, 0);
        bank = Math.max(bank, smooth(FADE.bank, 0, outX));
      }
      const yard = Math.max(...yards.map(([cx, cz, r]) => smooth(r + FADE.yard, r, Math.sqrt((x - cx) ** 2 + (z - cz) ** 2))));
      const worn = smooth(map.roadHalfM + FADE.worn, map.roadHalfM, d);
      mask.set([road * 255, bank * 255, yard * 255, worn * 255], k * 4);
      const a = 2 * ang[k]!;
      dir.set([(Math.cos(a) * 0.5 + 0.5) * 255, (Math.sin(a) * 0.5 + 0.5) * 255, 0, 255], k * 4);
    }
  }
  return { mask, dir, extent, size };
}

/** Decal spots by the decor rules: [x, z, sheet 0|1, cell 0–7, turn rad, metres]. Sheet a: worn earth 0–1, clearing 7; b: flowers 0–1, pebbles 4–5, clover 7. */
export function decalSpots(map: MapDef, lanes: readonly Lane[]): [number, number, number, number, number, number][] {
  const out: [number, number, number, number, number, number][] = [];
  const near = (x: number, z: number, d: number): boolean => lanes.some((l) => l.xs.some((lx, i) => (lx - x) ** 2 + (l.zs[i]! - z) ** 2 < d * d));
  const wet = (x: number, d: number): boolean => map.water.some((r) => x > r.x0 - d && x < r.x1 + d); // the stream runs on past its rect
  const add = (x: number, z: number, sheet: number, cell: number, seed: number, m = 4): void => void out.push([x, z, sheet, cell, hash(seed, 7.3) * Math.PI * 2, m * (0.8 + 0.4 * hash(seed, 1.9))]);
  const h = map.halfM;
  for (let i = 0; out.length < 34 && i < 400; i += 1) { // flowers and clover in the grass, off roads and water
    const [x, z] = [(hash(i, 2.1) * 2 - 1) * (h + 10), (hash(i, 5.7) * 2 - 1) * (h + 10)];
    if (!near(x, z, map.roadHalfM + 3) && !wet(x, 2) && Math.hypot(x - map.keep[0], z - map.keep[1]) > 10) add(x, z, 1, [0, 1, 7, 7][i % 4]!, i);
  }
  lanes.forEach((lane, l) => { // pebbles along the road's edge
    for (let i = 40 + l * 17; i < lane.xs.length - 1; i += 55) {
      const [dx, dz] = [lane.xs[i + 1]! - lane.xs[i]!, lane.zs[i + 1]! - lane.zs[i]!];
      const side = (i % 2 === 0 ? 1 : -1) * (map.roadHalfM + 1.1) / (Math.hypot(dx, dz) || 1);
      add(lane.xs[i]! - dz * side, lane.zs[i]! + dx * side, 1, 4 + (i % 2), i + l * 1000, 2.6);
    }
  });
  add(map.gate[0], map.gate[1] + 3, 0, 0, 901, 5);
  add(map.keep[0] + 2, map.keep[1] - 9, 0, 1, 902, 4);
  map.nodes.forEach((n, i) => add(n.x + 2.5, n.z + 2, 0, 7, 950 + i, 3.5));
  return out;
}

const SHADER_HEAD = /* glsl */ `
uniform sampler2D tGrass, tClover, tRoad, tTrail, tBank, tYard, tMask, tField, tPlaza;
uniform float uExtent, uTime;
varying vec2 vGround;
float gnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453), b = fract(sin(dot(i + vec2(1, 0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0, 1), vec2(127.1, 311.7))) * 43758.5453), d = fract(sin(dot(i + vec2(1, 1), vec2(127.1, 311.7))) * 43758.5453);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
/** Turns a colour's hue by \`turn\` rad in YIQ and scales its chroma by \`sat\` (the grass to jade-teal, ART_DIRECTION §2.3). */
vec3 jade(vec3 c, float turn, float sat) {
  float y = dot(c, vec3(0.299, 0.587, 0.114));
  float i = dot(c, vec3(0.596, -0.274, -0.322)), q = dot(c, vec3(0.211, -0.523, 0.312));
  float h = atan(q, i) + turn, ch = sqrt(i * i + q * q) * sat;
  i = ch * cos(h); q = ch * sin(h);
  return vec3(y + 0.956 * i + 0.621 * q, y - 0.272 * i - 0.647 * q, y - 1.106 * i + 1.703 * q);
}
/** Signed distance across the road at ground point p (the field's blue). */
float across(vec2 p) { return texture2D(tField, (p + uExtent) / (2.0 * uExtent)).b; }
`;
const SHADER_PAINT = /* glsl */ `
  vec2 gp = vGround;
  vec2 tuv = gp / ${TILE_M.toFixed(1)};
  vec2 muv = (gp + uExtent) / (2.0 * uExtent);
  vec4 m = texture2D(tMask, muv);
  float n1 = gnoise(gp * 0.045), n2 = gnoise(gp * 0.13 + 3.0), n3 = gnoise(gp * 0.6 + 7.0);
  vec3 grass = mix(texture2D(tGrass, tuv).rgb, texture2D(tClover, tuv * 0.75 + 0.37).rgb, smoothstep(0.52, 0.78, n1));
  // Jade-teal grass (§2.3: hue 80–150°, saturation ≤ 0.55, no lime), a step darker than the roads, with warm sunlit and cool
  // patches so it never reads as one carpet.
  grass = jade(grass, -0.6, 0.7) * (0.8 + 0.14 * n2);
  grass = mix(grass, grass * vec3(1.08, 1.03, 0.82), smoothstep(0.6, 0.85, gnoise(gp * 0.03 + 11.0)) * 0.55);
  // Ragged edges: the masks' soft rims broken up by noise, so no yard or road edge is a clean circle or ribbon.
  float rag = (n3 - 0.5) * 0.5 + (n2 - 0.5) * 0.3;
  // Roads (PATH_QUALITY §2, road.ts): material along the road at one texel density (u across, v along, the along
  // distance from its cos and sin, so filtering and mip levels never see a seam); a core, a worn verge 0.3–0.8 m wide
  // and the grass with noisy edges; the core darker at its rim, a plaza on junctions; at least 0.15 luma over the grass.
  vec4 rf = texture2D(tField, muv);
  float ad = abs(rf.b), rw = rf.a;
  float edge = (n3 - 0.5) * 0.3 + (gnoise(gp * 1.7 + 9.0) - 0.5) * 0.24;
  float vergeW = mix(0.3, 0.8, gnoise(gp * 0.19 + 4.0));
  float core = 1.0 - smoothstep(rw - 0.08, rw + 0.08, ad + edge);
  float verge = 1.0 - smoothstep(rw + vergeW - 0.14, rw + vergeW + 0.14, ad + edge * 1.4);
  const float TURN = ${(ROAD_TILE_M / (2 * Math.PI)).toFixed(6)};
  vec2 ruv = vec2(rf.b, atan(rf.g, rf.r) * TURN) / ${ROAD_TILE_M.toFixed(1)};
  vec2 gx = vec2(dFdx(rf.b), (rf.r * dFdx(rf.g) - rf.g * dFdx(rf.r)) * TURN) / ${ROAD_TILE_M.toFixed(1)};
  vec2 gy = vec2(dFdy(rf.b), (rf.r * dFdy(rf.g) - rf.g * dFdy(rf.r)) * TURN) / ${ROAD_TILE_M.toFixed(1)};
  vec3 road = textureGrad(tRoad, ruv, gx, gy).rgb;
  road = mix(vec3(dot(road, vec3(0.299, 0.587, 0.114))), road, 0.5) * 1.1;
  road = mix(road, texture2D(tYard, tuv * 1.1).rgb * 1.05, texture2D(tPlaza, muv).r);
  road *= 1.0 - 0.24 * smoothstep(rw - 0.32, rw - 0.02, ad + edge); // the rim in the lip's shade
  vec3 trail = textureGrad(tTrail, ruv + vec2(0.5, 0.31), gx, gy).rgb;
  trail = mix(vec3(dot(trail, vec3(0.299, 0.587, 0.114))), trail, 0.6) * (0.9 + 0.12 * n2);
  vec3 col = mix(grass, trail, verge * 0.9);
  col = mix(col, road, core);
  // The core sits 5 cm under the verge: the lip's face (0.15 m) tilts the normal towards the road (normal_fragment_maps).
  float face = smoothstep(rw - 0.2, rw - 0.08, ad + edge) * (1.0 - smoothstep(rw + 0.02, rw + 0.14, ad + edge));
  vec2 lat = vec2(across(gp + vec2(0.25, 0.0)) - across(gp - vec2(0.25, 0.0)), across(gp + vec2(0.0, 0.25)) - across(gp - vec2(0.0, 0.25))) * 2.0 * sign(rf.b);
  vec3 lipTilt = vec3(-lat.x, 0.0, -lat.y) * 0.4 * face * step(ad, 5.0);
  col = mix(col, texture2D(tBank, tuv).rgb, smoothstep(0.2, 0.6, m.g + rag * 0.5));
  col = mix(col, texture2D(tYard, tuv * 1.25).rgb, smoothstep(0.35, 0.65, m.b + rag));
  // Cloud shadows drifting over the field (§1.2, §2.7: 0.78–1 of the light), a lighting term on the ground only.
  float cloud = gnoise(gp * 0.011 + uTime * vec2(0.0045, 0.0018)) * 0.65 + gnoise(gp * 0.027 - uTime * 0.003) * 0.35;
  col *= mix(1.0, 0.78, smoothstep(0.5, 0.72, cloud));
  diffuseColor.rgb *= col;
`;

/** Flat colours until (or instead of) the tiles: grass, clover, road, worn, bank, yard. */
const FALLBACK: Record<string, string> = { grass: "#8fbf55", clover: "#86b84f", road: "#c8a06a", trail: "#b89a68", bank: "#8d8f74", yard: "#b3aea0" };
/** By role; the road's three come from road.json (Codex 122's road-paved and trail-worn swap in there once accepted). */
const TILE_FILES: Record<string, string> = { grass: "grass-a", clover: "grass-b-clover", road: ROAD.core, trail: ROAD.verge, bank: "stream-bank", yard: ROAD.plaza };

function flat(color: string): THREE.DataTexture {
  const c = new THREE.Color(color);
  const t = new THREE.DataTexture(new Uint8Array([c.r * 255, c.g * 255, c.b * 255, 255]), 1, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

export type Ground = ReturnType<typeof createGround>;

/** The ground meshes for `map` into `layer`; tiles, decals and the bridges load after, at `tier`. */
export function createGround(layer: THREE.Group, map: MapDef, lanes: readonly Lane[], tier: Tier3D, renderer: THREE.WebGLRenderer) {
  const extent = map.halfM + BORDER_M;
  const steps = Math.round(extent); // 2 m a quad
  const geometry = new THREE.PlaneGeometry(extent * 2, extent * 2, steps, steps).rotateX(-Math.PI / 2);
  const pos = geometry.attributes["position"]!;
  for (let i = 0; i < pos.count; i += 1) pos.setY(i, heightAt(map, pos.getX(i), pos.getZ(i)));
  geometry.computeVertexNormals();

  const { mask } = groundMasks(map, lanes);
  const road = roadField(map, lanes, extent);
  const data = (bytes: Uint8Array<ArrayBuffer>): THREE.DataTexture => Object.assign(new THREE.DataTexture(bytes, MASK_PX, MASK_PX), { magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, needsUpdate: true });
  const half = Uint16Array.from(road.field, (v) => THREE.DataUtils.toHalfFloat(v));
  const fieldTexture = Object.assign(new THREE.DataTexture(half, road.size, road.size, THREE.RGBAFormat, THREE.HalfFloatType), { magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, needsUpdate: true });
  const tiles = Object.fromEntries(Object.entries(FALLBACK).map(([key, color]) => [key, { value: flat(color) as THREE.Texture }]));
  const time = { value: 0 };
  const uniforms = { ...Object.fromEntries(Object.entries(tiles).map(([key, u]) => ["t" + key[0]!.toUpperCase() + key.slice(1), u])), tMask: { value: data(mask) }, tField: { value: fieldTexture }, tPlaza: { value: data(road.plaza as Uint8Array<ArrayBuffer>) }, uExtent: { value: extent }, uTime: time };
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vGround;").replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvGround = (modelMatrix * vec4(transformed, 1.0)).xz;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + SHADER_HEAD).replace("#include <map_fragment>", SHADER_PAINT).replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\nnormal = normalize(normal + (viewMatrix * vec4(lipTilt, 0.0)).xyz);");
  };
  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.name = "td-ground";

  // The stream: a strip winding inside its rect, from the cliff's foot to the far border.
  const water = new THREE.Group();
  const waterMaterial = new THREE.MeshLambertMaterial({ color: "#a9c9cf", emissive: "#2a5664", emissiveIntensity: 0.3, transparent: true, opacity: 0.82 }); // silver (§2.3)
  waterMaterial.onBeforeCompile = (shader) => {
    shader.uniforms["uTime"] = time;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vWater;").replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWater = (modelMatrix * vec4(transformed, 1.0)).xz;");
    // Silver flecks drifting downstream: noise, not a repeating wave.
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uTime;\nvarying vec2 vWater;\n" + SHADER_HEAD.slice(SHADER_HEAD.indexOf("float gnoise"), SHADER_HEAD.indexOf("/** Turns a colour"))).replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\nfloat flow = gnoise(vec2(vWater.x * 2.3, vWater.y * 0.7 - uTime * 0.9)) * gnoise(vec2(vWater.x * 5.0 + 3.0, vWater.y * 1.9 - uTime * 1.6));\ntotalEmissiveRadiance += vec3(0.36, 0.4, 0.42) * smoothstep(0.42, 0.7, flow);");
  };
  for (const rect of map.water) {
    const z0 = rect.z0 <= -map.halfM ? -map.halfM - 4 : rect.z0;
    const z1 = rect.z1 >= map.halfM ? extent : rect.z1;
    const rows = Math.ceil((z1 - z0) / 1.5);
    const strip = new THREE.PlaneGeometry(1, 1, 1, rows).rotateX(-Math.PI / 2);
    const p = strip.attributes["position"]!;
    const half = (rect.x1 - rect.x0) / 2 - 0.35;
    for (let i = 0; i < p.count; i += 1) {
      const z = z0 + (p.getZ(i) + 0.5) * (z1 - z0);
      p.setXYZ(i, streamX(rect, z) + Math.sign(p.getX(i)) * half, WATER_Y, z);
    }
    strip.computeVertexNormals();
    water.add(new THREE.Mesh(strip, waterMaterial));
  }

  // Decals: one instanced quad set per sheet, each quad showing one of the sheet's 4 × 2 cells.
  const spots = [...decalSpots(map, lanes), ...road.edges];
  const sheets = ["ground-decals-a", "ground-decals-b", ...(ROAD.edgeDecals === null ? [] : [ROAD.edgeDecals as string])];
  const decals = sheets.map((_, sheet) => {
    const mine = spots.filter((s) => s[2] === sheet);
    const quad = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const cell = new Float32Array(mine.length * 2);
    mine.forEach((s, i) => cell.set([(s[3] % 4) * 0.25, s[3] < 4 ? 0.5 : 0], i * 2));
    quad.setAttribute("aCell", new THREE.InstancedBufferAttribute(cell, 2));
    const decalMaterial = new THREE.MeshLambertMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, alphaTest: 0.02 });
    decalMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nattribute vec2 aCell;").replace("#include <uv_vertex>", "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = uv * vec2(0.25, 0.5) + aCell;\n#endif");
    };
    const mesh = new THREE.InstancedMesh(quad, decalMaterial, mine.length);
    const m = new THREE.Matrix4();
    mine.forEach(([x, z, , , turn, size], i) => mesh.setMatrixAt(i, m.compose(new THREE.Vector3(x, heightAt(map, x, z) + 0.03, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turn), new THREE.Vector3(size, 1, size))));
    mesh.receiveShadow = true;
    mesh.renderOrder = 1;
    mesh.visible = false; // until its sheet is in
    return mesh;
  });

  const bridges = new THREE.Group();
  layer.add(terrain, water, ...decals, bridges);
  const dressing = new RoadDressing(layer, road.dressing, (x, z) => heightAt(map, x, z), tier);

  // Media: tiles and decals by tier (a missing file keeps the flat colour, a missing sheet no decals); the bridges.
  const loader = new THREE.TextureLoader();
  const anisotropy = Math.min(tier === "high" ? 8 : 4, renderer.capabilities.getMaxAnisotropy());
  const texture = (file: string, repeat: boolean): Promise<THREE.Texture | null> =>
    loader.loadAsync(`/assets/typing-defense/ground/${file}.${tier}.webp`).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = anisotropy;
      return t;
    }, () => null);
  for (const [key, file] of Object.entries(TILE_FILES)) void texture(file, true).then((t) => t && (tiles[key]!.value = t));
  sheets.forEach((file, sheet) => void texture(file, false).then((t) => {
    if (t === null) return;
    Object.assign(decals[sheet]!.material as THREE.MeshLambertMaterial, { map: t, needsUpdate: true });
    decals[sheet]!.visible = true;
  }));
  void new ModelLibrary({ manifests: "/assets/typing-defense/models/manifest.json" }).url("props", "cau-go", tier).then((url) => (url === null ? null : loadModel(url))).then((gltf) => {
    if (!gltf) return;
    for (const rect of map.bridges) {
      relight(gltf.scene);
      const bridge = gltf.scene.clone(true);
      bridge.position.set((rect.x0 + rect.x1) / 2, -0.25, (rect.z0 + rect.z1) / 2);
      bridge.rotation.y = Math.PI / 2; // its deck runs along the model's length: across the stream
      bridge.traverse((o: THREE.Object3D) => void ((o as THREE.Mesh).isMesh && ((o.castShadow = true), (o.receiveShadow = true))));
      bridges.add(bridge);
    }
  }, () => undefined);

  return {
    terrain,
    road,
    dressing,
    update(seconds: number, w?: World): void {
      time.value = seconds;
      if (w) dressing.update(w);
    },
    dispose(): void {
      for (const mesh of [terrain, ...water.children, ...decals] as THREE.Mesh[]) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      for (const u of Object.values(uniforms)) if ((u as { value: unknown }).value instanceof THREE.Texture) ((u as { value: THREE.Texture }).value).dispose();
    },
  };
}
