/**
 * Scratch tuner for the boss peak (BUILD_1B §6.5): plays chosen bots on the story stage with the boss's numbers
 * overridden from the command line, and prints win, Biên S and the boss table. Not part of the build.
 *   node --import tsx scripts/td/boss-tune.ts --hp=3200 --speed=0.9 --emerge=20 --seeds=30 --bots=standard,fast --mode=balanced
 */
import { SLICE_1A } from "../../src/content/slice-1a";
import { bossTable, playCell, splitTable } from "../../tests/td/flow";
import { realDeck } from "../../tests/td/typing";

const arg = (name: string): string | undefined => process.argv.find((a) => a.startsWith("--" + name + "="))?.split("=")[1];
const num = (name: string, fallback: number): number => Number(arg(name) ?? fallback);
const boss = SLICE_1A.enemies.find((e) => e.id === "moc-tinh")! as { hp: number; speed: number };
(SLICE_1A.boss as { heroMul: number }).heroMul = num("heromul", SLICE_1A.boss!.heroMul);
if (arg("open") !== undefined) (SLICE_1A.stage as { unlock: object }).unlock = {};
if (arg("immortal") !== undefined) Object.assign(SLICE_1A.boss!, { retreatPct: 0.5, stagger: { ...SLICE_1A.boss!.stagger, atPct: 1 } });
boss.hp = num("hp", boss.hp);
boss.speed = num("speed", boss.speed);
(SLICE_1A.stage!.boss as { emergeM: number }).emergeM = num("emerge", SLICE_1A.stage!.boss.emergeM);
const tl = SLICE_1A.enemies.find((e) => e.id === "thuong-luong")! as { hp: number };
tl.hp = num("tlhp", tl.hp);
const wave5 = SLICE_1A.waves.list[4]! as { enemy: string; count: number }[];
wave5[0]!.count = num("tl", wave5[0]!.count);
if (arg("tlpack") !== undefined) (wave5[0] as { pack?: number }).pack = num("tlpack", 6);
const deck = realDeck();
const seeds = num("seeds", 30);
const from = num("from", 0);
const mode = (arg("mode") ?? "balanced") as "balanced";
const cells = (arg("bots") ?? "standard").split(",").map((bot) => playCell({ bot, mode, director: true }, seeds, deck, 5, from));
console.log(`heroMul ${SLICE_1A.boss!.heroMul} hp ${boss.hp} speed ${boss.speed} emerge ${SLICE_1A.stage!.boss.emergeM} tl ${wave5[0]!.count}×${tl.hp} seeds ${from + 1}-${from + seeds} ${mode}`);
for (const c of cells) console.log(`${c.bot}: win ${c.summary.win / 10} % S ${c.summary.s / 10} % I ${c.summary.i / 10} % P ${c.summary.p / 10} %`);
console.log(bossTable(cells).slice(2).join("\n"));
const q = (values: number[], p: number): number => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))] ?? NaN;
for (const c of cells) {
  const reached = c.boss.filter((b) => b.reached);
  const dmg = reached.map((b) => b.damage);
  console.log(`${c.bot} damage p10/p50/p90 ${q(dmg, 0.1)} / ${q(dmg, 0.5)} / ${q(dmg, 0.9)}; typed ${q(reached.map((b) => b.typed), 0.5)}, hero ${q(reached.map((b) => b.hero), 0.5)}`);
}
console.log(splitTable(cells).slice(2).join("\n"));
