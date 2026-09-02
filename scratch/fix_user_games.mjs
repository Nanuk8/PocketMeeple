import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres.ufwcavezofriijvrzomb:bFawRZdF4OmZ66y1@aws-0-us-west-2.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });
await client.connect();
const alterSql = 
  ALTER TABLE public.user_games ADD COLUMN IF NOT EXISTS year int;
  ALTER TABLE public.user_games ADD COLUMN IF NOT EXISTS min_players int;
  ALTER TABLE public.user_games ADD COLUMN IF NOT EXISTS max_players int;
  ALTER TABLE public.user_games ADD COLUMN IF NOT EXISTS is_curated boolean NOT NULL DEFAULT false;
  ALTER TABLE public.user_games ADD COLUMN IF NOT EXISTS added_at timestamptz NOT NULL DEFAULT now();
  ALTER TABLE public.user_games ADD UNIQUE (user_id, bgg_id);
  CREATE INDEX IF NOT EXISTS user_games_user_id_idx ON public.user_games(user_id);
  CREATE INDEX IF NOT EXISTS user_games_bgg_id_idx ON public.user_games(bgg_id);
  ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "user_games_select" ON public.user_games;
  DROP POLICY IF EXISTS "user_games_insert" ON public.user_games;
  DROP POLICY IF EXISTS "user_games_delete" ON public.user_games;
  CREATE POLICY "user_games_select" ON public.user_games FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "user_games_insert" ON public.user_games FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "user_games_delete" ON public.user_games FOR DELETE USING (auth.uid() = user_id);
  GRANT SELECT, INSERT, DELETE ON public.user_games TO authenticated;
  GRANT ALL ON public.user_games TO service_role;
;
try {
  await client.query(alterSql);
  console.log('user_games updated!');
} catch(e) {
  console.error('ERROR:', e.message);
} finally {
  await client.end();
}
