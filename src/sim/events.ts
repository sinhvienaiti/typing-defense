/**
 * What the simulation tells its readers (docs/td/TYPING_DEFENSE_DESIGN.md
 * 25.11): a dense ring of combat effects in typed columns, and an array of
 * rare events. Readers (view, sound, HUD, tests) never change the world; the
 * session empties `rare` once a frame has read it. Neither is in the hash.
 */
import type { Grade } from "../content/types";

/** bossHit: damage on the boss, value = damage × 32 + damage type × 8 + its SOURCE. */
export const FX = { spawn: 1, fire: 2, hit: 3, burst: 4, death: 5, leak: 6, coin: 7, block: 8, soldierDown: 9, fizzle: 10, bossHit: 11 } as const;

const RING = 8192;

export class CombatRing {
  readonly size = RING;
  /** Total pushed; a reader keeps its own count and reads the slots in between. */
  written = 0;
  readonly kind = new Uint8Array(RING);
  readonly x = new Float64Array(RING);
  readonly z = new Float64Array(RING);
  readonly value = new Int32Array(RING);
  readonly tick = new Int32Array(RING);

  push(kind: number, x: number, z: number, value: number, tick: number): void {
    const slot = this.written % this.size;
    this.kind[slot] = kind;
    this.x[slot] = x;
    this.z[slot] = z;
    this.value[slot] = value;
    this.tick[slot] = tick;
    this.written += 1;
  }
}

export type RareEvent = { tick: number } & (
  | { t: "built"; building: number; def: number } // a site or an upgrade begins
  | { t: "finished"; building: number; level: number }
  | { t: "sold"; building: number; gold: number; wood: number; undo: boolean }
  | { t: "levelSet"; building: number; level: number }
  | { t: "rejected"; command: string; reason: string }
  | { t: "phase"; phase: "day" | "night" | "dawn"; day: number }
  | { t: "bossWarn"; day: number; route: number }
  | { t: "bossLull"; end: number }
  | { t: "bossEmerge"; route: number; hp: number }
  | { t: "bossPhase"; phase: number }
  | { t: "bossStrike"; move: "roots" | "slam" | "summon" | "keep"; hit: boolean; end: number; count: number }
  | { t: "bossRetreat"; gold: number }
  | { t: "victory" }
  | { t: "stun"; building: number; until: number }
  | { t: "ult"; x: number; z: number } // Tối Thượng cast (R2)
  | { t: "drum"; enemy: number; end: number } // a mechanic begins, its direct call's window to `end`
  | { t: "direct"; enemy: number; ok: boolean; x: number; z: number } // broken by its word, or let run (healed)
  | { t: "panic"; agent: number }
  | { t: "waveStart"; wave: number }
  | { t: "waveEnd"; wave: number; bonus: number }
  | { t: "nightCalled"; day: number; bonus: number }
  | { t: "leak"; enemy: number; lives: number }
  | { t: "defeat" }
  | { t: "agentOrdered"; agent: number; building: number } // building −1: a point
  | { t: "harvested"; building: number; plot: number }
  | { t: "felled"; tree: number }
  | { t: "call"; call: number; kind: number; state: "made" | "open" | "bright" | "dim" }
  | { t: "callEnd"; call: number; kind: number; perfect: boolean; finished: boolean }
  | { t: "wordSpawn"; word: number; call: number }
  | { t: "wordKey"; word: number; result: number }
  | { t: "wordHit"; word: number; call: number; grade: Grade; errors: number; quality: number; len: number; ms: number; wait: number; fam: number }
  | { t: "pace"; night: boolean; lever: string; dir: number; amount: number; level: number }
  | { t: "chain"; chain: number; tier: number; callout: boolean }
);

export class Events {
  readonly ring = new CombatRing();
  readonly rare: RareEvent[] = [];
}
