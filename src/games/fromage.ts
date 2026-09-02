import type { GameModule, CategoryValues } from "./types";
import { Cake } from "lucide-react";

export const FROMAGE_CATEGORIES = [
  { id: "festival", label: "Festival", kind: "number" as const },
  { id: "fromagerie", label: "Fromagerie", kind: "number" as const },
  { id: "bistro", label: "Bistro", kind: "number" as const },
  { id: "villes", label: "Villes", kind: "number" as const },
  { id: "ordenes", label: "Órdenes", kind: "number" as const },
  { id: "estructuras", label: "Estructuras", kind: "number" as const },
  {
    id: "fruta",
    label: "Multiplicador de Fruta",
    kind: "product" as const,
    subLabels: ["Quesos con Fruta", "Mermeladas"] as [string, string],
  },
  { id: "sobrantes", label: "Recursos sobrantes", kind: "number" as const },
];

export function calcFromageTotal(v: CategoryValues): number {
  const n = (k: string) => Number(v[k] ?? 0) || 0;
  const fruta = n("fruta_a") * n("fruta_b");
  return (
    n("festival") +
    n("fromagerie") +
    n("bistro") +
    n("villes") +
    n("ordenes") +
    n("estructuras") +
    fruta +
    n("sobrantes")
  );
}

export const fromage: GameModule = {
  id: "fromage",
  name: "Fromage",
  tagline: "Recuento final estilo point salad",
  icon: "Cake",
  Icon: Cake,
  startLabel: "¡A la mesa!",
  minPlayers: 2,
  maxPlayers: 5,
  kind: "categories",
  theme: "cheese",
  categories: FROMAGE_CATEGORIES,
  calcTotal: calcFromageTotal,
  rating: 7.4,
  idealPlayers: "3-4",
  playTime: "45m",
  weight: 2.5,
  bggId: 384213,
  bggImage:
    "https://cf.geekdo-images.com/h87Ft6qXbzwPifN7WGnx2Q__itemrep/img/oWewUUb-xpIcM5P7qoirW5rBiFI=/fit-in/246x300/filters:strip_icc()/pic7452200.jpg",
  bggUrl: "https://boardgamegeek.com/boardgame/384213/fromage",
};
