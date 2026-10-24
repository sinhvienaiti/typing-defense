/**
 * Scratch tuner for the boss peak (BUILD_1B §6.5): plays chosen bots on the story stage with the boss's numbers
 * overridden from the command line, and prints win, Biên S and the boss table. Not part of the build.
 *   node --import tsx scripts/td/boss-tune.ts --hp=3200 --speed=0.9 --emerge=20 --seeds=30 --bots=standard,fast --mode=balanced
 *   more: --khp=0.4 --khp2=0 --khpmax=1.12 --modehp=0.8 (the run's mode) --quick=0.6 --quickS=4 --burn=55 --tlhp=365 --tl=4 --words=3 --perE=20
 *   --woodkeep=100 (none: the bots never sell wood) --woodgold=4 --escort=8 --sprouts=4 --summonS=15 --hpmul=1 (the mode's enemy hit points)
 *   --director=0 (pace director off, B7) --from=120 (seeds from 121: the report's second set)
 */
import { ECONOMY, MODES, POWER } from "../../src/content/rules";
import { SLICE_1A } from "../../src/content/slice-1a";
import { bossTable, playCell, splitTable } from "../../tests/td/flow";
import { FAIR, GOOD, POOR, STANDARD } from "../../tests/td/policies/layouts";
import { realDeck } from "../../tests/td/typing";

const arg = (name: string): string | undefined => process.argv.find((a) => a.startsWith("--" + name + "="))?.split("=")[1];
const num = (name: string, fallback: number): number => Number(arg(name) ?? fallback);
const boss = SLICE_1A.enemies.find((e) => e.id === "moc-tinh")! as { hp: number; speed: number };
(SLICE_1A.boss as { heroMul: number }).heroMul = num("heromul", SLICE_1A.boss!.heroMul);
if (arg("open") !== undefined) (SLICE_1A.stage as { unlock: object }).unlock = {};
if (arg("immortal") !== undefined) Object.assign(SLICE_1A.boss!, { retreatPct: 0.5, stagger: { ...SLICE_1A.boss!.stagger, atPct: 1 } });
boss.hp = num("hp", boss.hp);
Object.assign(SLICE_1A.boss!, { kHp: num("khp", SLICE_1A.boss!.kHp), kHp2: num("khp2", SLICE_1A.boss!.kHp2), kHpMax: num("khpmax", SLICE_1A.boss!.kHpMax) });
Object.assign(SLICE_1A.boss!.stagger, { burstWords: num("words", SLICE_1A.boss!.stagger.burstWords), burstPerE: num("perE", SLICE_1A.boss!.stagger.burstPerE) });
Object.assign(POWER, { quick: num("quick", POWER.quick), quickS: num("quickS", POWER.quickS) });
(ECONOMY.sale as { woodGold: number }).woodGold = num("woodgold", ECONOMY.sale.woodGold);
for (const layout of [FAIR, GOOD, POOR, STANDARD]) if (arg("woodkeep") !== undefined) (layout as { woodKeep?: number }).woodKeep = arg("woodkeep") === "none" ? undefined : num("woodkeep", 100);
(SLICE_1A.hero.burn as { dps: number }).dps = num("burn", SLICE_1A.hero.burn.dps);
boss.speed = num("speed", boss.speed);
(SLICE_1A.stage!.boss as { emergeM: number }).emergeM = num("emerge", SLICE_1A.stage!.boss.emergeM);
const tl = SLICE_1A.enemies.find((e) => e.id === "thuong-luong")! as { hp: number };
tl.hp = num("tlhp", tl.hp);
if (arg("escort") !== undefined) (SLICE_1A.stage!.boss.escort[0] as { count: number }).count = num("escort", 8);
Object.assign(SLICE_1A.boss!.summon, { count: num("sprouts", SLICE_1A.boss!.summon.count), everyS: num("summonS", SLICE_1A.boss!.summon.everyS) });
const wave5 = SLICE_1A.waves.list[4]! as { enemy: string; count: number }[];
wave5[0]!.count = num("tl", wave5[0]!.count);
if (arg("tlpack") !== undefined) (wave5[0] as { pack?: number }).pack = num("tlpack", 6);
const deck = realDeck();
const seeds = num("seeds", 30);
const from = num("from", 0);
const mode = (arg("mode") ?? "balanced") as "balanced";
if (arg("hpmul") !== undefined) (MODES[mode] as { hpMul: number }).hpMul = num("hpmul", 1);
if (arg("modehp") !== undefined) (SLICE_1A.boss as { modeHp: object }).modeHp = { ...SLICE_1A.boss!.modeHp, [mode]: num("modehp", 1) };
const cells = (arg("bots") ?? "standard").split(",").map((bot) => playCell({ bot, mode, director: arg("director") !== "0" }, seeds, deck, 5, from));
console.log(`heroMul ${SLICE_1A.boss!.heroMul} hp ${boss.hp} speed ${boss.speed} emerge ${SLICE_1A.stage!.boss.emergeM} tl ${wave5[0]!.count}×${tl.hp} seeds ${from + 1}-${from + seeds} ${mode}`);
for (const c of cells) console.log(`${c.bot}: win ${c.summary.win / 10} % S ${c.summary.s / 10} % I ${c.summary.i / 10} % P ${c.summary.p / 10} % N ${c.summary.n?.toFixed(2)} kill ${c.summary.killSeconds?.toFixed(2)} s empty ${(100 * c.extra.reduce((t, x) => t + x.empty, 0) / c.extra.length).toFixed(0)} %`);
console.log(bossTable(cells).slice(2).join("\n"));
const q = (values: number[], p: number): number => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))] ?? NaN;
for (const c of cells) {
  const reached = c.boss.filter((b) => b.reached);
  const dmg = reached.map((b) => b.damage);
  console.log(`${c.bot} damage p10/p50/p90 ${q(dmg, 0.1)} / ${q(dmg, 0.5)} / ${q(dmg, 0.9)}; typed ${q(reached.map((b) => b.typed), 0.5)}, hero ${q(reached.map((b) => b.hero), 0.5)}`);
}
console.log(splitTable(cells).slice(2).join("\n"));
