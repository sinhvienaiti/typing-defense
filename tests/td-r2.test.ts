import { describe, expect, it } from "vitest";
import { ticks } from "../src/content/compile";
import { DIRECT, PANIC, SHARDS, ULT } from "../src/content/rules";
import type { RareEvent } from "../src/sim/events";
import { SOURCE, STAT } from "../src/sim/stats";
import { BOSS } from "../src/sim/stores/boss";
import { CALL_KIND } from "../src/sim/stores/calls";
import { PROJECTILE } from "../src/sim/stores/projectiles";
import { inRing, panicNear } from "../src/sim/systems/agents";
import { bossSlot } from "../src/sim/systems/boss";
import { lengthBand } from "../src/sim/systems/calls";
import { damageEnemy } from "../src/sim/systems/combat";
import { directTicks } from "../src/sim/systems/direct";
import { ultSpot } from "../src/sim/systems/ult";
import { step, type World } from "../src/sim/world";
import { wordText } from "../src/typing/decks";
import { actionsHtml } from "../src/ui/hud";
import { teamHtml } from "../src/ui/team-bar";
import { arrive, enemyAt, q, run, send, world } from "./td/fixtures";
import { callWord, realDeck, type } from "./td/typing";

/**
 * 1B R2 "Gõ giúp trận" (docs/td/BUILD_1B.md §8–§10, §5.5): Tối Thượng's charge, cast, feathers and burn; Chữ Chiêu; the
 * direct call and Ngắt on Lửng Tanuki; Nuppeppō's split; Thư Đồng's panic; the sandbox's `spawn` and `ult`.
 */
const deck = realDeck();
const sb = (op: string, value?: number | string, enemy?: string) => ({ t: "sandbox" as const, op: (enemy !== undefined ? { op, enemy, value } : value === undefined ? { op } : { op, value }) as never });
const reason = (events: readonly RareEvent[]): string | undefined => events.flatMap((e) => (e.t === "rejected" ? [e.reason] : []))[0];
const hero = (w: World) => ({ x: w.agents.x[0]!, z: w.agents.z[0]! });
const ult = (w: World, x: number, z: number) => send(w, { t: "ult", qx: q(x), qz: q(z) });

/** `id` standing `back` m short of the end of route 0 (near Draconis at home), held there unless `walks`; the Bastion's crossbow held too. */
function standing(w: World, id: string, back: number, walks = false): number {
  const e = enemyAt(w, id, 0, w.lanes[0]!.length - back);
  if (!walks) w.enemies.stunUntil[e] = 1e9;
  w.buildings.stunUntil[0] = 1e9;
  return e;
}

describe("Tối Thượng (BUILD_1B §8)", () => {
  it("starts empty and charges by words typed, Mảnh Chữ within 12 m of Draconis and the night, never past full", () => {
    const w = world({ deck, vocab: 3 });
    expect(w.ult.charge).toBe(0);
    // A Cương Thi (0.5 a shard) and a Thuồng Luồng (2) brought down by him, one far away (nothing).
    const near = standing(w, "cuong-thi", 6);
    const heavy = standing(w, "thuong-luong", 7);
    const far = enemyAt(w, "cuong-thi", 0, 10);
    for (const e of [near, heavy, far]) damageEnemy(w, e, 1e4, 2, SOURCE.tower);
    step(w);
    expect(w.ult.charge).toBeCloseTo(ULT.shard * (SHARDS.swarm + SHARDS.medium), 9);
    expect(w.stats[STAT.shards]).toBeCloseTo(2.5, 9);
    // A word typed: +1.2·(0.5 + 0.5 Q).
    const before = w.ult.charge;
    const s = callWord(w, [...Array(deck.count).keys()].find((k) => deck.level[k] === 1 && deck.len[k] === 4)!);
    const hit = type(w, wordText(deck, w.words.word[s]!)).find((e): e is Extract<RareEvent, { t: "wordHit" }> => e.t === "wordHit")!;
    expect(w.ult.charge - before).toBeCloseTo(ULT.perWord * (0.5 + 0.5 * hit.quality), 9);
    send(w, sb("night"));
    const from = w.ult.charge;
    run(w, 60);
    expect(w.ult.charge - from).toBeCloseTo(ULT.nightPerS, 6);
    w.ult.charge = ULT.max - 0.01;
    run(w, 60);
    expect(w.ult.charge).toBe(ULT.max);
  });

  it("casts within 20 m of Draconis once full and 45 s on: 12 feathers 10 ticks apart, each at the enemy in the rain with the most hit points not aimed at yet, 25 magic in a 1.5 m blast; the rest burns at the end", () => {
    const w = world({ gold: 5000 });
    const h = hero(w);
    expect(reason(ult(w, h.x, h.z - 8))).toBe("ultEmpty");
    send(w, sb("ult"));
    expect(reason(ult(w, h.x, h.z - 25))).toBe("ultFar");
    const foes = [8, 11, 14].map((back, k) => {
      const e = standing(w, "thuong-luong", back);
      w.enemies.hp[e] = 300 + 10 * k;
      return e;
    });
    const spot = { x: w.enemies.x[foes[1]!]!, z: w.enemies.z[foes[1]!]! };
    const cast = ult(w, spot.x, spot.z);
    expect(cast.find((e) => e.t === "ult")).toMatchObject({ x: q(spot.x) / 4, z: q(spot.z) / 4 });
    const c = w.calls.slotOf(w.ult.call);
    expect([w.calls.kind[c], w.calls.words[c], w.calls.expire[c]! - (w.tick - 1), w.calls.agent[c]]).toEqual([CALL_KIND.ult, ULT.words, ticks(ULT.lifeS), 0]);
    // The first three feathers aim at the three, the most hit points first; then round again.
    const feathers = () => w.projectiles.live().filter((p) => w.projectiles.kind[p] === PROJECTILE.feather);
    const aimed = feathers().map((p) => w.enemies.slotOf(w.projectiles.target[p]!));
    expect(reason(ult(w, spot.x, spot.z))).toBe("ultEmpty"); // spent
    for (let k = 1; k < 110; k += 1) {
      const before = new Set(feathers().map((p) => w.projectiles.id(p)));
      step(w);
      for (const p of feathers()) if (!before.has(w.projectiles.id(p))) aimed.push(w.enemies.slotOf(w.projectiles.target[p]!));
    }
    expect(w.stats[STAT.ultFeathers]).toBe(ULT.feathers);
    expect(aimed.slice(0, 3)).toEqual([foes[2], foes[1], foes[0]]);
    run(w, ticks(ULT.lifeS));
    // 4 feathers each, ULT.damage magic (no resist), then burning (Draconis' burn, by Tối Thượng).
    expect(w.stats[STAT.damageUlt]).toBeGreaterThanOrEqual(3 * 4 * ULT.damage);
    expect(w.ult.on).toBe(0);
    for (const e of foes) expect([w.enemies.burnUntil[e]! > w.tick, w.enemies.burnBy[e]]).toEqual([true, SOURCE.ult]);
    // 45 s between two casts, full or not.
    w.ult.charge = ULT.max;
    expect(reason(ult(w, spot.x, spot.z))).toBe("ultBusy");
    run(w, ticks(ULT.minGapS));
    expect(reason(ult(w, spot.x, spot.z))).toBeUndefined();
  });

  it("the boss takes ×0.25 of it and never burns; the story opens it on night 3 (BUILD_1B §12; test pass 27/10: day 3 took it)", () => {
    const w = world({ gold: 5000 });
    send(w, sb("preset"), sb("boss"));
    for (let k = 0; k < 60 * 60 && w.boss.stage !== BOSS.fight; k += 1) step(w);
    const e = bossSlot(w);
    const hp = w.enemies.hp[e]!;
    damageEnemy(w, e, ULT.damage, 1, SOURCE.ult);
    expect(hp - w.enemies.hp[e]!).toBe(Math.round(ULT.damage * ULT.bossMul));
    expect(w.stats[STAT.bossUlt]).toBe(Math.round(ULT.damage * ULT.bossMul));
    const story = world({ sandbox: false });
    story.ult.charge = ULT.max;
    expect(reason(ult(story, hero(story).x, hero(story).z - 5))).toBe("locked");
    story.day = 3;
    expect(reason(ult(story, hero(story).x, hero(story).z - 5))).toBe("locked");
    story.phase = "night";
    expect(reason(ult(story, hero(story).x, hero(story).z - 5))).toBeUndefined();
  });

  it("Chữ Chiêu: 3 known short words over Draconis for 4 s; each typed brings 3 feathers 0.3 s on, the whole call Perfect 1 more; left alone it costs nothing", () => {
    const w = world({ deck, vocab: 3 });
    send(w, sb("ult"));
    const h = hero(w);
    ult(w, h.x, h.z - 6);
    const c = w.calls.slotOf(w.ult.call);
    const [lo, hi] = lengthBand(35, true);
    for (let k = 0; k < ULT.words; k += 1) {
      const s = w.calls.word[c]!;
      expect(s).toBeGreaterThanOrEqual(0);
      const word = w.words.word[s]!;
      expect([deck.level[word]! <= 2, deck.len[word]! >= lo && deck.len[word]! <= hi]).toEqual([true, true]);
      type(w, wordText(deck, word), 150);
    }
    expect(w.calls.slotOf(w.ult.call)).toBe(-1);
    run(w, ticks(ULT.lifeS) + ticks(4));
    expect(w.stats[STAT.ultFeathers]).toBe(ULT.feathers + ULT.words * ULT.perWordFeathers + ULT.perfectFeathers);
    // Not typed: 12 feathers, the chain and the treasury as they were.
    const idle = world({ deck, vocab: 3 });
    send(idle, sb("ult"));
    const [chain, gold] = [idle.typing.chain, idle.gold];
    ult(idle, hero(idle).x, hero(idle).z - 6);
    run(idle, ticks(ULT.lifeS) + ticks(2));
    expect([idle.stats[STAT.ultFeathers], idle.typing.chain, idle.gold]).toEqual([ULT.feathers, chain, gold]);
  });

  it("the app's spot: the mouse within 20 m of Draconis, else the enemy within 14 m of him with the most enemy hit points within 6 m", () => {
    const w = world();
    const h = hero(w);
    expect(ultSpot(w, { x: h.x + 3, z: h.z - 4 })).toEqual({ x: h.x + 3, z: h.z - 4 });
    expect(ultSpot(w, { x: h.x, z: h.z - 30 })).toEqual(h); // none near him: where he is
    const lone = standing(w, "thuong-luong", 11);
    const pack = [2, 2.5, 3].map((back) => standing(w, "cuong-thi", back));
    w.enemies.hp[lone] = 50;
    const at = ultSpot(w, null);
    expect(pack.some((e) => w.enemies.x[e] === at.x && w.enemies.z[e] === at.z)).toBe(true);
  });
});

describe("direct calls and Ngắt (BUILD_1B §9, §10)", () => {
  /** A Tanuki walking by four Cương Thi held near Draconis (R2 review: `need` 4, BUILD_NOTES §7.4). */
  function drumming(): { w: World; t: number; foes: number[] } {
    const w = world({ deck, vocab: 3 });
    const foes = [8, 8.5, 9, 9.5].map((back) => standing(w, "cuong-thi", back));
    const t = standing(w, "tanuki", 8, true);
    return { w, t, foes };
  }

  it("with 3 others within 6 m a Tanuki walks on (R2 review: it needs 4)", () => {
    const w = world({ deck, vocab: 3 });
    [8, 8.5, 9].forEach((back) => standing(w, "cuong-thi", back));
    const t = standing(w, "tanuki", 8, true);
    expect([send(w).some((e) => e.t === "drum"), w.enemies.castEnd[t]]).toEqual([false, 0]);
  });

  it("a Tanuki with 4 others within 6 m stands and drums for T; a direct call of one known short word follows it; typed, the drum breaks: stunned 2 s, +5 + 2 gold, Tối Thượng +3", () => {
    const { w, t } = drumming();
    const events = send(w);
    const T = directTicks(w);
    expect(T).toBe(ticks(Math.max(DIRECT.minS, Math.min(DIRECT.maxS, DIRECT.base + (2.2 * (lengthBand(35, true)[1] + 1) * 12) / 35))));
    expect(events.find((e) => e.t === "drum")).toMatchObject({ enemy: w.enemies.id(t), end: w.tick - 1 + T });
    expect([w.enemies.castEnd[t], w.enemies.stunUntil[t]]).toEqual([w.tick - 1 + T, w.tick - 1 + T]);
    const c = w.calls.live().find((k) => w.calls.kind[k] === CALL_KIND.direct)!;
    expect([w.calls.foe[c], w.calls.words[c], w.calls.bright[c], w.calls.x[c], w.calls.z[c]]).toEqual([w.enemies.id(t), 1, 1, w.enemies.x[t], w.enemies.z[t]]);
    const word = w.words.word[w.calls.word[c]!]!;
    expect(deck.level[word]).toBeLessThanOrEqual(2);
    const [gold, charge] = [w.gold, w.ult.charge];
    const typed = type(w, wordText(deck, word), 150);
    expect(typed.find((e) => e.t === "direct")).toMatchObject({ enemy: w.enemies.id(t), ok: true });
    expect(w.gold - gold).toBe((5 + DIRECT.gold) * 1000);
    expect(w.ult.charge - charge).toBeGreaterThan(DIRECT.ult);
    expect([w.enemies.castEnd[t], w.enemies.stunUntil[t]! - (w.tick - 1), w.stats[STAT.directOk]]).toEqual([0, ticks(2), 1]);
    expect(w.calls.slotOf(w.calls.id(c))).toBe(-1);
  });

  it("let run to T, every enemy within 6 m heals 25 % of its hit points and its call closes; nothing else is lost; it may drum again 12 s on", () => {
    const { w, t, foes } = drumming();
    for (const e of foes) w.enemies.hp[e] = 20;
    w.enemies.hp[t] = 50;
    send(w);
    const end = w.enemies.castEnd[t]!;
    const [gold, chain] = [w.gold, w.typing.chain];
    const events: RareEvent[] = [];
    while (w.tick <= end) events.push(...send(w));
    expect(events.find((e) => e.t === "direct")).toMatchObject({ ok: false });
    expect(foes.map((e) => w.enemies.hp[e])).toEqual([29, 29, 29, 29]);
    expect(w.enemies.hp[t]).toBe(50 + Math.round(110 * 0.25));
    expect([w.calls.live().filter((k) => w.calls.kind[k] === CALL_KIND.direct).length, w.gold, w.typing.chain, w.stats[STAT.directMissed]]).toEqual([0, gold, chain, 1]);
    expect(w.enemies.abilityAt[t]).toBe(w.tick - 1 + ticks(12));
  });

  it("drums only where the village fights: by the rift, no attack building's rim within 9 m, it walks on (BUILD_NOTES §7.3)", () => {
    const w = world({ deck, vocab: 3 });
    for (const d of [10, 10.5, 11, 11.5]) w.enemies.stunUntil[enemyAt(w, "cuong-thi", 0, d)] = 1e9;
    const t = enemyAt(w, "tanuki", 0, 10.5);
    const events = send(w);
    expect([events.some((e) => e.t === "drum"), w.enemies.castEnd[t], w.calls.live().length]).toEqual([false, 0, 0]);
  });

  it("at most 2 direct calls open at once: a third Tanuki drums uncalled", () => {
    const w = world({ deck, vocab: 3 });
    [8, 8.5, 9].forEach((back) => standing(w, "cuong-thi", back));
    const tanuki = [8, 8.2, 8.4].map((back) => standing(w, "tanuki", back, true));
    send(w);
    expect(tanuki.map((t) => w.enemies.castEnd[t]! > 0)).toEqual([true, true, true]);
    expect(w.calls.live().filter((k) => w.calls.kind[k] === CALL_KIND.direct).length).toBe(DIRECT.open);
  });
});

describe("Nuppeppō and the sandbox's R2 commands (BUILD_1B §10, §14)", () => {
  it("killed by anything but a blast, it splits into two halves where it fell, in its wave; a blast kills it whole", () => {
    const w = world();
    const a = enemyAt(w, "nuppeppo", 0, 30, 0);
    damageEnemy(w, a, 1e4, 0, SOURCE.tower);
    step(w);
    const halves = () => w.enemies.live().filter((e) => w.c.enemies[w.enemies.def[e]!]!.id === "nuppeppo-con");
    expect(halves().map((e) => [w.enemies.route[e], w.enemies.wave[e], Math.round(w.enemies.dist[e]!)])).toEqual([[0, 0, 30], [0, 0, 30]]);
    expect(w.waveAlive[0]).toBe(2);
    const b = enemyAt(w, "nuppeppo", 1, 30, 0);
    damageEnemy(w, b, 1e4, 0, SOURCE.tower, true);
    step(w);
    expect(halves().length).toBe(2);
  });

  it("spawn sends packs of any enemy but the boss from the rift into the running wave; ult fills the charge; the story refuses both", () => {
    const w = world();
    const count = () => w.spawnQueue.length + w.enemies.count;
    const queued = count();
    send(w, sb("spawn", 3, "nuppeppo"), sb("spawn", 1, "tanuki"));
    expect(count() - queued).toBe(4);
    expect([reason(send(w, sb("spawn", 1, "moc-tinh"))), reason(send(w, sb("spawn", 0, "tanuki")))]).toEqual(["badValue", "badValue"]);
    send(w, sb("ult"));
    expect(w.ult.charge).toBe(ULT.max);
    const story = world({ sandbox: false });
    expect([reason(send(story, sb("spawn", 1, "tanuki"))), reason(send(story, sb("ult")))]).toEqual(["noSandbox", "noSandbox"]);
  });
});

describe("Tối Thượng on the HUD (BUILD_1B §8.2, §13.3)", () => {
  it("the action button shows the day it opens, the charge in steps of 5 %, the rain; Draconis' lantern carries the charge as a ring", () => {
    const w = world({ sandbox: false });
    expect(actionsHtml(w, false)).toContain('data-act="ult" disabled>Tối Thượng · Mở ở Đêm 3');
    [w.day, w.ult.charge, w.phase] = [3, 47.3, "night"];
    expect(actionsHtml(w, false)).toContain('data-act="ult" disabled>Tối Thượng 45 %<kbd>=</kbd>');
    expect(teamHtml(w, 0)).toContain('class="td-ult" style="--ult:45%"');
    w.ult.charge = ULT.max;
    expect(actionsHtml(w, false)).toContain('data-act="ult">Tối Thượng<kbd>=</kbd>');
    expect(teamHtml(w, 0)).toContain('class="td-ult is-full" style="--ult:100%"');
    w.ult.on = 1;
    expect(actionsHtml(w, false)).toContain('data-act="ult" disabled>Mưa lông lửa');
  });
});

describe("Thư Đồng's panic (BUILD_1B §5.5, R2)", () => {
  it("a helper within 6 m of a building Rễ Trồi strikes runs home, stands there 5 s, then goes back; meanwhile its ring lights nothing", () => {
    const w = world({ gold: 5000 });
    send(w, sb("preset"));
    const B = w.buildings;
    const cannon = B.live().find((b) => w.c.buildings[B.def[b]!]!.id === "cannon")!;
    send(w, { t: "assignUnit", agent: 1, building: B.id(cannon) });
    arrive(w);
    expect(inRing(w, B.x[cannon]!, B.z[cannon]!)).toBe(true);
    const from = w.events.rare.length;
    panicNear(w, cannon);
    expect(w.events.rare.slice(from).find((e) => e.t === "panic")).toMatchObject({ agent: 1 });
    expect([w.agents.panic[1], w.stats[STAT.panics], inRing(w, B.x[cannon]!, B.z[cannon]!)]).toEqual([-1, 1, false]);
    arrive(w);
    expect(w.agents.panic[1]).toBe(w.tick - 1 + ticks(PANIC.s));
    run(w, ticks(PANIC.s));
    expect([w.agents.panic[1], w.agents.goal[1]]).toEqual([0, cannon]);
    arrive(w);
    expect(inRing(w, B.x[cannon]!, B.z[cannon]!)).toBe(true);
  });
});
