#!/usr/bin/env node
/**
 * 1C step C3 (docs/td/BUILD_1C_MAP1.md §5, §8): map 1's ground media from the accepted art (Codex 095 tiles, 097
 * decals) into public/assets/typing-defense/ground/, the files src/view/3d/ground.ts asks for:
 *   <tile>.high.webp 1024², <tile>.medium.webp 512² (seamless, 8 m a tile)
 *   ground-decals-<a|b>.high.webp 1024 × 512, .medium.webp 512 × 256 (4 × 2 cells of 4 m, alpha kept; 64 px/m is more than the
 *   closest zoom shows)
 * ImageMagick 7 (`magick`) does the work; media never goes in Git (the parent repo's `pnpm media:push`).
 *   node scripts/td/prepare-ground.mjs [--check]   (--check: list what is missing or stale, write nothing)
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const ART = join(ROOT, "art-src/scenery/meadow");
const OUT = join(ROOT, "public/assets/typing-defense/ground");
export const TILES = ["grass-a", "grass-b-clover", "dirt-road", "trail-worn", "stream-bank", "stone-yard"];
export const DECALS = ["ground-decals-a", "ground-decals-b"];
const SIZE = { tile: { high: "1024x1024", medium: "512x512" }, decal: { high: "1024x512", medium: "512x256" } };

const jobs = [
  ...TILES.flatMap((name) => ["high", "medium"].map((tier) => ({ src: join(ART, "ground", name + ".png"), out: join(OUT, `${name}.${tier}.webp`), size: SIZE.tile[tier], args: ["-quality", tier === "high" ? "86" : "82"] }))),
  ...DECALS.flatMap((name) => ["high", "medium"].map((tier) => ({ src: join(ART, "decals", name + ".alpha.png"), out: join(OUT, `${name}.${tier}.webp`), size: SIZE.decal[tier], args: ["-quality", "88", "-define", "webp:alpha-quality=100", "-define", "webp:exact=true"] }))),
];
const check = process.argv.includes("--check");
let problems = 0;
mkdirSync(OUT, { recursive: true });
for (const job of jobs) {
  if (!existsSync(job.src)) {
    console.error("missing source: " + job.src);
    problems += 1;
    continue;
  }
  const fresh = existsSync(job.out) && statSync(job.out).mtimeMs >= statSync(job.src).mtimeMs;
  if (check) {
    if (!fresh) (console.log("stale or missing: " + job.out), (problems += 1));
    continue;
  }
  if (fresh) continue;
  execFileSync("magick", [job.src, "-colorspace", "sRGB", "-filter", "Lanczos", "-resize", job.size + "!", ...job.args, job.out]);
  console.log(`${job.out.slice(ROOT.length + 1)}  ${(statSync(job.out).size / 1000).toFixed(0)} kB`);
}
process.exitCode = problems > 0 ? 1 : 0;
