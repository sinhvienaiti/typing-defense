import { describe, expect, it } from "vitest";
import { ticks } from "../src/content/compile";
import { MODES, POWER } from "../src/content/rules";
import { SLICE_1A } from "../src/content/slice-1a";
import { FX, type RareEvent } from "../src/sim/events";
import { STAT } from "../src/sim/stats";
import { BOSS } from "../src/sim/stores/boss";
import { CALL_KIND } from "../src/sim/stores/calls";
import { bossHp, bossSlot } from "../src/sim/systems/boss";
import { damageEnemy } from "../src/sim/systems/combat";
import { SOURCE } from "../src/sim/stats";
import { step, type World } from "../src/sim/world";
import { built, enemyAt, run, send, world } from "./td/fixtures";
import { realDeck } from "./td/typing";

/**
 * Mộc Tinh (docs/td/BUILD_1B.md §4.4, §5): the day-5 warning and its branch, the lull, the escort and the rise at the
 * fork, the hit points by mode and k, "Vỏ dày", the moves and their warnings, the stagger with its "Dồn lửa" calls,
 * the summons, the blows on the Bastion, the retreat, the chest and the won stage.
 */
const BOSS_DEF = SLICE_1A.boss!;
const STAGE = SLICE_1A.stage!;
const HP = SLICE_1A.enemies.find((enemy) => enemy.id === BOSS_DEF.enemy)!.hp;
const T = (seconds: number) => ticks(seconds);
const sb = (op: string, value?: number) => ({ t: "sandbox" as const, op: (value === undefined ? { op } : { op, value }) as never });

type Strike = Extract<RareEvent, { t: "bossStrike" }>;
const strikes = (events: readonly RareEvent[], move: Strike["move"]): Strike[] => events.filter((e): e is Strike => e.t === "bossStrike" && e.move === move);

/** Steps until `done` holds (at most `limit` ticks); returns the rare events seen meanwhile. */
function until(w: World, done: () => boolean, limit = T(120)): RareEvent[] {
  const events: RareEvent[] = [];
  for (let k = 0; k < limit && !done(); k += 1) {
    const from = w.events.rare.length;
    step(w);
    events.push(...w.events.rare.slice(from));
  }
  if (!done()) throw new Error("not reached in " + limit + " ticks");
  return events;
}

/** The sandbox field with its preset, the boss called and risen; returns its slot. */
function risen(options: Parameters<typeof world>[0] = {}): { w: World; e: number } {
  const w = world({ gold: 5000, ...options });
  send(w, sb("preset"), sb("boss"));
  until(w, () => w.boss.stage === BOSS.fight);
  return { w, e: bossSlot(w) };
}

/** Puts the boss `dist` m along its route. */
function moveBoss(w: World, e: number, dist: number): void {
  const p = w.lanes[w.enemies.route[e]!]!.point(dist, 0, { x: 0, z: 0 });
  [w.enemies.dist[e], w.enemies.x[e], w.enemies.z[e]] = [dist, p.x, p.z];
}

describe("Mộc Tinh's peak (BUILD_1B §4.4)", () => {
  it("day 5 warns of it and names its branch from the spawn stream; night 5 holds after its first part", () => {
    const w = world({ sandbox: false });
    w.day = 5;
    const events = until(w, () => w.boss.stage === BOSS.warned, 2);
    expect(events.find((e) => e.t === "bossWarn")).toMatchObject({ day: 5, route: w.boss.route });
    expect([0, 1]).toContain(w.boss.route);
    // The same seed warns of the same branch.
    const again = world({ sandbox: false });
    again.day = 5;
    run(again, 2);
    expect(again.boss.route).toBe(w.boss.route);
    send(w, { t: "callNight" });
    expect(w.wave).toBe(1); // a fresh world: its first wave (the night's wave number is the test's, not the day's)
    // The wave dies: the night does not end, the lull begins (≤ 2 of it alive).
    for (const e of w.enemies.live()) w.enemies.hp[e] = 0;
    w.spawnQueue.length = 0;
    w.waveLeft[1] = 0;
    for (const e of w.enemies.live()) damageEnemy(w, e, 1, 2, SOURCE.tower);
    const lull = until(w, () => w.boss.stage === BOSS.lull, T(2));
    expect(w.phase).toBe("night");
    expect(lull.find((e) => e.t === "bossLull")).toMatchObject({ end: w.tick - 1 + T(STAGE.boss.lullS) });
  });

  it("the lull waits for ≤ 2 of the first part alive, or 30 s after its last spawn", () => {
    const w = world({ sandbox: false });
    w.day = 5;
    run(w, 2);
    send(w, { t: "callNight" });
    w.spawnQueue.length = 0;
    w.waveLeft[1] = 0;
    for (const k of [0, 1, 2]) enemyAt(w, "cuong-thi", k % 2, 1, 1);
    for (const e of w.enemies.live()) w.enemies.stunUntil[e] = 1e9; // they stand at the gate
    const start = w.tick;
    until(w, () => w.boss.stage === BOSS.lull, T(31));
    expect(w.tick - start).toBeGreaterThanOrEqual(T(STAGE.boss.lullWaitS));
  });

  it("the lull's clock holds while a heavy foe walks the roads' shared end, from the merge to the Bastion (test pass 27/10, row 8)", () => {
    const w = world({ gold: 5000 });
    send(w, sb("preset"), sb("boss"));
    const lane = w.lanes[w.boss.route]!;
    const shared = lane.length - w.boss.mergeM; // the merge (0, 12) to the Bastion: 37.3 m on map 1
    expect(shared).toBeGreaterThan(30);
    expect(shared).toBeLessThan(40);
    // A Thuồng Luồng still before the merge does not hold it; one past the merge, held still, does.
    const far = enemyAt(w, "thuong-luong", w.boss.route, w.boss.mergeM - 5);
    const near = enemyAt(w, "thuong-luong", w.boss.route, w.boss.mergeM + 2);
    for (const e of [far, near]) [w.enemies.stunUntil[e], w.enemies.hp[e]] = [1e9, 1e6]; // they stand and live
    const end = w.boss.lullEnd;
    run(w, T(20));
    expect(w.boss.stage).toBe(BOSS.lull);
    expect(w.boss.lullEnd - end).toBeGreaterThanOrEqual(T(20) - 1);
    expect(w.boss.lullEnd - w.tick).toBe(end - (w.tick - T(20))); // the countdown stood still
    damageEnemy(w, near, 1e7, 2, SOURCE.tower);
    const events = until(w, () => w.boss.stage === BOSS.emerge, T(STAGE.boss.lullS) + 3);
    expect(events.some((e) => e.t === "bossLull")).toBe(false);
    expect(w.enemies.slotOf(w.enemies.id(far))).toBe(far); // the far one still walks: it never held the clock
  });

  it("in the lull only power calls light; then two escort packs of 4 leave the rift, one a branch, and 6 s later it rises at the fork", () => {
    const w = world({ gold: 5000 });
    send(w, sb("preset"));
    const mine = w.buildings.live().find((b) => w.c.buildings[w.buildings.def[b]!]!.mine !== null)!;
    send(w, sb("boss"));
    expect(w.phase).toBe("night");
    w.buildings.pile[mine] = 1e6; // the mine calls
    run(w, 30);
    const C = w.calls;
    const mineCall = C.live().find((c) => C.kind[c] === CALL_KIND.mine)!;
    expect(mineCall).toBeDefined();
    expect(C.bright[mineCall]).toBe(0);
    until(w, () => w.boss.stage === BOSS.emerge);
    const escort = w.spawnQueue.filter((s) => s.enemy === w.c.enemyIndex("cuong-thi"));
    expect(escort.length).toBe(8);
    expect([0, 1].map((route) => escort.filter((s) => s.route === route).length)).toEqual([4, 4]);
    const events = until(w, () => w.boss.stage === BOSS.fight, T(7));
    const e = bossSlot(w);
    expect(events.find((ev) => ev.t === "bossEmerge")).toMatchObject({ route: w.boss.route, hp: HP });
    expect(w.enemies.dist[e]).toBeCloseTo(STAGE.boss.emergeM, 0);
    expect(w.enemies.route[e]).toBe(w.boss.route);
    expect(w.enemies.elite[e]).toBe(0);
  });

  it("its hit points: the enemy's × the mode's × its own mode factor × (1 + kHp·d + kHp2·max(0, d)²), d = k − 1, at most ×kHpMax (§5.6; 1B R1 review)", () => {
    const at = (mode: "relax" | "balanced" | "challenge" | "learn", k: number) => bossHp(world({ mode, pace: { k, director: false } }));
    const kMul = (k: number) => Math.min(BOSS_DEF.kHpMax, 1 + BOSS_DEF.kHp * (k - 1) + BOSS_DEF.kHp2 * Math.max(0, k - 1) * Math.max(0, k - 1));
    expect(at("balanced", 1)).toBe(HP);
    expect(at("balanced", 0.75)).toBe(Math.round(HP * kMul(0.75)));
    expect(at("balanced", 0.75)).toBeLessThan(HP);
    expect(at("balanced", 1.2)).toBe(Math.round(HP * kMul(1.2)));
    expect(at("balanced", 1.3)).toBe(Math.round(HP * kMul(1.3)));
    expect(at("balanced", 1.2) / at("balanced", 1.1)).toBeGreaterThan(at("balanced", 1.1) / at("balanced", 1)); // steeper above 1
    expect(at("balanced", 1.3)).toBe(Math.round(HP * BOSS_DEF.kHpMax)); // R2 (kHp2 6.5): the cap holds the fastest
    expect(kMul(1.3)).toBeLessThanOrEqual(BOSS_DEF.kHpMax);
    expect(at("relax", 1)).toBe(Math.round(HP * 0.5 * (BOSS_DEF.modeHp.relax ?? 1)));
    expect(at("learn", 1)).toBe(at("relax", 1));
    expect(at("challenge", 1)).toBe(Math.round(HP * 1.19 * (BOSS_DEF.modeHp.challenge ?? 1)));
  });
});

describe("Mộc Tinh in the fight (BUILD_1B §5.1–§5.4)", () => {
  it("is never blocked (soldiers fight it), never leaks, and stops 1.5 m short of the Bastion", () => {
    const { w, e } = risen();
    const before = w.enemies.dist[e]!;
    w.enemies.block[e] = 3; // as many soldiers as it weighs
    run(w, 60);
    expect(w.enemies.dist[e]!).toBeGreaterThan(before + 0.5);
    moveBoss(w, e, w.lanes[w.enemies.route[e]!]!.length - 2);
    run(w, T(5));
    expect(w.enemies.dist[e]).toBeCloseTo(w.lanes[w.enemies.route[e]!]!.length - BOSS_DEF.keep.stopM, 6);
    expect(w.enemies.used[e]).toBe(1);
    expect(w.stats[STAT.leaks]).toBe(0);
  });

  it("takes Draconis' own fireballs ×heroMul (\"Vỏ dày\"), burning ×1.25, every hit ×1.25 while staggered; its damage is counted by source", () => {
    const { w, e } = risen();
    const hp = () => w.enemies.hp[e]!;
    let before = hp();
    damageEnemy(w, e, 100, 1, SOURCE.hero); // magic: no resist
    const hero = Math.round(100 * BOSS_DEF.heroMul);
    expect(BOSS_DEF.heroMul).toBeLessThanOrEqual(0.5);
    expect(before - hp()).toBe(hero);
    before = hp();
    damageEnemy(w, e, 100, 0, SOURCE.tower); // physical: 30 % armour
    expect(before - hp()).toBe(70);
    w.boss.vulnUntil = w.tick + 10;
    before = hp();
    damageEnemy(w, e, 100, 2, SOURCE.wordShot);
    expect(before - hp()).toBe(125);
    w.boss.vulnUntil = -1;
    // Burning: 55/s ×1.25 for a second.
    w.enemies.burnUntil[e] = w.tick + 60;
    before = hp();
    w.enemies.stunUntil[e] = w.tick + 100;
    const kept = w.boss.staggerUntil;
    w.boss.staggerUntil = w.tick + 100; // no moves meanwhile
    for (let k = 0; k < 60; k += 1) step(w);
    w.boss.staggerUntil = kept;
    expect(before - hp()).toBeGreaterThanOrEqual(Math.floor(55 * 1.25) - 1);
    expect(w.stats[STAT.bossHero]).toBe(hero);
    expect(w.stats[STAT.bossTyped]).toBeGreaterThanOrEqual(125);
    expect(w.stats[STAT.bossDamage]).toBe(w.boss.hpMax - hp());
  });

  it("Rễ Trồi: buildings whose rim is within 8 m are warned 1.5 s, then stunned 3 s (no damage); stunned, a tower neither fires nor calls, its typed call still fires", () => {
    const { w, e } = risen();
    const B = w.buildings;
    const archer = B.live().find((b) => w.c.buildings[B.def[b]!]!.id === "archer")!; // the preset's, at the merge
    const far = built(w, "archer", -30, -40);
    moveBoss(w, e, w.boss.mergeM);
    w.enemies.stunUntil[e] = 1e9; // it stays here
    const warned = until(w, () => w.boss.rootsEnd >= 0, T(7));
    const warn = strikes(warned, "roots")[0]!;
    expect(warn).toMatchObject({ hit: false, end: w.boss.rootsEnd });
    expect(w.boss.rootsEnd - (w.tick - 1)).toBe(T(BOSS_DEF.roots.warnS));
    const ids = Array.from(w.boss.targets.subarray(0, w.boss.targetN));
    expect(ids).toContain(B.id(archer));
    expect(ids).not.toContain(B.id(far));
    expect(ids).toEqual([...ids].sort((p, q) => p - q));
    const hp = B.hp[archer];
    const hits = until(w, () => w.boss.rootsEnd < 0, T(2));
    expect(hits.filter((ev) => ev.t === "stun").length).toBe(ids.length);
    expect(B.stunUntil[archer]).toBe(w.tick - 1 + T(BOSS_DEF.roots.stunS));
    expect(B.hp[archer]).toBe(hp);
    // Stunned: no shot of its own, no new power call; a word typed on a call it had still fires its Word Shot.
    const had = new Set(w.calls.live().filter((c) => w.calls.b[c] === archer).map((c) => w.calls.id(c)));
    const cd = B.atkCd[archer];
    run(w, 30);
    expect(B.atkCd[archer]).toBe(cd);
    expect(w.calls.live().filter((c) => w.calls.b[c] === archer && !had.has(w.calls.id(c)))).toEqual([]);
    const shots = w.stats[STAT.wordShots]!;
    w.typing.shots.push({ b: archer, power: 50, crit: false, word: -1, burn: false, bolt: false, boss: false });
    step(w);
    expect(w.stats[STAT.wordShots]! + w.stats[STAT.fizzles]!).toBeGreaterThan(shots);
    expect(w.stats[STAT.rootsHits]).toBe(ids.length);
  });

  it("a stunned mine stops filling; a building 10 m off the road stays out of Rễ Trồi's reach (content: reach + an S footprint < Tháp Cung 2's range)", () => {
    const archer = SLICE_1A.buildings.find((b) => b.id === "archer")!;
    expect(BOSS_DEF.roots.radiusM + 2.0).toBeLessThan(archer.attack!.levels[1]!.rangeM);
    const { w } = risen();
    const B = w.buildings;
    const mine = B.live().find((b) => w.c.buildings[B.def[b]!]!.mine !== null)!;
    B.stunUntil[mine] = w.tick + 600;
    const [prod, pile] = [B.prod[mine], B.pile[mine]];
    run(w, 120);
    expect([B.prod[mine], B.pile[mine]]).toEqual([prod, pile]);
  });

  it("Quật cành: with a soldier within 3 m of its rim it warns 1.2 s, then hits the soldiers in the 120° in front (40–60, through armour) and knocks them 1.5 m back", () => {
    const { w, e } = risen();
    const U = w.units;
    const E = w.enemies;
    w.enemies.stunUntil[e] = 1e9;
    w.boss.rootsAt = 1e9;
    const [front, behind] = U.live().slice(0, 2) as [number, number];
    for (const s of U.live()) U.hp[s] = s === front || s === behind ? 60 : 0;
    // Hold the soldiers still: no barracks flag pulls them while we look.
    const place = () => {
      [U.x[front], U.z[front]] = [E.x[e]! + 4, E.z[e]!];
      [U.x[behind], U.z[behind]] = [E.x[e]! - 4, E.z[e]!];
    };
    place();
    w.boss.slamAt = w.tick;
    const warn = strikes(until(w, () => w.boss.slamEnd >= 0, 3), "slam")[0]!;
    expect(warn.end - (w.tick - 1)).toBe(T(BOSS_DEF.slam.warnS));
    expect(w.boss.slamX).toBeGreaterThan(0.9);
    while (w.tick < w.boss.slamEnd) {
      place();
      step(w);
    }
    place();
    const [fx, bx] = [U.x[front]!, U.x[behind]!];
    step(w);
    expect(60 - U.hp[front]!).toBeGreaterThanOrEqual(40 * 0.9 - 1);
    expect(60 - U.hp[front]!).toBeLessThanOrEqual(60);
    expect(U.x[front]! - fx).toBeGreaterThan(1);
    expect(U.hp[behind]).toBe(60);
    expect(U.x[behind]).not.toBeLessThan(bx - 0.2);
  });

  it("at 70 % it staggers 5 s: still, vulnerable, every stun lifted, 'Dồn lửa' power calls of round(E / 20) words (1–3) on the nearest attack buildings in reach + 2 m, at most the bright cap, lit in a help ring or not (1B R1 review)", () => {
    const { w, e } = risen();
    const B = w.buildings;
    moveBoss(w, e, w.boss.mergeM);
    // Draconis far away: no help ring holds the merge's towers.
    w.agents.x[0] = -40;
    w.agents.z[0] = -40;
    for (const b of B.live()) B.stunUntil[b] = w.tick + 600;
    for (const c of w.calls.live()) if (w.calls.kind[c] === CALL_KIND.power) w.calls.release(c);
    for (const b of B.live()) B.call[b] = -1;
    w.enemies.hp[e] = Math.floor(w.boss.hpMax * 0.7);
    const events = until(w, () => w.boss.phase === 2, 2);
    expect(events.find((ev) => ev.t === "bossPhase")).toMatchObject({ phase: 2 });
    expect(w.boss.staggerUntil - (w.tick - 1)).toBe(T(BOSS_DEF.stagger.stunS));
    expect(B.live().every((b) => B.stunUntil[b]! <= w.tick)).toBe(true);
    const burst = w.calls.live().filter((c) => w.calls.burst[c] === 1);
    expect(burst.length).toBeGreaterThan(1);
    expect(burst.length).toBeLessThanOrEqual(MODES.balanced.open);
    const words = Math.max(1, Math.min(BOSS_DEF.stagger.burstWords, Math.round(w.expected / BOSS_DEF.stagger.burstPerE)));
    expect(words).toBe(2); // E 35
    for (const c of burst) {
      expect(w.calls.kind[c]).toBe(CALL_KIND.power);
      expect(w.calls.words[c]).toBe(words);
      expect(w.calls.expire[c]! - w.calls.born[c]!).toBe(T(BOSS_DEF.stagger.burstLifeS));
      expect(w.calls.bright[c], "lit without a help ring").toBe(1);
    }
    expect(w.stats[STAT.burstWords]).toBe(words * burst.length);
    const dist = w.enemies.dist[e];
    run(w, T(4));
    expect(w.enemies.dist[e]).toBe(dist);
    const before = w.enemies.hp[e]!;
    damageEnemy(w, e, 100, 2, SOURCE.tower);
    expect(before - w.enemies.hp[e]!).toBe(125);
  });

  it("a power call already open on a building in reach becomes its Dồn lửa call: more words, a fresh 5 s, aimed at the boss (1B R1 review)", () => {
    const { w, e } = risen();
    const B = w.buildings;
    moveBoss(w, e, w.boss.mergeM);
    const C = w.calls;
    run(w, T(1));
    const open = C.live().filter((c) => C.kind[c] === CALL_KIND.power && C.burst[c] === 0);
    expect(open.length).toBeGreaterThan(0);
    const c = open[0]!;
    C.expire[c] = w.tick + 30;
    w.enemies.hp[e] = Math.floor(w.boss.hpMax * 0.7);
    until(w, () => w.boss.phase === 2, 2);
    expect(C.used[c]).toBe(1);
    expect(C.burst[c]).toBe(1);
    expect(C.words[c]).toBe(2);
    expect(C.expire[c]! - (w.tick - 1)).toBe(T(BOSS_DEF.stagger.burstLifeS));
    expect(B.call[C.b[c]!]).toBe(c);
  });

  it("a power word typed t s after it showed brings its tower's next call to cd·(1 − quick·max(0, 1 − t / quickS)) after it when that is sooner (1B R1 review)", () => {
    const { w, e } = risen({ deck: realDeck() });
    moveBoss(w, e, w.boss.mergeM);
    w.enemies.hp[e] = Math.floor(w.boss.hpMax * 0.7); // the stagger's calls light anywhere
    until(w, () => w.calls.live().some((c) => w.calls.kind[c] === CALL_KIND.power && w.calls.word[c]! >= 0), 3);
    const c = w.calls.live().find((k) => w.calls.kind[k] === CALL_KIND.power && w.calls.word[k]! >= 0)!;
    const b = w.calls.b[c]!;
    const made = w.buildings.powerAt[b]!;
    const s = w.calls.word[c]!;
    const born = w.words.born[s]!;
    const { deck } = w.typing;
    const word = w.words.word[s]!;
    for (let k = 0; k < deck.len[word]!; k += 1) send(w, { t: "key", letter: deck.letters[deck.start[word]! + k]!, atMs: w.tick * 16 + k });
    const hit = w.events.rare.find((ev) => ev.t === "wordHit") as Extract<RareEvent, { t: "wordHit" }>;
    const soon = Math.max(0, 1 - (hit.tick - born) / T(POWER.quickS));
    const cd = T(MODES.balanced.powerCdS);
    expect(soon).toBeGreaterThan(0);
    expect(w.buildings.powerAt[b]).toBe(Math.min(made, hit.tick - Math.round(cd * POWER.quick * soon)));
    expect(w.buildings.powerAt[b]).toBeLessThan(made);
  });

  it("a hit stops at 70 % in phase 1 and above 50 % till phase 2's first Mầm Gỗ sprout, so phase 2 always plays (test pass 27/10, row 26)", () => {
    const { w, e } = risen();
    const spec = BOSS_DEF;
    expect(damageEnemy(w, e, w.boss.hpMax * 0.6, 2, SOURCE.wordShot)).toBe(w.boss.hpMax - Math.floor(w.boss.hpMax * 0.7));
    expect(w.enemies.hp[e]).toBe(Math.floor(w.boss.hpMax * 0.7));
    const events = until(w, () => w.boss.phase === 2, 2);
    expect(events.some((ev) => ev.t === "bossPhase")).toBe(true);
    // The stagger's burst and every hit after it stop above the retreat's line: no retreat while stunned, nor before the sprout.
    const line = Math.floor(w.boss.hpMax * 0.5) + 1;
    const sproutAt = w.boss.staggerUntil + T(spec.summon.firstS) + T(spec.summon.warnS);
    const flash = w.events.ring.written;
    const seen: RareEvent[] = [];
    // The sprout's own tick too: the shots land before the boss steps (lane A1: 2–6 of 32–35 retreats a bot skipped it so).
    while (w.tick <= sproutAt) {
      damageEnemy(w, e, w.boss.hpMax, 2, SOURCE.wordShot);
      const from = w.events.rare.length;
      step(w);
      seen.push(...w.events.rare.slice(from));
    }
    expect(strikes(seen, "summon").some((ev) => ev.hit)).toBe(true);
    expect(w.enemies.hp[e]).toBe(line);
    expect(w.boss.stage).toBe(BOSS.fight);
    let hits = 0; // no "0" floats over it
    for (let i = flash; i < w.events.ring.written; i += 1) if (w.events.ring.kind[i % w.events.ring.size] === FX.bossHit) hits += 1;
    expect(hits).toBe(1);
    damageEnemy(w, e, 10, 2, SOURCE.wordShot);
    until(w, () => w.boss.stage === BOSS.retreat, 2);
  });

  it("in phase 2 four Mầm Gỗ sprout at its feet 3 s after the stagger ends (0.8 s warned), then every 15 s, walking its road", () => {
    const { w, e } = risen();
    w.enemies.hp[e] = Math.floor(w.boss.hpMax * 0.69);
    until(w, () => w.boss.phase === 2, 2);
    const staggerEnd = w.boss.staggerUntil;
    const warned = until(w, () => w.boss.summonEnd >= 0, T(10));
    const warnedAt = w.tick - 1;
    expect(warnedAt).toBe(staggerEnd + T(BOSS_DEF.summon.firstS));
    expect(strikes(warned, "summon")[0]).toMatchObject({ hit: false, count: 4 });
    const sprout = w.c.enemyIndex("mam-go");
    until(w, () => w.boss.summonEnd < 0, T(1));
    const sprouts = w.enemies.live().filter((s) => w.enemies.def[s] === sprout);
    expect(sprouts.length).toBe(4);
    for (const s of sprouts) {
      expect(w.enemies.route[s]).toBe(w.enemies.route[e]);
      expect(w.enemies.elite[s]).toBe(0);
    }
    expect(w.boss.summonAt).toBe(warnedAt + T(BOSS_DEF.summon.everyS));
  });

  it("at the Bastion it strikes 3 lives a blow after a 1.2 s warning, and the Bastion falls", () => {
    const { w, e } = risen();
    w.lives = 7;
    moveBoss(w, e, w.lanes[w.enemies.route[e]!]!.length - BOSS_DEF.keep.stopM);
    const events = until(w, () => w.phase === "defeat", T(20));
    const keep = strikes(events, "keep");
    const warns = keep.filter((ev) => !ev.hit);
    const blows = keep.filter((ev) => ev.hit);
    expect(blows.length).toBe(3);
    for (const [k, blow] of blows.entries()) expect(blow.tick - warns[k]!.tick).toBe(T(BOSS_DEF.keep.warnS));
    expect(w.lives).toBe(0);
    expect(w.stats[STAT.livesBoss]).toBe(7);
  });

  it("Rễ hút sinh khí (R3): from its rise every 30 s wherever it stands, warned 1.2 s × the mode's warnK, then −1 life counted at the peak; the stagger starts its clock again", () => {
    const { w, e } = risen();
    const every = T(BOSS_DEF.drain.everyS);
    const rose = w.boss.drainAt - every;
    // Held far from the Bastion and never staggered: only the drain takes lives.
    [w.enemies.stunUntil[e], w.enemies.hp[e], w.lives] = [1e9, w.boss.hpMax * 10, 20];
    const events = until(w, () => w.lives === 18, 2 * every + T(5));
    const drain = strikes(events, "drain");
    expect(BOSS_DEF.drain).toMatchObject({ lives: 1, everyS: 30, warnS: 1.2 });
    expect(drain.filter((ev) => !ev.hit).map((ev) => ev.tick - rose)).toEqual([every, 2 * every]);
    expect(drain.filter((ev) => ev.hit).map((ev) => [ev.tick - rose, ev.count])).toEqual([[every + T(1.2), 1], [2 * every + T(1.2), 1]]);
    expect(strikes(events, "keep").length).toBe(0);
    expect(w.stats[STAT.livesBoss]).toBe(2);
    w.enemies.hp[e] = Math.floor(w.boss.hpMax * 0.69);
    until(w, () => w.boss.phase === 2, 2);
    expect([w.boss.drainAt, w.boss.drainEnd]).toEqual([w.boss.staggerUntil + T(BOSS_DEF.drain.everyS), -1]);
    const relax = risen({ mode: "relax" }).w;
    until(relax, () => relax.boss.drainEnd >= 0, every + T(1));
    expect(relax.boss.drainEnd - (relax.tick - 1)).toBe(T(BOSS_DEF.drain.warnS * MODES.relax.warnK));
  });

  it("at 50 % it retreats: the chest's 150 gold at once (once), 2 s of sinking untouched, then every enemy left melts (no gold, no leak) and the stage is won", () => {
    const { w, e } = risen();
    const kills = w.stats[STAT.kills]!;
    const gold = w.gold;
    w.enemies.hp[e] = Math.floor(w.boss.hpMax * 0.5);
    w.boss.phase = 2;
    const retreat = until(w, () => w.boss.stage === BOSS.retreat, 2);
    expect(retreat.find((ev) => ev.t === "bossRetreat")).toMatchObject({ gold: 150 });
    expect(w.stats[STAT.goldChest]).toBe(150_000);
    expect(w.gold - gold).toBeGreaterThanOrEqual(150_000);
    expect(damageEnemy(w, e, 1000, 2, SOURCE.wordShot)).toBe(0);
    const end = until(w, () => w.phase === "victory", T(3));
    expect(end.filter((ev) => ev.t === "victory").length).toBe(1);
    expect(w.enemies.count).toBe(0);
    expect(w.stats[STAT.kills]).toBe(kills);
    expect(w.stats[STAT.goldChest]).toBe(150_000);
    expect(w.stats[STAT.bossRetreats]).toBe(1);
    // The run is over: nothing moves.
    const tick = w.tick;
    const hp = w.gold;
    run(w, 60);
    expect([w.tick, w.gold, w.phase]).toEqual([tick + 60, hp, "victory"]);
  });

  it("the pace director stands still from the lull, and no elite comes in the peak", () => {
    const w = world({ gold: 5000, pace: { k: 1, director: true } });
    send(w, sb("preset"), sb("boss"));
    w.pace.elite = 3;
    const events = until(w, () => w.boss.stage === BOSS.fight, T(20));
    run(w, T(30));
    expect(events.filter((ev) => ev.t === "pace").length).toBe(0);
    expect(w.enemies.live().every((e) => w.enemies.elite[e] === 0)).toBe(true);
  });

  it("every move is warned for the mode's time before it lands (G4): relax and learn ×1.33, challenge ×0.8", () => {
    for (const mode of ["relax", "challenge"] as const) {
      const { w, e } = risen({ mode });
      moveBoss(w, e, w.boss.mergeM);
      w.enemies.stunUntil[e] = 1e9;
      until(w, () => w.boss.rootsEnd >= 0, T(7));
      expect(w.boss.rootsEnd - (w.tick - 1)).toBe(T(BOSS_DEF.roots.warnS * MODES[mode].warnK));
    }
  });

  it("the sandbox may call it once; the story may not (noSandbox)", () => {
    const w = world();
    expect(send(w, sb("boss")).some((ev) => ev.t === "rejected")).toBe(false);
    expect(send(w, sb("boss")).find((ev) => ev.t === "rejected")).toMatchObject({ reason: "bossBusy" });
    expect(send(world({ sandbox: false }), sb("boss")).find((ev) => ev.t === "rejected")).toMatchObject({ reason: "noSandbox" });
  });
});
