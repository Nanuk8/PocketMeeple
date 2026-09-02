import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PlayerSetup } from "@/components/PlayerSetup";
import { Scoreboard } from "@/components/Scoreboard";
import { CategoryBoard } from "@/components/CategoryBoard";
import { HeatBoard } from "@/components/HeatBoard";
import { CoopBoard } from "@/components/CoopBoard";
import { CubitosBoard } from "@/components/CubitosBoard";
import { GenericBoard } from "@/components/GenericBoard";
import { PodiumScreen } from "@/components/PodiumScreen";
import { ResumeSessionsScreen } from "@/components/ResumeSessionsScreen";
import { getGame } from "@/games/registry";
import { newGameState, type GameState, type GameModule } from "@/games/types";
import { saveMatch } from "@/lib/matches.functions";
import { saveFinishedGame } from "@/lib/saveMatchHelper";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trophy } from "lucide-react";
import {
  getSession,
  listSessionsForGame,
  newSessionId,
  removeSession,
  upsertSession,
  type PausedSession,
} from "@/lib/sessions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type PlaySearch = { session?: string; mode?: "new" };

export const Route = createFileRoute("/play/$gameId")({
  validateSearch: (search: Record<string, unknown>): PlaySearch => ({
    session: typeof search.session === "string" ? search.session : undefined,
    mode: search.mode === "new" ? "new" : undefined,
  }),
  component: PlayPage,
});

function hasGameData(state: GameState | null, game: GameModule): boolean {
  if (!state) return false;
  if (game.kind === "coop") {
    return state.coop?.won !== null && state.coop?.won !== undefined;
  }
  if (game.kind === "generic") {
    const vals = state.categoryValues ?? [];
    return vals.some((v) => v["score"] !== undefined && v["score"] !== 0);
  }
  if (game.kind === "categories") {
    const vals = state.categoryValues ?? [];
    return vals.some((v) =>
      Object.values(v).some((n) => n !== undefined && n !== null && !Number.isNaN(n) && n !== 0),
    );
  }
  if (game.kind === "cubitos") {
    const vals = state.categoryValues ?? [];
    return vals.some((v) =>
      Object.values(v).some((n) => n !== undefined && n !== null && !Number.isNaN(n) && n !== 0),
    );
  }
  if (game.kind === "heat") {
    const data = state.heatData ?? [];
    return data.some(
      (d) =>
        (d.upgrades && d.upgrades.trim() !== "") ||
        d.rounds.some((r) => r.position !== null || (r.bonus !== null && r.bonus !== 0)),
    );
  }
  return state.rounds.some((row) =>
    row.some(
      (c) =>
        (c.bid !== null && c.bid !== undefined) ||
        (c.tricks !== null && c.tricks !== undefined) ||
        (c.bonus !== null && c.bonus !== undefined && c.bonus !== 0),
    ),
  );
}

function PlayPage() {
  const { gameId } = Route.useParams();
  const search = Route.useSearch();
  const { user } = useAuth();

  const [game, setGame] = useState<GameModule | null>(null);
  const [loadingGame, setLoadingGame] = useState(true);

  const navigate = useNavigate();
  const save = useServerFn(saveMatch);
  const [state, setState] = useState<GameState | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showPodium, setShowPodium] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);
  const [pausedList, setPausedList] = useState<PausedSession[] | null>(null);
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve game
  useEffect(() => {
    let cancelled = false;
    const resolveGame = async () => {
      const g = getGame(gameId);
      if (g) {
        if (!cancelled) {
          setGame(g);
          setLoadingGame(false);
        }
        return;
      }

      if (gameId.startsWith("bgg-") && user) {
        const bggId = gameId.replace("bgg-", "");
        const { data } = await supabase
          .from("user_games")
          .select("*")
          .eq("bgg_id", bggId)
          .eq("user_id", user.id)
          .single();

        if (data && !cancelled) {
          setGame({
            id: `bgg-${data.bgg_id}`,
            name: data.name,
            icon: "Trophy",
            Icon: Trophy,
            bggId: data.bgg_id,
            bggImage: data.image_url,
            kind: "generic",
            minPlayers: 1,
            maxPlayers: 99,
            startLabel: "Jugar",
            theme: "default",
          } as unknown as GameModule);
          setLoadingGame(false);
          return;
        }
      }

      if (!cancelled) {
        setGame(null);
        setLoadingGame(false);
      }
    };
    resolveGame();
    return () => {
      cancelled = true;
    };
  }, [gameId, user]);

  // Initial hydration: choose a session or show the resume screen
  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    (async () => {
      if (search.session) {
        const s = await getSession(search.session);
        if (cancelled) return;
        if (s && s.gameId === gameId) {
          setSessionId(s.sessionId);
          setState(s.gameState);
          setHydrated(true);
          return;
        }
      }
      if (search.mode === "new") {
        if (cancelled) return;
        setSessionId(newSessionId());
        setState(null);
        setHydrated(true);
        return;
      }
      const paused = await listSessionsForGame(gameId);
      if (cancelled) return;
      if (paused.length > 0) {
        setPausedList(paused);
        setHydrated(true);
      } else {
        setSessionId(newSessionId());
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, game, search.session, search.mode]);

  // Autosave (debounced): persist session to the cloud on state changes
  useEffect(() => {
    if (!hydrated || !game || !sessionId || !state || !state.started) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void upsertSession({
        sessionId,
        gameId,
        dateModified: Date.now(),
        playerNames: state.players.map((p) => p.name),
        gameState: state,
      });
    }, 500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [state, sessionId, hydrated, game, gameId]);

  if (loadingGame) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="h-12 w-12 rounded-full border-4 border-slate-300 border-t-slate-800 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Buscando juego...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="text-center">
          <p className="font-bold mb-4 text-slate-800">Juego no encontrado</p>
          <Button asChild variant="outline">
            <Link to="/">Volver</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    const Icon = game.Icon;
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: "var(--gradient-sea)" }}
      >
        <div className="flex flex-col items-center gap-4">
          {Icon ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              <Icon className="h-16 w-16 text-primary-foreground animate-bounce relative z-10" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full border-4 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          )}
          <p className="text-primary-foreground font-semibold text-lg animate-pulse">
            Cargando {game.name}…
          </p>
        </div>
      </div>
    );
  }

  // Resume selector
  if (pausedList && !sessionId) {
    return (
      <ResumeSessionsScreen
        game={game}
        sessions={pausedList}
        onResume={(s) => {
          setSessionId(s.sessionId);
          setState(s.gameState);
          setPausedList(null);
        }}
        onNew={() => {
          setSessionId(newSessionId());
          setState(null);
          setPausedList(null);
        }}
        onDelete={(id) => {
          void (async () => {
            await removeSession(id);
            const next = await listSessionsForGame(gameId);
            if (next.length === 0) {
              setPausedList(null);
              setSessionId(newSessionId());
            } else {
              setPausedList(next);
            }
          })();
        }}
        onFinishAndSave={async (s) => {
          if (savingSessionId) return;
          setSavingSessionId(s.sessionId);
          const ok = await saveFinishedGame(game, s.gameState, save, async () => {
            await removeSession(s.sessionId);
            const next = await listSessionsForGame(gameId);
            if (next.length === 0) {
              setPausedList(null);
              setSessionId(newSessionId());
            } else {
              setPausedList(next);
            }
          });
          setSavingSessionId(null);
          if (ok) navigate({ to: "/history" });
        }}
        savingSessionId={savingSessionId}
        onBack={() => navigate({ to: "/" })}
      />
    );
  }

  if (!state || !state.started) {
    return <PlayerSetup game={game} onStart={(players) => setState(newGameState(players, game))} />;
  }

  if (showPodium) {
    return (
      <PodiumScreen
        game={game}
        state={state}
        onDiscard={() => {
          if (sessionId) void removeSession(sessionId);
          setShowPodium(false);
          setState(null);
          setSessionId(null);
          navigate({ to: "/" });
        }}
        onSaved={() => {
          if (sessionId) void removeSession(sessionId);
          setShowPodium(false);
          setState(null);
          setSessionId(null);
        }}
      />
    );
  }

  const requestBack = () => {
    if (!hasGameData(state, game)) {
      if (sessionId) void removeSession(sessionId);
      setState(null);
      setSessionId(null);
      navigate({ to: "/" });
      return;
    }
    setConfirmBack(true);
  };

  const handlePause = () => {
    // Aseguramos un flush inmediato antes de salir.
    if (sessionId && state && state.started) {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      void upsertSession({
        sessionId,
        gameId,
        dateModified: Date.now(),
        playerNames: state.players.map((p) => p.name),
        gameState: state,
      });
    }
    setConfirmBack(false);
    navigate({ to: "/" });
  };

  const handleDiscard = () => {
    if (sessionId) void removeSession(sessionId);
    setConfirmBack(false);
    setState(null);
    setSessionId(null);
    navigate({ to: "/" });
  };

  return (
    <>
      <div className="animate-fade-in">
        {game.kind === "categories" ? (
          <CategoryBoard
            game={game}
            state={state}
            setState={setState}
            onNewGame={() => setState(null)}
            onFinish={() => setShowPodium(true)}
            onBack={requestBack}
          />
        ) : game.kind === "heat" ? (
          <HeatBoard
            game={game}
            state={state}
            setState={setState}
            onNewGame={() => setState(null)}
            onFinish={() => setShowPodium(true)}
            onBack={requestBack}
          />
        ) : game.kind === "coop" ? (
          <CoopBoard
            game={game}
            state={state}
            setState={setState}
            onNewGame={() => setState(null)}
            onBack={requestBack}
            onSaved={() => {
              if (sessionId) void removeSession(sessionId);
              setState(null);
              setSessionId(null);
            }}
          />
        ) : game.kind === "cubitos" ? (
          <CubitosBoard
            game={game}
            state={state}
            setState={setState}
            onNewGame={() => setState(null)}
            onFinish={() => setShowPodium(true)}
            onBack={requestBack}
          />
        ) : game.kind === "generic" ? (
          <GenericBoard
            game={game}
            state={state}
            setState={setState}
            onNewGame={() => setState(null)}
            onFinish={() => setShowPodium(true)}
            onBack={requestBack}
          />
        ) : (
          <Scoreboard
            game={game}
            state={state}
            setState={setState}
            onNewGame={() => setState(null)}
            onFinish={() => setShowPodium(true)}
            onBack={requestBack}
          />
        )}
      </div>

      <AlertDialog open={confirmBack} onOpenChange={setConfirmBack}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Qué quieres hacer con esta partida?</AlertDialogTitle>
            <AlertDialogDescription>
              Puedes pausar y continuar después, descartarla por completo, o volver a la partida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button onClick={handlePause} className="w-full">
              Pausar y guardar
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscard}
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              Descartar partida
            </Button>
            <AlertDialogCancel className="w-full mt-0">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
