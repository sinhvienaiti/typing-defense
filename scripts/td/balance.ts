/**
 * `pnpm td:balance` (docs/td/BUILD_NOW.md §6.3, BUILD_1A6 §12, docs/games/BALANCE.md §3, §7): first the stage matrix
 * (every standard bot × Thư giãn, Cân bằng, Thử thách × --stage-seeds seeds, on --stage-sets independent seed sets,
 * worker threads; the §3 metrics, B1–B9
 * and the profiles the game measures), then the R3 report (tests/td/balance.ts) with the §12 gate table, as Markdown.
 * Never fails a build (tests/td-balance-gates.test.ts and tests/td-flow.test.ts do).
 *   node --import tsx scripts/td/balance.ts [--seeds=5] [--nights=4] [--stage-seeds=120] [--stage-sets=2] [--threads=6]
 *   tuning probes (BUILD_1B §6.5): [--modes=balanced] [--bots=standard,fast] [--quick] (no profiles, no §12 report) [--set=POWER.quick=0.8 …]
 */
import { availableParallelism } from "node:os";
import { Worker } from "node:worker_threads";
import { balanceReport } from "../../tests/td/balance";
import { botById, MATRIX_BOTS, matrixCells, measuredProfile, poolCells, r2Gates, stageGates, stageReport, STAGE_MODES, TIGHT_BANDS, tightTable, type Cell } from "../../tests/td/flow";
import { formatGates, type BandMode } from "../../src/kit/balance";
import { realDeck } from "../../tests/td/typing";
import { applySets, setsOf } from "./overrides";

const arg = (name: string, fallback: number): number => Number(process.argv.find((a) => a.startsWith("--" + name + "="))?.split("=")[1] ?? fallback);
const list = (name: string): string[] | null => process.argv.find((a) => a.startsWith("--" + name + "="))?.split("=")[1]?.split(",") ?? null;
const started = performance.now();
const sets_ = setsOf(process.argv);
applySets(sets_);
const quick = process.argv.includes("--quick");
const seeds = arg("stage-seeds", 120);
const sets = arg("stage-sets", 2);
const bots = list("bots");
const specs = matrixCells((list("modes") as BandMode[] | null) ?? STAGE_MODES, bots === null ? MATRIX_BOTS : MATRIX_BOTS.filter((bot) => bots.includes(bot.id)));
const threads = Math.max(1, Math.min(specs.length, arg("threads", Math.min(6, availableParallelism() - 1))));
if (sets_.length > 0) console.log("_Ghi đè số (thử chỉnh, chưa vào mã): " + sets_.map((set) => "`" + set + "`").join(", ") + "._\n");
/** One seed set (from + 1 .. from + seeds) of the matrix, its cells spread over worker threads. */
async function playSet(from: number): Promise<Cell[]> {
  const shares = Array.from({ length: threads }, (_, t) => specs.filter((_, k) => k % threads === t));
  const played = await Promise.all(shares.map((cells) => new Promise<Cell[]>((resolve, reject) => {
    const entry = new URL("./balance-worker.ts", import.meta.url).href;
    const worker = new Worker(new URL("./tsx-worker.mjs", import.meta.url), { workerData: { entry, cells, seeds, from, sets: sets_ } });
    worker.once("message", resolve);
    worker.once("error", reject);
  })));
  return specs.map((spec) => played.flat().find((cell) => cell.bot === spec.bot && cell.mode === spec.mode && cell.director === spec.director)!);
}
const deck = realDeck();
const measured = quick ? [] : ["child", "novice", "steady", "standard", "skilled", "sloppy", "fast"].map((bot) => ({ bot, profile: measuredProfile(botById(bot), deck) }));
// A second, independent set of seeds checks that the first set's numbers are not luck.
const played: Cell[][] = [];
for (let set = 0; set < sets; set += 1) {
  played.push(await playSet(set * seeds));
  stageReport(played[set]!, set === sets - 1 ? measured : [], seeds, (text) => console.log(text), set * seeds);
  console.log("");
}
// BUILD_1B §6.4, §18.3: the tight targets in Cân bằng read the sets pooled (B1, B7's director-off row); each set alone
// keeps BALANCE §3's bands (B1 above). The wide verdict of B1 and B7 is printed after, to compare.
if (sets > 1) {
  const pooled = poolCells(played);
  console.log(`## Gộp ${sets} bộ seed (${sets * seeds} ván mỗi ô): đích chặt 1B (BUILD_1B §6.4)\n`);
  console.log(tightTable(played, pooled).join("\n"));
  console.log("\n### Cổng B1–B9 trên các bộ gộp (B1 và hàng tắt nhịp của B7 chấm theo đích chặt 1B: thắng 78–88 % mọi bot, Biên S 40–60 % bot Chuẩn, bot khác 35–65 % như BALANCE §3; BUILD_1B §18.3)\n");
  console.log(formatGates(stageGates(pooled, TIGHT_BANDS)));
  const wide = stageGates(pooled).filter((gate) => gate.id === "B1" || gate.id === "B7");
  console.log(`\nĐể so, B1 và B7 gộp theo dải BALANCE §3 (75–90 %, 35–65 %): ${wide.map((gate) => gate.id + " " + (gate.status === "pass" ? "đạt" : gate.status === "fail" ? "trượt" : "thiếu số")).join(", ")}.`);
  console.log("\nR2 gộp: " + r2Gates(pooled));
  console.log("");
}

if (!quick) balanceReport({ seeds: arg("seeds", 5), nights: arg("nights", 4) }, (text) => console.log(text));
console.log(`\n_${((performance.now() - started) / 1000).toFixed(1)} s, Node ${process.version}, ${threads} luồng._`);
