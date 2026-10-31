import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { copyNumbers, playtestFile, type RunOf } from "../src/app/retry";
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

  it("downloads the English filename and copies the same playtest JSON", async () => {
    let saved: Blob | undefined;
    const a = { href: "", download: "", click: vi.fn() };
    const create = vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      saved = blob as Blob;
      return "blob:playtest";
    });
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const clipboard = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("document", { createElement: vi.fn(() => a) });
    vi.stubGlobal("navigator", { clipboard: { writeText: clipboard } });
    try {
      copyNumbers(run, profile, "shared");
      expect(a.download).toBe(`wordwoven-playtest-s3-n${run.world.day}-${run.world.tick}.json`);
      expect(a.click).toHaveBeenCalledOnce();
      expect(create).toHaveBeenCalledOnce();
      expect(revoke).toHaveBeenCalledWith("blob:playtest");
      expect(saved?.type).toBe("application/json");
      const text = await saved!.text();
      expect(JSON.parse(text)).toEqual(file);
      expect(clipboard).toHaveBeenCalledWith(text);
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  });

  it("the B9 CLI reads both legacy and English filenames and replays both to the same hash", { timeout: 20_000 }, () => {
    mkdirSync("tmp", { recursive: true });
    const dir = mkdtempSync("tmp/b9-filenames-test-");
    const names = ["loi-goi-choi-thu-s3-n1.json", "wordwoven-playtest-s3-n1.json"];
    try {
      const paths = names.map((name) => {
        const path = join(dir, name);
        writeFileSync(path, JSON.stringify(file));
        return path;
      });
      const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/td/b9.ts", ...paths, "--seeds=1"], { encoding: "utf8", timeout: 15_000 });
      if (result.error) throw result.error;
      const expected: string[] = [];
      const rows = names.map((name) => b9Row(name, file, 1));
      const gate = b9Report(rows, (text) => expected.push(text));
      expect(rows.every((row) => row.replay?.match)).toBe(true);
      expect(result.status, result.stderr).toBe(gate.status === "pass" ? 0 : 1);
      expect(result.stderr).toBe("");
      expect(result.stdout).toContain(expected.join("\n") + "\n");
      for (const name of names) expect(result.stdout).toContain(`| ${name} | khớp ${file.run!.hash} |`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

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

  it("lists a sandbox run but keeps it out of B9 (no stage the bot can play)", () => {
    const sandboxed = { ...file, run: { ...file.run!, sandbox: true } };
    const row = b9Row("hộp cát", sandboxed, 2);
    expect([row.sandbox, row.bot, row.match]).toEqual([true, null, null]);
    const lines: string[] = [];
    const gate = b9Report([row], (text) => lines.push(text));
    expect(gate.checks.length).toBe(0);
    expect(lines.join("\n")).toMatch(/\| hộp cát \| .* \| hộp cát: không chấm B9 \|/);
  });
});
