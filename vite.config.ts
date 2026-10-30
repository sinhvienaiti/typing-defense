import { defineConfig } from "vite";

const env = (name: string): string | undefined => process.env[name]?.trim() || undefined;

/**
 * BUILD_1B §20: the modules src/main.ts loads with import(), each its own chunk (R3 step 1, docs/td/R3_PLAN.md §3.1:
 * tests/td-chunks.test.ts checks every import() of main.ts against it).
 */
export const LAZY = /[\\/]src[\\/](ui[\\/](title|settings|profile|sheets|tips)|app[\\/](sandbox|dev-tools|retry|learn|quick)|view[\\/](audio-min|folk|music|fx-pipe))\.ts$/;

type ModuleInfo = { importedIds: readonly string[] } | null;
/**
 * "game", the entry chunk, holds what the entries (index.html: main.ts, Vite's preload polyfill) import statically, step by
 * step, never through a LAZY module; a lazy module and what only lazy modules import (R3: the kit's learning events, the
 * portal bridge) go with them, as Rollup splits them.
 */
export function chunkOf(entries: readonly string[], info: (id: string) => ModuleInfo): (id: string) => string | undefined {
  const game = new Set(entries);
  for (const at of game) for (const next of info(at)?.importedIds ?? []) if (!LAZY.test(next)) game.add(next);
  return (id) => (game.has(id) ? "game" : undefined);
}
let chunkFor: ((id: string) => string | undefined) | null = null;

// The parent repo's dev script sets these for the nginx host (td.typing-game.local).
// A plain `pnpm dev` on 127.0.0.1:3006 keeps Vite's own HMR socket.
const hmrHost = env("DEV_HMR_HOST");

export default defineConfig({
  base: "/",
  server: {
    host: env("DEV_HOST") ?? "127.0.0.1",
    port: 3006,
    strictPort: true,
    allowedHosts: (env("DEV_ALLOWED_HOSTS") ?? "td.typing-game.local")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    hmr: hmrHost
      ? {
          host: hmrHost,
          protocol: (env("DEV_HMR_PROTOCOL") as "ws" | "wss" | undefined) ?? "wss",
          clientPort: Number(env("DEV_HMR_CLIENT_PORT") ?? 443),
        }
      : undefined,
  },
  build: {
    target: "es2022",
    // scripts/bundle-budget.mjs reads the chunks each start page needs from it (BUILD_1B §20).
    manifest: true,
    rollupOptions: {
      output: {
        // BUILD_1B §20: what the game needs to start is one chunk; sound, the title, the settings and Hồ sơ gõ cards, the
        // pause and results cards, the sandbox panel, __td and "Chơi lại Ngày n" (R3 step 1), Học with the portal bridge and
        // the teaching table (R3) load apart (src/main.ts, LAZY, chunkOf).
        // At "/" the start set is that chunk and the title (scripts/bundle-budget.mjs, ≤ 85 kB gzip).
        manualChunks: (id, { getModuleIds, getModuleInfo }) => (chunkFor ??= chunkOf([...getModuleIds()].filter((at) => getModuleInfo(at)?.isEntry), getModuleInfo))(id),
      },
    },
  },
});
