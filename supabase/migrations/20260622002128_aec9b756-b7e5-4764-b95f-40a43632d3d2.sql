CREATE TABLE public.paused_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id TEXT NOT NULL,
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX paused_matches_game_id_idx ON public.paused_matches(game_id);
CREATE INDEX paused_matches_updated_at_idx ON public.paused_matches(updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.paused_matches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paused_matches TO authenticated;
GRANT ALL ON public.paused_matches TO service_role;

ALTER TABLE public.paused_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paused_matches readable" ON public.paused_matches FOR SELECT USING (true);
CREATE POLICY "paused_matches insertable" ON public.paused_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "paused_matches updatable" ON public.paused_matches FOR UPDATE USING (true);
CREATE POLICY "paused_matches deletable" ON public.paused_matches FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.touch_paused_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER paused_matches_set_updated_at
BEFORE UPDATE ON public.paused_matches
FOR EACH ROW EXECUTE FUNCTION public.touch_paused_matches_updated_at();