/**
 * The golden run (docs/td/BUILD_NOW.md §6.1 td-golden, §7 gate 4; BUILD_1A6
 * §12 gate 2): the standard bot plays three days and nights from seed 1 (the
 * nights called early, so the log has callNight) and
 * the world is hashed every 60 ticks. tests/golden/td-1a.json keeps those
 * hashes with the words the run used (levels 1–3 of the shared vocabulary when
 * it was made), so a new vocabulary in the parent repository never moves it;
 * the content hash in it tells a change of rules or numbers apart from a
 * change of behaviour. `pnpm td:golden:update` remakes it after a change that was meant.
 */
import { readFileSync } from "node:fs";
import { planFor, readLearn } from "../../src/app/learn";
import { BOSS } from "../../src/sim/stores/boss";
import { compileDeck, wordText, type Deck } from "../../src/typing/decks";
import { runBot, type BotRun, type BotSpec } from "./bot";
import { heroBoss } from "./policies/boss";
import { heroDay, heroNight } from "./policies/hero";
import { ARCHER_WEST, STANDARD } from "./policies/layouts";
import { Plan, type Rule } from "./policies/stand";
import { ultRule } from "./policies/ult";
import { realDeck } from "./typing";

export const GOLDEN_URL = new URL("../golden/td-1a.json", import.meta.url);
/** The boss golden (BUILD_1B §17 item 7): the sandbox preset, its towers raised, Mộc Tinh called on day 1, until it retreats. */
export const BOSS_GOLDEN_URL = new URL("../golden/td-1b-boss.json", import.meta.url);
export const GOLDEN_LEVELS = 3;
export const GOLDEN_EVERY = 60;
export const GOLDEN_PACE = { k: 1, director: true } as const;

export type Golden = {
  about: string;
  seed: number;
  /** Content hash (rules and slice) and deck hash the run was made with. */
  content: string;
  deck: string;
  every: number;
  ticks: number;
  commands: number;
  /** World hash after every `every` ticks. */
  hashes: string[];
  /** A few counters of the run, to read a diff by. */
  summary: Record<string, number>;
  /** The words, by vocabulary level (1 first), in deck order. */
  words: string[][];
};

/** The words of levels 1..GOLDEN_LEVELS of the shared vocabulary as the page compiles them, by level. */
export function snapshotWords(): string[][] {
  const deck = realDeck();
  const out: string[][] = Array.from({ length: GOLDEN_LEVELS }, () => []);
  for (let word = 0; word < deck.count; word += 1) if (deck.level[word]! <= GOLDEN_LEVELS) out[deck.level[word]! - 1]!.push(wordText(deck, word));
  return out;
}

export const goldenDeck = (words: readonly (readonly string[])[]): Deck =>
  compileDeck(words.flatMap((texts, index) => texts.map((text, k) => ({ id: "golden-" + (index + 1) + "-" + k, text, level: index + 1 }))));

export const readGolden = (url: URL = GOLDEN_URL): Golden => JSON.parse(readFileSync(url, "utf8")) as Golden;

/** A building put down and undone inside its 5 s (TK 11.12), so the run sends `sell` too (the sandbox gives its wood). */
const undoOnce: Rule = (bot) => {
  const { w } = bot;
  const def = w.c.buildingIndex(ARCHER_WEST.id);
  if (w.tick === 239) bot.send({ t: "sandbox", op: { op: "wood", value: w.wood + 80 } });
  if (w.tick === 240) bot.send({ t: "build", def, qx: ARCHER_WEST.x * 4, qz: ARCHER_WEST.z * 4 });
  const built = w.buildings.live(1).find((b) => w.buildings.def[b] === def && w.buildings.x[b] === ARCHER_WEST.x && w.buildings.z[b] === ARCHER_WEST.z);
  if (w.tick === 300 && built !== undefined) bot.send({ t: "sell", building: w.buildings.id(built) });
};

/**
 * R2 (BUILD_1B §8, §9): night 2 brings a Tanuki, then two packs of 5 that catch it up where the merge's soldiers hold
 * them, under the towers, so it drums (Ngắt; BUILD_NOTES §7.3); night 3 a full Tối Thượng (cast by ultRule).
 */
function r2Moves(): Rule {
  let done = 0;
  let at = 0;
  return (bot) => {
    const { w } = bot;
    if (done === 0 && w.phase === "night" && w.wave === 2) {
      bot.send({ t: "sandbox", op: { op: "spawn", enemy: "tanuki", value: 1 } });
      [done, at] = [1, w.tick];
    } else if ((done === 1 || done === 2) && w.tick === at + 300 * done) {
      bot.send({ t: "sandbox", op: { op: "spawn", enemy: "cuong-thi", value: 5 } });
      done += 1;
    } else if (done === 3 && w.phase === "night" && w.wave === 3) {
      bot.send({ t: "sandbox", op: { op: "ult" } });
      done = 4;
    }
  };
}

/** The standard bot at 35 WPM, 95 % (BUILD_1A6 §12 gate 2), its hero where the calls gather, three days and nights, every invariant checked; R2's moves. */
/**
 * R3 (R3_PLAN §6): the golden plays a store with six saved words (the first six of level 1) and nothing seen, so its
 * hashes hold the book loaded at tick 0, Từ Ôn, the plan's due and fresh parts; the cold start is unit-tested.
 */
export const goldenLearn = (deck: Deck) => planFor(deck, readLearn({ v: 1, book: deck.ids.slice(0, 6), seen: {} }), GOLDEN_LEVELS, 1);

export function goldenSpec(deck: Deck): BotSpec {
  return {
    seed: 1,
    deck,
    learn: goldenLearn(deck),
    hands: { wpm: 35, accuracy: 0.95, backspace: 0.3 },
    plan: () => new Plan({ ...STANDARD, callAfterS: 60 }, [undoOnce, heroDay(), heroNight(), r2Moves(), ultRule()]),
    nights: 3,
    hashEvery: GOLDEN_EVERY,
    check: true,
    // The game's default header for the standard player (BALANCE.md §4: k = 1, the pace director on): its state is hashed.
    pace: GOLDEN_PACE,
  };
}

/** Tick 0: the preset; tick 1: its towers to level 3, the Bastion to 4; tick 2: the boss; R2: a full Tối Thượng as it rises. Draconis follows it (heroBoss). */
const callBoss: Rule = (bot) => {
  const { w } = bot;
  if (w.tick === 0) bot.send({ t: "sandbox", op: { op: "preset" } });
  if (w.tick === 1) {
    for (const b of w.buildings.live(1)) if (w.c.buildings[w.buildings.def[b]!]!.attack !== null) bot.send({ t: "sandbox", op: { op: "level", building: w.buildings.id(b), value: 3 } });
    bot.send({ t: "sandbox", op: { op: "keepLevel", value: 4 } });
  }
  if (w.tick === 2) bot.send({ t: "sandbox", op: { op: "boss" } });
  if (w.boss.stage === BOSS.emerge && w.boss.emergeAt === w.tick + 1) bot.send({ t: "sandbox", op: { op: "ult" } });
};

/** The boss golden: the sandbox, the standard bot's hands at 35 WPM, nothing built but the preset; until the stage ends. */
export function bossGoldenSpec(deck: Deck): BotSpec {
  return {
    seed: 1, deck, hands: { wpm: 35, accuracy: 0.95, backspace: 0.3 }, plan: () => new Plan({ name: "Boss", builds: [], helpers: [null, null, null] }, [callBoss, heroBoss(), ultRule()]),
    nights: 99, hashEvery: GOLDEN_EVERY, check: true, pace: GOLDEN_PACE, maxTicks: 60 * 60 * 6,
  };
}

export const runBossGolden = (words: readonly (readonly string[])[]): { run: BotRun; deck: Deck } => {
  const deck = goldenDeck(words);
  return { run: runBot(bossGoldenSpec(deck)), deck };
};

export function goldenOf(run: BotRun, deck: Deck, words: string[][]): Golden {
  const s = run.stats;
  return {
    about: "tests/td/golden.ts; remake with pnpm td:golden:update",
    seed: 1,
    content: run.world.c.hash,
    deck: deck.hash,
    every: GOLDEN_EVERY,
    ticks: run.ticks,
    commands: run.log.length,
    hashes: run.hashes,
    summary: {
      kills: s.kills, livesLost: s.livesLost, wavesCleared: s.wavesCleared, calls: s.calls, callWords: s.callWords, callsPerfect: s.callsPerfect, keys: s.keys, keyErrors: s.keyErrors,
      gold: run.world.gold / 1000, wood: run.world.wood, food: run.world.food, bossDamage: s.bossDamage, bossRetreats: s.bossRetreats, lives: run.world.lives,
      ultCasts: s.ultCasts, ultFeathers: s.ultFeathers, directOk: s.directOk, directMissed: s.directMissed,
      reviewBack: s.reviewBack, reviewRedeemed: s.reviewRedeemed, freshWords: s.freshWords,
    },
    words,
  };
}

export const runGolden = (words: readonly (readonly string[])[]): { run: BotRun; deck: Deck } => {
  const deck = goldenDeck(words);
  return { run: runBot(goldenSpec(deck)), deck };
};
