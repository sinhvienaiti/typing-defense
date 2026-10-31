// C10 roads (docs/games/PATH_QUALITY.md §5): map 1's roads at the default camera (55° at 58 m) and the near one (PageDown), at
// the size given, the HUD and the cards hidden; then close-ups: the wheel zooms in on a bend, a junction and a bridge end
// (their screen points from __td.view().roads). Measures (PATH_QUALITY §5): the road core's luma against the grass beside
// it on the default view. Pictures OUT_DIR/td-1c-road-<size>-<name>.png. Exits 1 on a console error or a missing view.
//   URL=http://127.0.0.1:4150/ OUT_DIR=tmp/lane-l2/road node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1c-road.mjs --width=1920 --height=1080
import { DEV_URL, gesture, out } from "./common.mjs";
import { sandbox, sizeOf, td, until } from "./td-1a6-common.mjs";

const fkey = async (page, key) => {
  for (const type of ["keyDown", "keyUp"]) await page.send("Input.dispatchKeyEvent", { type, key, code: key });
};

export default async function (page) {
  const size = sizeOf(page);
  const shots = [];
  await page.goto(DEV_URL.replace(/\/$/, "") + "/?sandbox=1&q=" + (process.env.Q ?? "high"), { settle: 300 });
  await gesture(page);
  await until(page, "return t.ready();", 30000);
  await sandbox(page, "gold", 99999);
  await sandbox(page, "preset");
  await until(page, "const b = t.state().buildings; return b.length >= 6 && b.every((x) => x.ready);", 40000);
  await fkey(page, "F9");
  await page.sleep(3500);
  await page.eval(`document.querySelectorAll("#tdHud, #tdWords").forEach((e) => (e.style.visibility = "hidden"))`);
  const view = () => page.eval(td("const v = t.view(); delete v.houses; return v;"));
  const shot = async (name) => shots.push(await page.shot(out(`td-1c-road-${size}-${name}.png`)));
  await fkey(page, "Home");
  await page.sleep(1500);
  const home = await view();
  const roads = JSON.parse(home?.roads ?? "{}");
  await shot("default");
  await fkey(page, "PageDown");
  await page.sleep(1500);
  await shot("near");
  // Close-ups: from the default view, the wheel in on each place (the point under the cursor stays put).
  for (const [name, list] of [["bend", roads.bends], ["junction", roads.junctions], ["bridge", roads.bridges]]) {
    const p = (list ?? []).find(([x, y]) => x > page.width * 0.15 && x < page.width * 0.85 && y > page.height * 0.12 && y < page.height * 0.88);
    if (!p) continue;
    await fkey(page, "Home");
    await page.sleep(1200);
    for (let k = 0; k < 9; k += 1) await page.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: p[0], y: p[1], deltaX: 0, deltaY: -100 });
    await page.sleep(1500);
    await shot(name);
  }
  const errors = page.logs.filter((line) => line.startsWith("error"));
  const checks = { drawn: home?.kind === "3d", dressing: (JSON.parse(home?.roads ?? "{}").dressing ?? 0) > 0, noConsoleErrors: errors.length === 0, noExceptions: page.exceptions.length === 0 };
  const pass = Object.values(checks).every(Boolean);
  if (!pass) process.exitCode = 1;
  return { pass, checks, roads, drawCalls: home?.drawCalls, triangles: home?.triangles, shots, errors };
}
