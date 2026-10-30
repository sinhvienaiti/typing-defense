import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { build } from "vite";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = resolve(__dirname, "..");
const contract = join(root, "src/kit/learning/contract.ts");
afterEach(() => vi.unstubAllEnvs());

describe.each([undefined, "https://portal.example/learn/"])("portal contract ids with URL %j", (url) => {
  it.each(["?v=123", "?import", "symlink-id", "symlink-config"])("rewrites the real build through %s", async (variant) => {
    vi.stubEnv("VITE_PORTAL_URL", url);
    mkdirSync(join(root, "tmp"), { recursive: true });
    const dir = mkdtempSync(join(root, "tmp/portal-id-"));
    const before = readFileSync(contract);
    try {
      const alias = join(dir, "alias");
      symlinkSync(root, alias, "dir");
      const specifier = variant.startsWith("?") ? contract + variant : variant === "symlink-id" ? join(alias, "src/kit/learning/contract.ts") : contract;
      const input = join(dir, "entry.ts");
      writeFileSync(input, `export { PARENT_ORIGIN } from ${JSON.stringify(specifier)};`);
      const result = await build({
        configFile: join(variant === "symlink-config" ? alias : root, "vite.config.ts"),
        logLevel: "silent", resolve: { preserveSymlinks: variant === "symlink-id" },
        build: { outDir: join(dir, "out"), copyPublicDir: false, minify: false,
          rollupOptions: { input, preserveEntrySignatures: "strict", output: { manualChunks: () => undefined } } },
      });
      if (!("output" in result)) throw new Error("Expected one Rollup output");
      const chunks = result.output.filter((item) => item.type === "chunk");
      expect(chunks).toHaveLength(1);
      const code = chunks[0]!.code;
      expect(code).not.toContain("typing-game.local");
      const executed = spawnSync(process.execPath, ["--input-type=module", "--eval", `
        import { readFileSync } from "node:fs";
        const m = await import("data:text/javascript;base64," + readFileSync(0).toString("base64"));
        console.log(JSON.stringify(m.PARENT_ORIGIN));
      `], { input: code, encoding: "utf8", timeout: 5000 });
      expect(executed.status, executed.stderr).toBe(0);
      expect(JSON.parse(executed.stdout)).toBe(url ? new URL(url).origin : "");
    } finally {
      expect(readFileSync(contract)).toEqual(before);
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

it("fails a build that never transforms the portal contract", async () => {
  vi.stubEnv("VITE_PORTAL_URL", undefined);
  mkdirSync(join(root, "tmp"), { recursive: true });
  const dir = mkdtempSync(join(root, "tmp/portal-id-"));
  try {
    const input = join(dir, "unused.ts");
    writeFileSync(input, 'console.log("no contract");');
    await expect(build({ configFile: join(root, "vite.config.ts"), logLevel: "silent",
      build: { outDir: join(dir, "out"), copyPublicDir: false, rollupOptions: { input } },
    })).rejects.toThrow(/PARENT_ORIGIN.*not transformed/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

it("preserves CRLF while replacing exactly one declaration", async () => {
  const { replacePortalOrigin } = await import("../vite.config");
  expect(replacePortalOrigin('export const PARENT_ORIGIN = "old";\r\n', "")).toBe('export const PARENT_ORIGIN = "";\r\n');
});
