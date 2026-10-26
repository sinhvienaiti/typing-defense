/**
 * Starting constants of Typing Defense: the 1A part of
 * docs/td/TYPING_DEFENSE_DESIGN.md Phụ lục A, with step 1A.6 "Lời Gọi"
 * (docs/td/BUILD_1A6.md) on top. This file is the source of truth: the bot
 * retunes numbers here, never in the rules' code. Times are seconds,
 * distances metres; compile.ts turns times into ticks once. Per-building and
 * per-enemy numbers live in slice-1a.ts.
 */
export const TICK_HZ = 60;
export const MAX_STEPS_PER_FRAME = 10;

/** Store capacities: headroom. The rule caps below are what play allows. */
export const STORE = { enemies: 640, soldiers: 96, projectiles: 512, buildings: 40, agents: 8, words: 24, calls: 64, npcs: 48 } as const;
/** streamLive*: TK 6.5's stream cap, which typing/decks.ts still computes from a band. */
export const CAP = { soldiers: 64, agents: 4, streamLiveMax: 12, streamLiveMin: 4 } as const;

/** BUILD_1A6 §2: what a mode sets. lifeK scales the clock a word is scored against (TK 6.4's k_L); powerCdS is §4.5's cooldown. */
/** BUILD_1B §5.2: warnK scales a boss move's warning (relax, learn 1.33; challenge 0.8); §9.1: directK a direct call's window. */
export const MODES = {
  relax: { dayS: 120, open: 2, typeS: 6, hpMul: 0.5, floorE: 12, lifeK: 1.25, powerCdS: 12, pause: true, warnK: 1.33, directK: 2.8 },
  balanced: { dayS: 75, open: 3, typeS: 8, hpMul: 1, floorE: 20, lifeK: 1.0, powerCdS: 9, pause: false, warnK: 1, directK: 2.2 },
  challenge: { dayS: 50, open: 4, typeS: 10, hpMul: 1.19, floorE: 30, lifeK: 0.9, powerCdS: 10, pause: false, warnK: 0.8, directK: 1.6 },
  learn: { dayS: 120, open: 2, typeS: 6, hpMul: 0.5, floorE: 12, lifeK: 1.25, powerCdS: 12, pause: true, warnK: 1.33, directK: 2.8 },
} as const;
/** §2: dawn's length; building at night takes ×1.5 as long. */
export const PHASE = { dawnS: 3, nightBuildMul: 1.5 } as const;

export const LENGTH_BY_E = [
  { minE: 0, len: [3, 5] },
  { minE: 25, len: [3, 6] },
  { minE: 45, len: [4, 8] }, // R3 balance (BUILD_NOTES §7.9): [4, 7] → [4, 8], the Khá and Ẩu bots +13 points of wins
  { minE: 65, len: [4, 8] },
] as const;

/** TK 6.4's word life L_w. A call's word never runs out (§5.2): L_w is only the clock speed is scored against (§5.4). */
export const LIFE = { base: 1.2, perChar: 12, min: 3.0, max: 6.0, hardMin: 2.7 } as const;
/** letterSlack: TK 6.5's stream cap (decks.ts). */
export const EMIT = { letterSlack: 6 } as const;
export const LETTERS = { cooldownS: 1.0, reserve: 3, avoid: "qxzj", avoidUntilLevel: 10, tier2EarlyFree: 5, tier2EarlyMaxLevel: 3, maxEditCheckLen: 8, minWordsPerLetter: 3 } as const;
export const SCORE = { errNum: 1.5, errMin: 0.15, errMax: 0.4, phraseLen: 12, fastBase: 0.35, fastK: 0.8, effBase: 0.4, effK: 0.6, qA: 0.6, qS: 0.4, flashS: 0.7 } as const;
export const WORD_D = { known: 1.0, learning: 0.85 } as const;
export const EXPECTED = { default: 35, min: 12, max: 140 } as const;
/** TK 6.5: who gets first letters first; call and review words leave the reserve to the others. */
export const KIND_PRIORITY = ["seal", "direct", "ultWord", "finisher", "pickup", "spellWord", "rare", "call", "review"] as const;
export const RESERVE_KINDS = ["call", "review"] as const;

/** §5.4: +1 a word that is not sloppy, ÷2 a sloppy one, nothing else. A tier multiplies a whole Perfect call's bonus, at most ×1.3. */
export const CHAIN = {
  good: 1,
  tiers: [{ from: 0, mul: 1 }, { from: 5, mul: 1.075 }, { from: 10, mul: 1.15 }, { from: 20, mul: 1.225 }, { from: 40, mul: 1.3 }],
  callouts: [10, 25, 50, 100],
} as const;

/**
 * §5.1: words a call asks for (build by footprint, an upgrade 3), what a sloppy word's share of the work keeps,
 * the power call's life. §5.3: the attention window, and how many economy calls the night keeps open. §6–§7: a
 * helper's quiz every 25 s by day; the review book holds 20 words, a word with 2 errors goes in like a sloppy one.
 * The director's word budget (review R3, docs/td/BUILD_NOTES.md §5): a word's lock time at E ×paceK, and slipS
 * more for slips, must fit the 20 s window (the bot at 35 WPM, 95 %: no window past 8 s, 30 % of the day typed;
 * 1B R2: 1.1 → 1.15 s, a chain of chop words ran one window to 8.13 s, BUILD_NOTES §7.3; 1.35 s with trees that never
 * run out, the owner's wood rule of 26/10/2026: chop chains ran windows to 8.60 and 8.43 s, BUILD_NOTES §7.8).
 */
export const CALL = {
  words: { harvest: 3, chop: 4, mine: 2, power: 1, quiz: 1, upgrade: 3, build: { S: 2, M: 3, L: 4, XL: 4 } },
  sloppy: 0.6, powerLifeS: 9, windowS: 20, nightEconomy: 1, quizEveryS: 25, review: 20, reviewErrors: 2, paceK: 1, slipS: 1.35,
} as const;
/**
 * BUILD_1B §11 (R3, docs/td/R3_PLAN.md §3.2–§3.4): a word of the review book comes back returnS after it went in as the next
 * word of an economy call of ≥ minCallWords words (one Từ Ôn a call, so ≤ 25 % of its words), one live at a time, typed back
 * `returns` times a run at most. The study plan's shares of an economy call's words (`plan`; no due list: `cold`), freshMax
 * fresh words a run. The store keeps bookSaved words, the run's book takes the newest CALL.review; a meaning shows while a
 * word was seen fewer than `seen` times (by mode), the count stops at seenCap, seenIds ids kept; meaningErrors errors on a
 * word show it again; learning events go out every sendS.
 */
export const LEARN = {
  returnS: [25, 45], minCallWords: 4, returns: 2, plan: { due: 0.6, current: 0.25, fresh: 0.15 }, cold: { current: 0.85, fresh: 0.15 }, freshMax: 8,
  bookSaved: 40, freshPlanned: 24, seen: { balanced: 2, challenge: 1 }, seenCap: 3, seenIds: 3000, meaningErrors: 3, sendS: 5,
} as const;
/** A power word's Word Shot (TK 6.11): D̄ × (0.8 + 1.2·Q) × lenF, lenF = clamp((len + 1)/6; 0.8; 1.2). */
export const REWARD = { lenDiv: 6, lenMin: 0.8, lenMax: 1.2, shotQ: [1.6, 0.4] } as const;
/**
 * §4.5: power charges of a tower; a power word adds 2, a whole Perfect call 1 more. quick (1B R1 review): a power word typed t s
 * after it showed brings the next call to cd·(1 − quick·r) after it, r = max(0, 1 − t / quickS), if sooner (R2, design call (b): 0.8, 5 s).
 */
export const POWER = { max: 5, perWord: 2, perfect: 1, quick: 0.8, quickS: 5 } as const;

/**
 * BUILD_1B §8: Tối Thượng's charge (0–max): a call's word +perWord·(0.5 + 0.5 Q), a direct word +DIRECT.ult, an enemy dying within
 * ringM of Draconis +shard a Mảnh Chữ (SHARDS by tier; the boss's stagger `stagger`), +nightPerS a second by night; nothing while full;
 * minGapS at least between uses. Cast within castM of him (the app's spot otherwise: the most enemy hit points within areaM of a point
 * within autoM of him): a feather every everyTicks, each at the enemy with the most hit points within radiusM not yet aimed at (round
 * and round; none: the spot), landing ~fallS later in a blastM blast of `damage` magic; the boss takes ×bossMul and never burns; at the
 * rain's end the enemies left in it burn burnS. Chữ Chiêu: a call of `words` known short words living lifeS; each word typed brings
 * perWordFeathers more delayS later, a whole Perfect call perfectFeathers more. R2 review (G5 for every bot, BALANCE §9.1):
 * damage 25 → 21, the Khá bot's share of all damage 15–17 % → ~12 %; two feathers still fell a Cương Thi in Thử thách (2 × 21 ≥ 41.7).
 */
export const ULT = { max: 100, perWord: 1.2, shard: 0.6, nightPerS: 0.3, minGapS: 45, castM: 20, autoM: 14, areaM: 6, radiusM: 6, feathers: 12, everyTicks: 10, fallS: 0.8, damage: 21, blastM: 1.5, burnS: 3, bossMul: 0.25, ringM: 12, words: 3, lifeS: 4, perWordFeathers: 3, perfectFeathers: 1, delayS: 0.3 } as const;
export const SHARDS = { swarm: 0.5, small: 1, medium: 2, heavy: 3, boss: 0, stagger: 6 } as const;
/** BUILD_1B §9.1: direct calls open at once (3 with the boss up); a broken mechanic's gold and charge; its window clamp(base + directK·(len + 1)·12 / E; minS; maxS). */
export const DIRECT = { open: 2, openBoss: 3, gold: 2, ult: 3, minS: 3, maxS: 7, base: 0.8, leadM: 1.5 } as const;
/** BUILD_1B §5.5 (R2): a helper within m of a building's rim when Rễ Trồi strikes runs to the Bastion and stands there s seconds. */
export const PANIC = { m: 6, s: 5 } as const;
export const RICHNESS = [0.8, 1.0, 1.25] as const;

/** §6: help rings (hero 10 m, helpers 6 m) and the helpers' passive on economy work; idle helpers stand in a row west of the Bastion (TK 23.7). */
export const AGENT = { heroRingM: 14, helperRingM: 6, passive: 1.5, socketGapM: 1.0, homeSideM: 5.5, homeGapM: 2.4 } as const;

/** TK 10. Crits multiply by 1.75; armour and resist tiers are 0 / 30 / 60 / 80 %. */
export const COMBAT = { critMul: 1.15, armorTiers: [0, 30, 60, 80], minDamage: 1, splashHits: ["ground", "low"] } as const;

/** §3: the run's start; a building's old price G becomes round(0.3 G) wood and the rest gold; a food sale, a wood sale (1B R1 review). */
export const ECONOMY = {
  start: { gold: 220, wood: 40, food: 0, seeds: 4 }, lives: 20,
  earlyCall: { goldCap: 30 }, waveBonus: { base: 10, perWave: 2 },
  undoWindowS: 5, woodShare: 0.3, sale: { food: 10, gold: 10, wood: 10, woodGold: 4 },
} as const;
/** BUILD_1B §7: a finished building sells for 60 % of what it cost (rounded down); the HUD asks twice within 3 s. */
export const SELL = { refund: 0.6, confirmS: 3 } as const;
/** BUILD_1B §4.3 (TK 20.2): lives left for 3, 2, 1 stars. */
export const STARS = [18, 6, 1] as const;

/** §4.1: 4 plots a farm, 1.1 m off its centre; sow 2 s, grow 40 s, harvest 12 s for 5 food; seeds 4 for 30 gold, or 1 for 8 bought on the spot. */
export const FARM = { plots: 4, plotM: 1.1, sowS: 2, growS: 40, harvestS: 12, food: 5, pack: { seeds: 4, gold: 30 }, seedGold: 8, perfectFood: 3 } as const;
/**
 * §4.2: a tree blocks building within 1.5 m; unmarked, only trees within 30 m of the Bastion are chopped. A chop (a call)
 * is 45 s for 12 wood, paid as it goes (review R3: 0.27 wood/s alone). The owner's rule (26/10/2026): a tree holds
 * `reserve` wood, falls only once it is all paid (an hour alone), and every new day stands again full (waves.ts regrow).
 */
export const TREE = { radiusM: 1.5, wood: 12, chopS: 45, perfectWood: 2, nearKeepM: 30, reserve: 1000 } as const;
/** §4.2: villagers at the start, a hire's price, the most by Bastion level. NPCs walk at `speed` m/s (not in the design; a starting number). */
export const VILLAGERS = { start: 2, gold: 25, food: 5, cap: [3, 5, 7, 9] } as const;
export const NPC = { speed: 3, farmSpeed: 1.5 } as const;
/**
 * §4.4: the miner hauls every 10 s; a pile at half its size calls for help; a word hauls it all and pays 1 gold. The
 * miner carries 0.8 × the level's yield a trip (not the whole pile: then no pile would ever reach half, docs/td/BUILD_NOTES.md).
 */
export const MINE = { haulEveryS: 10, haulK: 0.8, callAt: 0.5, wordGold: 1, perfectGold: 5 } as const;

/** TK 11.10, 12.5; §4.3 build times by footprint, an upgrade 0.75 of it; a whole Perfect build call leaves +10 % hit points. */
export const BUILD = {
  caps: { total: 16, attack: 6, barracks: 3 },
  footprintR: { S: 2.0, M: 2.3, L: 2.7, XL: 3.5 },
  gapM: 1.0, roadClearM: 1.9, keepClearM: 11, snapM: 0.25, nodeSnapM: 1.5,
  buildTimeS: { S: 8, M: 14, L: 18, XL: 18 }, upgradeK: 0.75, sturdy: 1.1,
} as const;

/** TK 13. Soldiers walk at `speed` m/s (not in the design; a starting number); §4.6: a respawn eats 1 food, or takes twice as long without. */
export const SOLDIER = { respawnS: 10, engageM: 3, leashM: 5, regenPctS: 0.05, regenDelayS: 3, maxPerEnemy: 3, spacingM: 1.2, speed: 4.0, contactM: 0.5, food: 1 } as const;
export const RALLY = { radiusM: 12, roadMaxM: 3 } as const;
/** §10 "Đặt sẵn": Bastion level, villagers, how many trees nearest the Bastion are marked; the farm's plots (stage, work) so it shows every stage at once. */
export const PRESET = { keepLevel: 3, villagers: 5, marks: 8, plots: [[2, 0], [1, 0.7], [1, 0.3], [0, 0]] } as const;

/**
 * Balance step 4 (docs/games/BALANCE.md §4, §9.2). Pace k (the run header, k.min–k.max: BALANCE's 0.75–1.30, the floor
 * 0.70 here since R3's balance, BUILD_NOTES §7.9: the Mới bot's k is 0.70, at 0.75 it won 62 %) divides the night's pack gaps,
 * the day (the wave clock) and the day's call clocks (a quiz, a mine's half-full call), and enemies walk at
 * 1 + speedK·(k − 1) (spawn gaps alone barely moved a night, the other way at that: docs/changelog/2026-10-23-balance.md;
 * 1B R2 review: 0.2 → 0.3, Biên S of the slow and the fast bots towards each other, BUILD_NOTES §7.4).
 * An enemy within dangerM of the Bastion is danger (buildings and villagers cannot be hurt in 1A.6); the director
 * judges a night once a foe is within engageM. Step tables: at night spawn ±7 %, one elite affix (hit points
 * ×eliteHp at spawn), the peak and the lull ±3 s, a support drop near defeat (+supportLives lives, once a night);
 * by day only the call clocks ±7 %, against a band without pressure (no enemy comes by day).
 */
export const PACE = {
  dangerM: 24, engageM: 50, eliteHp: 1.3, supportLives: 2, mineCallMin: 0.25, speedK: 0.3, k: { min: 0.7, max: 1.3 },
  night: { up: ["spawn", "elite", "peak", "lull"], down: ["support", "spawn", "lull", "peak", "elite"], spawnStep: 70, eliteCost: 30, peakTicks: 180, lullTicks: 180 },
  day: { up: ["spawn"], down: ["spawn"], spawnStep: 70, eliteCost: 0, peakTicks: 0, lullTicks: 0 },
} as const;

/** TK 14.2: what each tier's gold and leak may be. */
export const TIERS = {
  swarm: { gold: [1, 4], leak: [1, 1], weight: [1, 1] },
  small: { gold: [4, 12], leak: [1, 2], weight: [1, 1] },
  medium: { gold: [12, 25], leak: [2, 3], weight: [1, 2] },
  heavy: { gold: [25, 35], leak: [3, 4], weight: [2, 2] },
  boss: { gold: [0, 0], leak: [0, 0], weight: [1, 4] },
} as const;
