// Lời Gọi 1B R3 (docs/td/BUILD_1B.md §19 td-1b-tour, R3_PLAN.md §6): the owner's picture tour, numbered in the order a
// player meets them (tmp/…/td-1b-tour-NN-name-WxH.png). Four pages:
// A. the sandbox's day 5 (preset, towers at level 2, the Bastion at 4): 01 the village warned of Mộc Tinh with its root
//    vein; 02 the calm before the storm (the lull's countdown); 03 the rise at the fork; 04 Rễ Trồi's ring before it
//    strikes, 05 the building it stunned; 06 Tối Thượng (`=`) over the fight; 07 the stagger at 70 % with its Dồn lửa
//    calls; 08 Mầm Gỗ; 09 the retreat; 10 the won card. There "Chép số chơi thử" is pressed: the play-test file
//    (numbers and the whole run, §22) is caught as the page saves it and its run replayed on Node to the page's hash.
// B. the sandbox's direct calls: 11 Ngắt over a drumming Tanuki, 12 Neo over a Đầu Đàn and its pack, 13 the pack pinned,
//    14 Phá Khiên over a Troll's dome, 15 the dome broken (R3; Ngắt, Neo and Phá Khiên typed for real).
// C. Học: a saved word back as a Từ Ôn (16, the jade card with "Ôn"), typed clean (17, "Chuộc lại").
// D. the story from its first moment (?title=0): 18 Bà Cú Mực's line, 19 the chip that stays.
// Checks: each moment was reached and pictured, the play-test file replays, the pages' logs replay on Node, no console
// error. Pictures are looked at by hand before a round is called done.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-tour.mjs --width=1280 --height=720
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { DEV_URL } from "./common.mjs";
import { KIND, ROOT, Seen, boot, consoleChecks, finish, key, letter, out, replayOnNode, sandbox, send, sizeOf, state, td, typeFor, until } from "./td-1a6-common.mjs";

const BOSS = { lull: 2, emerge: 3, fight: 4, retreat: 5, done: 6 };
const q = (m) => Math.round(m * 4);
const STORE = "typing-defense.learn";

export default async function (page) {
  const size = sizeOf(page);
  const shots = {};
  const shot = async (name) => (shots[name] = await page.shot(out("td-1b-tour-" + name + "-" + size + ".png")));
  const seen = new Seen();

  // A. Day 5 and the boss peak.
  const ready = await boot(page);
  await sandbox(page, "preset");
  await sandbox(page, "skipTo", 5);
  await page.sleep(400);
  for (const b of (await state(page)).buildings) if (b.def === "archer" || b.def === "cannon") await send(page, { t: "sandbox", op: { op: "level", building: b.id, value: 2 } });
  await sandbox(page, "keepLevel", 4);
  await send(page, { t: "move", agent: 0, qx: 0, qz: q(14) });
  await page.sleep(1500);
  const bar5 = await page.eval(`document.querySelector(".td-boss")?.textContent ?? ""`);
  await shot("01-ngay5-bao-boss");
  await sandbox(page, "boss");
  await page.sleep(3500);
  const lull = (await state(page)).boss.stage === BOSS.lull;
  await shot("02-lang-truoc-bao");
  await until(page, `const s = t.state(); return s.boss.stage >= ${BOSS.fight} || (s.boss.stage === ${BOSS.emerge} && s.tick >= s.boss.emergeAt + 20);`, 30000, 50);
  await page.sleep(500);
  const risen = (await state(page)).boss.stage >= BOSS.emerge;
  await shot("03-troi");
  await sandbox(page, "speed", 2);
  await until(page, "const b = t.state().boss; return b.dist >= b.mergeM - 16 || b.stage !== 4;", 40000, 100);
  await sandbox(page, "speed", 1);
  const done = { roots: false, hit: false, ult: false, stagger: false, sprouts: false, retreat: false };
  for (const ends = Date.now() + 150000; Date.now() < ends; ) {
    const s = await state(page);
    const b = s.boss;
    if (!done.roots && b.rootsEnd >= 0) {
      done.roots = true;
      await shot("04-re-troi-bao");
      await until(page, "return t.state().buildings.some((x) => x.stunned);", 3000, 50);
      done.hit = (await state(page)).buildings.some((x) => x.stunned);
      await page.sleep(250);
      await shot("05-re-troi-trung");
    } else if (!done.ult && b.stage === BOSS.fight && done.hit) {
      await sandbox(page, "ult");
      await page.sleep(200);
      await key(page, "Equal", { pause: 1300 }); // the portrait still in, the first feathers down
      done.ult = (await state(page)).ult.on === 1;
      await shot("06-toi-thuong");
    } else if (!done.stagger && s.tick < b.staggerUntil) {
      done.stagger = true;
      await page.sleep(400);
      await shot("07-choang");
    } else if (!done.sprouts && b.summonEnd >= 0) {
      done.sprouts = true;
      await page.sleep(500);
      await shot("08-mam-go");
    } else if (!done.retreat && b.stage === BOSS.retreat) {
      done.retreat = true;
      await page.sleep(900);
      await shot("09-rut");
    }
    if (s.phase === "victory" || s.phase === "defeat") break;
    if (done.stagger && !done.sprouts) await page.sleep(350);
    else await typeFor(page, 350, { wpm: 60, kinds: [KIND.power], seen });
  }
  await page.sleep(1600);
  const won = (await state(page)).phase === "victory";
  await shot("10-the-thang");
  // "Chép số chơi thử": the file the page saves is caught from its link (and the clipboard left alone).
  // The page revokes the link's blob right after its click, so the blob is kept as it is made.
  await page.eval(`(() => { window.__tdSaved = null; const make = URL.createObjectURL; URL.createObjectURL = (blob) => ((window.__tdBlob = blob), make(blob)); const click = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) window.__tdBlob.text().then((text) => (window.__tdSaved = { name: this.download, text })); else click.call(this); }; return true; })()`);
  await page.eval(`document.querySelector('.td-sheet.is-results button[data-sheet="copy"]')?.click() ?? null`);
  let saved = null;
  for (let k = 0; k < 40 && saved === null; k += 1) [saved] = [await page.eval("window.__tdSaved"), await page.sleep(150)];
  let playtest = null;
  if (saved !== null) {
    const file = JSON.parse(saved.text);
    const runFile = out("td-1b-tour-playtest-run-" + size + ".json");
    writeFileSync(out("td-1b-tour-" + saved.name), saved.text);
    writeFileSync(runFile, JSON.stringify(file.run));
    try {
      playtest = { name: saved.name, numbers: Object.keys(file.numbers ?? {}), commands: file.run?.log?.length ?? 0, ...JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "scripts/td/replay.ts", runFile], { cwd: ROOT, encoding: "utf8" })) };
    } catch (error) {
      playtest = { name: saved.name, match: false, error: String(error.stdout || error.message).slice(0, 300) };
    }
  }
  const replayA = await replayOnNode(page, "td-1b-tour-boss");

  // B. Ngắt, Neo, Phá Khiên in the sandbox.
  await boot(page);
  await sandbox(page, "preset");
  await send(page, { t: "move", agent: 0, qx: q(-6), qz: q(6) });
  await page.sleep(3000);
  const spawn = (enemy, value) => ({ t: "sandbox", op: { op: "spawn", enemy, value } });
  const plan = [[0, [spawn("tanuki", 1)]], [4000, [spawn("cuong-thi", 5)]], [7000, [spawn("cuong-thi", 5), spawn("cuong-thi-lead", 1)]], [10000, [spawn("cuong-thi", 5)]], [14000, [spawn("troll", 1)]]];
  const want = { tanuki: "11-ngat", "cuong-thi-lead": "12-neo", troll: "14-pha-khien" };
  const after = { 1: "13-dung-sung", 2: "15-vo-vom" };
  const met = {};
  const t0 = Date.now();
  const direct = new Seen();
  while (Date.now() - t0 < 150000 && Object.keys(met).length < 5) {
    while (plan.length > 0 && Date.now() - t0 >= plan[0][0]) await send(page, ...plan.shift()[1]);
    const s = await state(page);
    for (const c of s.calls.filter((x) => x.kind === KIND.direct && x.bright && x.expire - s.tick >= 120)) {
      const foe = s.foes.find((f) => f.id === c.foe);
      const name = foe && want[foe.def];
      if (name !== undefined && met[name] === undefined) {
        await page.sleep(150);
        met[name] = true;
        await shot(name);
      }
    }
    await typeFor(page, 600, { wpm: 50, kinds: [KIND.direct], seen: direct, stop: (words) => !words.some((w) => w.kind === KIND.direct) });
    for (const e of direct.of("direct").filter((d) => d.ok && after[d.verb] !== undefined && met[after[d.verb]] === undefined)) {
      met[after[e.verb]] = true;
      await page.sleep(150);
      await shot(after[e.verb]);
    }
    await page.sleep(150);
  }
  const replayB = await replayOnNode(page, "td-1b-tour-direct");

  // C. A saved word back as a Từ Ôn, redeemed.
  const setup = await page.eval(`(async () => {
    const { loadDeck } = await import("/src/app/vocab.ts");
    const { deck } = await loadDeck();
    const text = (w) => String.fromCharCode(...deck.letters.subarray(deck.start[w], deck.start[w] + deck.len[w]).map((c) => c + 97));
    for (let w = 0; w < deck.count; w += 1) if (deck.level[w] === 1 && deck.len[w] >= 4 && deck.len[w] <= 5 && !"qxzj".includes(text(w)[0])) return { id: deck.ids[w], text: text(w) };
    return null;
  })()`);
  const { identifier } = await page.send("Page.addScriptToEvaluateOnNewDocument", { source: `localStorage.setItem(${JSON.stringify(STORE)}, ${JSON.stringify(JSON.stringify({ v: 1, book: [setup.id], seen: {} }))});` });
  await boot(page);
  await page.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  const op = (name, value) => ({ t: "sandbox", op: value === undefined ? { op: name } : { op: name, value } });
  await send(page, op("preset"), op("keepLevel", 1), op("gold", 800), op("wood", 300));
  await send(page, { t: "move", agent: 0, qx: q(13), qz: q(35) });
  let tuOn = null;
  let redeemed = null;
  for (const ends = Date.now() + 180000; Date.now() < ends && redeemed === null; ) {
    await typeFor(page, 400, { wpm: 35, stop: (words) => words.some((w) => w.review) });
    const words = (await page.eval(td("return t.liveWords();"))) ?? [];
    const review = words.find((w) => w.review);
    if (review === undefined) {
      const s = await state(page);
      const hero = s.agents[0];
      const chop = s.calls.filter((c) => c.kind === KIND.chop).sort((a, b) => (a.x - hero.x) ** 2 + (a.z - hero.z) ** 2 - (b.x - hero.x) ** 2 - (b.z - hero.z) ** 2)[0];
      if (chop !== undefined && !chop.bright && hero.mode === 0 && s.reviewAt.some((at) => at <= s.tick)) await send(page, { t: "move", agent: 0, qx: q(chop.x + 2), qz: q(chop.z + 2) });
      continue;
    }
    await page.sleep(200);
    tuOn = { text: review.text, card: await page.eval(`[...document.querySelectorAll(".td-card.is-review")].filter((el) => Number(el.style.opacity) > 0.05).map((el) => el.textContent)[0] ?? ""`) };
    await shot("16-tu-on");
    if ((await page.eval(td("return t.typing().lock;"))) >= 0) await send(page, { t: "unlock" });
    for (const ch of review.text) [await letter(page, ch), await page.sleep(160)];
    await page.sleep(150);
    redeemed = await page.eval(`[...document.querySelectorAll(".td-stamp.is-redeem")].filter((el) => Number(el.style.opacity) > 0.2).map((el) => el.textContent)[0] ?? ""`);
    await shot("17-chuoc-lai");
  }

  // D. The story's first day: Bà Cú Mực's line, then the chip that stays.
  await page.goto(DEV_URL.replace(/\/$/, "") + "/?title=0", { settle: 300 });
  await until(page, "return t.ready();", 20000);
  await page.eval("document.fonts.ready.then(() => true)");
  await page.sleep(1200);
  const tip = () => page.eval(`(() => { const el = document.querySelector(".td-tip"); return el ? { say: el.querySelector(".td-say")?.textContent ?? "", chip: el.querySelector(".td-tip-chip b")?.textContent ?? "" } : null; })()`);
  const line = await tip();
  await shot("18-ba-cu-muc");
  await page.sleep(8500);
  const chip = await tip();
  await shot("19-chip");

  const checks = {
    ready,
    day5Warned: /Mộc Tinh/.test(bar5),
    lullPictured: lull,
    risePictured: risen,
    rootsWarnedThenStruck: done.roots && done.hit,
    ultCast: done.ult,
    staggerSproutsRetreat: done.stagger && done.sprouts && done.retreat,
    wonCard: won,
    playtestFileReplays: playtest !== null && playtest.match === true && playtest.commands > 0 && playtest.numbers.includes("flow") && playtest.numbers.includes("profile"),
    ngatNeoDomePictured: met["11-ngat"] === true && met["12-neo"] === true && met["14-pha-khien"] === true,
    neoAndDomeTyped: met["13-dung-sung"] === true && met["15-vo-vom"] === true,
    tuOnCameBack: tuOn !== null && tuOn.text === setup.text && tuOn.card.startsWith(setup.text), // the jade .is-review card (its "Ôn" is drawn by CSS)
    redeemedStamp: typeof redeemed === "string" && redeemed.includes("Chuộc lại"),
    teachingLineAndChip: line !== null && line.say !== "" && chip !== null && chip.chip !== "",
    pagesReplay: replayA.match === true && replayB.match === true,
    ...consoleChecks(page),
  };
  return finish(page, checks, { bar5, done, met, playtest, tuOn, redeemed, line, chip, replayA, replayB, shots });
}
