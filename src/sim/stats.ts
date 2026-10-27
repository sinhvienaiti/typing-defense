/**
 * Run counters as one number array (docs/td/TYPING_DEFENSE_DESIGN.md 25.13): the bot report, the result screen and
 * __td.stats() read the same numbers. Gold counters are thousandths, like the treasury; food and wood are whole.
 */
export const STATS = [
  "spawned", "kills", "leaks", "livesLost", "shots", "hits", "blocks", "soldierDeaths", "wavesCleared",
  "goldKill", "goldProduce", "goldWave", "goldEarly", "goldWord",
  "damageTower", "damageCrossbow", "damageSoldier", "damageWordShot", "damageHero", "damageUlt",
  "calls", "callWords", "callsPerfect", "wordsPerfect", "wordsSloppy", "jams", "food", "foodEaten", "wood", "seedsBought",
  "keys", "keyErrors", "strays", "wordShots", "fizzles", "rawWpmSum", "backspaces", "abandons", "killTicks",
  // BUILD_1B §15: damage on the boss (all, typed, Draconis' own), retreats, lives lost at the peak, buildings rooted, the chest, Dồn lửa words typed and asked.
  "bossDamage", "bossTyped", "bossHero", "bossRetreats", "livesBoss", "rootsHits", "goldChest", "burstTyped", "burstWords",
  // R2: Tối Thượng's casts, feathers, damage on the boss; Mảnh Chữ; direct words typed and mechanics let run; helpers panicked.
  "ultCasts", "ultFeathers", "bossUlt", "shards", "directOk", "directMissed", "panics",
  // R3 (BUILD_1B §11): Từ Ôn typed back, redeemed of them, fresh words of the study plan dealt.
  "reviewBack", "reviewRedeemed", "freshWords",
] as const;

export type StatName = (typeof STATS)[number];

export const STAT = Object.fromEntries(STATS.map((name, index) => [name, index])) as Record<StatName, number>;

/** Who dealt damage; `STAT.damageTower + source` is its counter. */
export const SOURCE = { tower: 0, crossbow: 1, soldier: 2, wordShot: 3, hero: 4, ult: 5 } as const;

export const createStats = (): Float64Array => new Float64Array(STATS.length);

export function statsObject(stats: Float64Array): Record<StatName, number> {
  return Object.fromEntries(STATS.map((name, index) => [name, name.startsWith("gold") ? stats[index]! / 1000 : stats[index]!])) as Record<StatName, number>;
}

export function bump(stats: Float64Array, stat: number, amount = 1): void {
  stats[stat] = stats[stat]! + amount;
}
