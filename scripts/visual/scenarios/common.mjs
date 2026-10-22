// Shared helpers for scripts/visual/scenarios/*.mjs (run by src/kit/tools/cdp-run.mjs).
// Source: games/space-typing/scripts/visual/scenarios/common.mjs (the parts the TD scenarios use).
import { join, resolve } from "node:path";

/** Dev server (`pnpm dev`); URL overrides it, e.g. https://td.typing-game.local/. */
export const DEV_URL = process.env.URL ?? "http://127.0.0.1:3006/";
/** Output folder (Git ignores .visual/). */
export const OUT_DIR = resolve(process.env.OUT_DIR ?? ".visual/scenarios");

export const out = (name) => join(OUT_DIR, name);

/** A first click so audio may start and first-gesture listeners run. */
export async function gesture(page) {
  await page.mouse(5, 5, "mousePressed");
  await page.mouse(5, 5, "mouseReleased");
}
