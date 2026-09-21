-- ELEMENT 6: fix Top 100 ELO leaderboard
-- Paste this entire file into Supabase SQL Editor and press Run.
-- Safe to run more than once.

begin;

create or replace function public.get_element6_elo_leaderboard(
  p_mode text,
  p_username text default null
)
returns table(
  rank_position bigint,
  user_id uuid,
  username text,
  rating integer,
  wins integer,
  losses integer,
  matches_played integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_mode not in ('ranked', 'soccer_ranked', 'volleyball_1v1_ranked', 'dodgeball_ranked') then
    raise exception 'Unsupported leaderboard mode';
  end if;

  return query
  with rating_source as (
    select
      rr.user_id as source_user_id,
      coalesce(pp.username, 'Player') as source_username,
      greatest(0, least(4000, coalesce(rr.rating, 1000))) as source_rating,
      coalesce(rr.wins, 0) as source_wins,
      coalesce(rr.losses, 0) as source_losses,
      coalesce(rr.matches_played, coalesce(rr.wins, 0) + coalesce(rr.losses, 0)) as source_matches
    from public.ranked_ratings rr
    left join public.player_profiles pp on pp.user_id = rr.user_id
    where p_mode = 'ranked'

    union all

    select
      osr.user_id as source_user_id,
      coalesce(pp.username, 'Player') as source_username,
      greatest(0, least(4000, coalesce(osr.rating, 1000))) as source_rating,
      coalesce(osr.wins, 0) as source_wins,
      coalesce(osr.losses, 0) as source_losses,
      coalesce(osr.matches_played, coalesce(osr.wins, 0) + coalesce(osr.losses, 0)) as source_matches
    from public.online_sport_ratings osr
    left join public.player_profiles pp on pp.user_id = osr.user_id
    where p_mode <> 'ranked' and osr.mode = p_mode
  ), ranked_rows as (
    select
      rank() over (order by rs.source_rating desc, rs.source_wins desc, rs.source_user_id) as row_rank,
      rs.source_user_id,
      rs.source_username,
      rs.source_rating,
      rs.source_wins,
      rs.source_losses,
      rs.source_matches
    from rating_source rs
  )
  select
    ranked_rows.row_rank,
    ranked_rows.source_user_id,
    ranked_rows.source_username,
    ranked_rows.source_rating,
    ranked_rows.source_wins,
    ranked_rows.source_losses,
    ranked_rows.source_matches
  from ranked_rows
  where ranked_rows.row_rank <= 100
     or (p_username is not null and lower(ranked_rows.source_username) = lower(trim(p_username)))
  order by ranked_rows.row_rank, ranked_rows.source_username;
end;
$$;

revoke all on function public.get_element6_elo_leaderboard(text, text) from public, anon;
grant execute on function public.get_element6_elo_leaderboard(text, text) to authenticated;

commit;
