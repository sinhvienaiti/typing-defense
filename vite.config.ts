import { realpathSync } from "node:fs";
import { isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { portalHome } from "./src/app/portal";

const env = (name: string): string | undefined => process.env[name]?.trim() || undefined;

/**
 * BUILD_1B §20: the modules src/main.ts loads with import(), each its own chunk (R3 step 1, docs/td/R3_PLAN.md §3.1:
 * tests/td-chunks.test.ts checks every import() of main.ts against it). app/keyboard.ts (the Typing Feel catalogue, asked
 * for with the page) brings the kit's keyboard audio with it, out of the start set.
 */
export const LAZY = /[\\/]src[\\/](ui[\\/](title|settings|profile|sheets|tips)|app[\\/](sandbox|dev-tools|retry|learn|quick|keyboard)|view[\\/](audio-min|folk|music|fx-pipe))\.ts$/;

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

/**
 * The Typing Feel origin of VITE_TYPING_FEEL_ORIGIN (parent docs/games/TYPING_FEEL_SERVICE.md §5.1), as the preconnect's
 * href: an http(s) URL without credentials, reduced to its origin. Anything else is no origin, as for the game itself
 * (typingFeelKeysBase).
 */
export function feelOrigin(value: string | undefined): string | null {
  const text = value?.trim() ?? "";
  if (!text || /[\s?#]/.test(text)) return null;
  try {
    const url = new URL(text);
    return (url.protocol === "http:" || url.protocol === "https:") && url.host !== "" && !url.username && !url.password ? url.origin : null;
  } catch {
    return null;
  }
}

/** `<link rel="preconnect" … crossorigin>` to the Typing Feel host, only when this build has one: no tag at all otherwise. */
export function feelPreconnect(origin: string | null): Plugin {
  return {
    name: "typing-feel-preconnect",
    transformIndexHtml: () => (origin === null ? [] : [{ tag: "link", attrs: { rel: "preconnect", href: origin, crossorigin: true }, injectTo: "head" }]),
  };
}

/** Replace only the compiled fallback; the pinned kit stays intact. */
export function replacePortalOrigin(code: string, origin: string): string {
  const declaration = /^export const PARENT_ORIGIN = [^\n]+;$/gm;
  if (code.match(declaration)?.length !== 1) throw new Error("Expected one kit PARENT_ORIGIN declaration");
  return code.replace(declaration, () => `export const PARENT_ORIGIN = ${JSON.stringify(origin)};`);
}

// Vite ids can carry queries or reach the same file through a symlink.
function canonicalId(id: string): string | null {
  const path = id.split("?")[0]!.replace(/\\/g, "/");
  if (!isAbsolute(path)) return null;
  try {
    return realpathSync(path);
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) return null;
    throw error;
  }
}

export default defineConfig(({ mode }) => {
  const root = realpathSync(fileURLToPath(new URL(".", import.meta.url)));
  const contract = realpathSync(fileURLToPath(new URL("./src/kit/learning/contract.ts", import.meta.url)));
  const home = portalHome(loadEnv(mode, root, "VITE_PORTAL_URL").VITE_PORTAL_URL);
  const origin = home ? new URL(home).origin : "";
  let transformed = false;
  chunkFor = null;
  return {
    // The parent's build:td and dev:td:app set the Typing Feel origin; a plain `pnpm dev`, `pnpm build` or `pnpm check` here
    // does not (Typing Feel off: Off and Bamboo only). .env files count too.
    plugins: [feelPreconnect(feelOrigin(loadEnv(mode, root, "VITE_TYPING_FEEL_").VITE_TYPING_FEEL_ORIGIN)), {
      name: "wordwoven-portal-origin",
      enforce: "pre",
      buildStart() { transformed = false; },
      transform(code, id) {
        if (canonicalId(id) !== contract) return null;
        try {
          const replaced = replacePortalOrigin(code, origin);
          transformed = true;
          return { code: replaced, map: null };
        } catch (error) {
          this.error(error instanceof Error ? error.message : String(error));
        }
      },
      buildEnd(error) {
        if (!error && !transformed) this.error("Kit PARENT_ORIGIN was not transformed");
      },
    }],
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
  };
});
