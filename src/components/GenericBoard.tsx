import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { RotateCcw, Trophy, ChevronLeft, Minus, Plus } from "lucide-react";
import { validateGameState } from "@/games/types";
import type { GameModule, GameState, CategoryValues } from "@/games/types";
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

export function GenericBoard({ game, state, setState, onNewGame, onFinish, onBack }: Props) {
  const Icon = game.Icon ?? Trophy;
  const theme = getGameTheme(game);
  const values: CategoryValues[] = state.categoryValues ?? state.players.map(() => ({}));

  const totals = values.map((v) => Number(v["score"] ?? 0));
  const maxTotal = Math.max(...totals);
  const coverImage = game.bggImage ?? game.cover;

  const updateScore = (playerIdx: number, newScore: number) => {
    const next = values.map((v, i) => (i === playerIdx ? { ...v, score: newScore } : v));
    setState({ ...state, categoryValues: next });
  };

  const adjustScore = (playerIdx: number, amount: number) => {
    const current = totals[playerIdx];
    updateScore(playerIdx, current + amount);
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
                className={`gap-1 px-2 ${theme.text} hover:bg-slate-100/20`}
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
            Finalizar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
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

      <div className="p-3 max-w-2xl mx-auto">
        <Accordion
          type="multiple"
          defaultValue={state.players.map((p) => p.id)}
          className="space-y-2"
        >
          {state.players.map((player, pIdx) => {
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
                <AccordionContent className="px-3">
                  <div className="flex items-center justify-center gap-4 py-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full shadow-sm hover:bg-slate-100"
                      onClick={() => adjustScore(pIdx, -1)}
                    >
                      <Minus className="h-6 w-6 text-slate-600" />
                    </Button>
                    <div className="w-24">
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={total}
                        onChange={(e) => updateScore(pIdx, parseInt(e.target.value) || 0)}
                        className={`text-center text-2xl font-bold h-12 bg-slate-50 ${theme.inputText}`}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full shadow-sm hover:bg-slate-100"
                      onClick={() => adjustScore(pIdx, 1)}
                    >
                      <Plus className="h-6 w-6 text-slate-600" />
                    </Button>
                  </div>
                  <div className="flex justify-center gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => adjustScore(pIdx, 5)}>
                      +5
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => adjustScore(pIdx, 10)}>
                      +10
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => adjustScore(pIdx, 50)}>
                      +50
                    </Button>
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
