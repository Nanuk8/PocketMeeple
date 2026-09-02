import { supabase } from "@/integrations/supabase/client";
import type { GameState } from "@/games/types";

export type PausedSession = {
  sessionId: string;
  gameId: string;
  dateModified: number;
  playerNames: string[];
  gameState: GameState;
};

type Row = {
  id: string;
  game_id: string;
  players: string[];
  state: GameState;
  updated_at: string;
};

// supabase types are auto-generated and don't include paused_matches yet;
// cast to any to access the table without TS friction.
const tbl = () => (supabase as any).from("paused_matches");

function rowToSession(r: Row): PausedSession {
  return {
    sessionId: r.id,
    gameId: r.game_id,
    dateModified: new Date(r.updated_at).getTime(),
    playerNames: Array.isArray(r.players) ? r.players : [],
    gameState: r.state,
  };
}

export async function listSessionsForGame(gameId: string): Promise<PausedSession[]> {
  const { data, error } = await tbl()
    .select("id, game_id, players, state, updated_at")
    .eq("game_id", gameId)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[sessions] list error", error);
    return [];
  }
  return ((data as Row[]) ?? []).map(rowToSession);
}

export async function getSession(id: string): Promise<PausedSession | null> {
  const { data, error } = await tbl()
    .select("id, game_id, players, state, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToSession(data as Row);
}

export async function upsertSession(sess: PausedSession): Promise<void> {
  const payload = {
    id: sess.sessionId,
    game_id: sess.gameId,
    players: sess.playerNames,
    state: sess.gameState as unknown,
    updated_at: new Date().toISOString(),
  };
  const { error } = await tbl().upsert(payload, { onConflict: "id" });
  if (error) console.error("[sessions] upsert error", error);
}

export async function removeSession(id: string): Promise<void> {
  const { error } = await tbl().delete().eq("id", id);
  if (error) console.error("[sessions] delete error", error);
}

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
