import { describe, expect, it } from "vitest";
import { ticks } from "../src/content/compile";
import { DIRECT } from "../src/content/rules";
import { SLICE_1A } from "../src/content/slice-1a";
import type { RareEvent } from "../src/sim/events";
import { SOURCE, STAT } from "../src/sim/stats";
import { CALL_KIND } from "../src/sim/stores/calls";
import { PROJECTILE } from "../src/sim/stores/projectiles";
import { damageEnemy, launch } from "../src/sim/systems/combat";
import { directTicks, domeMul, domesUp } from "../src/sim/systems/direct";
import { step, type World } from "../src/sim/world";
import { wordText } from "../src/typing/decks";
import { enemyAt, run, send, world } from "./td/fixtures";
import { realDeck, type } from "./td/typing";

/**
 * 1B R3 step 7 (docs/td/BUILD_1B.md §9.2, §10; R3_PLAN.md §3.7): the sandbox's Cương Thi Đầu Đàn (Neo) and Quỷ Núi
 * Troll (Phá Khiên). Ngắt (R2) keeps its own tests in td-r2.test.ts.
 */
const deck = realDeck();
const directOf = (events: readonly RareEvent[]) => events.find((e): e is Extract<RareEvent, { t: "direct" }> => e.t === "direct");

/** `id` standing `back` m short of the end of route 0 (by the Bastion), held there unless `walks`; the Bastion's crossbow held too. */
function standing(w: World, id: string, back: number, walks = false): number {
  const e = enemyAt(w, id, 0, w.lanes[0]!.length - back);
  if (!walks) w.enemies.stunUntil[e] = 1e9;
  w.buildings.stunUntil[0] = 1e9;
  return e;
}

/** The direct call of enemy slot e and its word's deck index. */
function directWord(w: World, e: number): number {
  const c = w.calls.live().find((k) => w.calls.kind[k] === CALL_KIND.direct && w.calls.foe[k] === w.enemies.id(e))!;
  expect([w.calls.words[c], w.calls.bright[c]]).toEqual([1, 1]);
  return w.words.word[w.calls.word[c]!]!;
}

describe("Cương Thi Đầu Đàn and Neo (BUILD_1B §9.2)", () => {
  it("with 4 others within 6 m and a building within 20 m it calls Neo for T and walks on; typed: the pack within 6 m stands 3 s (it too), it takes ×1.3 for 6 s, +2 gold; one further on walks", () => {
    const w = world({ deck, vocab: 3 });
    [9, 9.5, 10, 10.5].forEach((back) => standing(w, "cuong-thi", back));
    const lead = standing(w, "cuong-thi-lead", 9.5, true);
    const loose = standing(w, "cuong-thi", 10, true);
    const far = enemyAt(w, "cuong-thi", 0, w.lanes[0]!.length - 32);
    const events = send(w);
    const T = directTicks(w);
    expect(events.find((e) => e.t === "drum")).toMatchObject({ enemy: w.enemies.id(lead), end: w.tick - 1 + T });
    expect([w.enemies.castEnd[lead], w.enemies.stunUntil[lead]]).toEqual([w.tick - 1 + T, 0]); // it walks on
    const word = directWord(w, lead);
    expect(deck.level[word]).toBeLessThanOrEqual(2);
    const gold = w.gold;
    const hit = directOf(type(w, wordText(deck, word), 150))!;
    expect(hit).toMatchObject({ enemy: w.enemies.id(lead), ok: true, verb: 1 });
    expect(w.gold - gold).toBe(DIRECT.gold * 1000);
    expect([w.enemies.stunUntil[lead], w.enemies.stunUntil[loose], w.enemies.takenUntil[lead]]).toEqual([hit.tick + ticks(3), hit.tick + ticks(3), hit.tick + ticks(6)]);
    expect([w.enemies.stunUntil[far], w.enemies.castEnd[lead], w.enemies.abilityAt[lead]]).toEqual([0, 0, hit.tick + ticks(15)]);
    const hp = w.enemies.hp[lead]!;
    damageEnemy(w, lead, 100, 0, SOURCE.tower);
    expect(hp - w.enemies.hp[lead]!).toBe(Math.round(100 * (1 - 0.3) * 1.3));
    [w.enemies.stunUntil[lead], w.enemies.hp[lead]] = [1e9, 1e5]; // held, and Draconis' fire never kills it
    run(w, ticks(6));
    const after = w.enemies.hp[lead]!;
    damageEnemy(w, lead, 100, 0, SOURCE.tower);
    expect(after - w.enemies.hp[lead]!).toBe(Math.round(100 * (1 - 0.3)));
  });

  it("let run, its pack walks on and nothing else happens; with 3 others by it, no building within 20 m, or out of every help ring, it calls nothing", () => {
    const w = world({ deck, vocab: 3 });
    const pack = [9, 9.5, 10, 10.5].map((back) => standing(w, "cuong-thi", back));
    const lead = standing(w, "cuong-thi-lead", 9.5, true);
    send(w);
    w.enemies.stunUntil[lead] = 1e9; // held while its call runs (a stunned leader starts nothing, a running call ends anyway)
    const end = w.enemies.castEnd[lead]!;
    const [gold, chain, hp] = [w.gold, w.typing.chain, pack.map((e) => w.enemies.hp[e])];
    const events: RareEvent[] = [];
    while (w.tick <= end) events.push(...send(w));
    expect(directOf(events)).toMatchObject({ ok: false, verb: 1 });
    expect([w.gold, w.typing.chain, pack.map((e) => w.enemies.hp[e]), w.enemies.takenUntil[lead], w.stats[STAT.directMissed]]).toEqual([gold, chain, hp, 0, 1]);
    expect(w.calls.live().filter((k) => w.calls.kind[k] === CALL_KIND.direct)).toEqual([]);
    const few = world({ deck, vocab: 3 });
    [9, 9.5, 10].forEach((back) => standing(few, "cuong-thi", back));
    const alone = standing(few, "cuong-thi-lead", 9.5, true);
    expect([send(few).some((e) => e.t === "drum"), few.enemies.castEnd[alone]]).toEqual([false, 0]);
    const rift = world({ deck, vocab: 3 });
    for (const d of [10, 10.5, 11, 11.5]) rift.enemies.stunUntil[enemyAt(rift, "cuong-thi", 0, d)] = 1e9;
    const by = enemyAt(rift, "cuong-thi-lead", 0, 10.5);
    expect([send(rift).some((e) => e.t === "drum"), rift.enemies.castEnd[by]]).toEqual([false, 0]);
    // Test pass 27/10: by the Bastion but Draconis away (no helper out), no ring takes it in: no Neo, its call would never light.
    const away = world({ deck, vocab: 3 });
    [9, 9.5, 10, 10.5].forEach((back) => standing(away, "cuong-thi", back));
    const unseen = standing(away, "cuong-thi-lead", 9.5, true);
    [away.agents.x[0], away.agents.z[0]] = [0, -30];
    expect([send(away).some((e) => e.t === "drum"), away.enemies.castEnd[unseen]]).toEqual([false, 0]);
  });

  it("its aura hurries every enemy within 6 m ×1.2, always, and leads them: on its road none walks on past 1.5 m ahead of it; one further on walks at its own pace; it all ends with it", () => {
    const w = world();
    const lead = enemyAt(w, "cuong-thi-lead", 0, 40);
    w.enemies.stunUntil[lead] = 1e9;
    const behind = enemyAt(w, "cuong-thi", 0, 37);
    const ahead = enemyAt(w, "cuong-thi", 0, 43);
    const far = enemyAt(w, "cuong-thi", 0, 60);
    const [a, b] = [w.enemies.dist[behind]!, w.enemies.dist[far]!];
    step(w);
    const v = w.c.enemies[w.c.enemyIndex("cuong-thi")]!.speed * w.pace.foeSpeed;
    expect(w.enemies.dist[behind]! - a).toBeCloseTo(v * 1.2, 9);
    expect(w.enemies.dist[ahead]).toBe(43); // it waits for its leader
    expect(w.enemies.dist[far]! - b).toBeCloseTo(v, 9);
    run(w, 60);
    expect(w.enemies.dist[behind]).toBeCloseTo(40 + DIRECT.leadM, 9); // caught up, kept 1.5 m ahead at most
    damageEnemy(w, lead, 1e4, 2, SOURCE.tower);
    step(w);
    const c = w.enemies.dist[ahead]!;
    step(w);
    expect(w.enemies.dist[ahead]! - c).toBeCloseTo(v, 9);
  });
});

describe("Quỷ Núi Troll and Phá Khiên (BUILD_1B §9.2)", () => {
  it("within 25 m of an attack building and in a help ring it raises a 4 m dome for T that rides on it; a shot launched outside hurts under it ×0.3, from inside or off it ×1", () => {
    const w = world({ deck, vocab: 3 });
    const troll = standing(w, "troll", 15, true);
    send(w);
    expect(w.enemies.castEnd[troll]).toBe(0); // 15 m short of the Bastion, out of Draconis' 14 m ring: no dome (test pass 27/10)
    [w.agents.x[0], w.agents.z[0]] = [w.enemies.x[troll]!, w.enemies.z[troll]! + 6]; // he comes: his ring takes it in
    send(w);
    expect([w.enemies.castEnd[troll], w.enemies.stunUntil[troll]]).toEqual([w.tick - 1 + directTicks(w), 0]);
    const [x, z] = [w.enemies.x[troll]!, w.enemies.z[troll]!];
    const domes = domesUp(w, []);
    expect(domes).toEqual([x, z, 4, 0.3]);
    expect([domeMul(domes, x + 1, z, x + 20, z), domeMul(domes, x + 1, z, x + 2, z), domeMul(domes, x + 5, z, x + 20, z)]).toEqual([0.3, 1, 1]);
    // A real arrow from 20 m (physical: armour 30 %), and Tối Thượng's feather (magic: resist 30 %) as before.
    const archer = w.c.buildings[w.c.buildingIndex("archer")]!;
    const hurt = (kind: number, source: number, type: number) => {
      const before = w.stats[STAT.damageTower + source]!;
      launch(w, kind, x + 20, z, { ...archer.attack!, damageType: type }, archer.attack!.levels[0]!, troll, source, 100, false, 1);
      for (let k = 0; k < 120 && w.projectiles.count > 0; k += 1) step(w);
      return w.stats[STAT.damageTower + source]! - before;
    };
    expect(hurt(PROJECTILE.arrow, SOURCE.tower, 0)).toBe(Math.round(100 * 0.7 * 0.3));
    expect(hurt(PROJECTILE.feather, SOURCE.ult, 1)).toBe(Math.round(100 * 0.7));
    expect(w.enemies.castEnd[troll]).toBeGreaterThan(w.tick);
  });

  it("typed, the dome breaks: stunned 1.5 s, no dome for 10 s, +2 gold; let run, the dome holds T and comes back 6 s after", () => {
    const w = world({ deck, vocab: 3 });
    const troll = standing(w, "troll", 9, true);
    send(w);
    const gold = w.gold;
    const hit = directOf(type(w, wordText(deck, directWord(w, troll)), 150))!;
    expect(hit).toMatchObject({ ok: true, verb: 2 });
    expect([w.enemies.castEnd[troll], w.enemies.stunUntil[troll], w.enemies.abilityAt[troll], w.gold - gold]).toEqual([0, hit.tick + ticks(1.5), hit.tick + ticks(10), DIRECT.gold * 1000]);
    expect(domesUp(w, [])).toEqual([]);
    const idle = world({ deck, vocab: 3 });
    const t = standing(idle, "troll", 9, true);
    send(idle);
    idle.enemies.stunUntil[t] = 1e9;
    const end = idle.enemies.castEnd[t]!;
    const events: RareEvent[] = [];
    while (idle.tick <= end) events.push(...send(idle));
    expect(directOf(events)).toMatchObject({ ok: false, verb: 2 });
    expect([idle.enemies.castEnd[t], idle.enemies.abilityAt[t], domesUp(idle, []).length]).toEqual([0, end + ticks(6), 0]);
    run(idle, ticks(6) - 2);
    idle.enemies.stunUntil[t] = 0;
    send(idle);
    expect(idle.enemies.castEnd[t]).toBe(0);
    send(idle);
    expect(idle.enemies.castEnd[t]).toBeGreaterThan(idle.tick);
  });
});

describe("the R3 enemies stay in the sandbox (BUILD_1B §9.2)", () => {
  it("no night of map 1 nor the boss's escort brings them; the sandbox's spawn does, the story refuses it", () => {
    const waves = [...SLICE_1A.waves.list.flat(), ...SLICE_1A.stage!.boss.escort].map((entry) => entry.enemy);
    expect(waves.filter((id) => id === "troll" || id === "cuong-thi-lead")).toEqual([]);
    const w = world();
    send(w, { t: "sandbox", op: { op: "spawn", enemy: "troll", value: 1 } }, { t: "sandbox", op: { op: "spawn", enemy: "cuong-thi-lead", value: 1 } });
    run(w, 30);
    expect(w.enemies.live().map((e) => w.c.enemies[w.enemies.def[e]!]!.id).sort()).toEqual(["cuong-thi-lead", "troll"]);
    const story = world({ sandbox: false });
    expect(send(story, { t: "sandbox", op: { op: "spawn", enemy: "troll", value: 1 } }).find((e) => e.t === "rejected")).toMatchObject({ reason: "noSandbox" });
  });
});
