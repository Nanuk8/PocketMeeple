import type { GameModule, CategoryValues } from "./types";
import { Cat } from "lucide-react";

// ============================================================
// LA ISLA DE LOS GATOS — Scoring
// ============================================================
// Puntuación al final de la partida:
//
// 1. FAMILIAS DE GATOS: Por cada color, cuenta cuántos gatos
//    consecutivos (del mismo color) hay en tu barca. Cada familia
//    de tamaño N puntúa: 0 (N=1), 1 (N=2), 2 (N=3), 4 (N=4),
//    6 (N=5), 8 (N=6), etc. Se ingresan los puntos ya calculados.
//
// 2. LECCIONES: Puntos de las cartas de lección completadas
//    (públicas y privadas).
//
// 3. TESOROS: Puntos por cofres del tesoro en la barca.
//
// 4. RATAS DESCUBIERTAS: Cada rata sin cubrir = -5 puntos.
//    Ingresa la CANTIDAD de ratas; el sistema aplica ×(-5).
//
// 5. BONUS / OTROS: Puntos de Oshax, cartas especiales, etc.
// ============================================================

export const ISLA_GATOS_CATEGORIES = [
  { id: "familias", label: "Puntos por familias de gatos", kind: "number" as const },
  { id: "lecciones", label: "Puntos por lecciones (públicas + privadas)", kind: "number" as const },
  { id: "tesoros", label: "Puntos por cofres del tesoro", kind: "number" as const },
  { id: "ratas", label: "Ratas descubiertas (cant. × −5 pts c/u)", kind: "number" as const },
  { id: "bonus", label: "Bonus varios (Oshax, cartas especiales, otros)", kind: "number" as const },
];

// Tabla de referencia: puntuación por tamaño de familia
// Tamaño:  1   2   3   4   5   6   7+
// Puntos:  0   1   2   4   6   8  10+
export const ISLA_GATOS_FAMILY_POINTS: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 4,
  5: 6,
  6: 8,
};

export function calcIslaGatosTotal(v: CategoryValues): number {
  const n = (k: string) => Number(v[k] ?? 0) || 0;
  const ratasPenalty = n("ratas") * -5; // ratas descubiertas → penalización
  return n("familias") + n("lecciones") + n("tesoros") + ratasPenalty + n("bonus");
}

export const islaGatos: GameModule = {
  id: "isla-gatos",
  name: "La Isla de los Gatos",
  tagline: "Rescata gatos y llena tu barca de tesoros",
  icon: "Cat",
  Icon: Cat,
  startLabel: "¡A salvar gatos!",
  minPlayers: 1,
  maxPlayers: 4,
  kind: "categories",
  categories: ISLA_GATOS_CATEGORIES,
  calcTotal: calcIslaGatosTotal,
  rating: 7.9,
  idealPlayers: "2-4",
  playTime: "60m",
  weight: 2.49,
  bggId: 281259,
  bggImage:
    "https://cf.geekdo-images.com/utFapF_2vj-ADBhI5cFqCA__itemrep/img/MKn6w4jqiJjBSF8MEFg_QDe3JAE=/fit-in/246x300/filters:strip_icc()/pic4883810.jpg",
  bggUrl: "https://boardgamegeek.com/boardgame/281259/the-isle-of-cats",
};
