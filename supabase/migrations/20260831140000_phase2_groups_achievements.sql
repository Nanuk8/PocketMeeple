-- Groups
CREATE TABLE IF NOT EXISTS public.groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS groups_owner_id_idx ON public.groups(owner_id);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_select" ON public.groups;
DROP POLICY IF EXISTS "groups_insert" ON public.groups;
DROP POLICY IF EXISTS "groups_update" ON public.groups;
DROP POLICY IF EXISTS "groups_delete" ON public.groups;
CREATE POLICY "groups_select" ON public.groups FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "groups_insert" ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "groups_update" ON public.groups FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "groups_delete" ON public.groups FOR DELETE USING (auth.uid() = owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;

-- Group Members
CREATE TABLE IF NOT EXISTS public.group_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  player_id  uuid REFERENCES public.players(id) ON DELETE CASCADE,
  name       text,
  added_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_members_player_or_name CHECK (
    (player_id IS NOT NULL AND name IS NULL) OR
    (player_id IS NULL AND name IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_player_id_idx ON public.group_members(player_id);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
DROP POLICY IF EXISTS "group_members_insert" ON public.group_members;
DROP POLICY IF EXISTS "group_members_delete" ON public.group_members;
CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid()));
CREATE POLICY "group_members_insert" ON public.group_members
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid()));
CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid()));
GRANT SELECT, INSERT, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;

-- Game Templates
CREATE TABLE IF NOT EXISTS public.game_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bgg_id     text,
  name       text NOT NULL,
  config     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS game_templates_user_id_idx ON public.game_templates(user_id);
CREATE INDEX IF NOT EXISTS game_templates_bgg_id_idx  ON public.game_templates(bgg_id);
ALTER TABLE public.game_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "game_templates_select" ON public.game_templates;
DROP POLICY IF EXISTS "game_templates_insert" ON public.game_templates;
DROP POLICY IF EXISTS "game_templates_update" ON public.game_templates;
DROP POLICY IF EXISTS "game_templates_delete" ON public.game_templates;
CREATE POLICY "game_templates_select" ON public.game_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "game_templates_insert" ON public.game_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "game_templates_update" ON public.game_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "game_templates_delete" ON public.game_templates FOR DELETE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_templates TO authenticated;
GRANT ALL ON public.game_templates TO service_role;

-- Achievements Catalog
CREATE TABLE IF NOT EXISTS public.achievements (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL,
  icon        text NOT NULL DEFAULT 'trophy',
  tier        text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold'))
);
GRANT SELECT ON public.achievements TO authenticated, anon;
GRANT ALL ON public.achievements TO service_role;

-- User Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS user_achievements_user_idx ON public.user_achievements(user_id);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_achievements_select" ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements_insert" ON public.user_achievements;
CREATE POLICY "user_achievements_select" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_achievements_insert" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;

-- Seed
INSERT INTO public.achievements (id, name, description, icon, tier) VALUES
  ('first-win',    'Primera Victoria',        'Gana tu primera partida',                         'trophy',  'bronze'),
  ('ten-wins',     'Veterano de Mesa',         'Gana 10 partidas en total',                        'medal',   'silver'),
  ('fifty-games',  'Centenario',               'Juega 50 partidas en total',                       'star',    'gold'),
  ('hot-streak',   'En Llamas',               'Consigue 3 victorias consecutivas',               'flame',   'silver'),
  ('skull-master', 'Rey de los Piratas',        'Gana 5 partidas de Skull King',                   'skull',   'gold'),
  ('collector',    'Coleccionista',            'Agrega 10 juegos a tu ludoteca desde BGG',        'library', 'silver'),
  ('social',       'Anfitrión',               'Crea un grupo con 3 o más miembros',              'users',   'bronze'),
  ('first-game',   'Primera Partida',          'Registra tu primera partida en Ludiscore',        'gamepad', 'bronze')
ON CONFLICT (id) DO NOTHING;