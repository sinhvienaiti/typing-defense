/**
 * `pnpm td:balance` (docs/td/BUILD_NOW.md §6.3, BUILD_1A6 §12, docs/games/BALANCE.md §3, §7): first the stage matrix
 * (every standard bot × Thư giãn, Cân bằng, Thử thách × --stage-seeds seeds, worker threads; the §3 metrics, B1–B9
 * and the profiles the game measures), then the R3 report (tests/td/balance.ts) with the §12 gate table, as Markdown.
 * Never fails a build (tests/td-balance-gates.test.ts and tests/td-flow.test.ts do).
 *   node --import tsx scripts/td/balance.ts [--seeds=5] [--nights=4] [--stage-seeds=120]
 */
import { availableParallelism } from "node:os";
import { Worker } from "node:worker_threads";
import { balanceReport } from "../../tests/td/balance";
import { botById, matrixCells, measuredProfile, stageReport, type Cell } from "../../tests/td/flow";
import { realDeck } from "../../tests/td/typing";

const arg = (name: string, fallback: number): number => Number(process.argv.find((a) => a.startsWith("--" + name + "="))?.split("=")[1] ?? fallback);
const started = performance.now();
const seeds = arg("stage-seeds", 120);
const specs = matrixCells();
const threads = Math.max(1, Math.min(specs.length, availableParallelism() - 1));
const shares = Array.from({ length: threads }, (_, t) => specs.filter((_, k) => k % threads === t));
const played = await Promise.all(shares.map((cells) => new Promise<Cell[]>((resolve, reject) => {
  const worker = new Worker(new URL("./balance-worker.ts", import.meta.url), { workerData: { cells, seeds } });
  worker.once("message", resolve);
  worker.once("error", reject);
})));
const cells = specs.map((spec) => played.flat().find((cell) => cell.bot === spec.bot && cell.mode === spec.mode && cell.director === spec.director)!);
const deck = realDeck();
const measured = ["child", "novice", "steady", "standard", "skilled", "sloppy", "fast"].map((bot) => ({ bot, profile: measuredProfile(botById(bot), deck) }));
stageReport(cells, measured, seeds, (text) => console.log(text));
console.log("");
balanceReport({ seeds: arg("seeds", 5), nights: arg("nights", 4) }, (text) => console.log(text));
console.log(`\n_${((performance.now() - started) / 1000).toFixed(1)} s, Node ${process.version}, ${threads} luồng._`);
