import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Car, RotateCcw, Trophy, ChevronLeft, Flag } from "lucide-react";
import {
  HEAT_POSITION_POINTS,
  heatPlayerTotal,
  heatRoundPoints,
  validateGameState,
} from "@/games/types";
import type { GameModule, GameState, HeatPlayerData } from "@/games/types";
import { toast } from "sonner";
import { getGameTheme } from "@/games/theme";

type Props = {
  game: GameModule;
  state: GameState;
  setState: (s: GameState) => void;
  onNewGame: () => void;
  onFinish: () => void;
  onBack?: () => void;
};

const POSITIONS = [1, 2, 3, 4, 5, 6] as const;

function ensureHeatData(state: GameState, totalRounds: number): HeatPlayerData[] {
  const data = state.heatData ?? [];
  return state.players.map((_, i) => {
    const d = data[i] ?? { upgrades: "", rounds: [] };
    const rounds = Array.from(
      { length: totalRounds },
      (_, r) => d.rounds[r] ?? { position: null, bonus: 0 },
    );
    return { upgrades: d.upgrades ?? "", rounds };
  });
}

export function HeatBoard({ game, state, setState, onNewGame, onFinish, onBack }: Props) {
  const Icon = game.Icon ?? Car;
  const theme = getGameTheme(game);
  const totalRounds = game.totalRounds ?? 4;
  const data = useMemo(() => ensureHeatData(state, totalRounds), [state, totalRounds]);

  const totals = data.map((d) => heatPlayerTotal(d));
  const maxTotal = Math.max(...totals);
  const coverImage = game.bggImage ?? game.cover;

  const update = (next: HeatPlayerData[]) => setState({ ...state, heatData: next });

  const setUpgrades = (pIdx: number, value: string) => {
    const next = data.map((d, i) => (i === pIdx ? { ...d, upgrades: value } : d));
    update(next);
  };

  const setPosition = (pIdx: number, rIdx: number, position: number | null) => {
    const next = data.map((d, i) => {
      if (i !== pIdx) return d;
      const rounds = d.rounds.map((r, ri) => (ri === rIdx ? { ...r, position } : r));
      return { ...d, rounds };
    });
    update(next);
  };

  const setBonus = (pIdx: number, rIdx: number, raw: string) => {
    const bonus = raw === "" ? 0 : Number(raw);
    const next = data.map((d, i) => {
      if (i !== pIdx) return d;
      const rounds = d.rounds.map((r, ri) =>
        ri === rIdx ? { ...r, bonus: Number.isFinite(bonus) ? bonus : 0 } : r,
      );
      return { ...d, rounds };
    });
    update(next);
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
            className={`gap-1 ${theme.accentBg}`}
            onClick={() => {
              const err = validateGameState(state, game);
              if (err) {
                toast.error(err);
                return;
              }
              onFinish();
            }}
          >
            <Flag className="h-4 w-4" /> Finalizar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 bg-transparent border-slate-500 text-slate-100 hover:bg-slate-800 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" /> Nueva
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Empezar nuevo campeonato?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrarán todas las carreras y mejoras actuales.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onNewGame}>Sí, nuevo</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="p-3 max-w-2xl mx-auto">
        <div className="mb-3 rounded-xl border border-slate-600 bg-slate-700/60 p-3 text-xs text-slate-300">
          Modo Grand Prix · hasta {totalRounds} carreras. Puedes finalizar tras la carrera 1
          (carrera única) o jugar el campeonato completo. Puntos por posición: 1º 9 · 2º 6 · 3º 4 ·
          4º 3 · 5º 2 · 6º 1.
        </div>

        <Accordion
          type="multiple"
          defaultValue={state.players.map((p) => p.id)}
          className="space-y-2"
        >
          {state.players.map((player, pIdx) => {
            const d = data[pIdx];
            const total = totals[pIdx];
            const isLeader = total === maxTotal && total > 0;
            return (
              <AccordionItem
                key={player.id}
                value={player.id}
                className={`overflow-hidden ${theme.card}`}
              >
                <AccordionTrigger className="px-3 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className={`flex items-center gap-2 font-black text-base ${theme.text}`}>
                      {isLeader && <Trophy className={`h-4 w-4 ${theme.accent}`} />}
                      <span className="truncate max-w-[160px]">{player.name}</span>
                    </div>
                    <div className={`text-4xl font-black tabular-nums ${theme.accent}`}>
                      {total}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid gap-3">
                    <div>
                      <Label
                        className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}
                      >
                        Mejoras del Auto
                      </Label>
                      <Textarea
                        value={d.upgrades}
                        onChange={(e) => setUpgrades(pIdx, e.target.value)}
                        placeholder="Motor XL, Frenos, Aleron…"
                        className="mt-1 min-h-[60px] bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
                      />
                    </div>

                    {d.rounds.map((round, rIdx) => {
                      const points = heatRoundPoints(round);
                      const posPts = round.position
                        ? (HEAT_POSITION_POINTS[round.position] ?? 0)
                        : 0;
                      return (
                        <div
                          key={rIdx}
                          className="rounded-xl border border-slate-600 bg-slate-800/70 p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className={`text-sm font-bold ${theme.text}`}>
                              Carrera {rIdx + 1}
                            </div>
                            <div className={`text-lg font-black tabular-nums ${theme.accent}`}>
                              {points > 0 ? `+${points}` : points}
                            </div>
                          </div>

                          <div className="mb-2">
                            <Label className={`text-[11px] ${theme.textMuted}`}>Posición</Label>
                            <div className="mt-1 grid grid-cols-6 gap-1">
                              {POSITIONS.map((pos) => {
                                const active = round.position === pos;
                                return (
                                  <button
                                    key={pos}
                                    type="button"
                                    onClick={() => setPosition(pIdx, rIdx, active ? null : pos)}
                                    className={`rounded-md py-2 text-sm font-black border transition-colors ${
                                      active
                                        ? "bg-red-600 border-red-500 text-white"
                                        : "bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600"
                                    }`}
                                  >
                                    {pos}º
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {round.position
                                ? `+${posPts} pts por posición`
                                : "Sin posición registrada"}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <Label className={`text-sm font-bold flex-1 ${theme.text}`}>
                              Bonificaciones
                            </Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              value={round.bonus === 0 ? "" : String(round.bonus)}
                              onChange={(e) => setBonus(pIdx, rIdx, e.target.value)}
                              placeholder="0"
                              className="w-24 bg-slate-900 border-slate-600 text-white text-right font-bold"
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between border-t border-slate-600 pt-3 mt-1">
                      <span className={`font-black ${theme.text}`}>Puntaje Total</span>
                      <span className={`text-4xl font-black tabular-nums ${theme.accent}`}>
                        {total}
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
      </div>
    </div>
  );
}
