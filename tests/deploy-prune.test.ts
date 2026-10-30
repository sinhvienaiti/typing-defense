import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = resolve("scripts/deploy/prune.mjs");
const prefix = "/assets/typing-defense/models/";
function snapshot(dir: string): Record<string, string> {
  return Object.fromEntries(readdirSync(dir, { withFileTypes: true }).flatMap((item): [string, string][] => {
    const path = join(dir, item.name);
    return item.isDirectory() ? Object.entries(snapshot(path)).map(([name, data]) => [item.name + "/" + name, data]) : [[item.name, readFileSync(path).toString("base64")]];
  }));
}
function fixture(run: (f: { dir: string; dist: string; models: string; manifest: Record<string, unknown>; prune: (keys: string[]) => ReturnType<typeof spawnSync> }) => void, url = prefix + "buildings/keep/high.glb?v=hash") {
  mkdirSync("tmp", { recursive: true });
  const dir = mkdtempSync("tmp/deploy-prune-");
  const dist = join(dir, "dist");
  const models = join(dist, "assets/typing-defense/models");
  const manifest = { version: 1, generatedAt: "fixture", models: {
    "buildings/keep": { kind: "buildings", id: "keep", extra: [1, 2], tiers: { high: { url, bytes: 4 }, medium: { url: prefix + "buildings/keep/medium.glb?v=hash", bytes: 6 } } },
    "units/other": { tiers: { high: { url: prefix + "units/other/high.glb" } } },
  } };
  try {
    mkdirSync(join(models, "buildings/keep"), { recursive: true });
    mkdirSync(join(models, "units/other"), { recursive: true });
    mkdirSync(join(dist, ".vite"));
    mkdirSync(join(dir, "public"));
    writeFileSync(join(dir, "public/manifest.json"), JSON.stringify(manifest));
    writeFileSync(join(dist, "index.html"), "game");
    writeFileSync(join(dist, "keep.txt"), "keep");
    writeFileSync(join(dist, ".vite/manifest.json"), "{}");
    writeFileSync(join(models, "manifest.json"), JSON.stringify(manifest));
    writeFileSync(join(models, "buildings/keep/high.glb"), "high");
    writeFileSync(join(models, "buildings/keep/medium.glb"), "medium");
    writeFileSync(join(models, "units/other/high.glb"), "other");
    const publicBefore = snapshot(join(dir, "public"));
    run({ dir, dist, models, manifest, prune: (keys) => {
      mkdirSync(join(dir, "scripts/deploy"), { recursive: true });
      copyFileSync(script, join(dir, "scripts/deploy/prune.mjs"));
      writeFileSync(join(dir, "deploy-models.json"), JSON.stringify({ models: keys }));
      return spawnSync(process.execPath, [join(dir, "scripts/deploy/prune.mjs"), dist], { encoding: "utf8" });
    } });
    expect(snapshot(join(dir, "public"))).toEqual(publicBefore);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

describe("deployment model pruning", () => {
  it("removes all models and Vite metadata for an empty list", () => fixture((f) => {
    const result = f.prune([]);
    expect(result.status, String(result.stderr)).toBe(0);
    expect(existsSync(f.models)).toBe(false);
    expect(existsSync(join(f.dist, ".vite"))).toBe(false);
    expect(snapshot(f.dist)).toEqual({ "index.html": Buffer.from("game").toString("base64"), "keep.txt": Buffer.from("keep").toString("base64") });
    expect(String(result.stdout).trim().split("\n")).toHaveLength(1);
    expect(result.stdout).toMatch(/5 files, \d+ bytes.*\[\]/);
  }));
  it("keeps every tier and metadata of only the selected model", () => fixture((f) => {
    const result = f.prune(["buildings/keep"]);
    expect(result.status, String(result.stderr)).toBe(0);
    expect(Object.keys(snapshot(f.models)).sort()).toEqual(["buildings/keep/high.glb", "buildings/keep/medium.glb", "manifest.json"]);
    expect(JSON.parse(readFileSync(join(f.models, "manifest.json"), "utf8"))).toEqual({ ...f.manifest, models: { "buildings/keep": (f.manifest.models as Record<string, unknown>)["buildings/keep"] } });
    expect(existsSync(join(f.dist, ".vite"))).toBe(false);
    expect(result.stdout).toContain("buildings/keep");
  }));
  it("rejects unknown keys without any deletion", () => fixture((f) => {
    const before = snapshot(f.dist);
    const result = f.prune(["missing/model"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/missing\/model/);
    expect(snapshot(f.dist)).toEqual(before);
  }));
  it.each(["/assets/outside.glb", prefix + "../escape.glb", "https://outside.example" + prefix + "keep.glb", prefix + "%2e%2e/escape.glb", prefix + "..%2fescape.glb"])("rejects escaping URL %s before deleting", (url) => fixture((f) => {
    const before = snapshot(f.dist);
    const result = f.prune(["buildings/keep"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/buildings\/keep/);
    expect(snapshot(f.dist)).toEqual(before);
  }, url));
  it("succeeds without models and still removes Vite metadata", () => fixture((f) => {
    rmSync(f.models, { recursive: true });
    const result = f.prune(["buildings/keep"]);
    expect(result.status, String(result.stderr)).toBe(0);
    expect(existsSync(join(f.dist, ".vite"))).toBe(false);
    expect(readFileSync(join(f.dist, "keep.txt"), "utf8")).toBe("keep");
  }));
  it("refuses a directory without index.html", () => fixture((f) => {
    rmSync(join(f.dist, "index.html"));
    const before = snapshot(f.dist);
    const result = f.prune([]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/index.html/);
    expect(snapshot(f.dist)).toEqual(before);
  }));
  it("refuses a symlink before deleting anything", () => fixture((f) => {
    symlinkSync(resolve(f.dir, "public"), join(f.models, "linked"));
    const result = f.prune([]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/symlink/i);
    expect(existsSync(join(f.dist, ".vite"))).toBe(true);
    expect(existsSync(join(f.models, "manifest.json"))).toBe(true);
  }));
});
