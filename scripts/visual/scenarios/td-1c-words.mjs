// 1C step C10 (docs/td/BUILD_1C_MAP1.md §8): the word cards on map 1's 3D view and their typing feel, for a judge.
// The sandbox at ?q=high (Q overrides), the preset's houses, the hero by the towers. Gates td-words (cards stand over
// their callers, apart, ≥ 18 px, on screen), td-hud-budget (none over a HUD panel at the default camera), td-scale (the
// lowest card of a house's column stands within 12 px over its anchor, FX_top + 0.6 m), the draw calls the effects add
// (≤ 2) and one frame from a key to its effect. With FRAMES=1 it records 1 s around a right key, a slip, a word typed,
// a chain step and a Word Shot by night (CDP screencast; needs CDP_PORT) into OUT_DIR/frames/<moment>/ with meta.json.
// C10 round 3 (lane L3): the first key on a letter two cards share (key-multi), the chain count at rest at ×2, ×3, ×5, ×7
// (OUT_DIR/combo-rest/), the cards against the HUD at PageDown, PageUp and a wheel zoom (zoomHud), and the edge tray: the camera
// panned until calls stand off screen, ≤ 2 an edge and ≤ 6 in all, a click on one gliding the camera there in 0.45 s.
// C10 round 4 (lane L4): in play every live word has its own first letter (calls.ts deals tier 1 only), so key-multi is
// forced by __td.twinFirst (one untouched word swapped for a tier-2 partner of another, TK 6.5) and recorded every run; the chain count at rest at ×10 too (amber); with FRAMES=1 the pan step a card slides into the tray in
// (tray-in), a still of two cards on one edge (tray-two) and a word typed from the tray to its last key (tray-type).
//   CDP_PORT=4152 URL=http://127.0.0.1:4150/ OUT_DIR=tmp/lane-l2/words FRAMES=1 node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1c-words.mjs --width=1920 --height=1080
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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
  await call("Page.startScreencast", { format: "jpeg", quality: 55, maxWidth: page.width, maxHeight: page.height, everyNthFrame: 1 });
  return {
    async record(name, act, before = 150, after = 900, log = false) {
      frames.length = 0;
      const edgeBefore = (await page.eval(EDGE_CARDS)) ?? [];
      await page.eval("window.__dom = [], window.__domOn = true"); // every frame's DOM boxes (cards, flying letters, ×N, stamps): a flash's measure leaves them out
      on = true;
      const startAt = Date.now();
      await page.sleep(before);
      const at = await act();
      await page.sleep(after);
      on = false;
      const endAt = Date.now();
      const dom = (await page.eval("window.__domOn = false, window.__dom")) ?? [];
      const violations = (await page.eval("window.__boxViolations"))?.filter(v => v.at >= startAt && v.at <= endAt) ?? [];
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
      writeFileSync(join(dir, "meta.json"), JSON.stringify({ name, size: sizeOf(page), frames: meta, violations, cards, edgeCards: edgeBefore.concat((await page.eval(EDGE_CARDS)) ?? []), dom: dom.map(([t, boxes]) => [Math.round(t - keyAt * 1000), boxes]), view: await page.eval(td("const v = t.view(); delete v.houses; return v;")) }, null, 1));
      return meta.length;
    },
    close: async () => [await call("Page.stopScreencast"), ws.close()],
  };
}

/** The cards standing in the edge tray (data-edge 0–3), shown, with their boxes; a typed word's meaning strip is no call to click. */
const EDGE_CARDS = `[...document.querySelectorAll(".td-card")].filter((el) => el.dataset.edge && Number(el.style.opacity) > 0.05 && !el.classList.contains("is-gone") && !el.classList.contains("is-mean")).map((el) => { const r = el.getBoundingClientRect(); return { edge: +el.dataset.edge, text: el.textContent, x: Math.round((r.left + r.right) / 2), y: Math.round((r.top + r.bottom) / 2), left: r.left, top: r.top, right: r.right, bottom: r.bottom }; })`;

/** Measure real effect boxes every animation frame, including all frames between capture samples.
 * Keep the old dom array shape for the pixel masks; named violations are separate and never rounded. */
const DOM_LOG = `(() => {
  window.__dom = []; window.__domOn = false; window.__boxViolations = []; window.__boxFrames = 0; window.__boxesOn = true;
  const keep = () => {
    const at = performance.timeOrigin + performance.now(), out = [], overHud = [], offScreen = [];
    const panels = [...document.querySelectorAll(".td-hud .td-panel")].filter(el => getComputedStyle(el).display !== "none").map(el => ({ name: el.className, r: el.getBoundingClientRect() })).filter(p => p.r.width > 0 && p.r.height > 0);
    for (const el of document.querySelectorAll(".td-card, .td-key-stamp, .td-fly, .td-combo, .td-stamp, .td-tray-arrow")) {
      const cs = getComputedStyle(el);
      if (!(parseFloat(cs.opacity) > 0.02) || cs.visibility !== "visible" || cs.display === "none") continue;
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const name = el.className + ":" + (el.textContent || el.dataset.art || "").slice(0, 48);
      out.push([r.left, r.top, r.right, r.bottom].map(Math.round));
      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) offScreen.push(name);
      for (const p of panels) if (Math.min(r.right, p.r.right) - Math.max(r.left, p.r.left) > 1 && Math.min(r.bottom, p.r.bottom) - Math.max(r.top, p.r.top) > 1) overHud.push(name + " / " + p.name);
    }
    window.__boxFrames++;
    if (overHud.length || offScreen.length) window.__boxViolations.push({ at, frame: window.__boxFrames, overHud, offScreen });
    if (window.__domOn) window.__dom.push([at, out]);
    if (window.__boxesOn) requestAnimationFrame(keep);
  };
  requestAnimationFrame(keep); return true;
})()`;

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
  await page.eval(DOM_LOG);
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
  /** The chain count at rest (+260 ms) at ×2, ×3, ×7, ×10 (×5 from the combo screencast): a full shot, the tag's box and its digit's ink height. */
  const rest = {};
  const restShot = async (n) => {
    mkdirSync(out("combo-rest"), { recursive: true });
    await page.shot(out(`combo-rest/x${n}-${size}.png`));
    rest["x" + n] = await page.eval(`(() => { const el = document.querySelector(".td-combo"); if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); const g = document.createElement("canvas").getContext("2d"); g.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily; const m = g.measureText("${n}"); return { box: [r.left, r.top, r.width, r.height].map(Math.round), font: parseFloat(cs.fontSize), digit: Math.round(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent), text: el.textContent }; })()`);
  };
  /** The first key on a letter two cards share (T1 on each): a tier-2 pair forced by __td.twinFirst, recorded as key-multi. */
  const keyMulti = async () => {
    const untyped = async () => (await words()).filter((x) => x.typed === 0);
    const twin = (list) => list.find((a) => list.some((b) => b.id !== a.id && b.text[0] === a.text[0]));
    let live = await untyped();
    // A call's next word comes locked (calls.ts): a Backspace lets it go when nothing is typed on it yet.
    if (live.some((x) => x.locked)) [await key(page, "Backspace"), await page.sleep(120), live = await untyped()];
    let pair = twin(live);
    if (!pair && live.length >= 2 && (moments.twin = await page.eval(td("return t.twinFirst();")))) [await page.sleep(200), live = await untyped(), pair = twin(live)];
    moments.pairsSeen = (moments.pairsSeen ?? 0) + (pair ? 1 : 0);
    if (pair && ((await page.eval(td("return t.typing().lock;"))) ?? -1) < 0) {
      moments.keyMulti = await cast.record("key-multi-" + size, async () => [await letter(page, pair.text[0]), Date.now() / 1000][1]);
      moments.pair = live.filter((x) => x.text[0] === pair.text[0]).map((x) => x.text);
      [await key(page, "Backspace"), await page.sleep(200)];
    }
  };
  const ends = Date.now() + 100000;
  while (Date.now() < ends && !(moments.shot && moments.combo && (cast === null || (rest.x10 && moments.keyMulti))) && !(cast === null && power !== null && (await page.eval(td("return t.typing().chain;"))) >= 5)) {
    if (cast && !moments.keyMulti && (moments.twinTries = (moments.twinTries ?? 0) + 1) <= 14) {
      await until(page, "return t.liveWords().filter((w) => w.typed === 0).length >= 2;", 3000, 100); // two words live, or 3 s
      await keyMulti();
    }
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
    if (cast && [1, 2, 6, 9].includes(chain) && !rest["x" + (chain + 1)] && (chain !== 9 || moments.combo)) [await last(), await page.sleep(260), await restShot(chain + 1)];
    else if (cast && [4, 9, 19].includes(chain) && !moments.combo) moments.combo = await cast.record("combo-" + size, last, 150, 1000, true);
    else if (cast && kind === KIND.power && !moments.shot) {
      // A shot that flies up the screen passes under its own card: keep one going sideways or towards the camera (or any, late).
      const frames = await cast.record("shot-" + size, last, 150, 1300, true);
      if (((await view())?.shotDz ?? -1) > -0.3 || Date.now() > ends - 25000) moments.shot = frames;
    }
    else await last();
    await page.sleep(200);
    await sample();
  }
  if (moments.combo) rest.x5 = await page.eval(`(() => { const el = document.querySelector(".td-combo"); const r = el?.getBoundingClientRect(); return r ? { box: [r.left, r.top, r.width, r.height].map(Math.round), font: parseFloat(getComputedStyle(el).fontSize), fromCast: true } : null; })()`);

  const fk = async (k) => { for (const type of ["keyDown", "keyUp"]) await page.send("Input.dispatchKeyEvent", { type, key: k, code: k }); };
  // The edge tray: pan until calls stand off screen (≤ 2 an edge, ≤ 6 in all). With FRAMES=1 each pan step is recorded until a
  // card slides into the tray (tray-in); a still when two share an edge (tray-two); a word typed from the tray (tray-type); a
  // click on a tray card glides the camera there in 0.45 s.
  const trayCards = () => page.eval(EDGE_CARDS);
  const tray = { cards: [], most: 0, perEdge: [0, 0, 0, 0], glide: null, overHud: [], first: -1, two: false, typed: null };
  // Night with foes coming and the hero back by the towers (lit calls are in a help ring), two words live, else nothing goes
  // to the tray (a slow run reaches here by day 2's end, no call lit).
  if ((await state(page))?.phase !== "night") [await key(page, "Enter", { shift: true }), await page.sleep(1500)];
  await send(page, { t: "sandbox", op: { op: "spawn", enemy: "thuong-luong", value: 4 } });
  await send(page, { t: "move", agent: 0, qx: 0, qz: 13 * 4 });
  await until(page, "return t.liveWords().length >= 2;", 30000, 200);
  if (cast && !moments.keyMulti) [await until(page, "return t.liveWords().filter((w) => w.typed === 0).length >= 2;", 20000, 100), await keyMulti()];
  const ways = [["ArrowRight", 39], ["ArrowLeft", 37], ["ArrowUp", 38], ["ArrowDown", 40]];
  const pan = async (k) => {
    const [code, vk] = ways[Math.floor(k / 16) % 4];
    if (k % 16 === 0) [await fk("Home"), await page.sleep(700)]; // each way from the default view
    const step = async () => {
      await page.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: code, code, windowsVirtualKeyCode: vk });
      await page.sleep(220);
      await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: code, code, windowsVirtualKeyCode: vk });
      return Date.now() / 1000;
    };
    if (cast && tray.first < 0) await cast.record("tray-in-" + size, step, 40, 460);
    else [await step(), await page.sleep(200)];
    tray.cards = await trayCards();
    const panels = (await page.eval(LOOK))?.panels ?? [];
    for (const c of tray.cards) for (const p of panels) if (Math.min(c.right, p.right) - Math.max(c.left, p.left) > 1 && Math.min(c.bottom, p.bottom) - Math.max(c.top, p.top) > 1) tray.overHud.push(p.name + ": " + c.text);
    tray.most = Math.max(tray.most, tray.cards.length);
    for (let e = 0; e < 4; e += 1) tray.perEdge[e] = Math.max(tray.perEdge[e], tray.cards.filter((c) => c.edge === e).length);
  };
  /** A word typed from the tray: its stamps, its burst, its letters leaving the edge towards the caller. */
  const typeFromTray = async () => {
    const ids = new Set(JSON.parse((await view())?.tray || "[]").map(([id]) => id));
    const live = (await words()).filter((x) => ids.has(x.call) && x.typed === 0 && x.text.length >= 2);
    const typed = live.find((x) => x.kind === KIND.power) ?? live[0];
    if (!typed || ((await page.eval(td("return t.typing().lock;"))) ?? -1) >= 0) return;
    await typeTo(typed, typed.text.length - 1);
    const lastKey = async () => [await letter(page, typed.text[typed.text.length - 1]), Date.now() / 1000][1];
    tray.typed = { text: typed.text, kind: typed.kind, frames: cast ? await cast.record("tray-type-" + size, lastKey, 150, 1100) : (await lastKey(), 0) };
    await page.sleep(400);
    tray.cards = await trayCards();
  };
  for (let k = 0; k < 64 && !(tray.first >= 0 && (tray.two || cast === null)); k += 1) {
    await pan(k);
    if (tray.cards.length > 0 && tray.first < 0) [tray.first = k, await page.shot(out("td-1c-words-tray-" + size + ".jpg")), await typeFromTray()];
    if (!tray.two && [0, 1, 2, 3].some((e) => tray.cards.filter((c) => c.edge === e).length >= 2)) [tray.two = true, await page.shot(out("td-1c-words-tray-two-" + size + ".jpg"))];
  }
  // Back to a pan with a card in the tray (the last steps may have lost it), every way if need be.
  for (let k = 0; k < 64 && tray.cards.length === 0 && tray.first >= 0; k += 1) await pan((Math.floor(tray.first / 16) * 16 + k) % 64);
  if (tray.typed === null && tray.cards.length > 0) await typeFromTray();
  if (tray.cards.length > 0) {
    if (tray.first < 0 || !existsSync(out("td-1c-words-tray-" + size + ".jpg"))) await page.shot(out("td-1c-words-tray-" + size + ".jpg"));
    const c = tray.cards[0];
    const from = await view();
    const t0 = Date.now();
    await page.mouse(c.x, c.y, "mousePressed");
    await page.mouse(c.x, c.y, "mouseReleased");
    const path = [];
    for (let k = 0; k < 16; k += 1) {
      const v = await view();
      path.push({ ms: Date.now() - t0, x: v.x, z: v.z });
      await page.sleep(40);
    }
    const end = path.at(-1);
    const total = Math.hypot(end.x - from.x, end.z - from.z);
    const reach = path.find((p) => Math.hypot(end.x - p.x, end.z - p.z) <= 0.05 * total);
    tray.glide = { metres: +total.toFixed(1), reachMs: reach?.ms ?? -1, path: path.filter((_, k) => k % 3 === 0).map((p) => [p.ms, +p.x.toFixed(1), +p.z.toFixed(1)]) };
    await page.sleep(500);
    await page.shot(out("td-1c-words-tray-after-" + size + ".jpg"));
  }
  await cast?.close();
  // The cards against the HUD at every zoom (C10 leftover): PageDown, PageUp, then a wheel zoom in from Home, six looks each.
  const zoomStats = cardStats();
  for (const step of ["PageDown", "PageUp", "wheel"]) {
    if (step === "wheel") {
      await fk("Home");
      await page.sleep(900);
      for (let k = 0; k < 5; k += 1) await page.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: page.width / 2, y: page.height / 2, deltaX: 0, deltaY: -120 });
    } else await fk(step);
    await page.sleep(1300);
    for (let k = 0; k < 6; k += 1) [await look(page, zoomStats), await page.sleep(300)];
  }
  await fk("Home");
  await page.sleep(1000);
  await fk("Home");
  await page.sleep(800);
  for (const type of ["keyDown", "keyUp"]) await page.send("Input.dispatchKeyEvent", { type, key: "Home", code: "Home" });
  await page.sleep(800);
  await page.shot(out("td-1c-words-" + size + ".jpg"));

  const boxAudit = await page.eval(`(() => {
    window.__boxesOn = false;
    const rows = window.__boxViolations || [];
    return { frames: window.__boxFrames, overHud: { frames: rows.filter(r => r.overHud.length).length, elements: [...new Set(rows.flatMap(r => r.overHud))] }, offScreen: { frames: rows.filter(r => r.offScreen.length).length, elements: [...new Set(rows.flatMap(r => r.offScreen))] }, violations: rows };
  })()`);
  tray.overHud.push(...boxAudit.overHud.elements);
  const final = await state(page);
  const checks = {
    tdWords: cardsClean(stats) && stats.samples > 0,
    tdHudBudget: stats.overHud.length === 0 && boxAudit.overHud.frames === 0,
    offScreen: boxAudit.offScreen.frames === 0,
    groundUnderCards: Object.values(grounds).flat().every((g) => g.under <= 0.6),
    tdScale: anchors.length > 0 && anchors.every((a) => (a.gap >= -1 && a.gap <= 12) || a.top <= 66), // a column kept below the top edge (lanes SAFE.top) stands lower
    fxDrawCalls: draws.peak <= 2,
    oneFrame: keyFrames.length > 0 && Math.max(...keyFrames) <= 1, // the effect is in the first frame drawn after the keydown
    wordShot: power !== null,
    zoomHud: zoomStats.samples > 0 && zoomStats.overHud.length === 0,
    trayCap: tray.most <= 6 && tray.perEdge.every((n) => n <= 2),
    trayGlide: tray.glide !== null && tray.glide.metres > 3 && tray.glide.reachMs >= 300 && tray.glide.reachMs <= 650,
    trayClear: tray.overHud.length === 0,
    ...consoleChecks(page),
  };
  return finish(page, checks, { boxAudit, grounds, cards: cardSummary(stats), anchors: anchors.filter((a) => (a.gap < -1 || a.gap > 12) && a.top > 66).concat(anchors.slice(0, 4)).slice(0, 10), anchorCount: anchors.length, draws, keyMs, keyFrames, moments, rest, zoom: cardSummary(zoomStats), tray: { ...tray, cards: tray.cards.length }, phase: final?.phase, chain: await page.eval(td("return t.typing().chain;")) });
}
