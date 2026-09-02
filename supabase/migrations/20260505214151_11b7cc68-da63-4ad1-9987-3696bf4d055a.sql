
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  played_at timestamptz not null default now(),
  players jsonb not null,
  final_scores jsonb not null,
  winner text not null,
  rounds jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists matches_game_id_idx on public.matches(game_id);
create index if not exists matches_played_at_idx on public.matches(played_at desc);

alter table public.matches enable row level security;

drop policy if exists "matches are publicly readable" on public.matches;
drop policy if exists "anyone can insert matches" on public.matches;

create policy "matches are publicly readable"
  on public.matches for select
  using (true);

create policy "anyone can insert matches"
  on public.matches for insert
  with check (true);

create or replace view public.player_rankings
with (security_invoker = on) as
with expanded as (
  select
    m.id,
    m.game_id,
    m.winner,
    p.player_name,
    (m.final_scores ->> (p.idx)::int)::numeric as score
  from public.matches m
  cross join lateral (
    select
      (ord - 1)::int as idx,
      value #>> '{}' as player_name
    from jsonb_array_elements(m.players) with ordinality as t(value, ord)
  ) p
)
select
  player_name,
  game_id,
  count(*)::int as games_played,
  count(*) filter (where player_name = winner)::int as games_won,
  case when count(*) > 0
    then round(count(*) filter (where player_name = winner)::numeric / count(*)::numeric, 4)
    else 0
  end as win_rate,
  max(score)::int as max_score
from expanded
group by player_name, game_id;
