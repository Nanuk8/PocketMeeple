import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import {
  Flag,
  RotateCcw,
  ChevronLeft,
  Trophy,
  Medal,
  Award,
  Coins,
  Users,
  Minus,
  Plus,
} from "lucide-react";
import { validateGameState } from "@/games/types";
import type { GameModule, GameState, CategoryValues } from "@/games/types";
import { calcCubitosRanking, type CubitosPlayerResult } from "@/games/cubitos";
import { toast } from "sonner";
import { getGameTheme } from "@/games/theme";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

type CubitorsBoardProps = {
  game: GameModule;
  state: GameState;
  setState: (s: GameState) => void;
  onNewGame: () => void;
  onFinish: () => void;
  onBack?: () => void;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function valueOf(v: CategoryValues, k: string): string {
  const n = v[k];
  return n === undefined || n === null || Number.isNaN(n) ? "" : String(n);
}

function positionEmoji(pos: number): { icon: React.ElementType; label: string } {
  if (pos === 1) return { icon: Trophy, label: "1°" };
  if (pos === 2) return { icon: Medal, label: "2°" };
  return { icon: Award, label: `${pos}°` };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function CubitosBoard({
  game,
  state,
  setState,
  onNewGame,
  onFinish,
  onBack,
}: CubitorsBoardProps) {
  const Icon = game.Icon ?? Flag;
  const theme = getGameTheme(game);

  // categoryValues is guaranteed to exist for kind === "cubitos" (initialized in newGameState)
  const values: CategoryValues[] = state.categoryValues ?? state.players.map(() => ({}));

  // Local state: which players crossed the finish line
  const [crossedMeta, setCrossedMeta] = useState<boolean[]>(() =>
    state.players.map((_, i) => {
      const v = values[i] ?? {};
      // If extraSquares already has a positive value (resumed session), auto-check
      const es = Number(v["extraSquares"] ?? 0);
      return es > 0;
    }),
  );

  // ── Mutations ──────────────────────────────

  const setVal = (playerIdx: number, key: string, raw: string) => {
    const next = values.map((v, i) =>
      i === playerIdx ? { ...v, [key]: raw === "" ? undefined : Math.max(0, Number(raw)) } : v,
    );
    setState({ ...state, categoryValues: next });
  };

  const stepExtra = (playerIdx: number, delta: number) => {
    const v = values[playerIdx] ?? {};
    const current = Math.max(0, Number(v["extraSquares"] ?? 0));
    const next = Math.max(0, current + delta);
    const nextValues = values.map((vv, i) =>
      i === playerIdx ? { ...vv, extraSquares: next } : vv,
    );
    setState({ ...state, categoryValues: nextValues });
  };

  const toggleCrossedMeta = (playerIdx: number, checked: boolean) => {
    const nextCrossed = crossedMeta.map((c, i) => (i === playerIdx ? checked : c));
    setCrossedMeta(nextCrossed);

    // If unchecked → force extraSquares = 0
    if (!checked) {
      const nextValues = values.map((v, i) => (i === playerIdx ? { ...v, extraSquares: 0 } : v));
      setState({ ...state, categoryValues: nextValues });
    }
  };

  // ── Real-time ranking ──────────────────────

  const rankingPlayers = useMemo<CubitosPlayerResult[]>(() => {
    const players: CubitosPlayerResult[] = state.players.map((p, i) => {
      const v = values[i] ?? {};
      return {
        id: p.id,
        name: p.name,
        extraSquares: Math.max(0, Number(v["extraSquares"] ?? 0)),
        coins: Math.max(0, Number(v["coins"] ?? 0)),
        fans: Math.max(0, Number(v["fans"] ?? 0)),
        finalPosition: 1, // placeholder, calcCubitosRanking will assign
      };
    });
    return calcCubitosRanking(players);
  }, [state.players, values]);

  // Map player id → ranked result for quick lookup
  const rankById = useMemo(() => {
    const map = new Map<string, CubitosPlayerResult>();
    for (const r of rankingPlayers) map.set(r.id, r);
    return map;
  }, [rankingPlayers]);

  // ── Tiebreaker reason ──────────────────────

  function tiebreakerChip(ranked: CubitosPlayerResult[], index: number): string | null {
    if (index === 0) return null;
    const cur = ranked[index];
    const prev = ranked[index - 1];
    // Only show chip when extraSquares are tied but position differs
    if (cur.extraSquares !== prev.extraSquares) return null;
    if (cur.finalPosition === prev.finalPosition) return null; // complete tie
    if (cur.coins !== prev.coins) return "Desempate: monedas";
    if (cur.fans !== prev.fans) return "Desempate: fanáticos";
    return null;
  }

  // ── Render ─────────────────────────────────

  const coverImage = game.bggImage ?? game.cover;

  return (
    <div className={`min-h-screen relative flex flex-col pb-8 ${theme.bg}`}>
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
      {/* ── Sticky header ── */}
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
          {/* Finalizar */}
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

          {/* Nueva partida */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 bg-transparent border-slate-500 text-slate-100 hover:bg-slate-700 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" /> Nueva
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className={theme.dialog}>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Empezar nueva carrera?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrarán todos los datos actuales.
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

      {/* ── Player cards ── */}
      <div className="p-3 max-w-2xl mx-auto space-y-3">
        <Accordion
          type="multiple"
          defaultValue={state.players.map((p) => p.id)}
          className="space-y-2"
        >
          {state.players.map((player, pIdx) => {
            const v = values[pIdx] ?? {};
            const crossed = crossedMeta[pIdx] ?? false;
            const extraVal = Math.max(0, Number(v["extraSquares"] ?? 0));
            const ranked = rankById.get(player.id);
            const position = ranked?.finalPosition ?? pIdx + 1;
            const { icon: PosIcon, label: posLabel } = positionEmoji(position);

            return (
              <AccordionItem
                key={player.id}
                value={player.id}
                className={`overflow-hidden transition-colors duration-300 ${theme.card} ${
                  crossed ? "ring-1 ring-green-500/40" : ""
                }`}
              >
                {/* Card header */}
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    {/* Player name */}
                    <div className={`flex items-center gap-2 font-black text-base ${theme.text}`}>
                      <span className="truncate max-w-[160px]">{player.name}</span>
                    </div>

                    {/* Position badge */}
                    <div className={`flex items-center gap-1 text-sm font-black ${theme.accent}`}>
                      <PosIcon className="h-4 w-4" />
                      <span>{posLabel}</span>
                    </div>
                  </div>
                </AccordionTrigger>

                {/* Card body */}
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* ── Cruzó la meta ── */}
                    <div
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        crossed
                          ? "bg-green-900/30 border border-green-700/40"
                          : "bg-slate-800/50 border border-slate-600/40"
                      }`}
                    >
                      <Checkbox
                        id={`meta-${player.id}`}
                        checked={crossed}
                        onCheckedChange={(val) => toggleCrossedMeta(pIdx, Boolean(val))}
                        className="h-5 w-5 border-slate-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <Label
                        htmlFor={`meta-${player.id}`}
                        className={`text-sm font-bold cursor-pointer select-none ${
                          crossed ? "text-green-300" : theme.textMuted
                        }`}
                      >
                        {crossed ? "✓ Cruzó la meta" : "No cruzó la meta"}
                      </Label>
                    </div>

                    {/* ── Casillas extra (stepper) ── */}
                    <div className="space-y-1.5">
                      <Label
                        className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}
                      >
                        Casillas más allá de la meta
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={!crossed}
                          onClick={() => stepExtra(pIdx, -1)}
                          className={`h-10 w-10 shrink-0 border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:opacity-30`}
                          aria-label="Menos casillas"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          disabled={!crossed}
                          value={crossed ? String(extraVal) : "0"}
                          onChange={(e) => {
                            if (!crossed) return;
                            const raw = e.target.value;
                            const n = Math.max(0, Number(raw) || 0);
                            const nextValues = values.map((vv, i) =>
                              i === pIdx ? { ...vv, extraSquares: n } : vv,
                            );
                            setState({ ...state, categoryValues: nextValues });
                          }}
                          className={`flex-1 text-center font-black text-xl tabular-nums border-slate-500 bg-slate-800 text-white disabled:opacity-30 focus-visible:ring-red-500`}
                        />

                        <Button
                          size="icon"
                          variant="outline"
                          disabled={!crossed}
                          onClick={() => stepExtra(pIdx, 1)}
                          className="h-10 w-10 shrink-0 border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:opacity-30"
                          aria-label="Más casillas"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* ── Monedas ── */}
                    <div className="flex items-center justify-between gap-3">
                      <Label
                        htmlFor={`coins-${player.id}`}
                        className={`flex items-center gap-1.5 text-sm font-bold flex-1 ${theme.text}`}
                      >
                        <Coins className={`h-4 w-4 ${theme.accent}`} />
                        Monedas
                      </Label>
                      <Input
                        id={`coins-${player.id}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="0"
                        value={valueOf(v, "coins")}
                        onChange={(e) => setVal(pIdx, "coins", e.target.value)}
                        className={`w-24 ${theme.inputUnderline} ${theme.inputText}`}
                      />
                    </div>

                    {/* ── Fanáticos ── */}
                    <div className="flex items-center justify-between gap-3">
                      <Label
                        htmlFor={`fans-${player.id}`}
                        className={`flex items-center gap-1.5 text-sm font-bold flex-1 ${theme.text}`}
                      >
                        <Users className={`h-4 w-4 ${theme.accent}`} />
                        Fanáticos
                      </Label>
                      <Input
                        id={`fans-${player.id}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="0"
                        value={valueOf(v, "fans")}
                        onChange={(e) => setVal(pIdx, "fans", e.target.value)}
                        className={`w-24 ${theme.inputUnderline} ${theme.inputText}`}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* ── Real-time ranking ── */}
        <div className={`rounded-2xl border border-slate-600 bg-slate-900/60 p-4 space-y-2`}>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
            Clasificación actual
          </h2>
          <ol className="space-y-2">
            {rankingPlayers.map((r, idx) => {
              const { icon: PosIcon, label: posLabel } = positionEmoji(r.finalPosition);
              const chip = tiebreakerChip(rankingPlayers, idx);

              return (
                <li
                  key={r.id}
                  className={`flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 ${
                    r.finalPosition === 1
                      ? "bg-red-900/25 border border-red-700/30"
                      : "bg-slate-800/50 border border-slate-700/30"
                  }`}
                >
                  {/* Position + name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <PosIcon
                      className={`h-4 w-4 shrink-0 ${
                        r.finalPosition === 1
                          ? "text-red-400"
                          : r.finalPosition === 2
                            ? "text-slate-300"
                            : "text-slate-500"
                      }`}
                    />
                    <span
                      className={`text-sm font-black ${
                        r.finalPosition === 1 ? "text-red-300" : "text-slate-200"
                      } truncate`}
                    >
                      {posLabel} {r.name}
                    </span>
                  </div>

                  {/* Score detail + tiebreaker */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-slate-400 tabular-nums">
                      {r.extraSquares > 0
                        ? `${r.extraSquares} casilla${r.extraSquares !== 1 ? "s" : ""} extra`
                        : "Sin cruzar meta"}
                    </span>
                    {chip && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 bg-amber-900/40 text-amber-300 border border-amber-700/40"
                      >
                        {chip}
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      </div>
    </div>
  );
}
