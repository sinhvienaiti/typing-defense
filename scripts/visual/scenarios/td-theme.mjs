// Lời Gọi theme (SPLIT_PLAN step D7; TK 22.1, 23, 24): the title screen, its keys and settings, the build menu,
// the pause card and the results card, pictured (td-theme-<name>-<size>.png):
//   title     the village at dusk, lanterns lit one by one, the name in Baloo 2 and the five entries
//   glyphs    every Vietnamese vowel with every tone, and đ / Đ, in the title face (a sample the run adds)
//   settings  the settings card (a volume changed by the keys and kept in storage)
//   continue  the title again from the pause card: "Chơi tiếp" is open and takes the run back
//   day       the preset village by day, a word being typed     build-menu  Insert's build menu
//   pause     Esc: the pause card                                night       the night, a power call up
//   results   the Bastion lost: the results card
// Checks: the title shows (no game step behind it), its name is in Baloo 2 and that face draws every
// Vietnamese letter itself (no fallback width), arrows move the focus, Enter on Cài đặt opens the settings,
// arrows change a volume that is stored under td.settings, Esc closes them, Enter on Bắt đầu starts the run;
// the pause card shows on Esc and Chơi tiếp returns from the title; the results card comes with the defeat;
// no console error. Without the painted backdrop file the title still paints (its CSS and SVG scene).
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-theme.mjs --width=1280 --height=720
import { DEV_URL } from "./common.mjs";
import { KIND, boot, consoleChecks, finish, key, out, sandbox, send, sizeOf, state, td, typeFor, until } from "./td-1a6-common.mjs";

/** CDP fields of the keys the title takes. */
const NAV = { ArrowUp: ["ArrowUp", 38], ArrowDown: ["ArrowDown", 40], ArrowLeft: ["ArrowLeft", 37], ArrowRight: ["ArrowRight", 39], Enter: ["Enter", 13], Escape: ["Escape", 27], Pause: ["Pause", 19] };

async function nav(page, code, pause = 120) {
  const [name, vk] = NAV[code];
  await page.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: name, code, windowsVirtualKeyCode: vk });
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: name, code, windowsVirtualKeyCode: vk });
  await page.sleep(pause);
}

/** Every Vietnamese vowel with its five tones, both cases, and đ / Đ. */
const VIET = "aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵđ";
const GLYPHS = VIET + VIET.toUpperCase();

const TITLE = `(() => {
  const el = document.querySelector(".tt-screen");
  if (!el || el.hidden) return null;
  const name = el.querySelector(".tt-name");
  const entries = [...el.querySelectorAll(".tt-entry")];
  return {
    name: name?.textContent ?? "", nameFont: name ? getComputedStyle(name).fontFamily : "",
    entries: entries.map((e) => ({ id: e.dataset.entry, text: e.textContent, focus: e.classList.contains("is-focus"), off: e.classList.contains("is-off") })),
    painted: el.classList.contains("has-art"), lit: el.querySelectorAll(".tt-lamp.is-lit").length, lamps: el.querySelectorAll(".tt-lamp").length,
    settings: !!el.querySelector(".td-settings:not([hidden])"),
  };
})()`;

/** The title face draws each letter itself: its width differs from the monospace fallback's (canvas, 48 px, weight 800). */
const FACE = `(async () => {
  await document.fonts.load("800 48px 'Baloo 2'", ${JSON.stringify(GLYPHS)});
  const ctx = document.createElement("canvas").getContext("2d");
  const width = (font, ch) => { ctx.font = font; return ctx.measureText(ch).width; };
  const chars = [...${JSON.stringify(GLYPHS)}];
  const fallback = chars.filter((ch) => Math.abs(width("800 48px 'Baloo 2', monospace", ch) - width("800 48px monospace", ch)) < 0.01);
  return { checked: chars.length, fallback, ready: document.fonts.check("800 48px 'Baloo 2'", "Lời Gọi") };
})()`;

export default async function (page) {
  const size = sizeOf(page);
  const base = DEV_URL.replace(/\/$/, "");
  const shots = [];
  const shot = async (name) => {
    const file = await page.shot(out("td-theme-" + name + "-" + size + ".png"));
    shots.push(file);
    return file;
  };
  const shown = {};

  // The title: lanterns light one by one; no step runs behind it.
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: "try { localStorage.removeItem('td.settings'); } catch {}" });
  await page.goto(base + "/", { settle: 300 });
  await page.eval("document.fonts.ready.then(() => true)");
  await page.sleep(5500);
  const title = await page.eval(TITLE);
  const tick0 = await page.eval(td("return t.state().tick;"));
  await shot("title");
  shown.title = title !== null && title.name === "Lời Gọi" && title.entries.length === 5 && title.lit >= 5;
  shown.titleFace = title?.nameFont?.startsWith('"Baloo 2"') === true;
  shown.noStepBehind = tick0 === 0 || tick0 === null ? (await page.eval(td("return t.state().tick;"))) === tick0 : false;
  const face = await page.eval(FACE);
  shown.everyVietnameseGlyph = face?.ready === true && face.checked === GLYPHS.length && face.fallback.length === 0;
  // The glyph sample, drawn over the title for the picture, then taken away.
  await page.eval(`(() => { const d = document.createElement("div"); d.id = "glyphs"; d.textContent = ${JSON.stringify(VIET + " " + VIET.toUpperCase() + " Lời Gọi")};
    Object.assign(d.style, { position: "fixed", left: "20px", right: "20px", top: "30%", padding: "18px 24px", background: "#fff4d6", color: "#2b2118", font: "800 40px/1.35 'Baloo 2'", zIndex: 99, border: "2px solid #2b2118", wordBreak: "break-all" });
    document.body.appendChild(d); return true; })()`);
  await page.sleep(200);
  await shot("glyphs");
  await page.eval(`document.getElementById("glyphs")?.remove()`);

  // Keys: arrows move the focus; Cài đặt opens; a volume moves and is stored; Esc closes.
  const focusOf = async () => (await page.eval(TITLE))?.entries.find((e) => e.focus)?.id ?? null;
  const first = await focusOf();
  await nav(page, "ArrowDown");
  const second = await focusOf();
  await nav(page, "ArrowUp");
  shown.arrowsMoveFocus = first === "start" && second !== null && second !== first && (await focusOf()) === "start";
  let toSettings = 0;
  while ((await focusOf()) !== "settings" && toSettings++ < 6) await nav(page, "ArrowDown");
  await nav(page, "Enter", 300);
  const opened = (await page.eval(TITLE))?.settings === true;
  const musicBefore = await page.eval(`document.querySelector('.td-set-row[data-key="music"] b')?.textContent ?? ""`);
  await nav(page, "ArrowDown");
  await nav(page, "ArrowLeft");
  await nav(page, "ArrowLeft");
  const musicAfter = await page.eval(`document.querySelector('.td-set-row[data-key="music"] b')?.textContent ?? ""`);
  const stored = await page.eval(`(() => { try { return JSON.parse(localStorage.getItem("td.settings")); } catch { return null; } })()`);
  await shot("settings");
  await nav(page, "Escape", 300);
  shown.settings = opened && musicBefore !== musicAfter && typeof stored?.music === "number" && (await page.eval(TITLE))?.settings === false;

  // Bắt đầu starts the run.
  while ((await focusOf()) !== "start" && toSettings++ < 12) await nav(page, "ArrowUp");
  await nav(page, "Enter", 600);
  const started = await page.eval(TITLE);
  const t1 = await page.eval(td("return t.state().tick;"));
  await page.sleep(500);
  const t2 = await page.eval(td("return t.state().tick;"));
  shown.startRuns = started === null && t2 > t1;

  // Pause card, then the title from it: Chơi tiếp takes the same run back.
  await nav(page, "Escape", 300);
  const pauseCard = await page.eval(`(() => { const s = document.querySelector(".td-sheet.is-pause"); return s && !s.hidden ? s.textContent : null; })()`);
  const back = await page.eval(`(() => { const b = [...document.querySelectorAll(".td-sheet.is-pause button")].find((b) => /màn đầu/i.test(b.textContent)); b?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 })); return !!b; })()`);
  await page.sleep(600);
  const again = await page.eval(TITLE);
  await shot("continue");
  const cont = again?.entries.find((e) => e.id === "continue");
  const tickAt = await page.eval(td("return t.state().tick;"));
  while ((await focusOf()) !== "continue" && toSettings++ < 20) await nav(page, "ArrowDown");
  await nav(page, "Enter", 600);
  const resumed = (await page.eval(TITLE)) === null && (await page.eval(td("return t.state().tick;"))) > tickAt && (await page.eval(td("return t.ui().paused;"))) === false;
  shown.pauseCard = pauseCard !== null && /Tạm dừng/.test(pauseCard);
  shown.continueFromTitle = back && cont?.off === false && resumed;

  // The game's own pictures, on a fresh sandbox run (the scenarios' URL skips the title).
  const ready = await boot(page);
  await key(page, "F9");
  await sandbox(page, "preset");
  await sandbox(page, "gold", 900);
  await sandbox(page, "wood", 300);
  await send(page, { t: "move", agent: 0, qx: 48, qz: 144 }); // the hero by the south-east trees (as td-1a6-tour): their calls light
  await page.sleep(3500);
  // Type until a word is half typed (the preset's calls light within ~20 s), then the picture.
  const midWord = async (words) => words.some((w) => w.locked && w.typed >= 2 && w.typed < w.text.length - 1);
  let keys = 0;
  for (const day0 = Date.now(); Date.now() - day0 < 30000; ) {
    keys += (await typeFor(page, 800, { wpm: 45, stop: midWord })).keys;
    if (keys > 0 && (await midWord((await page.eval(td("return t.liveWords();"))) ?? []))) break;
  }
  await shot("day");
  shown.day = keys > 0;
  if ((await page.eval(td("return t.typing().lock;"))) >= 0) await key(page, "Escape");
  await key(page, "Insert", { pause: 300 });
  const menu = (await page.eval(`document.querySelector(".td-dock")?.textContent ?? ""`)) ?? "";
  await shot("build-menu");
  shown.buildMenu = /Xây nhà/.test(menu);
  await key(page, "Escape");
  await nav(page, "Pause", 300);
  await shot("pause");
  await nav(page, "Escape", 300);
  shown.pauseResumes = (await page.eval(td("return t.ui().paused;"))) === false;

  // The night, the hero at the towers by the merge: a power call up (or, past 20 s, any crowd); then a flood at 2× until the Bastion falls.
  await send(page, { t: "move", agent: 0, qx: 0, qz: 52 });
  await page.sleep(2000);
  await key(page, "Enter", { shift: true });
  const night0 = Date.now();
  shown.night = false;
  while (Date.now() - night0 < 45000 && !shown.night) {
    const s = await state(page);
    const power = s.calls.filter((c) => c.kind === KIND.power && c.bright).map((c) => c.id);
    const words = (await page.eval(td("return t.liveWords();"))) ?? [];
    if (s.phase === "night" && s.enemies >= 3 && (words.some((w) => power.includes(w.call)) || Date.now() - night0 > 20000)) {
      await shot("night");
      shown.night = true;
    } else {
      await typeFor(page, 600, { wpm: 50, kinds: [KIND.power] });
      if (s.phase !== "night" && Date.now() - night0 > 4000) await sandbox(page, "night");
    }
  }
  if (!shown.night) await shot("night");
  await sandbox(page, "speed", 2);
  await send(page, { t: "sandbox", op: { op: "flood", value: 200 } });
  const lost = await until(page, `return t.state().phase === "defeat";`, 150000, 500);
  await page.sleep(800);
  const results = await page.eval(`(() => { const s = document.querySelector(".td-sheet.is-results"); return s && !s.hidden ? s.textContent : null; })()`);
  await shot("results");
  shown.results = lost === true && results !== null && /Fort/.test(results);

  const checks = { ready, ...Object.fromEntries(Object.entries(shown).map(([name, value]) => [name, value === true])), ...consoleChecks(page) };
  return finish(page, checks, { title, face: face && { checked: face.checked, fallback: face.fallback }, musicBefore, musicAfter, stored, pauseCard, results, shots });
}
