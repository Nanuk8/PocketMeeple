import type { GameModule } from "./types";
import { skullKing } from "./skull-king";
import { fromage } from "./fromage";
import { pergola } from "./pergola";
import { heat } from "./heat";
import { theGang } from "./the-gang";
import { cubitos } from "./cubitos";
import { saboteur } from "./saboteur";
import { islaGatos } from "./isla-gatos";
import { luthier } from "./luthier";

export const GAMES: GameModule[] = [
  skullKing,
  fromage,
  pergola,
  heat,
  theGang,
  cubitos,
  saboteur,
  islaGatos,
  luthier,
];

/**
 * Catálogo público de juegos para uso del frontend (selector del menú principal).
 * Centraliza los metadatos para facilitar añadir nuevos juegos sin tocar Supabase.
 */
export const GAMES_CATALOG = GAMES;

export function getGame(id: string): GameModule | undefined {
  return GAMES.find((g) => g.id === id);
}
