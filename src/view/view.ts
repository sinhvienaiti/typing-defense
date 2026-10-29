/**
 * The map view main.ts draws the world through (1C, docs/td/BUILD_1C_MAP1.md §2, §7). The 2D debug view (debug-2d.ts)
 * is the Low tier and the fallback; the 3D view (3d/view-3d.ts, map 1 on Medium and High) is a chunk of its own with
 * three.js, reached only through `load3d`, so it is never in a start page's set (scripts/bundle-budget.mjs).
 */
import type { RareEvent } from "../sim/events";
import type { World } from "../sim/world";
import type { Rect } from "./words/lanes";

/** The player's hand (app/selection.ts): the selected agent, the building and the dim call in focus by id, the build menu's kind and ghost. */
export type Hand = { agent: number; focus: number; call: number; kind: number; ghost(): { x: number; z: number; reason: string } | null };

export interface MapView {
  readonly kind: "2d" | "3d";
  /** Fits the field between the `top` CSS px the boss bar keeps and the `bottom` px the word strip keeps. */
  resize(cssWidth: number, cssHeight: number, ratio: number, halfM: number, bottom: number, top?: number): void;
  /** This frame's rare events (the boss, Tối Thượng, direct calls). */
  read(events: readonly RareEvent[], w: World, now: number): void;
  draw(w: World, hand: Hand): void;
  /** Screen point (CSS px) of a ground point. */
  project(x: number, z: number): { x: number; y: number };
  /** 3D only (C10): where call c's word cards stand, over its house's FX_top (`core`: where its letters fly). */
  anchor?(w: World, c: number, core: boolean): { x: number; y: number };
  /** The ground point under a screen point (CSS px). */
  unproject(px: number, py: number): { x: number; z: number };
  /** 3D only (C10): a click on an edge tray card glides the camera there; whether one was hit. */
  tray?(px: number, py: number): boolean;
  /** The call whose bubble on the map is under the CSS point, −1 none. */
  callAt(px: number, py: number): number;
  /** Where the action is (CSS px), which the word cards keep off. */
  keepOut(w: World): Rect[];
  panBy(dx: number, dy: number): void;
  zoomAt(px: number, py: number, factor: number): void;
  /** 3D only: a right drag or Shift + arrows turn the heading and tilt (CSS px). */
  turn?(dx: number, dy: number): void;
  /** 3D only: F1–F3 (TK 23.6). */
  look?(name: CameraView): void;
  /** What the view drew last frame and where its camera is (__td.view()). */
  stats?(): Record<string, number | string>;
}

/** F1 the default view, F2 a close low one, F3 "Toàn cảnh" (TK 23.6). */
export type CameraView = "home" | "near" | "overview";

export type Tier = "low" | "medium" | "high";
/** The stages the 3D view draws (1C: map 1 only). */
export const MAPS_3D: readonly string[] = ["w1-silverfall"];
const TIERS: readonly string[] = ["low", "medium", "high"];

/**
 * The view and tier a page draws: ?view=2d|3d, else by the tier ?q=low|medium|high (Low is 2D). The default stays Low
 * until C13 makes Medium the first play's; 3D asked at Low draws Medium; a stage the 3D view does not draw keeps 2D.
 */
export function pickView(params: URLSearchParams, stage: string, fallback: Tier = "low"): { tier: Tier; kind: "2d" | "3d" } {
  const q = params.get("q") ?? "";
  const asked = params.get("view");
  const tier = TIERS.includes(q) ? (q as Tier) : fallback;
  const kind = (asked === "2d" || asked === "3d" ? asked : tier === "low" ? "2d" : "3d") === "3d" && MAPS_3D.includes(stage) ? "3d" : "2d";
  return { tier: kind === "2d" ? "low" : tier === "low" ? "medium" : tier, kind };
}

/** The 3D view's chunk (three.js rides in it). */
export const load3d = (): Promise<typeof import("./3d/view-3d")> => import("./3d/view-3d");
