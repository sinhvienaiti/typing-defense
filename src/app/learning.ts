/** The page's lazy learning bridge, loaded with Học. */
import { createLearningBridge, type BridgeHost, type LearningBridge, type LearningBridgeOptions } from "../kit/learning";
import { portalHome } from "./portal";

export const GAME_ID = "typing-defense";

// Framing without a configured portal must not flush the local queue.
const standaloneHost: BridgeHost = {
  parent: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
  now: () => Date.now(),
};

export function createPortalBridge(options: Omit<LearningBridgeOptions, "gameId" | "parentOrigin"> = {}): LearningBridge {
  const home = portalHome(import.meta.env.VITE_PORTAL_URL);
  return createLearningBridge({
    ...options,
    gameId: GAME_ID,
    parentOrigin: home ? new URL(home).origin : "",
    host: home ? options.host : standaloneHost,
  });
}

let bridge: LearningBridge | null = null;

/** The page's one bridge, made on first use. */
export function learningBridge(): LearningBridge {
  bridge ??= createPortalBridge();
  return bridge;
}
