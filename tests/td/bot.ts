/**
 * The Typing Defense bot (docs/td/BUILD_NOW.md §6.3, TK 19.1; BUILD_1A6 §12): a plan (what to build, the Bastion's
 * level bought with gold, trees, villagers, where the hero and the helpers stand, day and night) and a typist (eyes
 * that see a bright call's word late and pick one, hands with a speed, an accuracy and a Backspace habit) play a
 * world tick by tick through the same commands a player sends. Every command is logged, so a run replays; the bot's
 * own randomness comes from a seed of its own and never touches the world's. A run meters what the report reads:
 * typing ticks by day and night (and by day number), the director's 20 s typing count at its highest, what was
 * earned (gold from every source, wood, food, knowledge) at each nightfall and dawn, what became of the calls, and
 * the cost of a step; it may check the call invariants every tick (§12 gate 6).
 */
import type { FlowSummary } from "../../src/kit/balance/flow";
import type { PaceSummary } from "../../src/kit/balance/director";
import type { TypistParams } from "../../src/kit/balance/typist";
import { createRng } from "../../src/kit/platform/rng";
import { DIRECT, MODES, TICK_HZ } from "../../src/content/rules";
import { bossSlot } from "../../src/sim/systems/boss";
import type { Mode } from "../../src/content/types";
import type { Command, CommandBody } from "../../src/sim/commands";
import { hashHex } from "../../src/sim/hash";
import { STAT, statsObject, type StatName } from "../../src/sim/stats";
import { CALL_KIND, CALL_STATE } from "../../src/sim/stores/calls";
import type { LearnHeader } from "../../src/sim/systems/learn";
import type { PaceHeader } from "../../src/sim/systems/pace";
import { createWorld, step, type World } from "../../src/sim/world";
import { wordText, type Deck } from "../../src/typing/decks";
import { withinOneEdit } from "../../src/typing/distance";
import { BossProbe, type BossRun } from "./boss-probe";
import { HumanHands } from "./human";
import { Keystrokes, type HandsSpec } from "./keystrokes";
import { Plan } from "./policies/stand";
import { Reader } from "./reader";

const STEP_MS = 1000 / TICK_HZ;

export type BotSpec = {
  seed: number;
  deck: Deck;
  /** null: never types (unless `human`). */
  hands: HandsSpec | null;
  /** A human-like typist (BALANCE.md §6) instead of the R3 hands; wpm 0 never types. */
  human?: TypistParams;
  /** The run header: pace k and the director (none: k 1, off). */
  pace?: PaceHeader;
  /** The run header's study lists (R3, BUILD_1B §11.3–§11.4; none: no plan, an empty book). */
  learn?: LearnHeader;
  /** Made fresh for each run: a plan keeps state. */
  plan: () => Plan;
  /** Stop when this night has ended (or the Bastion falls); the boss night ends with its retreat (victory). */
  nights: number;
  /** The sandbox (default, as 1A.6's bots played); false: the story stage (BUILD_1B §18.1). */
  sandbox?: boolean;
  /** E, the sandbox's expected speed: the hands' WPM by default (35 without hands). */
  expected?: number;
  vocab?: number;
  mode?: Mode;
  /** Seed of the bot's eyes and hands (the run seed by default). */
  botSeed?: number;
  /** Hash the world every this many ticks (the golden test: 60). */
  hashEvery?: number;
  /** Check the call invariants every tick. */
  check?: boolean;
  /** Time every step (performance.now): the report's sim cost. */
  timeSteps?: boolean;
  maxTicks?: number;
  /** Called after every step (a probe). */
  onTick?: (w: World) => void;
};

/** Resources earned since the start (not spent, not the starting stock): gold from every source, wood, food, knowledge. */
export type Earned = { gold: number; wood: number; food: number; knowledge: number };

/** What became of the calls that ended: made, lit at least once, a word typed, finished by a typed word, whole Perfect, lit but left untyped, never lit. */
export type CallTally = { made: number; bright: number; typed: number; finished: number; perfect: number; ignored: number; dark: number };

export type BotRun = {
  world: World;
  log: Command[];
  hashes: string[];
  stats: Record<StatName, number>;
  ticks: number;
  /** Ticks with a lock, ticks with nothing to type (no live word, no lock: 1B R1 review), and ticks, by phase: day, night (dawn in neither). */
  typedTicks: [number, number];
  emptyTicks: [number, number];
  phaseTicks: [number, number];
  /** The same by day number (index n: day n, night n). */
  byDay: { dayTyped: number; dayTicks: number; nightTyped: number; nightTicks: number }[];
  /** The director's count of typing ticks in the last 20 s (BUILD_1A6 §5.3), at its highest, and the tick it was. */
  windowMax: number;
  windowAt: number;
  /** Earned so far when night n falls (index n) and when day n begins (index n; 1 is the start). */
  atNightfall: Earned[];
  atDawn: Earned[];
  calls: CallTally;
  callsByKind: CallTally[];
  /** Milliseconds a step: mean, 95th percentile, worst (timeSteps only). */
  stepMs: { mean: number; p95: number; max: number } | null;
  /** Lives left as each night ended (index: wave). */
  livesAtWaveEnd: number[];
  /** Commands the world refused (reason), and invariant breaks. */
  rejected: string[];
  problems: string[];
  defeat: boolean;
  /** BALANCE.md §3 for the whole run (won: every night held, the boss's retreat), the directors' steps (night and day together), mean seconds from spawn to kill. */
  flow: FlowSummary;
  pace: PaceSummary;
  killSeconds: number | null;
  /** The boss peak (BUILD_1B §18.2). */
  boss: BossRun;
  /** The most direct calls open at once (G6, R2): without the boss up (≤ 2) and with it (≤ 3). */
  directMax: number;
  directMaxBoss: number;
};

/** Eyes and hands: one key a tick at most, when the hands are free and there is something seen to type. */
class Typist {
  private handsAt = 0;
  private backspace = false;

  constructor(private readonly hands: Keystrokes, private readonly eyes: Reader) {}

  key(w: World): CommandBody | null {
    this.eyes.look(w);
    const from = w.tick * STEP_MS;
    if (this.handsAt >= from + STEP_MS) return null;
    const at = Math.max(this.handsAt, from);
    if (this.backspace) {
      this.backspace = false;
      this.handsAt = at + this.hands.gap();
      return { t: "backspace", atMs: at };
    }
    const aim = this.aim(w);
    if (aim < 0) {
      this.handsAt = from + STEP_MS;
      return null;
    }
    const letter = this.hands.hit(aim);
    if (letter !== aim) this.backspace = this.hands.backspaceAfterSlip();
    this.handsAt = at + this.hands.gap();
    return { t: "key", letter, atMs: at };
  }

  /** The letter to aim at: the locked word's next once it is read; else the first of the word the eyes pick. */
  private aim(w: World): number {
    const { router, deck } = w.typing;
    const W = w.words;
    const letterOf = (s: number, k: number): number => deck.letters[deck.start[W.word[s]!]! + k]!;
    if (router.lock >= 0) return this.eyes.seen(w, router.lock) ? letterOf(router.lock, W.typed[router.lock]!) : -1;
    const s = this.eyes.pick(w, this.hands.meanMs);
    return s >= 0 ? letterOf(s, 0) : -1;
  }
}

/** §12 gate 6 and TK 6.5: bright ≤ cap; only bright calls hold a word, each its own; distinct first letters, no twins, nothing one edit apart; the lock on a bright call's word. */
export function callProblems(w: World): string[] {
  const W = w.words;
  const C = w.calls;
  const { deck } = w.typing;
  const out: string[] = [];
  const bright = C.live().filter((c) => C.bright[c] === 1).length;
  if (bright > MODES[w.mode].open) out.push(bright + " bright calls");
  const direct = C.live().filter((c) => C.kind[c] === CALL_KIND.direct).length;
  if (direct > (bossSlot(w) >= 0 ? DIRECT.openBoss : DIRECT.open)) out.push(direct + " direct calls open"); // G6 (R2)
  for (const c of C.live()) if (C.bright[c] === 1 && C.state[c] !== CALL_STATE.open) out.push("call " + c + " is bright and queued");
  for (const c of C.live()) if (C.word[c]! >= 0 && (C.bright[c] !== 1 || W.call[C.word[c]!] !== c)) out.push("call " + c + " holds a word it should not");
  const live = W.live();
  const texts = live.map((s) => wordText(deck, W.word[s]!));
  if (new Set(texts.map((text) => text[0])).size !== texts.length) out.push("first letters " + texts.join(" / "));
  for (let i = 0; i < live.length; i += 1) {
    if (C.word[W.call[live[i]!]!] !== live[i]) out.push("word " + texts[i] + " without its call");
    for (let j = i + 1; j < live.length; j += 1) {
      const start = (k: number) => deck.start[W.word[live[k]!]!]!;
      if (texts[i] === texts[j]) out.push("twins " + texts[i]);
      else if (withinOneEdit(deck.letters, start(i), texts[i]!.length, start(j), texts[j]!.length)) out.push("one edit " + texts[i] + " / " + texts[j]);
    }
  }
  const lock = w.typing.router.lock;
  if (lock >= 0 && C.bright[W.call[lock]!] !== 1) out.push("the lock is on a word of no bright call");
  return out;
}

const worldOf = (spec: Pick<BotSpec, "seed" | "deck" | "expected" | "vocab" | "mode" | "hands" | "human" | "pace" | "sandbox" | "learn">): World =>
  createWorld({ seed: spec.seed, deck: spec.deck, expected: spec.expected ?? spec.hands?.wpm ?? (spec.human?.wpm || 35), vocab: spec.vocab, mode: spec.mode, pace: spec.pace, sandbox: spec.sandbox, learn: spec.learn });

/** The run is over: the Bastion fell, the boss retreated, or the last night asked for ended (a boss night holds until its retreat). */
const over = (w: World, nights: number): boolean => w.phase === "defeat" || w.phase === "victory" || (w.wave >= nights && w.waveEnded[nights] === 1 && w.phase !== "night");

/** The night and day directors' steps as one stage's (BALANCE.md §7 B7): steps a wave over both, the spawn and call scales' range. */
export function paceSummary(w: World): PaceSummary {
  const night = w.pace.night.summary();
  const day = w.pace.day.summary();
  const waves = Math.max(1, w.wave);
  return {
    steps: night.steps + day.steps, waves, stepsPerWave: (night.steps + day.steps) / waves, maxWaveSteps: Math.max(night.maxWaveSteps, day.maxWaveSteps),
    spawnMin: Math.min(night.spawnMin, day.spawnMin), spawnMax: Math.max(night.spawnMax, day.spawnMax), spawnScale: night.spawnScale, composition: night.composition, supports: night.supports,
  };
}

/** What the world has earned so far (Earned). */
export function earned(w: World): Earned {
  const s = w.stats;
  const gold = s[STAT.goldKill]! + s[STAT.goldProduce]! + s[STAT.goldWave]! + s[STAT.goldEarly]! + s[STAT.goldWord]!;
  return { gold: gold / 1000, wood: s[STAT.wood]!, food: s[STAT.food]!, knowledge: w.knowledge };
}

const tally = (): CallTally => ({ made: 0, bright: 0, typed: 0, finished: 0, perfect: 0, ignored: 0, dark: 0 });

/** Reads a tick's rare events into the run: refusals, lives at a night's end, nightfall and dawn, the calls' lives. */
class Meter {
  private readonly open = new Map<number, { kind: number; bright: boolean; typed: number }>();

  constructor(private readonly run: BotRun) {}

  read(w: World): void {
    const run = this.run;
    for (const event of w.events.rare) {
      if (event.t === "rejected") run.rejected.push(event.command + ": " + event.reason);
      else if (event.t === "waveEnd") run.livesAtWaveEnd[event.wave] = w.lives;
      else if (event.t === "phase" && event.phase === "night") run.atNightfall[event.day] = earned(w);
      else if (event.t === "phase" && event.phase === "day") run.atDawn[event.day] = earned(w);
      else if (event.t === "call" && event.state === "made") this.open.set(event.call, { kind: event.kind, bright: false, typed: 0 });
      else if (event.t === "call" && event.state === "bright") this.open.get(event.call)!.bright = true;
      else if (event.t === "wordHit") this.open.get(event.call)!.typed += 1;
      else if (event.t === "callEnd") {
        const call = this.open.get(event.call)!;
        this.open.delete(event.call);
        for (const into of [run.calls, (run.callsByKind[call.kind] ??= tally())]) {
          into.made += 1;
          if (call.bright) into.bright += 1;
          else into.dark += 1;
          if (call.typed > 0) into.typed += 1;
          else if (call.bright) into.ignored += 1;
          if (event.finished && call.typed > 0) into.finished += 1;
          if (event.perfect) into.perfect += 1;
        }
      }
    }
    w.events.rare.length = 0;
  }
}

export function runBot(spec: BotSpec): BotRun {
  const world = worldOf(spec);
  const bot = createRng(spec.botSeed ?? spec.seed);
  const typist = spec.hands === null || spec.human !== undefined ? null : new Typist(new Keystrokes(spec.hands, bot.ai), new Reader(bot.props));
  const human = spec.human === undefined ? null : new HumanHands(spec.human, bot.ai, bot.props);
  const plan = spec.plan();
  const queue: CommandBody[] = [];
  const view = { w: world, send: (body: CommandBody) => void queue.push(body) };
  const run: BotRun = {
    world, log: [], hashes: [], stats: statsObject(world.stats), ticks: 0, typedTicks: [0, 0], emptyTicks: [0, 0], phaseTicks: [0, 0], byDay: [], windowMax: 0, windowAt: 0,
    atNightfall: [], atDawn: [], calls: tally(), callsByKind: [], stepMs: null, livesAtWaveEnd: [], rejected: [], problems: [], defeat: false,
    flow: world.pace.meter.summary("quit"), pace: paceSummary(world), killSeconds: null, boss: new BossProbe().run, directMax: 0, directMaxBoss: 0,
  };
  const probe = new BossProbe();
  run.atDawn[1] = earned(world);
  const meter = new Meter(run);
  const times: number[] = [];
  const maxTicks = spec.maxTicks ?? 60 * 60 * 30;
  while (world.tick < maxTicks) {
    plan.tick(view);
    // A placement or a menu takes the eyes off the words for a moment (BALANCE.md §6).
    if (human !== null && queue.some((body) => body.t === "build" || body.t === "upgrade" || body.t === "hire" || body.t === "sandbox")) human.lookAway();
    const key = typist?.key(world) ?? null;
    if (key !== null) queue.push(key);
    if (human !== null) queue.push(...human.keys(world));
    const commands = queue.splice(0).map((body) => ({ ...body, tick: world.tick }) as Command);
    run.log.push(...commands);
    const phase = world.phase;
    const day = (run.byDay[world.day] ??= { dayTyped: 0, dayTicks: 0, nightTyped: 0, nightTicks: 0 });
    const started = spec.timeSteps === true ? performance.now() : 0;
    step(world, commands);
    if (spec.timeSteps === true) times.push(performance.now() - started);
    const typed = world.typing.router.lock >= 0 ? 1 : 0;
    if (phase === "day" || phase === "night") {
      const k = phase === "day" ? 0 : 1;
      run.phaseTicks[k] += 1;
      run.typedTicks[k] += typed;
      if (typed === 0 && world.words.count === 0) run.emptyTicks[k] += 1;
      if (k === 0) [day.dayTicks, day.dayTyped] = [day.dayTicks + 1, day.dayTyped + typed];
      else [day.nightTicks, day.nightTyped] = [day.nightTicks + 1, day.nightTyped + typed];
    }
    if (world.typing.typedSum > run.windowMax) [run.windowMax, run.windowAt] = [world.typing.typedSum, world.tick];
    let direct = 0;
    for (let c = 0; c < world.calls.top; c += 1) if (world.calls.used[c] === 1 && world.calls.kind[c] === CALL_KIND.direct) direct += 1;
    if (bossSlot(world) >= 0) run.directMaxBoss = Math.max(run.directMaxBoss, direct);
    else run.directMax = Math.max(run.directMax, direct);
    spec.onTick?.(world);
    probe.tick(world);
    meter.read(world);
    if (spec.check === true && run.problems.length < 20) run.problems.push(...callProblems(world).map((p) => "tick " + world.tick + ": " + p));
    if (spec.hashEvery !== undefined && world.tick % spec.hashEvery === 0) run.hashes.push(hashHex(world));
    if (over(world, spec.nights)) break;
  }
  run.ticks = world.tick;
  run.stats = statsObject(world.stats);
  run.defeat = world.phase === "defeat";
  run.flow = world.pace.meter.summary(run.defeat ? "lost" : over(world, spec.nights) ? "won" : "quit");
  run.boss = probe.finish(world);
  run.pace = paceSummary(world);
  run.killSeconds = run.stats.kills > 0 ? run.stats.killTicks / run.stats.kills / 60 : null;
  if (times.length > 0) {
    const mean = times.reduce((sum, t) => sum + t, 0) / times.length;
    times.sort((a, b) => a - b);
    run.stepMs = { mean, p95: times[Math.floor(times.length * 0.95)]!, max: times[times.length - 1]! };
  }
  return run;
}

/** Steps a fresh world through a run's log, hashing every `every` ticks: a replay must give the run's hashes. */
export function replayHashes(spec: Pick<BotSpec, "seed" | "deck" | "expected" | "vocab" | "mode" | "hands" | "sandbox" | "learn">, log: readonly Command[], ticks: number, every: number): string[] {
  const world = worldOf(spec);
  const hashes: string[] = [];
  let next = 0;
  while (world.tick < ticks) {
    const from = next;
    while (next < log.length && log[next]!.tick === world.tick) next += 1;
    step(world, log.slice(from, next));
    world.events.rare.length = 0;
    if (world.tick % every === 0) hashes.push(hashHex(world));
  }
  return hashes;
}
