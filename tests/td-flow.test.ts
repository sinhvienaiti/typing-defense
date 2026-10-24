import { describe, expect, it } from "vitest";
import { GATE_IDS, STANDARD_BOTS, type BotModeSummary } from "../src/kit/balance";
import { STAT } from "../src/sim/stats";
import { paceSummary } from "./td/bot";
import { botById, learnOk, MATRIX_BOTS, matrixCells, measuredProfile, metricsTable, playCell, playStage, stageGates, stageReport, STAGE_NIGHTS, TIGHT_BANDS, type Cell } from "./td/flow";
import { realDeck } from "./td/typing";

/**
 * The stage matrix of `pnpm td:balance` (docs/games/BALANCE.md §3, §6, §7; tests/td/flow.ts): the bots play through
 * the game's commands with a human-like typist, a run's flow and pace fold into the kit's summaries, and the report
 * prints the §3 table and B1–B9. The full matrix (≥ 20 seeds) runs in the report; here a small one checks the wiring.
 */
describe("the stage matrix and its report (BALANCE.md §3, §7)", () => {
  const deck = realDeck();

  it("has every standard bot, the tactics pair for B6, every mode, and the director off once for B7", () => {
    expect(MATRIX_BOTS.map((bot) => bot.id)).toEqual([...STANDARD_BOTS.map((bot) => bot.id), "standard@good", "standard@poor", "no-type@kite"]);
    const cells = matrixCells();
    // The kite (B5, BUILD_1B §18.1) plays Cân bằng and Thử thách only.
    expect(cells.length).toBe(3 * MATRIX_BOTS.length + 1 - 1);
    expect(cells.filter((cell) => cell.bot === "no-type@kite").map((cell) => cell.mode)).toEqual(["balanced", "challenge"]);
    expect(cells.filter((cell) => !cell.director)).toEqual([{ bot: "standard", mode: "balanced", director: false }]);
  });

  it("types through the commands at the bot's own speed and accuracy, and measures every run (flow, pace, kill time, the learning gate)", { timeout: 20_000 }, () => {
    const fast = playStage(botById("fast"), "balanced", 1, deck, true, 2);
    const sloppy = playStage(botById("sloppy"), "balanced", 1, deck, true, 2);
    const none = playStage(botById("no-type"), "balanced", 1, deck, true, 2);
    expect(fast.log.some((command) => command.t === "key")).toBe(true);
    expect(none.log.some((command) => command.t === "key")).toBe(false);
    expect(sloppy.stats.keyErrors / sloppy.stats.keys).toBeGreaterThan(fast.stats.keyErrors / fast.stats.keys);
    for (const run of [fast, sloppy, none]) {
      expect(run.flow.ticks).toBeGreaterThan(0);
      expect(run.flow.outcome).toBe(run.defeat ? "lost" : "won");
      expect(run.problems).toEqual([]);
      expect(run.rejected).toEqual([]);
      expect(run.pace).toEqual(paceSummary(run.world));
      expect(run.killSeconds).toBeCloseTo(run.stats.killTicks / run.stats.kills / 60, 9);
      expect(learnOk(run)).toBe(true);
    }
    expect(fast.world.pace.k).toBe(1.3);
    expect(none.world.pace.k).toBe(1);
    expect(fast.world.stats[STAT.killTicks]).toBeGreaterThan(0);
  });

  it("folds a cell into the kit's summary and prints the §3 table and every gate (missing cells are THIẾU SỐ, never ĐẠT)", { timeout: 20_000 }, () => {
    const cells = [playCell({ bot: "standard", mode: "balanced", director: true }, 2, deck, 1), playCell({ bot: "no-type", mode: "balanced", director: true }, 2, deck, 1)];
    expect(cells[0]!.summary.runs).toBe(2);
    expect(cells[0]!.k).toBe(1);
    const table = metricsTable(cells);
    expect(table).toHaveLength(2 + cells.length);
    expect(table[2]).toMatch(/^\| Cân bằng \| standard \| 1\.000 \|/);
    const gates = stageGates(cells);
    expect(gates.map((gate) => gate.id)).toEqual([...GATE_IDS]);
    expect(gates.find((gate) => gate.id === "B9")!.status).toBe("skip");
    expect(gates.find((gate) => gate.id === "B3")!.status).toBe("skip");
    const lines: string[] = [];
    stageReport(cells, [{ bot: "standard", profile: measuredProfile(botById("standard"), deck) }], 2, (text) => lines.push(text));
    const text = lines.join("\n");
    expect(text).toContain("| B1 | Cùng vùng cuốn |");
    expect(text).toContain("| B9 | Khớp người thật | THIẾU SỐ |");
    expect(text).toContain("Đêm 1–" + STAGE_NIGHTS);
    expect(text).toMatch(/\| Chuẩn \| 35 \/ \d+\.\d \|/);
  });

  it("grades B1 and B7's director-off row on the 1B tight band when asked (the pooled sets, BUILD_1B §18.3)", () => {
    const summary = (bot: string, win: number, director = true): BotModeSummary => ({
      bot, mode: "balanced", director, runs: 240, win, s: 600, p: 250, i: 30, o: 0, n: 0.2, q: 600, support: null, killSeconds: null, stepsPerWave: 1.5, maxWaveSteps: 3, spawnMin: 900, spawnMax: 1100, learnOk: true,
    });
    const rows = [...["novice", "steady", "standard", "skilled", "sloppy", "fast"].map((bot) => summary(bot, bot === "steady" ? 900 : 830)), summary("standard", 890, false)];
    const cells: Cell[] = rows.map((s) => ({ bot: s.bot, mode: s.mode, director: s.director, k: 1, summary: s, records: [], boss: [], extra: [] }));
    const status = (bands?: typeof TIGHT_BANDS) => ["B1", "B7"].map((id) => stageGates(cells, bands).find((gate) => gate.id === id)!.status);
    expect(status()).toEqual(["pass", "pass"]); // BALANCE §3: 75–90 %
    expect(status(TIGHT_BANDS)).toEqual(["fail", "fail"]); // 1B: 78–88 %
  });
});
