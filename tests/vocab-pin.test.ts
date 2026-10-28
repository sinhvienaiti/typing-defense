import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { deckFromLevels, VOCAB_LEVELS } from "../src/app/vocab";
import { filterVocabularyEntries, type VocabularyEntry, type VocabularyIndex } from "../src/kit/vocab";

const root = fileURLToPath(new URL("../", import.meta.url));
const vocabulary = join(root, "public/vocabulary");
const json = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8"));
const config = json<{ pin: string; files: string[] }>(join(root, "vocab.config.json"));
const manifest = json<{ pin: string; version: number; files: Record<string, string> }>(join(vocabulary, "vocab-manifest.json"));
const index = json<VocabularyIndex>(join(vocabulary, "index.json"));
const files = ["index.json", "levels/001.json", "levels/002.json", "levels/003.json", "levels/004.json", "levels/005.json", "ATTRIBUTION.md"];

function sources(directory: string): string[] {
  return readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = directory + "/" + entry.name;
    if (path === "src/kit") return [];
    return entry.isDirectory() ? sources(path) : [path];
  });
}

describe("the pinned vocabulary", () => {
  it("includes all seven configured files with their exact manifest checksums", () => {
    expect(config.files).toEqual(files);
    expect(Object.keys(manifest.files)).toEqual([...files].sort());
    for (const file of config.files) {
      const path = join(vocabulary, file);
      expect(existsSync(path), file).toBe(true);
      expect(createHash("sha256").update(readFileSync(path)).digest("hex"), file).toBe(manifest.files[file]);
    }
  });

  it("keeps the manifest pin and version aligned with the config and index", () => {
    expect(config.pin).toMatch(/^[a-f0-9]{40}$/);
    expect(manifest.pin).toBe(config.pin);
    expect(manifest.version).toBe(index.version);
  });

  it("contains every level the game can request at the index's file path", () => {
    for (let level = 1; level <= VOCAB_LEVELS; level += 1) {
      const entry = index.levels.find((entry) => entry.level === level);
      expect(entry, "level " + level).toBeDefined();
      expect(existsSync(join(vocabulary, entry!.file)), entry!.file).toBe(true);
    }
  });

  it("compiles the filtered levels into the established real deck hash", () => {
    const levels = Array.from({ length: VOCAB_LEVELS }, (_, n) => {
      const file = index.levels.find((entry) => entry.level === n + 1)!.file;
      return filterVocabularyEntries(json<{ entries: VocabularyEntry[] }>(join(vocabulary, file)).entries);
    });
    expect(deckFromLevels(levels).hash).toBe("9f36cfeb");
  });

  it("keeps game source, tests and scripts independent of the parent vocabulary", () => {
    const forbidden = "shared" + "/vocabulary";
    const matches = ["src", "tests", "scripts"].flatMap(sources).filter((file) => readFileSync(join(root, file), "utf8").includes(forbidden));
    expect(matches).toEqual([]);
  });
});
