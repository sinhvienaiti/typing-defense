// Lời Gọi 1B R2 (docs/td/BUILD_1B.md §19 td-1b-ult, §8, §13.3): Tối Thượng in the sandbox. Draconis by the fork, a
// crowd on the roads (__td.flood), the charge filled by the sandbox's `ult`, then the real `=` key with the mouse off
// the field (the app's spot: the most enemy hit points near him): Draconis' portrait slides in, feathers fall with a
// shadow under each, its Chữ Chiêu call typed for real at 60 WPM: +3 feathers a word (+1 for a whole Perfect call).
// Filled again and cast, its Chữ Chiêu left alone: 12 feathers, no chain lost. Checks: the cast, the feathers counted,
// every 20 s window ≤ 8 s typed (the director's count), the cards, the page's log replayed on Node to its hash.
// Slow frame sets: the cast (portrait, first feathers) and the rain left alone.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-ult.mjs --width=1280 --height=720
import { KIND, Seen, boot, cardStats, cardSummary, cardsClean, consoleChecks, finish, key, look, out, replayOnNode, sandbox, send, sizeOf, state, td, typeFor, until } from "./td-1a6-common.mjs";

const ULT = { feathers: 12, perWord: 3, perfect: 1 };

export default async function (page) {
  const size = sizeOf(page);
  const seen = new Seen();
  const cards = cardStats();
  const frames = {};
  const film = async (name, count, interval) => (frames[name] = await page.frames(out("td-1b-ult-" + name + "-" + size), count, interval));
  const stats = () => page.eval(td("return t.stats();"));
  const ult = async () => (await state(page)).ult;
  let window = 0;
  const watch = async () => (window = Math.max(window, (await page.eval(td("return t.typing().typedTicks;"))) ?? 0));
  const ready = await boot(page);
  await send(page, { t: "move", agent: 0, qx: 0, qz: -24 * 4 });
  const stood = await until(page, "const a = t.state().agents[0]; return a.mode === 0 && Math.abs(a.z + 24) < 0.5;", 20000);
  await page.eval(td("t.flood(40); return true;"));
  await sandbox(page, "ult");
  await page.sleep(300);
  const full = await ult();
  const button = await page.eval(`(() => { const b = document.querySelector('.td-actions [data-act="ult"]'); return b ? { text: b.textContent, disabled: b.disabled } : null; })()`);
  const ring = await page.eval(`document.querySelector(".td-agent .td-ult")?.className ?? ""`);
  const s0 = await stats();
  const chain0 = (await page.eval(td("return t.typing();"))).chain;
  await key(page, "Equal");
  await film("cast", 6, 110);
  const cast = (await seen.poll(page)).find((e) => e.t === "ult");
  const shadows = await page.eval(td("return t.state().projectiles;"));
  // Chữ Chiêu, typed for real while it lives (4 s).
  const words = await typeFor(page, 4300, { wpm: 60, kinds: [KIND.ult], seen, stop: async () => !(await page.eval(td("return t.state().calls.some((c) => c.kind === 6);"))) });
  await look(page, cards);
  await watch();
  await until(page, "return t.state().ult.on === 0;", 15000);
  await seen.poll(page);
  const s1 = await stats();
  const hits = seen.hits(KIND.ult);
  const perfect = seen.of("callEnd").some((e) => e.kind === KIND.ult && e.perfect);
  const typedFeathers = s1.ultFeathers - s0.ultFeathers;
  // Again, Chữ Chiêu left alone.
  await sandbox(page, "ult");
  await page.sleep(200);
  const chain1 = (await page.eval(td("return t.typing();"))).chain;
  await key(page, "Equal");
  await page.sleep(200);
  await film("rain", 6, 160);
  await look(page, cards);
  await until(page, "return t.state().ult.on === 0;", 15000);
  await watch();
  await seen.poll(page);
  const s2 = await stats();
  const chain2 = (await page.eval(td("return t.typing();"))).chain;
  const shot = await page.shot(out("td-1b-ult-after-" + size + ".png"));
  const replay = await replayOnNode(page, "td-1b-ult");
  const checks = {
    ready,
    heroByTheFork: stood !== null && stood !== false,
    filledByTheSandbox: full.charge === 100 && button !== null && !button.disabled && ring.includes("is-full"),
    castByTheKey: cast !== undefined && s1.ultCasts - s0.ultCasts === 1,
    feathersFall: shadows > 0,
    chuChieuTyped: hits.length >= 1 && typedFeathers === ULT.feathers + ULT.perWord * hits.length + (perfect ? ULT.perfect : 0),
    leftAloneTwelve: s2.ultCasts - s1.ultCasts === 1 && s2.ultFeathers - s1.ultFeathers === ULT.feathers && chain2 >= chain1,
    chainNeverLost: chain1 >= chain0,
    windowWithin8s: window <= 8 * 60,
    cardsClean: cardsClean(cards),
    nodeReplaysToBrowserHash: replay.match === true,
    ...consoleChecks(page),
  };
  return finish(page, checks, {
    button, ring, cast, typed: { keys: words.keys, words: hits.length, perfect, feathers: typedFeathers }, alone: s2.ultFeathers - s1.ultFeathers, window,
    damage: { ult: s2.damageUlt, kills: s2.kills }, frames, shots: [shot], cards: cardSummary(cards), replay,
  });
}
