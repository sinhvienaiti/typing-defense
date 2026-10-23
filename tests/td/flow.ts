/**
 * The balance matrix of docs/games/BALANCE.md §3, §6, §7 for Lời Gọi (§9.2): each standard bot plays the story stage
 * (map 1, nights 1–STAGE_NIGHTS with the unlock days, won when Mộc Tinh retreats: docs/td/BUILD_1B.md §18) in Thư giãn,
 * Cân bằng and Thử thách over many seeds,
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
import type { BossRun } from "./boss-probe";
import { runBot, type BotRun } from "./bot";
import { bossArcher, heroBoss, heroKite } from "./policies/boss";
import { heroDay, heroNight } from "./policies/hero";
import { FAIR, GOOD, NONE, POOR } from "./policies/layouts";
import { Plan, type Layout, type Rule } from "./policies/stand";

/** A stage of Lời Gọi for the gates: nights 1–5 (BUILD_1A6 §12 gate 4 holds nights 1–4 apart). */
export const STAGE_NIGHTS = 5;
export const STAGE_MODES: readonly BandMode[] = ["relax", "balanced", "challenge"];

/**
 * The plan a tactics level plays (BALANCE.md §6 "Chiến thuật"; BUILD_1B §18.1: at the boss peak the hero goes where
 * the boss comes next, a good player's to the cannon first and with a Tháp Cung added by the warned branch on day 5;
 * `kite`: the no-type check with the hero kiting the boss).
 */
export function tacticsPlan(tactics: Tactics, kite = false): () => Plan {
  const plans: Record<Tactics, [Layout, Rule[]]> = {
    good: [GOOD, [heroDay(), heroNight(), bossArcher(), kite ? heroKite() : heroBoss(30, true)]],
    fair: [FAIR, [heroDay(), heroNight(), heroBoss()]],
    poor: [POOR, [heroDay(), heroNight(120), heroBoss(120)]],
    none: [NONE, [heroDay(), heroNight(), heroBoss()]],
  };
  const [layout, rules] = plans[tactics];
  return () => new Plan(layout, rules);
}

/** A row of the matrix: a standard bot, or a variant ("standard@good"; "no-type@kite", B5's strongest no-type play). */
export type MatrixBot = { id: string; spec: KitBot; tactics: Tactics; kite?: boolean };

export const KITE = "no-type@kite";

export const MATRIX_BOTS: readonly MatrixBot[] = [
  ...STANDARD_BOTS.map((spec) => ({ id: spec.id, spec, tactics: spec.tactics })),
  ...(["good", "poor"] as const).map((tactics) => ({ id: "standard@" + tactics, spec: STANDARD_BOTS.find((bot) => bot.id === "standard")!, tactics })),
  { id: KITE, spec: STANDARD_BOTS.find((bot) => bot.id === "no-type")!, tactics: "good", kite: true },
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
    onTick, sandbox: false,
    seed, deck, mode, nights, check: true, hands: null, human: botParams(bot.spec, { tactics: bot.tactics }), botSeed: seed * 7919 + 13,
    expected: bot.spec.wpm > 0 ? header.expected : undefined, pace: { k: header.k, director }, plan: tacticsPlan(bot.tactics, bot.kite),
  });
}

export const record = (run: BotRun): RunRecord => ({ flow: run.flow, pace: run.pace, killSeconds: run.killSeconds ?? undefined, learnOk: learnOk(run) });

/** A matrix cell to play: the director's column is false only for B7's row. */
export type CellSpec = { bot: string; mode: BandMode; director: boolean };
/** Its runs (to pool two seed sets, BUILD_1B §6.4) and their boss peaks. */
export type Cell = CellSpec & { k: number; summary: BotModeSummary; records: RunRecord[]; boss: BossRun[] };

export const botById = (id: string): MatrixBot => MATRIX_BOTS.find((bot) => bot.id === id)!;

/** Every bot in every mode with the director on (the kite in Cân bằng and Thử thách: BUILD_1B §18.1), and the standard bot in Cân bằng with it off (B7). */
export function matrixCells(modes: readonly BandMode[] = STAGE_MODES, bots: readonly MatrixBot[] = MATRIX_BOTS): CellSpec[] {
  const cells: CellSpec[] = modes.flatMap((mode) => bots.filter((bot) => !bot.kite || mode !== "relax").map((bot) => ({ bot: bot.id, mode, director: true })));
  if (modes.includes("balanced") && bots.some((bot) => bot.id === "standard")) cells.push({ bot: "standard", mode: "balanced", director: false });
  return cells;
}

/** Plays one cell over seeds from + 1 .. from + n (a second set of seeds checks the first). */
export function playCell(spec: CellSpec, seeds: number, deck: Deck, nights = STAGE_NIGHTS, from = 0): Cell {
  const bot = botById(spec.bot);
  const runs = Array.from({ length: seeds }, (_, k) => playStage(bot, spec.mode, from + k + 1, deck, spec.director, nights));
  const records = runs.map(record);
  return { ...spec, k: paceHeader(botProfile(bot, spec.mode), spec.director).k, summary: summarizeRuns(bot.id, spec.mode, records, spec.director), records, boss: runs.map((run) => run.boss) };
}

export const playMatrix = (options: MatrixOptions): Cell[] => matrixCells(options.modes, options.bots).map((spec) => playCell(spec, options.seeds, options.deck, options.nights));

/** The same cells of several seed sets as one (BUILD_1B §6.4: the tight targets read two sets pooled). */
export function poolCells(sets: readonly (readonly Cell[])[]): Cell[] {
  return sets[0]!.map((first) => {
    const same = sets.map((cells) => cells.find((c) => c.bot === first.bot && c.mode === first.mode && c.director === first.director)!);
    const records = same.flatMap((c) => c.records);
    return { ...first, records, boss: same.flatMap((c) => c.boss), summary: summarizeRuns(first.bot, first.mode, records, first.director) };
  });
}

/**
 * B1–B9 for Lời Gọi: the no-type bot may hold Thư giãn (BUILD_1A6's own design, BALANCE.md §7 B5); B5 also asks the
 * no-type bot kiting the boss with Draconis never to win, nor to make it retreat (BUILD_1B §18.3).
 */
export function stageGates(cells: readonly Cell[]): GateResult[] {
  const gates = runGates({ summaries: cells.map((c) => c.summary), options: { noTypeExempt: ["relax"] } });
  const kites = cells.filter((c) => c.bot === KITE);
  if (kites.length === 0) return gates;
  return gates.map((gate) => {
    if (gate.id !== "B5") return gate;
    const checks = [...gate.checks, ...kites.map((c) => {
      const retreats = c.boss.filter((b) => b.retreated).length;
      return { label: KITE + " · " + MODE_LABELS[c.mode], measured: "thắng " + pct(c.summary.win) + ", boss rút " + retreats + "/" + c.boss.length, threshold: "0 %, không lần rút nào", pass: c.summary.win === 0 && retreats === 0 };
    })];
    return { ...gate, checks, status: gate.missing.length > 0 ? "skip" : checks.every((check) => check.pass) ? "pass" : "fail" };
  });
}

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

const median = (values: readonly number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};
const share = (part: number, whole: number): string => (whole > 0 ? Math.round((100 * part) / whole) + " %" : "—");
const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/**
 * The boss table (BUILD_1B §18.2): runs that reached the peak; how many made it retreat; rise → first hit and first
 * hit → retreat (s, p50, G8 and G3); the share of its road walked at the retreat; lives lost in the peak (escort,
 * Mầm Gỗ, blows on the Bastion); its damage typed and by Draconis' own fireballs; buildings rooted a run; attack
 * buildings stunned while it was in their reach; Nhàn I from the lull's end on.
 */
export function bossTable(cells: readonly Cell[]): string[] {
  const lines = [
    "| Chế độ | Bot | Tới boss | Boss rút | Trồi → trúng đầu p50 (s) | Giao chiến p50 (s) | % đường lúc rút p50 | Mạng mất ở đỉnh p50 | Phần gõ | Phần Draconis | Nhà tê / ván | Tháp tê khi boss trong tầm | Nhàn I đỉnh boss |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const c of cells) {
    if (!c.director) continue;
    const reached = c.boss.filter((b) => b.reached);
    const retreated = reached.filter((b) => b.retreated);
    const num1 = (value: number | null): string => (value === null ? "—" : value.toFixed(1));
    lines.push(`| ${MODE_LABELS[c.mode]} | ${c.bot} | ${reached.length}/${c.boss.length} | ${share(retreated.length, reached.length)} | ${num1(median(reached.filter((b) => b.firstHit >= 0).map((b) => (b.firstHit - b.rise) / 60)))} | ${num1(median(retreated.map((b) => (b.retreat - b.firstHit) / 60)))} | ${share(median(retreated.map((b) => b.pathAt)) ?? 0, retreated.length > 0 ? 1 : 0)} | ${num1(median(reached.map((b) => b.livesAtLull - b.livesEnd)))} | ${share(sum(reached.map((b) => b.typed)), sum(reached.map((b) => b.damage)))} | ${share(sum(reached.map((b) => b.hero)), sum(reached.map((b) => b.damage)))} | ${num1(reached.length > 0 ? sum(reached.map((b) => b.roots)) / reached.length : null)} | ${share(sum(reached.map((b) => b.stunned)), sum(reached.map((b) => b.inReach)))} | ${share(sum(reached.map((b) => b.idle)), sum(reached.map((b) => b.fed)))} |`);
  }
  return lines;
}

/** Two numbers apart (BUILD_1B §18.2): lives before the peak p50, S of the won runs p50, runs lost to the boss and before it. */
export function splitTable(cells: readonly Cell[]): string[] {
  const lines = ["| Chế độ | Bot | Mạng trước đỉnh boss p50 | S ván thắng p50 | Thua do boss | Thua trước boss |", "|---|---|---|---|---|---|"];
  for (const c of cells) {
    if (!c.director) continue;
    const runs = c.records.map((r, k) => ({ flow: r.flow, boss: c.boss[k]! }));
    const lost = runs.filter((r) => r.flow.outcome === "lost");
    const s = median(runs.filter((r) => r.flow.outcome === "won").map((r) => r.flow.s));
    lines.push(`| ${MODE_LABELS[c.mode]} | ${c.bot} | ${median(runs.filter((r) => r.boss.reached).map((r) => r.boss.livesAtLull)) ?? "—"} | ${s === null ? "—" : pct(Math.round(s))} | ${share(lost.filter((r) => r.boss.reached).length, runs.length)} | ${share(lost.filter((r) => !r.boss.reached).length, runs.length)} |`);
  }
  return lines;
}

/** Win and Biên S by seed set and pooled (BUILD_1B §6.4: the tight targets in Cân bằng read the pooled column). */
export function tightTable(sets: readonly (readonly Cell[])[], pooled: readonly Cell[]): string[] {
  const head = sets.map((_, k) => "bộ " + (k + 1));
  const lines = [`| Chế độ | Bot | Thắng ${head.join(" / ")} / gộp | Biên S ${head.join(" / ")} / gộp | Đích chặt 1B (gộp) |`, "|---|---|---|---|---|"];
  for (const c of pooled) {
    if (!c.director) continue;
    const rows = [...sets.map((cells) => cells.find((x) => x.bot === c.bot && x.mode === c.mode && x.director)!.summary), c.summary];
    const tight = c.mode === "balanced" && !c.bot.startsWith("no-type") && c.bot !== "child" && c.bot !== "type-only" && !c.bot.includes("@");
    const ok = c.summary.win >= 780 && c.summary.win <= 880 && c.summary.s >= 400 && c.summary.s <= 600;
    lines.push(`| ${MODE_LABELS[c.mode]} | ${c.bot} | ${rows.map((r) => pct(r.win)).join(" / ")} | ${rows.map((r) => pct(r.s)).join(" / ")} | ${tight ? (ok ? "đạt" : "**trượt**") + " (78–88 %, 40–60 %)" : "—"} |`);
  }
  return lines;
}

const LABEL: Record<string, string> = Object.fromEntries(STANDARD_BOTS.map((bot) => [bot.id, bot.label]));

/** The stage part of `pnpm td:balance` (BALANCE.md §3, §7; Markdown, Vietnamese): the bots, the §3 table, B1–B9, the measured profiles. */
export function stageReport(cells: readonly Cell[], measured: readonly { bot: string; profile: SkillProfile }[], seeds: number, print: (text: string) => void, from = 0): GateResult[] {
  const gates = stageGates(cells);
  print(`## Lời Gọi: cân bằng nhiều yếu tố (BALANCE.md §3, §7, §9.2; seed ${from + 1}–${from + seeds}, ải truyện bản đồ 1, Đêm 1–${STAGE_NIGHTS} và Mộc Tinh, từ vựng thật)\n`);
  print("Bộ bot chuẩn (BALANCE.md §6) chơi qua lệnh của game: tay là `HumanTypist` (tốc E, độ chuẩn a, CV log-normal, nhận từ theo độ quen, bỏ khóa, phản xạ Bắn mạnh), kế hoạch xây và Tướng là kế hoạch R3 theo chiến thuật (Tốt, Vừa: bố cục chuẩn, Tướng Ngày và Đêm; Kém: Ruộng cạnh Lũy, Mỏ N2, Trại Lính muộn, Tướng Đêm nhìn chậm; Không mua: không xây). Đầu ván mỗi bot có hồ sơ đo đúng E, a, CV của nó (bot Không gõ: chưa đo, mức mặc định), nhịp k từ hồ sơ, bộ điều nhịp bật (một hàng tắt cho B7). Ải truyện theo lịch mở (BUILD_1B §12), Lũy nâng bằng lệnh thật; ở đỉnh boss Tướng tới nhà đánh boss sắp vào tầm (Tốt: Tháp Pháo trước, thêm Tháp Cung bên nhánh boss ở Ngày 5); hàng `no-type@kite`: bot Không gõ thả Draconis đuổi boss (B5). Thắng: Mộc Tinh rút lui ở cuối Đêm " + STAGE_NIGHTS + ". In đậm: ngoài dải đích §3 của chế độ.\n");
  print(metricsTable(cells).join("\n"));
  print("\n### Cổng B1–B9\n");
  print(formatGates(gates));
  print("\n### Đỉnh boss Mộc Tinh (BUILD_1B §18.2)\n");
  print(bossTable(cells).join("\n"));
  print("\n### Tách hai số: thắng do boss, Biên S do các đêm trước (BUILD_1B §6)\n");
  print(splitTable(cells).join("\n"));
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
