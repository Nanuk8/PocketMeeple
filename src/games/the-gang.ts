import type { GameModule } from "./types";
import { Users } from "lucide-react";

export const theGang: GameModule = {
  id: "the-gang",
  name: "The Gang",
  tagline: "Atraco cooperativo de póker",
  icon: "Users",
  Icon: Users,
  startLabel: "¡Al golpe!",
  minPlayers: 3,
  maxPlayers: 6,
  kind: "coop",
  coop: true,
  coopTracksScore: false,
  rating: 7.6,
  idealPlayers: "4",
  playTime: "20m",
  weight: 1.61,
  bggId: 411567,
  bggImage:
    "https://cf.geekdo-images.com/ydwU0FMlRVa6wt8tOu1tgg__itemrep/img/C8KGHSPpYlMdMOQV9fyQV_TVu3M=/fit-in/246x300/filters:strip_icc()/pic7962719.jpg",
  bggUrl: "https://boardgamegeek.com/boardgame/411567/the-gang",

  // Numbered challenge and help cards are toggled in-game from the team
  // scorecard. The Gang ships 10 of each type.
  difficultyCount: 10,
  helpCount: 10,
};
