// 1C step C10 (docs/td/BUILD_1C_MAP1.md §8): the word cards on map 1's 3D view and their typing feel, for a judge.
// The sandbox at ?q=high (Q overrides), the preset's houses, the hero by the towers. Gates td-words (cards stand over
// their callers, apart, ≥ 18 px, on screen), td-hud-budget (none over a HUD panel at the default camera), td-scale (the
// lowest card of a house's column stands within 12 px over its anchor, FX_top + 0.6 m), the draw calls the effects add
// (≤ 2) and one frame from a key to its effect. With FRAMES=1 it records 1 s around a right key, a slip, a word typed,
// a chain step and a Word Shot by night (CDP screencast; needs CDP_PORT) into OUT_DIR/frames/<moment>/ with meta.json.
//   CDP_PORT=4152 URL=http://127.0.0.1:4150/ OUT_DIR=tmp/lane-l2/words FRAMES=1 node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1c-words.mjs --width=1920 --height=1080
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { KIND, LOOK, cardStats, cardSummary, cardsClean, consoleChecks, finish, key, letter, look, out, sandbox, send, sizeOf, state, td, until } from "./td-1a6-common.mjs";
import { DEV_URL, gesture } from "./common.mjs";

/** A second DevTools client on the page: its screencast frames with their wall-clock times (s). */
async function screencast(page) {
  const list = await (await fetch("http://127.0.0.1:" + process.env.CDP_PORT + "/json/list")).json();
  const ws = new WebSocket(list.find((p) => p.type === "page").webSocketDebuggerUrl);
  await new Promise((ok, fail) => [ws.addEventListener("open", ok, { once: true }), ws.addEventListener("error", fail, { once: true })]);
  let next = 0;
  let on = false;
  const pending = new Map();
  const frames = [];
  const call = (method, params = {}) => new Promise((done) => {
    const id = ++next;
    pending.set(id, done);
    ws.send(JSON.stringify({ id, method, params }));
  });
  ws.addEventListener("message", (event) => {
    const m = JSON.parse(event.data);
    if (m.id !== undefined && pending.has(m.id)) return void (pending.get(m.id)(m), pending.delete(m.id));
    if (m.method !== "Page.screencastFrame") return;
    if (on) frames.push({ ts: m.params.metadata.timestamp, data: m.params.data });
    ws.send(JSON.stringify({ id: ++next, method: "Page.screencastFrameAck", params: { sessionId: m.params.sessionId } }));
  });
  await call("Page.startScreencast", { format: "jpeg", quality: 78, maxWidth: page.width, maxHeight: page.height, everyNthFrame: 1 });
  return {
    async record(name, act, before = 150, after = 900) {
      frames.length = 0;
      on = true;
      await page.sleep(before);
      const at = await act();
      await page.sleep(after);
      on = false;
      const keyAt = (await page.eval("window.__keyAt ?? 0")) / 1000 || at;
      const dir = join(out("frames"), name);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      const meta = frames.map((f, k) => {
        const file = String(k).padStart(3, "0") + ".jpg";
        writeFileSync(join(dir, file), Buffer.from(f.data, "base64"));
        return { file, ms: Math.round((f.ts - keyAt) * 1000) };
      });
      const cards = ((await page.eval(LOOK))?.cards ?? []).map((c) => ({ text: c.text, left: Math.round(c.left), top: Math.round(c.top), right: Math.round(c.right), bottom: Math.round(c.bottom) }));
      writeFileSync(join(dir, "meta.json"), JSON.stringify({ name, size: sizeOf(page), frames: meta, cards, view: await page.eval(td("const v = t.view(); delete v.houses; return v;")) }, null, 1));
      return meta.length;
    },
    close: async () => [await call("Page.stopScreencast"), ws.close()],
  };
}

/** Mean luma (0–1, sRGB gray) of a box of an image (ImageMagick). */
const luma = (file, x, y, w, h) => Number(execFileSync("magick", [file, "-crop", `${Math.max(1, Math.round(w))}x${Math.max(1, Math.round(h))}+${Math.max(0, Math.round(x))}+${Math.max(0, Math.round(y))}`, "+repage", "-colorspace", "Gray", "-format", "%[fx:mean]", "info:"], { encoding: "utf8" }));

export default async function (page) {
  const size = sizeOf(page);
  /** §2.5: the ground under each card (the cards hidden, their plates drawn) and 70–110 px beside it, unplated. */
  const grounds = {};
  const measure = async (name) => {
    const cards = (await page.eval(LOOK))?.cards ?? [];
    await page.eval("document.getElementById('tdWords').style.visibility = 'hidden'");
    await page.sleep(60);
    const file = out(`ground-${name}-${size}.png`);
    await page.shot(file);
    await page.eval("document.getElementById('tdWords').style.visibility = ''");
    grounds[name] = cards.map((c) => ({ text: c.text.slice(0, 24), under: +luma(file, c.left, c.top, c.right - c.left, c.bottom - c.top).toFixed(3), beside: +((luma(file, c.left - 110, c.top, 40, c.bottom - c.top) + luma(file, c.right + 70, c.top, 40, c.bottom - c.top)) / 2).toFixed(3) }));
  };
  const stats = cardStats();
  const anchors = [];
  const draws = { idle: 0, peak: 0 };
  const keyMs = [];
  const keyFrames = [];
  await page.goto(DEV_URL.replace(/\/$/, "") + "/?sandbox=1&q=" + (process.env.Q ?? "high"), { settle: 300 });
  await gesture(page);
  await until(page, "return t.ready();", 30000);
  await page.eval("document.fonts.ready.then(() => true)");
  await page.eval("addEventListener('keydown', (e) => (window.__keyAt = performance.timeOrigin + e.timeStamp), { capture: true }), true");
  await sandbox(page, "gold", 99999);
  await sandbox(page, "wood", 9999);
  await sandbox(page, "preset");
  await until(page, "const b = t.state().buildings; return b.length >= 6 && b.every((x) => x.ready);", 40000);
  // The hero by the farm (its harvest call, the mine's, the builders'), the sandbox panel closed (F9).
  await send(page, { t: "move", agent: 0, qx: -17 * 4, qz: 36 * 4 });
  for (const type of ["keyDown", "keyUp"]) await page.send("Input.dispatchKeyEvent", { type, key: "F9", code: "F9" });
  await page.sleep(4000);
  const view = () => page.eval(td("const v = t.view(); delete v.houses; return v;"));
  await page.eval("document.getElementById('tdHud') && true");
  draws.idle = (await view())?.drawCalls ?? 0; // the scene's own; fxCalls is what the effect pool adds

  /** The live words with their calls' kinds and whether the call is a house's. */
  const words = () => page.eval(td(`const calls = new Map(t.state().calls.map((c) => [c.id, c])); return t.liveWords().map((w) => ({ ...w, kind: calls.get(w.call)?.kind ?? -1, bright: calls.get(w.call)?.bright ?? false }));`));
  const pick = async (kinds) => (await words()).filter((w) => w.bright && (kinds === null || kinds.includes(w.kind))).sort((a, b) => b.age - a.age)[0];
  /** Types word w up to (not including) letter `stop`; returns it. */
  const typeTo = async (w, stop) => {
    for (let k = w.typed; k < stop; k += 1) [await letter(page, w.text[k]), await page.sleep(110)];
  };
  const sample = async () => {
    await look(page, stats);
    const v = await view();
    draws.peak = Math.max(draws.peak, v?.fxCalls ?? 0);
    if ((v?.keyMs ?? -1) >= 0) [keyMs.push(v.keyMs), keyFrames.push(v.keyFrames)];
    if (v?.anchors) anchors.push(...JSON.parse(v.anchors));
  };

  const cast = process.env.FRAMES === "1" ? await screencast(page) : null;
  const moments = {};
  // By day: a right key, a slip, a word typed (an economy call), then a few words for the chain and one more on camera.
  let w = await until(page, "return t.liveWords().length > 0;", 20000) && (await pick(null));
  if (w) {
    await typeTo(w, 1);
    await sample();
    if (cast) moments.key = await cast.record("key-dark-" + size, async () => [await letter(page, w.text[1]), Date.now() / 1000][1]);
    else await letter(page, w.text[1]);
    await sample();
    const wrong = w.text[2] === "q" ? "x" : "q";
    if (cast) moments.wrong = await cast.record("wrong-dark-" + size, async () => [await letter(page, wrong), Date.now() / 1000][1]);
    else await letter(page, wrong);
    await sample();
    await measure("day");
    w = (await words()).find((x) => x.id === w.id) ?? w;
    await typeTo(w, w.text.length - 1);
    await sample();
    if (cast) moments.word = await cast.record("word-dark-" + size, async () => [await letter(page, w.text[w.text.length - 1]), Date.now() / 1000][1]);
    else await letter(page, w.text[w.text.length - 1]);
    await page.sleep(300);
    await sample();
  }
  // By night: power words on the towers, each Word Shot through its five phases; the word that steps the chain's tier
  // (5, 10, 20) on camera as the combo (any bright word: economy calls go on by night).
  await send(page, { t: "move", agent: 0, qx: 0, qz: 13 * 4 });
  await key(page, "Enter", { shift: true });
  await page.sleep(1500);
  await send(page, { t: "sandbox", op: { op: "spawn", enemy: "thuong-luong", value: 4 } });
  let power = null;
  const ends = Date.now() + 80000;
  while (Date.now() < ends && !(moments.shot && moments.combo) && !(cast === null && power !== null && (await page.eval(td("return t.typing().chain;"))) >= 5)) {
    const next = await until(page, `const c = new Map(t.state().calls.map((x) => [x.id, x])); return t.liveWords().filter((w) => c.get(w.call)?.bright).sort((a, b) => b.age - a.age)[0] ?? null;`, 20000, 120);
    if (!next) break;
    const chain = (await page.eval(td("return t.typing().chain;"))) ?? 0;
    const kind = await page.eval(td(`return t.state().calls.find((c) => c.id === ${next.call})?.kind ?? -1;`));
    if (cast && kind === KIND.power && !moments.keyLight && next.text.length >= 3) {
      // A tower's card over the road: a right key and a slip on light ground.
      await typeTo(next, 1);
      moments.keyLight = await cast.record("key-light-" + size, async () => [await letter(page, next.text[1]), Date.now() / 1000][1]);
      moments.wrongLight = await cast.record("wrong-light-" + size, async () => [await letter(page, next.text[2] === "q" ? "x" : "q"), Date.now() / 1000][1]);
      await measure("night");
    }
    const now = (await words()).find((x) => x.id === next.id);
    if (now === undefined) continue;
    await typeTo(now, now.text.length - 1);
    const last = async () => [await letter(page, next.text[next.text.length - 1]), Date.now() / 1000][1];
    if (kind === KIND.power && power === null) power = next;
    if (cast && [4, 9, 19].includes(chain) && !moments.combo) moments.combo = await cast.record("combo-" + size, last, 150, 1000);
    else if (cast && kind === KIND.power && !moments.shot) {
      // A shot that flies up the screen passes under its own card: keep one going sideways or towards the camera (or any, late).
      const frames = await cast.record("shot-" + size, last, 150, 1300);
      if (((await view())?.shotDz ?? -1) > -0.3 || Date.now() > ends - 25000) moments.shot = frames;
    }
    else await last();
    await page.sleep(200);
    await sample();
  }
  await cast?.close();
  for (const type of ["keyDown", "keyUp"]) await page.send("Input.dispatchKeyEvent", { type, key: "F1", code: "F1" });
  await page.sleep(800);
  await page.shot(out("td-1c-words-" + size + ".jpg"));

  const final = await state(page);
  const checks = {
    tdWords: cardsClean(stats) && stats.samples > 0,
    tdHudBudget: stats.overHud.length === 0,
    groundUnderCards: Object.values(grounds).flat().every((g) => g.under <= 0.6),
    tdScale: anchors.length > 0 && anchors.every((a) => (a.gap >= -1 && a.gap <= 12) || a.top <= 66), // a column kept below the top edge (lanes SAFE.top) stands lower
    fxDrawCalls: draws.peak <= 2,
    oneFrame: keyFrames.length > 0 && Math.max(...keyFrames) <= 1, // the effect is in the first frame drawn after the keydown
    wordShot: power !== null,
    ...consoleChecks(page),
  };
  return finish(page, checks, { grounds, cards: cardSummary(stats), anchors: anchors.filter((a) => (a.gap < -1 || a.gap > 12) && a.top > 66).concat(anchors.slice(0, 4)).slice(0, 10), anchorCount: anchors.length, draws, keyMs, keyFrames, moments, phase: final?.phase, chain: await page.eval(td("return t.typing().chain;")) });
}
