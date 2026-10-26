// Lời Gọi 1B R3 (docs/td/BUILD_1B.md §11, docs/td/R3_PLAN.md §6 td-1b-learn): Học at the page, in the sandbox (Cân bằng).
// Before the run Học's store (typing-defense.learn) is set: every other word of levels 1–3 seen twice, one word saved in
// the book; the learning queue emptied. Then the preset with the Bastion back at level 1 (no helper out: no quiz takes a
// book word first), Draconis by the trees the villagers chop, a site by him:
// 1. meanings: a word seen twice before shows no meaning on its card, any other shows it, from the moment it lights;
// 2. Từ Ôn: the saved word, in the run's book from tick 0, comes back 25–45 s in as a word of a Chặt call: its card is jade
//    with "Ôn" and its meaning; typed clean: "Chuộc lại" stamped, knowledge +1, a review event, out of the book;
// 3. two words typed sloppy go into the book; one comes back 25–45 s later as a Từ Ôn (one live at a time);
// 4. the other still in the book, the phase moved on (the night called, or the next day): the store keeps the book (Học
//    keeps it at each phase); the page reloaded shows "Sổ ôn 1" at once
//    and the run header carries the word; Học's learning events (gameId typing-defense) wait in the bridge's queue;
// the first page's log replays on Node to its hash (the header with its study lists). Pictures td-1b-learn-meaning,
// -review, -redeem, -book. Exits 1 on a failed check.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-learn.mjs --width=1280 --height=720
import { KIND, Seen, boot, cardStats, cardSummary, cardsClean, consoleChecks, finish, letter, look, out, replayOnNode, sandbox, send, sizeOf, state, td, typeFor, until } from "./td-1a6-common.mjs";

const q = (m) => Math.round(m * 4);
const STORE = "typing-defense.learn";
const QUEUE = "typing-defense:learning-queue:v1";

export default async function (page) {
  const size = sizeOf(page);
  const shots = [];
  const seen = new Seen();
  const cards = cardStats();
  const shot = async (name) => shots.push(await page.shot(out("td-1b-learn-" + name + "-" + size + ".png")));

  // The store: every other word of levels 1–3 seen twice; one plain level-1 word of 4–5 letters saved in the book.
  await boot(page);
  const setup = await page.eval(`(async () => {
    const { loadDeck } = await import("/src/app/vocab.ts");
    const { deck } = await loadDeck();
    const text = (w) => String.fromCharCode(...deck.letters.subarray(deck.start[w], deck.start[w] + deck.len[w]).map((c) => c + 97));
    const ids = {}, seen = {};
    let saved = null;
    for (let w = 0; w < deck.count; w += 1) {
      if (deck.level[w] > 3) continue;
      ids[text(w)] = deck.ids[w];
      if (w % 2 === 0) seen[deck.ids[w]] = 2;
      if (saved === null && deck.level[w] === 1 && deck.len[w] >= 4 && deck.len[w] <= 5 && !"qxzj".includes(text(w)[0])) saved = { id: deck.ids[w], text: text(w) };
    }
    delete seen[saved.id];
    return { ids, before: seen, saved };
  })()`);
  // Written as the next page starts: the page left now keeps its own store on pagehide (Học saves there).
  const store = JSON.stringify({ v: 1, book: [setup.saved.id], seen: setup.before });
  const { identifier } = await page.send("Page.addScriptToEvaluateOnNewDocument", { source: `localStorage.setItem(${JSON.stringify(STORE)}, ${JSON.stringify(store)}); localStorage.removeItem(${JSON.stringify(QUEUE)});` });
  const ready = await boot(page);
  await page.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
  const start = await page.eval(td("return { learn: t.flags().learn, review: t.state().review, tick: t.state().tick };"));
  // One tick: the preset's Bastion at level 3 lets a helper out, whose Hỏi bài would take the saved word first.
  const op = (name, value) => ({ t: "sandbox", op: value === undefined ? { op: name } : { op: name, value } });
  await send(page, op("preset"), op("keepLevel", 1), op("gold", 800), op("wood", 300));
  await page.sleep(200);
  const site = await page.eval(td(`
    const spots = [];
    for (let x = 4; x <= 14; x += 0.5) for (let z = 26; z <= 34; z += 0.5) if (t.canPlace("archer", x, z).ok) spots.push([x, z]);
    spots.sort((a, b) => (a[0] - 10) ** 2 + (a[1] - 31) ** 2 - (b[0] - 10) ** 2 - (b[1] - 31) ** 2);
    return spots[0] ?? null;`));
  if (site !== null) await send(page, { t: "build", def: (await page.eval(td("return t.defs();"))).indexOf("archer"), qx: q(site[0]), qz: q(site[1]) });
  await send(page, { t: "move", agent: 0, qx: q(13), qz: q(35) });

  // 1–3: type at 35 WPM, look at every card as it lights; the saved word, then one typed sloppy, come back as Từ Ôn.
  const firstSight = new Map(); // text → { shown, expected }
  const back = []; // Từ Ôn met: { text, kind, cls, mean, tick }
  const redeemed = [];
  const sloppyWords = [];
  const dimmed = []; // Từ Ôn seen, but its call dimmed before the keys came (no review event): not an attempt
  let sloppy = null;
  let meaningShot = false;
  const ends = Date.now() + 240000;
  let sloppyAt = -1;
  while (Date.now() < ends && redeemed.length < 2) {
    await typeFor(page, 400, { wpm: 35, sloppy, seen, stop: (words) => words.some((w) => w.review) });
    const v = await look(page, cards);
    if (v === null) continue;
    for (const card of v.cards.filter((c) => !/is-mean|is-quiz|is-review/.test(c.cls))) {
      const word = v.words.filter((w) => card.text.startsWith(w.text)).sort((a, b) => b.text.length - a.text.length)[0];
      if (word === undefined || firstSight.has(word.text)) continue;
      firstSight.set(word.text, { text: word.text, shown: card.mean.trim() !== "", expected: !((setup.before[setup.ids[word.text]] ?? 0) >= 2) });
      if (!meaningShot && firstSight.size >= 4 && [...firstSight.values()].some((f) => !f.shown) && [...firstSight.values()].some((f) => f.shown)) {
        meaningShot = true;
        await shot("meaning");
      }
    }
    // The saved word redeemed: type two words sloppy so they go into the book; one comes back, the other stays for step 4.
    if (redeemed.length === 1 && sloppy === null) sloppy = { left: 2, wrongs: 0 };
    if (sloppy !== null && 2 - sloppy.left > sloppyWords.length) {
      const s = await state(page);
      sloppyWords.push(s.review.at(-1) ?? null);
      sloppyAt = s.tick;
    }
    const review = v.words.find((w) => w.review);
    if (review === undefined) {
      // A Từ Ôn needs a lit call of 4 words: while a book word is due, Draconis goes to the nearest Chặt call (the trees by him fall).
      const s = await state(page);
      const due = s.reviewAt.some((at, k) => at <= s.tick && s.reviewBack[k] < 2);
      const hero = s.agents[0];
      const chop = s.calls.filter((c) => c.kind === KIND.chop).sort((a, b) => (a.x - hero.x) ** 2 + (a.z - hero.z) ** 2 - (b.x - hero.x) ** 2 - (b.z - hero.z) ** 2)[0];
      if (due && chop !== undefined && !chop.bright && hero.mode === 0) await send(page, { t: "move", agent: 0, qx: q(chop.x + 2), qz: q(chop.z + 2) });
      continue;
    }
    const card = v.cards.find((c) => c.cls.includes("is-review") && c.text.startsWith(review.text));
    const s = await state(page);
    const call = s.calls.find((c) => c.id === review.call);
    back.push({ text: review.text, kind: call?.kind ?? -1, words: call?.words ?? 0, cls: card?.cls ?? "", mean: card?.mean ?? "", tick: s.tick, due: s.reviewAt[s.review.indexOf(review.text)] ?? -1, knowledge: s.knowledge });
    if (back.length === 1) await shot("review");
    if ((await page.eval(td("return t.typing().lock;"))) >= 0) await send(page, { t: "unlock" });
    const reviews = (await seen.poll(page)).filter((e) => e.t === "review").length;
    for (const ch of review.text) {
      await letter(page, ch);
      await page.sleep(160);
    }
    await page.sleep(120);
    // R3 final check: on a loaded machine the call can dim between the look and the keys (Draconis' ring moved, or the cap
    // turned: 8 ticks after it lit in the 26/10 runs); the keys then find no card and the sim says nothing. Look again.
    if ((await seen.poll(page)).filter((e) => e.t === "review").length === reviews) {
      dimmed.push({ ...back.pop(), dimmedBy: (await state(page)).tick });
      continue;
    }
    const stamp = await page.eval(`[...document.querySelectorAll(".td-stamp.is-redeem")].filter((el) => Number(el.style.opacity) > 0.2).map((el) => el.textContent)`);
    if (redeemed.length === 0) await shot("redeem");
    const after = await state(page);
    await seen.poll(page);
    redeemed.push({ text: review.text, stamp, knowledge: after.knowledge - back.at(-1).knowledge, inBook: after.review.includes(review.text), event: seen.of("review").some((e) => e.redeemed) });
  }
  const sentBefore = await page.eval(td("return t.learning();"));
  const loopEnd = await page.eval(td("const s = t.state(); return { tick: s.tick, phase: s.phase, day: s.day, review: s.review, reviewAt: s.reviewAt, reviewBack: s.reviewBack, live: s.learn.live };"));

  // 4: the other sloppy word still in the book; the phase moved on, so Học keeps its store; the page reloaded starts with it.
  const kept = (await state(page)).review;
  if ((await state(page)).phase === "day") await send(page, { t: "callNight" });
  else await sandbox(page, "skipTo", (loopEnd?.day ?? 1) + 1);
  await page.sleep(500);
  const replay = await replayOnNode(page, "td-1b-learn");
  const stored = await page.eval(`JSON.parse(localStorage.getItem(${JSON.stringify(STORE)}) ?? "null")`);
  const queued = await page.eval(`JSON.parse(localStorage.getItem(${JSON.stringify(QUEUE)}) ?? "[]")`);
  await boot(page);
  await page.sleep(400);
  const reload = await page.eval(td(`return { learn: t.flags().learn, review: t.state().review, tick: t.state().tick, hud: document.querySelector(".td-learn")?.textContent ?? "" };`));
  await shot("book");

  const firsts = [...firstSight.values()];
  const checks = {
    ready,
    headerCarriesTheBook: start?.learn?.book?.includes(setup.saved.id) === true && start.review.includes(setup.saved.text),
    meaningsByTheRule: firsts.length >= 6 && firsts.filter((f) => f.shown !== f.expected).length === 0 && firsts.some((f) => !f.shown) && firsts.some((f) => f.shown),
    savedWordCameBack: back.length >= 1 && back[0].text === setup.saved.text && back[0].words >= 4 && [KIND.build, KIND.harvest, KIND.chop, KIND.mine].includes(back[0].kind),
    reviewCard: back.length >= 1 && back.every((b) => b.cls.includes("is-review") && b.mean.trim() !== ""),
    redeemed: redeemed.length >= 1 && redeemed.every((r) => r.stamp.includes("Chuộc lại") && r.knowledge >= 1 && !r.inBook && r.event),
    sloppyWordCameBack: sloppyWords.length === 2 && back.length >= 2 && sloppyWords.includes(back[1].text) && redeemed.length >= 2,
    bookKept: kept.length >= 1 && kept.some((text) => sloppyWords.includes(text)) && Array.isArray(stored?.book) && kept.every((text) => stored.book.includes(setup.ids[text])),
    bookAfterReload: reload !== null && reload.tick < 120 && kept.every((text) => reload.review.includes(text)) && /Sổ ôn\s*[1-9]/.test(reload.hud) && kept.every((text) => reload.learn.book.includes(setup.ids[text])),
    learningEvents: (sentBefore?.sent?.length ?? 0) >= 3 && sentBefore.sent.every((e) => e.gameId === "typing-defense") && queued.length >= 3 && queued.every((e) => e.gameId === "typing-defense"),
    cardsClean: cardsClean(cards),
    replays: replay.match === true,
    ...consoleChecks(page),
  };
  return finish(page, checks, {
    saved: setup.saved, start: { learn: start?.learn && { book: start.learn.book, due: start.learn.due.length, fresh: start.learn.fresh.length }, review: start?.review },
    firstSights: firsts.length, shown: firsts.filter((f) => f.shown).length, mismatches: firsts.filter((f) => f.shown !== f.expected).slice(0, 6),
    back, dimmed, redeemed, sloppyWords, sloppyAt, loopEnd, kept, stored: stored && { book: stored.book, seen: Object.keys(stored.seen ?? {}).length }, queued: queued.length, sent: sentBefore?.sent?.length,
    reload, replay, cards: cardSummary(cards), shots,
  });
}
