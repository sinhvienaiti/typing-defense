#!/usr/bin/env node
/**
 * Map 1's media per tier against docs/td/BUILD_1C_MAP1.md §5 (1C step C4): the models map 1 loads (their High or
 * Medium file in public/assets/typing-defense/models/manifest.json), the ground tiles and decals (C3), the scenery
 * atlas and backdrops (C9) and the VFX sheets (C11), each read from public/assets/typing-defense/<part>/ by its
 * ".high." or ".medium." name. Prints a table and the models map 1 needs that the manifest does not list yet; exits 1
 * when a tier passes a line of the table (with --strict also when a model is missing).
 *   node scripts/td/media-budget.mjs [--strict] [--json]
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const ASSETS = join(ROOT, "public/assets/typing-defense");
/** BUILD_1C_MAP1 §5, MB (10^6 bytes). */
export const BUDGET = {
  models: { high: 7.5, medium: 3.6 },
  ground: { high: 1.5, medium: 0.8 },
  scenery: { high: 2.5, medium: 1.2 },
  vfx: { high: 0.5, medium: 0.4 },
  total: { high: 12, medium: 6 },
};
/** The models map 1's story and sandbox draw (BUILD_1C_MAP1 §5; the Troll and the bags are not in map 1's rules). */
export const MAP1_MODELS = [
  ...["keep", "archer", "cannon", "barracks", "gold-mine", "farm"].map((id) => "buildings/" + id),
  ...["keep-kit-l2", "keep-kit-l3", "keep-kit-l4", "archer-kit-l2", "archer-kit-l3", "cannon-kit-l2", "cannon-kit-l3", "barracks-kit-l2", "barracks-kit-l3", "gold-mine-kit-l2", "gold-mine-kit-l3", "farm-kit-l2", "farm-kit-l3"].map((id) => "kits/" + id),
  ...["cannon-barrel", "cannon-barrel-l3", "gold-pile-1", "gold-pile-2", "gold-pile-3", "gold-pile-4", "level-pennant", "gold-mine-cart", "scaffold-bamboo", "vach-thac-bac", "cau-go", "choi-canh-doi"].map((id) => "props/" + id),
  ...["arrow", "keep-bolt", "shell", "root-burst", "fire-feather", "seed-drop"].map((id) => "projectiles/" + id),
  "loot/chest-boss",
  ...["helper-cham-glasses", "helper-cham-scarf", "helper-phay-tail", "helper-gach-wingband", "helper-brush", "helper-drum", "helper-hammer", "cuong-thi-lead-hat", "linh-giao-spear"].map((id) => "attachments/" + id),
  ...["cuong-thi", "thuong-luong", "mam-go", "tanuki", "nuppeppo", "moc-tinh"].map((id) => "enemies/" + id),
  "units/linh-giao", "units/worker-base", "heroes/draconis", "helpers/helper-owlet",
];

const mb = (bytes) => bytes / 1e6;
function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}
/** Bytes of a part's files for a tier: "<name>.high.<ext>" or "<name>.medium.<ext>"; a file with neither counts for both. */
function partBytes(part, tier) {
  return files(join(ASSETS, part)).filter((path) => !/manifest\.json$/.test(path)).reduce((sum, path) => {
    const other = tier === "high" ? ".medium." : ".high.";
    return path.includes(other) ? sum : sum + statSync(path).size;
  }, 0);
}

export function measure() {
  const manifest = JSON.parse(readFileSync(join(ASSETS, "models/manifest.json"), "utf8")).models;
  const missing = MAP1_MODELS.filter((key) => manifest[key] === undefined);
  const rows = {};
  for (const tier of ["high", "medium"]) {
    const models = MAP1_MODELS.reduce((sum, key) => sum + (manifest[key]?.tiers?.[tier]?.bytes ?? 0), 0);
    const parts = { models, ground: partBytes("ground", tier), scenery: partBytes("scenery", tier), vfx: partBytes("vfx", tier) };
    rows[tier] = { ...parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
  }
  const over = [];
  for (const [part, limits] of Object.entries(BUDGET)) for (const tier of ["high", "medium"]) if (mb(rows[tier][part]) > limits[tier]) over.push(part + " " + tier);
  return { rows, missing, listed: MAP1_MODELS.length - missing.length, over };
}

if (process.argv[1] === import.meta.filename) {
  const result = measure();
  if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 1));
  else {
    console.log("| Phần | High (MB) | trần | Medium (MB) | trần |\n|---|---:|---:|---:|---:|");
    for (const part of Object.keys(BUDGET)) console.log(`| ${part} | ${mb(result.rows.high[part]).toFixed(2)} | ${BUDGET[part].high} | ${mb(result.rows.medium[part]).toFixed(2)} | ${BUDGET[part].medium} |`);
    console.log(`\nmodels: ${result.listed}/${MAP1_MODELS.length} of map 1's listed; missing: ${result.missing.join(", ") || "none"}`);
    console.log(result.over.length === 0 ? "media budget: within BUILD_1C_MAP1 §5" : "media budget: over in " + result.over.join(", "));
  }
  process.exitCode = result.over.length > 0 || (process.argv.includes("--strict") && result.missing.length > 0) ? 1 : 0;
}
