import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { build } from "vite";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = resolve(__dirname, "..");
afterEach(() => vi.unstubAllEnvs());
function temp() {
  mkdirSync(join(root, "tmp"), { recursive: true });
  return mkdtempSync(join(root, "tmp/portal-build-"));
}
function kitBytes(dir = join(root, "src/kit")): [string, Buffer][] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item): [string, Buffer][] => {
    const path = join(dir, item.name);
    return item.isDirectory() ? kitBytes(path) : [[path, readFileSync(path)]];
  });
}

describe("real Vite portal build", () => {
  it.each([["", ""], ["https://portal.example/learn/?game=typing-defense", "https://portal.example"], ["https://typing-game.local/", "https://typing-game.local"]])("compiles %j without changing kit bytes", async (url, origin) => {
    vi.stubEnv("VITE_PORTAL_URL", url);
    const fixture = temp();
    const before = kitBytes();
    try {
      const entry = join(fixture, "probe.ts");
      writeFileSync(entry, `export { createLearningBridge } from ${JSON.stringify(join(root, "src/kit/learning"))}; export { createPortalBridge } from ${JSON.stringify(join(root, "src/app/learning"))};`);
      const result = await build({
        configFile: join(root, "vite.config.ts"), logLevel: "silent",
        build: { outDir: join(fixture, "out"), copyPublicDir: false, minify: false,
          rollupOptions: { input: entry, preserveEntrySignatures: "strict", output: { manualChunks: () => undefined } } },
      });
      if (!("output" in result)) throw new Error("Expected one Rollup output");
      const chunks = result.output.filter((item) => item.type === "chunk");
      expect(chunks).toHaveLength(1);
      const code = chunks[0]!.code;
      if (!url) expect(code).not.toContain("typing-game.local");
      else expect(code).toContain(JSON.stringify(origin));
      const executed = spawnSync(process.execPath, ["--input-type=module", "--eval", `
        import { readFileSync } from "node:fs";
        const m = await import("data:text/javascript;base64," + readFileSync(0).toString("base64"));
        const fallback = m.createLearningBridge({ gameId: "typing-defense" });
        const portal = m.createPortalBridge();
        console.log(JSON.stringify([fallback.parentOrigin, portal.parentOrigin]));
        fallback.dispose(); portal.dispose();
      `], { input: code, encoding: "utf8", timeout: 5000 });
      expect(executed.status, executed.stderr).toBe(0);
      expect(JSON.parse(executed.stdout)).toEqual([origin, origin]);
      expect(kitBytes()).toEqual(before);
    } finally { rmSync(fixture, { recursive: true, force: true }); }
  });
  it.each(["broken", "https://user:pass@portal.example/", "ftp://portal.example/"])("fails the real build for %s", async (url) => {
    vi.stubEnv("VITE_PORTAL_URL", url);
    const fixture = temp();
    try {
      await expect(build({ configFile: join(root, "vite.config.ts"), logLevel: "silent", build: { outDir: join(fixture, "out"), copyPublicDir: false } })).rejects.toThrow(/VITE_PORTAL_URL/);
    } finally { rmSync(fixture, { recursive: true, force: true }); }
  });
  it("requires exactly one declaration and preserves literal replacement characters", async () => {
    const { replacePortalOrigin } = await import("../vite.config");
    expect(() => replacePortalOrigin("", "")).toThrow(/one.*PARENT_ORIGIN/);
    const declaration = 'export const PARENT_ORIGIN = "old";';
    expect(() => replacePortalOrigin(declaration + "\n" + declaration, "")).toThrow(/one.*PARENT_ORIGIN/);
    expect(replacePortalOrigin(declaration, "https://portal.example$&")).toBe('export const PARENT_ORIGIN = "https://portal.example$&";');
  });
});
