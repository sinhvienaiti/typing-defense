import { describe, expect, it } from "vitest";
import { GATE_IDS, STANDARD_BOTS, type BotModeSummary } from "../src/kit/balance";
import { STAT } from "../src/sim/stats";
import { paceSummary } from "./td/bot";
import { emptyBossRun, type BossRun } from "./td/boss-probe";
import { bossGates, bossGateValues, botById, learnHeader, learnOk, learnStore, MATRIX_BOTS, matrixCells, measuredProfile, metricsTable, playCell, playStage, stageGates, stageReport, STAGE_NIGHTS, TIGHT_BANDS, type Cell } from "./td/flow";
import { realDeck } from "./td/typing";

/**
 * The stage matrix of `pnpm td:balance` (docs/games/BALANCE.md §3, §6, §7; tests/td/flow.ts): the bots play through
 * the game's commands with a human-like typist, a run's flow and pace fold into the kit's summaries, and the report
 * prints the §3 table and B1–B9. The full matrix (≥ 20 seeds) runs in the report; here a small one checks the wiring.
 */
describe("the stage matrix and its report (BALANCE.md §3, §7)", () => {
  const deck = realDeck();

  it("has every standard bot, the tactics pair for B6, every mode, and the director off once for B7", () => {
    expect(MATRIX_BOTS.map((bot) => bot.id)).toEqual([...STANDARD_BOTS.map((bot) => bot.id), "standard@good", "standard@poor", "no-type@kite", "standard@book20"]);
    const cells = matrixCells();
    // The kite (B5, BUILD_1B §18.1) plays Cân bằng and Thử thách only; R3's 20-word book Cân bằng only.
    expect(cells.length).toBe(3 * MATRIX_BOTS.length + 1 - 1 - 2);
    expect(cells.filter((cell) => cell.bot === "no-type@kite").map((cell) => cell.mode)).toEqual(["balanced", "challenge"]);
    expect(cells.filter((cell) => cell.bot === "standard@book20").map((cell) => cell.mode)).toEqual(["balanced"]);
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

  it("plays Học as the page plans it (R3, BUILD_1B §18.1): the cold start deals fresh words, the 20-word book brings Từ Ôn back; B8 R3 holds (≤ 8 fresh, none in a call that runs out or on the boss night)", { timeout: 30_000 }, () => {
    const cold = learnHeader("empty", deck, 1);
    expect([cold.book.length, cold.due.length, cold.fresh.length]).toEqual([0, 0, 24]);
    expect(cold.fresh.every((id) => deck.level[deck.ids.indexOf(id)] === 3)).toBe(true);
    const store = learnStore("book20", deck);
    const book = learnHeader("book20", deck, 1);
    expect([store.book.length, book.book.length, book.due.length, new Set(store.book).size]).toEqual([20, 20, 20, 20]);
    expect(store.book.every((id) => deck.level[deck.ids.indexOf(id)]! <= 3)).toBe(true);
    expect(book.fresh.some((id) => store.seen[id] !== undefined)).toBe(false);
    const runs = [playStage(botById("standard"), "balanced", 1, deck, true, 2), playStage(botById("standard@book20"), "balanced", 1, deck, true, 2)];
    expect(runs.map((run) => run.learn)).toEqual([cold, book]);
    expect(runs[0]!.stats.freshWords).toBeGreaterThan(0);
    expect(runs[1]!.stats.reviewBack).toBeGreaterThan(0);
    for (const run of runs) expect([run.stats.freshWords <= 8, run.timedFresh, learnOk(run)]).toEqual([true, 0, true]);
    // The check sees a word the plan dealt: every fresh word dealt left the plan's list at the tick its card came.
    for (const run of runs) expect([Array.from(run.world.learn.fresh).filter((word) => word < 0).length, run.freshSeen]).toEqual([run.stats.freshWords, run.stats.freshWords]);
    expect(learnOk({ ...runs[0]!, timedFresh: 1 })).toBe(false);
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

  it("reads the tight Biên S (40–60 %) on the standard bot only; the other bots keep BALANCE §3's 35–65 % (R2 review fix)", () => {
    const summary = (bot: string, s: number, director = true): BotModeSummary => ({
      bot, mode: "balanced", director, runs: 240, win: 830, s, p: 250, i: 30, o: 0, n: 0.2, q: 600, support: null, killSeconds: null, stepsPerWave: 1.5, maxWaveSteps: 3, spawnMin: 900, spawnMax: 1100, learnOk: true,
    });
    const cells = (standardS: number): Cell[] =>
      [...["novice", "steady", "standard", "skilled", "sloppy", "fast"].map((bot) => summary(bot, bot === "standard" ? standardS : bot === "novice" ? 350 : 650)), summary("standard", standardS, false)]
        .map((s) => ({ bot: s.bot, mode: s.mode, director: s.director, k: 1, summary: s, records: [], boss: [], extra: [] }));
    const status = (standardS: number) => ["B1", "B7"].map((id) => stageGates(cells(standardS), TIGHT_BANDS).find((gate) => gate.id === id)!.status);
    expect(status(550)).toEqual(["pass", "pass"]); // others at 35 % and 65 %: inside §3
    expect(status(650)).toEqual(["fail", "fail"]); // the standard bot past 60 %
  });

  it("grades G3 and G8 on the standard bot's boss runs, each seed set and the pool (R2 review fix 2)", () => {
    // A run: risen at tick 0, first hit `hit` s later, retreated `engage` s after it (or not), idle share `idle`.
    const run = (hit: number, engage: number | null, idle = 0.01): BossRun => ({
      ...emptyBossRun(), reached: true, retreated: engage !== null, rise: 0, firstHit: hit * 60, retreat: engage === null ? -1 : (hit + engage) * 60, fed: 1000, idle: idle * 1000,
    });
    const cell = (boss: BossRun[]): Cell => ({ bot: "standard", mode: "balanced", director: true, k: 1, summary: {} as BotModeSummary, records: [], boss, extra: [] });
    const [one, two] = [cell([run(24, 46), run(24, 48), run(25, null)]), cell([run(24, 44), run(23, 44.5), run(24, 47)])];
    expect(bossGateValues([one])).toMatchObject({ engage: 47, firstHit: 24, g3: true, g8: true });
    expect(bossGateValues([two])!.g3).toBe(false); // 44.5 s: under 45 s
    expect(bossGates([one])).toMatch(/^G3 .*: 47,0 s: đạt\. G8 .*: 24,0 s, 1,0 %: đạt\.$/);
    const pooled = cell([...one.boss, ...two.boss]);
    expect(bossGates([pooled], [[one], [two]])).toMatch(/G3 .*bộ 1 47,0 s \/ bộ 2 44,5 s \/ gộp 46,0 s: \*\*trượt\*\*\./);
    expect(bossGateValues([cell([run(36, 50)])])!.g8).toBe(false); // first hit past 35 s
    expect(bossGateValues([cell([run(20, 50, 0.12)])])!.g8).toBe(false); // Nhàn I past Cân bằng's 10 %
    expect(bossGates([cell([])])).toContain("—");
    expect(bossGates([])).toBe(""); // the standard bot not played
  });
});
