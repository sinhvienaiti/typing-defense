/**
 * The 3D view of map 1 (1C, docs/td/BUILD_1C_MAP1.md §7): the chunk view.ts loads, with three.js. It assembles the parts
 * under src/view/3d (C2: the stage and the RTS camera; C3: the ground, the stream and the bridges; C6: the houses and the
 * landmarks; C10: the word cards' anchors and their typing feel, words.ts) on a canvas
 * of its own over the 2D one, and answers the page as a MapView: project and unproject through the camera, the pointer's
 * pan, turn and zoom, the views (Home, PageDown, End). It reads the world and never changes it. `open` gives null without WebGL (the page keeps
 * 2D); a lost context calls `lost`.
 */
import * as THREE from "three";
import type { RareEvent } from "../../sim/events";
import type { World } from "../../sim/world";
import type { CameraView, Hand, MapView } from "../view";
import type { WordCards } from "../words/cards";
import type { Rect } from "../words/lanes";
import { CAMERA, CameraRig, groundAt } from "./camera";
import { createGround, type Ground } from "./ground";
import { Houses } from "./houses";
import { createStage, type Stage, type Tier3D } from "./stage";
import { WordFeel } from "./words";

const DEG = Math.PI / 180;

export class View3D implements MapView {
  readonly kind = "3d";
  private readonly ground: Ground;
  private readonly houses: Houses;
  private readonly rig: CameraRig;
  private readonly words: WordFeel;
  private readonly bridgeEnds: (readonly [number, number])[];
  /** The ground's lanes (td-1c-road probes their cross-sections). */
  private readonly lanes: World["lanes"];
  private readonly hit = new THREE.Vector3();
  private last = -1;

  /** A canvas after `after` for the world's map, or null when the browser gives no WebGL 2 context; `cards` feel the keys there. */
  static open(after: HTMLElement, tier: Tier3D, w: World, lost: () => void, cards: WordCards): View3D | null {
    const canvas = document.createElement("canvas");
    canvas.id = "tdCanvas3d";
    canvas.setAttribute("aria-label", "Map");
    try {
      const stage = createStage(canvas, tier, w.map.halfM);
      after.after(canvas);
      return new View3D(stage, w, lost, cards);
    } catch (error) {
      console.warn("typing defense: no WebGL, the map stays 2D", error);
      return null;
    }
  }

  private constructor(private readonly stage: Stage, w: World, lost: () => void, private readonly cards: WordCards) {
    this.canvas.addEventListener("webglcontextlost", (event) => (event.preventDefault(), lost()));
    const [x, z] = w.map.keep;
    this.rig = new CameraRig(stage.camera, w.map.halfM, { x, z });
    this.rig.view("home", true);
    this.lanes = w.lanes.slice(0, -1); // the last lane is the fly route
    this.ground = createGround(stage.layers.ground, w.map, this.lanes, stage.tier, stage.renderer);
    this.houses = new Houses(stage.layers.actors, w.map, stage.tier);
    this.bridgeEnds = w.map.bridges.flatMap((r) => [[r.x0 - 1.5, (r.z0 + r.z1) / 2] as const, [r.x1 + 1.5, (r.z0 + r.z1) / 2] as const]);
    this.words = new WordFeel(stage, this.houses, w.map);
    stage.overlay(this.words.pool.scene);
    cards.feel = this.words;
  }

  get canvas(): HTMLCanvasElement {
    return this.stage.renderer.domElement;
  }

  resize(cssWidth: number, cssHeight: number, ratio: number): void {
    this.stage.resize(cssWidth, cssHeight, ratio);
    this.place(performance.now(), 0);
  }

  /** The chain's steps (C10); the boss's and Tối Thượng's layers read their events here from C8 and C11. */
  read(events: readonly RareEvent[], w: World, now: number): void {
    this.words.read(events, w, now);
  }

  draw(w: World, hand: Hand): void {
    const now = performance.now();
    this.houses.update(w, hand, now);
    const dt = this.last < 0 ? 0 : (now - this.last) / 1000;
    this.place(now, dt);
    this.last = now;
    this.ground.update(now / 1000, w);
    this.words.update(w, now, Math.min(0.1, dt));
    this.stage.render();
  }

  project(x: number, z: number): { x: number; y: number } {
    return this.stage.project(x, 0, z);
  }

  /** Call c's card anchor, 0.6 m over its house's FX_top (`core`: its FX_core), through the camera (C10). */
  anchor(w: World, c: number, core: boolean): { x: number; y: number } {
    return this.words.anchor(w, c, core);
  }

  unproject(px: number, py: number): { x: number; z: number } {
    const { width, height } = this.stage.size;
    const hit = groundAt(this.stage.camera, width, height, px, py, this.hit);
    return hit === null ? { x: this.rig.pose.x, z: this.rig.pose.z } : { x: hit.x, z: hit.z };
  }

  callAt(): number {
    return -1; // the map's call bubbles come with C10
  }

  /** A click on a card in the edge tray glides the camera to its house in 0.45 s (C10); false when no tray card is there. */
  tray(px: number, py: number): boolean {
    const hit = this.words.trayHit(px, py);
    const at = this.words.trayCall(hit >= 0 ? hit : this.cards.callAt(px, py));
    if (at !== null) this.rig.glide(at.x, at.z, 450, performance.now());
    return at !== null;
  }

  keepOut(): Rect[] {
    return [];
  }

  /** Drags the ground under the pointer by `dx`, `dy` CSS px. */
  panBy(dx: number, dy: number): void {
    const metres = this.rig.metresPerPx(this.stage.size.height);
    this.rig.pan(-dx * metres, (-dy * metres) / Math.max(0.5, Math.sin(this.rig.pose.pitch * DEG)));
  }

  /** A right drag of `dx`, `dy` CSS px turns the heading and tilts (Shift + arrows send 50 and 23 px: 15° and 5°). */
  turn(dx: number, dy: number): void {
    this.rig.turn(-dx * CAMERA.turnDegPerPx, dy * CAMERA.tiltDegPerPx);
  }

  zoomAt(px: number, py: number, factor: number): void {
    const { x, z } = this.unproject(px, py);
    this.rig.zoomTowards(factor, x, z);
  }

  look(name: CameraView): void {
    this.rig.view(name);
  }

  stats(): Record<string, number | string> {
    const { yaw, pitch, distance, x, z } = this.rig.pose;
    // Where the road's junctions, bends and bridge ends are on screen (scenario td-1c-road crops and zooms there).
    const at = ([x, z]: readonly [number, number]): number[] => ((p) => [Math.round(p.x), Math.round(p.y)])(this.stage.project(x, 0, z));
    const { junctions, bends } = this.ground.road;
    // PATH_QUALITY §5 numbers: every 24th lane point on screen, its centre, its half width, and a cross-section from 1 m inside
    // the edge to 2.6 m past it every 0.2 m (screen points), so the scenario reads core − grass luma and the transition's width.
    const probes = this.lanes.flatMap((lane, l) => [...lane.xs].flatMap((x0, i) => {
      if (i % 24 !== 12 || i + 1 >= lane.xs.length) return [];
      const [z0, half] = [lane.zs[i]!, this.ground.road.widths[l]![i]!];
      const th = Math.atan2(lane.zs[i + 1]! - z0, lane.xs[i + 1]! - x0);
      const across = Array.from({ length: 19 }, (_, k) => at([x0 - Math.sin(th) * (half - 1 + 0.2 * k), z0 + Math.cos(th) * (half - 1 + 0.2 * k)]));
      return [{ c: at([x0, z0]), half: +half.toFixed(2), across }];
    }));
    const roads = { junctions: junctions.map(at), bends: bends.map(at), bridges: this.bridgeEnds.map(at), dressing: this.ground.dressing.count(), probes };
    return { kind: this.kind, tier: this.stage.tier, ...this.stage.stats(), ...this.words.stats(), yaw, pitch, distance, x, z, houses: JSON.stringify(this.houses.report()), roads: JSON.stringify(roads) };
  }

  dispose(): void {
    this.cards.feel = null;
    this.words.dispose();
    this.ground.dispose();
    this.stage.dispose();
    this.canvas.remove();
  }

  private place(now: number, dt: number): void {
    this.rig.update(dt, now, this.stage.size.width, this.stage.size.height);
  }
}
