import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listRankings } from "@/lib/matches.functions";
import { Trophy, Medal, Award } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/rankings")({
  head: () => ({ meta: [{ title: "Ranking · Marcador" }] }),
  component: RankingsPage,
});

type Row = {
  player_id: string | null;
  player_name: string | null;
  game_name: string | null;
  games_played: number | null;
  games_won: number | null;
  win_rate: number | null;
  max_score: number | null;
};

const ALL = "__all__";

function RankingsPage() {
  const fn = useServerFn(listRankings);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>(ALL);

  useEffect(() => {
    fn()
      .then((d) => setRows(d as Row[]))
      .catch((e) => setError(e.message ?? "Error"));
  }, [fn]);

  const games = useMemo(() => {
    const set = new Set<string>();
    (rows ?? []).forEach((r) => r.game_name && set.add(r.game_name));
    return Array.from(set).sort();
  }, [rows]);

  const aggregated = useMemo(() => {
    if (!rows) return [];
    const filtered = filter === ALL ? rows : rows.filter((r) => r.game_name === filter);
    const map = new Map<string, { name: string; played: number; won: number; max: number }>();
    for (const r of filtered) {
      if (!r.player_id || !r.player_name) continue;
      const cur = map.get(r.player_id) ?? { name: r.player_name, played: 0, won: 0, max: 0 };
      cur.played += r.games_played ?? 0;
      cur.won += r.games_won ?? 0;
      cur.max = Math.max(cur.max, r.max_score ?? 0);
      map.set(r.player_id, cur);
    }
    return Array.from(map.values())
      .map((p) => ({ ...p, winRate: p.played > 0 ? p.won / p.played : 0 }))
      .sort((a, b) => b.won - a.won || b.winRate - a.winRate || b.max - a.max);
  }, [rows, filter]);

  return (
    <AppLayout title="Ranking">
      <div className="mb-4 flex justify-end">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los juegos</SelectItem>
            {games.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-destructive">{error}</p>}
      {!rows && !error && <p className="text-slate-500">Cargando…</p>}
      {rows && aggregated.length === 0 && (
        <p className="text-slate-500 text-sm">Sin datos de ranking aún.</p>
      )}
      {aggregated.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-slate-500 font-semibold uppercase text-xs">
                <th className="px-3 py-2.5 text-left">#</th>
                <th className="px-2 py-2.5 text-left">Jugador</th>
                <th className="px-1 py-2.5 text-center">PJ</th>
                <th className="px-1 py-2.5 text-center">PG</th>
                <th className="px-1 py-2.5 text-center">WR</th>
                <th className="px-2 py-2.5 text-center">Mejor</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.map((r, i) => {
                const medal =
                  i === 0 ? (
                    <Trophy className="inline h-4 w-4 text-amber-500" />
                  ) : i === 1 ? (
                    <Medal className="inline h-4 w-4 text-slate-400" />
                  ) : i === 2 ? (
                    <Award className="inline h-4 w-4 text-orange-500" />
                  ) : (
                    <span className="text-slate-400 font-semibold">{i + 1}</span>
                  );
                return (
                  <tr key={r.name} className="bg-white border-b border-slate-50 last:border-b-0">
                    <td className="px-3 py-2.5">{medal}</td>
                    <td className="px-2 py-2.5 font-medium text-slate-800 truncate max-w-[110px]">
                      {r.name}
                    </td>
                    <td className="px-1 py-2.5 text-center text-slate-600">{r.played}</td>
                    <td className="px-1 py-2.5 text-center text-slate-800 font-medium">{r.won}</td>
                    <td className="px-1 py-2.5 text-center text-slate-600">
                      {Math.round(r.winRate * 100)}%
                    </td>
                    <td className="px-2 py-2.5 text-center font-semibold text-slate-800">
                      {r.max}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
