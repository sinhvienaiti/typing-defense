/**
 * BUILD_1B §20 (R2 review fix): the JS the page needs to start, gzip ≤ 85 kB, enforced by `pnpm build` (and so by
 * `pnpm check`). The start is the entry chunk with what index.html preloads for it; the chunks loaded when wanted (the
 * title, the cards, the sandbox panel) are listed apart, and the total beside them. Run after `vite build`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 85;
const kb = (bytes) => bytes / 1000;
const gz = (file) => gzipSync(readFileSync("dist/" + file)).length;
const html = readFileSync("dist/index.html", "utf8");
const start = [...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.js)"/g)].map((match) => match[1]);
const all = readdirSync("dist/assets").filter((file) => file.endsWith(".js")).map((file) => "assets/" + file);
if (start.length === 0) {
  console.error("bundle budget: no script in dist/index.html");
  process.exit(1);
}
const startGz = start.reduce((total, file) => total + gz(file), 0);
const lazy = all.filter((file) => !start.includes(file));
const lazyGz = lazy.reduce((total, file) => total + gz(file), 0);
for (const file of lazy) console.log(`  later ${file} ${kb(gz(file)).toFixed(2)} kB gzip`);
console.log(`bundle budget (BUILD_1B §20): start ${kb(startGz).toFixed(2)} kB gzip (${start.join(", ")}), ≤ ${BUDGET_KB} kB; later ${kb(lazyGz).toFixed(2)} kB; total ${kb(startGz + lazyGz).toFixed(2)} kB`);
if (kb(startGz) > BUDGET_KB) {
  console.error(`bundle budget: the start chunk is ${kb(startGz).toFixed(2)} kB gzip, over ${BUDGET_KB} kB`);
  process.exit(1);
}
