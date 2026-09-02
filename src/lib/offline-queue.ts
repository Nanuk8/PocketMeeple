import { supabase } from "@/integrations/supabase/client";

const KEY = "pending-matches-v1";

export type PendingMatch = {
  id: string; // local id
  created_at: number;
  payload: {
    game_name: string;
    players: { id: string; name: string }[];
    scores: number[];
    winner_id: string;
    winner_ids: string[];
    rounds: unknown;
    is_coop?: boolean;
    team_won?: boolean;
    game_modifiers?: Record<string, unknown>;
  };
};

export function readQueue(): PendingMatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingMatch[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: PendingMatch[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("pending-matches-changed"));
}

export function removeFromQueue(id: string) {
  writeQueue(readQueue().filter((p) => p.id !== id));
}

export function enqueueMatch(payload: PendingMatch["payload"]) {
  const items = readQueue();
  items.push({
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now() + Math.random()),
    created_at: Date.now(),
    payload,
  });
  writeQueue(items);
}

/**
 * Try to flush pending matches directly to Supabase (bypasses server fn so it
 * works without a session; matches/match_scores have public RLS in this app).
 * Returns number of successfully synced matches.
 */
export async function flushQueue(): Promise<number> {
  const items = readQueue();
  if (items.length === 0) return 0;
  const remaining: PendingMatch[] = [];
  let synced = 0;

  for (const item of items) {
    try {
      const { data: match, error: mErr } = await supabase
        .from("matches")
        .insert({
          game_name: item.payload.game_name,
          winner_id: item.payload.winner_id,
          rounds: item.payload.rounds as never,
          is_coop: item.payload.is_coop ?? false,
          game_modifiers: (item.payload.game_modifiers ?? {}) as never,
        })
        .select("id")
        .single();
      if (mErr || !match) throw mErr ?? new Error("insert match failed");

      const isCoop = item.payload.is_coop ?? false;
      const winners = new Set(item.payload.winner_ids);
      const rows = item.payload.players.map((p, i) => ({
        match_id: match.id,
        player_id: p.id,
        score: item.payload.scores[i],
        is_winner: isCoop ? !!item.payload.team_won : winners.has(p.id),
      }));
      const { error: sErr } = await supabase.from("match_scores").insert(rows);
      if (sErr) throw sErr;
      synced++;
    } catch (e) {
      console.warn("[offline-queue] sync failed, will retry", e);
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return synced;
}
