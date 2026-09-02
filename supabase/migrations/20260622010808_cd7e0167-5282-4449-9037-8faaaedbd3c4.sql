
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS is_coop BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE VIEW public.player_rankings AS
SELECT p.id AS player_id,
       p.name AS player_name,
       m.game_name,
       count(ms.id)::integer AS games_played,
       count(*) FILTER (WHERE ms.is_winner)::integer AS games_won,
       CASE
         WHEN count(ms.id) > 0
           THEN count(*) FILTER (WHERE ms.is_winner)::numeric / count(ms.id)::numeric
         ELSE 0::numeric
       END AS win_rate,
       COALESCE(max(ms.score), 0) AS max_score
FROM public.players p
LEFT JOIN public.match_scores ms ON ms.player_id = p.id
LEFT JOIN public.matches m ON m.id = ms.match_id AND m.is_coop = false
GROUP BY p.id, p.name, m.game_name;

GRANT SELECT ON public.player_rankings TO anon, authenticated, service_role;
