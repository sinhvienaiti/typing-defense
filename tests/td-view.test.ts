import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MAPS_3D, pickView } from "../src/view/view";
import { blank } from "./td/source-scan";

/**
 * 1C step C1 (docs/td/BUILD_1C_MAP1.md §2, §4, §8): the page draws through MapView; the tier and the view come from the
 * link (Low, the 2D view, by default until C13); three.js stays in the 3D view's chunk, which only view.ts's import()
 * reaches, so no start page's set can hold it.
 */
const ROOT = join(__dirname, "..");
const files = (dir: string): string[] =>
  readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = dir + "/" + name;
    return statSync(join(ROOT, path)).isDirectory() ? files(path) : path.endsWith(".ts") ? [path] : [];
  });
const code = (path: string): string => blank(readFileSync(join(ROOT, path), "utf8"), false);
/** Value imports (`import type` is erased) and re-exports, with what they name. */
const imports = (path: string): string[] => [...code(path).matchAll(/\b(?:import|export)\s+(?!type\b)(?!["'(])[^"';()=]*?\s*from\s*["']([^"']+)["']/g)].map((m) => m[1]!);

describe("1C: the view the page draws (src/view/view.ts pickView)", () => {
  const pick = (query: string, stage = MAPS_3D[0]!) => pickView(new URLSearchParams(query), stage);

  it("draws 2D by default and at Low, 3D at Medium and High or with ?view=3d", () => {
    expect(pick("")).toEqual({ tier: "low", kind: "2d" });
    expect(pick("?q=low")).toEqual({ tier: "low", kind: "2d" });
    expect(pick("?q=medium")).toEqual({ tier: "medium", kind: "3d" });
    expect(pick("?q=high")).toEqual({ tier: "high", kind: "3d" });
    expect(pick("?view=3d")).toEqual({ tier: "medium", kind: "3d" });
    expect(pick("?view=3d&q=low")).toEqual({ tier: "medium", kind: "3d" });
    expect(pick("?view=3d&q=high")).toEqual({ tier: "high", kind: "3d" });
  });

  it("keeps 2D when asked, for a tier it does not know and for a stage the 3D view does not draw", () => {
    expect(pick("?view=2d&q=high")).toEqual({ tier: "low", kind: "2d" });
    expect(pick("?q=ultra")).toEqual({ tier: "low", kind: "2d" });
    expect(pick("?q=high", "w2-other")).toEqual({ tier: "low", kind: "2d" });
    expect(pickView(new URLSearchParams(""), MAPS_3D[0]!, "medium")).toEqual({ tier: "medium", kind: "3d" }); // C13's default
    expect(MAPS_3D).toEqual(["w1-silverfall"]);
  });
});

describe("1C: three.js only in the 3D view's chunk (BUILD_1C_MAP1 §4)", () => {
  const game = files("src").filter((path) => !path.startsWith("src/kit/"));

  it("imports three only under src/view/3d/ (and the kit's three module)", () => {
    const three = game.filter((path) => imports(path).some((spec) => spec === "three" || spec.startsWith("three/")));
    expect(three.length).toBeGreaterThan(0);
    expect(three.filter((path) => !path.startsWith("src/view/3d/"))).toEqual([]);
    const kit = game.filter((path) => imports(path).some((spec) => /kit\/three/.test(spec)));
    expect(kit.filter((path) => !path.startsWith("src/view/3d/"))).toEqual([]);
  });

  it("reaches src/view/3d/ from outside only through view.ts's import()", () => {
    const outside = game.filter((path) => !path.startsWith("src/view/3d/"));
    expect(outside.filter((path) => imports(path).some((spec) => /(^|\/)3d\//.test(spec)))).toEqual([]);
    const lazy = outside.filter((path) => /\bimport\(\s*["'][^"']*\b3d\//.test(code(path)));
    expect(lazy).toEqual(["src/view/view.ts"]);
  });

  it("main.ts calls only MapView's members on the view it draws through", () => {
    const members = new Set(["kind", "resize", "read", "draw", "project", "anchor", "unproject", "callAt", "keepOut", "panBy", "zoomAt", "turn", "look", "stats", "tray"]);
    const used = [...code("src/main.ts").matchAll(/\bview\.(\w+)/g)].map((m) => m[1]!);
    expect(used.length).toBeGreaterThan(8);
    expect(used.filter((name) => !members.has(name))).toEqual([]);
    expect(code("src/main.ts")).not.toMatch(/new View3D|from "\.\/view\/3d\//);
  });
});
