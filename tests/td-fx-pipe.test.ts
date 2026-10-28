import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { CombatRing, FX } from "../src/sim/events";
import { PROJECTILE } from "../src/sim/stores/projectiles";
import { FxPipe, type FxDraw } from "../src/view/fx-pipe";
import { runBot } from "./td/bot";
import { goldenDeck, goldenSpec, readGolden } from "./td/golden";

type Call = ["muzzle" | "hit", number, number, number, number];
const recorder = () => {
  const calls: Call[] = [];
  const draw: FxDraw = {
    muzzle: (x, z, kind, tick) => { calls.push(["muzzle", x, z, kind, tick]); },
    hit: (x, z, crit, tick) => { calls.push(["hit", x, z, crit, tick]); },
  };
  return { calls, draw };
};

/** Inspect only FxPipe.read: FxView keeps its existing drawing code. */
function allocations(source: string): string[] {
  const file = ts.createSourceFile("fx-pipe.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const bodies: ts.Block[] = [];
  const find = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node) && node.name?.text === "FxPipe") {
      for (const member of node.members) {
        if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name) && member.name.text === "read" && member.body) bodies.push(member.body);
      }
    }
    ts.forEachChild(node, find);
  };
  find(file);
  expect(bodies).toHaveLength(1);
  const forbidden = new Set([
    ts.SyntaxKind.NewExpression, ts.SyntaxKind.ObjectLiteralExpression, ts.SyntaxKind.ArrayLiteralExpression,
    ts.SyntaxKind.ArrowFunction, ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ClassExpression,
    ts.SyntaxKind.SpreadElement, ts.SyntaxKind.SpreadAssignment, ts.SyntaxKind.TemplateExpression,
    ts.SyntaxKind.NoSubstitutionTemplateLiteral, ts.SyntaxKind.RegularExpressionLiteral,
  ]);
  const methods = new Set([
    "map", "filter", "slice", "concat", "splice", "push", "unshift", "flat", "flatMap", "join", "split",
    "from", "of", "assign", "keys", "values", "entries", "bind", "toFixed", "toString",
  ]);
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (forbidden.has(node.kind)) found.push(ts.SyntaxKind[node.kind]);
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && methods.has(node.expression.name.text)) found.push("call " + node.expression.name.text);
    ts.forEachChild(node, visit);
  };
  visit(bodies[0]!);
  return found;
}

describe("036 FxPipe", () => {
  it("1 reads fire and hit once, in ring order, ignoring other kinds", () => {
    const ring = new CombatRing();
    const { calls, draw } = recorder();
    const pipe = new FxPipe(ring, draw);
    ring.push(FX.fire, 3.5, -2.25, PROJECTILE.arrow, 10);
    ring.push(FX.spawn, 0, 0, 0, 10);
    ring.push(FX.fire, -7, 4, PROJECTILE.fireball, 11);
    ring.push(FX.hit, 4, -1, 1, 12);
    for (const kind of [FX.burst, FX.death, FX.leak, FX.coin, FX.block, FX.soldierDown, FX.fizzle, FX.bossHit]) ring.push(kind, 0, 0, 0, 13);
    ring.push(FX.hit, 5.5, 6, 0, 14);
    const expected: Call[] = [["muzzle", 3.5, -2.25, 0, 10], ["muzzle", -7, 4, 3, 11], ["hit", 4, -1, 1, 12], ["hit", 5.5, 6, 0, 14]];
    pipe.read(ring);
    expect(calls).toEqual(expected);
    expect(pipe.stats()).toEqual({ read: 13, fire: 2, hit: 2, lost: 0 });
    pipe.read(ring);
    expect(calls).toEqual(expected);
    expect(pipe.stats()).toEqual({ read: 13, fire: 2, hit: 2, lost: 0 });
  });

  it("2 starts at creation and accounts for overwritten slots", () => {
    const ring = new CombatRing();
    for (let i = 0; i < 5; i += 1) ring.push(FX.fire, i, 0, 0, i);
    const { calls, draw } = recorder();
    const pipe = new FxPipe(ring, draw);
    pipe.read(ring);
    expect(calls).toEqual([]);
    expect(pipe.stats()).toEqual({ read: 0, fire: 0, hit: 0, lost: 0 });
    for (let i = 0; i < 8192 + 100; i += 1) ring.push(FX.hit, i, 0, 0, i);
    pipe.read(ring);
    expect(pipe.stats()).toEqual({ read: 8192, fire: 0, hit: 8192, lost: 100 });
    expect(calls).toHaveLength(8192);
    expect(calls[0]).toEqual(["hit", 100, 0, 0, 100]);
    expect(calls.at(-1)).toEqual(["hit", 8291, 0, 0, 8291]);
  });

  it("3 returns a fresh stats copy and supports the default draw", () => {
    const ring = new CombatRing();
    const pipe = new FxPipe(ring);
    ring.push(FX.fire, 0, 0, PROJECTILE.bolt, 1);
    ring.push(FX.hit, 0, 0, 0, 2);
    pipe.read(ring);
    const first = pipe.stats();
    const second = pipe.stats();
    expect(first).not.toBe(second);
    first.read = first.fire = first.hit = first.lost = -1;
    expect(second).toEqual({ read: 2, fire: 1, hit: 1, lost: 0 });
    expect(pipe.stats()).toEqual(second);
  });

  it("4 allocates nothing in read, with an in-memory positive control", () => {
    const source = readFileSync(new URL("../src/view/fx-pipe.ts", import.meta.url), "utf8");
    expect(allocations(source)).toEqual([]);
    const control = "class FxPipe { read(r: R) { const a = { x: 1 }; const b = [1]; r.list.push(1); for (const c of r) f(() => c); } }";
    expect(allocations(control)).toEqual(["ObjectLiteralExpression", "ArrayLiteralExpression", "call push", "ArrowFunction"]);
  });

  it("5 matches an independent scan of the golden run", () => {
    const { calls, draw } = recorder();
    const seen: Call[] = [];
    let pipe: FxPipe | null = null;
    let cursor = 0;
    const run = runBot({ ...goldenSpec(goldenDeck(readGolden().words)), check: false, onTick(w) {
      const ring = w.events.ring;
      if (pipe === null) {
        pipe = new FxPipe(ring, draw);
        cursor = ring.written;
      }
      for (; cursor < ring.written; cursor += 1) {
        const slot = cursor % ring.size;
        if (ring.kind[slot] === FX.fire) seen.push(["muzzle", ring.x[slot]!, ring.z[slot]!, ring.value[slot]!, ring.tick[slot]!]);
        else if (ring.kind[slot] === FX.hit) seen.push(["hit", ring.x[slot]!, ring.z[slot]!, ring.value[slot]!, ring.tick[slot]!]);
      }
      if (w.tick % 3 === 0) pipe.read(ring);
    } });
    expect(pipe).not.toBeNull();
    const finished = pipe! as FxPipe;
    finished.read(run.world.events.ring);
    const muzzle = calls.filter((call) => call[0] === "muzzle");
    const hits = calls.filter((call) => call[0] === "hit");
    const kinds = Object.fromEntries(Object.entries(PROJECTILE).map(([name, kind]) => [name, muzzle.filter((call) => call[3] === kind).length]));
    console.log("036 golden counts " + JSON.stringify({ ticks: run.ticks, muzzle: muzzle.length, ...kinds, hit: hits.length, crit: hits.filter((call) => call[3] === 1).length, stats: finished.stats() }));
    expect(calls).toEqual(seen);
    expect(finished.stats().lost).toBe(0);
    expect(muzzle.some((call) => call[3] === PROJECTILE.fireball)).toBe(true);
    expect(muzzle.some((call) => call[3] === PROJECTILE.arrow)).toBe(true);
    expect(hits.length).toBeGreaterThan(0);
  });
});
