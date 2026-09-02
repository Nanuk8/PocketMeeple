import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  RotateCcw,
  Trophy,
  Users,
  Frown,
  Smile,
  Skull,
  HeartHandshake,
} from "lucide-react";
import type { GameModule, GameState } from "@/games/types";
import { getGameTheme } from "@/games/theme";
import { useServerFn } from "@tanstack/react-start";
import { saveMatch } from "@/lib/matches.functions";
import { saveFinishedGame } from "@/lib/saveMatchHelper";
import { useNavigate } from "@tanstack/react-router";

type Props = {
  game: GameModule;
  state: GameState;
  setState: (s: GameState) => void;
  onNewGame: () => void;
  onBack?: () => void;
  onSaved: () => void;
};

export function CoopBoard({ game, state, setState, onNewGame, onBack, onSaved }: Props) {
  const theme = getGameTheme(game);
  const Icon = game.Icon ?? Users;
  const navigate = useNavigate();
  const save = useServerFn(saveMatch);
  const [finishOpen, setFinishOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const desafios = state.modifiers?.desafios_usados ?? [];
  const ayudas = state.modifiers?.ayudas_usadas ?? [];

  const toggleNumber = (key: "desafios_usados" | "ayudas_usadas", n: number) => {
    const cur = state.modifiers?.[key] ?? [];
    const next = cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b);
    setState({
      ...state,
      modifiers: { ...(state.modifiers ?? {}), [key]: next },
    });
  };

  const submit = async (won: boolean) => {
    if (saving) return;
    const teamScore = game.coopTracksScore ? Number(scoreInput) || 0 : 0;
    const next: GameState = {
      ...state,
      coop: { won, teamScore },
      modifiers: {
        ...(state.modifiers ?? {}),
        desafios_usados: desafios,
        ayudas_usadas: ayudas,
      },
    };
    setState(next);
    setSaving(true);
    const ok = await saveFinishedGame(game, next, save, () => {
      onSaved();
      navigate({ to: "/history" });
    });
    setSaving(false);
    if (!ok) setFinishOpen(false);
  };

  const coverImage = game.bggImage ?? game.cover;

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
                className={`gap-1 px-2 ${theme.text} hover:bg-black/5`}
                onClick={onBack}
              >
                <ChevronLeft className="h-4 w-4" /> Volver
              </Button>
            )}
            <Icon className={`h-6 w-6 ${theme.accent} shrink-0`} />
            <h1 className={`text-lg font-black tracking-wider uppercase truncate ${theme.text}`}>{game.name}</h1>
          </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <RotateCcw className="h-4 w-4" /> Nueva
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Empezar nueva partida?</AlertDialogTitle>
              <AlertDialogDescription>Se reiniciará el equipo actual.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onNewGame}>Sí, nueva</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-4">
        <div className={`${theme.card} p-5 flex flex-col items-center gap-3 text-center`}>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Users className="h-4 w-4" /> Modo Cooperativo
          </div>
          <Trophy className={`h-12 w-12 ${theme.accent}`} />
          <div className="text-2xl font-black">Equipo</div>
          <div className="flex flex-wrap justify-center gap-2">
            {state.players.map((p) => (
              <span
                key={p.id}
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${theme.accentBg}`}
              >
                {p.name}
              </span>
            ))}
          </div>
          <p className="text-sm text-slate-500 max-w-xs">
            Cuando termine la partida, registra el resultado del equipo. Las partidas cooperativas
            no afectan al Ranking individual.
          </p>

          {(game.difficultyCount || game.helpCount) && (
            <div className="w-full mt-2 space-y-4 text-left">
              {game.difficultyCount ? (
                <NumberRow
                  icon={<Skull className="h-4 w-4" />}
                  label="Cartas de Dificultad (Desafíos)"
                  count={game.difficultyCount}
                  active={desafios}
                  onToggle={(n) => toggleNumber("desafios_usados", n)}
                  activeClass="bg-orange-500 border-orange-600 text-white shadow-sm"
                />
              ) : null}
              {game.helpCount ? (
                <NumberRow
                  icon={<HeartHandshake className="h-4 w-4" />}
                  label="Cartas de Ayuda (Especialistas)"
                  count={game.helpCount}
                  active={ayudas}
                  onToggle={(n) => toggleNumber("ayudas_usadas", n)}
                  activeClass="bg-cyan-600 border-cyan-700 text-white shadow-sm"
                />
              ) : null}
            </div>
          )}
        </div>

        <Button
          size="lg"
          className={`w-full h-14 text-lg font-black ${theme.accentBg}`}
          onClick={() => setFinishOpen(true)}
        >
          Finalizar partida
        </Button>
      </div>

      <Dialog open={finishOpen} onOpenChange={(o) => !saving && setFinishOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado del equipo</DialogTitle>
            <DialogDescription>¿Cómo terminó la partida cooperativa?</DialogDescription>
          </DialogHeader>
          {game.coopTracksScore && (
            <div className="space-y-1">
              <Label htmlFor="team-score" className="text-sm font-semibold">
                Puntaje del equipo (opcional)
              </Label>
              <Input
                id="team-score"
                type="number"
                inputMode="numeric"
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                placeholder="0"
              />
            </div>
          )}
          <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => submit(false)}
              className="gap-1 border-red-300 text-red-700 hover:bg-red-50"
            >
              <Frown className="h-4 w-4" /> Perdimos
            </Button>
            <Button
              disabled={saving}
              onClick={() => submit(true)}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Smile className="h-4 w-4" /> ¡Ganamos!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

function NumberRow({
  icon,
  label,
  count,
  active,
  onToggle,
  activeClass,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: number[];
  onToggle: (n: number) => void;
  activeClass: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="flex gap-2 min-w-full">
          {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
            const on = active.includes(n);
            return (
              <button
                key={n}
                type="button"
                onClick={() => onToggle(n)}
                aria-pressed={on}
                aria-label={`${label} ${n}`}
                className={`h-11 min-w-[44px] px-2 rounded-lg border text-sm font-black tabular-nums transition-colors active:scale-95 ${
                  on ? activeClass : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
