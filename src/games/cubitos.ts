import type { GameModule, CategoryValues } from "./types";
import { Dice5 } from "lucide-react";

// ============================================================
// CUBITOS — Definición de dados especiales
// ============================================================
// Macedonia Punk: dado VERDE, costo de adquisición = 4 monedas.
// Es un dado de velocidad/carrera del conjunto de dados especiales
// comprables durante la partida.
// ============================================================
export const CUBITOS_DICE = {
  MACEDONIA_PUNK: {
    name: "Macedonia Punk",
    color: "green", // dado verde (velocidad / pies)
    cost: 4, // costo: 4 monedas
    category: "speed",
    description:
      "Dado verde de velocidad. Costo de compra: 4 monedas. " +
      "Sus caras incluyen movimientos de carrera y al menos una cara moneda.",
    faces: {
      run2: 2, // 2 caras con +2 movimiento
      run1: 2, // 2 caras con +1 movimiento
      coin: 1, // 1 cara que otorga 1 moneda
      blank: 1, // 1 cara vacía (fallo)
    },
  },
  BOOMERANG: { name: "Boomerang", color: "blue", cost: 3 },
  ROCKET: { name: "Rocket", color: "red", cost: 5 },
  COCONUT: { name: "Coconut", color: "yellow", cost: 2 },
  NINJA: { name: "Ninja", color: "black", cost: 6 },
} as const;

export const CUBITOS_CATEGORIES = [
  {
    id: "extraSquares",
    label: "Casillas más allá de la meta",
    kind: "number" as const,
  },
  {
    id: "coins",
    label: "Monedas al final de la partida",
    kind: "number" as const,
  },
  {
    id: "fans",
    label: "Fichas de fanáticos",
    kind: "number" as const,
  },
];

// ============================================================
// CUBITOS — Puntaje compuesto (§2.3 / §3.4)
// ============================================================
// score = extraSquares × 10_000 + coins × 100 + fans
//
// Invariantes:
//   extraSquares ∈ [0, 999]
//   coins        ∈ [0, 99]
//   fans         ∈ [0, 99]
//
// Los multiplicadores aseguran que ningún valor de desempate
// puede "remontar" al criterio superior.
// ============================================================
export function calcCubitosTotal(v: CategoryValues): number {
  const n = (k: string) => Math.max(0, Math.round(Number(v[k] ?? 0) || 0));
  return n("extraSquares") * 10_000 + n("coins") * 100 + n("fans");
}

// ============================================================
// CUBITOS — Tipos de resultado de partida (§3.1)
// ============================================================

/**
 * Resultado final de un jugador en una partida de Cubitos.
 * Se almacena serializado dentro de categoryValues (GameState).
 */
export interface CubitosPlayerResult {
  /** ID del jugador (Player.id). Solo para referencia; no se persiste por separado. */
  id: string;
  /** Nombre del jugador (Player.name). */
  name: string;
  /**
   * Casillas avanzadas más allá de la meta (>= 0).
   * Es el criterio de clasificación primario.
   * Un jugador que no cruzó la meta tiene extraSquares = 0.
   */
  extraSquares: number;
  /**
   * Monedas al final de la partida (>= 0).
   * Primer criterio de desempate.
   */
  coins: number;
  /**
   * Fichas de fanáticos/hinchas al final de la partida (>= 0).
   * Segundo y último criterio de desempate.
   */
  fans: number;
  /**
   * Posición final en el ranking (1-based).
   * Se calcula en calcCubitosRanking(); no se persiste directamente.
   */
  finalPosition: number;
}

// ============================================================
// CUBITOS — Ranking con dense ranking y empates compartidos (§3.5)
// ============================================================

/**
 * Ordena y asigna posiciones finales a los jugadores.
 * Devuelve una copia ordenada con finalPosition asignado.
 * Empates comparten puesto (dense ranking).
 *
 * Criterios en cascada:
 *   1° extraSquares (mayor gana)
 *   2° coins        (mayor gana, desempate)
 *   3° fans         (mayor gana, desempate final)
 */
export function calcCubitosRanking(players: CubitosPlayerResult[]): CubitosPlayerResult[] {
  const sorted = [...players].sort((a, b) => {
    if (b.extraSquares !== a.extraSquares) return b.extraSquares - a.extraSquares;
    if (b.coins !== a.coins) return b.coins - a.coins;
    return b.fans - a.fans;
  });

  let position = 1;
  return sorted.map((p, i) => {
    if (i > 0) {
      const prev = sorted[i - 1];
      const isTied =
        p.extraSquares === prev.extraSquares && p.coins === prev.coins && p.fans === prev.fans;
      if (!isTied) position = i + 1;
    }
    return { ...p, finalPosition: position };
  });
}

// ============================================================
// CUBITOS — GameModule
// ============================================================
export const cubitos: GameModule = {
  id: "cubitos",
  name: "Cubitos",
  tagline: "Dados, carreras y especialistas",
  icon: "Dice5",
  Icon: Dice5,
  startLabel: "¡A rodar!",
  minPlayers: 2,
  maxPlayers: 4,
  kind: "cubitos",
  theme: "racing",
  categories: CUBITOS_CATEGORIES,
  calcTotal: calcCubitosTotal,
  rating: 7.8,
  idealPlayers: "2-4",
  playTime: "45m",
  weight: 2.1,
  bggId: 295610,
  bggImage:
    "https://cf.geekdo-images.com/gt4RxNSGTzXBFdJEDUbNdg__itemrep/img/MlZ3tLcFRIuJbVFE2XhRVTt_rjQ=/fit-in/246x300/filters:strip_icc()/pic5765999.jpg",
  bggUrl: "https://boardgamegeek.com/boardgame/295610/cubitos",
};
