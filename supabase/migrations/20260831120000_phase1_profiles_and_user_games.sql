-- Fase 1: Perfiles de usuario y coleccion de juegos
-- Ejecutar despues de las migraciones anteriores

-- ─── TABLA: profiles ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text UNIQUE,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger: crear perfil automaticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_profiles_updated_at();

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (username, display_name, avatar_url) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;


-- ─── TABLA: user_games ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_games (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bgg_id        text NOT NULL,
  name          text NOT NULL,
  image_url     text,
  year          int,
  min_players   int,
  max_players   int,
  is_curated    boolean NOT NULL DEFAULT false,
  added_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, bgg_id)
);

CREATE INDEX IF NOT EXISTS user_games_user_id_idx ON public.user_games(user_id);
CREATE INDEX IF NOT EXISTS user_games_bgg_id_idx  ON public.user_games(bgg_id);

ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_games_select" ON public.user_games
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_games_insert" ON public.user_games
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_games_delete" ON public.user_games
  FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.user_games TO authenticated;
GRANT ALL ON public.user_games TO service_role;
