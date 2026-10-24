/**
 * A long run for "Chơi lại Ngày n" (docs/td/BUILD_1B.md §4.3, §19 td-1b-night5; 1B R1 review): the standard bot plays
 * the story (Cân bằng, or --mode) to the start of day n, and the run is written as main.ts keeps it in sessionStorage
 * ("td.retry": seed, header, log to that day, the day hashes). The scenario puts it in the page, which must replay its
 * hundreds of commands over some 40,000 ticks (Thư giãn to day 5) to the same hash.
 *   node --import tsx scripts/td/retry-log.ts --seed=7 --day=5 --mode=relax --out=tmp/retry.json
 */
import { writeFileSync } from "node:fs";
import { paceHeader } from "../../src/app/skill";
import { hashHex } from "../../src/sim/hash";
import { botById, botProfile, playStage } from "../../tests/td/flow";
import { realDeck } from "../../tests/td/typing";

const arg = (name: string, fallback: string): string => process.argv.find((a) => a.startsWith("--" + name + "="))?.split("=")[1] ?? fallback;
const [seed, day] = [Number(arg("seed", "7")), Number(arg("day", "4"))];
const deck = realDeck();
const bot = botById("standard");
const hashes: string[] = [];
const mode = arg("mode", "balanced") as "balanced";
const run = playStage(bot, mode, seed, deck, true, day, (w) => {
  if (w.dayStarts[w.day] === w.tick) hashes[w.day] = hashHex(w);
});
const tick = run.world.dayStarts[day];
if (tick === undefined || hashes[day] === undefined) throw new Error("the run did not reach day " + day);
const header = paceHeader(botProfile(bot, mode), true);
const log = run.log.filter((command) => command.tick < tick);
const retry = { seed, sandbox: false, deck: deck.hash, content: run.world.c.hash, mode, header, day, tick, hashes: Array.from(hashes, (h) => h ?? ""), log };
writeFileSync(arg("out", "tmp/retry.json"), JSON.stringify(retry));
console.log(JSON.stringify({ seed, day, tick, commands: log.length, hash: hashes[day] }));
