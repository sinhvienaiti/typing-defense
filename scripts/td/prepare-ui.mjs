#!/usr/bin/env node
/** Accepted UI art only: crop, alpha trim/pad and downsize. Never overwrite existing media. */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "../..");
const ART = join(ROOT, "art-src/ui");
const OUT = join(ROOT, "public/assets/typing-defense/ui");

/** Pure plan: dimensions are measured from the accepted sources, not dependent on media being installed. */
export function plan(picks) {
  const files = new Set();
  return picks.filter((pick) => pick.accepted === true).flatMap((pick) => {
    if (!pick.verdict || pick.verdict.M < 8 || pick.verdict.Q < 8) throw new Error("Missing acceptance: " + pick.name);
    if (pick.source.includes("..") || pick.source.startsWith("/")) throw new Error("Invalid source");
    const crop = pick.crop;
    if (!["none", "crop", "trim-alpha"].includes(crop.mode)) throw new Error("Invalid crop");
    if (crop.width > pick.sourceSize[0] || crop.height > pick.sourceSize[1]) throw new Error("Crop exceeds source");
    const inputWidth = crop.padSquare ? Math.max(crop.width, crop.height) : crop.width;
    const inputHeight = crop.padSquare ? inputWidth : crop.height;
    return pick.outputs.map((output) => {
      if (output.file !== basename(output.file) || !/^[a-z0-9.-]+\.(webp|png)$/.test(output.file) || files.has(output.file)) throw new Error("Invalid or duplicate output");
      files.add(output.file);
      if (![output.width, output.height].every((n) => Number.isInteger(n) && n > 0)) throw new Error("Invalid size");
      if (output.width > inputWidth || output.height > inputHeight) throw new Error("Cannot enlarge " + output.file);
      if (Math.abs(output.height - output.width * inputHeight / inputWidth) > 0.5) throw new Error("Aspect ratio changed");
      return { name: pick.name, source: pick.source, sourceSize: pick.sourceSize, crop, inputWidth, inputHeight, alpha: pick.alpha, ...output };
    });
  });
}

function main() {
  const magick = process.env.ART_MAGICK || "magick";
  const jobs = plan(JSON.parse(readFileSync(join(ROOT, "scripts/td/ui-picks.json"), "utf8")));
  const check = process.argv.includes("--check");
  let problems = 0, written = 0;
  // Validate the entire set before writing; stale existing files require an owner decision, never an overwrite.
  const pending = [];
  for (const job of jobs) {
    const src = join(ART, job.source), out = join(OUT, job.file);
    if (!existsSync(src)) { console.error("missing source: " + src); problems++; continue; }
    const present = existsSync(out);
    const fresh = present && statSync(out).mtimeMs >= statSync(src).mtimeMs;
    if (fresh) continue;
    if (check) { console.error("stale or missing: " + out); problems++; continue; }
    if (present) { console.error("refusing to overwrite stale media: " + out); problems++; continue; }
    pending.push({ ...job, src, out });
  }
  if (problems || check) { process.exitCode = problems ? 1 : 0; return; }
  for (const job of pending) {
    const actual = execFileSync(magick, ["identify", "-format", "%w %h", job.src], { encoding: "utf8" }).trim();
    if (actual !== job.sourceSize.join(" ")) throw new Error("Source dimensions changed: " + job.source);
    if (job.crop.mode === "trim-alpha") {
      const bounds = execFileSync(magick, [job.src, "-trim", "-format", "%w %h %X %Y", "info:"], { encoding: "utf8" }).trim();
      if (bounds !== `${job.crop.width} ${job.crop.height} +${job.crop.x} +${job.crop.y}`) throw new Error("Alpha bounds changed: " + job.source);
    }
  }
  for (const job of pending) {
    const args = [job.src, "-colorspace", "sRGB"];
    if (job.crop.mode === "crop") args.push("-crop", job.crop.geometry, "+repage");
    if (job.crop.mode === "trim-alpha") args.push("-trim", "+repage");
    if (job.crop.padSquare) args.push("-background", "none", "-gravity", "center", "-extent", `${job.inputWidth}x${job.inputHeight}`);
    // Constrain width only: a rounded height in a bounding box can silently reduce the requested width.
    args.push("-filter", "Lanczos", "-resize", `${job.width}x>`);
    if (job.file.endsWith(".webp")) {
      args.push("-quality", job.alpha ? "88" : "84");
      if (job.alpha) args.push("-define", "webp:alpha-quality=100", "-define", "webp:exact=true");
    }
    args.push(job.file.endsWith(".webp") ? "webp:-" : "png:-");
    const bytes = execFileSync(magick, args, { maxBuffer: 16 * 1024 * 1024 });
    const size = execFileSync(magick, ["identify", "-format", "%w %h", "-"], { input: bytes, encoding: "utf8" }).trim();
    if (size !== `${job.width} ${job.height}`) throw new Error("Output dimensions differ: " + job.file);
    mkdirSync(OUT, { recursive: true });
    writeFileSync(job.out, bytes, { flag: "wx" });
    written++;
    console.log(`${job.file} ${job.width}x${job.height} ${bytes.length} bytes`);
  }
  console.log(`UI media: ${written} written, ${jobs.length - written} fresh`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
