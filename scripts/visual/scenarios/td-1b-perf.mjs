// Lời Gọi 1B R1 (docs/td/BUILD_1B.md §19 td-1b-perf, §20): the boss fighting with 300 enemies on the routes and its
// Mầm Gỗ: the sandbox preset, the boss called and risen, __td.flood(300) (every kind but the boss, Mầm Gỗ included;
// R2: Tanuki drumming, Nuppeppō splitting), its stagger forced by the towers raised, and (R2) Tối Thượng cast twice
// among them by the `=` key, Draconis by the fork, the flood topped up to 300 after each rain (R2 review); for ~10 s the
// page's frame costs (__td.costs: the 2D view with the
// boss layer and the cards; the steps with the HUD and sound) and Chrome's main thread: the view ≤ 8 ms a frame (p95),
// the main thread ≤ 4 ms a frame on average, no frame over 16.7 ms as it rises. Picture td-1b-perf.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-perf.mjs --width=1280 --height=720
import { boot, consoleChecks, finish, key, out, replayOnNode, sandbox, send, sizeOf, state, td, until } from "./td-1a6-common.mjs";

const stats = (list) => {
  const sorted = [...list].sort((a, b) => a - b);
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
  return { frames: sorted.length, mean: sorted.reduce((s, v) => s + v, 0) / Math.max(1, sorted.length), p95: at(0.95), max: sorted.at(-1) ?? 0 };
};

export default async function (page) {
  const size = sizeOf(page);
  const ready = await boot(page);
  await sandbox(page, "preset");
  for (const b of (await state(page)).buildings) if (b.def === "archer" || b.def === "cannon") await send(page, { t: "sandbox", op: { op: "level", building: b.id, value: 3 } });
  await send(page, { t: "move", agent: 0, qx: 4 * 4, qz: -22 * 4 }); // by the fork, among the flood (R2: Tối Thượng)
  await sandbox(page, "boss");
  await until(page, "return t.state().boss.stage === 3 && t.state().tick >= t.state().boss.emergeAt - 40;", 30000, 100);
  await page.eval(td("t.costs(); return true;"));
  await page.sleep(2500); // the rise
  const rise = await page.eval(td("return t.costs();"));
  await page.eval(td("t.flood(300); return true;"));
  await page.sleep(500);
  // Frames are counted by requestAnimationFrame: t.costs() keeps only the last 600, fewer than 10 s holds above 60 fps.
  await page.eval(`window.__perfFrames = 0; (function count() { window.__perfFrames += 1; requestAnimationFrame(count); })(); true`);
  await page.send("Performance.enable");
  const before = await page.send("Performance.getMetrics");
  const framesBefore = await page.eval("window.__perfFrames");
  const started = Date.now();
  // R2: Tối Thượng twice in the window (the sandbox fills it and lifts the 45 s between casts). R2 review: the rain kills
  // ~50 of the flood, so 2.5 s after each cast the flood is topped up to 300 again (BUILD_1B §19: boss + 300 + the rain).
  let casts = 0;
  const live = [];
  for (const at of [500, 5500]) {
    await page.sleep(Math.max(0, started + at - Date.now()));
    await sandbox(page, "ult");
    await page.sleep(100);
    await key(page, "Equal");
    casts += 1;
    await page.sleep(Math.max(0, started + at + 2500 - Date.now()));
    const n = await page.eval(td("return t.state().enemies;"));
    live.push(n);
    if (n < 301) await page.eval(td(`t.flood(${301 - n}); return true;`)); // 300 and the boss
  }
  await page.sleep(Math.max(0, started + 10000 - Date.now()));
  const after = await page.send("Performance.getMetrics");
  const frames = (await page.eval("window.__perfFrames")) - framesBefore;
  const seconds = (Date.now() - started) / 1000;
  const costs = await page.eval(td("return t.costs();"));
  const metric = (m, name) => m.metrics.find((x) => x.name === name)?.value ?? 0;
  const busy = (metric(after, "TaskDuration") - metric(before, "TaskDuration")) * 1000;
  const s = await state(page);
  const shot = await page.shot(out("td-1b-perf-" + size + ".png"));
  const replay = await replayOnNode(page, "td-1b-perf");
  const draw = stats(costs.draw);
  const update = stats(costs.update);
  const ultStats = await page.eval(td("return t.stats();"));
  const checks = {
    ready,
    loaded: s.enemies >= 280 && s.boss.stage === 4,
    ultCastTwice: casts === 2 && ultStats.ultCasts === 2 && ultStats.ultFeathers >= 24,
    drawP95: draw.p95 <= 8,
    mainThread: busy / Math.max(1, frames) <= 4,
    riseNoLongFrame: Math.max(...rise.draw, ...rise.update) <= 16.7,
    nodeReplaysToBrowserHash: replay.match === true,
    ...consoleChecks(page),
  };
  return finish(page, checks, { draw, update, mainMsPerFrame: busy / Math.max(1, frames), mainBusyShare: busy / (seconds * 1000), frames, fps: frames / seconds, riseMax: Math.max(...rise.draw, ...rise.update), enemies: s.enemies, beforeTopUp: live, ult: { casts: ultStats.ultCasts, feathers: ultStats.ultFeathers, damage: ultStats.damageUlt }, shot, replay });
}
