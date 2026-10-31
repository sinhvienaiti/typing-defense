/**
 * The RTS camera of map 1 (1C step C2, TK 23.6): it looks at a point of the field from a heading, a tilt and a distance,
 * all eased. Default 55° at 58 m on the Fort's side of the field; zoom 22–120 m about the pointer; a left or middle
 * drag pans (app/input.ts), a right drag turns and tilts 30–85°; arrows pan, Shift + arrows turn and tilt; Home the
 * default view, PageDown a close low view, End "Toàn cảnh" 85° at 100 m. It never moves by itself. The shake (≤ 6 px, 120 ms)
 * shifts the projection only, so the word cards projected through the stage stay still. No DOM: the page feeds it.
 * Adapted from games/dragon-hold@02fe9c7 src/view/camera.ts (eased goal and now, the yaw kept unwrapped, pan along the
 * heading, the projection shift), with TK 23.6's limits in metres and a plain shake (this game's kit has no feedback).
 */
import { Plane, Raycaster, Vector2, Vector3, type PerspectiveCamera } from "three";
import { clamp } from "../../kit/three/util";

const GROUND = new Plane(new Vector3(0, 1, 0), 0);
const ray = new Raycaster();
const ndc = new Vector2();
/** The ground point (y = 0) under the CSS point (px, py) of a `width` × `height` view, null when the ray misses it. */
export function groundAt(camera: PerspectiveCamera, width: number, height: number, px: number, py: number, out = new Vector3()): Vector3 | null {
  ray.setFromCamera(ndc.set((px / width) * 2 - 1, 1 - (py / height) * 2), camera);
  return ray.ray.intersectPlane(GROUND, out);
}

export const CAMERA = {
  pitchMinDeg: 30, pitchMaxDeg: 85, nearM: 22, farM: 120,
  /** Home (TK 23.6), PageDown (đề xuất C2: close and low, to read a house), End "Toàn cảnh". */
  views: { home: { pitchDeg: 55, distanceM: 58 }, near: { pitchDeg: 40, distanceM: 30 }, overview: { pitchDeg: 85, distanceM: 100 } },
  /** The default look point lies this far towards the field's middle from the Fort, so the Fort sits in the view's lower third. */
  homeLeadM: 12,
  panMarginM: 8, turnDegPerPx: 0.3, tiltDegPerPx: 0.22, turnStepDeg: 15, tiltStepDeg: 5,
  /** Easing rate, 1/s; the shake's size and length (TK 23.6). */
  ease: 9, shakePx: 6, shakeMs: 120,
} as const;

export type ViewName = keyof typeof CAMERA.views;
type Pose = { yaw: number; pitch: number; distance: number; x: number; z: number };
const DEG = Math.PI / 180;

export class CameraRig {
  /** What it eases toward, and where it is. */
  private readonly goal: Pose;
  private readonly now: Pose;
  private readonly home: Pose;
  private shakeUntil = -1;
  private shakeSize = 0;

  constructor(private readonly camera: PerspectiveCamera, private readonly halfM: number, fort: { x: number; z: number }) {
    const lead = fort.z > 0 ? -CAMERA.homeLeadM : CAMERA.homeLeadM;
    this.home = { yaw: 0, pitch: CAMERA.views.home.pitchDeg, distance: CAMERA.views.home.distanceM, x: fort.x, z: fort.z + lead };
    this.goal = { ...this.home };
    this.now = { ...this.home };
  }

  get pose(): Readonly<Pose> {
    return this.now;
  }

  /** Metres per CSS px at the look point, for a view `height` px tall. */
  metresPerPx(height: number): number {
    return (2 * this.now.distance * Math.tan((this.camera.fov * DEG) / 2)) / Math.max(1, height);
  }

  /** Moves the look point `right` and `back` metres as seen from the camera, within the field and its margin. */
  pan(right: number, back: number): void {
    const yaw = this.goal.yaw * DEG;
    const reach = this.halfM + CAMERA.panMarginM;
    this.goal.x = clamp(this.goal.x + right * Math.cos(yaw) + back * Math.sin(yaw), -reach, reach);
    this.goal.z = clamp(this.goal.z - right * Math.sin(yaw) + back * Math.cos(yaw), -reach, reach);
  }

  turn(yawDeg: number, pitchDeg: number): void {
    this.goal.yaw += yawDeg;
    this.goal.pitch = clamp(this.goal.pitch + pitchDeg, CAMERA.pitchMinDeg, CAMERA.pitchMaxDeg);
  }

  /** Zooms by `factor` (> 1 nearer) towards the ground point (x, z) under the pointer, which stays under it. */
  zoomTowards(factor: number, x: number, z: number): void {
    const distance = clamp(this.goal.distance / factor, CAMERA.nearM, CAMERA.farM);
    const k = 1 - distance / this.goal.distance;
    this.goal.distance = distance;
    this.goal.x += (x - this.goal.x) * k;
    this.goal.z += (z - this.goal.z) * k;
    this.pan(0, 0);
  }

  /** Home, PageDown, End: a named tilt and distance over the default look point (home also the default heading); `snap` skips the easing. */
  view(name: ViewName, snap = false): void {
    const { pitchDeg, distanceM } = CAMERA.views[name];
    Object.assign(this.goal, { pitch: pitchDeg, distance: distanceM });
    if (name === "home") Object.assign(this.goal, { x: this.home.x, z: this.home.z, yaw: this.goal.yaw + (((((-this.goal.yaw) % 360) + 540) % 360) - 180) });
    if (snap) Object.assign(this.now, this.goal);
  }

  /** The edge tray's click (C10): the look point glides to (x, z) in `ms` (0.45 s), eased in and out. */
  glide(x: number, z: number, ms: number, nowMs: number): void {
    const reach = this.halfM + CAMERA.panMarginM;
    this.gliding = { x: this.now.x, z: this.now.z, at: nowMs, ms };
    [this.goal.x, this.goal.z] = [clamp(x, -reach, reach), clamp(z, -reach, reach)];
  }

  private gliding: { x: number; z: number; at: number; ms: number } | null = null;

  /** A shake of `pixels` (≤ 6), fading over 120 ms from `nowMs`. */
  shake(pixels: number, nowMs: number): void {
    this.shakeSize = Math.max(this.shakeSize, clamp(pixels, 0, CAMERA.shakePx));
    this.shakeUntil = nowMs + CAMERA.shakeMs;
  }

  /** Eases `dt` s and places the camera; `width`, `height` CSS px for the shake. */
  update(dt: number, nowMs: number, width: number, height: number): void {
    const k = 1 - Math.exp(-clamp(dt, 0, 0.1) * CAMERA.ease);
    for (const key of ["yaw", "pitch", "distance", "x", "z"] as const) this.now[key] += (this.goal[key] - this.now[key]) * k;
    const glide = this.gliding;
    if (glide !== null) {
      const t = clamp((nowMs - glide.at) / glide.ms, 0, 1);
      const e = t * t * (3 - 2 * t);
      [this.now.x, this.now.z] = [glide.x + (this.goal.x - glide.x) * e, glide.z + (this.goal.z - glide.z) * e];
      if (t >= 1) this.gliding = null;
    }
    const { yaw, pitch, distance, x, z } = this.now;
    const flat = Math.cos(pitch * DEG) * distance;
    this.camera.position.set(x + Math.sin(yaw * DEG) * flat, Math.sin(pitch * DEG) * distance, z + Math.cos(yaw * DEG) * flat);
    this.camera.lookAt(x, 0, z);
    this.camera.updateMatrixWorld();
    this.camera.updateProjectionMatrix();
    const left = this.shakeUntil - nowMs;
    if (left > 0) {
      const size = (this.shakeSize * left) / CAMERA.shakeMs;
      const [ox, oy] = [Math.sin(nowMs * 0.09) * size, Math.cos(nowMs * 0.11) * size];
      this.camera.projectionMatrix.elements[8] = (-2 * ox) / Math.max(1, width);
      this.camera.projectionMatrix.elements[9] = (2 * oy) / Math.max(1, height);
      this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    } else this.shakeSize = 0;
  }
}
