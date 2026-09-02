import type { GameModule, CategoryValues } from "./types";
import { Flower2 } from "lucide-react";

export const PERGOLA_CATEGORIES = [
  { id: "mariposas", label: "Mariposas", kind: "number" as const },
  { id: "mariquitas", label: "Mariquitas", kind: "number" as const },
  { id: "botones_oro", label: "Botones de Oro y Tarros de Miel", kind: "number" as const },
  { id: "libelulas", label: "Libélulas", kind: "number" as const },
  { id: "hojas", label: "Hojas (Casita de Pájaros)", kind: "number" as const },
  { id: "cascada", label: "Cascada", kind: "number" as const },
  { id: "linternas", label: "Linternas / Otros Bonos", kind: "number" as const },
];

export function calcPergolaTotal(v: CategoryValues): number {
  return PERGOLA_CATEGORIES.reduce((sum, c) => sum + (Number(v[c.id] ?? 0) || 0), 0);
}

export const pergola: GameModule = {
  id: "pergola",
  name: "Pérgola",
  tagline: "Jardín de puntos estilo point salad",
  icon: "Flower2",
  Icon: Flower2,
  startLabel: "¡Al jardín!",
  minPlayers: 2,
  maxPlayers: 4,
  kind: "categories",
  theme: "garden",
  categories: PERGOLA_CATEGORIES,
  calcTotal: calcPergolaTotal,
  rating: 7.0,
  idealPlayers: "2",
  playTime: "30m",
  weight: 1.5,
  bggId: 424573,
  bggImage:
    "https://cf.geekdo-images.com/uZk1zNLrFWOtYzmgUSZBog__itemrep/img/6jxy3Qwvxwr8tp09iOgh1nezeKo=/fit-in/246x300/filters:strip_icc()/pic8515455.png",
  bggUrl: "https://boardgamegeek.com/boardgame/424573/pergola",
};
