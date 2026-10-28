// 1C step C1 (docs/td/BUILD_1C_MAP1.md §2, §8): the page draws through MapView. The 2D view still plays by default and
// at ?q=low; ?view=3d and ?q=high open map 1's (still empty) 3D view as a chunk of its own on a second canvas, and the
// pointer pans and zooms it; a blocked 3D chunk and a lost WebGL context fall back to 2D, told in the HUD, and the run
// goes on. No console error or page exception but the blocked chunk's own. Exits 1 when a check fails.
//   URL=http://127.0.0.1:4150/ OUT_DIR=tmp/lane-l node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1c-view.mjs --width=1280 --height=720
import { inflateSync } from "node:zlib";
import { DEV_URL, gesture, out } from "./common.mjs";

const td = (code) => "(() => { const t = window.__td; if (!t) return null; " + code + " })()";
const LOOK = td(`const c2 = document.getElementById("tdCanvas"), c3 = document.getElementById("tdCanvas3d");
  return { view3d: t.chunks().view3d, tick: t.state().tick, flat: getComputedStyle(c2).visibility,
    deep: c3 && { width: c3.width, height: c3.height, css: [c3.clientWidth, c3.clientHeight] },
    notices: [...document.querySelectorAll("#tdHud *")].map((e) => e.textContent).filter((s) => /Bản 3D/.test(s ?? "")).slice(-1)[0] ?? "" };`);

/** The colour of one CSS pixel of the composited page (a 1 × 1 PNG: after its filter byte the bytes are the pixel). */
async function pixel(page, x, y) {
  const shot = await page.send("Page.captureScreenshot", { format: "png", clip: { x, y, width: 1, height: 1, scale: 1 } });
  const png = Buffer.from(shot.data, "base64");
  const idat = [];
  for (let at = 8; at < png.length; ) {
    const length = png.readUInt32BE(at);
    if (png.toString("latin1", at + 4, at + 8) === "IDAT") idat.push(png.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  return [...inflateSync(Buffer.concat(idat)).subarray(1, 4)];
}

export default async function (page) {
  const base = DEV_URL.replace(/\/$/, "");
  const size = page.width + "x" + page.height;
  const [cx, cy] = [page.width >> 1, Math.round(page.height * 0.45)];
  const shots = [];
  const errors = () => page.logs.filter((line) => line.startsWith("error"));
  const open = async (query) => {
    await page.goto(base + "/" + query, { settle: 300 });
    await gesture(page);
    for (let wait = 0; wait < 80; wait += 1) {
      if ((await page.eval(td("return t.ready();"))) === true) break;
      await page.sleep(250);
    }
    const first = await page.eval(LOOK);
    await page.sleep(1000);
    const later = await page.eval(LOOK);
    return { ...later, steps: (later?.tick ?? 0) - (first?.tick ?? 0) };
  };
  /** A wheel step in, a left drag, a wheel step out over the field: the camera's, no exception. */
  const pointer = async () => {
    await page.mouse(cx, cy);
    await page.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: cx, y: cy, deltaX: 0, deltaY: -120 });
    await page.mouse(cx, cy, "mousePressed");
    for (let step = 1; step <= 6; step += 1) await page.mouse(cx + step * 15, cy + step * 8, "mouseMoved", { button: "left", buttons: 1 });
    await page.mouse(cx + 90, cy + 48, "mouseReleased");
    await page.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: cx, y: cy, deltaX: 0, deltaY: 120 });
    await page.sleep(200);
  };
  const green = ([r, g, b]) => g > 110 && g > r && g > b;
  const runs = {};

  // 1. The default link: the 2D view, playing.
  runs.flat = await open("?title=0");
  runs.flat.ground = await pixel(page, cx, cy);
  await pointer();
  shots.push(await page.shot(out(`td-1c-view-${size}-2d.jpg`)));
  runs.low = await open("?title=0&q=low");

  // 2. ?view=3d (Medium) and ?q=high: the 3D view on its own canvas.
  const before3d = errors().length;
  runs.deep = await open("?title=0&view=3d");
  runs.deep.ground = await pixel(page, cx, cy);
  runs.deep.loaded = await page.eval(`performance.getEntriesByType("resource").some((e) => /view-3d/.test(e.name))`);
  await pointer();
  runs.deep.afterPointer = await page.eval(LOOK);
  shots.push(await page.shot(out(`td-1c-view-${size}-3d.jpg`)));
  runs.high = await open("?title=0&q=high");
  shots.push(await page.shot(out(`td-1c-view-${size}-3d-high.jpg`)));

  // 3. A lost context: back to 2D, the run goes on.
  await page.eval(`document.getElementById("tdCanvas3d").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()`);
  await page.sleep(600);
  const lostA = await page.eval(LOOK);
  await page.sleep(800);
  const lostB = await page.eval(LOOK);
  runs.lost = { ...lostB, steps: lostB.tick - lostA.tick, ground: await pixel(page, cx, cy) };
  shots.push(await page.shot(out(`td-1c-view-${size}-lost.jpg`)));
  const errors3d = errors().slice(before3d);

  // 4. The 3D chunk blocked: its retries, then 2D.
  await page.send("Network.enable");
  await page.send("Network.setBlockedURLs", { urls: ["*src/view/3d/view-3d.ts*"] });
  const beforeBlock = errors().length;
  runs.blocked = await open("?title=0&view=3d");
  runs.blocked.ground = await pixel(page, cx, cy);
  shots.push(await page.shot(out(`td-1c-view-${size}-blocked.jpg`)));
  const blockErrors = errors().slice(beforeBlock);
  await page.send("Network.setBlockedURLs", { urls: [] });

  const checks = {
    flatPlays: runs.flat.view3d === false && runs.flat.deep === null && runs.flat.flat === "visible" && runs.flat.steps > 30 && green(runs.flat.ground),
    lowIs2d: runs.low.view3d === false && runs.low.deep === null && runs.low.steps > 30,
    deepOpens: runs.deep.view3d === true && runs.deep.loaded === true && runs.deep.flat === "hidden" && runs.deep.deep?.css?.[0] === page.width && runs.deep.deep?.css?.[1] === page.height && runs.deep.steps > 30 && green(runs.deep.ground),
    deepPointer: runs.deep.afterPointer?.view3d === true,
    highOpens: runs.high.view3d === true && runs.high.steps > 30 && runs.high.deep?.width >= page.width,
    lostFallsBack: runs.lost.view3d === false && runs.lost.deep === null && runs.lost.flat === "visible" && runs.lost.steps > 30 && /Bản 3D dừng/.test(runs.lost.notices) && green(runs.lost.ground),
    blockedFallsBack: runs.blocked.view3d === false && runs.blocked.deep === null && runs.blocked.flat === "visible" && runs.blocked.steps > 30 && /Bản 3D chưa mở được/.test(runs.blocked.notices),
    noErrors2dOr3d: errors().slice(0, before3d).length === 0 && errors3d.length === 0,
    onlyTheBlockedChunksError: blockErrors.length > 0 && blockErrors.every((line) => /view3d chunk|view-3d|ERR_BLOCKED/.test(line)),
    noExceptions: page.exceptions.length === 0,
  };
  const pass = Object.values(checks).every(Boolean);
  if (!pass) process.exitCode = 1;
  return { pass, checks, runs, blockErrors, shots };
}
