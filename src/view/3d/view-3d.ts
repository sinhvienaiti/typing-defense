/**
 * The 3D view of map 1 (1C step C1, docs/td/BUILD_1C_MAP1.md §7): the chunk view.ts loads, with three.js. Still empty:
 * a WebGL canvas of its own over the 2D one, the field as one flat plane, a sky and a sun light, and TK 23.6's default
 * camera (55° at 58 m, zoom 22–120 m) that pans and zooms about the pointer, so the page, the word cards and the pointer
 * already run through it. C2 brings the stage and the RTS camera, C3 the ground, C6 the houses. It reads the world and
 * never changes it. `open` gives null without WebGL (the page keeps 2D); a lost context calls `lost`.
 */
import * as THREE from "three";
import { clamp } from "../../kit/three/util";
import type { MapView, Tier } from "../view";
import type { Rect } from "../words/lanes";

/** TK 23.6: 55° down at 58 m, zoom 22–120 m. The field of view is C2's to fit TK 23.2's sizes (td-scale). */
const CAMERA = { pitch: (55 * Math.PI) / 180, distanceM: 58, nearM: 22, farM: 120, fovDeg: 45 } as const;
/** Pixel ratio cap and antialiasing per tier (C2 retunes them with the stage). */
const TIERS = { medium: { dpr: 1, antialias: false }, high: { dpr: 1.5, antialias: true } } as const;
/** The Văn Điền meadow (debug-2d.ts paddy), the mist behind it. */
const GRASS = 0x93c45a;
const MIST = 0xcfe0c8;

export class View3D implements MapView {
  readonly kind = "3d";
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(CAMERA.fovDeg, 1, 0.5, 600);
  private readonly ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ color: GRASS }));
  private readonly target = new THREE.Vector3();
  private readonly ray = new THREE.Raycaster();
  private readonly plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly point = new THREE.Vector3();
  private readonly ndc = new THREE.Vector2();
  private distance: number = CAMERA.distanceM;
  private halfM = 48;
  private width = 1;
  private height = 1;

  /** A canvas after `after`, or null when the browser gives no WebGL 2 context (the page keeps the 2D view). */
  static open(after: HTMLElement, tier: Exclude<Tier, "low">, lost: () => void): View3D | null {
    const canvas = document.createElement("canvas");
    canvas.id = "tdCanvas3d";
    canvas.setAttribute("aria-label", "Bản đồ");
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: TIERS[tier].antialias, powerPreference: "high-performance" });
      after.after(canvas);
      return new View3D(renderer, tier, lost);
    } catch (error) {
      console.warn("typing defense: no WebGL, the map stays 2D", error);
      return null;
    }
  }

  private constructor(renderer: THREE.WebGLRenderer, private readonly tier: Exclude<Tier, "low">, lost: () => void) {
    this.renderer = renderer;
    this.canvas.addEventListener("webglcontextlost", (event) => (event.preventDefault(), lost()));
    this.scene.background = new THREE.Color(MIST);
    this.ground.rotation.x = -Math.PI / 2;
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
    sun.position.set(-30, 60, 40);
    this.scene.add(this.ground, new THREE.HemisphereLight(0xdfeeff, 0x6f8a4a, 1.4), sun);
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  resize(cssWidth: number, cssHeight: number, ratio: number, halfM: number): void {
    [this.width, this.height, this.halfM] = [Math.max(1, cssWidth), Math.max(1, cssHeight), halfM];
    this.renderer.setPixelRatio(Math.min(ratio, TIERS[this.tier].dpr));
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.ground.scale.set(halfM * 2 + 80, halfM * 2 + 80, 1); // the field and C3's 40 m border
    this.place();
  }

  /** The boss's and Tối Thượng's layers read their events here from C8 and C11. */
  read(): void {}

  draw(): void {
    this.renderer.render(this.scene, this.camera);
  }

  project(x: number, z: number): { x: number; y: number } {
    const p = this.point.set(x, 0, z).project(this.camera);
    return { x: ((p.x + 1) / 2) * this.width, y: ((1 - p.y) / 2) * this.height };
  }

  unproject(px: number, py: number): { x: number; z: number } {
    this.ray.setFromCamera(this.ndc.set((px / this.width) * 2 - 1, 1 - (py / this.height) * 2), this.camera);
    const hit = this.ray.ray.intersectPlane(this.plane, this.point);
    return hit === null ? { x: this.target.x, z: this.target.z } : { x: hit.x, z: hit.z };
  }

  callAt(): number {
    return -1; // the map's call bubbles come with C10
  }

  keepOut(): Rect[] {
    return [];
  }

  /** Drags the ground under the pointer by `dx`, `dy` CSS px; the target stays on the field. */
  panBy(dx: number, dy: number): void {
    const metres = (2 * this.distance * Math.tan((CAMERA.fovDeg * Math.PI) / 360)) / this.height;
    this.target.x -= dx * metres;
    this.target.z -= (dy * metres) / Math.sin(CAMERA.pitch);
    this.place();
  }

  /** Zooms by `factor` (> 1 nearer) within 22–120 m, keeping the ground point under (px, py) where it is. */
  zoomAt(px: number, py: number, factor: number): void {
    const before = this.unproject(px, py);
    this.distance = clamp(this.distance / factor, CAMERA.nearM, CAMERA.farM);
    this.place();
    const after = this.unproject(px, py);
    this.target.x += before.x - after.x;
    this.target.z += before.z - after.z;
    this.place();
  }

  dispose(): void {
    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }

  /** The camera south of its target, looking north and down: screen right is +x, screen down is +z, as in 2D. */
  private place(): void {
    this.target.x = clamp(this.target.x, -this.halfM, this.halfM);
    this.target.z = clamp(this.target.z, -this.halfM, this.halfM);
    const { pitch } = CAMERA;
    this.camera.position.set(this.target.x, this.distance * Math.sin(pitch), this.target.z + this.distance * Math.cos(pitch));
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
}
