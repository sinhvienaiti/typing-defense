import { describe, expect, it } from "vitest";
import { ticks } from "../src/content/compile";
import { SLICE_1A } from "../src/content/slice-1a";
import type { Command, CommandBody } from "../src/sim/commands";
import { hashHex } from "../src/sim/hash";
import { NPC_KIND } from "../src/sim/stores/npcs";
import { slotsOpen } from "../src/sim/systems/agents";
import { countNpcs } from "../src/sim/systems/economy";
import { createWorld, runLog, step, type World } from "../src/sim/world";
import { build, def, q, ready, run, send, world } from "./td/fixtures";

/**
 * The story stage (docs/td/BUILD_1B.md §4, §7, §12): what opens on which day, the Bastion raised with gold through its
 * builders, a sale at 60 % (an undo within 5 s in full), money never made by any of it (G7), the day starts a
 * "Chơi lại Ngày n" replays to, and the sandbox's skipTo.
 */
const T = (seconds: number) => ticks(seconds);
/** The Bastion's id (slot 0, its first generation). */
const KEEP = 1024;
const reason = (events: ReturnType<typeof send>) => events.find((event) => event.t === "rejected")?.reason ?? null;

/** Steps until the Bastion's upgrade is done (the builders walk there and put in its time). */
function untilLevel(w: World, level: number, limit = T(60)): void {
  for (let k = 0; k < limit && w.buildings.level[0]! < level; k += 1) step(w);
  if (w.buildings.level[0]! < level) throw new Error("the Bastion is still at level " + w.buildings.level[0]);
}

describe("the story's unlock days (BUILD_1B §12)", () => {
  it("Trại Lính opens on day 2; Mỏ, Tháp Pháo and the Bastion's level 2 on day 3; upgrades on day 4; level 3 on day 5; the sandbox opens all", () => {
    expect(SLICE_1A.stage!.unlock).toEqual({ barracks: 2, "gold-mine": 3, cannon: 3, keep2: 3, upgrade: 4, keep3: 5 });
    const w = world({ sandbox: false, gold: 5000 });
    expect(reason(send(w, { t: "build", def: def(w, "barracks"), qx: q(3), qz: q(18) }))).toBe("locked");
    expect(reason(send(w, { t: "build", def: def(w, "cannon"), qx: q(7), qz: q(12) }))).toBe("locked");
    expect(reason(send(w, { t: "upgrade", building: KEEP }))).toBe("locked");
    const archer = build(w, "archer", -8, 12);
    ready(w);
    expect(reason(send(w, { t: "upgrade", building: w.buildings.id(archer) }))).toBe("locked");
    w.day = 2;
    expect(reason(send(w, { t: "build", def: def(w, "barracks"), qx: q(3), qz: q(18) }))).toBeNull();
    w.day = 4;
    expect(reason(send(w, { t: "upgrade", building: w.buildings.id(archer) }))).toBeNull();
    const sandbox = world({ gold: 5000 });
    expect(reason(send(sandbox, { t: "build", def: def(sandbox, "barracks"), qx: q(3), qz: q(18) }))).toBeNull();
  });
});

describe("the Bastion raised with gold (BUILD_1B §7)", () => {
  it("level 2 for 105 gold and 45 wood through its builder (13.5 s, a 3-word call), then a helper and a builder more; level 3 opens on day 5; the story stops at 3", () => {
    const w = world({ sandbox: false, gold: 1000 });
    w.day = 3;
    const [gold, wood] = [w.gold, w.wood];
    expect(reason(send(w, { t: "upgrade", building: KEEP }))).toBeNull();
    expect([gold - w.gold, wood - w.wood]).toEqual([105_000, 45]);
    expect([w.buildings.level[0], w.buildings.upTo[0], slotsOpen(w)]).toEqual([1, 2, 1]);
    const start = w.tick;
    untilLevel(w, 2);
    expect(w.tick - start).toBeGreaterThanOrEqual(T(18 * 0.75));
    expect([slotsOpen(w), countNpcs(w, NPC_KIND.builder)]).toEqual([2, 2]);
    expect(reason(send(w, { t: "upgrade", building: KEEP }))).toBe("locked");
    w.day = 5;
    expect(reason(send(w, { t: "upgrade", building: KEEP }))).toBeNull();
    untilLevel(w, 3);
    expect(reason(send(w, { t: "upgrade", building: KEEP }))).toBe("keepMax");
    // The sandbox may go on to level 4 (280 gold, 120 wood); the Bastion is never sold.
    const sb = world({ gold: 2000 });
    send(sb, { t: "sandbox", op: { op: "keepLevel", value: 3 } });
    expect(reason(send(sb, { t: "upgrade", building: KEEP }))).toBeNull();
    untilLevel(sb, 4);
    expect(reason(send(sb, { t: "sell", building: KEEP }))).toBe("noBuilding");
  });
});

describe("selling (BUILD_1B §7, TK 11.12)", () => {
  it("a finished building past 5 s sells for 60 % of everything it cost, rounded down; a site past 5 s may not go", () => {
    const w = world({ gold: 2000 });
    const cannon = build(w, "cannon", 7, 12);
    ready(w);
    run(w, T(6));
    expect(reason(send(w, { t: "upgrade", building: w.buildings.id(cannon) }))).toBeNull();
    run(w, T(6)); // the upgrade under way counts too
    const spent = [w.buildings.spentGold[cannon]!, w.buildings.spentWood[cannon]!];
    expect(spent).toEqual([161, 69]);
    const [gold, wood] = [w.gold, w.wood];
    const sold = send(w, { t: "sell", building: w.buildings.id(cannon) }).find((event) => event.t === "sold");
    expect(sold).toMatchObject({ gold: Math.floor(161 * 0.6), wood: Math.floor(69 * 0.6), undo: false });
    expect([w.gold - gold, w.wood - wood, w.buildings.used[cannon]]).toEqual([96_000, 41, 0]);
    const site = build(w, "archer", -8, 12);
    run(w, T(5) + 2);
    expect(reason(send(w, { t: "sell", building: w.buildings.id(site) }))).toBe("undoWindow");
  });
});

describe("Chơi lại Ngày n (BUILD_1B §4.3)", () => {
  it("records the tick each day's world stands at; the log replayed to it reaches the same hash", () => {
    const w = createWorld({ seed: 7, sandbox: false });
    const log: Command[] = [];
    const hashes: string[] = [];
    const go = (body?: CommandBody) => {
      const commands = body === undefined ? [] : [{ ...body, tick: w.tick } as Command];
      log.push(...commands);
      step(w, commands);
      if (w.dayStarts[w.day] === w.tick) hashes[w.day] = hashHex(w);
    };
    go({ t: "build", def: def(w, "archer"), qx: q(-8), qz: q(12) });
    while (w.day < 3 && w.phase !== "defeat") go(w.phase === "day" && w.tick % 600 === 1 ? { t: "callNight" } : undefined);
    expect(w.day).toBe(3);
    for (const day of [2, 3]) {
      const again = createWorld({ seed: 7, sandbox: false });
      runLog(again, log.filter((command) => command.tick < w.dayStarts[day]!), w.dayStarts[day]!);
      expect([again.day, again.phase, hashHex(again)]).toEqual([day, "day", hashes[day]]);
    }
  });

  it("the sandbox's skipTo goes to day n, the nights before it held without pay; a step back is refused", () => {
    const w = world();
    send(w, { t: "sandbox", op: { op: "night" } });
    run(w, T(3));
    const gold = w.gold;
    expect(reason(send(w, { t: "sandbox", op: { op: "skipTo", value: 5 } }))).toBeNull();
    expect([w.day, w.phase, w.wave, w.enemies.count, w.spawnQueue.length, w.gold]).toEqual([5, "day", 4, 0, 0, gold]);
    expect(w.waveEnded.slice(1, 5)).toEqual([1, 1, 1, 1]);
    run(w, 2);
    expect(w.boss.route).toBeGreaterThanOrEqual(0);
    expect(reason(send(w, { t: "sandbox", op: { op: "skipTo", value: 3 } }))).toBe("badValue");
    expect(reason(send(world({ sandbox: false }), { t: "sandbox", op: { op: "skipTo", value: 5 } }))).toBe("noSandbox");
  });
});
