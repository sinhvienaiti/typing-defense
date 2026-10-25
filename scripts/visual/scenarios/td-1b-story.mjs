// Lời Gọi 1B R3 (docs/td/BUILD_1B.md §12, §14, §4.3; docs/td/R3_PLAN.md §6 td-1b-story): the story's teaching table, the
// "Chế độ" setting and the stars kept. With td.settings and td.campaign cleared:
// 1. the title: "Bắt đầu" shows no stars; Cài đặt's "Chế độ" row reads "Theo hồ sơ" and ← → step it (stored); set to
//    Thử thách, the run started from the title plays Thử thách;
// 2. day 1: the teaching frame (top right, off the field) shows Bà Cú Mực's first sentence and the day's chip, the second
//    sentence 3.8 s later, then the chip alone; two lines at most in the day's first 20 s; no word card under it; the build
//    menu says what Tháp Cung does;
// 3. night 1 (called early): its row, two lines at most; the pause card's settings step the mode to Cân bằng: this run
//    stays Thử thách (the next run plays it);
// 4. day 3, the standard bot's story to it kept as "Chơi lại Ngày 3" (scripts/td/retry-log.ts, R3_PLAN §5 A13): the
//    replayed day shows its row; the build menu says what Tháp Pháo does (it opens on day 3);
// 5. a won story (retry-log --end: the bot's run replayed to its end): the won card shows the stars and "Kỷ lục mới",
//    td.campaign keeps them; the title shows them on "Bắt đầu" and the next run plays the mode set in step 3.
// Pictures td-1b-story-<name>: title, settings-mode, day1, day1-chip, build-does, night1, pause-settings, day3, won,
// title-stars. Exits 1 on a failed check.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-story.mjs --width=1280 --height=720
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { DEV_URL } from "./common.mjs";
import { ROOT, cardStats, cardSummary, cardsClean, consoleChecks, finish, key, look, out, screen, sizeOf, state, td } from "./td-1a6-common.mjs";

const NAV = { ArrowUp: ["ArrowUp", 38], ArrowDown: ["ArrowDown", 40], ArrowLeft: ["ArrowLeft", 37], ArrowRight: ["ArrowRight", 39], Enter: ["Enter", 13], Escape: ["Escape", 27] };
async function nav(page, code, pause = 150) {
  const [name, vk] = NAV[code];
  await page.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: name, code, windowsVirtualKeyCode: vk });
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: name, code, windowsVirtualKeyCode: vk });
  await page.sleep(pause);
}

const FRAME = `(() => { const el = document.querySelector(".td-tip"); if (!el) return null; const r = el.getBoundingClientRect();
  return { text: el.textContent, say: el.querySelector(".td-say")?.textContent ?? "", chip: el.querySelector(".td-tip-chip b")?.textContent ?? "", left: r.left, top: r.top, right: r.right, bottom: r.bottom, shown: r.width > 0 }; })()`;
const ENTRY = `document.querySelector('.tt-entry[data-entry="start"] small')?.textContent ?? ""`;
/** The open settings card's mode row (the title's card and the pause card's each have one). */
const MODE_ROW = `[...document.querySelectorAll('.td-settings:not([hidden]) .td-set-row[data-key="mode"] b')].map((b) => b.textContent).join("")`;
const FOCUS = `document.querySelector(".tt-entry.is-focus")?.dataset.entry ?? null`;
/** Arrows on the title until `entry` has the focus (off entries are skipped). */
async function focusEntry(page, entry) {
  for (let k = 0; k < 8 && (await page.eval(FOCUS)) !== entry; k += 1) await nav(page, "ArrowDown");
  return (await page.eval(FOCUS)) === entry;
}
const starsOf = (lives) => [1, 6, 18].filter((least) => lives >= least).length;
const STORED = (key) => `(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(key)})); } catch { return null; } })()`;

export default async function (page) {
  const size = sizeOf(page);
  const base = DEV_URL.replace(/\/$/, "");
  const shots = [];
  const shot = async (name) => shots.push(await page.shot(out("td-1b-story-" + name + "-" + size + ".png")));
  const cards = cardStats();
  const waitReady = async () => {
    for (let k = 0; k < 80; k += 1) {
      if ((await page.eval(td("return t.ready();"))) === true) return true;
      await page.sleep(250);
    }
    return false;
  };
  /** Bà Cú Mực's lines said and the chips shown over `ms`, sampled every 300 ms; the word cards looked at too. */
  const listen = async (ms) => {
    const said = new Set();
    const chips = new Set();
    const boxes = [];
    for (const ends = Date.now() + ms; Date.now() < ends; ) {
      const f = await page.eval(FRAME);
      if (f?.say) said.add(f.say);
      if (f?.chip) chips.add(f.chip);
      if (f?.shown) boxes.push(f);
      await look(page, cards);
      await page.sleep(300);
    }
    return { said: [...said], chips: [...chips], boxes };
  };

  // 1. The title, its settings: the mode row.
  const { identifier } = await page.send("Page.addScriptToEvaluateOnNewDocument", { source: "try { localStorage.removeItem('td.settings'); localStorage.removeItem('td.campaign'); } catch {}" });
  await page.goto(base + "/", { settle: 300 });
  await page.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  await page.eval("document.fonts.ready.then(() => true)");
  await page.sleep(2500);
  const entryBefore = await page.eval(ENTRY);
  await shot("title");
  await focusEntry(page, "settings");
  await nav(page, "Enter", 500); // Cài đặt
  const modeFirst = await page.eval(MODE_ROW);
  await nav(page, "ArrowUp"); // the last row: Chế độ
  const steps = [];
  for (let k = 0; k < 3; k += 1) {
    await nav(page, "ArrowRight");
    steps.push(await page.eval(MODE_ROW));
  }
  const storedMode = (await page.eval(STORED("td.settings")))?.mode ?? null;
  await shot("settings-mode");
  await nav(page, "Escape", 300);
  await focusEntry(page, "start");
  await nav(page, "Enter", 400); // Bắt đầu
  await waitReady();
  const run1 = await page.eval(td("return { mode: t.state().mode, flags: t.flags().mode, tick: t.state().tick };"));

  // 2. Day 1: the frame, its two lines and chip; the build menu's line.
  await page.sleep(700);
  const first = await page.eval(FRAME);
  await shot("day1");
  const day1 = await listen(9000);
  await shot("day1-chip");
  const after = await page.eval(FRAME);
  const day1More = await listen(10000);
  const field = screen(page, 48, 0).x;
  await key(page, "Insert", { pause: 300 });
  await key(page, "Digit1", { pause: 300 });
  const menu = await page.eval(`document.querySelector(".td-dock .td-does")?.textContent ?? ""`);
  const menuFits = await page.eval(`(() => { const d = document.querySelector(".td-dock"); const p = d?.querySelector(".td-does"); if (!d || !p) return false; const a = d.getBoundingClientRect(), b = p.getBoundingClientRect(); return b.right <= a.right + 0.5 && p.scrollWidth <= p.clientWidth + 1; })()`);
  await shot("build-does");
  await key(page, "Escape", { pause: 200 });

  // 3. Night 1, called early; the pause card's settings change the next run's mode.
  await key(page, "Enter", { shift: true, pause: 900 });
  const night = await page.eval(FRAME);
  await shot("night1");
  const night1 = await listen(9000);
  await nav(page, "Escape", 400); // the pause card
  await nav(page, "ArrowDown");
  await nav(page, "Enter", 400); // Cài đặt
  await nav(page, "ArrowUp");
  await nav(page, "ArrowLeft"); // Thử thách → Cân bằng
  const pauseMode = await page.eval(MODE_ROW);
  await shot("pause-settings");
  await nav(page, "Escape", 300);
  await nav(page, "Escape", 300);
  const run1After = await page.eval(td("return { mode: t.state().mode, paused: t.ui().paused };"));
  const storedNext = (await page.eval(STORED("td.settings")))?.mode ?? null;

  // 4. Day 3 from the bot's story, kept as "Chơi lại Ngày 3".
  const day3File = out("td-1b-story-day3-retry.json");
  const made3 = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "scripts/td/retry-log.ts", "--seed=7", "--day=3", "--out=" + day3File], { cwd: ROOT, encoding: "utf8" }));
  await page.eval(`(() => { sessionStorage.setItem("td.retry", ${JSON.stringify(readFileSync(day3File, "utf8"))}); return true; })()`);
  await page.goto(base + "/?seed=7&title=0", { settle: 300 });
  const ready3 = await waitReady();
  const replay3 = await page.eval(td("return t.retry();"));
  await page.sleep(900);
  const day3First = await page.eval(FRAME);
  await shot("day3");
  const day3 = await listen(9000);
  await key(page, "Insert", { pause: 300 });
  await key(page, "Digit2", { pause: 300 });
  const cannon = await page.eval(`document.querySelector(".td-dock .td-does")?.textContent ?? ""`);
  await key(page, "Escape", { pause: 200 });

  // 5. A won story (the bot's whole run replayed): the won card, td.campaign, the title's stars, the next run's mode.
  const wonFile = out("td-1b-story-won-retry.json");
  const madeWon = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "scripts/td/retry-log.ts", "--seed=7", "--end", "--out=" + wonFile], { cwd: ROOT, encoding: "utf8" }));
  await page.eval(`(() => { sessionStorage.setItem("td.retry", ${JSON.stringify(readFileSync(wonFile, "utf8"))}); return true; })()`);
  await page.goto(base + "/?seed=7&title=0", { settle: 300 });
  const readyWon = await waitReady();
  await page.sleep(2600); // the stars stamp one by one
  const wonCard = await page.eval(`(() => { const el = document.querySelector(".td-sheet.is-results"); if (!el || el.hidden) return null; const r = el.getBoundingClientRect();
    return { text: el.textContent, stars: el.querySelectorAll(".td-stars i.on").length, best: el.querySelector(".td-best")?.textContent ?? "", top: r.top, bottom: r.bottom }; })()`);
  const wonState = await state(page);
  const campaign = await page.eval(STORED("td.campaign"));
  await shot("won");
  await page.goto(base + "/", { settle: 300 });
  await page.eval("document.fonts.ready.then(() => true)");
  await page.sleep(2500);
  const entryAfter = await page.eval(ENTRY);
  await shot("title-stars");
  await focusEntry(page, "start");
  await nav(page, "Enter", 400);
  await waitReady();
  const run2 = await page.eval(td("return t.state().mode;"));

  const sentences = (text) => text.split(/(?<=[.!?])\s+/);
  const offField = (boxes) => boxes.length > 0 && boxes.every((b) => b.left >= field - 1 && b.right <= page.width && b.bottom <= page.height / 2);
  const checks = {
    titleNoStarsYet: entryBefore.length > 0 && !entryBefore.includes("★"),
    modeRowSteps: modeFirst.includes("Theo hồ sơ") && steps.join("|") === ["Thư giãn", "Cân bằng", "Thử thách"].map((m) => "‹ " + m + " ›").join("|") && storedMode === "challenge",
    runPlaysTheMode: run1?.mode === "challenge" && run1.flags === "challenge",
    day1Row: first?.say?.startsWith("Bà Cú Mực: Lúa chín") === true && (first.chip ?? "").includes("Gõ chữ đầu") && day1.said.length === 2 && after?.say === "" && after?.chip !== "",
    twoLinesAPhase: day1.said.length + day1More.said.filter((line) => !day1.said.includes(line)).length <= 2 && night1.said.length <= 2 && day3.said.length <= 2,
    frameOffTheField: offField([...day1.boxes, ...night1.boxes, ...day3.boxes]),
    buildMenuSaysWhat: menu.includes("Bắn quái gần") && menuFits === true,
    night1Row: night?.say?.startsWith("Bà Cú Mực: Đêm xuống") === true && (night.chip ?? "").includes("Bỏ qua lời gọi"),
    modeAppliesNextRun: pauseMode.includes("Cân bằng") && storedNext === "balanced" && run1After?.mode === "challenge" && run2 === "balanced",
    replayedDay3Row: ready3 && replay3?.matched === true && replay3.day === 3 && day3First !== null && (day3First.say.startsWith("Bà Cú Mực: Nâng Lũy") || day3.said.some((line) => line.startsWith("Bà Cú Mực: Nâng Lũy"))),
    cannonSaysWhat: cannon.includes("Đạn nổ"),
    wonCardRecord: readyWon && wonState?.phase === "victory" && wonCard !== null && wonCard.stars === starsOf(madeWon.lives) && /Kỷ lục mới/.test(wonCard.best) && wonCard.top >= 0 && wonCard.bottom <= page.height,
    starsKept: campaign?.v === 1 && campaign.best?.["w1-silverfall"] === wonCard?.stars,
    titleShowsStars: entryAfter.includes("★".repeat(wonCard?.stars ?? 9)),
    cardsClean: cardsClean(cards),
    ...consoleChecks(page),
  };
  return finish(page, checks, {
    entryBefore, modeFirst, steps, storedMode, run1, first, after, day1: day1.said, frames: day1.boxes.length + night1.boxes.length + day3.boxes.length, day1More: day1More.said, field, menu, night, night1: night1.said, pauseMode, run1After, storedNext,
    made3, replay3, day3First, day3: day3.said, cannon, madeWon, wonCard, campaign, entryAfter, run2, sentences: sentences("a. b"), cards: cardSummary(cards), shots,
  });
}
