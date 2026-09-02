import type { GameModule, CategoryValues } from "./types";
import { Pickaxe } from "lucide-react";

// ============================================================
// SABOTEUR — Scoring
// ============================================================
// El juego se juega en 3 rondas.
// En cada ronda, los mineros ganan cartas de oro si encuentran
// el tesoro; los saboteadores ganan oro fijo si lo impiden.
// Al final de 3 rondas, gana quien tenga más oro.
// ============================================================

export const SABOTEUR_CATEGORIES = [
  { id: "ronda1", label: "Oro ganado — Ronda 1", kind: "number" as const },
  { id: "ronda2", label: "Oro ganado — Ronda 2", kind: "number" as const },
  { id: "ronda3", label: "Oro ganado — Ronda 3", kind: "number" as const },
  { id: "bonus", label: "Puntos bonus (expansión / variante)", kind: "number" as const },
];

export function calcSaboteurTotal(v: CategoryValues): number {
  const n = (k: string) => Number(v[k] ?? 0) || 0;
  return n("ronda1") + n("ronda2") + n("ronda3") + n("bonus");
}

export const saboteur: GameModule = {
  id: "saboteur",
  name: "Saboteur",
  tagline: "Mineros, oro y traidores bajo tierra",
  icon: "Pickaxe",
  Icon: Pickaxe,
  startLabel: "¡A la mina!",
  minPlayers: 3,
  maxPlayers: 10,
  kind: "categories",
  categories: SABOTEUR_CATEGORIES,
  calcTotal: calcSaboteurTotal,
  rating: 6.4,
  idealPlayers: "5-7",
  playTime: "45m",
  weight: 1.17,
  bggId: 9220,
  bggImage:
    "https://cf.geekdo-images.com/fFYRPaeMZbodU-lMAtMgpw__itemrep/img/j1XijhGMbCk9v8TuMlmGb1dJKoI=/fit-in/246x300/filters:strip_icc()/pic2008921.jpg",
  bggUrl: "https://boardgamegeek.com/boardgame/9220/saboteur",
};
