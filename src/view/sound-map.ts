/**
 * What each thing that happens sounds like, by id (1C step C10; docs/audio/THEME_SOUND_LIST.md; AUDIO_PIPELINE §11): the
 * one map from the rare events and the combat ring to sound ids. audio-min.ts plays an id from its real file when
 * public/assets/typing-defense/audio/manifest.json lists one, else the code-made sound the id had before C10. Ids marked
 * new have no code-made sound (the owner's rule of 28/10: no synthesized stand-ins): they stay silent until their file.
 */
import { FX, type RareEvent } from "../sim/events";
import { PROJECTILE } from "../sim/stores/projectiles";
import { chainTier } from "../sim/systems/chain";
import { KEY } from "../typing/router";

const CALLS = ["call-power", "call-build", "call-harvest", "call-chop", "call-mine", "call-quiz", "call-ult", "call-direct"] as const;
const FIRES: Readonly<Record<number, string>> = { [PROJECTILE.arrow]: "arrow-fire", [PROJECTILE.shell]: "cannon-fire", [PROJECTILE.bolt]: "bolt-fire", [PROJECTILE.fireball]: "fireball-fire", [PROJECTILE.wordShot]: "wordshot-fire", [PROJECTILE.feather]: "feather-fall" };
const RING: Readonly<Record<number, string>> = { [FX.hit]: "hit", [FX.burst]: "blast", [FX.death]: "ink-puff", [FX.leak]: "leak", [FX.coin]: "coin", [FX.block]: "block", [FX.soldierDown]: "soldier-down", [FX.fizzle]: "fizzle", [FX.bossHit]: "boss-hit" };

/** Every id, the ones with no sound yet (no file, no code-made one) marked: the list for the audio pipeline. */
export const SOUND_IDS = {
  made: ["call-power", "call-build", "call-harvest", "call-chop", "call-mine", "call-quiz", "key-right", "key-wrong", "word-hit", "word-hit-bell", "chain-callout",
    "wordshot-fire", "arrow-fire", "blast", "ink-puff", "coin", "leak", "night-fall", "dawn", "defeat", "day-countdown", "direct-break", "direct-pin", "direct-shield", "helper-panic",
    "boss-warn", "boss-lull", "boss-emerge", "boss-phase", "boss-roots", "boss-roots-hit", "boss-slam", "boss-drain", "boss-drain-hit", "boss-retreat", "ui-move", "ui-pick", "ui-off", "ui-lamp"],
  new: ["key-lock", "key-group", "chain-step", "chain-tier", "call-ult", "call-direct", "cannon-fire", "bolt-fire", "fireball-fire", "feather-fall", "hit", "block", "soldier-down", "fizzle",
    "boss-hit", "boss-summon", "build-start", "build-done", "sell", "house-stun", "ult-cast", "wave-start", "night-called", "harvest-done", "tree-fall", "victory"],
} as const;

/** Events that always play one id. */
const ONE: Partial<Record<RareEvent["t"], string>> = {
  panic: "helper-panic", bossWarn: "boss-warn", bossLull: "boss-lull", bossEmerge: "boss-emerge", bossPhase: "boss-phase", bossRetreat: "boss-retreat", defeat: "defeat",
  victory: "victory", built: "build-start", finished: "build-done", sold: "sell", stun: "house-stun", ult: "ult-cast", waveStart: "wave-start", nightCalled: "night-called",
  harvested: "harvest-done", felled: "tree-fall",
};

/** The ids event plays, in order. */
export function eventSounds(event: RareEvent): string[] {
  const one = ONE[event.t];
  if (one !== undefined) return [one];
  if (event.t === "call") return event.state === "bright" ? [CALLS[event.kind] ?? "call-power"] : [];
  if (event.t === "wordKey") return event.result === KEY.wrong || event.result === KEY.stray ? ["key-wrong"] : event.result === KEY.group ? ["key-group"] : event.result === KEY.lock ? ["key-right", "key-lock"] : ["key-right"];
  if (event.t === "wordHit") return event.grade === "perfect" || event.grade === "flash" ? ["word-hit", "word-hit-bell"] : ["word-hit"];
  if (event.t === "chain") return [event.callout ? "chain-callout" : event.tier > chainTier(Math.max(0, event.chain - 1)) ? "chain-tier" : "chain-step"];
  if (event.t === "phase") return event.phase === "night" ? ["night-fall"] : event.phase === "dawn" ? ["dawn"] : [];
  if (event.t === "direct") return event.ok ? [["direct-break", "direct-pin", "direct-shield"][event.verb] ?? "direct-break"] : [];
  if (event.t !== "bossStrike") return [];
  if (event.move === "roots" || event.move === "drain") return ["boss-" + event.move + (event.hit ? "-hit" : "")];
  return event.move === "summon" ? ["boss-summon"] : event.hit ? ["boss-slam"] : [];
}

/** The id a combat-ring entry plays (a shot by its projectile kind), null for none (spawns). */
export const ringSound = (kind: number, value: number): string | null => (kind === FX.fire ? (FIRES[value] ?? null) : (RING[kind] ?? null));

/** The bus an id plays on (TK 24.2): typing for keys, words, the chain and the calls; ui for menus; world for the rest. */
export const busOf = (id: string): "typing" | "ui" | "world" => (/^(key|word|chain|call)-/.test(id) ? "typing" : id.startsWith("ui-") || id === "day-countdown" ? "ui" : "world");
