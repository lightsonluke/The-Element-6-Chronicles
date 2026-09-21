-- Element 6 leaderboard fix - compatible with the actual Element 6 schema.
-- The existing shared_leaderboard table uses ranked_elo, NOT ranked_rating.
-- Run this instead of the previous Supabase-all-leaderboards-fix.sql.

begin;

-- shared_leaderboard is created by Shared-leaderboard-setup.sql.
-- Do not assume the newer/incorrect ranked_rating column exists.
create index if not exists element6_shared_leaderboard_total_xp_idx
  on public.shared_leaderboard(total_xp desc);

create index if not exists element6_shared_leaderboard_elo_idx
  on public.shared_leaderboard(ranked_elo desc);

alter table public.shared_leaderboard enable row level security;

drop policy if exists element6_shared_leaderboard_read on public.shared_leaderboard;
create policy element6_shared_leaderboard_read
  on public.shared_leaderboard
  for select to authenticated
  using (true);

-- The real schema stores ranked ELO in ranked_ratings.rating and mirrors it
-- into shared_leaderboard.ranked_elo. Sport ratings live in online_sport_ratings.
-- This RPC exposes stable leaderboard field names to the client without
-- requiring nonexistent shared_leaderboard columns.
create or replace function public.element6_get_global_leaderboard(
  p_limit integer default 100
)
returns table(
  rank integer,
  user_id uuid,
  username text,
  total_xp bigint,
  ranked_rating integer,
  soccer_rating integer,
  volleyball_rating integer,
  dodgeball_rating integer
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      s.user_id,
      s.username,
      coalesce(s.total_xp, 0)::bigint as total_xp,
      coalesce(rr.rating, s.ranked_elo, 1000)::integer as ranked_rating,
      coalesce(sr.rating, 1000)::integer as soccer_rating,
      coalesce(vr.rating, 1000)::integer as volleyball_rating,
      coalesce(dr.rating, 1000)::integer as dodgeball_rating
    from public.shared_leaderboard s
    left join public.ranked_ratings rr
      on rr.user_id = s.user_id
    left join public.online_sport_ratings sr
      on sr.user_id = s.user_id
      and sr.mode = 'soccer_ranked'
    left join public.online_sport_ratings vr
      on vr.user_id = s.user_id
      and vr.mode = 'volleyball_1v1_ranked'
    left join public.online_sport_ratings dr
      on dr.user_id = s.user_id
      and dr.mode = 'dodgeball_ranked'
  )
  select
    row_number() over (
      order by total_xp desc, ranked_rating desc, user_id
    )::integer as rank,
    user_id,
    username,
    total_xp,
    ranked_rating,
    soccer_rating,
    volleyball_rating,
    dodgeball_rating
  from base
  order by total_xp desc, ranked_rating desc, user_id
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

revoke all on function public.element6_get_global_leaderboard(integer)
  from public, anon;
grant execute on function public.element6_get_global_leaderboard(integer)
  to authenticated;

commit;
