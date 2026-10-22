/**
 * The portal learning bridge (src/kit/learning) under this game's id in the
 * parent repo's portal/public/games.json. 1A sends no learning events yet
 * (TK 21); at boot the bridge asks the portal to focus the game's frame, so
 * the first key reaches the game. Played alone, it does nothing.
 */
import { createLearningBridge, type LearningBridge } from "../kit/learning";

export const GAME_ID = "typing-defense";

let bridge: LearningBridge | null = null;

/** The page's one bridge, made on first use. */
export function learningBridge(): LearningBridge {
  bridge ??= createLearningBridge({ gameId: GAME_ID });
  return bridge;
}
