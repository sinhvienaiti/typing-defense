import { describe, expect, it } from "vitest";
import { CAP, STORE } from "../src/content/rules";
import { hashHex } from "../src/sim/hash";
import { STAT } from "../src/sim/stats";
import { BOSS } from "../src/sim/stores/boss";
import { NPC_KIND } from "../src/sim/stores/npcs";
import { createWorld, runLog } from "../src/sim/world";
import { send, world } from "./td/fixtures";
import { fullWorld, loadedWorld, stepCost } from "./td/perf";
import { realDeck } from "./td/typing";

/**
 * One simulation step under load (BUILD_NOW §6.1, §7 gate 5; BUILD_1A6 §12
 * gate 3: ≤ 0.5 ms on the owner's machine, ≤ 2 ms on CI): 300 enemies, 9
 * soldiers, 200 shots in flight, 10 buildings and 4 farms, 9 villagers, 20
 * marked trees, calls bright on the real vocabulary, at night; then TK
 * 25.12's full load (640 enemies, 64 soldiers, 512 shots, 20 buildings; the
 * 1A caps lifted), held to the same CI bound. The medians are printed.
 */
describe("simulation step cost", () => {
  it("steps 300 enemies, 9 soldiers, 200 shots, 10 buildings, 4 farms, 9 villagers and 20 trees in ≤ 2 ms", () => {
    const w = loadedWorld(300, 200);
    expect(w.enemies.count).toBe(300);
    expect([w.npcs.live().filter((n) => w.npcs.kind[n] === NPC_KIND.villager).length, w.npcs.live().filter((n) => w.npcs.kind[n] === NPC_KIND.farmer).length]).toEqual([9, 4]);
    const cost = stepCost(w, 300, 100);
    expect(w.projectiles.count).toBeGreaterThanOrEqual(200);
    expect(w.stats[STAT.blocks]).toBeGreaterThan(0);
    expect(cost.calls).toBeGreaterThan(5); // chops, farm work and power calls made under load
    console.log("td sim step (300 enemies): median " + cost.median.toFixed(3) + " ms, p95 " + cost.p95.toFixed(3) + " ms");
    expect(cost.median).toBeLessThanOrEqual(2);
  });

  it("steps TK 25.12's full load (640 enemies, 64 soldiers, 512 shots, 20 buildings) in ≤ 2 ms", () => {
    const w = fullWorld();
    expect(w.enemies.count).toBe(STORE.enemies);
    expect(w.projectiles.count).toBe(STORE.projectiles);
    expect(w.buildings.live(1).length).toBe(20);
    expect(w.units.count).toBe(CAP.soldiers);
    expect(w.units.live().every((s) => w.units.hp[s]! > 0)).toBe(true);
    const cost = stepCost(w, 300, 100);
    expect(w.units.count).toBe(CAP.soldiers);
    expect(w.stats[STAT.blocks]).toBeGreaterThan(0);
    console.log("td sim step (640 enemies, 64 soldiers, 512 shots, 20 buildings): median " + cost.median.toFixed(3) + " ms, p95 " + cost.p95.toFixed(3) + " ms");
    expect(cost.median).toBeLessThanOrEqual(2);
  });

  it("steps Mộc Tinh's peak under a flood of 300 (its Mầm Gỗ among them) with Tối Thượng's rain falling (BUILD_1B §20) in ≤ 2 ms", () => {
    const w = world({ gold: 5000, deck: realDeck() });
    send(w, { t: "sandbox", op: { op: "preset" } }, { t: "sandbox", op: { op: "boss" } }, { t: "move", agent: 0, qx: 4 * 4, qz: -22 * 4 });
    for (let k = 0; k < 60 * 60 && w.boss.stage !== BOSS.fight; k += 1) send(w);
    send(w, { t: "sandbox", op: { op: "flood", value: 300 } }, { t: "sandbox", op: { op: "ult" } });
    expect(send(w, { t: "ult", qx: Math.round(w.agents.x[0]! * 4), qz: Math.round(w.agents.z[0]! * 4) }).some((e) => e.t === "ult")).toBe(true);
    const cost = stepCost(w, 300, 0);
    expect([w.boss.stage, w.stats[STAT.ultFeathers]! >= 12, w.enemies.count >= 250]).toEqual([BOSS.fight, true, true]);
    console.log("td sim step (boss, 300 flooded, Tối Thượng): median " + cost.median.toFixed(3) + " ms, p95 " + cost.p95.toFixed(3) + " ms");
    expect(cost.median).toBeLessThanOrEqual(2);
  });

  it("floods the routes on the sandbox's logged command (TK 25.12 __td.flood): kinds in turn on each route's first half, in the wave, replayed alike", () => {
    const w = world();
    const refused = [0, STORE.enemies + 1, 2.5].flatMap((value) => send(w, { t: "sandbox", op: { op: "flood", value } }));
    expect(refused.map((event) => (event.t === "rejected" ? event.reason : event.t))).toEqual(["badValue", "badValue", "badValue"]);
    expect(send(world({ sandbox: false }), { t: "sandbox", op: { op: "flood", value: 10 } }).map((event) => (event.t === "rejected" ? event.reason : ""))).toEqual(["noSandbox"]);
    const log = [{ t: "sandbox", op: { op: "flood", value: 300 } }] as const;
    send(w, ...log);
    expect(w.enemies.count).toBe(300);
    expect(w.waveAlive[0]).toBe(300);
    const E = w.enemies;
    const kinds = [0, 0, 0, 0, 0, 0, 0, 0];
    for (const e of E.live()) {
      kinds[E.def[e]!] = kinds[E.def[e]!]! + 1;
      const lane = w.lanes[E.route[e]!]!;
      expect(E.route[e] === w.lanes.length - 1).toBe(E.altitude[e]! > 0);
      expect(E.dist[e]).toBeGreaterThan(0);
      expect(E.dist[e]).toBeLessThanOrEqual(lane.length / 2 + 0.1);
    }
    expect(kinds, "every kind but the boss (BUILD_1B §19 td-1b-perf; R2's Tanuki, Nuppeppō and its halves)").toEqual([43, 43, 43, 0, 43, 43, 43, 42]);
    const again = createWorld({ seed: 1 });
    runLog(again, [{ t: "sandbox", op: { op: "flood", value: 0 }, tick: 0 }, { t: "sandbox", op: { op: "flood", value: STORE.enemies + 1 }, tick: 0 }, { t: "sandbox", op: { op: "flood", value: 2.5 }, tick: 0 }, { ...log[0], tick: 3 }], w.tick + 120);
    for (let k = 0; k < 120; k += 1) send(w);
    expect(hashHex(again)).toBe(hashHex(w));
  });
});
