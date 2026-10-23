/**
 * The balance matrix of docs/games/BALANCE.md §3, §6, §7 for Lời Gọi (§9.2): each standard bot plays a stage (the
 * sandbox, nights 1–STAGE_NIGHTS, won when the last is held) in Thư giãn, Cân bằng and Thử thách over many seeds,
 * through the game's commands: a HumanTypist for the hands (tests/td/human.ts), the R3 plan for building and the
 * hero by tactics (good: the standard layout, the hero by day and night; fair: a looser layout; poor: a weak one,
 * the hero by day only; none: nothing bought). A bot's header is what the game would give it: its profile measured
 * at its own E, a and CV (a fully trusted sample; the no-type bot has none, so the mode's defaults), pace k from it,
 * the director on (and once off, for B7). Each run's FlowMeter summary, the directors' steps, the mean seconds from
 * spawn to kill and the learning gate fold into the kit's BotModeSummary; runGates scores B1–B9.
 */
import { BANDS, MODE_LABELS, blendSkill, botParams, formatGates, newSkillProfile, pct, runGates, skillAdvice, STANDARD_BOTS, summarizeRuns, updateSkill, type BandMode, type BotModeSummary, type BotSpec as KitBot, type GateResult, type RunRecord, type SkillProfile, type Tactics } from "../../src/kit/balance";
import { paceHeader, SkillTally } from "../../src/app/skill";
import { CALL, MODES } from "../../src/content/rules";
import type { Deck } from "../../src/typing/decks";
import type { World } from "../../src/sim/world";
import { runBot, type BotRun } from "./bot";
import { heroDay, heroNight } from "./policies/hero";
import { FAIR, GOOD, NONE, POOR } from "./policies/layouts";
import { Plan, type Layout, type Rule } from "./policies/stand";

/** A stage of Lời Gọi for the gates: nights 1–5 (BUILD_1A6 §12 gate 4 holds nights 1–4 apart). */
export const STAGE_NIGHTS = 5;
export const STAGE_MODES: readonly BandMode[] = ["relax", "balanced", "challenge"];

/** The plan a tactics level plays (BALANCE.md §6 "Chiến thuật"). */
export function tacticsPlan(tactics: Tactics): () => Plan {
  const plans: Record<Tactics, [Layout, Rule[]]> = {
    good: [GOOD, [heroDay(), heroNight()]],
    fair: [FAIR, [heroDay(), heroNight()]],
    poor: [POOR, [heroDay(), heroNight(120)]],
    none: [NONE, [heroDay(), heroNight()]],
  };
  const [layout, rules] = plans[tactics];
  return () => new Plan(layout, rules);
}

/** A row of the matrix: a standard bot, or a variant ("standard@good"). */
export type MatrixBot = { id: string; spec: KitBot; tactics: Tactics };

export const MATRIX_BOTS: readonly MatrixBot[] = [
  ...STANDARD_BOTS.map((spec) => ({ id: spec.id, spec, tactics: spec.tactics })),
  ...(["good", "poor"] as const).map((tactics) => ({ id: "standard@" + tactics, spec: STANDARD_BOTS.find((bot) => bot.id === "standard")!, tactics })),
];

/** The profile the game would hold for a bot: its E, a and CV measured with full trust; none for a bot that never types. */
export function botProfile(bot: MatrixBot, mode: BandMode): SkillProfile {
  const fresh = newSkillProfile(bot.spec.id === "child" ? "child" : "adult", mode);
  if (!(bot.spec.wpm > 0)) return fresh;
  const sample = { outcome: "won" as const, words: 60, wpm: bot.spec.wpm, keys: 400, correctKeys: Math.round(400 * bot.spec.accuracy), cv: bot.spec.cv };
  return updateSkill(fresh, sample).profile;
}

/**
 * BALANCE.md §7 B8, Lời Gọi's own learning gate (BUILD_1A6 §5.3, §7): typing never crowds out reading, i.e. over the
 * run the share of day and night spent typing stays within the attention budget's (the mode's typing seconds of
 * every 20; a single slow word may run a window over, the director cannot know it in advance), and no call
 * invariant broke (one bright word a call, first letters apart, the review book's quiz words), no command refused.
 */
export function learnOk(run: BotRun): boolean {
  const share = (run.typedTicks[0] + run.typedTicks[1]) / Math.max(1, run.phaseTicks[0] + run.phaseTicks[1]);
  return share <= MODES[run.world.mode].typeS / CALL.windowS && run.problems.length === 0 && run.rejected.length === 0;
}

export type MatrixOptions = { seeds: number; nights?: number; modes?: readonly BandMode[]; bots?: readonly MatrixBot[]; deck: Deck };

/** One stage: bot × mode × seed, the director on or off. */
export function playStage(bot: MatrixBot, mode: BandMode, seed: number, deck: Deck, director = true, nights = STAGE_NIGHTS, onTick?: (w: World) => void): BotRun {
  const header = paceHeader(botProfile(bot, mode), director);
  return runBot({
    onTick,
    seed, deck, mode, nights, check: true, hands: null, human: botParams(bot.spec, { tactics: bot.tactics }), botSeed: seed * 7919 + 13,
    expected: bot.spec.wpm > 0 ? header.expected : undefined, pace: { k: header.k, director }, plan: tacticsPlan(bot.tactics),
  });
}

export const record = (run: BotRun): RunRecord => ({ flow: run.flow, pace: run.pace, killSeconds: run.killSeconds ?? undefined, learnOk: learnOk(run) });

/** A matrix cell to play: the director's column is false only for B7's row. */
export type CellSpec = { bot: string; mode: BandMode; director: boolean };
export type Cell = CellSpec & { k: number; summary: BotModeSummary };

export const botById = (id: string): MatrixBot => MATRIX_BOTS.find((bot) => bot.id === id)!;

/** Every bot in every mode with the director on, and the standard bot in Cân bằng with it off (B7). */
export function matrixCells(modes: readonly BandMode[] = STAGE_MODES, bots: readonly MatrixBot[] = MATRIX_BOTS): CellSpec[] {
  const cells: CellSpec[] = modes.flatMap((mode) => bots.map((bot) => ({ bot: bot.id, mode, director: true })));
  if (modes.includes("balanced") && bots.some((bot) => bot.id === "standard")) cells.push({ bot: "standard", mode: "balanced", director: false });
  return cells;
}

/** Plays one cell over seeds from + 1 .. from + n (a second set of seeds checks the first). */
export function playCell(spec: CellSpec, seeds: number, deck: Deck, nights = STAGE_NIGHTS, from = 0): Cell {
  const bot = botById(spec.bot);
  const runs = Array.from({ length: seeds }, (_, k) => record(playStage(bot, spec.mode, from + k + 1, deck, spec.director, nights)));
  return { ...spec, k: paceHeader(botProfile(bot, spec.mode), spec.director).k, summary: summarizeRuns(bot.id, spec.mode, runs, spec.director) };
}

export const playMatrix = (options: MatrixOptions): Cell[] => matrixCells(options.modes, options.bots).map((spec) => playCell(spec, options.seeds, options.deck, options.nights));

/** B1–B9 for Lời Gọi: the no-type bot may hold Thư giãn (BUILD_1A6's own design, BALANCE.md §7 B5). */
export const stageGates = (cells: readonly Cell[]): GateResult[] => runGates({ summaries: cells.map((c) => c.summary), options: { noTypeExempt: ["relax"] } });

/**
 * The profile a bot leaves when the game measures it (app/skill.ts SkillTally on its words, each day and night folded
 * by updateSkill): one stage in Cân bằng, the director off. Its E, a and CV against the bot's own (B9 is read the same way).
 */
export function measuredProfile(bot: MatrixBot, deck: Deck, seed = 101): SkillProfile {
  let profile = newSkillProfile("adult", "balanced");
  let tally: SkillTally | null = null;
  playStage(bot, "balanced", seed, deck, false, STAGE_NIGHTS, (w) => {
    tally ??= new SkillTally(w);
    const sample = tally.read(w.events.rare, w);
    if (sample !== null) profile = updateSkill(profile, sample).profile;
  });
  return profile;
}

const num = (value: number | null, digits = 1): string => (value === null ? "—" : value.toFixed(digits));

/** The BALANCE.md §3 table: one row per bot × mode (the director's column says off for the B7 row). */
export function metricsTable(cells: readonly Cell[]): string[] {
  const lines = [
    "| Chế độ | Bot | k | Thắng | Biên S | Áp lực P | Nhàn I | Ngộp O | Gần thua N | Quãng Q | Phe ta | Hạ quái (s) | Bậc/đợt | Khoảng sinh | Học |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const c of cells) {
    const s = c.summary;
    const band = BANDS[c.mode];
    const mark = (value: number | null, metric: "win" | "s" | "p" | "i" | "o" | "q"): string => {
      const range = band[metric];
      const off = value !== null && ((range.min !== undefined && value < range.min) || (range.max !== undefined && value > range.max));
      return off ? "**" + pct(value) + "**" : pct(value);
    };
    lines.push(`| ${MODE_LABELS[c.mode]}${c.director ? "" : " (tắt nhịp)"} | ${c.bot} | ${c.k.toFixed(3)} | ${mark(s.win, "win")} | ${mark(s.s, "s")} | ${mark(s.p, "p")} | ${mark(s.i, "i")} | ${mark(s.o, "o")} | ${num(s.n, 2)} | ${mark(s.q, "q")} | ${pct(s.support)} | ${num(s.killSeconds)} | ${num(s.stepsPerWave, 2)} | ${s.spawnMin === null ? "—" : pct(s.spawnMin) + "–" + pct(s.spawnMax)} | ${s.learnOk === null ? "—" : s.learnOk ? "đạt" : "trượt"} |`);
  }
  return lines;
}

export { formatGates };

const LABEL: Record<string, string> = Object.fromEntries(STANDARD_BOTS.map((bot) => [bot.id, bot.label]));

/** The stage part of `pnpm td:balance` (BALANCE.md §3, §7; Markdown, Vietnamese): the bots, the §3 table, B1–B9, the measured profiles. */
export function stageReport(cells: readonly Cell[], measured: readonly { bot: string; profile: SkillProfile }[], seeds: number, print: (text: string) => void, from = 0): GateResult[] {
  const gates = stageGates(cells);
  print(`## Lời Gọi: cân bằng nhiều yếu tố (BALANCE.md §3, §7, §9.2; seed ${from + 1}–${from + seeds}, Đêm 1–${STAGE_NIGHTS}, sandbox, từ vựng thật)\n`);
  print("Bộ bot chuẩn (BALANCE.md §6) chơi qua lệnh của game: tay là `HumanTypist` (tốc E, độ chuẩn a, CV log-normal, nhận từ theo độ quen, bỏ khóa, phản xạ Bắn mạnh), kế hoạch xây và Tướng là kế hoạch R3 theo chiến thuật (Tốt, Vừa: bố cục chuẩn, Tướng Ngày và Đêm; Kém: Ruộng cạnh Lũy, Mỏ N2, Trại Lính muộn, Tướng Đêm nhìn chậm; Không mua: không xây). Đầu ván mỗi bot có hồ sơ đo đúng E, a, CV của nó (bot Không gõ: chưa đo, mức mặc định), nhịp k từ hồ sơ, bộ điều nhịp bật (một hàng tắt cho B7). Thắng: giữ được Đêm " + STAGE_NIGHTS + ". In đậm: ngoài dải đích §3 của chế độ.\n");
  print(metricsTable(cells).join("\n"));
  print("\n### Cổng B1–B9\n");
  print(formatGates(gates));
  if (measured.length === 0) return gates;
  print("\n### Hồ sơ game đo được (một ải Cân bằng, tắt nhịp, `SkillTally` sau mỗi ngày đêm)\n");
  print("| Bot | E (đặt / đo) | a (đặt / đo) | CV (đặt / đo) | Nhận từ mới (s) | Lời khuyên |");
  print("|---|---|---|---|---|---|");
  for (const { bot, profile } of measured) {
    const spec = botById(bot).spec;
    const view = blendSkill(profile);
    print(`| ${LABEL[bot] ?? bot} | ${spec.wpm} / ${view.e.toFixed(1)} | ${pct(Math.round(spec.accuracy * 1000))} / ${pct(Math.round(view.a * 1000))} | ${spec.cv.toFixed(2)} / ${view.cv.toFixed(2)} | ${view.recognize.new.toFixed(2)} | ${skillAdvice(view)} |`);
  }
  return gates;
}
