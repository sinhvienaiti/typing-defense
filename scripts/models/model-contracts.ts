// Model contracts for Lời Gọi's model tools (parent repo `pnpm models:blender` /
// `models:prepare --root games/typing-defense`). Tooling only: the game has no
// 3D runtime yet. When 1C adds one, move this file to src/render3d/ (or merge it
// with the kit's three/model-contracts.ts) so the tools and the loader share it.
//
// Same shape as shared/game-kit/three/model-contracts.ts. Kinds follow
// docs/art-requests/td/02-tripo-buildings-props.md (buildings, props, loot,
// projectiles) plus "attachments": worn or held items hung on a character's
// socket (Thư Đồng gear, the lead hat, the spear). Rigged kinds: "heroes" and
// "enemies" (rig trial 24/10: lam, cuong-thi; td_rig_tools.py); helpers,
// units and bosses follow when their rigs are made.
//
// Authoring (Blender, TK 23.9 and file 02 §8): metres, +Y up, the front (door,
// FX_core medallion) faces -Z. Buildings: origin at the centre of their
// occupation ring, on the ground. Sockets are Empties named exactly as below
// (building sockets are lower-case after FX_, as in TK 23.9).

export type ModelKind = "buildings" | "props" | "projectiles" | "loot" | "attachments" | "heroes" | "enemies";
export type ModelTier = "high" | "medium";

export type ModelContract = {
  kind: ModelKind;
  requiredSockets: readonly string[];
  optionalSockets: readonly string[];
  /** Substring match, so "_V3" suffixes pass. */
  requiredClips: readonly string[];
  optionalClips: readonly string[];
  triangles: { min: number; max: number };
  /** Longest texture edge per tier. */
  textureMax: Readonly<Record<ModelTier, number>>;
};

const LANTERNS = ["FX_lantern_0", "FX_lantern_1", "FX_lantern_2", "FX_lantern_3", "FX_lantern_4"] as const;
// Character sockets (TK 23.9). FX_TOOL: Lam's satchel mouth, a spear tip, a
// slate; swarm enemies without a tool leave it out.
const CHARACTER_SOCKETS = ["FX_HAND_R", "FX_HAND_L", "FX_HEAD", "FX_CORE", "FX_FEET"] as const;

export const MODEL_CONTRACTS: Readonly<Record<ModelKind, ModelContract>> = {
  // Level-1 houses and the Keep (TK 23.9 sockets). Building_Idle and
  // Building_Fire are required by 23.9 once the clip step runs; the static
  // prep carries no clip yet, so they are optional here.
  buildings: {
    kind: "buildings",
    requiredSockets: ["FX_core", "FX_top", "FX_word", "FX_perch", "FX_assist", "FX_crew", "FX_banner", ...LANTERNS],
    optionalSockets: ["FX_muzzle", "FX_pile", "FX_spawn", "FX_turret", "FX_rail_0", "FX_rail_1"],
    requiredClips: [],
    optionalClips: ["Building_Idle", "Building_Fire", "Building_Work", "Building_Hit", "Building_Ruin"],
    triangles: { min: 2_000, max: 15_000 },
    textureMax: { high: 2048, medium: 1024 },
  },
  // Separate parts placed on a building: cannon barrel, mine cart, gold piles, level pennant.
  props: {
    kind: "props",
    requiredSockets: [],
    optionalSockets: ["FX_muzzle", "FX_top", "FX_core"],
    requiredClips: [],
    optionalClips: ["Prop_Idle", "Prop_Fire", "Prop_Work"],
    triangles: { min: 50, max: 4_000 },
    textureMax: { high: 1024, medium: 512 },
  },
  projectiles: {
    kind: "projectiles",
    requiredSockets: [],
    optionalSockets: ["FX_trail", "FX_core"],
    requiredClips: [],
    optionalClips: [],
    triangles: { min: 50, max: 4_000 },
    textureMax: { high: 1024, medium: 512 },
  },
  loot: {
    kind: "loot",
    requiredSockets: [],
    optionalSockets: ["FX_hinge", "FX_core"],
    requiredClips: [],
    optionalClips: ["Loot_Open"],
    triangles: { min: 50, max: 4_000 },
    textureMax: { high: 1024, medium: 512 },
  },
  // Walking heroes (TK 23.9): skinned, front -Z, feet on the ground at the
  // origin, in-place clips (no root motion), one-shots start and end on Idle.
  heroes: {
    kind: "heroes",
    requiredSockets: [...CHARACTER_SOCKETS, "FX_TOOL"],
    optionalSockets: [],
    requiredClips: ["Hero_Idle", "Hero_Run", "Hero_Attack", "Hero_Skill1", "Hero_Skill2", "Hero_Ult", "Hero_Assist", "Hero_Hit", "Hero_Death", "Hero_Respawn", "Hero_Victory"],
    optionalClips: ["Hero_Idle_Fidget", "Hero_Dash", "Hero_Ult_Echo", "Hero_Assist_Beat", "Hero_Bridge"],
    triangles: { min: 2_000, max: 20_000 },
    textureMax: { high: 2048, medium: 1024 },
  },
  // Enemies (TK 23.9). Swarm kinds are drawn instanced with VAT later; the
  // skinned GLB is the source of those bakes and of the near elite copies.
  enemies: {
    kind: "enemies",
    requiredSockets: [...CHARACTER_SOCKETS],
    optionalSockets: ["FX_TOOL"],
    requiredClips: ["Enemy_Move", "Enemy_Idle", "Enemy_Attack", "Enemy_Hit", "Enemy_Death"],
    optionalClips: ["Enemy_Skill"],
    triangles: { min: 500, max: 9_000 },
    textureMax: { high: 1024, medium: 512 },
  },
  // Origin = the point that sits on the character's socket (grip, hat rim, quill stub).
  attachments: {
    kind: "attachments",
    requiredSockets: [],
    optionalSockets: ["FX_TOOL"],
    requiredClips: [],
    optionalClips: [],
    triangles: { min: 50, max: 4_000 },
    textureMax: { high: 1024, medium: 512 },
  },
};

export function missingSockets(contract: ModelContract, sockets: readonly string[]): string[] {
  return contract.requiredSockets.filter((name) => !sockets.includes(name));
}

export function missingClips(contract: ModelContract, clips: readonly string[]): string[] {
  return contract.requiredClips.filter((name) => !clips.some((clip) => clip.includes(name)));
}
