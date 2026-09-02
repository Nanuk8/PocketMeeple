import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMatches, deleteMatch } from "@/lib/matches.functions";
import {
  Trophy,
  Pencil,
  Trash2,
  CloudOff,
  CheckCircle2,
  RefreshCw,
  Users,
  Smile,
  Frown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatchEditor, type EditableMatch } from "@/components/MatchEditor";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { readQueue, removeFromQueue, flushQueue, type PendingMatch } from "@/lib/offline-queue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Historial · Marcador" }] }),
  component: HistoryPage,
});

function CoopTeamStats({ items }: { items: Match[] }) {
  // Group by game_name + sorted player-name combination
  type Group = {
    gameName: string;
    names: string[];
    played: number;
    won: number;
  };
  const groups = new Map<string, Group>();
  for (const m of items) {
    const names = m.match_scores
      .map((s) => s.players?.name ?? "?")
      .slice()
      .sort((a, b) => a.localeCompare(b));
    const key = `${m.game_name}::${names.join("|")}`;
    const g = groups.get(key) ?? { gameName: m.game_name, names, played: 0, won: 0 };
    g.played += 1;
    if (m.match_scores[0]?.is_winner) g.won += 1;
    groups.set(key, g);
  }
  const list = Array.from(groups.values()).sort((a, b) => b.played - a.played || b.won - a.won);
  if (list.length === 0) return null;
  return (
    <div className="mb-3">
      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1 mb-2">
        <Users className="h-3.5 w-3.5" />
        Estadísticas por equipo (Coop)
      </h2>
      <ul className="space-y-2">
        {list.map((g, i) => {
          const lost = g.played - g.won;
          return (
            <li key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {g.gameName}
              </div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                Equipo: {g.names.join(", ")}
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  Partidas: <span className="font-black text-slate-800">{g.played}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <Smile className="h-3 w-3" /> Victorias:{" "}
                  <span className="font-black">{g.won}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-red-700">
                  <Frown className="h-3 w-3" /> Derrotas: <span className="font-black">{lost}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type ScoreRow = {
  player_id: string;
  score: number;
  is_winner: boolean;
  players: { name: string } | null;
};
type Match = {
  id: string;
  game_name: string;
  date: string;
  winner_id: string | null;
  rounds: unknown;
  is_coop?: boolean;
  game_modifiers?: {
    used_cards?: string[];
    desafios_usados?: number[];
    ayudas_usadas?: number[];
    dificultades_usadas?: number[];
  } | null;
  match_scores: ScoreRow[];
};

function HistoryPage() {
  const fn = useServerFn(listMatches);
  const del = useServerFn(deleteMatch);
  const [items, setItems] = useState<Match[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pending, setPending] = useState<PendingMatch[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [deletingPendingId, setDeletingPendingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fn()
      .then((d) => setItems(d as unknown as Match[]))
      .catch((e) => setError(e.message ?? "Error"));
  }, [fn]);

  const refreshPending = useCallback(() => setPending(readQueue()), []);

  useEffect(() => {
    refresh();
    refreshPending();
    const onChange = () => {
      refreshPending();
      refresh();
    };
    window.addEventListener("pending-matches-changed", onChange);
    return () => window.removeEventListener("pending-matches-changed", onChange);
  }, [refresh, refreshPending]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const n = await flushQueue();
      if (n > 0) toast.success(`Se sincronizaron ${n} partida(s)`);
      else toast.info("No se pudo sincronizar. Revisa tu conexión.");
    } finally {
      setSyncing(false);
      refreshPending();
      refresh();
    }
  };

  const handleDeletePending = (id: string) => {
    removeFromQueue(id);
    setDeletingPendingId(null);
    toast.success("Partida pendiente descartada");
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await del({ data: { id } });
      toast.success("Partida eliminada · Ranking recalculado");
      if (editingId === id) setEditingId(null);
      setDeletingId(null);
      refresh();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Historial">
      {error && <p className="text-destructive">{error}</p>}
      {!items && !error && pending.length === 0 && <p className="text-slate-500">Cargando…</p>}

      {pending.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wide text-amber-700 flex items-center gap-1">
              <CloudOff className="h-3.5 w-3.5" />
              Pendientes de sincronización ({pending.length})
            </h2>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 border-amber-500 text-amber-800"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
          </div>
          <ul className="space-y-2">
            {pending.map((p) => {
              const winners = new Set(p.payload.winner_ids);
              const ranked = p.payload.players
                .map((pl, i) => ({
                  id: pl.id,
                  name: pl.name,
                  score: p.payload.scores[i] ?? 0,
                  win: winners.has(pl.id),
                }))
                .sort((a, b) => b.score - a.score);
              const top = ranked[0];
              return (
                <li
                  key={p.id}
                  className="rounded-xl border-2 border-amber-500/60 bg-amber-50 p-3 shadow"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-black text-amber-900 flex items-center gap-2">
                      {p.payload.game_name}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-amber-500 text-amber-950 px-1.5 py-0.5 rounded">
                        <CloudOff className="h-3 w-3" /> Pendiente
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-700">
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 rounded-lg bg-white/70 border border-amber-300 px-2 py-1.5 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-xs text-amber-800">
                      {winners.size > 1 ? "Empate:" : "Ganador:"}
                    </span>
                    <span className="font-black text-amber-900 flex-1 truncate">
                      {ranked
                        .filter((r) => r.win)
                        .map((r) => r.name)
                        .join(", ") || top?.name}
                    </span>
                    <span className="font-black text-amber-900">{top?.score} pts</span>
                  </div>
                  <ol className="mt-2 space-y-1">
                    {ranked.map((r, i) => (
                      <li
                        key={r.id}
                        className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm ${
                          r.win ? "bg-amber-200/70 font-bold" : "bg-white/40"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="w-6 text-center">
                            {["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`}
                          </span>
                          <span className="truncate">{r.name}</span>
                        </span>
                        <span className="font-black tabular-nums">{r.score}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-full gap-1 text-destructive hover:text-destructive"
                      onClick={() => setDeletingPendingId(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Descartar sin sincronizar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {pending.length > 0 && items && items.length > 0 && (
        <h2 className="text-xs font-bold uppercase tracking-wide text-emerald-700 flex items-center gap-1 mb-2">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Sincronizadas
        </h2>
      )}

      {items && items.some((m) => m.is_coop) && (
        <CoopTeamStats items={items.filter((m) => m.is_coop)} />
      )}

      {items && items.length === 0 && (
        <p className="text-slate-500">Aún no hay partidas guardadas.</p>
      )}
      <ul className="space-y-2">
        {items?.map((m) => {
          const sorted = [...m.match_scores].sort((a, b) => b.score - a.score);
          const winner = sorted.find((s) => s.is_winner) ?? sorted[0];
          if (m.is_coop) {
            const teamWon = m.match_scores[0]?.is_winner ?? false;
            const usedCards = m.game_modifiers?.used_cards ?? [];
            const desafios =
              m.game_modifiers?.desafios_usados ?? m.game_modifiers?.dificultades_usadas ?? [];
            const ayudas = m.game_modifiers?.ayudas_usadas ?? [];
            const hasModNums = desafios.length > 0 || ayudas.length > 0;
            return (
              <li
                key={m.id}
                className={`rounded-xl border-2 p-3 shadow ${
                  teamWon ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-black text-slate-800 flex items-center gap-2">
                    {m.game_name}
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-slate-800 text-white px-1.5 py-0.5 rounded">
                      <Users className="h-3 w-3" /> Coop
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(m.date).toLocaleString()}
                  </div>
                </div>
                <div
                  className={`mt-2 rounded-lg px-2 py-1.5 flex items-center gap-2 ${
                    teamWon
                      ? "bg-white border border-emerald-300"
                      : "bg-white border border-red-200"
                  }`}
                >
                  {teamWon ? (
                    <Smile className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Frown className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <span className="text-xs text-slate-600">Equipo:</span>
                  <span className="font-bold text-slate-800 flex-1 truncate">
                    {m.match_scores.map((s) => s.players?.name ?? "?").join(", ")}
                  </span>
                  <span
                    className={`font-black text-sm ${
                      teamWon ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {teamWon ? "¡Ganaron!" : "Perdieron"}
                  </span>
                </div>
                {hasModNums && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-700">
                    {desafios.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden>⚙️</span>
                        <span className="text-slate-500">Desafíos:</span>
                        <span className="font-black text-slate-800">{desafios.join(", ")}</span>
                      </span>
                    )}
                    {ayudas.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden>🛡️</span>
                        <span className="text-slate-500">Ayudas:</span>
                        <span className="font-black text-slate-800">{ayudas.join(", ")}</span>
                      </span>
                    )}
                  </div>
                )}
                {!hasModNums && usedCards.length > 0 && (
                  <div className="mt-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Cartas avanzadas
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {usedCards.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-white border border-slate-300 text-slate-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 gap-1 text-destructive hover:text-destructive"
                    onClick={() => setDeletingId(m.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Descartar
                  </Button>
                </div>
              </li>
            );
          }
          return (
            <li
              key={m.id}
              className="rounded-xl border-2 border-primary/40 p-3 shadow"
              style={{ background: "var(--gradient-parchment)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-black text-primary flex items-center gap-2">
                  {m.game_name}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="h-3 w-3" /> Sincronizada
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(m.date).toLocaleString()}
                </div>
              </div>
              <div className="mt-2 rounded-lg bg-yellow-100/60 border border-yellow-500/40 px-2 py-1.5 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-600 shrink-0" />
                <span className="text-xs text-muted-foreground">Ganador:</span>
                <span className="font-black text-primary flex-1 truncate">
                  {winner?.players?.name ?? "—"}
                </span>
                {winner && <span className="font-black text-primary">{winner.score} pts</span>}
              </div>
              <ol className="mt-2 space-y-1">
                {sorted.map((s, i) => {
                  const medal = ["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`;
                  return (
                    <li
                      key={s.player_id}
                      className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm ${
                        i === 0 ? "bg-primary/10 font-bold" : "bg-background/40"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="w-6 text-center">{medal}</span>
                        <span className="truncate">{s.players?.name ?? "?"}</span>
                      </span>
                      <span className="font-black tabular-nums">{s.score}</span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 gap-1"
                  onClick={() => setEditingId(editingId === m.id ? null : m.id)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {editingId === m.id ? "Cancelar" : "Editar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-destructive hover:text-destructive"
                  onClick={() => setDeletingId(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Descartar
                </Button>
              </div>
              {editingId === m.id && (
                <MatchEditor
                  match={m as EditableMatch}
                  onClose={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    refresh();
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
      <AlertDialog open={deletingId !== null} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta partida permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto recalculará los puntajes del Ranking Global y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                if (deletingId) handleDelete(deletingId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={deletingPendingId !== null}
        onOpenChange={(o) => !o && setDeletingPendingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar partida pendiente?</AlertDialogTitle>
          </AlertDialogHeader>
          {(() => {
            const p = pending.find((x) => x.id === deletingPendingId);
            if (!p) return null;
            const winners = new Set(p.payload.winner_ids);
            const ranked = p.payload.players
              .map((pl, i) => ({
                id: pl.id,
                name: pl.name,
                score: p.payload.scores[i] ?? 0,
                win: winners.has(pl.id),
              }))
              .sort((a, b) => b.score - a.score);
            const top = ranked[0];
            return (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-amber-900">{p.payload.game_name}</span>
                  <span className="text-[10px] text-amber-700">
                    {new Date(p.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-white/70 px-2 py-1.5">
                  <Trophy className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-800">
                    {winners.size > 1 ? "Empate:" : "Ganador:"}
                  </span>
                  <span className="font-black text-amber-900 flex-1 truncate">
                    {ranked
                      .filter((r) => r.win)
                      .map((r) => r.name)
                      .join(", ") || top?.name}
                  </span>
                  <span className="font-black text-amber-900">{top?.score} pts</span>
                </div>
                <p className="text-xs text-amber-800">
                  Aún no se ha sincronizado con el servidor. Si la descartas, los puntajes se
                  perderán permanentemente.
                </p>
              </div>
            );
          })()}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPendingId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deletingPendingId) handleDeletePending(deletingPendingId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
