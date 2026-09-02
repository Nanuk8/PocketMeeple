import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skull, RotateCcw, Trophy, Undo2, ChevronLeft } from "lucide-react";
import {
  type GameState,
  type RoundEntry,
  type GameModule,
  cumulativeTotals,
  isGameComplete,
  validateGameState,
} from "@/games/types";
import { RoundCellEditor } from "./RoundCellEditor";
import { toast } from "sonner";
import { getGameTheme } from "@/games/theme";

type Props = {
  game: GameModule;
  state: GameState;
  setState: (s: GameState) => void;
  onNewGame: () => void;
  onFinish?: () => void;
  onBack?: () => void;
};

export function Scoreboard({ game, state, setState, onNewGame, onFinish, onBack }: Props) {
  const TOTAL_ROUNDS = game.totalRounds ?? 0;
  const [editing, setEditing] = useState<{ r: number; p: number } | null>(null);
  const historyRef = useRef<GameState[]>([]);
  const [, setHistoryTick] = useState(0);
  const totals = useMemo(() => cumulativeTotals(state, game), [state, game]);
  const finalTotals = totals[TOTAL_ROUNDS - 1];
  const leader = finalTotals.indexOf(Math.max(...finalTotals));
  const complete = useMemo(() => isGameComplete(state, game), [state, game]);
  const Icon = game.Icon ?? Skull;
  const theme = getGameTheme(game);
  const coverImage = game.bggImage ?? game.cover;

  const updateCell = (r: number, p: number, entry: RoundEntry) => {
    const current = state.rounds[r][p];
    if (
      current.bid === entry.bid &&
      current.tricks === entry.tricks &&
      current.bonus === entry.bonus
    )
      return;
    historyRef.current = [...historyRef.current, state].slice(-50);
    setHistoryTick((t) => t + 1);
    const rounds = state.rounds.map((row, ri) =>
      ri === r ? row.map((c, pi) => (pi === p ? entry : c)) : row,
    );
    setState({ ...state, rounds });
  };

  const undo = () => {
    const prev = historyRef.current[historyRef.current.length - 1];
    if (!prev) return;
    historyRef.current = historyRef.current.slice(0, -1);
    setHistoryTick((t) => t + 1);
    setState(prev);
  };

  return (
    <div className={`min-h-screen relative flex flex-col pb-6 ${theme.bg}`}>
      {/* Immersive Background */}
      {coverImage && (
        <div className="absolute inset-0 z-0 pointer-events-none fixed">
          <img
            src={coverImage}
            alt=""
            className="w-full h-full object-cover opacity-20 blur-xl scale-110"
          />
        </div>
      )}
      {/* Theme Overlay */}
      <div className={`absolute inset-0 z-0 pointer-events-none fixed ${theme.overlayClass || ""} ${theme.bgPattern || ""}`} />

      <div className="relative z-10 flex-1 flex flex-col">
        <header
          className={`sticky top-0 z-20 px-3 py-3 flex items-center justify-between border-b ${theme.header}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <Button
                size="sm"
                variant="ghost"
                className={`gap-1 px-2 ${theme.text} hover:bg-white/10`}
                onClick={onBack}
              >
                <ChevronLeft className="h-4 w-4" /> Volver
              </Button>
            )}
            <Icon className={`h-6 w-6 ${theme.accent} shrink-0`} />
            <h1 className={`text-lg font-black tracking-wider uppercase truncate ${theme.text}`}>
              {game.name}
            </h1>
          </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1 bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:text-white"
            onClick={undo}
            disabled={historyRef.current.length === 0}
          >
            <Undo2 className="h-4 w-4" /> Deshacer
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" /> Nueva
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Empezar nueva partida?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrarán todos los puntajes actuales.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onNewGame}>Sí, nueva</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="p-3">
        {complete && onFinish && (
          <div className="mb-3 rounded-2xl border border-red-700 bg-red-900/30 p-3 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-100">¡Partida completa!</div>
            <Button
              size="sm"
              className={theme.accentBg}
              onClick={() => {
                const err = validateGameState(state, game);
                if (err) {
                  toast.error(err);
                  return;
                }
                onFinish();
              }}
            >
              Ver Podio
            </Button>
          </div>
        )}

        {/* Totales destacados por jugador */}
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {state.players.map((pl, i) => (
            <div key={pl.id} className={`${theme.card} p-3 flex flex-col items-center`}>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-300 truncate max-w-full">
                {i === leader && finalTotals[i] !== 0 && (
                  <Trophy className={`h-3.5 w-3.5 ${theme.accent}`} />
                )}
                <span className="truncate">{pl.name}</span>
              </div>
              <div className={`text-4xl font-black tabular-nums ${theme.accent}`}>
                {finalTotals[i]}
              </div>
            </div>
          ))}
        </div>

        <div className={`${theme.card} overflow-hidden relative`}>
          <div className="overflow-x-auto overscroll-x-contain max-h-[calc(100vh-260px)] overflow-y-auto [scrollbar-width:thin]">
            <table className="border-collapse text-sm min-w-full">
              <thead>
                <tr className="bg-slate-700/80 text-slate-100 sticky top-0 z-20">
                  <th className="px-2 py-2 text-left sticky left-0 bg-slate-700 z-30">R</th>
                  {state.players.map((name, i) => (
                    <th key={i} className="px-2 py-2 text-center min-w-[96px] font-bold">
                      <div className="flex items-center justify-center gap-1">
                        {i === leader && finalTotals[i] !== 0 && (
                          <Trophy className={`h-3 w-3 ${theme.accent}`} />
                        )}
                        <span className="truncate max-w-[90px]">{name.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: TOTAL_ROUNDS }).map((_, r) => (
                  <tr key={r} className={r % 2 === 0 ? "bg-slate-800" : "bg-slate-800/60"}>
                    <td className="px-2 py-1 font-black text-slate-200 text-center sticky left-0 bg-inherit border-r border-slate-700 z-10">
                      {r + 1}
                    </td>
                    {state.players.map((_pl, p) => {
                      const entry = state.rounds[r][p];
                      const score = game.calcRoundScore!(entry, r + 1);
                      const total = totals[r][p];
                      const empty = entry.bid === null || entry.tricks === null;
                      const won = score !== null && entry.bid === entry.tricks;
                      return (
                        <td key={p} className="p-1 border-l border-slate-700/60">
                          <button
                            onClick={() => setEditing({ r, p })}
                            className={`w-full rounded-md p-1.5 text-center transition-all active:scale-95 border ${
                              empty
                                ? "border-dashed border-slate-600 bg-slate-900/40 text-slate-500"
                                : won
                                  ? "border-emerald-500/60 bg-emerald-500/15 text-slate-100"
                                  : "border-red-500/60 bg-red-500/15 text-slate-100"
                            }`}
                          >
                            {empty ? (
                              <div className="text-xs py-2">Tocar</div>
                            ) : (
                              <>
                                <div className="text-[10px] text-slate-400 leading-tight">
                                  {entry.bid}/{entry.tricks}
                                  {entry.bonus ? ` · b:${entry.bonus}` : ""}
                                </div>
                                <div
                                  className={`text-base font-black leading-tight ${
                                    score! >= 0 ? "text-emerald-400" : "text-red-400"
                                  }`}
                                >
                                  {score! > 0 ? `+${score}` : score}
                                </div>
                                <div className="text-xs font-bold text-slate-100 leading-tight">
                                  = {total}
                                </div>
                              </>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className={`text-center text-xs ${theme.textMuted} mt-3`}>
          Toca cualquier celda para registrar Apuesta · Bazas · Bonificaciones
        </p>
      </div>

      {editing && (
        <RoundCellEditor
          game={game}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          playerName={state.players[editing.p].name}
          roundNumber={editing.r + 1}
          entry={state.rounds[editing.r][editing.p]}
          onSave={(e) => updateCell(editing.r, editing.p, e)}
        />
      )}
      </div>
    </div>
  );
}
