// 1C steps C2–C3 (docs/td/BUILD_1C_MAP1.md §8): pictures of map 1's 3D stage and ground for an independent judge, and
// the stage's numbers. At ?q=high: the default camera (Home) with the HUD, PageDown, PageUp, then 3 tilts (30°, 55°, 85°) × 4
// headings (0°, 90°, 180°, 270°) with the HUD hidden, the keys a player would press (Shift + arrows turn 15° and tilt
// 5°). At ?q=medium: the default camera again. For each: __td.view() (draw calls, triangles, the camera) and the mean
// and p95 of the last frames' draw cost. Day 1, no buildings yet (C6). Exits 1 on a console error or exception.
//   URL=http://127.0.0.1:4150/ OUT_DIR=tmp/lane-l/ground node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1c-ground.mjs --width=1920 --height=1080
import { DEV_URL, gesture, out } from "./common.mjs";

const td = (code) => "(() => { const t = window.__td; if (!t) return null; " + code + " })()";
const SHIFT = 8;

export default async function (page) {
  const base = DEV_URL.replace(/\/$/, "");
  const size = page.width + "x" + page.height;
  const shots = [];
  const numbers = {};
  const press = async (code, modifiers = 0, times = 1) => {
    for (let i = 0; i < times; i += 1) {
      await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: code, code, modifiers });
      await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: code, code, modifiers });
      await page.sleep(40);
    }
    await page.sleep(900); // the camera eases (9/s)
  };
  const hud = (shown) => page.eval(`document.querySelectorAll("#tdHud, #tdWords").forEach((e) => (e.style.visibility = ${shown ? '""' : '"hidden"'}))`);
  const read = async (name) => {
    await page.sleep(400);
    const costs = await page.eval(td("return t.costs().draw.slice(-120);"));
    const sorted = [...(costs ?? [])].sort((a, b) => a - b);
    numbers[name] = { view: await page.eval(td("return t.view();")), drawMs: { mean: sorted.reduce((a, b) => a + b, 0) / Math.max(1, sorted.length), p95: sorted[Math.floor(sorted.length * 0.95)] ?? null } };
    shots.push(await page.shot(out(`td-1c-ground-${size}-${name}.jpg`)));
  };
  const open = async (query) => {
    await page.goto(base + "/" + query, { settle: 300 });
    await gesture(page);
    for (let wait = 0; wait < 80; wait += 1) {
      if ((await page.eval(td("return t.ready();"))) === true) break;
      await page.sleep(250);
    }
    await page.sleep(2500); // tiles, decals and the bridges load
    await press("Escape"); // the first click (audio's gesture) may have opened the build menu on the 3D ground
  };

  await open("?title=0&q=high");
  numbers.loaded = await page.eval(`performance.getEntriesByType("resource").map((e) => e.name.split("/").pop()).filter((n) => /\\.(webp|glb)(\\?|$)/.test(n))`);
  await read("high-default");
  await press("PageDown");
  await read("high-near");
  await press("PageUp");
  await read("high-overview");
  await press("Home");
  await hud(false);
  for (const [tilt, keys] of [[30, ["ArrowUp", 5]], [55, null], [85, ["ArrowDown", 6]]]) {
    await press("Home");
    if (keys) await press(keys[0], SHIFT, keys[1]);
    for (const heading of [0, 90, 180, 270]) {
      await read(`grid-t${tilt}-h${heading}`);
      await press("ArrowRight", SHIFT, 6);
    }
  }
  await hud(true);
  await open("?title=0&q=medium");
  await read("medium-default");

  const errors = page.logs.filter((line) => line.startsWith("error"));
  const checks = {
    threeD: numbers["high-default"]?.view?.kind === "3d" && numbers["medium-default"]?.view?.tier === "medium",
    groundLoaded: (numbers.loaded ?? []).filter((n) => /\.high\.webp/.test(n)).length >= 8 && (numbers.loaded ?? []).some((n) => /cau-go/.test(n)),
    drawCallsHigh: (numbers["high-default"]?.view?.drawCalls ?? 999) <= 150,
    drawCallsMedium: (numbers["medium-default"]?.view?.drawCalls ?? 999) <= 100,
    noConsoleErrors: errors.length === 0,
    noExceptions: page.exceptions.length === 0,
  };
  const pass = Object.values(checks).every(Boolean);
  if (!pass) process.exitCode = 1;
  return { pass, checks, numbers, errors, shots };
}
