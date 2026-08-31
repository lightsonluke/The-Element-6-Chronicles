-- ELEMENT 6 WORLD SCORES FIX
-- Fixes the server RPC used by Parkour, Ziplining and Rock Climbing.
-- Run this ONCE in Supabase SQL Editor.

begin;

create table if not exists public.element6_world_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null default 'Player',
  mode text not null check (mode in ('parkour','rockclimb','zipline','honored_bot')),
  score numeric not null default 0,
  score_meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, mode)
);

alter table public.element6_world_scores enable row level security;

drop policy if exists element6_world_scores_read on public.element6_world_scores;
create policy element6_world_scores_read
on public.element6_world_scores
for select to authenticated
using (true);

-- IMPORTANT: auth.users does NOT have a username column.
-- The old RPC referenced username directly and therefore failed before
-- writing the score. Use player_profiles first, then auth metadata/email.
create or replace function public.submit_element6_world_score(
  p_mode text,
  p_score numeric,
  p_meta jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_username text;
  v_existing numeric;
  v_should_replace boolean;
  v_rank bigint;
begin
  if v_user is null then
    raise exception 'Sign in first';
  end if;

  if p_mode not in ('parkour','rockclimb','zipline','honored_bot') then
    raise exception 'Unknown leaderboard mode';
  end if;

  -- Prefer the game's public username, then Supabase auth metadata.
  select coalesce(
    nullif(trim(pp.username), ''),
    nullif(trim(au.raw_user_meta_data->>'username'), ''),
    nullif(trim(au.raw_user_meta_data->>'full_name'), ''),
    nullif(split_part(au.email, '@', 1), ''),
    'Player'
  )
  into v_username
  from auth.users au
  left join public.player_profiles pp on pp.user_id = au.id
  where au.id = v_user;

  v_username := coalesce(v_username, 'Player');

  select score
  into v_existing
  from public.element6_world_scores
  where user_id = v_user
    and mode = p_mode;

  -- Parkour + Ziplining: highest distance wins.
  -- Rock Climbing: lowest completion time wins.
  v_should_replace :=
    v_existing is null
    or (p_mode = 'rockclimb' and p_score < v_existing)
    or (p_mode <> 'rockclimb' and p_score > v_existing);

  if v_should_replace then
    insert into public.element6_world_scores
      (user_id, username, mode, score, score_meta, updated_at)
    values
      (v_user, v_username, p_mode, p_score, coalesce(p_meta, '{}'::jsonb), now())
    on conflict (user_id, mode)
    do update set
      username = excluded.username,
      score = excluded.score,
      score_meta = excluded.score_meta,
      updated_at = now();
  end if;

  -- Rank the player's resulting personal best.
  select count(*) + 1
  into v_rank
  from public.element6_world_scores s
  where s.mode = p_mode
    and (
      (p_mode = 'rockclimb' and s.score < coalesce(
        (select score from public.element6_world_scores where user_id = v_user and mode = p_mode), p_score
      ))
      or
      (p_mode <> 'rockclimb' and s.score > coalesce(
        (select score from public.element6_world_scores where user_id = v_user and mode = p_mode), p_score
      ))
    );

  return jsonb_build_object(
    'updated', v_should_replace,
    'mode', p_mode,
    'score', coalesce(
      (select score from public.element6_world_scores where user_id = v_user and mode = p_mode),
      p_score
    ),
    'rank', coalesce(v_rank, 1),
    'user_id', v_user
  );
end;
$$;

grant execute on function public.submit_element6_world_score(text, numeric, jsonb)
to authenticated;

commit;
