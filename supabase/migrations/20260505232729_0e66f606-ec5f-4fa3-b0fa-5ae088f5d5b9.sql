
-- Drop old view and table (no auth, public data)
DROP VIEW IF EXISTS public.player_rankings;
DROP TABLE IF EXISTS public.matches CASCADE;

-- Players table
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players readable" ON public.players FOR SELECT USING (true);
CREATE POLICY "players insertable" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "players updatable" ON public.players FOR UPDATE USING (true);
CREATE POLICY "players deletable" ON public.players FOR DELETE USING (true);

-- Matches table
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_name text NOT NULL,
  date timestamptz NOT NULL DEFAULT now(),
  winner_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  rounds jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches readable" ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches insertable" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "matches updatable" ON public.matches FOR UPDATE USING (true);
CREATE POLICY "matches deletable" ON public.matches FOR DELETE USING (true);

-- Match scores
CREATE TABLE public.match_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  score integer NOT NULL,
  is_winner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_match_scores_match ON public.match_scores(match_id);
CREATE INDEX idx_match_scores_player ON public.match_scores(player_id);
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores readable" ON public.match_scores FOR SELECT USING (true);
CREATE POLICY "scores insertable" ON public.match_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "scores updatable" ON public.match_scores FOR UPDATE USING (true);
CREATE POLICY "scores deletable" ON public.match_scores FOR DELETE USING (true);

-- Ranking view
CREATE VIEW public.player_rankings
WITH (security_invoker=on) AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  m.game_name,
  COUNT(ms.id)::int AS games_played,
  COUNT(*) FILTER (WHERE ms.is_winner)::int AS games_won,
  CASE WHEN COUNT(ms.id) > 0
    THEN (COUNT(*) FILTER (WHERE ms.is_winner)::numeric / COUNT(ms.id)::numeric)
    ELSE 0
  END AS win_rate,
  COALESCE(MAX(ms.score), 0)::int AS max_score
FROM public.players p
LEFT JOIN public.match_scores ms ON ms.player_id = p.id
LEFT JOIN public.matches m ON m.id = ms.match_id
GROUP BY p.id, p.name, m.game_name;
