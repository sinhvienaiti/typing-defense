import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TICK_HZ } from "../src/content/rules";
import { PLACE_CHECKS } from "../src/sim/placement";
import { CALL_KIND } from "../src/sim/stores/calls";
import { makeCall } from "../src/sim/systems/calls";
import { Selection } from "../src/app/selection";
import { review } from "../src/sim/systems/learn";
import { compileDeck } from "../src/typing/decks";
import { dockHtml } from "../src/ui/build-menu";
import { BOSS } from "../src/sim/stores/boss";
import { STAT } from "../src/sim/stats";
import { bossSlot } from "../src/sim/systems/boss";
import { actionsHtml, BossBanner, REASON, statusHtml, stripHtml } from "../src/ui/hud";
import { lossHint } from "../src/ui/sheets";
import { TIPS } from "../src/ui/tips";
import { teamHtml } from "../src/ui/team-bar";
import { pips } from "../src/view/words/cards";
import { built, run, send, world } from "./td/fixtures";
import { callWord, type } from "./td/typing";

/**
 * The HUD's words and numbers (docs/td/BUILD_NOW.md §5.3, BUILD_1A6 §9): what
 * a panel promises is what the sim does. The panels are HTML strings, read here
 * without a page.
 */
const status = (w: ReturnType<typeof world>) => statusHtml(w, true, false, false, []);

describe("the status panel", () => {
  it("shows gold, wood, food, seeds and lives, then the day's clock or the night's enemies left", () => {
    const w = world();
    const html = status(w);
    for (const [label, value] of [["Gold", "220"], ["Wood", "40"], ["Rice", "0"], ["Seeds", "4"], ["Lives", "20"]]) expect(html).toContain(`<small>${label}</small><b>${value}</b>`);
    expect(html).toContain("<b>Day 1 · 1:15</b>");
    run(w, 61);
    expect(status(w)).toContain("<b>Day 1 · 1:14</b>"); // 73.98 s left rounds up
    send(w, { t: "callNight" });
    expect(status(w)).toMatch(/<b>Night 1 · (1 foe|\d+ foes) left<\/b>/);
    w.spawnQueue.splice(1 - w.enemies.count); // one foe still to come (judge C10 r3: "1 foes left")
    expect(w.enemies.count + w.spawnQueue.length).toBe(1);
    expect(status(w)).toContain("<b>Night 1 · 1 foe left</b>");
    expect(status(w)).not.toContain("Early night");
  });

  it("the call button promises the gold an early night pays, at every tick of the day", () => {
    for (const into of [0, 1, 31, 59, 60, 61, 3000, 4439, 4441, 4499]) {
      const w = world();
      run(w, into);
      const html = status(w);
      const promised = Number(/Early night · \+(\d+) Gold/.exec(html)?.[1]);
      const called = send(w, { t: "callNight" }).find((event) => event.t === "nightCalled");
      expect(called, "tick " + into).toMatchObject({ day: 1, bonus: promised });
      expect(promised).toBe(Math.ceil((30 * (4500 - into)) / 4500));
    }
  });

  it("the call button shows the time left and a bar that empties with the day, pulses in the last 10 s, and says Đã dừng when paused (owner, 26/10/2026)", () => {
    const w = world();
    const bar = (html: string) => Number(/<s style="width:(\d+)%">/.exec(html)?.[1]);
    expect(status(w)).toContain("<b>Early night · +30 Gold</b>");
    expect([bar(status(w)), /<b>1:15<\/b>/.test(status(w)), status(w).includes("is-last")]).toEqual([100, true, false]);
    run(w, 1800);
    expect([bar(status(w)), /<b>0:45<\/b>/.test(status(w)), /\+18 Gold/.test(status(w))]).toEqual([60, true, true]);
    run(w, 4500 - 1800 - 600);
    expect([/<b>0:10<\/b>/.test(status(w)), status(w).includes('class="td-call is-last"')]).toEqual([true, true]);
    const paused = statusHtml(w, true, true, false, []);
    expect([paused.includes("<b>Paused</b>"), paused.includes("is-last"), /<b>0:10<\/b>/.test(paused)]).toEqual([true, false, false]);
  });

  it("names every reason the sim may refuse a command for, in English", () => {
    // applyCommand's reasons: the string literals commands.ts returns, typeKey's (calls.ts), and canPlace's checks.
    const files = ["../src/sim/commands.ts", "../src/sim/systems/calls.ts"].map((path) => readFileSync(join(__dirname, path), "utf8"));
    const returned = files.flatMap((text) => [...text.matchAll(/return ([^;]*);/g)].flatMap((match) => [...match[1]!.matchAll(/"([a-z][A-Za-z]*)"/g)].map((literal) => literal[1]!)));
    const reasons = [...new Set([...returned, ...PLACE_CHECKS])];
    expect(reasons).toEqual(expect.arrayContaining(["noBuilding", "noBarracks", "badValue", "noSandbox", "badKey", "blocked", "notDay", "path", "tree", "wood", "food", "villagerCap", "notRipe", "noTree"]));
    expect(reasons.filter((reason) => REASON[reason] === undefined)).toEqual([]);
  });
});

describe('the "Đang gọi" chip (BUILD_1A6 §9)', () => {
  it("counts the open calls against the mode's cap", () => {
    const w = world();
    const chip = () => /Calling (\d+)\/(\d+)/.exec(teamHtml(w, 0))?.slice(1).map(Number);
    expect(chip()).toEqual([0, 3]);
    for (let k = 0; k < 4; k += 1) makeCall(w, CALL_KIND.mine, 1, -1, 0, -1, -1);
    run(w, 1);
    expect(chip()).toEqual([3, 3]);
    send(w, { t: "sandbox", op: { op: "mode", value: "challenge" } });
    expect(chip()).toEqual([4, 4]);
  });
});

describe("learning in the HUD (BUILD_1A6 §7)", () => {
  const deck = compileDeck([{ id: "g", text: "good", level: 1, vi: "tốt; hay", ipa: "/ɡʊd/" }, { id: "c", text: "cold", level: 1, vi: "lạnh; rét", ipa: "/koʊld/" }]);

  it("the status counts knowledge and the review book once there are any", () => {
    const w = world({ deck });
    expect(status(w)).not.toContain("Knowledge");
    review(w, 1, true);
    expect(status(w)).toContain("Knowledge <b>0</b> · Review <b>1</b>");
  });

  it("the strip hides a quiz's word past what is typed, under its meaning; the learn mode adds meaning and IPA; other modes neither", () => {
    const w = world({ deck });
    callWord(w, 0, 1, CALL_KIND.quiz);
    type(w, "g", 60, true);
    expect(stripHtml(w, "")).toContain('<b class="td-word"><span>g</span>___</b><small class="td-mean">tốt; hay</small>');
    type(w, "o", 60, true);
    expect(stripHtml(w, "")).toContain("<span>go</span>__</b>");
    for (const [mode, mean] of [["learn", '<small class="td-mean">lạnh; rét /koʊld/</small>'], ["balanced", ""]] as const) {
      const other = world({ deck, mode });
      callWord(other, 1);
      type(other, "c", 60, true);
      expect(stripHtml(other, "")).toContain('<b class="td-word"><span>c</span>old</b>' + mean + "<span");
    }
  });

  it("Settings' learning switches hide the meaning and the IPA each; a quiz keeps its meaning (the prompt)", () => {
    const learn = world({ deck, mode: "learn" });
    callWord(learn, 1);
    type(learn, "c", 60, true);
    const strip = (meaning: boolean, ipa: boolean) => stripHtml(learn, "", false, { meaning, ipa });
    expect(strip(true, false)).toContain('<small class="td-mean">lạnh; rét</small>');
    expect(strip(false, true)).toContain('<small class="td-mean">/koʊld/</small>');
    expect(strip(false, false)).not.toContain("td-mean");
    const quiz = world({ deck });
    callWord(quiz, 0, 1, CALL_KIND.quiz);
    type(quiz, "g", 60, true);
    expect(stripHtml(quiz, "", false, { meaning: false, ipa: false })).toContain('<small class="td-mean">tốt; hay</small>');
  });
});

describe("cards and buttons (BUILD_1A6 §8–§9)", () => {
  it("the farm's card: plots by stage, seeds, a pack, the auto-buy; the Bastion's: villagers, builders, food, hire, sale; a tower's: power charges", () => {
    const w = world({ gold: 1000 });
    const sel = new Selection(w, () => undefined);
    send(w, { t: "sandbox", op: { op: "preset" } });
    const card = (id: string) => {
      sel.focus = w.buildings.id(w.buildings.live().find((b) => w.c.buildings[w.buildings.def[b]!]!.id === id)!);
      return dockHtml(w, sel);
    };
    const farm = card("farm");
    for (const text of ["Ripe <b>1</b> · Growing <b>2</b> · Empty <b>1</b>", "Seeds <b>", "Buy 4 Seeds · 30 Gold", 'class="is-on">Auto Seeds']) expect(farm).toContain(text);
    for (const text of ["Villager <b>5/7</b> · Builder <b>3</b> · Rice <b>0</b>", "Hire Villager · 25 Gold, 5 Rice", "Sell 10 Rice · +10 Gold"]) expect(card("keep")).toContain(text);
    expect(card("archer")).toContain("Charges <b>0/5</b>");
  });

  it("the card of a dim call Tab is on names it and sends the agent; the actions bar has Space only where the mode pauses", () => {
    const w = world({ gold: 1000 });
    const mine = built(w, "gold-mine", 26, -30);
    [w.buildings.haulAt[mine], w.buildings.pile[mine]] = [1e9, 31000];
    run(w, 1);
    const sel = new Selection(w, () => undefined);
    sel.call = w.calls.id(w.buildings.call[mine]!);
    expect(dockHtml(w, sel)).toMatch(/⛏️ Dig.*2 words · dim.*Out of range.*Send Draconis/s);
    w.agents.x[0] = w.buildings.x[mine]!; // in the ring, still dim: it waits for room, sending someone would not light it
    w.agents.z[0] = w.buildings.z[mine]! + 4;
    expect(dockHtml(w, sel)).toMatch(/In range: lights up when a call slot is free/);
    expect(actionsHtml(w, false)).not.toContain("Space");
    send(w, { t: "sandbox", op: { op: "mode", value: "relax" } });
    expect([actionsHtml(w, false), actionsHtml(w, true)].map((html) => /data-act="space">([^<]+)/.exec(html)?.[1])).toEqual(["Pause", "Resume"]);
  });
});

describe("the tactical pause and the word dots (review R2)", () => {
  it("the strip says the game waits, beside the locked word, where the eyes are", () => {
    const deck = compileDeck([{ id: "g", text: "good", level: 1 }]);
    const w = world({ deck, mode: "relax" });
    expect(stripHtml(w, "", true)).toMatch(/^<em class="td-warn td-halt">Paused · Space<\/em><span class="td-chain"/);
    callWord(w, 0);
    type(w, "g", 60, true);
    expect(stripHtml(w, "", true)).toContain('<b class="td-word"><span>g</span>ood</b><em class="td-warn td-halt">Paused');
    expect(stripHtml(w, "")).not.toContain("Paused");
  });

  it("dots count the words a call still asks, the current one included, then the typed ones; none for a one-word call", () => {
    const w = world();
    const chop = makeCall(w, CALL_KIND.chop, 4, -1, 0, -1, -1);
    w.calls.done[chop] = 1;
    expect(pips(w, chop)).toBe("●●●○");
    expect(pips(w, makeCall(w, CALL_KIND.power, 1, -1, 0, -1, -1))).toBe("");
  });
});

describe("the boss bar and the results card (1B R1 review)", () => {
  it("a replayed day 5 (its events gone) gets the warning's chip and Bà Cú Mực's line back, one sentence a line", () => {
    const w = world({ sandbox: false });
    w.day = 5;
    run(w, 2);
    expect(w.boss.stage).toBe(BOSS.warned);
    const banner = new BossBanner();
    banner.tips = TIPS; // ui/tips.ts, its chunk in (R3)
    banner.read([], w, 0); // as main.ts after the replay: no bossWarn left
    const html = banner.html(w, 0);
    expect(html).toContain(TIPS.day5!.chip);
    expect(html).toContain("Bà Cú Mực: Tonight Mộc Tinh awakens.");
    expect(html).not.toContain("Line the glowing root");
    banner.read([], w, 4000);
    expect(banner.html(w, 4000)).toContain("Bà Cú Mực: Line the glowing root with towers.");
  });

  it("the stagger's vulnerable countdown is on the bar; the loss hint blames the stagger only when Dồn lửa words were left (the chest on the won card: td-1b-boss)", () => {
    const w = world({ gold: 5000 });
    send(w, { t: "sandbox", op: { op: "preset" } }, { t: "sandbox", op: { op: "boss" } });
    while (w.boss.stage !== BOSS.fight) run(w, 1);
    w.enemies.hp[bossSlot(w)] = Math.floor(w.boss.hpMax * 0.7);
    run(w, 2);
    expect(new BossBanner().html(w, 0)).toMatch(/stunned · Vulnerable 5 s/);
    w.stats[STAT.burstWords] = 2;
    w.stats[STAT.burstTyped] = 2;
    expect(lossHint(w)).not.toContain("stunned");
    w.stats[STAT.burstTyped] = 1;
    expect(lossHint(w)).toContain("When he's stunned");
  });
});
