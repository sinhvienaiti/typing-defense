// Lời Gọi 1B R2 (docs/td/BUILD_1B.md §19 td-1b-direct, §9, §13.3): Ngắt in the sandbox. The preset (towers and soldiers at
// the merge), Draconis north of the west archer; a Lửng Tanuki sent out (the sandbox's `spawn`), then packs of Cương Thi that catch
// it up where the soldiers hold them: under the towers (a Tanuki drums only within 9 m of an attack building's rim,
// BUILD_NOTES §7.3) it drums among them, its scroll card over it with the window's clock ring; typed for real: the drum
// breaks (stunned under its stars, +5 + 2 gold). A second Tanuki, the card left alone: at the window's end the heal ring
// spreads 6 m. Three Tanuki at once: three drums, at most 2 cards. Checks: the events, the gold the word brought, the
// cards (none over another or the HUD, ≥ 18 px), the page's log replayed on Node to its hash. Slow frame sets: the
// break, the heal.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-direct.mjs --width=1280 --height=720
import { KIND, Seen, boot, cardStats, cardSummary, cardsClean, consoleChecks, finish, look, out, replayOnNode, sandbox, send, sizeOf, td, typeFor, until } from "./td-1a6-common.mjs";

const spawn = (page, enemy, value) => send(page, { t: "sandbox", op: { op: "spawn", enemy, value } });

export default async function (page) {
  const size = sizeOf(page);
  const seen = new Seen();
  const cards = cardStats();
  const frames = {};
  const shots = [];
  const film = async (name, count, interval) => (frames[name] = await page.frames(out("td-1b-direct-" + name + "-" + size), count, interval));
  const stats = () => page.eval(td("return t.stats();"));
  const directCalls = td("return t.state().calls.filter((c) => c.kind === 7);");
  /** `tanuki` Tanuki, then three packs of five Cương Thi 4–5 s apart: they catch it up at the merge, where the soldiers hold them. */
  const wave = async (tanuki) => {
    for (let k = 0; k < tanuki; k += 1) await spawn(page, "tanuki", 1);
    for (const wait of [4000, 5000, 5000]) {
      await page.sleep(wait);
      await spawn(page, "cuong-thi", 5);
      await seen.poll(page);
    }
  };
  /** Waits (≤ ms) for `body`, polling the events meanwhile so none is missed. */
  const watch = async (body, ms) => {
    const started = Date.now();
    while (Date.now() - started < ms) {
      await seen.poll(page);
      const value = await page.eval(td(body));
      if (value) return value;
      await page.sleep(100);
    }
    return null;
  };
  const ready = await boot(page);
  await sandbox(page, "preset");
  await send(page, { t: "move", agent: 0, qx: -6 * 4, qz: 6 * 4 }); // north of the west archer, where the packs come
  await until(page, "const a = t.state().agents[0]; return a.mode === 0 && Math.abs(a.z - 6) < 0.6;", 20000);
  // Typed: the drum breaks.
  await wave(1);
  const lit = await watch("return t.state().calls.find((c) => c.kind === 7 && c.bright) ?? null;", 60000);
  await page.sleep(150);
  const card = await page.eval(`(() => { const el = [...document.querySelectorAll(".td-card.is-direct")].find((c) => Number(c.style.opacity) > 0.05); return el ? { text: el.textContent, clock: el.style.getPropertyValue("--t"), font: parseFloat(getComputedStyle(el).fontSize) } : null; })()`);
  shots.push(await page.shot(out("td-1b-direct-card-" + size + ".png")));
  await look(page, cards);
  const s0 = await stats();
  await typeFor(page, 4000, { wpm: 50, kinds: [KIND.direct], seen, stop: async () => ((await page.eval(directCalls)) ?? []).length === 0 });
  await film("break", 5, 120);
  await seen.poll(page);
  const s1 = await stats();
  const broken = seen.of("direct").find((e) => e.ok);
  const stunned = broken === undefined ? null : await page.eval(td(`const f = t.state().foes.find((e) => e.id === ${broken.enemy}); return f ? f.stunUntil - t.state().tick : null;`));
  // Left alone: the heal ring.
  await watch("return t.state().foes.length === 0 && t.state().enemies === 0;", 30000);
  await wave(1);
  await watch("return t.state().calls.find((c) => c.kind === 7) ?? null;", 60000);
  await look(page, cards);
  await watch("const s = t.state(); return s.foes.some((f) => f.castEnd > 0 && f.castEnd - s.tick <= 12);", 10000);
  await film("heal", 6, 120);
  await seen.poll(page);
  const healed = seen.of("direct").find((e) => !e.ok);
  // Three at once: three drums, two cards.
  await watch("return t.state().foes.length === 0 && t.state().enemies === 0;", 30000);
  const drums0 = seen.of("drum").length;
  await wave(3);
  let most = 0;
  let mostCards = 0;
  let threeAt = 0;
  const started = Date.now();
  while (Date.now() - started < 60000 && (threeAt === 0 || Date.now() - threeAt < 1500)) {
    await page.sleep(150);
    await seen.poll(page);
    most = Math.max(most, ((await page.eval(directCalls)) ?? []).length);
    mostCards = Math.max(mostCards, await page.eval(`[...document.querySelectorAll(".td-card.is-direct")].filter((c) => Number(c.style.opacity) > 0.05 && !c.classList.contains("is-gone")).length`));
    await look(page, cards);
    if (threeAt === 0 && seen.of("drum").length - drums0 >= 3) threeAt = Date.now();
  }
  shots.push(await page.shot(out("td-1b-direct-three-" + size + ".png")));
  const replay = await replayOnNode(page, "td-1b-direct");
  const checks = {
    ready,
    drumLitInTheRing: lit !== null && seen.of("drum").length >= 1,
    scrollCardWithClock: card !== null && /\d+%/.test(card.clock) && card.font >= 18,
    typedBreaksIt: broken !== undefined && s1.directOk - s0.directOk === 1 && s1.goldWord - s0.goldWord >= 7,
    stunnedTwoSeconds: stunned !== null && stunned > 0 && stunned <= 120,
    leftAloneHeals: healed !== undefined && (await stats()).directMissed >= 1,
    threeDrumsTwoCards: seen.of("drum").length - drums0 >= 3 && most <= 2 && mostCards <= 2,
    cardsClean: cardsClean(cards),
    nodeReplaysToBrowserHash: replay.match === true,
    ...consoleChecks(page),
  };
  return finish(page, checks, { card, stunned, drums: seen.of("drum").map((e) => e.tick), most, mostCards, frames, shots, cards: cardSummary(cards), replay });
}
