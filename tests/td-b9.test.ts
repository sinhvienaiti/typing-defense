import { describe, expect, it } from "vitest";
import { playtestFile, type RunOf } from "../src/app/retry";
import { paceHeader } from "../src/app/skill";
import type { Session } from "../src/app/session";
import { b9Report, b9Row, ownerBot, readPlaytest, replayPlaytest } from "./td/b9";
import { botById, botProfile, playStage } from "./td/flow";
import { realDeck } from "./td/typing";

/**
 * The owner's play-test pack (docs/td/BUILD_1B.md §22, PLAYTEST_1B.md; R3 part B): "Chép số chơi thử" saves the numbers
 * and the run (header and whole log); scripts/td/b9.ts replays it on Node to the page's hash and grades B9 against the
 * bot with the same profile. Here a bot's story run stands in for the owner's page.
 */
describe("the play-test file and B9 (BUILD_1B §22, BALANCE.md §7 B9)", () => {
  const deck = realDeck();
  const bot = botById("standard");
  const profile = botProfile(bot, "balanced");
  const played = playStage(bot, "balanced", 3, deck, true, 2);
  const header = paceHeader(profile, true);
  const run: RunOf = { world: played.world, session: { log: played.log } as unknown as Session, seed: 3, sandbox: false, deck, mode: "balanced", header, learn: played.learn, fresh: () => "" };
  const file = readPlaytest(JSON.stringify(playtestFile(run, profile, "shared")));

  it("holds the numbers B9 reads and the run in the replay's shape; replayed on Node it reaches the page's hash", () => {
    expect(file.numbers.flow).toEqual(played.world.pace.meter.summary("quit"));
    expect(file.numbers.profile).toEqual(profile);
    expect(file.run).toMatchObject({ seed: 3, sandbox: false, mode: "balanced", expected: header.expected, pace: { k: header.k, director: true }, learn: played.learn, tick: played.world.tick });
    expect(replayPlaytest(file)).toMatchObject({ match: true });
    const broken = { ...file, run: { ...file.run!, log: file.run!.log.slice(0, -40) } };
    expect(replayPlaytest(broken)!.match).toBe(false);
  });

  it("grades B9 against a bot typing at the owner's measured E, a and CV (an old file with the numbers alone too)", { timeout: 30_000 }, () => {
    expect(ownerBot(profile)).toMatchObject({ id: "owner", tactics: "fair", spec: { wpm: 35, accuracy: bot.spec.accuracy } });
    const rows = [b9Row("ván 1", file, 2), b9Row("cũ", readPlaytest(JSON.stringify(file.numbers)), 2)];
    expect(rows.map((r) => r.replay?.match ?? null)).toEqual([true, null]);
    const lines: string[] = [];
    const gate = b9Report(rows, (text) => lines.push(text));
    expect(gate.id).toBe("B9");
    expect([gate.checks.length, gate.missing]).toEqual([2, []]);
    expect(lines.join("\n")).toMatch(/\| ván 1 \| khớp [0-9a-f]{8} \| dừng, \d+ mạng, /);
  });
});
