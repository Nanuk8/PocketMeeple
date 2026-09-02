import type { GameModule, RoundEntry } from "./types";
import { Skull } from "lucide-react";

function calc(entry: RoundEntry, roundNumber: number): number | null {
  if (entry.bid === null || entry.tricks === null) return null;
  const { bid, tricks, bonus } = entry;
  if (bid === tricks) {
    if (bid === 0) return roundNumber * 10 + bonus;
    return tricks * 20 + bonus;
  }
  if (bid === 0) return -(roundNumber * 10) + bonus;
  return -(Math.abs(bid - tricks) * 10) + bonus;
}

export const skullKing: GameModule = {
  id: "skull-king",
  name: "Skull King",
  tagline: "Apuestas, bazas y oro pirata",
  icon: "Skull",
  Icon: Skull,
  startLabel: "¡Zarpar!",
  minPlayers: 2,
  maxPlayers: 10,
  theme: "pirate",
  totalRounds: 10,
  calcRoundScore: calc,
  rating: 7.6,
  idealPlayers: "4-6",
  playTime: "30m",
  weight: 1.7,
  bggId: 150145,
  bggImage:
    "https://cf.geekdo-images.com/1qvA21HdRaPYwrn4tGDNaQ__itemrep/img/duwIufYC4mHrAqmv9Wp2qCg_jVI=/fit-in/246x300/filters:strip_icc()/pic8689185.jpg",
  bggUrl: "https://boardgamegeek.com/boardgame/150145/skull-king",
};
