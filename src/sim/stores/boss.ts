/** Where the boss peak is (BUILD_1B §4.4, §5.2): warned on day 5, the lull, emerging, the fight, the retreat, done. */
export const BOSS = { idle: 0, warned: 1, lull: 2, emerge: 3, fight: 4, retreat: 5, done: 6 } as const;

/**
 * The boss peak's state (BUILD_1B §15), hashed like every store. Times are ticks (−1: none). `targets` holds the ids
 * of the buildings Rễ Trồi aims at, its warning ending at `rootsEnd`; a slam aims along (slamX, slamZ).
 */
export class BossStore {
  stage: number = BOSS.idle;
  route = -1;
  lullEnd = -1;
  emergeAt = -1;
  lastSpawn = -1;
  /** The boss's enemy id, its hit points at spawn, phase 1 or 2. */
  e = -1;
  hpMax = 0;
  phase = 1;
  staggerUntil = -1;
  vulnUntil = -1;
  rootsAt = -1;
  rootsEnd = -1;
  slamAt = 0;
  slamEnd = -1;
  slamX = 0;
  slamZ = 0;
  summonAt = -1;
  summonEnd = -1;
  keepAt = 0;
  keepEnd = -1;
  drainAt = -1;
  drainEnd = -1;
  sinkEnd = -1;
  /** Where the branches meet on its route (m), and its hit points passing there (−1: not yet): the loss card's hint (§13.1). */
  mergeM = 0;
  mergeHp = -1;
  readonly targets = new Int32Array(16);
  targetN = 0;
}
