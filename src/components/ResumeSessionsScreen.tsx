import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { Play, Plus, Trash2, Users, Clock, Save, CheckCircle2 } from "lucide-react";
import type { GameModule } from "@/games/types";
import { isGameComplete } from "@/games/types";
import type { PausedSession } from "@/lib/sessions";
import { getGameTheme } from "@/games/theme";

type Props = {
  game: GameModule;
  sessions: PausedSession[];
  onResume: (s: PausedSession) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onFinishAndSave: (s: PausedSession) => void;
  savingSessionId?: string | null;
  onBack: () => void;
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ResumeSessionsScreen({
  game,
  sessions,
  onResume,
  onNew,
  onDelete,
  onFinishAndSave,
  savingSessionId,
  onBack,
}: Props) {
  const theme = getGameTheme(game);
  return (
    <div className={`${theme.dark ? "dark" : ""} min-h-screen bg-slate-50`}>
      <AppLayout title={game.name} onBack={onBack} contentClassName="!p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Continuar partida en pausa</h2>
            <p className="text-xs text-slate-500 mt-1">
              Tienes {sessions.length} partida{sessions.length === 1 ? "" : "s"} pausada
              {sessions.length === 1 ? "" : "s"} de {game.name}.
            </p>
          </div>

          <ul className="space-y-2">
            {sessions.map((s) => {
              const complete = isGameComplete(s.gameState, game);
              const isSaving = savingSessionId === s.sessionId;
              return (
                <li
                  key={s.sessionId}
                  className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex items-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => onResume(s)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(s.dateModified)}
                      {complete && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Completa
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-slate-800">
                      <Users className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {s.playerNames.join(", ") || "Sin jugadores"}
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {complete && (
                      <Button
                        size="sm"
                        onClick={() => onFinishAndSave(s)}
                        disabled={isSaving}
                        className={`gap-1 ${theme.accentBg}`}
                      >
                        {isSaving ? (
                          "Guardando…"
                        ) : (
                          <>
                            <Save className="h-4 w-4" /> Finalizar
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 px-2"
                      onClick={() => onDelete(s.sessionId)}
                      aria-label="Eliminar partida pausada"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onResume(s)}
                      className={`gap-1 ${complete ? "border-current " + theme.accent : theme.accentBg}`}
                      variant={complete ? "outline" : "default"}
                    >
                      <Play className="h-4 w-4" /> Continuar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          <Button
            onClick={onNew}
            className={`w-full h-12 text-base font-black tracking-wide gap-2 ${theme.accentBg}`}
          >
            <Plus className="h-5 w-5" /> Iniciar nueva partida
          </Button>
        </div>
      </AppLayout>
    </div>
  );
}
