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
