/**
 * What the boss peak did in one run (docs/td/BUILD_1B.md §18.2): read every tick by the bot. The lull and the rise,
 * the first hit and the retreat (ticks), how far along its road it was then, lives before the peak and at the end,
 * its damage by source, buildings rooted, attack buildings stunned while it was in their reach, and Nhàn I from the
 * end of the lull to the end of the run (the night meter's idle ticks, G8).
 */
import { STAT } from "../../src/sim/stats";
import { BOSS } from "../../src/sim/stores/boss";
import { bossSlot } from "../../src/sim/systems/boss";
import type { World } from "../../src/sim/world";

export type BossRun = {
  /** The lull came (the run reached the peak). */
  reached: boolean;
  retreated: boolean;
  /** Ticks: lull, rise, first damage, retreat (−1 none). */
  lull: number;
  rise: number;
  firstHit: number;
  retreat: number;
  /** Share of its road walked when it retreated (or at the end). */
  pathAt: number;
  livesAtLull: number;
  livesEnd: number;
  damage: number;
  typed: number;
  hero: number;
  roots: number;
  /** Ticks × attack buildings with the boss in reach, and of those stunned. */
  inReach: number;
  stunned: number;
  /** Night meter's idle ticks and ticks from the rise on (G8). */
  idle: number;
  fed: number;
};

export const emptyBossRun = (): BossRun => ({ reached: false, retreated: false, lull: -1, rise: -1, firstHit: -1, retreat: -1, pathAt: 0, livesAtLull: -1, livesEnd: -1, damage: 0, typed: 0, hero: 0, roots: 0, inReach: 0, stunned: 0, idle: 0, fed: 0 });

export class BossProbe {
  readonly run = emptyBossRun();
  private meterAt: number[] | null = null;

  tick(w: World): void {
    const r = this.run;
    const S = w.boss;
    if (S.stage >= BOSS.lull && r.lull < 0) [r.reached, r.lull, r.livesAtLull] = [true, w.tick, w.lives];
    if (S.stage >= BOSS.emerge && this.meterAt === null) this.meterAt = w.pace.meter.state().slice(0, 7);
    const e = bossSlot(w);
    if (e >= 0 && r.rise < 0) r.rise = w.tick;
    if (r.firstHit < 0 && w.stats[STAT.bossDamage]! > 0) r.firstHit = w.tick;
    if (S.stage >= BOSS.retreat && r.retreat < 0) [r.retreated, r.retreat] = [true, w.tick];
    if (e >= 0 && S.stage === BOSS.fight) {
      r.pathAt = w.enemies.dist[e]! / w.lanes[w.enemies.route[e]!]!.length;
      const B = w.buildings;
      for (let b = 0; b < B.top; b += 1) {
        const attack = B.used[b] === 1 && B.ready[b] === 1 ? w.c.buildings[B.def[b]!]!.attack : null;
        if (attack === null) continue;
        const range = attack.levels[B.level[b]! - 1]!.range;
        if ((B.x[b]! - w.enemies.x[e]!) ** 2 + (B.z[b]! - w.enemies.z[e]!) ** 2 > range * range) continue;
        r.inReach += 1;
        if (B.stunUntil[b]! > w.tick) r.stunned += 1;
      }
    }
  }

  /** At the end of the run. */
  finish(w: World): BossRun {
    const r = this.run;
    const s = w.stats;
    [r.livesEnd, r.damage, r.typed, r.hero, r.roots] = [w.lives, s[STAT.bossDamage]!, s[STAT.bossTyped]!, s[STAT.bossHero]!, s[STAT.rootsHits]!];
    if (this.meterAt !== null) {
      const now = w.pace.meter.state();
      [r.fed, r.idle] = [now[0]! - this.meterAt[0]!, now[6]! - this.meterAt[6]!];
    }
    return r;
  }
}
