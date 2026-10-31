import { PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import { CameraRig } from "../src/view/3d/camera";
import { besidePanels, lanesTouch, spreadLanes } from "../src/view/words/lanes";

/**
 * C10 round 3 (docs/td/BUILD_NOTES.md §8.13): the edge tray's click glides the camera to a call's house in 0.45 s, eased in
 * and out; a column a panel pushed past the 240 px push still parts from its neighbour, so the cards keep off the HUD at
 * every zoom instead of falling back to "over the panel".
 */
describe("C10 round 3", () => {
  it("glides the look point to the tray's house in 0.45 s, eased", () => {
    const rig = new CameraRig(new PerspectiveCamera(38, 16 / 9, 1, 900), 48, { x: 0, z: 40 });
    for (let k = 0; k < 80; k += 1) rig.update(0.1, 0, 1920, 1080);
    const from = { x: rig.pose.x, z: rig.pose.z };
    rig.glide(-30, -20, 450, 1000);
    rig.update(0.016, 1000 + 112, 1920, 1080);
    const quarter = Math.hypot(rig.pose.x - from.x, rig.pose.z - from.z) / Math.hypot(-30 - from.x, -20 - from.z);
    expect(quarter).toBeGreaterThan(0.1);
    expect(quarter).toBeLessThan(0.25); // eased in: a quarter of the time, a sixth of the way
    rig.update(0.016, 1000 + 450, 1920, 1080);
    expect(rig.pose.x).toBeCloseTo(-30, 5);
    expect(rig.pose.z).toBeCloseTo(-20, 5);
  });

  it("parts two columns a top-left panel pushed past the 240 px push, both clear of the panel", () => {
    const panel = { left: 10, top: 10, right: 293, bottom: 140 };
    const boxes = [{ x: 24, top: 60, bottom: 120, half: 95 }, { x: 187, top: 70, bottom: 130, half: 90 }].map((b) => besidePanels(b, [panel], 640));
    const out = spreadLanes(boxes, 8, 1272, []);
    expect(lanesTouch(boxes, out)).toBe(false);
    boxes.forEach((b, i) => expect(b.x + out[i]! - b.half).toBeGreaterThanOrEqual(panel.right));
  });
});
