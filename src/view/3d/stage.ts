/**
 * The 3D stage of map 1 (1C step C2, docs/td/BUILD_1C_MAP1.md §6, §7): the WebGL renderer on the view's canvas, the
 * scene with its ground, actor and effect layers, the light rig and the post passes of StylePack Sách tranh (TK 23.12:
 * saturation ×1.15, Neutral tone, bloom 0.25 only where measured) per tier. Medium and High draw 3D; Low is the 2D view.
 * Lit for the owner's epic bar (28/10/2026; docs/games/ART_DIRECTION_2026-10-28.md, Wordwoven): a strong warm key against
 * a cool sky, a cool fill, a soft rim from behind the default view, soft contact shadows, and on High ambient occlusion
 * (GTAO): never a flat even light.
 * Adapted from games/dragon-hold@02fe9c7 src/view/stage.ts (createStage, STAGE_QUALITY, GRADE_SHADER, projectToScreen):
 * retuned for the meadow (warm sun from the south-west, cool fill, pale mist), sized by the page, not by an observer.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import type { Tier } from "../view";

export type Tier3D = Exclude<Tier, "low">;
/** What each tier draws: pixel ratio cap, shadow map, FXAA after the grade, a bloom pass built (off until C13 measures it). */
export const STAGE_TIERS: Readonly<Record<Tier3D, { dpr: number; shadow: number; fxaa: boolean; bloomPass: boolean; ao: boolean }>> = {
  medium: { dpr: 1, shadow: 1024, fxaa: true, bloomPass: false, ao: false },
  high: { dpr: 1.25, shadow: 2048, fxaa: true, bloomPass: true, ao: true },
};
/** The sun's direction (towards it): low enough from the south-west that houses cast readable shadows. */
export const SUN = new THREE.Vector3(-0.45, 0.78, 0.43).normalize();
/** Pale meadow mist: the sky above the far rim and the fog the far ground melts into. */
const MIST = new THREE.Color("#c9d9cf");

/** Sách tranh's grade: Neutral tone map, saturation ×1.15, split toning, a milky lift, a light vignette. */
const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uExposure: { value: 1.0 },
    uSaturation: { value: 1.15 },
    uLift: { value: new THREE.Vector3(0.012, 0.012, 0.022) },
    uShadowTint: { value: new THREE.Vector3(0.95, 0.97, 1.06) },
    uHighTint: { value: new THREE.Vector3(1.04, 1.02, 0.95) },
    uVignette: { value: 0.18 },
    uAspect: { value: 16 / 9 },
  },
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uExposure, uSaturation, uVignette, uAspect;
uniform vec3 uLift, uShadowTint, uHighTint;
varying vec2 vUv;
// Khronos PBR Neutral (three's NeutralToneMapping): keeps painted hues.
vec3 neutral(vec3 color) {
  const float start = 0.76;
  const float desat = 0.15;
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < start) return color;
  float d = 1.0 - start;
  float newPeak = 1.0 - d * d / (peak + d - start);
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / (desat * (peak - newPeak) + 1.0);
  return mix(color, vec3(newPeak), g);
}
vec3 toSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
void main() {
  vec3 c = toSrgb(clamp(neutral(max(texture2D(tDiffuse, vUv).rgb * uExposure, 0.0)), 0.0, 1.0));
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c *= mix(uShadowTint, uHighTint, smoothstep(0.2, 0.8, luma));
  c = mix(vec3(luma), c, uSaturation);
  c = uLift + c * (1.0 - uLift);
  vec2 v = (vUv - 0.5) * vec2(uAspect, 1.0);
  c *= 1.0 - uVignette * smoothstep(0.45, 1.05, length(v));
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`,
};

/** CSS px of a world point in a `width` × `height` view, the projection's shake offset left out (DOM cards stay still). */
export function projectToScreen(camera: THREE.PerspectiveCamera, width: number, height: number, x: number, y: number, z: number, scratch = new THREE.Vector4(), clean = new THREE.Matrix4()): { x: number; y: number; visible: boolean } {
  clean.copy(camera.projectionMatrix);
  clean.elements[8] = 0;
  clean.elements[9] = 0;
  scratch.set(x, y, z, 1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(clean);
  if (scratch.w <= 1e-6) return { x: -1e4, y: -1e4, visible: false };
  const [nx, ny, nz] = [scratch.x / scratch.w, scratch.y / scratch.w, scratch.z / scratch.w];
  const out = { x: (nx * 0.5 + 0.5) * width, y: (0.5 - ny * 0.5) * height, visible: false };
  out.visible = nz >= -1 && nz <= 1 && out.x >= 0 && out.x <= width && out.y >= 0 && out.y <= height;
  return out;
}

export type Stage = ReturnType<typeof createStage>;

/** The stage on `canvas`; throws when the browser gives no WebGL 2 context. */
export function createStage(canvas: HTMLCanvasElement, tier: Tier3D, fieldHalfM: number) {
  const T = STAGE_TIERS[tier];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", stencil: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // the grade pass tone maps
  renderer.setClearColor(MIST, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = false;

  const scene = new THREE.Scene();
  scene.background = MIST.clone();
  scene.fog = new THREE.Fog(MIST.clone(), 170, 420);
  // TK 23.2's sizes at TK 23.6's default camera (55° at 58 m): a 1.85 m soldier ≈ 28 px, the 8 m Fort ≈ 125 px at 1080p.
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 1, 900);

  const sky = new THREE.HemisphereLight("#c3d4f6", "#4f5a3a", 0.9);
  const key = new THREE.DirectionalLight("#ffdcae", 3.4);
  key.position.copy(SUN).multiplyScalar(150);
  key.castShadow = true;
  key.shadow.mapSize.set(T.shadow, T.shadow);
  const reach = fieldHalfM + 22;
  Object.assign(key.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 30, far: 320 });
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.05;
  key.shadow.radius = 3;
  const fill = new THREE.DirectionalLight("#8fa8e8", 0.35);
  fill.position.set(60, 50, -70);
  // A soft rim from behind the default view (north), so houses and figures stand off the ground.
  const rim = new THREE.DirectionalLight("#e6eeff", 1.1);
  rim.position.set(-10, 45, -95);
  const layers = { ground: new THREE.Group(), actors: new THREE.Group(), fx: new THREE.Group() };
  scene.add(sky, key, key.target, fill, rim, layers.ground, layers.actors, layers.fx);

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
  composer.addPass(new RenderPass(scene, camera));
  const ao = T.ao ? new GTAOPass(scene, camera, 1, 1) : null;
  if (ao !== null) {
    ao.blendIntensity = 0.85;
    ao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.4, thickness: 1.5, scale: 1.0, samples: 12 });
    composer.addPass(ao);
  }
  const bloom = T.bloomPass ? new UnrealBloomPass(new THREE.Vector2(256, 256), 0.25, 0.5, 1.6) : null;
  if (bloom !== null) composer.addPass(Object.assign(bloom, { enabled: false }));
  const grade = new ShaderPass(GRADE_SHADER);
  composer.addPass(grade);
  const fxaa = T.fxaa ? new ShaderPass(FXAAShader) : null;
  if (fxaa !== null) composer.addPass(fxaa);

  const size = { width: 1, height: 1 };
  const scratch = new THREE.Vector4();
  const clean = new THREE.Matrix4();
  return {
    renderer, scene, camera, layers, tier, size, lights: { sky, key, fill, rim },
    resize(width: number, height: number, ratio: number): void {
      [size.width, size.height] = [Math.max(1, width), Math.max(1, height)];
      renderer.setPixelRatio(Math.min(ratio, T.dpr));
      renderer.setSize(size.width, size.height, false);
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(size.width, size.height);
      grade.uniforms["uAspect"]!.value = size.width / size.height;
      fxaa?.uniforms["resolution"]!.value.set(1 / (size.width * renderer.getPixelRatio()), 1 / (size.height * renderer.getPixelRatio()));
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
    },
    project: (x: number, y: number, z: number) => projectToScreen(camera, size.width, size.height, x, y, z, scratch, clean),
    render(): void {
      renderer.info.reset();
      composer.render();
    },
    /** Draw calls and triangles of the last frame (shadow and post passes included). */
    stats: () => ({ drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
    dispose(): void {
      bloom?.dispose();
      ao?.dispose();
      grade.dispose();
      fxaa?.dispose();
      composer.dispose();
      key.shadow.map?.dispose();
      renderer.dispose();
    },
  };
}
