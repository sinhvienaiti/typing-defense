/**
 * window.__td: what the browser scenarios (scripts/visual/scenarios/td-*.mjs) read and drive. A chunk of its own, fetched
 * once the page is usable (R3 step 1, docs/td/R3_PLAN.md §3.1: out of the entry chunk); the scenarios wait for
 * window.__td before they call it, and its ready() for the rest. It changes the run only through the commands a player
 * sends, so a scenario's log replays like any other.
 */
import type { Mode } from "../content/types";
import type { CommandBody } from "../sim/commands";
import type { RareEvent } from "../sim/events";
import { hashHex } from "../sim/hash";
import { canPlace } from "../sim/placement";
import { statsObject } from "../sim/stats";
import { PATH_MAX } from "../sim/stores/agents";
import type { LearnHeader } from "../sim/systems/learn";
import type { PaceHeader } from "../sim/systems/pace";
import type { World } from "../sim/world";
import { wordText, type Deck } from "../typing/decks";
import { KIND } from "../typing/letters";
import type { Selection } from "./selection";
import type { Session } from "./session";

/** What main.ts hands over: the run, and getters for what may still change (the header and mode set on the title). */
export type DevContext = {
  world: World; session: Session; deck: Deck; source: string; sandbox: boolean; selection: Selection; recent: readonly RareEvent[];
  costs: { update: number[]; draw: number[] };
  /** Painted, and the chunks this page wants are in or given up. */
  ready(): boolean;
  chunks(): Record<string, boolean>;
  /** The map view: its kind, and in 3D its tier, last frame's draw calls and triangles and the camera (1C). */
  view(): Record<string, number | string>;
  header(): PaceHeader & { expected: number };
  mode(): Mode;
  replayed(): { day: number; tick: number; hash: string; matched: boolean } | null;
  /** The run's study lists (R3), and Học's store with the learning events sent and queued (td-1b-learn). */
  learn(): LearnHeader;
  learning(): unknown;
  /** BALANCE.md §7 B9's numbers, through app/retry.ts (its chunk; null when it is missing). */
  balance(): Promise<unknown>;
};

export function installDevTools(ctx: DevContext): void {
  const { world, session, deck, selection } = ctx;
  (window as unknown as { __td?: object }).__td = {
    ready: () => ctx.ready(),
    // Which lazy chunks are in (td-1b-chunks: a failed one comes in when wanted again).
    chunks: () => ctx.chunks(),
    view: () => ctx.view(),
    // What a Node replay of log() needs besides the log (scripts/td/replay.ts).
    flags: () => ({ sandbox: ctx.sandbox, seed: world.seed, content: world.c.hash, deck: deck.hash, vocabulary: ctx.source, expected: ctx.header().expected, pace: { k: ctx.header().k, director: ctx.header().director }, mode: ctx.mode(), learn: ctx.learn() }),
    send: (command: CommandBody) => session.send(command),
    // TK 25.12's load test: n enemies on the routes, through the sandbox's logged command.
    flood: (n: number) => session.send({ t: "sandbox", op: { op: "flood", value: n } }),
    costs: () => ({ update: ctx.costs.update.slice(), draw: ctx.costs.draw.slice() }),
    stats: () => statsObject(world.stats),
    // A play-test's numbers for BALANCE.md §7 B9: the run's flow (night meter) and the profile the game keeps.
    balance: () => ctx.balance(),
    learning: () => ctx.learning(),
    dayHashes: () => session.dayHashes.slice(),
    retry: () => ctx.replayed(),
    hash: () => hashHex(world),
    defs: () => world.c.buildings.map((building) => building.id),
    canPlace: (id: string, x: number, z: number) => canPlace(world, world.c.buildingIndex(id), Math.round(x * 4), Math.round(z * 4)),
    events: () => ctx.recent.slice(),
    log: () => session.log.slice(),
    // Ages in ticks; the call is its id; review: a Từ Ôn (R3).
    liveWords: () => {
      const W = world.words;
      return W.live().map((s) => ({
        id: W.id(s), text: wordText(deck, W.word[s]!), typed: W.typed[s]!, errors: W.errors[s]!, tier: W.tier[s]!, call: world.calls.id(W.call[s]!),
        age: world.tick - W.born[s]!, locked: world.typing.router.lock === s, review: W.kind[s] === KIND.review,
      }));
    },
    typing: () => ({ chain: world.typing.chain, lock: world.typing.router.lock, typedTicks: world.typing.typedSum }),
    ui: () => ({ agent: selection.agent, focus: selection.focus, call: selection.call, building: selection.building, kind: selection.kind, paused: selection.paused, tactical: selection.tactical, panel: selection.panel }),
    // Agents: hero first; mode as MODE in sim/stores/walkers.ts; goal a building id (−1 none); path: x, z, x, z… ahead. Calls: kind as CALL_KIND.
    state: () => {
      const { buildings: B, units: U, agents: A, npcs: N, calls: C } = world;
      const T = world.typing;
      return {
        tick: world.tick, phase: world.phase, day: world.day, phaseEnd: world.phaseEnd, wave: world.wave, lives: world.lives, mode: world.mode,
        gold: world.gold / 1000, wood: world.wood, food: world.food, seeds: world.seeds, knowledge: world.knowledge,
        enemies: world.enemies.count, projectiles: world.projectiles.count,
        buildings: B.live().map((b) => ({
          id: B.id(b), def: world.c.buildings[B.def[b]!]!.id, level: B.level[b]!, x: B.x[b]!, z: B.z[b]!, ready: B.ready[b] === 1, upTo: B.upTo[b]!, progress: B.progress[b]!,
          charges: B.charges[b]!, pile: B.pile[b]! / 1000, stunned: B.stunUntil[b]! > world.tick,
        })),
        boss: (() => {
          const S = world.boss;
          const e = world.enemies.slotOf(S.e);
          return { ...S, targets: Array.from(S.targets.subarray(0, S.targetN)), hp: e < 0 ? 0 : world.enemies.hp[e]!, dist: e < 0 ? -1 : world.enemies.dist[e]!, x: e < 0 ? 0 : world.enemies.x[e]!, z: e < 0 ? 0 : world.enemies.z[e]! };
        })(),
        soldiers: U.live().map((s) => ({ alive: U.hp[s]! > 0, contact: U.contact[s] === 1, x: U.x[s]!, z: U.z[s]! })),
        // R2: Tối Thượng; the enemies with a mechanic (drumming until castEnd, stunned until stunUntil).
        ult: { ...world.ult, aimed: undefined },
        foes: world.enemies.live().filter((e) => world.c.enemies[world.enemies.def[e]!]!.ability !== null || world.c.enemies[world.enemies.def[e]!]!.def.split !== undefined).map((e) => ({
          id: world.enemies.id(e), def: world.c.enemies[world.enemies.def[e]!]!.id, x: world.enemies.x[e]!, z: world.enemies.z[e]!, hp: world.enemies.hp[e]!, castEnd: world.enemies.castEnd[e]!, stunUntil: world.enemies.stunUntil[e]!, takenUntil: world.enemies.takenUntil[e]!,
        })),
        agents: A.live().map((a) => ({
          x: A.x[a]!, z: A.z[a]!, mode: A.mode[a]!, goal: A.goal[a]! < 0 ? -1 : B.id(A.goal[a]!), panic: A.panic[a]!,
          path: Array.from(A.path.subarray((a * PATH_MAX + A.next[a]!) * 2, (a * PATH_MAX + A.pathN[a]!) * 2)),
        })),
        npcs: N.live().map((n) => ({ kind: N.kind[n]!, task: N.task[n]!, job: N.job[n]!, x: N.x[n]!, z: N.z[n]! })),
        calls: C.live().map((c) => ({ id: C.id(c), kind: C.kind[c]!, open: C.state[c] === 1, bright: C.bright[c] === 1, words: C.words[c]!, done: C.done[c]!, x: C.x[c]!, z: C.z[c]!, agent: C.agent[c]!, burst: C.burst[c] === 1, foe: C.foe[c]!, expire: C.expire[c]! })),
        // R3: the book with each word's due tick and times typed back (BUILD_1B §11.2), the plan's counts, the live Từ Ôn's slot.
        review: Array.from(T.review.subarray(0, T.reviewN), (word) => wordText(deck, word)),
        reviewAt: Array.from(T.reviewAt.subarray(0, T.reviewN)), reviewBack: Array.from(T.reviewBack.subarray(0, T.reviewN)),
        learn: { dueDealt: world.learn.dueDealt, freshDealt: world.learn.freshDealt, live: world.learn.live },
        trees: world.map.trees.map(([x, z], t) => ({ x, z, standing: world.trees.standing[t] === 1, marked: world.trees.marked[t] === 1, left: world.trees.left[t]!, worker: world.trees.worker[t]!, progress: world.trees.progress[t]! })),
      };
    },
  };
}
