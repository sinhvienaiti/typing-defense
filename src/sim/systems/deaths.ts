/**
 * Deaths and leaks (TK 25.6 step 15). A kill's gold reaches the treasury on
 * the tick the enemy dies (TK 17.4: coins flying to the HUD are only a
 * picture), its Mảnh Chữ charge Tối Thượng near Draconis, and a Nuppeppō no
 * blast killed splits in two where it fell (BUILD_1B §8.1, §10); a leak costs
 * the Bastion its lives, and at 0 the run is lost.
 */
import { SHARDS } from "../../content/rules";
import { FX } from "../events";
import { STAT, bump } from "../stats";
import { BOSS } from "../stores/boss";
import type { World } from "../world";
import { LEAKED, SINKING } from "./move";
import { maxHp, putEnemy } from "./spawn";
import { ultShards } from "./ult";

export function deathsStep(w: World): void {
  const E = w.enemies;
  for (let e = 0; e < E.top; e += 1) {
    if (E.used[e] === 0 || E.dying[e] === 0 || E.dying[e] === SINKING) continue;
    const def = w.c.enemies[E.def[e]!]!;
    if (E.dying[e] === LEAKED) {
      w.lives = Math.max(0, w.lives - def.leak);
      bump(w.stats, STAT.leaks);
      bump(w.stats, STAT.livesLost, def.leak);
      if (w.boss.stage >= BOSS.lull) bump(w.stats, STAT.livesBoss, def.leak);
      w.events.ring.push(FX.leak, E.x[e]!, E.z[e]!, def.leak, w.tick);
      w.events.rare.push({ t: "leak", tick: w.tick, enemy: def.index, lives: w.lives });
    } else {
      w.gold += def.gold * 1000;
      bump(w.stats, STAT.kills);
      bump(w.stats, STAT.killTicks, w.tick + 1 - E.hitAt[e]!); // under fire: first hit to death (B4, 1B R1 review)
      w.pace.kills.push(E.dist[e]! / w.lanes[E.route[e]!]!.length);
      bump(w.stats, STAT.goldKill, def.gold * 1000);
      w.events.ring.push(FX.death, E.x[e]!, E.z[e]!, def.index, w.tick);
      w.events.ring.push(FX.coin, E.x[e]!, E.z[e]!, def.gold, w.tick);
      ultShards(w, E.x[e]!, E.z[e]!, SHARDS[def.tier]);
      const split = def.def.split;
      if (split !== undefined && E.blast[e] === 0) {
        const index = w.c.enemyIndex(split.enemy);
        const spread = Math.max(0, w.map.roadHalfM - w.c.enemies[index]!.radius);
        for (let k = 0; k < split.count; k += 1) putEnemy(w, index, maxHp(w, index), E.route[e]!, E.wave[e]!, E.dist[e]!, Math.max(-spread, Math.min(spread, E.lateral[e]! + (k % 2 === 0 ? -0.6 : 0.6))));
      }
    }
    w.waveAlive[E.wave[e]!]! -= 1;
    E.release(e);
  }
  if (w.lives <= 0 && w.phase !== "defeat") {
    w.phase = "defeat";
    w.events.rare.push({ t: "defeat", tick: w.tick });
  }
}
