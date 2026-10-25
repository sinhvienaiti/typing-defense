/**
 * BUILD_1B §20 (R2 review fixes 1 and 2): the JS a page needs before it is usable, gzip ≤ 85 kB, enforced by `pnpm build`
 * (and so by `pnpm check`). Each start page's set is the entry chunk, the chunks src/main.ts waits for before the page
 * takes keys (at "/" the title: showTitle), and everything those import, read from Vite's manifest. The chunks fetched
 * once the page is usable (sound, the pause and results cards, the title's settings and Hồ sơ gõ cards, the sandbox
 * panel) are printed apart with the total, and so is the headroom left under the budget. Run after `vite build`.
 */
import { existsSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 85;
/**
 * As src/main.ts loads them: "/" shows the title before the run; a link with ?title=0 or ?sandbox= goes straight in and its
 * first step waits for Học's chunk (R3: the run's study lists), which "/" fetches beside the title and waits for at "Bắt đầu".
 */
const PAGES = { "/": ["index.html", "src/ui/title.ts"], "/?title=0": ["index.html", "src/app/learn.ts"] };
const MANIFEST = "dist/.vite/manifest.json";

const fail = (text) => {
  console.error("bundle budget: " + text);
  process.exit(1);
};
if (!existsSync(MANIFEST)) fail(MANIFEST + " is missing: run vite build first (build.manifest in vite.config.ts)");
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const kb = (bytes) => bytes / 1000;
const sizes = new Map();
const gz = (file) => {
  if (!sizes.has(file)) sizes.set(file, gzipSync(readFileSync("dist/" + file)).length);
  return sizes.get(file);
};
/** The JS files of these manifest entries and of every chunk they import statically. */
function closure(keys) {
  const seen = new Set();
  const walk = (key) => {
    if (manifest[key] === undefined) fail(`${key} is no chunk of the build: update PAGES to what src/main.ts loads first`);
    if (seen.has(key)) return;
    seen.add(key);
    for (const next of manifest[key].imports ?? []) walk(next);
  };
  keys.forEach(walk);
  return [...new Set([...seen].map((key) => manifest[key].file))].filter((file) => file.endsWith(".js"));
}
const all = [...new Set(Object.values(manifest).map((chunk) => chunk.file))].filter((file) => file.endsWith(".js"));
const name = (file) => {
  const key = Object.keys(manifest).find((k) => manifest[k].file === file);
  return key === "index.html" ? "entry" : (key?.replace(/^src\//, "") ?? file);
};
const total = all.reduce((sum, file) => sum + gz(file), 0);
let over = false;
for (const [page, keys] of Object.entries(PAGES)) {
  const files = closure(keys);
  const start = files.reduce((sum, file) => sum + gz(file), 0);
  const later = all.filter((file) => !files.includes(file));
  console.log(`bundle budget (BUILD_1B §20) ${page}: start ${kb(start).toFixed(2)} kB gzip (${files.map(name).join(" + ")}) ≤ ${BUDGET_KB} kB, headroom ${kb(BUDGET_KB * 1000 - start).toFixed(2)} kB; later ${kb(total - start).toFixed(2)} kB (${later.map((file) => name(file) + " " + kb(gz(file)).toFixed(2)).join(", ")}); total ${kb(total).toFixed(2)} kB`);
  if (kb(start) > BUDGET_KB) {
    console.error(`bundle budget: ${page} needs ${kb(start).toFixed(2)} kB gzip before it is usable, over ${BUDGET_KB} kB`);
    over = true;
  }
}
if (over) process.exit(1);
