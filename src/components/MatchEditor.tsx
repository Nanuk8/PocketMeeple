import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X, Trophy } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { updateMatch } from "@/lib/matches.functions";
import { GAMES } from "@/games/registry";
import { validateGameState } from "@/games/types";
import type { CategoryValues } from "@/games/types";
import { toast } from "sonner";

type ScoreRow = {
  player_id: string;
  score: number;
  is_winner: boolean;
  players: { name: string } | null;
};

export type EditableMatch = {
  id: string;
  game_name: string;
  winner_id: string | null;
  rounds: unknown;
  match_scores: ScoreRow[];
};

type Props = {
  match: EditableMatch;
  onClose: () => void;
  onSaved: () => void;
};

export function MatchEditor({ match, onClose, onSaved }: Props) {
  const save = useServerFn(updateMatch);
  const [saving, setSaving] = useState(false);

  const game = useMemo(
    () =>
      GAMES.find(
        (g) =>
          g.name.toLowerCase() === match.game_name.toLowerCase() ||
          g.id.toLowerCase() === match.game_name.toLowerCase(),
      ),
    [match.game_name],
  );

  const isCategories =
    game?.kind === "categories" &&
    Array.isArray(match.rounds) &&
    (match.rounds as unknown[]).length === match.match_scores.length;

  // Players in stable order matching stored rounds index
  const players = match.match_scores.map((s) => ({
    id: s.player_id,
    name: s.players?.name ?? "?",
  }));

  const [categoryValues, setCategoryValues] = useState<CategoryValues[]>(
    isCategories ? (match.rounds as CategoryValues[]).map((v) => ({ ...v })) : [],
  );

  const [scores, setScores] = useState<Record<string, number>>(() => {
    const obj: Record<string, number> = {};
    match.match_scores.forEach((s) => (obj[s.player_id] = s.score));
    return obj;
  });

  const computedTotals = useMemo(() => {
    if (isCategories && game?.calcTotal) {
      return players.map((_, i) => game.calcTotal!(categoryValues[i] ?? {}));
    }
    return players.map((p) => Number(scores[p.id] ?? 0) || 0);
  }, [isCategories, game, categoryValues, scores, players]);

  const winnerIdx = computedTotals.reduce((best, v, i) => (v > computedTotals[best] ? i : best), 0);

  const setCatValue = (playerIdx: number, key: string, value: string) => {
    setCategoryValues((prev) => {
      const next = prev.map((v) => ({ ...v }));
      if (value === "") {
        const { [key]: _, ...rest } = next[playerIdx] ?? {};
        next[playerIdx] = rest;
      } else {
        const n = Number(value);
        next[playerIdx] = { ...(next[playerIdx] ?? {}), [key]: Number.isFinite(n) ? n : undefined };
      }
      return next;
    });
  };

  function displayValue(v: CategoryValues, key: string): string {
    const val = v[key];
    return val === undefined ? "" : String(val);
  }

  const handleSave = async () => {
    if (isCategories && game) {
      const tempState = {
        players,
        rounds: [],
        categoryValues,
        started: true,
      };
      const err = validateGameState(tempState, game);
      if (err) {
        toast.error(err);
        return;
      }
    }
    for (const p of players) {
      const score = isCategories ? computedTotals[players.indexOf(p)] : (scores[p.id] ?? 0);
      if (score < 0) {
        toast.error(`El puntaje de ${p.name} no puede ser negativo`);
        return;
      }
    }
    setSaving(true);
    try {
      await save({
        data: {
          match_id: match.id,
          winner_id: players[winnerIdx].id,
          rounds: isCategories ? categoryValues : match.rounds,
          scores: players.map((p, i) => ({
            player_id: p.id,
            score: computedTotals[i],
          })),
        },
      });
      toast.success("Partida actualizada");
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar la partida");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border-2 border-primary/40 bg-background/80 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-primary text-sm">Editar partida</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 px-2">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {players.map((p, i) => (
        <div key={p.id} className="rounded-lg border border-border bg-card/60 p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 font-bold text-sm">
              {i === winnerIdx && <Trophy className="h-4 w-4 text-yellow-500" />}
              {p.name}
            </div>
            <div className="text-lg font-black text-primary">{computedTotals[i]}</div>
          </div>

          {isCategories && game?.categories ? (
            <div className="grid grid-cols-2 gap-1.5">
              {game.categories.map((cat) =>
                cat.kind === "number" ? (
                  <label key={cat.id} className="text-[11px] flex flex-col gap-0.5">
                    <span className="text-muted-foreground">{cat.label}</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={displayValue(categoryValues[i] ?? {}, cat.id)}
                      onChange={(e) => setCatValue(i, cat.id, e.target.value)}
                      className="h-8"
                    />
                  </label>
                ) : (
                  <div key={cat.id} className="col-span-2 grid grid-cols-2 gap-1.5">
                    <label className="text-[11px] flex flex-col gap-0.5">
                      <span className="text-muted-foreground">
                        {cat.label} · {cat.subLabels[0]}
                      </span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={displayValue(categoryValues[i] ?? {}, `${cat.id}_a`)}
                        onChange={(e) => setCatValue(i, `${cat.id}_a`, e.target.value)}
                        className="h-8"
                      />
                    </label>
                    <label className="text-[11px] flex flex-col gap-0.5">
                      <span className="text-muted-foreground">
                        {cat.label} · {cat.subLabels[1]}
                      </span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={displayValue(categoryValues[i] ?? {}, `${cat.id}_b`)}
                        onChange={(e) => setCatValue(i, `${cat.id}_b`, e.target.value)}
                        className="h-8"
                      />
                    </label>
                  </div>
                ),
              )}
            </div>
          ) : (
            <label className="text-[11px] flex flex-col gap-0.5">
              <span className="text-muted-foreground">Puntaje total</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={String(scores[p.id] ?? 0)}
                onChange={(e) =>
                  setScores((prev) => ({
                    ...prev,
                    [p.id]: e.target.value === "" ? 0 : Number(e.target.value),
                  }))
                }
                className="h-8"
              />
            </label>
          )}
        </div>
      ))}

      <Button onClick={handleSave} disabled={saving} className="w-full gap-1">
        <Save className="h-4 w-4" />
        {saving ? "Guardando…" : "Guardar cambios"}
      </Button>
    </div>
  );
}
