import type { GameModule, CategoryValues } from "./types";
import { Guitar } from "lucide-react";

// ============================================================
// LUTHIER — Scoring
// ============================================================
// Juego sobre la construcción de instrumentos de cuerda.
// Al final de la partida se suman los puntos de:
//
// 1. INSTRUMENTOS: Puntos por cada instrumento completado
//    según su tipo y calidad (violín, cello, guitarra, laúd…).
//
// 2. PEDIDOS: Puntos por pedidos de clientes cumplidos.
//
// 3. PRESTIGIO: Puntos de prestigio acumulados durante la partida
//    (logros, cartas de evento, maestría).
//
// 4. MATERIALES: Valor de materiales sobrantes al finalizar.
//
// 5. BONUS: Cualquier punto extra (tiles especiales, expansiones).
// ============================================================

export const LUTHIER_CATEGORIES = [
  { id: "instrumentos", label: "Instrumentos completados", kind: "number" as const },
  { id: "pedidos", label: "Pedidos de clientes cumplidos", kind: "number" as const },
  { id: "prestigio", label: "Puntos de prestigio", kind: "number" as const },
  { id: "materiales", label: "Valor de materiales sobrantes", kind: "number" as const },
  { id: "bonus", label: "Puntos bonus (maestría, especiales)", kind: "number" as const },
];

export function calcLuthierTotal(v: CategoryValues): number {
  const n = (k: string) => Number(v[k] ?? 0) || 0;
  return n("instrumentos") + n("pedidos") + n("prestigio") + n("materiales") + n("bonus");
}

export const luthier: GameModule = {
  id: "luthier",
  name: "Luthier",
  tagline: "Construye instrumentos y gana prestigio",
  icon: "Guitar",
  Icon: Guitar,
  startLabel: "¡Al taller!",
  minPlayers: 2,
  maxPlayers: 4,
  kind: "categories",
  categories: LUTHIER_CATEGORIES,
  calcTotal: calcLuthierTotal,
  rating: 7.2,
  idealPlayers: "3-4",
  playTime: "60m",
  weight: 2.3,
};
