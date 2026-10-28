/**
 * The 3D stage of map 1 (1C step C2, docs/td/BUILD_1C_MAP1.md §6, §7): the WebGL renderer on the view's canvas, the
 * scene with its ground, actor and effect layers, the light rig and the post passes of StylePack Sách tranh (TK 23.12:
 * saturation ×1.15, Neutral tone, bloom 0.25 only where measured) per tier. Medium and High draw 3D; Low is the 2D view.
 * StylePack "Epic" (docs/games/ART_DIRECTION_2026-10-28.md §2.4, §2.7, replacing Sách tranh): a warm key sun 40° up
 * from the south-west with long, sharp shadows; a jade sky over dark teal ground for teal shadows; a cold rim at 0.4
 * from opposite the sun; GTAO on High; silver-gold depth fog; a filmic grade (ACES, saturation 0.95, teal shadows, gold
 * highlights, vignette 0.15). `relight` tones the models' toy yellows and oranges down per material.
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
/** The sun's direction (towards it): 40° up from the south-west, the world's one sun (§2.4; lane L's choice). */
export const SUN = new THREE.Vector3(-0.54, 0.643, 0.54).normalize();
/** Day mist, silver with a little gold (§2.7: until backdrop 114 gives its haze band): the far ground melts into it. */
const MIST = new THREE.Color("#c4c9bb");

/** Sách tranh's grade: Neutral tone map, saturation ×1.15, split toning, a milky lift, a light vignette. */
const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uExposure: { value: 1.0 },
    uSaturation: { value: 0.95 },
    uLift: { value: new THREE.Vector3(0.004, 0.014, 0.016) },
    uShadowTint: { value: new THREE.Vector3(0.86, 0.99, 1.0) },
    uHighTint: { value: new THREE.Vector3(1.06, 1.01, 0.88) },
    uVignette: { value: 0.15 },
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
// ACES filmic (Narkowicz's fit): a film shoulder, deeper shadows than Neutral (§2.7).
vec3 neutral(vec3 color) {
  color *= 0.9;
  return clamp((color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14), 0.0, 1.0);
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

/**
 * §2.7's per-material relighting for the vinyl-toy models: their harshest straw yellows and oranges lose about 13 % of
 * their saturation in the shader, other colours keep theirs; metal off. Call once on a loaded scene (its own materials).
 */
export function relight(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (m.userData["epic"]) continue;
      m.userData["epic"] = true;
      if ("metalness" in m) (m as THREE.MeshStandardMaterial).metalness = 0;
      m.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
  {
    float l = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
    float warm = smoothstep(0.08, 0.3, diffuseColor.r - diffuseColor.b) * smoothstep(0.02, 0.2, diffuseColor.g - diffuseColor.b);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l), 0.13 * warm);
  }`);
      };
      m.customProgramCacheKey = () => "td-epic";
      m.needsUpdate = true;
    }
  });
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
  scene.fog = new THREE.Fog(MIST.clone(), 95, 330); // depth: the far border and the cliffs fade a step
  // TK 23.2's sizes at TK 23.6's default camera (55° at 58 m): a 1.85 m soldier ≈ 28 px, the 8 m Fort ≈ 125 px at 1080p.
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 1, 900);

  const sky = new THREE.HemisphereLight("#a9d2d6", "#33463c", 0.75);
  const key = new THREE.DirectionalLight("#ffdca8", 3.9);
  key.position.copy(SUN).multiplyScalar(150);
  key.castShadow = true;
  key.shadow.mapSize.set(T.shadow, T.shadow);
  const reach = fieldHalfM + 22;
  Object.assign(key.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 30, far: 320 });
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.05;
  key.shadow.radius = 1.5; // sharp, long shadows (§2.7)
  const fill = new THREE.DirectionalLight("#7fb3bf", 0.2);
  fill.position.set(60, 50, -70);
  // The cold rim from opposite the sun (§2.7), so houses and figures stand off the ground.
  const rim = new THREE.DirectionalLight("#eef4ff", 0.4);
  rim.position.copy(SUN).multiplyScalar(-150).setY(110);
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
