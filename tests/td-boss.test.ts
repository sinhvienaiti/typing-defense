import { describe, expect, it } from "vitest";
import { ticks } from "../src/content/compile";
import { MODES } from "../src/content/rules";
import { SLICE_1A } from "../src/content/slice-1a";
import type { RareEvent } from "../src/sim/events";
import { STAT } from "../src/sim/stats";
import { BOSS } from "../src/sim/stores/boss";
import { CALL_KIND } from "../src/sim/stores/calls";
import { bossHp, bossSlot } from "../src/sim/systems/boss";
import { damageEnemy } from "../src/sim/systems/combat";
import { SOURCE } from "../src/sim/stats";
import { step, type World } from "../src/sim/world";
import { built, enemyAt, run, send, world } from "./td/fixtures";

/**
 * Mộc Tinh (docs/td/BUILD_1B.md §4.4, §5): the day-5 warning and its branch, the lull, the escort and the rise at the
 * fork, the hit points by mode and k, "Vỏ dày", the moves and their warnings, the stagger with its "Dồn lửa" calls,
 * the summons, the blows on the Bastion, the retreat, the chest and the won stage.
 */
const BOSS_DEF = SLICE_1A.boss!;
const STAGE = SLICE_1A.stage!;
const T = (seconds: number) => ticks(seconds);
const sb = (op: string, value?: number) => ({ t: "sandbox" as const, op: (value === undefined ? { op } : { op, value }) as never });

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
    expect(events.find((ev) => ev.t === "bossEmerge")).toMatchObject({ route: w.boss.route, hp: 3200 });
    expect(w.enemies.dist[e]).toBeCloseTo(STAGE.boss.emergeM, 0);
    expect(w.enemies.route[e]).toBe(w.boss.route);
    expect(w.enemies.elite[e]).toBe(0);
  });

  it("its hit points: 3,200 × the mode's × (1 + 0.4·max(0, k − 1)), at most ×1.12 (§5.6)", () => {
    const at = (mode: "relax" | "balanced" | "challenge", k: number) => bossHp(world({ mode, pace: { k, director: false } }));
    expect(at("balanced", 1)).toBe(3200);
    expect(at("balanced", 0.75)).toBe(3200);
    expect(at("balanced", 1.2)).toBe(Math.round(3200 * 1.08));
    expect(at("balanced", 1.3)).toBe(Math.round(3200 * 1.12));
    expect(at("relax", 1)).toBe(1600);
    expect(at("challenge", 1)).toBe(Math.round(3200 * 1.19));
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

  it("takes Draconis' own fireballs ×0.5, burning ×1.25, every hit ×1.25 while staggered; its damage is counted by source", () => {
    const { w, e } = risen();
    const hp = () => w.enemies.hp[e]!;
    let before = hp();
    damageEnemy(w, e, 100, 1, SOURCE.hero); // magic: no resist
    expect(before - hp()).toBe(50);
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
    expect(w.stats[STAT.bossHero]).toBe(50);
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
    const warn = warned.find((ev) => ev.t === "bossStrike" && ev.move === "roots")!;
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
    const warn = until(w, () => w.boss.slamEnd >= 0, 3).find((ev) => ev.t === "bossStrike" && ev.move === "slam")!;
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

  it("at 70 % it staggers 5 s: still, vulnerable, every stun lifted, a 1-word 'Dồn lửa' power call on the nearest attack buildings in a help ring, at most the bright cap", () => {
    const { w, e } = risen();
    const B = w.buildings;
    moveBoss(w, e, w.boss.mergeM);
    // Draconis by the merge: the archer, the cannon and the Bastion... in his ring.
    w.agents.x[0] = 0;
    w.agents.z[0] = 14;
    for (const b of B.live()) B.stunUntil[b] = w.tick + 600;
    for (const c of w.calls.live()) if (w.calls.kind[c] === CALL_KIND.power) w.calls.release(c);
    for (const b of B.live()) B.call[b] = -1;
    w.enemies.hp[e] = Math.floor(w.boss.hpMax * 0.7);
    const events = until(w, () => w.boss.phase === 2, 2);
    expect(events.find((ev) => ev.t === "bossPhase")).toMatchObject({ phase: 2 });
    expect(w.boss.staggerUntil - (w.tick - 1)).toBe(T(BOSS_DEF.stagger.stunS));
    expect(B.live().every((b) => B.stunUntil[b]! <= w.tick)).toBe(true);
    const burst = w.calls.live().filter((c) => w.calls.burst[c] === 1);
    expect(burst.length).toBeGreaterThan(0);
    expect(burst.length).toBeLessThanOrEqual(MODES.balanced.open);
    for (const c of burst) {
      expect(w.calls.kind[c]).toBe(CALL_KIND.power);
      expect(w.calls.words[c]).toBe(1);
      expect(w.calls.expire[c]! - w.calls.born[c]!).toBe(T(BOSS_DEF.stagger.burstLifeS));
    }
    const dist = w.enemies.dist[e];
    run(w, T(4));
    expect(w.enemies.dist[e]).toBe(dist);
    const before = w.enemies.hp[e]!;
    damageEnemy(w, e, 100, 2, SOURCE.tower);
    expect(before - w.enemies.hp[e]!).toBe(125);
  });

  it("one blow past 70 % and 50 % alike retreats at once, without the stagger", () => {
    const { w, e } = risen();
    damageEnemy(w, e, w.boss.hpMax * 0.6, 2, SOURCE.wordShot);
    const events = until(w, () => w.boss.stage === BOSS.retreat, 2);
    expect(events.some((ev) => ev.t === "bossPhase")).toBe(false);
    expect(w.calls.live().some((c) => w.calls.burst[c] === 1)).toBe(false);
  });

  it("in phase 2 four Mầm Gỗ sprout at its feet 3 s after the stagger ends (0.8 s warned), then every 15 s, walking its road", () => {
    const { w, e } = risen();
    w.enemies.hp[e] = Math.floor(w.boss.hpMax * 0.69);
    until(w, () => w.boss.phase === 2, 2);
    const staggerEnd = w.boss.staggerUntil;
    const warned = until(w, () => w.boss.summonEnd >= 0, T(10));
    const warnedAt = w.tick - 1;
    expect(warnedAt).toBe(staggerEnd + T(BOSS_DEF.summon.firstS));
    expect(warned.find((ev) => ev.t === "bossStrike" && ev.move === "summon")).toMatchObject({ hit: false, count: 4 });
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
    const strikes = events.filter((ev) => ev.t === "bossStrike" && ev.move === "keep");
    const warns = strikes.filter((ev) => !ev.hit);
    const blows = strikes.filter((ev) => ev.hit);
    expect(blows.length).toBe(3);
    for (const [k, blow] of blows.entries()) expect(blow.tick - warns[k]!.tick).toBe(T(BOSS_DEF.keep.warnS));
    expect(w.lives).toBe(0);
    expect(w.stats[STAT.livesBoss]).toBe(7);
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
