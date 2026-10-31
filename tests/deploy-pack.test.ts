import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const scripts = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).scripts as Record<string, string>;
const checker = new URL("../src/kit/tools/deploy/check-pack.mjs", import.meta.url);

// Execute the package command with a tiny build and the unchanged kit checker.
function pack(command: string, text: string, buildExit = 0, withModels = false) {
  mkdirSync("tmp", { recursive: true });
  const cwd = mkdtempSync("tmp/deploy-pack-test-");
  try {
    const dir = join(cwd, "src/kit/tools/deploy");
    mkdirSync(dir, { recursive: true });
    copyFileSync(checker, join(dir, "check-pack.mjs"));
    mkdirSync(join(cwd, "scripts/deploy"), { recursive: true });
    const prune = new URL("../scripts/deploy/prune.mjs", import.meta.url);
    const list = new URL("../deploy-models.json", import.meta.url);
    copyFileSync(prune, join(cwd, "scripts/deploy/prune.mjs"));
    copyFileSync(list, join(cwd, "deploy-models.json"));
    writeFileSync(join(cwd, "package.json"), JSON.stringify({
      private: true,
      scripts: { build: "node build.mjs", [command]: scripts[command] },
    }));
    writeFileSync(join(cwd, "build.mjs"), `
      import { mkdirSync, writeFileSync } from "node:fs";
      console.log("fixture build");
      process.exitCode = ${buildExit};
      if (!process.exitCode) {
        mkdirSync("dist");
        writeFileSync("dist/index.html", ${JSON.stringify(text)});
        mkdirSync("dist/.vite");
        writeFileSync("dist/.vite/manifest.json", "{}");
        if (${withModels}) {
          mkdirSync("dist/assets/typing-defense/models", { recursive: true });
          writeFileSync("dist/assets/typing-defense/models/manifest.json", JSON.stringify({
            version: 1, models: { "buildings/keep": { tiers: { high: { url: "/assets/typing-defense/models/missing.glb" } } } },
          }));
        }
      }
    `);
    const result = spawnSync("pnpm", ["run", command], { cwd, encoding: "utf8", timeout: 15_000 });
    if (result.error) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr, built: existsSync(join(cwd, "dist/index.html")), vite: existsSync(join(cwd, "dist/.vite")), models: existsSync(join(cwd, "dist/assets/typing-defense/models")) };
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

describe("deployment package commands", () => {
  for (const command of ["deploy:pack", "deploy:pack:local"]) {
    it(`${command} builds before checking the Wordwoven package`, () => {
      expect(scripts[command]).toContain("dist --game typing-defense");
      const result = pack(command, '<img src="/assets/typing-defense/title.webp">');
      expect(result.status, result.output).toBe(0);
      expect(result.built).toBe(true);
      expect(result.output).toContain("fixture build");
    });

    it(`${command} prunes unused missing model references before checking`, () => {
      const result = pack(command, "game", 0, true);
      expect(result.status, result.output).toBe(0);
      expect(result.vite).toBe(false);
      expect(result.models).toBe(false);
    });

    it(`${command} stops when the build fails`, () => {
      const result = pack(command, "", 17);
      expect(result.status, result.output).toBe(17);
      expect(result.output).toContain("fixture build");
      expect(result.output).not.toContain("Not a package directory");
      expect(result.built).toBe(false);
    });

    it(`${command} rejects references to Space assets`, () => {
      const result = pack(command, '<img src="/assets/space-typing/models/ship.glb">');
      expect(result.built).toBe(true);
      expect(result.status, result.output).toBe(1);
      expect(result.output).toContain("foreign-asset:");
    });

    it(`${command} ${command.endsWith(":local") ? "allows" : "rejects"} the local portal host`, () => {
      const result = pack(command, "https://typing-game.local");
      expect(result.built).toBe(true);
      expect(result.status, result.output).toBe(command.endsWith(":local") ? 0 : 1);
      if (!command.endsWith(":local")) expect(result.output).toContain("local-host:");
    });
  }
});
