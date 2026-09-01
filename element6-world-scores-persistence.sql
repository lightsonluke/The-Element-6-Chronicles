-- Element 6 world leaderboard persistence for Parkour, Ziplining, Rock Climbing.
-- Run this once in Supabase SQL Editor. Safe to run repeatedly.
begin;

create table if not exists public.element6_world_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null default 'Player',
  mode text not null check (mode in ('parkour','rockclimb','zipline')),
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
  u uuid := auth.uid();
  n text;
  existing numeric;
  should_replace boolean;
  final_score numeric;
begin
  if u is null then raise exception 'Sign in first'; end if;
  if p_mode not in ('parkour','rockclimb','zipline') then raise exception 'Unknown leaderboard mode'; end if;
  if p_score is null or p_score < 0 then raise exception 'Invalid score'; end if;

  select coalesce(
    raw_user_meta_data->>'username',
    raw_user_meta_data->>'full_name',
    split_part(email,'@',1),
    'Player'
  ) into n
  from auth.users where id = u;

  select score into existing
  from public.element6_world_scores
  where user_id = u and mode = p_mode;

  should_replace := existing is null
    or (p_mode = 'rockclimb' and p_score < existing)
    or (p_mode <> 'rockclimb' and p_score > existing);

  if should_replace then
    insert into public.element6_world_scores(user_id, username, mode, score, score_meta, updated_at)
    values(u, coalesce(n,'Player'), p_mode, p_score, coalesce(p_meta,'{}'::jsonb), now())
    on conflict(user_id, mode) do update set
      username = excluded.username,
      score = excluded.score,
      score_meta = excluded.score_meta,
      updated_at = excluded.updated_at;
    final_score := p_score;
  else
    final_score := existing;
  end if;

  return jsonb_build_object(
    'updated', should_replace,
    'mode', p_mode,
    'score', final_score,
    'rank', (
      select count(*) + 1
      from public.element6_world_scores s
      where s.mode = p_mode
        and ((p_mode = 'rockclimb' and s.score < final_score)
          or (p_mode <> 'rockclimb' and s.score > final_score))
    )
  );
end;
$$;

grant execute on function public.submit_element6_world_score(text,numeric,jsonb) to authenticated;
commit;
