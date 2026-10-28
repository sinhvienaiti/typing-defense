import { describe, expect, it } from "vitest";
import { Selection } from "../src/app/selection";
import { ULT } from "../src/content/rules";
import type { CommandBody } from "../src/sim/commands";
import type { RareEvent } from "../src/sim/events";
import { STAT } from "../src/sim/stats";
import { BOSS } from "../src/sim/stores/boss";
import { actionsHtml, BossBanner } from "../src/ui/hud";
import { lossHint } from "../src/ui/sheets";
import { besidePanels, lanesTouch, spreadLanes } from "../src/view/words/lanes";
import { built, enemyAt, run, send, world } from "./td/fixtures";

/**
 * The test pass of 27/10/2026 (docs/changelog/2026-10-27-test-pass.md): what its fixes promise that a rule or the page's
 * logic keeps. Neo and Phá Khiên in a help ring: td-r3-abilities.test.ts.
 */
describe("the loss card's hint reads the run", () => {
  it("before the boss: no tower, no word typed, then Bắn mạnh with the Pháo's fire only once Tháp Pháo opens; at the peak, enemies that got in when they took more lives than the boss's blows", () => {
    const w = world({ sandbox: false });
    expect(lossHint(w)).toContain("Xây Archer Tower");
    built(w, "archer", -8, 12);
    expect(lossHint(w)).toContain("Gõ chữ trên thẻ tháp");
    w.stats[STAT.callWords] = 12;
    expect(lossHint(w)).toMatch(/Bắn mạnh.*xây thêm tháp/); // day 1: Tháp Pháo is still shut
    w.day = 3;
    expect(lossHint(w)).toContain("Word Shot của Cannon Tower");
    w.boss.stage = BOSS.fight;
    w.stats[STAT.livesBoss] = 12;
    expect(lossHint(w, 3)).toContain("Quái lọt vào Fort"); // 9 lives to leaks against 3 to its blows
    expect(lossHint(w, 9)).not.toContain("Quái lọt vào Fort");
  });
});

describe("Tối Thượng at the page", () => {
  it("full with no enemy within 14 m and no spot picked, = is refused with a reason and nothing is sent; with one near it is cast", () => {
    const w = world();
    const sent: CommandBody[] = [];
    const sel = new Selection(w, (command) => sent.push(command));
    w.ult.charge = ULT.max;
    sel.act("ult");
    expect(sent).toEqual([]);
    expect(w.events.rare.at(-1)).toMatchObject({ t: "rejected", command: "ult", reason: "ultNone" });
    const e = enemyAt(w, "cuong-thi", 0, w.lanes[0]!.length - 6);
    sel.act("ult");
    expect(sent).toEqual([{ t: "ult", qx: Math.round(w.enemies.x[e]! * 4), qz: Math.round(w.enemies.z[e]! * 4) }]);
  });
});

describe("Tối Thượng opens on the night of its day (BUILD_1B §12)", () => {
  it("in the story day 3 refuses it (the button says Đêm 3), night 3 takes it; the sandbox has it from day 1", () => {
    const w = world({ sandbox: false });
    [w.day, w.ult.charge] = [3, ULT.max];
    const at = { qx: Math.round(w.agents.x[0]! * 4), qz: Math.round(w.agents.z[0]! * 4) };
    expect(send(w, { t: "ult", ...at }).find((e) => e.t === "rejected")).toMatchObject({ reason: "locked" });
    expect(actionsHtml(w, false)).toContain("Tối Thượng · Mở ở Đêm 3");
    w.phase = "night";
    expect(send(w, { t: "ult", ...at }).some((e) => e.t === "ult")).toBe(true);
    const sandbox = world();
    sandbox.ult.charge = ULT.max;
    expect(send(sandbox, { t: "ult", qx: Math.round(sandbox.agents.x[0]! * 4), qz: Math.round(sandbox.agents.z[0]! * 4) }).some((e) => e.t === "ult")).toBe(true);
  });
});

describe("the sandbox panel", () => {
  it("Tanuki's pack of 8 Cương Thi leaves 6 s after it, so by the preset's towers it drums (alone it never had 4 others by it)", () => {
    const w = world({ gold: 5000 });
    const sent: CommandBody[] = [];
    const sel = new Selection(w, (command) => sent.push(command));
    send(w, { t: "sandbox", op: { op: "preset" } });
    sel.act("sb:spawn:tanuki");
    const at = w.tick;
    let drum = false;
    const spawned: string[] = [];
    for (let k = 0; k < 90 * 60 && !drum; k += 1) {
      sel.update();
      sent.forEach((c) => c.t === "sandbox" && c.op.op === "spawn" && spawned.push(c.op.enemy + " " + c.op.value + " +" + (w.tick - at)));
      drum = send(w, ...sent.splice(0)).some((e) => e.t === "drum");
    }
    expect([spawned, drum]).toEqual([["tanuki 1 +0", "cuong-thi 8 +360"], true]);
  });

  it("the day jumps and the boss have buttons; a jump once the boss is up says why it is refused", () => {
    const w = world({ gold: 5000 });
    const sent: CommandBody[] = [];
    const sel = new Selection(w, (command) => sent.push(command));
    sel.act("sb:boss");
    sel.act("sb:skipTo:3");
    expect(sent).toEqual([{ t: "sandbox", op: { op: "boss" } }, { t: "sandbox", op: { op: "skipTo", value: 3 } }]);
    send(w, sent[0]!);
    while (w.boss.stage < BOSS.lull) run(w, 30);
    expect(send(w, sent[1]!).find((e) => e.t === "rejected")).toMatchObject({ reason: "bossBusy" });
  });
});

describe("the word cards keep off the action", () => {
  it("a lane meeting a box of the action at its height stands beside it, on the side its roof is on; one above or below it does not move", () => {
    const boss = { left: 600, top: 300, right: 700, bottom: 400 };
    const lanes = [{ x: 630, top: 320, bottom: 360, half: 60 }, { x: 680, top: 320, bottom: 360, half: 60 }, { x: 650, top: 100, bottom: 140, half: 60 }];
    const kept = lanes.map((lane) => besidePanels(lane, [], 640, [boss]));
    expect(kept.map((lane) => [lane.lo, lane.hi])).toEqual([[-Infinity, 594], [706, Infinity], [-Infinity, Infinity]]);
    const out = spreadLanes(kept, 8, 1272, []);
    expect([lanes[0]!.x + out[0]! + 60 <= 594, lanes[1]!.x + out[1]! - 60 >= 706, out[2]]).toEqual([true, true, 0]);
  });
});

describe("crowded columns (td-1b-learn at 1920 × 1080)", () => {
  it("four columns at neighbouring trees, one a 1920 meaning strip, need more than the 240 px push: the cards' last resort pushes further, so none overlaps", () => {
    const lanes = [{ x: 900, top: 800, bottom: 850, half: 172 }, ...[905, 910, 915].map((x) => ({ x, top: 805, bottom: 856, half: 94 }))];
    expect(lanesTouch(lanes, spreadLanes(lanes, 8, 1912, []))).toBe(true);
    expect(lanesTouch(lanes, spreadLanes(lanes, 8, 1912, [], 1920))).toBe(false);
  });
});

describe("Mộc Tinh's teaching lines", () => {
  it("Rễ hút sinh khí's two lines are never cut by the roots' line that comes 1.35 s later: it waits its turn", () => {
    const w = world();
    const banner = new BossBanner();
    const strike = (move: "roots" | "drain"): RareEvent => ({ t: "bossStrike", tick: 0, move, hit: false, end: 72, count: 1 });
    banner.read([strike("drain")], w, 0);
    const lineAt = (now: number) => (banner.read([], w, now), /<p class="td-say">([^<]*)<\/p>/.exec(banner.html({ ...w, boss: { ...w.boss, stage: BOSS.fight } } as never, now))?.[1] ?? "");
    banner.read([strike("roots")], w, 1350);
    expect(lineAt(1400)).toContain("Sinh khí làng này");
    expect(lineAt(2600)).toMatch(/Rễ hút 1 mạng mỗi 30 s/);
    expect(lineAt(5600)).toContain("Rễ ơi, mọc lên!");
  });
});
