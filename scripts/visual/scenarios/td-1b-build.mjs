// Lời Gọi 1B R1 (docs/td/BUILD_1B.md §19 td-1b-build, §7, §12): the title's "Bắt đầu" opens the story: no sandbox
// panel, a sandbox command refused (noSandbox), the build menu's locked rows say "Mở ở Ngày n", a Tháp Cung built on
// day 1 whose card's sale reads its real price and fits (R2 review). Then in the sandbox,
// by keyboard only: a Tháp Cung built (Insert, Enter) and undone in its 5 s (Tab to it, Delete; refunded in full),
// built again and raised (63 gold, 27 wood), the Bastion raised (105 gold, 45 wood; Chấm comes out), the tower sold
// by pressing Shift+Delete twice (60 % of 112 gold, 48 wood); the Bastion's card sells 10 wood for 4 gold (review R1),
// every label on it read in full (review fix: no button cut or past the card); then the preset's tower, cannon, barracks,
// mine and farm cards, the sale armed and not, the same (R2 review leftover). R2 review fix 3 (§6.A): the preset's
// buildings are free, so their sale reads "+0 vàng, +0 gỗ", the shortest label; a fresh sandbox then builds each kind
// at its real price and raises it to level 3 (the longest labels: a Tháp Pháo sells for +163 vàng, +70 gỗ), and those
// cards fit too, armed and not. Each page's log replays on Node to its hash. Pictures: the locked menu, the raised
// village, the Bastion's card, each building's card at level 1 and at level 3.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-build.mjs --width=1280 --height=720
import { DEV_URL } from "./common.mjs";
import { boot, consoleChecks, finish, key, out, overflowing, replayOnNode, sandbox, send, sizeOf, state, td, until } from "./td-1a6-common.mjs";

const focus = (page) => page.eval(td("return t.ui().focus;"));

/** Tab until building `id` has the focus (at most 20 presses). */
async function tabTo(page, id) {
  for (let k = 0; k < 20 && (await focus(page)) !== id; k += 1) await key(page, "Tab");
  return (await focus(page)) === id;
}

export default async function (page) {
  const size = sizeOf(page);
  const shots = [];
  // The story from the title.
  await page.goto(DEV_URL.replace(/\/$/, "") + "/?title=1", { settle: 600 });
  await until(page, "return t.ready();", 30000);
  await key(page, "Enter"); // "Bắt đầu"
  await page.sleep(800);
  const story = await page.eval(td("return { flags: t.flags(), panel: !!document.querySelector('.td-sandbox:not(:empty)') };"));
  await page.eval(td(`t.send({ t: "sandbox", op: { op: "gold", value: 9999 } }); return true;`));
  await page.sleep(300);
  const refused = (await page.eval(td("return t.events().filter((e) => e.t === 'rejected').map((e) => e.reason);"))) ?? [];
  await key(page, "Insert");
  await page.sleep(300);
  const menu = await page.eval(`[...document.querySelectorAll(".td-kind")].map((el) => el.textContent)`);
  shots.push(await page.shot(out("td-1b-build-locked-" + size + ".png")));
  await key(page, "Escape");
  // R2 review: a story card with a real sale label (a Tháp Cung built on day 1, past its 5 s undo; its raise locked till day 4).
  await key(page, "Insert");
  await key(page, "Enter");
  await until(page, "return t.state().buildings.some((b) => b.def === 'archer' && b.ready);", 60000);
  await page.sleep(5200);
  const storyArcher = (await state(page)).buildings.find((b) => b.def === "archer");
  const storyCard = storyArcher !== undefined && (await tabTo(page, storyArcher.id));
  await page.sleep(200);
  const storySale = await page.eval(`document.querySelector('.td-dock [data-act="sell"]')?.textContent ?? ""`);
  const storyCut = (await overflowing(page, ".td-dock button")) ?? ["?"];
  shots.push(await page.shot(out("td-1b-build-story-card-" + size + ".png")));
  // The sandbox, keyboard only (its money by the panel's logged commands).
  await boot(page, { mouse: false });
  await page.eval(td(`t.send({ t: "sandbox", op: { op: "gold", value: 2000 } }); t.send({ t: "sandbox", op: { op: "wood", value: 600 } }); return true;`));
  await page.sleep(300);
  // Wood less what the chops have paid so far: since the owner's wood rule (26/10/2026) a chop pays as it goes, so the
  // two villagers' wood would otherwise creep into the prices read 300 ms apart.
  const money = async () => { const s = await state(page); return [s.gold, s.wood - s.trees.reduce((sum, tree) => sum + 1000 - tree.left, 0)]; };
  const [g0, w0] = await money();
  await key(page, "Insert");
  await key(page, "Enter"); // the Tháp Cung at its first suggested spot
  await page.sleep(300);
  const site = (await state(page)).buildings.find((b) => b.def === "archer");
  const tabbed = site !== undefined && (await tabTo(page, site.id));
  await key(page, "Delete");
  await page.sleep(300);
  const [g1, w1] = await money();
  const undone = !(await state(page)).buildings.some((b) => b.def === "archer");
  await key(page, "Insert");
  await key(page, "Enter");
  await until(page, "return t.state().buildings.some((b) => b.def === 'archer' && b.ready);", 60000);
  const archer = (await state(page)).buildings.find((b) => b.def === "archer");
  await tabTo(page, archer.id);
  const [g2, w2] = await money();
  // The card's upgrade has no key of its own (Enter sends the agent): the command its button sends.
  await page.eval(td(`t.send({ t: "upgrade", building: ${archer.id} }); return true;`));
  await page.sleep(300);
  const [g3, w3] = await money();
  const keep = (await state(page)).buildings.find((b) => b.def === "keep");
  await page.eval(td(`t.send({ t: "upgrade", building: ${keep.id} }); return true;`));
  await page.sleep(300);
  const [g4, w4] = await money();
  await until(page, "return t.state().buildings.find((b) => b.def === 'keep').level === 2 && t.state().buildings.some((b) => b.def === 'archer' && b.level === 2);", 90000);
  const helpers = await page.eval(`document.querySelectorAll(".td-agent:not(.is-locked)").length`);
  shots.push(await page.shot(out("td-1b-build-raised-" + size + ".png")));
  await page.sleep(5200); // past the upgrade's 5 s: a sale, not an undo
  await tabTo(page, archer.id);
  const [g5, w5] = await money();
  await key(page, "Delete", { shift: true });
  await page.sleep(200);
  const armed = await page.eval(`document.querySelector('.td-dock [data-act="sell"]')?.textContent ?? ""`);
  const [g6, w6] = await money();
  await key(page, "Delete", { shift: true });
  await page.sleep(300);
  const [g7, w7] = await money();
  // Review R1: the Bastion's card sells wood, 10 for 4 gold.
  await tabTo(page, keep.id);
  await page.sleep(200);
  const woodButton = await page.eval(`document.querySelector('.td-dock [data-act="sellWood"]')?.textContent ?? ""`);
  const keepCut = (await overflowing(page, ".td-dock button")) ?? ["?"];
  shots.push(await page.shot(out("td-1b-build-keep-" + size + ".png")));
  const [g8, w8] = await money();
  await page.eval(td(`t.send({ t: "sellWood" }); return true;`));
  await page.sleep(300);
  const [g9, w9] = await money();
  // R2 review leftover: every building's card fits (the sale's label by "Gửi Draconis", the farm's seeds), armed or not.
  await page.eval(td(`t.send({ t: "sandbox", op: { op: "preset" } }); return true;`));
  await page.sleep(400);
  const cards = {};
  for (const def of ["archer", "cannon", "barracks", "gold-mine", "farm"]) {
    const b = (await state(page)).buildings.find((x) => x.def === def && x.ready);
    if (b === undefined || !(await tabTo(page, b.id))) {
      cards[def] = ["no card"];
      continue;
    }
    await page.sleep(150);
    cards[def] = (await overflowing(page, ".td-dock button")) ?? ["?"];
    shots.push(await page.shot(out("td-1b-build-card-" + def + "-" + size + ".png")));
    await key(page, "Delete", { shift: true }); // armed: "Bấm lần nữa: bán"
    await page.sleep(150);
    cards[def].push(...((await overflowing(page, ".td-dock button")) ?? ["?"]));
    await page.sleep(3200); // the press lapses: nothing sold
  }
  const replay = await replayOnNode(page, "td-1b-build");
  // R2 review fix 3 (§6.A): each kind bought and raised to level 3 at the preset's spots, 4 builders, game speed 2×.
  await boot(page, { mouse: false });
  await sandbox(page, "gold", 9000);
  await sandbox(page, "wood", 4000);
  await sandbox(page, "keepLevel", 4);
  await sandbox(page, "speed", 2);
  await page.sleep(300);
  const kinds = ["archer", "cannon", "barracks", "gold-mine", "farm"];
  const spots = { archer: [-8, 12], cannon: [7, 12], barracks: [3, 18], "gold-mine": [26, -30], farm: [-17, 40] };
  const defs = await page.eval(td("return t.defs();"));
  const placeable = [];
  for (const def of kinds) if ((await page.eval(td(`return t.canPlace(${JSON.stringify(def)}, ${spots[def][0]}, ${spots[def][1]}).ok;`))) === true) placeable.push(def);
  await send(page, ...kinds.map((def) => ({ t: "build", def: defs.indexOf(def), qx: spots[def][0] * 4, qz: spots[def][1] * 4 })));
  const raised = (level) => `const b = t.state().buildings.filter((x) => x.def !== "keep"); return b.length === 5 && b.every((x) => x.ready && x.upTo === 0 && x.level === ${level});`;
  const built = [await until(page, raised(1), 90000, 300)];
  for (const level of [2, 3]) {
    const ids = (await state(page)).buildings.filter((b) => b.def !== "keep").map((b) => b.id);
    await send(page, ...ids.map((building) => ({ t: "upgrade", building })));
    built.push(await until(page, raised(level), 90000, 300));
  }
  await page.sleep(5200); // past the last upgrade's 5 s: a sale, not an undo
  const top = {};
  const topSales = {};
  for (const def of kinds) {
    const b = (await state(page)).buildings.find((x) => x.def === def && x.level === 3);
    if (b === undefined || !(await tabTo(page, b.id))) {
      top[def] = ["no card"];
      continue;
    }
    await page.sleep(150);
    topSales[def] = await page.eval(`document.querySelector('.td-dock [data-act="sell"]')?.textContent ?? ""`);
    top[def] = (await overflowing(page, ".td-dock button")) ?? ["?"];
    shots.push(await page.shot(out("td-1b-build-card-" + def + "-l3-" + size + ".png")));
    await key(page, "Delete", { shift: true }); // armed
    await page.sleep(150);
    top[def].push(...((await overflowing(page, ".td-dock button")) ?? ["?"]));
    await page.sleep(3200); // the press lapses: nothing sold
  }
  const replayTop = await replayOnNode(page, "td-1b-build-l3");
  const checks = {
    storyFromTitle: story?.flags?.sandbox === false && story.panel === false,
    sandboxRefused: refused.includes("noSandbox"),
    lockedRowsSayTheDay: menu.some((text) => text.includes("Mở ở Ngày 2")) && menu.some((text) => text.includes("Mở ở Ngày 3")),
    builtThenUndone: tabbed && undone && g1 === g0 && w1 === w0,
    upgradePrice: g2 - g3 === 63 && w2 - w3 === 27,
    keepPrice: g3 - g4 === 105 && w3 - w4 === 45 && helpers >= 2,
    sellAsksTwice: armed.includes("Bấm lần nữa") && g6 === g5 && w6 === w5,
    soldAt60: g7 - g5 === Math.floor(112 * 0.6) && w7 - w5 === Math.floor(48 * 0.6),
    woodSells: woodButton.includes("Bán 10 Gỗ") && g9 - g8 === 4 && w8 - w9 === 10,
    keepCardFits: keepCut.length === 0,
    storyCardFits: storyCard && /Bán · \+\d+ vàng, \+\d+ gỗ/.test(storySale) && !storySale.includes("+0 vàng") && storyCut.length === 0,
    buildingCardsFit: Object.keys(cards).length === 5 && Object.values(cards).every((list) => list.length === 0),
    levelThreeBuilt: placeable.length === 5 && built.every((done) => done === true) && Object.keys(topSales).length === 5,
    levelThreeSalesReal: Object.values(topSales).every((label) => /Bán · \+\d{2,3} vàng, \+\d{2,3} gỗ/.test(label)),
    levelThreeCardsFit: Object.keys(top).length === 5 && Object.values(top).every((list) => list.length === 0),
    nodeReplaysToBrowserHash: replay.match === true && replayTop.match === true,
    ...consoleChecks(page),
  };
  return finish(page, checks, { story, refused, menu, storySale, storyCut, money: [g0, w0, g1, w1, g2, w2, g3, w3, g4, w4, g5, w5, g6, w6, g7, w7, g8, w8, g9, w9], helpers, armed, woodButton, keepCut, cards, top, topSales, replay, replayTop, shots });
}
