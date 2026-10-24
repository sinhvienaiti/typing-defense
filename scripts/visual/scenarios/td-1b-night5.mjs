// Lời Gọi 1B R1 (docs/td/BUILD_1B.md §19 td-1b-night5, §4.3, §4.4): the sandbox's skipTo to day 5 (the preset down,
// four nights held): Mộc Tinh is warned with its branch (the root vein on the map, Bà Cú Mực's line under the boss
// bar); no tower on the merge (they are sold), the boss called at once: the 12 s lull lights no economy call, it rises,
// walks to the Bastion and strikes it (3 lives a blow, warned 1.2 s) until it falls: the loss card has its hint and
// "Chơi lại Ngày 5" first. Pressed, the page reloads and replays its log to day 5's start: the hash the page computes at
// the replay's end, before its first live step (t.retry(), review R1), must be the one kept before the reload, the boss
// bar shows its chip and Bà Cú Mực's line again, the run goes on, and its new log replays on Node to the page's hash.
// Then a long run: the standard bot's story to day 5 in Thư giãn (scripts/td/retry-log.ts, ~40,000 ticks) put in
// sessionStorage as the page keeps it; the page must replay it to the same hash. Pictures: the warned day, the vein,
// the blow, the loss card, the replayed day 5.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-night5.mjs --width=1280 --height=720
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { DEV_URL } from "./common.mjs";
import { KIND, ROOT, Seen, boot, consoleChecks, finish, key, out, replayOnNode, sandbox, send, sizeOf, state, td, until } from "./td-1a6-common.mjs";

export default async function (page) {
  const size = sizeOf(page);
  const seen = new Seen();
  const shots = [];
  const ready = await boot(page);
  await sandbox(page, "preset");
  await sandbox(page, "skipTo", 5);
  await page.sleep(1200);
  const warned = await state(page);
  const say = await page.eval(`document.querySelector(".td-boss")?.textContent ?? ""`);
  shots.push(await page.shot(out("td-1b-night5-warned-" + size + ".png")));
  // No tower on the merge: sell them (twice each, past their 5 s).
  for (const b of warned.buildings) if (b.def === "archer" || b.def === "cannon") await send(page, { t: "sell", building: b.id });
  await sandbox(page, "boss");
  let litEconomy = 0;
  for (let k = 0; k < 40; k += 1) {
    const s = await state(page);
    if (s.boss.stage !== 2) break;
    litEconomy += s.calls.filter((c) => c.bright && c.kind !== KIND.power).length;
    await page.sleep(250);
  }
  await sandbox(page, "speed", 2);
  await until(page, "const s = t.state(); return s.boss.keepEnd >= 0 || s.phase === 'defeat';", 150000, 200);
  await sandbox(page, "speed", 1);
  shots.push(await page.shot(out("td-1b-night5-blow-" + size + ".png")));
  await until(page, "return t.state().phase === 'defeat';", 60000, 200);
  await page.sleep(800);
  await seen.poll(page);
  const sheet = await page.eval(`(() => { const el = document.querySelector(".td-sheet.is-results"); return el && !el.hidden ? { hint: el.querySelector(".td-hint-line")?.textContent ?? "", first: el.querySelector("button[data-sheet]")?.dataset.sheet ?? "" } : null; })()`);
  shots.push(await page.shot(out("td-1b-night5-lost-" + size + ".png")));
  const blows = seen.of("bossStrike").filter((e) => e.move === "keep");
  const kept = await page.eval(td("return { hashes: t.dayHashes(), starts: t.state().day };"));
  // "Chơi lại Ngày 5" (Enter on the card): the page reloads with the run replayed to day 5.
  await key(page, "Enter");
  await page.sleep(3500);
  let back = null;
  for (let k = 0; k < 60 && back === null; k += 1) {
    back = await page.eval(td("return t.ready() ? { s: t.state(), retry: t.retry() } : null;"));
    if (back === null || back.evalError) [back] = [null, await page.sleep(250)];
  }
  await page.sleep(2000);
  const bar = await page.eval(`document.querySelector(".td-boss")?.textContent ?? ""`);
  shots.push(await page.shot(out("td-1b-night5-replayed-" + size + ".png")));
  const replay = await replayOnNode(page, "td-1b-night5");
  // The long run: written by Node, kept as main.ts keeps it, the page reloaded on its seed (the story, past the title).
  const file = out("td-1b-night5-long-retry.json");
  const made = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "scripts/td/retry-log.ts", "--seed=7", "--day=5", "--mode=relax", "--out=" + file], { cwd: ROOT, encoding: "utf8" }));
  await page.eval(`(() => { sessionStorage.setItem("td.retry", ${JSON.stringify(readFileSync(file, "utf8"))}); return true; })()`);
  await page.goto(DEV_URL.replace(/\/$/, "") + "/?seed=7&title=0", { settle: 300 });
  let long = null;
  for (let k = 0; k < 80 && long === null; k += 1) {
    long = await page.eval(td("return t.ready() ? { retry: t.retry(), day: t.state().day, mode: t.state().mode } : null;"));
    if (long === null || long.evalError) [long] = [null, await page.sleep(250)];
  }
  const checks = {
    ready,
    warnedWithBranch: warned.day === 5 && warned.boss.stage === 1 && warned.boss.route >= 0 && say.includes("Mộc Tinh"),
    lullLightsNoEconomy: litEconomy === 0,
    blowsOfThree: blows.filter((e) => e.hit).length >= 1 && blows.filter((e) => e.hit).every((e) => e.count <= 3),
    blowsWarned72: blows.filter((e) => e.hit).every((hit) => hit.tick - (blows.filter((e) => !e.hit && e.tick < hit.tick).at(-1)?.tick ?? -1e9) === 72),
    lossCardWithRetryFirst: sheet !== null && sheet.first === "retry" && sheet.hint.length > 0,
    replayedToDay5: back !== null && back.s.day === 5 && back.s.phase !== "defeat" && back.retry?.day === 5 && back.retry.matched === true && back.retry.hash === kept.hashes[5],
    barBackAfterReplay: bar.includes("Boss") && bar.includes("Bà Cú Mực"),
    nodeReplaysToBrowserHash: replay.match === true,
    longLogReplays: long !== null && long.retry?.matched === true && long.retry.hash === made.hash && long.retry.tick === made.tick && long.day === 5 && long.mode === "relax",
    ...consoleChecks(page),
  };
  return finish(page, checks, { say, bar, litEconomy, blows: blows.length, sheet, kept: kept.hashes[5], retried: back?.retry, replay, long: { made, page: long }, shots });
}
