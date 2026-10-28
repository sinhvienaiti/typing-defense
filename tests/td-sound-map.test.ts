import { describe, expect, it } from "vitest";
import { FX, type RareEvent } from "../src/sim/events";
import { PROJECTILE } from "../src/sim/stores/projectiles";
import { KEY } from "../src/typing/router";
import { SOUND_IDS, busOf, eventSounds, ringSound } from "../src/view/sound-map";

/** 1C step C10: every event the game sounds goes through one id (src/view/sound-map.ts); new ids have no code-made sound. */
describe("C10: the event → sound-id map", () => {
  const all = new Set<string>([...SOUND_IDS.made, ...SOUND_IDS.new]);
  const ev = (body: object): RareEvent => ({ tick: 0, ...body }) as RareEvent;

  it("names an id for each key result, a typed word, the chain, the calls and the boss", () => {
    expect(eventSounds(ev({ t: "wordKey", word: 1, result: KEY.lock }))).toEqual(["key-right", "key-lock"]);
    expect(eventSounds(ev({ t: "wordKey", word: 1, result: KEY.advance }))).toEqual(["key-right"]);
    expect(eventSounds(ev({ t: "wordKey", word: 1, result: KEY.wrong }))).toEqual(["key-wrong"]);
    expect(eventSounds(ev({ t: "wordKey", word: -1, result: KEY.stray }))).toEqual(["key-wrong"]);
    expect(eventSounds(ev({ t: "wordHit", grade: "perfect" }))).toEqual(["word-hit", "word-hit-bell"]);
    expect(eventSounds(ev({ t: "chain", chain: 3, tier: 0, callout: false }))).toEqual(["chain-step"]);
    expect(eventSounds(ev({ t: "chain", chain: 5, tier: 1, callout: false }))).toEqual(["chain-tier"]);
    expect(eventSounds(ev({ t: "chain", chain: 10, tier: 2, callout: true }))).toEqual(["chain-callout"]);
    expect(eventSounds(ev({ t: "call", call: 1, kind: 3, state: "bright" }))).toEqual(["call-chop"]);
    expect(eventSounds(ev({ t: "call", call: 1, kind: 3, state: "dim" }))).toEqual([]);
    expect(eventSounds(ev({ t: "bossStrike", move: "roots", hit: true }))).toEqual(["boss-roots-hit"]);
    expect(eventSounds(ev({ t: "bossStrike", move: "keep", hit: true }))).toEqual(["boss-slam"]);
    const types = ["built", "finished", "sold", "phase", "bossWarn", "bossLull", "bossEmerge", "bossPhase", "bossRetreat", "victory", "defeat", "stun", "ult", "direct", "panic", "waveStart", "nightCalled", "harvested", "felled"];
    for (const t of types) for (const id of eventSounds(ev({ t, phase: "night", ok: true, verb: 1 }))) expect(all, t + " → " + id).toContain(id);
  });

  it("names the combat ring's shots by projectile and its hits, deaths, coins, leaks; buses by id", () => {
    for (const kind of Object.values(PROJECTILE)) expect(all).toContain(ringSound(FX.fire, kind));
    for (const kind of [FX.hit, FX.burst, FX.death, FX.leak, FX.coin, FX.block, FX.soldierDown, FX.fizzle, FX.bossHit]) expect(all).toContain(ringSound(kind, 0));
    expect(ringSound(FX.spawn, 0)).toBeNull();
    expect([busOf("key-right"), busOf("call-mine"), busOf("ui-pick"), busOf("day-countdown"), busOf("blast")]).toEqual(["typing", "typing", "ui", "ui", "world"]);
    expect(SOUND_IDS.made.filter((id) => (SOUND_IDS.new as readonly string[]).includes(id))).toEqual([]);
  });
});
