-- ELEMENT 6 — account saves, world leaderboards, and ELO username search
-- Run the complete script once in Supabase SQL Editor. It is safe to run again.
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
create policy element6_world_scores_read on public.element6_world_scores for select to authenticated using (true);

create or replace function public.submit_element6_world_score(p_mode text, p_score numeric, p_meta jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); n text; existing numeric; should_replace boolean;
begin
  if u is null then raise exception 'Sign in first'; end if;
  if p_mode not in ('parkour','rockclimb','zipline','honored_bot') then raise exception 'Unknown leaderboard mode'; end if;
  select coalesce(username, raw_user_meta_data->>'username', raw_user_meta_data->>'full_name', split_part(email,'@',1),'Player') into n from auth.users where id=u;
  select score into existing from public.element6_world_scores where user_id=u and mode=p_mode;
  should_replace := existing is null or (p_mode='rockclimb' and p_score < existing) or (p_mode<>'rockclimb' and p_score > existing);
  if should_replace then
    insert into public.element6_world_scores(user_id,username,mode,score,score_meta,updated_at)
    values(u,n,p_mode,p_score,coalesce(p_meta,'{}'::jsonb),now())
    on conflict(user_id,mode) do update set username=excluded.username,score=excluded.score,score_meta=excluded.score_meta,updated_at=excluded.updated_at;
  end if;
  return jsonb_build_object('updated',should_replace,'rank',(select count(*)+1 from public.element6_world_scores s where s.mode=p_mode and ((p_mode='rockclimb' and s.score < least(p_score,coalesce(existing,p_score))) or (p_mode<>'rockclimb' and s.score > greatest(p_score,coalesce(existing,p_score))))));
end $$;

-- ELO query uses fully-qualified aliases so a username search cannot produce
-- the old ambiguous user_id error. Search includes players outside the top 100.
create or replace function public.get_element6_elo_leaderboard(p_mode text, p_username text default null)
returns table(rank_position bigint,user_id uuid,username text,rating integer,wins integer,losses integer,matches_played integer)
language plpgsql security definer set search_path=public as $$
begin
 if p_mode not in ('ranked','soccer_ranked','volleyball_1v1_ranked','dodgeball_ranked') then raise exception 'Unsupported leaderboard mode'; end if;
 return query with source_rows as (
   select rr.user_id as src_user_id,coalesce(pp.username,'Player') as src_username,greatest(0,least(4000,coalesce(rr.rating,1000))) as src_rating,coalesce(rr.wins,0) as src_wins,coalesce(rr.losses,0) as src_losses,coalesce(rr.matches_played,coalesce(rr.wins,0)+coalesce(rr.losses,0)) as src_matches from public.ranked_ratings rr left join public.player_profiles pp on pp.user_id=rr.user_id where p_mode='ranked'
   union all
   select osr.user_id,coalesce(pp.username,'Player'),greatest(0,least(4000,coalesce(osr.rating,1000))),coalesce(osr.wins,0),coalesce(osr.losses,0),coalesce(osr.matches_played,coalesce(osr.wins,0)+coalesce(osr.losses,0)) from public.online_sport_ratings osr left join public.player_profiles pp on pp.user_id=osr.user_id where p_mode<>'ranked' and osr.mode=p_mode
 ), numbered as (
   select rank() over(order by src_rating desc,src_wins desc,src_user_id) as pos,* from source_rows
 ) select n.pos,n.src_user_id,n.src_username,n.src_rating,n.src_wins,n.src_losses,n.src_matches from numbered n where n.pos<=100 or (nullif(trim(p_username),'') is not null and n.src_username ilike '%'||trim(p_username)||'%') order by n.pos,n.src_username;
end $$;

grant execute on function public.submit_element6_world_score(text,numeric,jsonb),public.get_element6_elo_leaderboard(text,text) to authenticated;
commit;
