/**
 * "Chơi lại Ngày n" (BUILD_1B §4.3) and "Chép số chơi thử" (§14), a chunk of its own (R3 step 1, docs/td/R3_PLAN.md §3.1):
 * the results card's buttons, a page that replays a kept run and the dev handle load it; a page with none of those never
 * does. A lost run keeps its header, its log up to the lost night's day and the day hashes in sessionStorage; the next
 * page load replays the log to that day's start and checks its hash there.
 */
import type { Mode } from "../content/types";
import type { SkillProfile } from "../kit/balance";
import type { Command } from "../sim/commands";
import { hashHex } from "../sim/hash";
import { statsObject } from "../sim/stats";
import { NO_LEARN, setLearn, type LearnHeader } from "../sim/systems/learn";
import type { PaceHeader } from "../sim/systems/pace";
import { runLog, type World } from "../sim/world";
import type { Deck } from "../typing/decks";
import type { Session } from "./session";

export const RETRY_KEY = "td.retry";

/** What one page load reads: the run's header (R3: its study lists), its log up to day n's start, the hash there. */
export type Retry = { seed: number; sandbox: boolean; deck: string; content: string; mode: Mode; header: PaceHeader & { expected: number }; learn?: LearnHeader; day: number; tick: number; hashes: string[]; log: Command[] };
/** The replay's end, hashed before the first live step (review R1: the scenarios check this, not the kept hashes). */
export type Replayed = { day: number; tick: number; hash: string; matched: boolean };
/** The run the results card ends: what retryDay keeps, and the link of a fresh run of the page (`learn`: in Học). */
export type RunOf = { world: World; session: Session; seed: number; sandbox: boolean; deck: Deck; mode: Mode; header: PaceHeader & { expected: number }; learn: LearnHeader; fresh(learn: boolean): string };

/** The kept run when it is this page's (same seed, same story or sandbox), else null. */
export function readRetry(raw: string, seed: number, sandbox: boolean): Retry | null {
  try {
    const retry = JSON.parse(raw) as Retry;
    return retry !== null && retry.seed === seed && retry.sandbox === sandbox ? retry : null;
  } catch {
    return null;
  }
}

/**
 * Replays the kept log on the fresh world to day n's start. Another rule or vocabulary since: `restart` (the replay would
 * not be the run that was lost). The run's log and day hashes carry on from the kept ones; the replay's events are dropped.
 */
export function replayRetry(world: World, session: Session, deck: Deck, retry: Retry, restart: () => void): Replayed {
  setLearn(world, retry.learn ?? NO_LEARN);
  runLog(world, retry.log, retry.tick);
  const replayed = { day: retry.day, tick: world.tick, hash: hashHex(world), matched: false };
  replayed.matched = world.c.hash === retry.content && deck.hash === retry.deck && replayed.hash === retry.hashes[retry.day];
  if (!replayed.matched) restart();
  session.log.push(...retry.log);
  session.dayHashes.push(...retry.hashes);
  world.events.rare.length = 0;
  return replayed;
}

/** A play-test's numbers for BALANCE.md §7 B9: the run's flow (night meter) and the profile the game keeps. */
export function balanceOf(world: World, profile: SkillProfile) {
  const outcome = world.phase === "defeat" ? "lost" : world.phase === "victory" ? "won" : "quit";
  return { flow: world.pace.meter.summary(outcome), night: world.pace.night.summary(), day: world.pace.day.summary(), profile, stats: statsObject(world.stats), lives: world.lives, dayNumber: world.day };
}

/**
 * The play-test file (BUILD_1B §22, R3 part B): the numbers for B9 and the run itself, its header and whole log in the shape
 * scripts/td/replay.ts reads, so scripts/td/b9.ts replays it on Node to the same hash before it grades B9.
 */
export function playtestFile(run: RunOf, profile: SkillProfile, vocabulary: string) {
  const { world, header } = run;
  return { v: 1, game: "typing-defense", numbers: balanceOf(world, profile), run: { seed: run.seed, sandbox: run.sandbox, content: world.c.hash, deck: run.deck.hash, vocabulary, expected: header.expected, pace: { k: header.k, director: header.director }, mode: run.mode, learn: run.learn, tick: world.tick, hash: hashHex(world), log: run.session.log } };
}

/** Save the playtest JSON and copy the same data to the clipboard (BUILD_1B §14, §22). */
export function copyNumbers(run: RunOf, profile: SkillProfile, vocabulary: string): void {
  const text = JSON.stringify(playtestFile(run, profile, vocabulary));
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type: "application/json" })), download: `wordwoven-playtest-s${run.seed}-n${run.world.day}-${run.world.tick}.json` });
  a.click();
  URL.revokeObjectURL(a.href);
  void navigator.clipboard?.writeText(text).catch(() => undefined);
}

/** "Chơi lại Ngày n": the log up to the start of the lost night's day, and the hashes kept, for the next page load. */
export function retryDay(run: RunOf): void {
  const { world, session } = run;
  const day = world.day;
  const at = world.dayStarts[day];
  if (at === undefined || session.dayHashes[day] === undefined) return void (window.location.search = run.fresh(false));
  const kept: Retry = { seed: run.seed, sandbox: run.sandbox, deck: run.deck.hash, content: world.c.hash, mode: run.mode, header: run.header, learn: run.learn, day, tick: at, hashes: session.dayHashes.slice(0, day + 1), log: session.log.filter((command) => command.tick < at) };
  try {
    sessionStorage.setItem(RETRY_KEY, JSON.stringify(kept));
  } catch {
    return void (window.location.search = run.fresh(false));
  }
  window.location.search = run.fresh(run.mode === "learn");
}
