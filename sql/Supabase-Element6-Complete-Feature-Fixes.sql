-- Element 6: social, clan, tournament, leaderboard and community fixes.
-- Run this file in Supabase SQL Editor after the existing Element 6 migrations.
-- Safe to run repeatedly.

begin;

-- 1) Clan tournament view: the UI uses clan_tag. The old view exposed c.tag.
drop view if exists public.element6_clan_tournament_monthly;
create view public.element6_clan_tournament_monthly as
select
  row_number() over(
    partition by s.month_key
    order by s.tournament_points desc, s.monthly_wins desc, s.monthly_xp desc, c.name asc
  )::integer as rank,
  s.clan_id,
  c.name as clan_name,
  c.tag as clan_tag,
  s.tournament_points,
  s.monthly_xp,
  s.monthly_wins,
  (
    row_number() over(
      partition by s.month_key
      order by s.tournament_points desc, s.monthly_wins desc, s.monthly_xp desc, c.name asc
    ) <= 100
  ) as qualified,
  s.month_key
from public.element6_clan_tournament_scores s
join public.element6_clans c on c.id = s.clan_id;

-- 2) Clan leader can change the badge whenever.
create or replace function public.element6_update_clan_badge(p_icon_url text)
returns public.element6_clans
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_clan uuid;
  v_row public.element6_clans;
  v_icon text := nullif(trim(p_icon_url), '');
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  select clan_id into v_clan
  from public.element6_clan_members
  where user_id=v_user and role='leader'
  limit 1;

  if v_clan is null then raise exception 'Only the clan owner can change the clan badge'; end if;
  if v_icon is not null and length(v_icon) > 200000 then raise exception 'Badge URL is too large'; end if;

  update public.element6_clans
  set icon_url=v_icon
  where id=v_clan
  returning * into v_row;

  return v_row;
end;
$$;
revoke all on function public.element6_update_clan_badge(text) from public,anon;
grant execute on function public.element6_update_clan_badge(text) to authenticated;

-- 3) DMs: authenticated players may message any player, not only friends.
create table if not exists public.player_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_username text not null default 'Player',
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
alter table public.player_direct_messages enable row level security;
drop policy if exists "DM participants read" on public.player_direct_messages;
create policy "DM participants read" on public.player_direct_messages for select to authenticated using (auth.uid()=sender_id or auth.uid()=recipient_id);
drop policy if exists "Friends send DMs" on public.player_direct_messages;
drop policy if exists "Authenticated players send DMs" on public.player_direct_messages;
create policy "Authenticated players send DMs"
on public.player_direct_messages
for insert to authenticated
with check (
  auth.uid() = sender_id
  and sender_id <> recipient_id
  and exists(select 1 from auth.users u where u.id=recipient_id)
);

-- Realtime is needed for global chat/friend notifications.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='player_direct_messages'
  ) then
    alter publication supabase_realtime add table public.player_direct_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='player_friend_requests'
  ) then
    alter publication supabase_realtime add table public.player_friend_requests;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='player_presence'
  ) then
    alter publication supabase_realtime add table public.player_presence;
  end if;
end $$;

-- 4) Make sure world-score RPC supports all three requested solo leaderboards.
create table if not exists public.element6_world_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null default 'Player',
  mode text not null,
  score numeric not null default 0,
  score_meta jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, mode)
);
alter table public.element6_world_scores enable row level security;
drop policy if exists element6_world_scores_read on public.element6_world_scores;
create policy element6_world_scores_read on public.element6_world_scores for select to authenticated using (true);

create or replace function public.submit_element6_world_score(
  p_mode text, p_score numeric, p_meta jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path=public
as $$
declare
  u uuid := auth.uid();
  n text;
  old_score numeric;
  replace_it boolean;
  final_score numeric;
  r bigint;
begin
  if u is null then raise exception 'Sign in first'; end if;
  if p_mode not in ('parkour','rockclimb','zipline') then raise exception 'Unknown leaderboard mode'; end if;
  if p_score is null or p_score < 0 then raise exception 'Invalid score'; end if;

  select coalesce(nullif(pp.username,''),nullif(au.raw_user_meta_data->>'username',''),
                 nullif(au.raw_user_meta_data->>'full_name',''),nullif(split_part(au.email,'@',1),''),'Player')
  into n
  from auth.users au left join public.player_profiles pp on pp.user_id=au.id
  where au.id=u;

  select score into old_score from public.element6_world_scores where user_id=u and mode=p_mode;
  replace_it := old_score is null or (p_mode='rockclimb' and p_score < old_score) or (p_mode<>'rockclimb' and p_score > old_score);

  if replace_it then
    insert into public.element6_world_scores(user_id,username,mode,score,score_meta,updated_at)
    values(u,coalesce(n,'Player'),p_mode,p_score,coalesce(p_meta,'{}'::jsonb),now())
    on conflict(user_id,mode) do update set username=excluded.username,score=excluded.score,score_meta=excluded.score_meta,updated_at=now();
  end if;

  select score into final_score from public.element6_world_scores where user_id=u and mode=p_mode;
  select count(*)+1 into r from public.element6_world_scores x
  where x.mode=p_mode and (
    (p_mode='rockclimb' and x.score < final_score) or
    (p_mode<>'rockclimb' and x.score > final_score)
  );

  return jsonb_build_object('updated',replace_it,'mode',p_mode,'score',final_score,'rank',r);
end;
$$;
grant execute on function public.submit_element6_world_score(text,numeric,jsonb) to authenticated;

-- Honored-bot global tracking.
create table if not exists public.element6_honored_bot_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null default 'Player',
  char_id text,
  char_name text,
  bot_char_id text,
  bot_char_name text,
  winner text not null check (winner in ('player','bot')),
  player_stocks integer not null default 0,
  bot_stocks integer not null default 0,
  match_duration_seconds numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.element6_honored_bot_matches enable row level security;
drop policy if exists element6_honored_bot_matches_read on public.element6_honored_bot_matches;
create policy element6_honored_bot_matches_read on public.element6_honored_bot_matches for select to authenticated using (true);
drop policy if exists element6_honored_bot_matches_insert on public.element6_honored_bot_matches;
create policy element6_honored_bot_matches_insert on public.element6_honored_bot_matches for insert to authenticated with check (auth.uid()=user_id);

-- 5) Ensure shared leaderboard has the columns used by the client.
do $$
begin
  if to_regclass('public.shared_leaderboard') is not null then
    alter table public.shared_leaderboard add column if not exists soccer_xp bigint default 0;
    alter table public.shared_leaderboard add column if not exists combat_xp bigint default 0;
    alter table public.shared_leaderboard add column if not exists soccer_goals bigint default 0;
    alter table public.shared_leaderboard add column if not exists soccer_saves bigint default 0;
    alter table public.shared_leaderboard add column if not exists combat_kills bigint default 0;
    alter table public.shared_leaderboard add column if not exists combat_deaths bigint default 0;
    alter table public.shared_leaderboard add column if not exists ranked_rating integer default 1000;
  end if;
end $$;

commit;
