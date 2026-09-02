import type { GameModule } from "./types";
import { Car } from "lucide-react";

export const heat: GameModule = {
  id: "heat",
  name: "Heat: Pedal to the Metal",
  tagline: "Carreras y campeonato Grand Prix",
  icon: "Car",
  Icon: Car,
  startLabel: "¡Acelerar!",
  minPlayers: 1,
  maxPlayers: 6,
  kind: "heat",
  theme: "racing",
  totalRounds: 4,
  rating: 8.1,
  idealPlayers: "5-6",
  playTime: "60m",
  weight: 2.18,
  bggId: 366013,
  bggImage: "https://store.asmodee.com/cdn/shop/files/DO9101-image0_2000.jpg?width=800",
  bggUrl: "https://boardgamegeek.com/boardgame/366013/heat-pedal-metal",
};
