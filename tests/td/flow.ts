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
import { CALL_KIND } from "../../src/sim/stores/calls";
import type { Deck } from "../../src/typing/decks";
import type { World } from "../../src/sim/world";
import { bossDps, type BossRun } from "./boss-probe";
import { runBot, type BotRun } from "./bot";
import { bossArcher, heroBoss, heroKite } from "./policies/boss";
import { heroDay, heroNight } from "./policies/hero";
import { FAIR, GOOD, NONE, POOR } from "./policies/layouts";
import { Plan, type Layout, type Rule } from "./policies/stand";
import { dodgeRoots, ultRule } from "./policies/ult";

/** A stage of Lời Gọi for the gates: nights 1–5 (BUILD_1A6 §12 gate 4 holds nights 1–4 apart). */
export const STAGE_NIGHTS = 5;
export const STAGE_MODES: readonly BandMode[] = ["relax", "balanced", "challenge"];

/**
 * The plan a tactics level plays (BALANCE.md §6 "Chiến thuật"; BUILD_1B §18.1: at the boss peak the hero goes where
 * the boss comes next, a good player's to the cannon first and with a Tháp Cung added by the warned branch on day 5;
 * `kite`: the no-type check with the hero kiting the boss).
 */
export function tacticsPlan(tactics: Tactics, kite = false): () => Plan {
  // R2 (§18.1): Tối Thượng by the bots' rule (a poor player's as soon as it is full); a good player's helpers dodge Rễ Trồi.
  const plans: Record<Tactics, [Layout, Rule[]]> = {
    good: [GOOD, [heroDay(), heroNight(), bossArcher(), kite ? heroKite() : heroBoss(30, true), ultRule(), dodgeRoots()]],
    fair: [FAIR, [heroDay(), heroNight(), heroBoss(), ultRule()]],
    poor: [POOR, [heroDay(), heroNight(120), heroBoss(120), ultRule(true)]],
    none: [NONE, [heroDay(), heroNight(), heroBoss(), ultRule()]],
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
/**
 * A run's night share with nothing to type and its fullest 20 s window in seconds (1B R1 review); R2 (§18.2): Tối Thượng's
 * casts and damage (on the boss, in all), all damage and the boss's, direct words typed and mechanics let run, words typed,
 * direct calls made (a drum with 2 calls open gets none), the most direct calls open at once without the boss and with it,
 * typing ticks and ticks of nights 1–4, of night 4 (the Tanuki's) and of night 5.
 */
export type RunExtra = {
  empty: number; window: number; casts: number; ultBoss: number; ultAll: number; boss: number; all: number; direct: number; missed: number; words: number;
  calls: number; directMax: number; directMaxBoss: number; n14: [number, number]; n4: [number, number]; n5: [number, number];
};

/** The R2 part of a run's extra. */
function r2Extra(run: BotRun): Omit<RunExtra, "empty" | "window"> {
  const s = run.stats;
  const nights = (from: number, to: number): [number, number] => [sum(run.byDay.slice(from, to + 1).map((d) => d?.nightTyped ?? 0)), sum(run.byDay.slice(from, to + 1).map((d) => d?.nightTicks ?? 0))];
  return {
    casts: s.ultCasts, ultBoss: s.bossUlt, ultAll: s.damageUlt, boss: s.bossDamage, all: s.damageTower + s.damageCrossbow + s.damageSoldier + s.damageWordShot + s.damageHero + s.damageUlt,
    direct: s.directOk, missed: s.directMissed, words: s.callWords, calls: run.callsByKind[CALL_KIND.direct]?.made ?? 0, directMax: run.directMax, directMaxBoss: run.directMaxBoss,
    n14: nights(1, 4), n4: nights(4, 4), n5: nights(5, 5),
  };
}
/** Its runs (to pool two seed sets, BUILD_1B §6.4), their boss peaks and extras. */
export type Cell = CellSpec & { k: number; summary: BotModeSummary; records: RunRecord[]; boss: BossRun[]; extra: RunExtra[] };

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
  const extra = runs.map((run) => ({ empty: run.emptyTicks[1] / Math.max(1, run.phaseTicks[1]), window: run.windowMax / 60, ...r2Extra(run) }));
  return { ...spec, k: paceHeader(botProfile(bot, spec.mode), spec.director).k, summary: summarizeRuns(bot.id, spec.mode, records, spec.director), records, boss: runs.map((run) => run.boss), extra };
}

export const playMatrix = (options: MatrixOptions): Cell[] => matrixCells(options.modes, options.bots).map((spec) => playCell(spec, options.seeds, options.deck, options.nights));

/** The same cells of several seed sets as one (BUILD_1B §6.4: the tight targets read two sets pooled). */
export function poolCells(sets: readonly (readonly Cell[])[]): Cell[] {
  return sets[0]!.map((first) => {
    const same = sets.map((cells) => cells.find((c) => c.bot === first.bot && c.mode === first.mode && c.director === first.director)!);
    const records = same.flatMap((c) => c.records);
    return { ...first, records, boss: same.flatMap((c) => c.boss), extra: same.flatMap((c) => c.extra), summary: summarizeRuns(first.bot, first.mode, records, first.director) };
  });
}

/**
 * BUILD_1B §6.4, §18.3: the 1B tight targets of Cân bằng, read on the pooled seed sets for B1 and for B7's director-off
 * row; each set alone keeps BALANCE §3's bands. Win 78–88 % for every bot (P, I, O as §3). Biên S (R2 review fix, chosen
 * as proposed in BUILD_NOTES §7.3): 40–60 % for the standard bot (TIGHT_S, B1 and B7's row), BALANCE §3's 35–65 % for
 * the others, so a skill that shows in the lives left is allowed within the shared band, never past it.
 */
export const TIGHT_BANDS: typeof BANDS = { ...BANDS, balanced: { ...BANDS.balanced, win: { min: 780, max: 880 } } };
export const TIGHT_S = { min: 400, max: 600 } as const;

/** The tight Biên S check of the standard bot (director on for B1, off for B7). */
function tightS(cells: readonly Cell[], director: boolean): { label: string; measured: string; threshold: string; pass: boolean }[] {
  const c = cells.find((x) => x.bot === "standard" && x.mode === "balanced" && x.director === director);
  if (c === undefined) return [];
  const s = c.summary.s;
  return [{ label: "standard" + (director ? "" : " · tắt nhịp") + " · Biên S chặt (gộp)", measured: pct(s), threshold: "40–60 %", pass: s >= TIGHT_S.min && s <= TIGHT_S.max }];
}

/**
 * B1–B9 for Lời Gọi: the no-type bot may hold Thư giãn (BUILD_1A6's own design, BALANCE.md §7 B5); B5 also asks the
 * no-type bot kiting the boss with Draconis never to win, nor to make it retreat (BUILD_1B §18.3). `bands` grades B1
 * and B7 (TIGHT_BANDS on the pooled sets, with the standard bot's tight Biên S added).
 */
export function stageGates(cells: readonly Cell[], bands: typeof BANDS = BANDS): GateResult[] {
  const gates = runGates({ summaries: cells.map((c) => c.summary), options: { noTypeExempt: ["relax"], bands } });
  const kites = cells.filter((c) => c.bot === KITE);
  const tight = bands === TIGHT_BANDS;
  // B4's other half (BUILD_1B §18.3, 1B R1 review): the standard bot brings the boss down faster than the sloppy one (its damage a second, p50).
  const dps = (bot: string) => median(cells.find((c) => c.bot === bot && c.mode === "balanced" && c.director)?.boss.filter((b) => b.reached).map(bossDps) ?? []);
  const [standard, sloppy] = [dps("standard"), dps("sloppy")];
  const extra: Record<string, { label: string; measured: string; threshold: string; pass: boolean }[]> = {
    B1: tight ? tightS(cells, true) : [],
    B4: standard === null || sloppy === null ? [] : [{ label: "Hạ boss: sát thương/s lên boss p50, Chuẩn vs Ẩu (Cân bằng)", measured: standard.toFixed(1) + " vs " + sloppy.toFixed(1), threshold: "Chuẩn > Ẩu", pass: standard > sloppy }],
    B5: kites.map((c) => {
      const retreats = c.boss.filter((b) => b.retreated).length;
      return { label: KITE + " · " + MODE_LABELS[c.mode], measured: "thắng " + pct(c.summary.win) + ", boss rút " + retreats + "/" + c.boss.length, threshold: "0 %, không lần rút nào", pass: c.summary.win === 0 && retreats === 0 };
    }),
    B7: tight ? tightS(cells, false) : [],
  };
  return gates.map((gate) => {
    if ((extra[gate.id] ?? []).length === 0) return gate;
    const checks = [...gate.checks, ...extra[gate.id]!];
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
    "| Chế độ | Bot | k | Thắng | Biên S | Áp lực P | Nhàn I | Ngộp O | Gần thua N | Quãng Q | Rỗi Đêm | Phe ta | Hạ quái (s) | Bậc/đợt | Khoảng sinh | Học |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const c of cells) {
    const s = c.summary;
    const band = BANDS[c.mode];
    const mark = (value: number | null, metric: "win" | "s" | "p" | "i" | "o" | "q"): string => {
      const range = band[metric];
      const off = value !== null && ((range.min !== undefined && value < range.min) || (range.max !== undefined && value > range.max));
      return off ? "**" + pct(value) + "**" : pct(value);
    };
    lines.push(`| ${MODE_LABELS[c.mode]}${c.director ? "" : " (tắt nhịp)"} | ${c.bot} | ${c.k.toFixed(3)} | ${mark(s.win, "win")} | ${mark(s.s, "s")} | ${mark(s.p, "p")} | ${mark(s.i, "i")} | ${mark(s.o, "o")} | ${num(s.n, 2)} | ${mark(s.q, "q")} | ${share(sum(c.extra.map((x) => x.empty)), c.extra.length)} | ${pct(s.support)} | ${num(s.killSeconds)} | ${num(s.stepsPerWave, 2)} | ${s.spawnMin === null ? "—" : pct(s.spawnMin) + "–" + pct(s.spawnMax)} | ${s.learnOk === null ? "—" : s.learnOk ? "đạt" : "trượt"} |`);
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
  const lines = [`| Chế độ | Bot | Thắng ${head.join(" / ")} / gộp | Biên S ${head.join(" / ")} / gộp | Gần thua N gộp (Cân bằng 0,3–1) | Đích chặt 1B (gộp) |`, "|---|---|---|---|---|---|"];
  for (const c of pooled) {
    if (!c.director) continue;
    const rows = [...sets.map((cells) => cells.find((x) => x.bot === c.bot && x.mode === c.mode && x.director)!.summary), c.summary];
    const tight = c.mode === "balanced" && !c.bot.startsWith("no-type") && c.bot !== "child" && c.bot !== "type-only" && !c.bot.includes("@");
    const { win } = TIGHT_BANDS.balanced;
    const s = c.bot === "standard" ? TIGHT_S : TIGHT_BANDS.balanced.s;
    const ok = c.summary.win >= win.min! && c.summary.win <= win.max! && c.summary.s >= s.min! && c.summary.s <= s.max!;
    lines.push(`| ${MODE_LABELS[c.mode]} | ${c.bot} | ${rows.map((r) => pct(r.win)).join(" / ")} | ${rows.map((r) => pct(r.s)).join(" / ")} | ${num(c.summary.n, 2)} | ${tight ? (ok ? "đạt" : "**trượt**") + ` (78–88 %, ${pct(s.min!)}–${pct(s.max!)})` : "—"} |`);
  }
  return lines;
}

/**
 * The attention budget with the human-like standard bot (BUILD_1B §9.3, 1B R1 review): the director keeps every window
 * it plans within the mode's seconds; a person's slow words may run one over. Its fullest window a run, p50 and worst,
 * and runs past 8 s (soft target: ≤ 20 % of runs, none past 10 s).
 */
export function windowLine(cells: readonly Cell[]): string {
  const c = cells.find((x) => x.bot === "standard" && x.mode === "balanced" && x.director);
  if (c === undefined) return "";
  const windows = c.extra.map((x) => x.window);
  const over = windows.filter((x) => x > MODES.balanced.typeS + 1e-9).length;
  return `Cửa sổ 20 s đầy nhất mỗi ván, bot Chuẩn kiểu người (Cân bằng): p50 ${(median(windows) ?? 0).toFixed(2)} s, lớn nhất ${Math.max(...windows).toFixed(2)} s, ván quá 8 s ${over}/${windows.length} (đích mềm ≤ 20 % ván, không ván nào quá 10 s; bộ điều phối giữ mọi cửa sổ nó dự tính ≤ 8 s).`;
}

const share1 = (part: number, whole: number): string => (whole > 0 ? ((100 * part) / whole).toFixed(1).replace(".", ",") + " %" : "—");

/**
 * R2 (BUILD_1B §18.2): Tối Thượng's casts a run, its share of the damage on the boss and of all damage; direct words as a
 * share of the words typed, Ngắt broken / let run, direct calls made against drums, the seconds of night 4 (the Tanuki's)
 * a direct call; the typing share of nights 1–4 and of night 5; the most direct calls open at once, without the boss and with it.
 */
export function r2Table(cells: readonly Cell[]): string[] {
  const lines = [
    "| Chế độ | Bot | Tối Thượng / ván | Tối Thượng % lên boss | Tối Thượng % cả ải | Từ trực tiếp % số từ | Ngắt được / để chạy | Lời gọi trực tiếp / trống | Một lời gọi trực tiếp mỗi (s Đêm 4) | Gõ Đêm 1–4 | Gõ Đêm 5 | Trực tiếp mở cùng lúc (tối đa: không boss / có boss) |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const c of cells) {
    if (!c.director) continue;
    const t = (pick: (x: RunExtra) => number): number => sum(c.extra.map(pick));
    const every = directEvery(c);
    lines.push(`| ${MODE_LABELS[c.mode]} | ${c.bot} | ${(t((x) => x.casts) / Math.max(1, c.extra.length)).toFixed(2)} | ${share1(t((x) => x.ultBoss), t((x) => x.boss))} | ${share1(t((x) => x.ultAll), t((x) => x.all))} | ${share1(t((x) => x.direct), t((x) => x.words))} | ${t((x) => x.direct)} / ${t((x) => x.missed)} | ${t((x) => x.calls)} / ${t((x) => x.direct + x.missed)} | ${every === null ? "—" : every.toFixed(1)} | ${share1(t((x) => x.n14[0]), t((x) => x.n14[1]))} | ${share1(t((x) => x.n5[0]), t((x) => x.n5[1]))} | ${Math.max(0, ...c.extra.map((x) => x.directMax))} / ${Math.max(0, ...c.extra.map((x) => x.directMaxBoss))} |`);
  }
  return lines;
}

/** Seconds of night 4 a direct call made (§9.1: one each 25–40 s in a night with the enemy; a drum with 2 open makes none); null: none made. */
function directEvery(c: Cell): number | null {
  const calls = sum(c.extra.map((x) => x.calls));
  return calls > 0 ? sum(c.extra.map((x) => x.n4[1])) / 60 / calls : null;
}

/** The typing bots B1 reads (BALANCE §7), for the gates that hold for every bot. */
const TYPING_BOTS = ["novice", "steady", "standard", "skilled", "sloppy", "fast"] as const;

/** Tối Thượng's share of a cell's damage on the boss and of all its damage (G5). */
function ultShares(c: Cell): [number, number] {
  const t = (pick: (x: RunExtra) => number): number => sum(c.extra.map(pick));
  return [t((x) => x.ultBoss) / Math.max(1, t((x) => x.boss)), t((x) => x.ultAll) / Math.max(1, t((x) => x.all))];
}

/** G5 per bot of a mode: [bot, share on the boss, share of all damage, pass]; empty when the mode was not played. */
export function ultGate(cells: readonly Cell[], mode: BandMode): { bot: string; boss: number; all: number; pass: boolean }[] {
  return TYPING_BOTS.flatMap((bot) => {
    const c = cells.find((x) => x.bot === bot && x.mode === mode && x.director);
    if (c === undefined) return [];
    const [boss, all] = ultShares(c);
    return [{ bot, boss, all, pass: boss <= 0.15 && all <= 0.15 }];
  });
}

/**
 * G2, G5, G6 of BUILD_1B §18.3. G2 and G6 read the standard bot, as their rows say. G5 names no bot (§8.2, BALANCE §9.1: an
 * area skill deals ≤ 15 % of the stage's damage), so it is graded for every typing bot in Cân bằng, with Thử thách printed
 * beside it (R2 review). G6 is read as §9.1's frequency (BUILD_NOTES §7.3): a direct call made every 25–40 s of night 4, at
 * most 2 open without the boss and 3 with it; every bot's frequency and the stage share are printed to compare.
 */
export function r2Gates(cells: readonly Cell[]): string {
  const c = cells.find((x) => x.bot === "standard" && x.mode === "balanced" && x.director);
  if (c === undefined) return "";
  const t = (pick: (x: RunExtra) => number): number => sum(c.extra.map(pick));
  const [n14, n5] = [t((x) => x.n14[0]) / Math.max(1, t((x) => x.n14[1])), t((x) => x.n5[0]) / Math.max(1, t((x) => x.n5[1]))];
  const direct = t((x) => x.direct) / Math.max(1, t((x) => x.words));
  const [most, mostBoss] = [Math.max(0, ...c.extra.map((x) => x.directMax)), Math.max(0, ...c.extra.map((x) => x.directMaxBoss))];
  const every = directEvery(c);
  const mark = (pass: boolean): string => (pass ? "đạt" : "**trượt**");
  const g5 = (rows: ReturnType<typeof ultGate>): string => rows.map((r) => `${LABEL[r.bot] ?? r.bot} ${share1(r.boss * 1000, 1000)} / ${share1(r.all * 1000, 1000)}${r.pass ? "" : " ✗"}`).join("; ");
  const [balanced, challenge] = [ultGate(cells, "balanced"), ultGate(cells, "challenge")];
  const others = TYPING_BOTS.flatMap((bot) => {
    const x = cells.find((y) => y.bot === bot && y.mode === "balanced" && y.director);
    const s = x === undefined ? null : directEvery(x);
    return x === undefined ? [] : [`${LABEL[bot] ?? bot} ${s === null ? "—" : s.toFixed(1)}`];
  });
  return [
    `G2 (bot Chuẩn, Cân bằng): gõ Đêm 1–4 ${share1(n14 * 1000, 1000)} (15–25 %), Đêm 5 ${share1(n5 * 1000, 1000)} (≤ 35 %): ${mark(n14 >= 0.15 && n14 <= 0.25 && n5 <= 0.35)}.`,
    `G5 (mọi bot gõ, Cân bằng; lên boss / cả ải, ≤ 15 %, ≤ 15 %): ${g5(balanced)}: ${mark(balanced.length > 0 && balanced.every((r) => r.pass))}.` +
      (challenge.length > 0 ? ` Thử thách (báo cáo): ${g5(challenge)}.` : ""),
    // BUILD_NOTES §7.3: map 1 has one verb on one night, so G6 is read as §9.1's frequency; the stage share is printed to compare.
    `G6 (bot Chuẩn, theo §9.1, BUILD_NOTES §7.3): một lời gọi trực tiếp mỗi ${every === null ? "—" : every.toFixed(1)} s ở Đêm 4 (25–40 s), mở cùng lúc tối đa ${most} không boss (≤ 2), ${mostBoss} có boss (≤ 3): ${mark(every !== null && every >= 25 && every <= 40 && most <= 2 && mostBoss <= 3)}; mọi bot (s mỗi lời gọi): ${others.join(", ")}; từ trực tiếp ${share1(direct * 1000, 1000)} số từ cả ải (5–10 % của TK 9.1 cần đủ ba động từ: ${mark(direct >= 0.05 && direct <= 0.1)}).`,
  ].join(" ");
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
  print("\n" + windowLine(cells));
  print("\n### R2: Tối Thượng, gõ trực tiếp, tỉ lệ gõ theo đêm (BUILD_1B §18.2)\n");
  print(r2Table(cells).join("\n"));
  print("\n" + r2Gates(cells));
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
