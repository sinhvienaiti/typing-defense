/**
 * What a Typing Defense content slice defines (docs/td/TYPING_DEFENSE_DESIGN.md
 * 25.4; docs/td/BUILD_1A6.md). Ids are kebab-case; times are seconds and
 * distances metres until compile.ts turns them into ticks; hit points, damage
 * and prices are whole numbers. Each definition keeps its look in a `view`
 * block, which the content hash leaves out: a new colour never changes a replay.
 */
export type Mode = "relax" | "balanced" | "challenge" | "learn";
export type Family = "core" | "attack" | "military" | "economy" | "resource" | "support";
export type WordKind = "call" | "finisher" | "rare" | "review" | "direct" | "seal" | "pickup" | "ultWord" | "spellWord";
export type Grade = "flash" | "perfect" | "good" | "ok" | "sloppy";
export type DamageType = "physical" | "magic" | "true";
export type Footprint = "S" | "M" | "L" | "XL";
export type EnemyTier = "swarm" | "small" | "medium" | "heavy" | "boss";
export type Altitude = "ground" | "low" | "high";

export type Range = readonly [number, number];
export type Point = readonly [number, number];
export type PerLevel = readonly [number, number, number];

export type ViewBlock = { name: string; short: string; color: string };

export type AttackLevel = { damage: Range; periodS: number; rangeM: number; splashM?: number; targets?: number };

/** `edgePct`: damage left at the rim of a blast (TK 11.3: 50 %). */
export type AttackSpec = { damageType: DamageType; critPct: number; edgePct?: number; hits: readonly Altitude[]; projectileSpeed: number; levels: readonly AttackLevel[] };

/** A power word's Word Shot (TK 6.11): D̄ by level, extra targets, a wider blast. */
export type ShotSpec = { dBar: PerLevel; pierce: number; splashMul?: number };
/** A powered shot (BUILD_1A6 §4.5): damage ×, extra targets, blast radius ×. */
export type PowerSpec = { dmgMul?: number; targets?: number; areaMul?: number };

export type BarracksLevel = { hp: number; damage: Range; periodS: number; armorPct: number };
export type MineLevel = { amount: number; everyS: number; pile: number };

/** The Bastion's levels (TK 12.4); its crossbow is the definition's attack. `gold`, `wood`: the step's price (level 1: 0). */
export type KeepLevel = { slots: number; gold: number; wood: number };

export type BuildingDef = {
  id: string;
  family: Family;
  footprint: Footprint;
  /** fixed: placed by the map (the Bastion). */
  placement: "free" | "node" | "fixed";
  /** Gold spent in total to reach L1 / L2 / L3 (TK 12.2). */
  costs: PerLevel;
  /** 0: cannot be hurt. */
  hp: PerLevel;
  attack?: AttackSpec;
  barracks?: { soldiers: number; respawnS: number; levels: readonly BarracksLevel[] };
  mine?: { levels: readonly MineLevel[] };
  keep?: { levels: readonly KeepLevel[] };
  /** A farm's four plots (§4.1). */
  farm?: true;
  /** Towers and the Bastion: the power word's shot (the Bastion's is a crossbow bolt) and a powered shot. */
  shot?: ShotSpec;
  power?: PowerSpec;
  view: ViewBlock;
};

export type EnemyDef = {
  id: string;
  tier: EnemyTier;
  hp: number;
  armorPct: number;
  resistPct: number;
  speed: number;
  altitude: Altitude;
  leak: number;
  gold: number;
  /** Blocking places it takes to stop (TK 13). */
  blockWeight: number;
  /** Body radius: soldiers fight from its edge. */
  radiusM: number;
  /** How many walk together; a wave entry is cut into packs of this size. */
  packSize: number;
  /** Blast damage multiplier (Ma Trơi takes ×1.5). */
  splashTakenMul?: number;
  melee?: { damage: Range; periodS: number };
  /** Soldiers fight it but never stop it (the boss); burning hurts it ×burnTakenMul. */
  unblockable?: true;
  burnTakenMul?: number;
  /** BUILD_1B §9.2: a mechanic a direct call breaks; §10: what it splits into when no blast kills it (Nuppeppō). */
  ability?: AbilitySpec;
  split?: { enemy: string; count: number };
  view: ViewBlock;
};

/**
 * The three verbs of BUILD_1B §9.2, each a mechanic a direct call breaks (window T). Ngắt (interrupt): it stands and
 * drums; broken: stunned stunS, `gold`; let run: radiusM heals healPct. Neo (anchor, R3): broken, the pack within radiusM
 * stands freezeS and the leader takes ×takenMul for takenS; its aura ×auraSpeed within radiusM is always on. Phá Khiên
 * (shield, R3): a dome of domeM rides on it for T (shots from outside ×outsideMul); broken: stunned stunS, none for lockS.
 * Each starts with `need` others within radiusM and an attack building's rim within reachM; cooldownS from its end.
 */
export type AbilitySpec =
  | { verb: "interrupt"; cooldownS: number; radiusM: number; need: number; reachM?: number; healPct: number; stunS: number; gold: number }
  | { verb: "anchor"; cooldownS: number; radiusM: number; need: number; reachM: number; freezeS: number; takenMul: number; takenS: number; auraSpeed: number }
  | { verb: "shield"; cooldownS: number; reachM: number; domeM: number; outsideMul: number; stunS: number; lockS: number };

/** `affinity`: building ids where the hero's passive applies (its Word Shots set enemies burning). */
export type HeroDef = { id: string; flySpeed: number; takeoffS: number; landS: number; attack: AttackSpec; affinity: readonly string[]; burn: { dps: number; durationS: number }; view: ViewBlock };

export type HelperDef = { id: string; speed: number; view: ViewBlock };

export type Rect = { x0: number; x1: number; z0: number; z1: number };
export type OreNode = { x: number; z: number; richness: 1 | 2 | 3 };

export type MapDef = {
  id: string; halfM: number; buildHalfM: number; gate: Point; keep: Point; roadHalfM: number;
  /** Ground routes from the gate to the Bastion; packs take turns. */
  routes: readonly (readonly Point[])[];
  flyRoute: readonly Point[]; flyHeightM: number; water: readonly Rect[]; bridges: readonly Rect[]; nodes: readonly OreNode[];
  /** Trees to chop (BUILD_1A6 §4.2), in a fixed order: a tree's index is its id. */
  trees: readonly Point[];
  /** The sandbox's "Đặt sẵn" (§10): building id, x and z, put down at once. */
  preset?: readonly (readonly [string, number, number])[];
};

/** `pack`: this entry's pack size (the enemy's own by default). */
export type WaveEntry = { enemy: string; count: number; pack?: number };

export type WavesDef = {
  list: readonly (readonly WaveEntry[])[];
  /** Waves past the list repeat the last one, scaled by 1 + growth × (n − list length). */
  endlessGrowth: number;
  packGapS: number;
  memberGapS: number;
};

/**
 * The boss of a stage (BUILD_1B §5): its enemy (whose hit points are the base), retreat at retreatPct of them, hit
 * points ×(1 + kHp·d + kHp2·max(0, d)²), d = k − 1 (both ways), up to kHpMax and ×modeHp of the run's mode, Draconis' own fireballs ×heroMul
 * ("Vỏ dày"), and its moves; the stagger's Dồn lửa calls ask round(E / burstPerE) words, 1 to burstWords.
 */
export type BossDef = {
  enemy: string; retreatPct: number; kHp: number; kHp2: number; kHpMax: number; modeHp: Partial<Record<Mode, number>>; retreatS: number; chestGold: number; heroMul: number;
  roots: { everyS: number; firstS: number; warnS: number; radiusM: number; stunS: number };
  slam: { damage: Range; reachM: number; everyS: number; warnS: number; knockM: number };
  stagger: { atPct: number; stunS: number; vulnerable: number; burstLifeS: number; burstReachM: number; burstWords: number; burstPerE: number };
  summon: { enemy: string; count: number; everyS: number; firstS: number; warnS: number };
  keep: { lives: number; everyS: number; warnS: number; stopM: number };
  drain: { lives: number; everyS: number; warnS: number };
};

/** The story stage (BUILD_1B §4): its nights, the Bastion's top level, the boss peak, the day each thing opens. */
export type StageDef = {
  nights: number; keepMax: number;
  boss: { night: number; lullS: number; lullAlive: number; lullWaitS: number; escort: readonly WaveEntry[]; emergeM: number; emergeAfterS: number };
  /** Building id, "keep2", "keep3", "upgrade" or "ult" (Tối Thượng, R2) → the day it opens. */
  unlock: Readonly<Record<string, number>>;
};

export type Content = {
  id: string;
  /** buildings[0] is the Bastion. */
  buildings: readonly BuildingDef[];
  enemies: readonly EnemyDef[];
  hero: HeroDef;
  helpers: readonly HelperDef[];
  map: MapDef;
  waves: WavesDef;
  boss?: BossDef;
  stage?: StageDef;
};
