// Lời Gọi 1B R1 (docs/td/BUILD_1B.md §19 td-1b-build, §7, §12): the title's "Bắt đầu" opens the story: no sandbox
// panel, a sandbox command refused (noSandbox), the build menu's locked rows say "Mở ở Ngày n". Then in the sandbox,
// by keyboard only: a Tháp Cung built (Insert, Enter) and undone in its 5 s (Tab to it, Delete; refunded in full),
// built again and raised (63 gold, 27 wood), the Bastion raised (105 gold, 45 wood; Chấm comes out), the tower sold
// by pressing Shift+Delete twice (60 % of 112 gold, 48 wood). Pictures: the locked menu, the raised village.
//   OUT_DIR=… node src/kit/tools/cdp-run.mjs scripts/visual/scenarios/td-1b-build.mjs --width=1280 --height=720
import { DEV_URL } from "./common.mjs";
import { boot, consoleChecks, finish, key, out, sizeOf, state, td, until } from "./td-1a6-common.mjs";

const focus = (page) => page.eval(td("return t.ui().focus;"));

/** Tab until building `id` has the focus (at most 12 presses). */
async function tabTo(page, id) {
  for (let k = 0; k < 12 && (await focus(page)) !== id; k += 1) await key(page, "Tab");
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
  // The sandbox, keyboard only (its money by the panel's logged commands).
  await boot(page, { mouse: false });
  await page.eval(td(`t.send({ t: "sandbox", op: { op: "gold", value: 2000 } }); t.send({ t: "sandbox", op: { op: "wood", value: 600 } }); return true;`));
  await page.sleep(300);
  const money = async () => { const s = await state(page); return [s.gold, s.wood]; };
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
  const checks = {
    storyFromTitle: story?.flags?.sandbox === false && story.panel === false,
    sandboxRefused: refused.includes("noSandbox"),
    lockedRowsSayTheDay: menu.some((text) => text.includes("Mở ở Ngày 2")) && menu.some((text) => text.includes("Mở ở Ngày 3")),
    builtThenUndone: tabbed && undone && g1 === g0 && w1 === w0,
    upgradePrice: g2 - g3 === 63 && w2 - w3 === 27,
    keepPrice: g3 - g4 === 105 && w3 - w4 === 45 && helpers >= 2,
    sellAsksTwice: armed.includes("Bấm lần nữa") && g6 === g5 && w6 === w5,
    soldAt60: g7 - g5 === Math.floor(112 * 0.6) && w7 - w5 === Math.floor(48 * 0.6),
    ...consoleChecks(page),
  };
  return finish(page, checks, { story, refused, menu, money: [g0, w0, g1, w1, g2, w2, g3, w3, g4, w4, g5, w5, g6, w6, g7, w7], helpers, armed, shots });
}
