import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { CAMERA, CameraRig, groundAt } from "../src/view/3d/camera";
import { projectToScreen } from "../src/view/3d/stage";

/**
 * 1C step C2 (docs/td/BUILD_1C_MAP1.md §8; TK 23.2, 23.6): map 1's RTS camera. A screen point taken down to the ground
 * and projected back lands within 0.5 px at 3 tilts × 4 headings; the default view gives TK 23.2's sizes; zoom keeps the
 * ground point under the pointer; pan stays on the field; Home and End are TK 23.6's views. Node only: no WebGL.
 */
const [W, H] = [1920, 1080];
const FORT = { x: 0, z: 40 };
function rig(): { camera: PerspectiveCamera; rig: CameraRig; settle(): void } {
  const camera = new PerspectiveCamera(38, W / H, 1, 900);
  const r = new CameraRig(camera, 48, FORT);
  const settle = () => {
    for (let step = 0; step < 80; step += 1) r.update(0.1, 0, W, H);
  };
  settle();
  return { camera, rig: r, settle };
}
const screenOf = (camera: PerspectiveCamera, x: number, y: number, z: number) => projectToScreen(camera, W, H, x, y, z);

describe("map 1's 3D camera (src/view/3d/camera.ts)", () => {
  it("takes a screen point to the ground and back within 0.5 px at 3 tilts × 4 headings", () => {
    let worst = 0;
    let points = 0;
    for (const pitch of [30, 55, 85]) {
      for (const yaw of [0, 90, 180, 270]) {
        const { camera, rig: r, settle } = rig();
        r.turn(yaw, pitch - r.pose.pitch);
        settle();
        expect([Math.round(r.pose.pitch), Math.round(r.pose.yaw)]).toEqual([pitch, yaw]);
        for (const fx of [0.05, 0.3, 0.5, 0.7, 0.95]) {
          for (const fy of [0.25, 0.5, 0.75, 0.95]) {
            const hit = groundAt(camera, W, H, fx * W, fy * H, new Vector3());
            if (hit === null) continue;
            const back = screenOf(camera, hit.x, 0, hit.z);
            worst = Math.max(worst, Math.hypot(back.x - fx * W, back.y - fy * H));
            points += 1;
          }
        }
      }
    }
    expect(points).toBeGreaterThan(200);
    expect(worst).toBeLessThan(0.5);
  });

  it("gives TK 23.2's sizes at the default view (55° at 58 m, 1080p): a 1.85 m soldier 24–30 px, the 8 m Fort 104–156 px", () => {
    const { camera, rig: r } = rig();
    expect([r.pose.pitch, r.pose.distance, r.pose.x, r.pose.z]).toEqual([55, 58, FORT.x, FORT.z - CAMERA.homeLeadM]);
    const tall = (m: number) => screenOf(camera, r.pose.x, 0, r.pose.z).y - screenOf(camera, r.pose.x, m, r.pose.z).y;
    expect(tall(1.85)).toBeGreaterThanOrEqual(24);
    expect(tall(1.85)).toBeLessThanOrEqual(30);
    expect(tall(8)).toBeGreaterThanOrEqual(104);
    expect(tall(8)).toBeLessThanOrEqual(156);
    // The Fort itself is in the view, in its lower half.
    const fort = screenOf(camera, FORT.x, 0, FORT.z);
    expect(fort.visible).toBe(true);
    expect(fort.y).toBeGreaterThan(H / 2);
  });

  it("zooms 22–120 m and keeps the ground point under the pointer within 0.5 m", () => {
    const { camera, rig: r, settle } = rig();
    const [px, py] = [W * 0.8, H * 0.3];
    const before = groundAt(camera, W, H, px, py, new Vector3())!;
    r.zoomTowards(1.6, before.x, before.z);
    settle();
    const after = groundAt(camera, W, H, px, py, new Vector3())!;
    expect(r.pose.distance).toBeCloseTo(58 / 1.6, 1);
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeLessThan(0.5);
    for (let i = 0; i < 20; i += 1) r.zoomTowards(2, 0, 0);
    settle();
    expect(r.pose.distance).toBeCloseTo(CAMERA.nearM, 3);
    for (let i = 0; i < 20; i += 1) r.zoomTowards(0.5, 0, 0);
    settle();
    expect(r.pose.distance).toBeCloseTo(CAMERA.farM, 3);
  });

  it("pans along the heading and stays within the field and its margin", () => {
    const { rig: r, settle } = rig();
    r.turn(90, 0);
    r.pan(10, 0); // right of a camera looking west is north
    settle();
    expect(r.pose.z).toBeCloseTo(FORT.z - CAMERA.homeLeadM - 10, 3);
    r.pan(0, -500);
    r.pan(500, 0);
    settle();
    expect(Math.max(Math.abs(r.pose.x), Math.abs(r.pose.z))).toBeLessThanOrEqual(48 + CAMERA.panMarginM + 1e-9);
  });

  it("End is 85° at 100 m, Home the default view and heading again; tilt stays within 30–85°", () => {
    const { rig: r, settle } = rig();
    r.turn(200, 60);
    settle();
    expect(r.pose.pitch).toBe(CAMERA.pitchMaxDeg);
    r.view("overview");
    settle();
    expect([Math.round(r.pose.pitch), Math.round(r.pose.distance)]).toEqual([85, 100]);
    r.view("home");
    settle();
    expect([Math.round(r.pose.pitch), Math.round(r.pose.distance), Math.round(((r.pose.yaw % 360) + 360) % 360)]).toEqual([55, 58, 0]);
    r.turn(0, -90);
    settle();
    expect(r.pose.pitch).toBe(CAMERA.pitchMinDeg);
  });
});
