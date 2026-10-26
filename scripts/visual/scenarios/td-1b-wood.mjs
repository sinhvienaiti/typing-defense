// Lời Gọi, the owner's play-test of 26/10/2026 (docs/changelog/2026-10-26-td-wood.md): wood that does not run out, the early
// night call's countdown and "two dragons". With td.settings and td.campaign cleared:
// 1. map 1 from the title ("Bắt đầu", the story at "/"), no key pressed after it: every frame drawn is counted on the
//    canvas: exactly one Draconis (a dragon shape in his orange) and no "D" glyph on the field (the villagers' "D" read as
//    a second Draconis; they show their call's icon now), one "D" in the HUD (his lantern);
// 2. the "Gọi đêm sớm" button: its gold falls from the day's first seconds (30 → less), its clock and bar fall with the
//    day; Esc pauses: the button says "Đã dừng" and the clock stands; the last 10 s pulse; at 0:00 the night falls by
//    itself (no callNight in the log);
// 3. a tree being chopped shows the wood it holds ("988/1000"), and the reserve only goes down;
// 4. the sandbox: three trees felled (the sandbox's `fell`), a day later they grow back, full, in a green ring; the page's
//    log replayed on Node to the page's hash.
// Pictures td-1b-wood-<name>: day, chop, paused, last10, night, stumps, growing, regrown. Exits 1 on a failed check.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-wood.mjs --width=1280 --height=720
import { DEV_URL } from "./common.mjs";
import { boot, consoleChecks, finish, key, out, replayOnNode, sandbox, sizeOf, state, td } from "./td-1a6-common.mjs";

/** Counts, frame by frame, the dragon shapes drawn in Draconis' orange and the "D" glyphs on the field canvas. */
const COUNTER = `(() => {
  if (window.__dragons) return true;
  const P = CanvasRenderingContext2D.prototype;
  const [fill, text] = [P.fill, P.fillText];
  const d = (window.__dragons = { frames: 0, cur: { shapes: 0, d: 0 }, shapes: {}, glyphs: {}, reserve: {} });
  P.fill = function (...args) { if (args[0] instanceof Path2D && String(this.fillStyle).toLowerCase() === "#f2994a") d.cur.shapes += 1; return fill.apply(this, args); };
  P.fillText = function (label, ...args) {
    if (label === "D") d.cur.d += 1;
    if (/^\\d+\\/1000$/.test(label)) d.reserve[label] = (d.reserve[label] ?? 0) + 1; // a chopped tree's wood left, frames drawn
    return text.call(this, label, ...args);
  };
  const tick = () => {
    if (d.cur.shapes + d.cur.d > 0 || d.frames > 0) {
      d.frames += 1;
      d.shapes[d.cur.shapes] = (d.shapes[d.cur.shapes] ?? 0) + 1;
      d.glyphs[d.cur.d] = (d.glyphs[d.cur.d] ?? 0) + 1;
    }
    d.cur = { shapes: 0, d: 0 };
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return true;
})()`;
const BUTTON = `(() => { const b = document.querySelector('.td-hud [data-act="night"]'); if (!b) return null;
  const bar = b.querySelector("i s"); const r = b.getBoundingClientRect();
  return { text: b.textContent, last: b.classList.contains("is-last"), bar: bar ? parseFloat(bar.style.width) : -1, w: r.width, h: r.height, right: r.right, scroll: b.scrollWidth - b.clientWidth }; })()`;
/** Elements of the HUD whose own text is "D" (Draconis' lantern in the team bar). */
const HUD_D = `[...document.querySelectorAll(".td-hud *")].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() === "D")).length`;
const NAV_ENTER = { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 };

export default async function (page) {
  const size = sizeOf(page);
  const base = DEV_URL.replace(/\/$/, "");
  const shots = [];
  const shot = async (name) => shots.push(await page.shot(out("td-1b-wood-" + name + "-" + size + ".png")));

  // 1–3. The story from the title.
  await page.goto(base + "/", { settle: 300 });
  await page.eval(`(() => { try { localStorage.removeItem("td.settings"); localStorage.removeItem("td.campaign"); } catch {} return true; })()`);
  await page.goto(base + "/", { settle: 600 });
  await page.mouse(5, 5, "mousePressed");
  await page.mouse(5, 5, "mouseReleased");
  await page.sleep(800);
  await page.eval(COUNTER);
  await page.send("Input.dispatchKeyEvent", NAV_ENTER);
  await page.send("Input.dispatchKeyEvent", { ...NAV_ENTER, type: "keyUp" });
  let ready = false;
  for (let k = 0; k < 80 && !ready; k += 1) {
    ready = (await page.eval(td("return t.ready() && t.state().tick > 0;"))) === true;
    if (!ready) await page.sleep(250);
  }
  const samples = [];
  const sample = async () => {
    const s = await page.eval(td("const s = t.state(); return { tick: s.tick, phase: s.phase, day: s.day, phaseEnd: s.phaseEnd, trees: s.trees };"));
    const b = await page.eval(BUTTON);
    const m = /\+(\d+) vàng/.exec(b?.text ?? "");
    const clock = /(\d+):(\d\d)/.exec(b?.text ?? "");
    samples.push({ at: Date.now(), tick: s?.tick, phase: s?.phase, bonus: m ? Number(m[1]) : null, left: clock ? Number(clock[1]) * 60 + Number(clock[2]) : null, bar: b?.bar, last: b?.last, paused: (b?.text ?? "").includes("Đã dừng"), button: b });
    return { s, b };
  };
  const first = await sample();
  await page.sleep(1500);
  await shot("day");
  const chopped = (s) => s.trees.filter((tree) => tree.worker >= 0 && tree.progress > 0);
  const hudD = await page.eval(HUD_D);
  // Ten seconds in: the gold has fallen from 30, the clock and the bar with it.
  while (samples.length < 40 && (samples[samples.length - 1].left ?? 99) > 64) {
    await page.sleep(500);
    await sample();
  }
  await shot("chop");
  const chopLabel = await page.eval(td("const s = t.state(); const tree = s.trees.find((x) => x.worker >= 0 && x.progress > 0); return tree ? tree.left + '/1000' : null;"));
  const lefts = [];
  lefts.push((await sample()).s.trees.map((tree) => tree.left));
  // Esc: paused, the button says so and the clock stands.
  await key(page, "Escape");
  await page.sleep(400);
  const p0 = await sample();
  await page.sleep(1500);
  const p1 = await sample();
  await shot("paused");
  await key(page, "Escape");
  await page.sleep(400);
  // Idle to the day's end: the last 10 s pulse, then the night falls by itself.
  let lastShot = false;
  while (Date.now() - samples[0].at < 150000) {
    const { s, b } = await sample();
    if (!lastShot && b?.last) {
      lastShot = true;
      await page.sleep(250);
      await shot("last10");
    }
    if (s?.phase === "night") break;
    await page.sleep(400);
  }
  await page.sleep(1500);
  await shot("night");
  lefts.push((await state(page)).trees.map((tree) => tree.left));
  const log = (await page.eval(td("return t.log();"))) ?? [];
  const dragons = await page.eval("window.__dragons ? { frames: window.__dragons.frames, shapes: window.__dragons.shapes, glyphs: window.__dragons.glyphs, reserve: Object.keys(window.__dragons.reserve) } : null");
  const dayRows = samples.filter((r) => r.phase === "day" && !r.paused && r.bonus !== null);
  const dayStart = dayRows[0];
  const at10 = dayRows.find((r) => r.left !== null && r.left <= 65);

  // 4. The sandbox: trees felled, then a day later grown back.
  const sb = await boot(page);
  await page.sleep(2500); // the villagers walk to their trees
  const sb0 = await state(page);
  const kx = 0;
  const kz = 40;
  const near = sb0.trees.map((tree, k) => [k, tree]).filter(([, tree]) => tree.standing).sort(([, a], [, b]) => (a.x - kx) ** 2 + (a.z - kz) ** 2 - (b.x - kx) ** 2 - (b.z - kz) ** 2).slice(0, 3).map(([k]) => k);
  for (const k of near) await sandbox(page, "fell", k);
  await page.sleep(600);
  const sb1 = await state(page);
  await shot("stumps");
  await sandbox(page, "skipTo", 2);
  await page.sleep(160);
  await shot("growing");
  await page.sleep(1600);
  const sb2 = await state(page);
  await shot("regrown");
  const replay = await replayOnNode(page, "td-1b-wood");

  const shapes = dragons?.shapes ?? {};
  const glyphs = dragons?.glyphs ?? {};
  const checks = {
    ready,
    // 1. One Draconis on the field in every frame, no "D" on the field, his lantern the one "D" in the HUD.
    framesCounted: (dragons?.frames ?? 0) > 600,
    oneDragonEveryFrame: Object.keys(shapes).length === 1 && shapes[1] === dragons.frames,
    noDGlyphOnField: Object.keys(glyphs).length === 1 && glyphs[0] === dragons.frames,
    oneDInHud: hudD === 1,
    // 2. The early call's gold drains from the start; clock and bar with it; paused it says so; the last 10 s pulse.
    bonusStartsAt30: dayStart?.bonus === 30 || dayStart?.bonus === 29,
    bonusFallsEarly: at10 !== undefined && at10.bonus < dayStart.bonus && at10.bonus <= 27,
    barFalls: at10 !== undefined && at10.bar < dayStart.bar && at10.bar <= 88,
    bonusNeverRises: dayRows.every((r, k) => k === 0 || r.bonus <= dayRows[k - 1].bonus),
    buttonFits: dayRows.every((r) => r.button.scroll <= 1 && r.button.h < 80),
    pausedSaysSo: p0.b?.text.includes("Đã dừng") && p1.b?.text.includes("Đã dừng") && p0.s.tick === p1.s.tick,
    lastTenPulse: dayRows.some((r) => r.last && r.left <= 10) && dayRows.every((r) => !r.last || r.left <= 10),
    nightByItself: samples[samples.length - 1].phase === "night" && !log.some((c) => c.t === "callNight"),
    // 3. The chopped tree's reserve shows and only goes down.
    reserveShown: chopLabel !== null && (dragons?.reserve ?? []).some((label) => Number(label.split("/")[0]) < 1000),
    reserveFalls: lefts[1].every((left, k) => left <= lefts[0][k]) && lefts[1].some((left, k) => left < lefts[0][k]) && lefts[1].every((left) => left > 900),
    // 4. Felled, then regrown full at the next day's start.
    sandboxReady: sb,
    felled: near.length === 3 && near.every((k) => !sb1.trees[k].standing && sb1.trees[k].left === 0),
    regrown: sb2.day === 2 && near.every((k) => sb2.trees[k].standing && sb2.trees[k].left === 1000) && sb2.trees.every((tree) => tree.left === 1000 || tree.worker >= 0),
    nodeReplaysToBrowserHash: replay.match === true,
    ...consoleChecks(page),
  };
  return finish(page, checks, {
    dragons: dragons && { frames: dragons.frames, shapes: dragons.shapes, glyphs: dragons.glyphs, reserve: dragons.reserve.slice(0, 12) }, hudD, chopLabel, choppedAtStart: chopped(first.s).length,
    early: { start: dayStart && { bonus: dayStart.bonus, left: dayStart.left, bar: dayStart.bar }, at10: at10 && { bonus: at10.bonus, left: at10.left, bar: at10.bar }, last: dayRows.filter((r) => r.last).map((r) => [r.left, r.bonus]).slice(0, 4), button: dayStart?.button },
    paused: [p0.b?.text, p0.s?.tick, p1.s?.tick],
    night: { samples: samples.length, phase: samples[samples.length - 1].phase, commands: log.length },
    reserve: { before: lefts[0].filter((l) => l < 1000), after: lefts[1].filter((l) => l < 1000) },
    sandbox: { near, felled: near.map((k) => [sb1.trees[k].standing, sb1.trees[k].left]), regrown: near.map((k) => [sb2.trees[k].standing, sb2.trees[k].left]), day: sb2.day },
    replay, shots,
  });
}
