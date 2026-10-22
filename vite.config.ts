import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { serveSharedFolders } from "./src/kit/tools/vite-shared-plugin";

const root = fileURLToPath(new URL(".", import.meta.url));

const env = (name: string): string | undefined => process.env[name]?.trim() || undefined;

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
  },
});
