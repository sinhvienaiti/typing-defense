import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { serveSharedFolders } from "./src/kit/tools/vite-shared-plugin";

const root = fileURLToPath(new URL(".", import.meta.url));

const env = (name: string): string | undefined => process.env[name]?.trim() || undefined;

/**
 * BUILD_1B §20: the modules src/main.ts loads with import(), each its own chunk (and what only they import). Any other
 * module goes in "game", the entry chunk; a lazy module left out of this pattern would be pulled back into it (R3 step 1,
 * docs/td/R3_PLAN.md §3.1: tests/td-chunks.test.ts checks every import() of main.ts against it).
 */
export const LAZY = /[\\/]src[\\/](ui[\\/](title|settings|profile|sheets)|app[\\/](sandbox|dev-tools|retry)|view[\\/](audio-min|folk|music))\.ts$/;

// The parent repo's dev script sets these for the nginx host (td.typing-game.local).
// A plain `pnpm dev` on 127.0.0.1:3006 keeps Vite's own HMR socket.
const hmrHost = env("DEV_HMR_HOST");

export default defineConfig({
  base: "/",
  // Dev only: /vocabulary/ and /typing-texts/ read-only from the parent repo's shared/.
  plugins: [serveSharedFolders({ sharedRoot: join(root, "..", "..", "shared") })],
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
        // pause and results cards, the sandbox panel, __td and "Chơi lại Ngày n" (R3 step 1) load apart (src/main.ts, LAZY).
        // At "/" the start set is that chunk and the title (scripts/bundle-budget.mjs, ≤ 85 kB gzip).
        manualChunks: (id) => (LAZY.test(id) ? undefined : "game"),
      },
    },
  },
});
