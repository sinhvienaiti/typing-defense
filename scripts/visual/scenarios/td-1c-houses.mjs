// 1C step C6 (docs/td/BUILD_1C_MAP1.md §8): map 1's houses in 3D for an independent judge. The sandbox at ?q=high (Q
// overrides), the preset's houses (BUILD_1B §10) at levels 1, 2 and 3 (the Fort 1 to 4) from the default camera (Home),
// the Gold Mine from the same height with the view panned to it, a house going up under its bamboo scaffold, the build
// ghost green on free ground and red on the road. Checks: each house shows the kits src/view/3d/kits.json lists for its
// level, no console error or exception. Exits 1 when a check fails.
//   URL=http://127.0.0.1:4150/ OUT_DIR=tmp/lane-l/houses node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1c-houses.mjs --width=1920 --height=1080
import { readFileSync } from "node:fs";
import { DEV_URL, gesture, out } from "./common.mjs";

const td = (code) => "(() => { const t = window.__td; if (!t) return null; " + code + " })()";
const KITS = JSON.parse(readFileSync(new URL("../../../src/view/3d/kits.json", import.meta.url), "utf8"));

export default async function (page) {
  const base = DEV_URL.replace(/\/$/, "");
  const size = page.width + "x" + page.height;
  const shots = [];
  const problems = [];
  const send = (body) => page.eval(td(`return t.send(${JSON.stringify(body)});`));
  const key = async (code, times = 1, wait = 700) => {
    for (let i = 0; i < times; i += 1) {
      await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: code, code });
      await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: code, code });
      await page.sleep(40);
    }
    await page.sleep(wait);
  };
  const hud = (shown) => page.eval(`document.querySelectorAll("#tdHud, #tdWords").forEach((e) => (e.style.visibility = ${shown ? '""' : '"hidden"'}))`);
  const houses = async () => JSON.parse((await page.eval(td("return t.view().houses;"))) ?? "[]");
  const shot = async (name) => shots.push(await page.shot(out(`td-1c-houses-${size}-${name}.jpg`)));

  await page.goto(base + "/?sandbox=1&title=0&q=" + (process.env.Q ?? "high"), { settle: 300 });
  await gesture(page);
  for (let wait = 0; wait < 80; wait += 1) {
    if ((await page.eval(td("return t.ready();"))) === true) break;
    await page.sleep(250);
  }
  await key("Escape");
  await send({ t: "sandbox", op: { op: "gold", value: 99999 } });
  await send({ t: "sandbox", op: { op: "wood", value: 9999 } });
  await send({ t: "sandbox", op: { op: "preset" } });
  // The preset's sites go up first (a level is refused while a house is not ready): wait for all, and for the models.
  let state = [];
  for (let wait = 0; wait < 120; wait += 1) {
    state = await page.eval(td("return t.state().buildings;"));
    if (state.length >= 6 && state.every((b) => b.ready)) break;
    await page.sleep(250);
  }
  await page.sleep(3000);
  for (const level of [1, 2, 3, 4]) {
    if (level <= 3) for (const b of state) if (b.def !== "keep") await send({ t: "sandbox", op: { op: "level", building: b.id, value: level } });
    await send({ t: "sandbox", op: { op: "keepLevel", value: level } });
    await page.sleep(2500);
    const levels = (await page.eval(td("return t.state().buildings;"))).map((b) => b.def + " " + b.level);
    const wanted = state.filter((b) => b.def !== "keep" && level <= 3).length;
    const reached = (await page.eval(td("return t.state().buildings;"))).filter((b) => b.def !== "keep" && b.level === level).length;
    if (level <= 3 && reached < wanted) problems.push(`L${level}: sim levels ${levels.join(", ")}`);
    await hud(false);
    await key("Home", 1, 1200);
    await shot(`l${level}`);
    // Each house's kits against the table for its level.
    const sim = await page.eval(td("return t.state().buildings;"));
    for (const h of await houses()) {
      const def = sim.find((b) => b.id === h.id)?.def;
      const want = h.level > 1 ? (KITS[def]?.[String(h.level)] ?? []).length : 0;
      if (h.kits !== want) problems.push(`L${level} ${def}: ${h.kits} kits, ${want} in kits.json`);
      if (h.level !== Math.max(1, sim.find((b) => b.id === h.id)?.level ?? 0)) problems.push(`L${level} ${def}: view level ${h.level}`);
    }
    if (level <= 3) {
      await key("ArrowUp", 16, 150);
      await key("ArrowRight", 8, 1200); // the Gold Mine, north-east (an arrow drags the ground the other way)
      await shot(`l${level}-mine`);
    }
  }
  // A house going up under its scaffold, then the build ghost (Insert, 1: Archer Tower) on free ground and on the road.
  await key("Home", 1, 900);
  const archer = (await page.eval(td('return t.defs().indexOf("archer");'))) ?? 1;
  const spot = await page.eval(td(`for (const [x, z] of [[12, 30], [14, 34], [-10, 26], [18, 24], [-30, 20]]) if (t.canPlace("archer", x, z).ok) return [x, z]; return null;`));
  if (spot) await send({ t: "build", def: archer, qx: spot[0] * 4, qz: spot[1] * 4 });
  else problems.push("no free spot for the archer site");
  await page.sleep(1500);
  await hud(true);
  await key("Insert", 1, 400);
  await key("Digit1", 1, 400);
  const free = await page.eval(`(() => { const r = document.getElementById("tdCanvas3d").getBoundingClientRect(); return [r.width * 0.62, r.height * 0.52]; })()`);
  await page.mouse(free[0], free[1]);
  await page.sleep(800);
  await shot("site-ghost");
  await page.mouse(page.width * 0.47, page.height * 0.42); // on the road: red
  await page.sleep(800);
  await shot("ghost-2");
  await key("Escape", 2, 300);

  const errors = page.logs.filter((line) => line.startsWith("error"));
  const final = await houses();
  const checks = {
    housesDrawn: final.length >= 6 && final.every((h) => h.ready || h.def === "archer"),
    siteUnderScaffold: final.some((h) => !h.ready),
    kitsMatchTable: problems.length === 0,
    noConsoleErrors: errors.length === 0,
    noExceptions: page.exceptions.length === 0,
  };
  const pass = Object.values(checks).every(Boolean);
  if (!pass) process.exitCode = 1;
  return { pass, checks, problems, final, view: await page.eval(td("const v = t.view(); delete v.houses; return v;")), errors, shots };
}
