-- Element 6 leaderboard hardening.
-- Run after the existing leaderboard/online Elo migrations.

create index if not exists element6_shared_leaderboard_total_xp_idx on public.shared_leaderboard(total_xp desc);
create index if not exists element6_shared_leaderboard_rating_idx on public.shared_leaderboard(ranked_rating desc);

alter table public.shared_leaderboard enable row level security;
drop policy if exists element6_shared_leaderboard_read on public.shared_leaderboard;
create policy element6_shared_leaderboard_read on public.shared_leaderboard for select to authenticated using (true);

-- One stable read model for all leaderboard screens. The client can request one
-- table instead of relying on client-side sorting or partially populated rows.
create or replace function public.element6_get_global_leaderboard(p_limit integer default 100)
returns table(rank integer,user_id uuid,username text,total_xp bigint,ranked_rating integer,soccer_rating integer,volleyball_rating integer,dodgeball_rating integer)
language sql security definer set search_path=public as $$
  select row_number() over(order by coalesce(s.total_xp,0) desc,coalesce(s.ranked_rating,1000) desc,s.user_id)::integer,
         s.user_id,s.username,coalesce(s.total_xp,0),coalesce(s.ranked_rating,1000),coalesce(s.soccer_rating,1000),coalesce(s.volleyball_rating,1000),coalesce(s.dodgeball_rating,1000)
  from public.shared_leaderboard s
  order by coalesce(s.total_xp,0) desc,coalesce(s.ranked_rating,1000) desc,s.user_id
  limit greatest(1,least(coalesce(p_limit,100),500));
$$;
revoke all on function public.element6_get_global_leaderboard(integer) from public,anon;
grant execute on function public.element6_get_global_leaderboard(integer) to authenticated;
