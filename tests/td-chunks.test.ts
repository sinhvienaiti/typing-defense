import { afterEach, describe, expect, it, vi } from "vitest";
import { Chunk, loadChunk } from "../src/app/chunks";

/**
 * The lazy chunks of main.ts (BUILD_1B §20; R2 review fix 2): a rejected import() is retried, then given up with one
 * console error so the page can fall back (the title skipped, Esc's pause told in the HUD); never a promise that waits
 * for good. A failed chunk may be asked again after its cool-down.
 */
describe("lazy chunks: retry and fallback (src/app/chunks.ts)", () => {
  afterEach(() => vi.restoreAllMocks());
  const failing = (failures: number) => {
    let calls = 0;
    const load = () => (++calls <= failures ? Promise.reject(new TypeError("Failed to fetch dynamically imported module")) : Promise.resolve("chunk"));
    return { load, calls: () => calls };
  };

  it("retries a rejected import and returns the module once it loads", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { load, calls } = failing(2);
    expect(await loadChunk("title", load, 3, 1)).toBe("chunk");
    expect(calls()).toBe(3);
    expect(error).not.toHaveBeenCalled();
  });

  it("gives up after its tries with null and one console error (the caller falls back)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { load, calls } = failing(9);
    expect(await loadChunk("sheets", load, 3, 1)).toBeNull();
    expect(calls()).toBe(3);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0]![0])).toContain("sheets");
  });

  it("a Chunk settles failed, answers null while the failure is fresh, then loads when asked again", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { load, calls } = failing(3);
    const chunk = new Chunk("title", load, 3, 1, 30);
    const first = chunk.get();
    expect(chunk.get()).toBe(first); // one load at a time
    expect(await first).toBeNull();
    expect([chunk.settled, chunk.failed, chunk.value]).toEqual([true, true, null]);
    expect(await chunk.get()).toBeNull(); // within the cool-down: no new try
    expect(calls()).toBe(3);
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(await chunk.get()).toBe("chunk");
    expect([chunk.settled, chunk.failed, chunk.value, calls()]).toEqual([true, false, "chunk", 4]);
    expect(await chunk.get()).toBe("chunk"); // kept
    expect(calls()).toBe(4);
  });
});

/**
 * R3 step 1 (docs/td/R3_PLAN.md §3.1): a module main.ts loads with import() is a chunk of its own only when vite.config.ts's
 * manualChunks leaves it out of "game"; one left out of LAZY would be pulled back into the entry chunk. R3 (steps 3–4):
 * "game" is what main.ts imports statically without passing a lazy module (chunkOf), so what only a lazy chunk imports goes
 * with it: the kit's learning events and the portal bridge ride in Học's chunk.
 */
describe("lazy chunks: every import() of main.ts stays out of the entry chunk (vite.config.ts LAZY, chunkOf)", () => {
  it("names each dynamically imported module, and the entry's own modules are not lazy", async () => {
    const { readFileSync } = await import("node:fs");
    const { LAZY, chunkOf } = await import("../vite.config");
    const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    const lazy = [...main.matchAll(/import\("\.\/([^"]+)"\)/g)].map((m) => "/repo/src/" + m[1] + ".ts");
    expect(lazy.length).toBeGreaterThanOrEqual(9);
    // A graph in the build's shape: main imports the HUD and the chunk loader; Học's chunk the bridge, which the kit's learning
    // module and the safe storage follow; the HUD imports the safe storage too.
    const src = (path: string): string => "/repo/src/" + path + ".ts";
    const graph: Record<string, string[]> = {
      [src("main")]: [src("ui/hud"), src("app/chunks"), src("sim/world"), ...lazy.slice(0, 2)],
      [src("ui/hud")]: [src("kit/platform/safe-storage")],
      [src("app/learn")]: [src("app/learning"), src("sim/world")],
      [src("app/learning")]: [src("kit/learning/index")],
      [src("kit/learning/index")]: [src("kit/learning/events"), src("kit/platform/safe-storage")],
    };
    const chunk = chunkOf([src("main")], (id) => ({ importedIds: graph[id] ?? [] }));
    for (const id of lazy) expect([id, LAZY.test(id), chunk(id)]).toEqual([id, true, undefined]);
    for (const id of ["main", "ui/hud", "app/chunks", "sim/world", "kit/platform/safe-storage"]) expect([id, chunk(src(id))]).toEqual([id, "game"]);
    for (const id of ["app/learning", "kit/learning/index", "kit/learning/events"]) expect([id, chunk(src(id))]).toEqual([id, undefined]);
    expect(lazy).toEqual(expect.arrayContaining([src("app/dev-tools"), src("app/retry"), src("app/learn")]));
    // The bridge reaches the page through Học's chunk only.
    expect(main).not.toMatch(/from "\.\/app\/learning"/);
  });
});
