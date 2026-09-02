// Backwards-compat shim. New code should import from "@/games/*".
export type { RoundEntry, GameState } from "@/games/types";
import { skullKing } from "@/games/skull-king";
export const TOTAL_ROUNDS = skullKing.totalRounds;
export const calcRoundScore = skullKing.calcRoundScore;
