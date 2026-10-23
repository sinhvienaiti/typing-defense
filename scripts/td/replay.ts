/**
 * Replays a browser run's command log in Node and compares the world hash
 * (docs/td/BUILD_NOW.md §7 gate 4: Node and Chrome reach the same hash for
 * the same log). The input is the file a td-1a scenario writes next to its
 * screenshots: { seed, sandbox, content, deck, vocabulary, expected, pace, mode, tick, hash, log } (the run
 * header, E and pace k with the director on or off, BALANCE.md §4.1; a file from before it has neither).
 * The deck is rebuilt from shared/vocabulary (or the built-in list the page
 * fell back to) and must have the browser's deck hash.
 *   node --import tsx scripts/td/replay.ts <OUT_DIR>/td-1a6-day-replay-1280x720.json
 * Prints one JSON line; exits 1 when the content or the hash differs.
 */
import { readFileSync } from "node:fs";
import { filterVocabularyEntries } from "../../src/kit/vocab";
import { deckFromLevels, fallbackDeck, VOCAB_LEVELS } from "../../src/app/vocab";
import type { Mode } from "../../src/content/types";
import type { Command } from "../../src/sim/commands";
import { hashHex } from "../../src/sim/hash";
import type { PaceHeader } from "../../src/sim/systems/pace";
import { createWorld, replayTo } from "../../src/sim/world";

type BrowserRun = { seed: number; sandbox: boolean; content: string; deck: string; vocabulary: string; expected?: number; pace?: PaceHeader; mode?: Mode; tick: number; hash: string; log: Command[] };

const file = process.argv[2];
if (file === undefined) {
  console.error("usage: node --import tsx scripts/td/replay.ts <replay.json>");
  process.exit(2);
}
const run = JSON.parse(readFileSync(file, "utf8")) as BrowserRun;
// Flagged words dropped, as the page's loader (src/kit/vocab) drops them.
const level = (n: number) => filterVocabularyEntries(JSON.parse(readFileSync(new URL("../../../../shared/vocabulary/levels/" + String(n).padStart(3, "0") + ".json", import.meta.url), "utf8")).entries);
const deck = run.vocabulary === "fallback" ? fallbackDeck() : deckFromLevels(Array.from({ length: VOCAB_LEVELS }, (_, index) => level(index + 1)));
const world = createWorld({ seed: run.seed, sandbox: run.sandbox, deck, expected: run.expected, pace: run.pace, mode: run.mode });
replayTo(world, run.log, run.tick); // with what a tactical pause ordered at that tick
const result = {
  commands: run.log.length,
  tick: world.tick,
  sameContent: world.c.hash === run.content,
  sameDeck: deck.hash === run.deck,
  browser: run.hash,
  node: hashHex(world),
};
const match = result.sameContent && result.sameDeck && result.tick === run.tick && result.node === result.browser;
console.log(JSON.stringify({ match, ...result }));
if (!match) process.exitCode = 1;
