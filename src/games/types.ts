import type { LucideIcon } from "lucide-react";

export type RoundEntry = { bid: number | null; tricks: number | null; bonus: number };

export type Player = { id: string; name: string; is_favorite?: boolean };

export type CategoryDef =
  | { id: string; label: string; kind: "number" }
  | { id: string; label: string; kind: "product"; subLabels: [string, string] };

export type CategoryValues = Record<string, number | undefined>;

export type HeatRoundEntry = { position: number | null; bonus: number };
export type HeatPlayerData = { upgrades: string; rounds: HeatRoundEntry[] };

export type CoopResult = { won: boolean | null; teamScore: number };

export type GameModifiers = {
  /** Legacy: named advanced cards. Kept for backward compatibility with old matches. */
  used_cards?: string[];
  /** The Gang: numbered challenge cards active in the match (e.g. [2, 5]). */
  desafios_usados?: number[];
  /** The Gang: numbered help/specialist cards active in the match (e.g. [3]). */
  ayudas_usadas?: number[];
  /** Legacy: previous naming for desafios_usados. Kept for backward compatibility. */
  dificultades_usadas?: number[];
};

export type GameState = {
  players: Player[];
  rounds: RoundEntry[][];
  categoryValues?: CategoryValues[];
  heatData?: HeatPlayerData[];
  coop?: CoopResult;
  modifiers?: GameModifiers;
  started: boolean;
};

export type GameModule = {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  Icon?: LucideIcon;
  startLabel?: string;
  minPlayers: number;
  maxPlayers: number;
  kind?: "rounds" | "categories" | "heat" | "coop" | "cubitos" | "generic";
  theme?: "pirate" | "garden" | "cheese" | "pocketmeeple" | "ludiscorer" | "racing";
  /** Cooperative game: does not impact individual rankings */
  coop?: boolean;
  /** Whether the coop game tracks a team score (optional input on finish) */
  coopTracksScore?: boolean;
  /** Optional advanced cards / variants the team can toggle in the lobby (coop, legacy). */
  advancedCards?: string[];
  /** Coop: number of numbered "difficulty" cards the team can toggle in-game. */
  difficultyCount?: number;
  /** Coop: number of numbered "help" cards the team can toggle in-game. */
  helpCount?: number;
  // BGG metadata
  rating?: number;
  idealPlayers?: string;
  playTime?: string;
  weight?: number;
  cover?: string;
  // BGG attribution
  bggId?: number;
  bggImage?: string;
  bggUrl?: string;
  // Round-based
  totalRounds?: number;
  calcRoundScore?: (entry: RoundEntry, roundNumber: number) => number | null;
  // Category-based
  categories?: CategoryDef[];
  calcTotal?: (values: CategoryValues) => number;
};

export function emptyRound(playerCount: number): RoundEntry[] {
  return Array.from({ length: playerCount }, () => ({ bid: null, tricks: null, bonus: 0 }));
}

export function newGameState(
  players: Player[],
  game: GameModule,
  modifiers?: GameModifiers,
): GameState {
  if (game.kind === "coop") {
    return {
      players,
      rounds: [],
      coop: { won: null, teamScore: 0 },
      modifiers: modifiers ?? {},
      started: true,
    };
  }
  if (game.kind === "categories" || game.kind === "cubitos" || game.kind === "generic") {
    return {
      players,
      rounds: [],
      categoryValues: players.map(() => ({})),
      started: true,
    };
  }
  if (game.kind === "heat") {
    const total = game.totalRounds ?? 4;
    return {
      players,
      rounds: [],
      heatData: players.map(() => ({
        upgrades: "",
        rounds: Array.from({ length: total }, () => ({ position: null, bonus: 0 })),
      })),
      started: true,
    };
  }
  const totalRounds = game.totalRounds ?? 0;
  return {
    players,
    rounds: Array.from({ length: totalRounds }, () => emptyRound(players.length)),
    started: true,
  };
}

export function cumulativeTotals(state: GameState, game: GameModule): number[][] {
  const totals: number[][] = [];
  for (let r = 0; r < state.rounds.length; r++) {
    const prev = r === 0 ? state.players.map(() => 0) : totals[r - 1];
    totals.push(
      state.rounds[r].map((entry, p) => {
        const s = game.calcRoundScore!(entry, r + 1);
        return prev[p] + (s ?? 0);
      }),
    );
  }
  return totals;
}

export function isGameComplete(state: GameState, game: GameModule): boolean {
  if (game.kind === "coop") {
    return state.coop?.won === true || state.coop?.won === false;
  }
  if (game.kind === "categories" || game.kind === "cubitos" || game.kind === "generic") return true;
  if (game.kind === "heat") {
    const data = state.heatData ?? [];
    return data.every((d) => d.rounds[0]?.position !== null && d.rounds[0]?.position !== undefined);
  }
  if (state.rounds.length < (game.totalRounds ?? 0)) return false;
  return state.rounds.every((row) => row.every((c) => c.bid !== null && c.tricks !== null));
}

export const HEAT_POSITION_POINTS: Record<number, number> = {
  1: 9,
  2: 6,
  3: 4,
  4: 3,
  5: 2,
  6: 1,
};

export function heatRoundPoints(entry: HeatRoundEntry): number {
  if (entry.position === null || entry.position === undefined) return 0;
  return (HEAT_POSITION_POINTS[entry.position] ?? 0) + (Number(entry.bonus) || 0);
}

export function heatPlayerTotal(data: HeatPlayerData): number {
  return data.rounds.reduce((sum, r) => sum + heatRoundPoints(r), 0);
}

export function finalScores(state: GameState, game: GameModule): number[] {
  if (game.kind === "coop") {
    const score = state.coop?.teamScore ?? 0;
    return state.players.map(() => score);
  }
  if (game.kind === "generic") {
    const vals = (state.categoryValues ?? state.players.map(() => ({}))) as Record<string, number>[];
    return vals.map((v) => v["score"] ?? 0);
  }
  if (game.kind === "categories" || game.kind === "cubitos") {
    const vals = state.categoryValues ?? state.players.map(() => ({}));
    return vals.map((v) => game.calcTotal!(v));
  }
  if (game.kind === "heat") {
    const data =
      state.heatData ?? state.players.map(() => ({ upgrades: "", rounds: [] as HeatRoundEntry[] }));
    return data.map((d) => heatPlayerTotal(d));
  }
  const totals = cumulativeTotals(state, game);
  return totals[totals.length - 1] ?? state.players.map(() => 0);
}

export function validateGameState(state: GameState, game: GameModule): string | null {
  if (game.kind === "coop") {
    if (state.coop?.won !== true && state.coop?.won !== false) {
      return "Selecciona el resultado del equipo";
    }
    return null;
  }
  if (game.kind === "generic") {
    return null;
  }
  if (game.kind === "categories") {
    const cats = game.categories ?? [];
    const values = state.categoryValues ?? [];
    for (let pIdx = 0; pIdx < state.players.length; pIdx++) {
      const v = values[pIdx] ?? {};
      for (const c of cats) {
        if (c.kind === "number") {
          const val = v[c.id];
          if (val === undefined || val === null || Number.isNaN(val)) {
            return `Falta el valor de "${c.label}" para ${state.players[pIdx].name}`;
          }
          if (val < 0) {
            return `"${c.label}" no puede ser negativo para ${state.players[pIdx].name}`;
          }
        } else if (c.kind === "product") {
          const a = v[`${c.id}_a`];
          const b = v[`${c.id}_b`];
          if (a === undefined || a === null || Number.isNaN(a)) {
            return `Falta el valor de "${c.subLabels[0]}" para ${state.players[pIdx].name}`;
          }
          if (b === undefined || b === null || Number.isNaN(b)) {
            return `Falta el valor de "${c.subLabels[1]}" para ${state.players[pIdx].name}`;
          }
          if (a < 0) {
            return `"${c.subLabels[0]}" no puede ser negativo para ${state.players[pIdx].name}`;
          }
          if (b < 0) {
            return `"${c.subLabels[1]}" no puede ser negativo para ${state.players[pIdx].name}`;
          }
        }
      }
    }
    return null;
  }

  if (game.kind === "cubitos") {
    const vals = state.categoryValues ?? [];
    for (let p = 0; p < state.players.length; p++) {
      const v = vals[p] ?? {};
      const coins = v["coins"];
      const fans = v["fans"];

      if (coins === undefined || Number.isNaN(coins)) {
        return `Falta el número de monedas para ${state.players[p].name}`;
      }
      if (fans === undefined || Number.isNaN(fans)) {
        return `Falta el número de fanáticos para ${state.players[p].name}`;
      }
    }
    return null;
  }

  if (game.kind === "heat") {
    const data = state.heatData ?? [];
    const total = game.totalRounds ?? 4;
    // Round 1 must be complete for all players
    for (let p = 0; p < state.players.length; p++) {
      const pos = data[p]?.rounds[0]?.position;
      if (pos === null || pos === undefined) {
        return `Falta la posición de la Ronda 1 para ${state.players[p].name}`;
      }
    }
    // For rounds 2..N: if any player has a position, all must
    for (let r = 1; r < total; r++) {
      const anySet = data.some(
        (d) => d.rounds[r]?.position !== null && d.rounds[r]?.position !== undefined,
      );
      if (!anySet) continue;
      for (let p = 0; p < state.players.length; p++) {
        const pos = data[p]?.rounds[r]?.position;
        if (pos === null || pos === undefined) {
          return `Falta la posición de la Ronda ${r + 1} para ${state.players[p].name}`;
        }
      }
    }
    return null;
  }

  // Round-based
  for (let r = 0; r < state.rounds.length; r++) {
    for (let p = 0; p < state.players.length; p++) {
      const entry = state.rounds[r][p];
      if (entry.bid === null || entry.tricks === null) {
        return `Faltan datos en la ronda ${r + 1} para ${state.players[p].name}`;
      }
      if (game.id !== "skull-king" && (entry.bid < 0 || entry.tricks < 0)) {
        return `Valores negativos en la ronda ${r + 1} para ${state.players[p].name}`;
      }
    }
  }
  return null;
}
