-- Migración para reforzar la seguridad de RLS (Row Level Security)
-- Cambia las políticas públicas por unas que requieran estar autenticado.

-- public.players
DROP POLICY IF EXISTS "players readable" ON public.players;
DROP POLICY IF EXISTS "players insertable" ON public.players;
DROP POLICY IF EXISTS "players updatable" ON public.players;
DROP POLICY IF EXISTS "players deletable" ON public.players;

CREATE POLICY "players readable" ON public.players FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "players insertable" ON public.players FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "players updatable" ON public.players FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "players deletable" ON public.players FOR DELETE USING (auth.uid() IS NOT NULL);

-- public.matches
DROP POLICY IF EXISTS "matches are publicly readable" ON public.matches;
DROP POLICY IF EXISTS "anyone can insert matches" ON public.matches;
DROP POLICY IF EXISTS "matches readable" ON public.matches;
DROP POLICY IF EXISTS "matches insertable" ON public.matches;
DROP POLICY IF EXISTS "matches updatable" ON public.matches;
DROP POLICY IF EXISTS "matches deletable" ON public.matches;

CREATE POLICY "matches readable" ON public.matches FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "matches insertable" ON public.matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "matches updatable" ON public.matches FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "matches deletable" ON public.matches FOR DELETE USING (auth.uid() IS NOT NULL);

-- public.match_scores
DROP POLICY IF EXISTS "scores readable" ON public.match_scores;
DROP POLICY IF EXISTS "scores insertable" ON public.match_scores;
DROP POLICY IF EXISTS "scores updatable" ON public.match_scores;
DROP POLICY IF EXISTS "scores deletable" ON public.match_scores;

CREATE POLICY "scores readable" ON public.match_scores FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "scores insertable" ON public.match_scores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "scores updatable" ON public.match_scores FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "scores deletable" ON public.match_scores FOR DELETE USING (auth.uid() IS NOT NULL);

-- public.paused_matches
DROP POLICY IF EXISTS "paused_matches readable" ON public.paused_matches;
DROP POLICY IF EXISTS "paused_matches insertable" ON public.paused_matches;
DROP POLICY IF EXISTS "paused_matches updatable" ON public.paused_matches;
DROP POLICY IF EXISTS "paused_matches deletable" ON public.paused_matches;

CREATE POLICY "paused_matches readable" ON public.paused_matches FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "paused_matches insertable" ON public.paused_matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "paused_matches updatable" ON public.paused_matches FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "paused_matches deletable" ON public.paused_matches FOR DELETE USING (auth.uid() IS NOT NULL);
