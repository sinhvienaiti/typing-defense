/**
 * The shared effect pool of map 1's 3D view (1C step C10, docs/td/BUILD_1C_MAP1.md §6, §7; VFX_STANDARD §3.2, §3.5,
 * §3.7): camera-facing quads in two instanced meshes, drawn after the grade (stage.ts `overlay`), so a hot core is not
 * tone mapped and the effects add 2 draw calls at most, none while nothing lives. `glow` adds light; `ink` lays dark,
 * normal-blended layers under it (smoke, ink, the card plates). Shapes are made in the shader: a soft glow with a white
 * core ≤ 30 % of its radius (`hot`), a ring, a spark streaked along its velocity, an eroded smoke blob, a letter of the
 * game's font (a glyph atlas); `flat` ones lie on the ground. A bit is full bright on its first frame (§3.1 rule 5); one
 * with `to` flies a curve into it, `trail` drops a gold mote each frame, `end` runs where it dies. For C11 to share.
 */
import * as THREE from "three";

export const SHAPE = { glow: 0, ring: 1, spark: 2, smoke: 3, letter: 4, plate: 5 } as const;
export type Layer = "glow" | "ink";
export type Rgb = readonly [number, number, number];
export type Bit = {
  x: number; y: number; z: number; vx: number; vy: number; vz: number;
  /** Width in metres; `length` streaks it along its velocity (a spark) or `along` (a plate). */
  size: number; grow: number; length: number; life: number; age: number; delay: number;
  rgb: Rgb; alpha: number; hot: number; shape: number; glyph: number; turn: number; spin: number;
  flat: boolean; gravity: number; drag: number; floor: number;
  to: THREE.Vector3 | null; from: THREE.Vector3; arc: number; trail: number;
  along: THREE.Vector3 | null; end: ((bit: Bit) => void) | null; live: boolean;
};
const BLANK: Omit<Bit, "from"> = {
  x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 1, grow: 0, length: 0, life: 0.3, age: 0, delay: 0, rgb: [1, 1, 1], alpha: 1, hot: 0,
  shape: 0, glyph: 0, turn: 0, spin: 0, flat: false, gravity: 0, drag: 0, floor: -1e9, to: null, arc: 0, trail: 0, along: null, end: null, live: false,
};
const GOLD: Rgb = [1, 0.78, 0.36];
const PER = 16;

const VERTEX = /* glsl */ `
attribute vec3 iPos;
attribute vec3 iDir;
attribute vec2 iSize;
attribute vec4 iColor;
attribute vec4 iInfo;
varying vec2 vUv;
varying vec4 vColor;
varying vec4 vInfo;
void main() {
  vUv = position.xy + 0.5;
  vColor = iColor;
  vInfo = iInfo;
  if (iInfo.w > 0.5) {
    gl_Position = projectionMatrix * viewMatrix * vec4(iPos + vec3(position.x, 0.0, -position.y) * iSize.x, 1.0);
    return;
  }
  vec4 c = viewMatrix * vec4(iPos, 1.0);
  vec2 axis = vec2(cos(iDir.x), sin(iDir.x));
  float len = iSize.x;
  if (iSize.y > 0.0) {
    vec2 d = (viewMatrix * vec4(iDir, 0.0)).xy;
    if (length(d) > 1e-5) axis = normalize(d);
    len = iSize.y;
  }
  c.xy += axis * position.x * len + vec2(-axis.y, axis.x) * position.y * iSize.x;
  gl_Position = projectionMatrix * c;
}`;

const FRAGMENT = /* glsl */ `
uniform sampler2D uGlyphs;
uniform float uInk;
varying vec2 vUv;
varying vec4 vColor;
varying vec4 vInfo;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float shape = vInfo.x;
  float age = vInfo.z;
  vec3 col = vColor.rgb;
  float a = 0.0;
  if (shape < 0.5) {
    // A hot core (white inside 30 % of the radius), the coloured body, a wide halo.
    a = max(exp(-r * r * 5.0), exp(-r * 2.8) * 0.42) * (1.0 - smoothstep(0.82, 1.0, r));
    col = mix(col, vec3(1.0), (1.0 - smoothstep(0.0, 0.3, r)) * vInfo.y);
  } else if (shape < 1.5) {
    float w = mix(0.24, 0.05, age);
    float band = 1.0 - smoothstep(0.0, w, abs(r - 0.8));
    a = band * (0.7 + 0.3 * noise(p * 7.0 + age * 4.0));
    col = mix(col, vec3(1.0), (1.0 - smoothstep(0.0, w * 0.35, abs(r - 0.8))) * vInfo.y);
  } else if (shape < 2.5) {
    float along = max(0.0, 1.0 - abs(p.x));
    float across = max(0.0, 1.0 - abs(p.y));
    a = pow(along, 1.1) * pow(across, 2.6);
    col = mix(col, vec3(1.0), smoothstep(0.55, 1.0, across) * smoothstep(0.35, 1.0, along) * vInfo.y);
  } else if (shape < 3.5) {
    float n = noise(p * 2.4 + vInfo.y * 17.0 + age * 1.3);
    a = smoothstep(1.0, 0.2, r + (n - 0.5) * 0.75) * (0.55 + 0.45 * n);
  } else if (shape < 4.5) {
    // A letter: fill (red), glow (green), outline (blue) of its atlas cell; index in vInfo.y, its white heat in the fraction.
    float g = floor(vInfo.y);
    vec4 t = texture2D(uGlyphs, (vec2(mod(g, 8.0), floor(g / 8.0)) + vec2(vUv.x, 1.0 - vUv.y)) / vec2(8.0, 4.0));
    if (uInk > 0.5) {
      a = max(t.r, t.b);
      col *= mix(0.45, 1.0, t.r);
    } else {
      a = max(t.r, t.g * 0.85);
      col = mix(col * t.g, mix(col, vec3(1.0), fract(vInfo.y) * 1.25), t.r);
    }
  } else {
    // A card's plate: a soft rounded box, the card inside its flat middle.
    vec2 q = abs(p) - vec2(0.62, 0.45);
    a = 1.0 - smoothstep(-0.05, 0.38, length(max(q, 0.0)) + min(max(q.x, q.y), 0.0));
  }
  gl_FragColor = vec4(col, a * vColor.a);
}`;

/** The 26 letters of the game's title font in an 8 × 4 atlas: fill in red, a soft glow in green, a thick outline in blue. */
function glyphAtlas(): THREE.Texture {
  const cell = 64;
  const layer = (draw: (g: CanvasRenderingContext2D, ch: string, x: number, y: number) => void, blur: number): ImageData => {
    const canvas = Object.assign(document.createElement("canvas"), { width: cell * 8, height: cell * 4 });
    const g = canvas.getContext("2d")!;
    g.font = "800 50px " + (getComputedStyle(document.documentElement).getPropertyValue("--vd-title").trim() || "sans-serif");
    [g.textAlign, g.textBaseline, g.fillStyle, g.strokeStyle, g.lineWidth, g.lineJoin] = ["center", "middle", "#fff", "#fff", 9, "round"];
    if (blur > 0) [g.shadowBlur, g.shadowColor] = [blur, "#fff"];
    for (let k = 0; k < 26; k += 1) draw(g, String.fromCharCode(65 + k), (k % 8) * cell + cell / 2, Math.floor(k / 8) * cell + cell / 2 + 3);
    return g.getImageData(0, 0, cell * 8, cell * 4);
  };
  const fill = layer((g, ch, x, y) => g.fillText(ch, x, y), 0);
  const glow = layer((g, ch, x, y) => [g.fillText(ch, x, y), g.fillText(ch, x, y)], 10);
  const line = layer((g, ch, x, y) => g.strokeText(ch, x, y), 0);
  const data = new Uint8Array(fill.data.length);
  for (let i = 0; i < data.length; i += 4) [data[i], data[i + 1], data[i + 2], data[i + 3]] = [fill.data[i + 3]!, glow.data[i + 3]!, line.data[i + 3]!, 255];
  const texture = new THREE.DataTexture(data, cell * 8, cell * 4);
  [texture.flipY, texture.minFilter, texture.magFilter, texture.generateMipmaps, texture.needsUpdate] = [false, THREE.LinearMipmapLinearFilter, THREE.LinearFilter, true, true];
  return texture;
}

/** A pool of `max` bits per layer. */
export class FxPool {
  readonly scene = new THREE.Scene();
  private readonly bits: Record<Layer, Bit[]>;
  private readonly meshes: Record<Layer, THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>>;
  private readonly data: Record<Layer, Float32Array>;
  private readonly glyphs: THREE.Texture;
  /** Bits started in the last frame (__td.view: sparks per frame, VFX_STANDARD §3.7). */
  born = 0;

  constructor(private readonly max: number) {
    this.glyphs = glyphAtlas();
    const make = (): Bit[] => Array.from({ length: max }, () => ({ ...BLANK, from: new THREE.Vector3() }));
    this.bits = { glow: make(), ink: make() };
    this.data = { glow: new Float32Array(max * PER), ink: new Float32Array(max * PER) };
    this.meshes = { glow: this.mesh("glow"), ink: this.mesh("ink") };
  }

  private mesh(layer: Layer): THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial> {
    const geometry = new THREE.InstancedBufferGeometry();
    const quad = new THREE.PlaneGeometry(1, 1);
    geometry.index = quad.index;
    geometry.setAttribute("position", quad.getAttribute("position"));
    const buffer = new THREE.InstancedInterleavedBuffer(this.data[layer], PER).setUsage(THREE.DynamicDrawUsage);
    [["iPos", 3, 0], ["iDir", 3, 3], ["iSize", 2, 6], ["iColor", 4, 8], ["iInfo", 4, 12]].forEach(([name, n, at]) => geometry.setAttribute(name as string, new THREE.InterleavedBufferAttribute(buffer, n as number, at as number)));
    geometry.instanceCount = 0;
    const ink = layer === "ink";
    const material = new THREE.ShaderMaterial({
      uniforms: { uGlyphs: { value: this.glyphs }, uInk: { value: ink ? 1 : 0 } }, vertexShader: VERTEX, fragmentShader: FRAGMENT,
      transparent: true, depthTest: false, depthWrite: false, toneMapped: false, blending: ink ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geometry, material);
    [mesh.frustumCulled, mesh.renderOrder, mesh.visible] = [false, ink ? 0 : 1, false];
    this.scene.add(mesh);
    return mesh;
  }

  /** Starts a bit; when the layer is full the oldest gives way. */
  add(layer: Layer, spec: Partial<Bit> & Pick<Bit, "x" | "y" | "z" | "size" | "life" | "rgb">): Bit {
    const list = this.bits[layer];
    let bit = list.find((b) => !b.live);
    if (bit === undefined) bit = list.reduce((oldest, b) => (b.age / b.life > oldest.age / oldest.life ? b : oldest));
    const keep = bit.from;
    Object.assign(bit, BLANK, spec, { live: true, age: 0, from: keep.set(spec.x, spec.y, spec.z) });
    this.born += 1;
    return bit;
  }

  /** Moves every bit `dt` s on and writes the live ones (one frame's plates with them). */
  update(dt: number): void {
    for (const layer of ["glow", "ink"] as const) {
      const out = this.data[layer];
      let n = 0;
      for (const b of this.bits[layer]) {
        if (!b.live) continue;
        if (b.delay > 0) {
          b.delay -= dt;
          continue;
        }
        if (b.age >= b.life) {
          b.live = false;
          b.end?.(b);
          continue;
        }
        const t = b.age / b.life;
        if (b.to !== null) {
          // Into its target on a raised curve, faster at the end.
          const u = t * t;
          const lift = b.arc * 4 * u * (1 - u);
          b.x = b.from.x + (b.to.x - b.from.x) * u;
          b.y = b.from.y + (b.to.y - b.from.y) * u + lift;
          b.z = b.from.z + (b.to.z - b.from.z) * u;
        } else if (b.age > 0) {
          const keep = Math.exp(-b.drag * dt);
          [b.vx, b.vy, b.vz] = [b.vx * keep, b.vy * keep - b.gravity * dt, b.vz * keep];
          [b.x, b.y, b.z] = [b.x + b.vx * dt, Math.max(b.floor, b.y + b.vy * dt), b.z + b.vz * dt];
        }
        if (b.trail > 0 && b.age > 0) this.add("glow", { x: b.x, y: b.y, z: b.z, size: b.trail, life: 0.14, rgb: GOLD, alpha: 0.85, hot: 0.2 });
        // Full on its first frame; a ring and a glow grow out (ease-out), everything fades after.
        const size = b.size * (1 + b.grow * (1 - (1 - t) * (1 - t)));
        const alpha = b.alpha * (b.shape === SHAPE.letter && b.to !== null ? 1 : (1 - t) ** 1.4);
        const o = n * PER;
        const dir = b.along ?? { x: b.vx, y: b.vy, z: b.vz };
        out.set([b.x, b.y, b.z, b.length > 0 ? dir.x : b.turn + b.spin * b.age, dir.y, dir.z, size, b.length, b.rgb[0], b.rgb[1], b.rgb[2], alpha, b.shape, b.shape === SHAPE.letter ? b.glyph + Math.min(0.8, b.hot) : b.hot, t, b.flat ? 1 : 0], o);
        b.age += dt;
        n += 1;
      }
      const mesh = this.meshes[layer];
      mesh.geometry.instanceCount = n;
      mesh.visible = n > 0;
      (mesh.geometry.getAttribute("iPos") as THREE.InterleavedBufferAttribute).data.needsUpdate = true;
    }
  }

  /** Live bits per layer. */
  count(): { glow: number; ink: number } {
    return { glow: this.bits.glow.filter((b) => b.live).length, ink: this.bits.ink.filter((b) => b.live).length };
  }

  dispose(): void {
    for (const mesh of Object.values(this.meshes)) [mesh.geometry.dispose(), mesh.material.dispose()];
    this.glyphs.dispose();
  }
}
