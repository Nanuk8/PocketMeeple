import { saveMatch } from "@/lib/matches.functions";
import { enqueueMatch } from "@/lib/offline-queue";
import { finalScores, validateGameState, type GameModule, type GameState } from "@/games/types";
import { toast } from "sonner";

type SaveMatchFn = (input: { data: any }) => Promise<any>;

export function buildMatchPayload(game: GameModule, state: GameState) {
  const finals = finalScores(state, game);
  const ranked = state.players
    .map((p, i) => ({ player: p, score: finals[i] }))
    .sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? 0;
  const isCoop = !!game.coop;
  const teamWon = isCoop ? state.coop?.won === true : undefined;
  // For coop games, "winners" semantically = the whole team (if won)
  const winnerIds = isCoop
    ? teamWon
      ? state.players.map((p) => p.id)
      : [state.players[0].id]
    : ranked.filter((r) => r.score === topScore).map((r) => r.player.id);
  return {
    game_name: game.name,
    players: state.players,
    scores: finals,
    winner_id: winnerIds[0],
    winner_ids: winnerIds,
    is_coop: isCoop,
    team_won: teamWon,
    game_modifiers: state.modifiers ?? {},
    rounds: (game.kind === "categories"
      ? (state.categoryValues ?? [])
      : game.kind === "heat"
        ? (state.heatData ?? [])
        : game.kind === "coop"
          ? (state.coop ?? { won: null, teamScore: 0 })
          : state.rounds) as unknown,
  };
}

export async function saveFinishedGame(
  game: GameModule,
  state: GameState,
  save: SaveMatchFn,
  onSuccess?: () => void,
): Promise<boolean> {
  const err = validateGameState(state, game);
  if (err) {
    toast.error(err);
    return false;
  }
  const payload = buildMatchPayload(game, state);
  try {
    await save({ data: payload });
    if (payload.is_coop) {
      toast.success(
        payload.team_won ? "¡Victoria del equipo registrada!" : "Derrota del equipo registrada",
      );
    } else if (payload.winner_ids.length > 1) {
      toast.success(`Partida guardada · Empate entre ${payload.winner_ids.length} jugadores`);
    } else {
      toast.success("Partida guardada en el historial");
    }
    onSuccess?.();
    return true;
  } catch (e) {
    console.error(e);
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    enqueueMatch(payload);
    toast.warning(
      offline
        ? "Sin conexión. Partida guardada localmente. Se sincronizará al recuperar la red."
        : "No se pudo enviar al servidor. Guardada localmente, se reintentará automáticamente.",
      { duration: 6000 },
    );
    onSuccess?.();
    return true;
  }
}
