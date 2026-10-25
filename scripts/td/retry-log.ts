/**
 * A long run for "Chơi lại Ngày n" (docs/td/BUILD_1B.md §4.3, §19 td-1b-night5; 1B R1 review): the standard bot plays
 * the story (Cân bằng, or --mode) to the start of day n, and the run is written as main.ts keeps it in sessionStorage
 * ("td.retry": seed, header, study lists, log to that day, the day hashes). The scenario puts it in the page, which must replay its
 * hundreds of commands over some 40,000 ticks (Thư giãn to day 5) to the same hash.
 * With --end (R3, td-1b-story) the bot plays the whole story and the run is kept at its end: the page replays it to the won
 * card (the run must be won; the stars kept in td.campaign come from the bot's lives).
 *   node --import tsx scripts/td/retry-log.ts --seed=7 --day=5 --mode=relax --out=tmp/retry.json
 *   node --import tsx scripts/td/retry-log.ts --seed=7 --end --mode=relax --out=tmp/won.json
 * The run carries the bot's study lists (R3 step 8): the cold start, or with --book20 the 20-word book (tests/td/flow.ts).
 */
import { writeFileSync } from "node:fs";
import { paceHeader } from "../../src/app/skill";
import { hashHex } from "../../src/sim/hash";
import { botById, botProfile, playStage } from "../../tests/td/flow";
import { realDeck } from "../../tests/td/typing";

const arg = (name: string, fallback: string): string => process.argv.find((a) => a.startsWith("--" + name + "="))?.split("=")[1] ?? fallback;
const end = process.argv.includes("--end");
const seed = Number(arg("seed", "7"));
const deck = realDeck();
const bot = botById(process.argv.includes("--book20") ? "standard@book20" : "standard");
const hashes: string[] = [];
const mode = arg("mode", "balanced") as "balanced";
const run = playStage(bot, mode, seed, deck, true, end ? undefined : Number(arg("day", "4")), (w) => {
  if (w.dayStarts[w.day] === w.tick) hashes[w.day] = hashHex(w);
});
if (end && run.world.phase !== "victory") throw new Error("the bot lost seed " + seed + " (" + run.world.phase + "): try another --seed");
const day = end ? run.world.day : Number(arg("day", "4"));
if (end) hashes[day] = hashHex(run.world);
const tick = end ? run.world.tick : run.world.dayStarts[day];
if (tick === undefined || hashes[day] === undefined) throw new Error("the run did not reach day " + day);
const header = paceHeader(botProfile(bot, mode), true);
const log = run.log.filter((command) => command.tick < tick!);
// The run's study lists (R3 step 8, R3_PLAN §3.8): the standard bot's cold start (--book20: its 20-word book), planned by the page's planFor.
const retry = { seed, sandbox: false, deck: deck.hash, content: run.world.c.hash, mode, header, learn: run.learn, day, tick, hashes: Array.from(hashes, (h) => h ?? ""), log };
writeFileSync(arg("out", "tmp/retry.json"), JSON.stringify(retry));
console.log(JSON.stringify({ seed, day, tick, commands: log.length, hash: hashes[day], ...(end ? { lives: run.world.lives } : {}) }));
