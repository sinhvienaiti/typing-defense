/**
 * B9 "Khớp người thật" (docs/games/BALANCE.md §7, docs/td/BUILD_1B.md §22; R3 part B): the owner's play-test files
 * ("Chép số chơi thử", app/retry.ts playtestFile) against the bot with the same profile. A file holds the numbers the
 * page measured and the run itself (its header and whole log); the run is replayed on Node first and must reach the
 * page's hash, so the numbers are the run's own. Then a bot typing at the owner's measured E, a and CV (the standard
 * bot's habits, fair tactics, the cold start of Học) plays the same stage, mode and director setting over many seeds,
 * and the kit's B9 compares S, P, I, O, N and Q (each within 15 % of max(|human|, floor)).
 */
import { readFileSync } from "node:fs";
import { blendSkill, formatGates, pct, runGates, STANDARD_BOTS, summarizeRuns, type BandMode, type BotModeSummary, type GateResult, type HumanMatch, type SkillProfile } from "../../src/kit/balance";
import type { FlowSummary } from "../../src/kit/balance/flow";
import { fallbackDeck } from "../../src/app/vocab";
import type { Mode } from "../../src/content/types";
import type { Command } from "../../src/sim/commands";
import { hashHex } from "../../src/sim/hash";
import type { LearnHeader } from "../../src/sim/systems/learn";
import type { PaceHeader } from "../../src/sim/systems/pace";
import { createWorld, replayTo } from "../../src/sim/world";
import { playStage, record, type MatrixBot } from "./flow";
import { realDeck } from "./typing";

/** A play-test file: `run` is scripts/td/replay.ts's shape; a file from before R3 part B has the numbers only. */
export type PlaytestFile = {
  v?: number;
  numbers: { flow: FlowSummary; profile: SkillProfile; lives: number; dayNumber: number; stats: Record<string, number> };
  run?: { seed: number; sandbox: boolean; content: string; deck: string; vocabulary: string; expected: number; pace: PaceHeader; mode: Mode; learn: LearnHeader; tick: number; hash: string; log: Command[] };
};

/** The file's numbers, its old shape (the numbers alone) read the same. */
export const readPlaytest = (text: string): PlaytestFile => {
  const value = JSON.parse(text) as PlaytestFile | PlaytestFile["numbers"];
  return "numbers" in value ? value : { numbers: value };
};

/** The run replayed on Node: does it reach the page's hash at its last tick, with the same content and deck? */
export function replayPlaytest(file: PlaytestFile): { match: boolean; node: string; browser: string } | null {
  const run = file.run;
  if (run === undefined) return null;
  const deck = run.vocabulary === "fallback" ? fallbackDeck() : realDeck();
  const world = createWorld({ seed: run.seed, sandbox: run.sandbox, deck, expected: run.expected, pace: run.pace, mode: run.mode, learn: run.learn });
  replayTo(world, run.log, run.tick);
  const node = hashHex(world);
  return { match: world.c.hash === run.content && deck.hash === run.deck && world.tick === run.tick && node === run.hash, node, browser: run.hash };
}

/** The bot with the owner's measured E, a and CV (the standard bot's other habits, fair tactics). */
export function ownerBot(profile: SkillProfile): MatrixBot {
  const view = blendSkill(profile);
  const standard = STANDARD_BOTS.find((bot) => bot.id === "standard")!;
  return { id: "owner", spec: { ...standard, wpm: Math.round(view.e), accuracy: view.a, cv: view.cv }, tactics: "fair" };
}

export type B9Row = { label: string; replay: ReturnType<typeof replayPlaytest>; human: FlowSummary; lives: number; bot: BotModeSummary; match: HumanMatch };

/** One file against its bot over seeds 1..`seeds` (the run's mode as a band, Học's mode read as Thư giãn's band). */
export function b9Row(label: string, file: PlaytestFile, seeds: number): B9Row {
  const run = file.run;
  const mode: BandMode = run === undefined || run.mode === "learn" ? "relax" : run.mode;
  const bot = ownerBot(file.numbers.profile);
  const runs = Array.from({ length: seeds }, (_, k) => playStage(bot, mode, k + 1, realDeck(), run?.pace.director ?? true));
  const summary = summarizeRuns(bot.id, mode, runs.map(record), run?.pace.director ?? true);
  const human = file.numbers.flow;
  const values = (x: { s: number; p: number; i: number; o: number; n: number; q: number | null }) => ({ s: x.s, p: x.p, i: x.i, o: x.o, n: x.n, q: x.q });
  return { label, replay: replayPlaytest(file), human, lives: file.numbers.lives, bot: summary, match: { label, human: values(human), bot: values(summary) } };
}

/** The report (Markdown, Vietnamese): each file's replay, the human's run and the bot's §3 row, then the gate B9. */
export function b9Report(rows: readonly B9Row[], print: (text: string) => void): GateResult {
  print("| Ván | Chạy lại trên Node | Người: kết, mạng, S, P, I, O, N, Q | Bot cùng hồ sơ (E, a, CV): thắng, S, P, I, O, N, Q |");
  print("|---|---|---|---|");
  for (const r of rows) {
    const h = r.human;
    const b = r.bot;
    const replay = r.replay === null ? "không có nhật ký" : r.replay.match ? "khớp " + r.replay.node : "**lệch** " + r.replay.node + " ≠ " + r.replay.browser;
    const outcome = { won: "thắng", lost: "thua", quit: "dừng" }[h.outcome];
    print(`| ${r.label} | ${replay} | ${outcome}, ${r.lives} mạng, ${pct(h.s)}, ${pct(h.p)}, ${pct(h.i)}, ${pct(h.o)}, ${h.n.toFixed(1)}, ${pct(h.q)} | ${pct(b.win)}, ${pct(b.s)}, ${pct(b.p)}, ${pct(b.i)}, ${pct(b.o)}, ${b.n.toFixed(2)}, ${pct(b.q)} (${b.runs} ván) |`);
  }
  const gate = runGates({ summaries: [], options: { human: rows.filter((r) => r.replay === null || r.replay.match).map((r) => r.match) } }).find((g) => g.id === "B9")!;
  print("\n" + formatGates([gate]));
  return gate;
}

export const readFile = (path: string): PlaytestFile => readPlaytest(readFileSync(path, "utf8"));
