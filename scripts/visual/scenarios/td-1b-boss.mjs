// Lời Gọi 1B R1 "Mộc Tinh tới" (docs/td/BUILD_1B.md §19 td-1b-boss, §13.1): the sandbox preset (towers raised to
// level 2, the Bastion to 4, Draconis by the merge), the sandbox's `boss`: the crack crawls through the 12 s lull, it
// rises at the fork on the warned branch, walks to the merge (game speed 2 on the way, 1 for the pictures), roots
// buildings (the striped ring 1.5 s before the strike, stunned buildings marked), slams soldiers (the red arc), is
// staggered at 70 % by real power words typed at 60 WPM (the banner under the boss bar at the top, the "Dồn lửa"
// calls ≤ the cap, lit with or without a help ring, 2 words at E 35; the vulnerable countdown on the bar: review R1),
// calls Mầm Gỗ and retreats at 50 %: the results card has its stars and the chest. Slow frame sets (jpg) of each
// move: lull, rise, roots warning and strike, slam, stagger, sprouts, retreat. Checks: the warnings' times from the events, the
// banner's place, no card over the HUD (the boss bar is a panel), the page's log replayed on Node to its hash.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-boss.mjs --width=1280 --height=720
import { KIND, Seen, boot, cardStats, cardSummary, cardsClean, consoleChecks, finish, look, out, replayOnNode, sandbox, send, sizeOf, state, td, typeFor } from "./td-1a6-common.mjs";

const BOSS = { lull: 2, emerge: 3, fight: 4, retreat: 5, done: 6 };

export default async function (page) {
  const size = sizeOf(page);
  const seen = new Seen();
  const cards = cardStats();
  const frames = {};
  const shots = [];
  const film = async (name, count, interval) => (frames[name] = await page.frames(out("td-1b-boss-" + name + "-" + size), count, interval));
  const boss = async () => (await state(page)).boss;
  const ready = await boot(page);
  await sandbox(page, "preset");
  for (const b of (await state(page)).buildings) if (b.def === "archer" || b.def === "cannon") await send(page, { t: "sandbox", op: { op: "level", building: b.id, value: 2 } });
  await sandbox(page, "keepLevel", 4);
  await send(page, { t: "move", agent: 0, qx: 0, qz: 14 * 4 });
  await page.sleep(1500);
  await sandbox(page, "boss");
  await page.sleep(300);
  const warned = await boss();
  await film("lull", 4, 2800);
  // The rise: from half a second before it breaks out.
  for (let k = 0; k < 100; k += 1) {
    const s = await state(page);
    if (s.boss.stage === BOSS.emerge && s.tick >= s.boss.emergeAt - 30) break;
    await page.sleep(50);
  }
  await film("rise", 8, 110);
  const risen = await boss();
  // On to the merge at game speed 2.
  await sandbox(page, "speed", 2);
  for (let k = 0; k < 400; k += 1) {
    const b = await boss();
    if (b.dist >= b.mergeM - 16 || b.stage !== BOSS.fight) break;
    await page.sleep(100);
  }
  await sandbox(page, "speed", 1);
  const done = { roots: false, slam: false, stagger: false, sprouts: false, retreat: false };
  let staggerAt = 0;
  let banner = null;
  let burstMax = 0;
  let burstWords = 0;
  let countdown = "";
  const sloppy = { left: 2 };
  const fight0 = Date.now();
  while (Date.now() - fight0 < 150000) {
    const b = await boss();
    const s = await state(page);
    burstMax = Math.max(burstMax, s.calls.filter((c) => c.burst && c.bright).length);
    burstWords = Math.max(burstWords, ...s.calls.filter((c) => c.burst).map((c) => c.words), 0);
    if (!done.roots && b.rootsEnd >= 0) {
      done.roots = true;
      await film("roots-warn", 6, 150);
      await film("roots-hit", 5, 90);
      shots.push(await page.shot(out("td-1b-boss-stunned-" + size + ".png")));
    } else if (!done.slam && b.slamEnd >= 0) {
      done.slam = true;
      await film("slam", 7, 120);
    } else if (!done.stagger && s.tick < b.staggerUntil) {
      done.stagger = true;
      staggerAt = Date.now();
      countdown = await page.eval(`document.querySelector(".td-boss .td-row small")?.textContent ?? ""`);
      banner = await page.eval(`(() => { const el = document.querySelector(".td-say"); const bar = document.querySelector(".td-boss"); if (!el || !bar) return null; const r = el.getBoundingClientRect(); const q = bar.getBoundingClientRect(); return { text: el.textContent, top: r.top, bottom: r.bottom, barTop: q.top, barBottom: q.bottom }; })()`);
      await film("stagger", 6, 200);
    } else if (!done.sprouts && b.summonEnd >= 0) {
      done.sprouts = true;
      await film("sprouts", 6, 120);
    } else if (!done.retreat && b.stage === BOSS.retreat) {
      done.retreat = true;
      await film("retreat", 6, 280);
    }
    if (s.phase === "victory" || s.phase === "defeat") break;
    // After the stagger the hands rest until Mầm Gỗ have sprouted once (or 25 s): the summon must be seen.
    if (done.stagger && !done.sprouts && Date.now() - staggerAt < 25000) await page.sleep(350);
    else await typeFor(page, 350, { wpm: 60, kinds: [KIND.power], seen, sloppy });
    await look(page, cards);
  }
  await page.sleep(1600);
  await seen.poll(page);
  shots.push(await page.shot(out("td-1b-boss-results-" + size + ".png")));
  const end = await state(page);
  const sheet = await page.eval(`(() => { const el = document.querySelector(".td-sheet.is-results"); return el && !el.hidden ? { text: el.textContent, stars: el.querySelectorAll(".td-stars i.on").length, review: el.querySelectorAll(".td-review li").length } : null; })()`);
  const strikes = seen.of("bossStrike");
  const pairs = (move) => strikes.filter((e) => e.move === move && e.hit).map((hit) => hit.tick - (strikes.filter((e) => e.move === move && !e.hit && e.tick < hit.tick).at(-1)?.tick ?? -1e9));
  const replay = await replayOnNode(page, "td-1b-boss");
  const checks = {
    ready,
    lullCrack: warned.stage === BOSS.lull,
    // It comes up at the fork's end of the warned branch (emergeM 20–35 m, BUILD_1B §18.3 G8).
    risesAtTheFork: risen.stage === BOSS.fight && risen.route === warned.route && risen.dist >= 19 && risen.dist <= 36,
    rootsWarned90: pairs("roots").length > 0 && pairs("roots").every((d) => d === 90),
    slamWarned72: pairs("slam").every((d) => d === 72),
    staggerBannerUnderTheBar: banner !== null && banner.text.includes("choáng") && banner.top >= banner.barTop && banner.bottom <= 0.3 * page.height,
    burstWithinCap: burstMax <= 3,
    // Review R1: Dồn lửa lights whether a help ring holds it or not, round(E / 20) words (E 35: 2); the countdown on the bar.
    burstLitWithWords: burstMax >= 1 && burstWords === 2,
    vulnerableCountdownOnBar: /Dễ Tổn Thương \d s/.test(countdown),
    chestOnTheCard: sheet !== null && sheet.text.includes("Rương") && sheet.text.includes("+150 vàng"),
    sprouts: strikes.some((e) => e.move === "summon" && e.hit),
    won: end.phase === "victory" && sheet !== null && sheet.stars >= 1,
    cardsClean: cardsClean(cards),
    nodeReplaysToBrowserHash: replay.match === true,
    ...consoleChecks(page),
  };
  return finish(page, checks, {
    done, banner, burstMax, burstWords, countdown, roots: pairs("roots"), slams: pairs("slam"), sheet: sheet && { stars: sheet.stars, review: sheet.review },
    end: { phase: end.phase, lives: end.lives, tick: end.tick }, frames, shots, cards: cardSummary(cards), replay,
  });
}
