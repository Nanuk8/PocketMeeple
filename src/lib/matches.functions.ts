import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PlayerInput = z.object({ id: z.string().uuid(), name: z.string().min(1) });

const SaveSchema = z.object({
  game_name: z.string().min(1).max(64),
  players: z.array(PlayerInput).min(2).max(10),
  scores: z.array(z.number().int()),
  winner_id: z.string().uuid(),
  winner_ids: z.array(z.string().uuid()).min(1).max(10).optional(),
  rounds: z.any(),
  is_coop: z.boolean().optional(),
  team_won: z.boolean().optional(),
  game_modifiers: z.record(z.string(), z.any()).optional(),
});

export const saveMatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaveSchema.parse(input))
  .handler(async ({ data }) => {
    const { error: mErr, data: match } = await supabaseAdmin
      .from("matches")
      .insert({
        game_name: data.game_name,
        winner_id: data.winner_id,
        rounds: data.rounds,
        is_coop: data.is_coop ?? false,
        game_modifiers: data.game_modifiers ?? {},
      })
      .select("id")
      .single();
    if (mErr) throw new Error(mErr.message);

    const isCoop = data.is_coop ?? false;
    const winners = new Set<string>(data.winner_ids ?? [data.winner_id]);
    const rows = data.players.map((p, i) => ({
      match_id: match.id,
      player_id: p.id,
      score: data.scores[i],
      is_winner: isCoop ? !!data.team_won : winners.has(p.id),
    }));
    const { error: sErr } = await supabaseAdmin.from("match_scores").insert(rows);
    if (sErr) throw new Error(sErr.message);

    return { id: match.id };
  });

export const listMatches = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("matches")
    .select(
      "id, game_name, date, winner_id, rounds, is_coop, game_modifiers, match_scores(player_id, score, is_winner, players(name))",
    )
    .order("date", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listRankings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("player_rankings")
    .select("player_id, player_name, game_name, games_played, games_won, win_rate, max_score");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listPlayers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("players")
    .select("id, name, created_at, is_favorite")
    .order("is_favorite", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createPlayer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ name: z.string().trim().min(1).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("players")
      .insert({ name: data.name })
      .select("id, name, is_favorite")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const togglePlayerFavorite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), is_favorite: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("players")
      .update({ is_favorite: data.is_favorite })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePlayer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("players").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listGameNames = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("matches").select("game_name");
  if (error) throw new Error(error.message);
  const set = new Set<string>();
  (data ?? []).forEach((r: { game_name: string }) => set.add(r.game_name));
  return Array.from(set).sort();
});

const UpdateSchema = z.object({
  match_id: z.string().uuid(),
  winner_id: z.string().uuid(),
  winner_ids: z.array(z.string().uuid()).min(1).max(10).optional(),
  rounds: z.any(),
  scores: z
    .array(
      z.object({
        player_id: z.string().uuid(),
        score: z.number().int(),
      }),
    )
    .min(2)
    .max(10),
});

export const updateMatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => UpdateSchema.parse(input))
  .handler(async ({ data }) => {
    const { error: mErr } = await supabaseAdmin
      .from("matches")
      .update({ winner_id: data.winner_id, rounds: data.rounds })
      .eq("id", data.match_id);
    if (mErr) throw new Error(mErr.message);

    const { error: delErr } = await supabaseAdmin
      .from("match_scores")
      .delete()
      .eq("match_id", data.match_id);
    if (delErr) throw new Error(delErr.message);

    const winners = new Set<string>(data.winner_ids ?? [data.winner_id]);
    const rows = data.scores.map((s) => ({
      match_id: data.match_id,
      player_id: s.player_id,
      score: s.score,
      is_winner: winners.has(s.player_id),
    }));
    const { error: insErr } = await supabaseAdmin.from("match_scores").insert(rows);
    if (insErr) throw new Error(insErr.message);

    return { ok: true };
  });

export const deleteMatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { error: sErr } = await supabaseAdmin
      .from("match_scores")
      .delete()
      .eq("match_id", data.id);
    if (sErr) throw new Error(sErr.message);
    const { error } = await supabaseAdmin.from("matches").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
