// Lời Gọi 1B, R2 review fix 2 (BUILD_1B §20; src/app/chunks.ts): the page when a lazy chunk cannot load. The dev
// server's module for the chunk is blocked (CDP Network.setBlockedURLs), as a stale hashed chunk after a redeploy or a
// dropped connection would fail:
//   title   "/" with the title chunk blocked: the title is skipped after its retries, the run steps, keys reach the game
//           (Insert opens the build menu), the HUD says so, and one console error names the chunk
//   sheets  "?sandbox=1" with the cards' chunk blocked: Esc pauses with the HUD's pause line instead of the card, Esc
//           again goes on; unblocked and past the 15 s cool-down, Esc asks again and the pause card shows (Chrome
//           fetches a failed dynamic import again; a browser that keeps the failure keeps the HUD's line)
// No other console error or page exception. Pictures td-1b-chunks-<name>-<size>.png.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-chunks.mjs --width=1280 --height=720
import { DEV_URL } from "./common.mjs";
import { boot, finish, key, out, sizeOf, td, until } from "./td-1a6-common.mjs";

const NOTICES = `[...document.querySelectorAll(".td-warn")].map((el) => el.textContent).join(" | ")`;
const CARD = (kind) => `(() => { const s = document.querySelector(".td-sheet.is-${kind}"); return !!s && !s.hidden; })()`;

export default async function (page) {
  const size = sizeOf(page);
  const base = DEV_URL.replace(/\/$/, "");
  const shot = (name) => page.shot(out("td-1b-chunks-" + name + "-" + size + ".png"));
  const ticks = async (ms) => {
    const a = await page.eval(td("return t.state().tick;"));
    await page.sleep(ms);
    return { a, b: await page.eval(td("return t.state().tick;")) };
  };
  await page.send("Network.enable");

  // 1. The title's chunk blocked at "/".
  await page.send("Network.setBlockedURLs", { urls: ["*src/ui/title.ts*"] });
  await page.goto(base + "/", { settle: 300 });
  const skipped = await until(page, `return t.state().tick > 30 && !document.querySelector(".tt-screen");`, 15000, 250);
  const titleSteps = await ticks(500);
  const titleNotice = await page.eval(NOTICES);
  await key(page, "Insert", { pause: 300 });
  const dock = (await page.eval(`document.querySelector(".td-dock")?.textContent ?? ""`)) ?? "";
  await shot("title");
  await key(page, "Escape");
  const titleLogs = page.logs.filter((line) => line.startsWith("error")).slice();

  // 2. The pause and results cards' chunk blocked in the sandbox.
  await page.send("Network.setBlockedURLs", { urls: ["*src/ui/sheets.ts*"] });
  const logsBefore = page.logs.length;
  const ready = await boot(page);
  await page.sleep(300);
  await key(page, "Escape", { pause: 400 });
  const paused = await page.eval(td("return t.ui().paused;"));
  const pausedTicks = await ticks(400);
  const pauseNotice = await page.eval(NOTICES);
  const pauseCard = await page.eval(CARD("pause"));
  await shot("pause");
  await key(page, "Escape", { pause: 400 });
  const resumed = await ticks(400);
  const sheetLogs = page.logs.slice(logsBefore).filter((line) => line.startsWith("error"));

  // 3. Unblocked; after the cool-down a wanted card asks for its chunk again.
  await page.send("Network.setBlockedURLs", { urls: [] });
  await page.sleep(16000);
  await key(page, "Escape", { pause: 2500 });
  const recovered = await page.eval(CARD("pause"));
  await shot("pause-again");
  await key(page, "Escape", { pause: 300 });

  const expected = (line) => /chunk did not load/.test(line);
  const checks = {
    titleSkipped: skipped === true && titleSteps.b > titleSteps.a,
    titleNotice: /Màn đầu chưa tải được/.test(titleNotice ?? ""),
    keysReachGame: /Xây nhà/.test(dock),
    titleError: titleLogs.filter(expected).length === 1 && titleLogs.some((line) => /title/.test(line)),
    ready,
    escPauses: paused === true && pausedTicks.a === pausedTicks.b && pauseCard === false,
    pauseNotice: /thẻ tạm dừng chưa tải được/.test(pauseNotice ?? ""),
    escResumes: resumed.b > resumed.a,
    sheetError: sheetLogs.filter(expected).length >= 1 && sheetLogs.some((line) => /sheets/.test(line)),
    cardAfterCoolDown: recovered === true,
    noOtherErrors: page.logs.filter((line) => line.startsWith("error") && !expected(line)).length === 0,
    noExceptions: page.exceptions.length === 0,
  };
  return finish(page, checks, { titleNotice, dock: dock.slice(0, 80), pauseNotice, titleLogs, sheetLogs });
}
