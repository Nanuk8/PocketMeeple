import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { saveMatch } from "@/lib/matches.functions";
import { saveFinishedGame } from "@/lib/saveMatchHelper";
import type { GameModule, GameState } from "@/games/types";
import { finalScores } from "@/games/types";
import { getGameTheme } from "@/games/theme";

type Props = {
  game: GameModule;
  state: GameState;
  onDiscard: () => void;
  onSaved: () => void;
};

export function PodiumScreen({ game, state, onDiscard, onSaved }: Props) {
  const finals = finalScores(state, game);
  const ranked = state.players
    .map((p, i) => ({ player: p, score: finals[i] }))
    .sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? 0;
  const winnerIds = ranked.filter((r) => r.score === topScore).map((r) => r.player.id);
  const navigate = useNavigate();
  const save = useServerFn(saveMatch);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await saveFinishedGame(game, state, save, () => {
      onSaved();
      navigate({ to: "/history" });
    });
    setSaving(false);
  };

  const medals = [
    { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/15 border-yellow-500/50" },
    { icon: Medal, color: "text-zinc-400", bg: "bg-zinc-400/15 border-zinc-400/50" },
    { icon: Award, color: "text-amber-700", bg: "bg-amber-700/15 border-amber-700/50" },
  ];

  const coverImage = game.bggImage ?? game.cover;
  const theme = getGameTheme(game);

  return (
    <div className={`min-h-screen relative flex flex-col p-4 ${theme.bg}`}>
      {/* Immersive Background */}
      {coverImage && (
        <div className="absolute inset-0 z-0 pointer-events-none fixed">
          <img
            src={coverImage}
            alt=""
            className="w-full h-full object-cover opacity-30 blur-2xl scale-110"
          />
        </div>
      )}
      {/* Theme Overlay */}
      <div className={`absolute inset-0 z-0 pointer-events-none fixed ${theme.overlayClass || ""} ${theme.bgPattern || ""}`} />

      <div className="relative z-10 flex-1 max-w-md mx-auto w-full flex flex-col justify-center">
        <div
          className={`rounded-3xl p-6 border shadow-2xl ${theme.card || "bg-white border-slate-200"}`}
        >
          <div className="text-center mb-6">
            <Trophy className="mx-auto h-14 w-14 text-primary" />
            <h1 className="text-2xl font-black text-primary mt-2">¡Fin de la partida!</h1>
            <p className="text-sm text-muted-foreground">{game.name}</p>
          </div>
          <ol className="space-y-2">
            {ranked.map((r, i) => {
              const m = medals[i];
              const Icon = m?.icon;
              return (
                <li
                  key={r.player.id}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 ${m ? m.bg : "border-border bg-card/40"}`}
                >
                  <div className="w-8 text-center font-black text-lg">{i + 1}</div>
                  {Icon && <Icon className={`h-6 w-6 ${m.color}`} />}
                  <div className="flex-1 font-bold truncate">{r.player.name}</div>
                  <div className="text-2xl font-black text-primary">{r.score}</div>
                </li>
              );
            })}
          </ol>
          <div className="grid grid-cols-2 gap-2 mt-6">
            <Button variant="outline" onClick={onDiscard} disabled={saving} className="gap-1">
              <Trash2 className="h-4 w-4" /> Descartar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1">
              <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar y Finalizar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
