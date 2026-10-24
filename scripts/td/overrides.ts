/**
 * Tuning overrides for `pnpm td:balance` (BUILD_1B §6.5, §18): `--set=PATH=VALUE`, PATH a rules export and its keys
 * (`POWER.quick`, `MODES.balanced.powerCdS`) or `slice` and its keys (`slice.waves.list.2.0.count`,
 * `slice.enemies.5.hp`), VALUE JSON. Applied in the main thread and in every worker before a world is made, so a
 * probe never edits the source; the report prints them. Not part of the build.
 */
import * as RULES from "../../src/content/rules";
import { SLICE_1A } from "../../src/content/slice-1a";

export const setsOf = (argv: readonly string[]): string[] => argv.filter((a) => a.startsWith("--set=")).map((a) => a.slice("--set=".length));

export function applySets(sets: readonly string[]): void {
  for (const set of sets) {
    const at = set.lastIndexOf("=");
    const keys = set.slice(0, at).split(".");
    let target = (keys[0] === "slice" ? SLICE_1A : (RULES as Record<string, unknown>)[keys[0]!]) as Record<string, unknown>;
    for (const key of keys.slice(1, -1)) target = target[key] as Record<string, unknown>;
    if (target === undefined || !(keys.at(-1)! in target)) throw new Error("td balance: no " + set.slice(0, at));
    target[keys.at(-1)!] = JSON.parse(set.slice(at + 1));
  }
}
