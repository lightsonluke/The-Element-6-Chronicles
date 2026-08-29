-- Element 6: Battle Royale + Custom Rooms + ELO search
-- Paste this ENTIRE file in Supabase SQL Editor and press Run once.
-- This uses auth.uid() for every participant. Never trust a browser supplied user id.

begin;

create table if not exists public.online_custom_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique check (room_code ~ '^[A-Z0-9]{6}$'),
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting','playing','finished','cancelled')),
  settings jsonb not null default '{}'::jsonb,
  authoritative_state jsonb not null default '{}'::jsonb,
  random_seed bigint not null default floor(random() * 2147483647)::bigint,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.online_custom_room_players (
  room_id uuid not null references public.online_custom_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  player_slot smallint not null check (player_slot between 1 and 8),
  loadout jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id), unique(room_id, player_slot)
);

create table if not exists public.online_battle_royale_matches (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'searching' check (status in ('searching','playing','finished','cancelled')),
  max_players smallint not null default 50 check (max_players between 2 and 50),
  settings jsonb not null default '{}'::jsonb,
  authoritative_state jsonb not null default '{}'::jsonb,
  random_seed bigint not null default floor(random() * 2147483647)::bigint,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.online_battle_royale_players (
  match_id uuid not null references public.online_battle_royale_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  player_slot smallint not null check (player_slot between 1 and 50),
  loadout jsonb not null default '{}'::jsonb,
  input_state jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  primary key (match_id, user_id), unique(match_id, player_slot)
);

alter table public.online_custom_rooms enable row level security;
alter table public.online_custom_room_players enable row level security;
alter table public.online_battle_royale_matches enable row level security;
alter table public.online_battle_royale_players enable row level security;

drop policy if exists custom_rooms_participants on public.online_custom_rooms;
create policy custom_rooms_participants on public.online_custom_rooms for select to authenticated using (
  host_id = auth.uid() or exists (select 1 from public.online_custom_room_players p where p.room_id = id and p.user_id = auth.uid())
);
drop policy if exists custom_room_players_participants on public.online_custom_room_players;
create policy custom_room_players_participants on public.online_custom_room_players for select to authenticated using (
  user_id = auth.uid() or exists (select 1 from public.online_custom_room_players self where self.room_id = room_id and self.user_id = auth.uid())
);
drop policy if exists br_matches_participants on public.online_battle_royale_matches;
create policy br_matches_participants on public.online_battle_royale_matches for select to authenticated using (
  host_id = auth.uid() or exists (select 1 from public.online_battle_royale_players p where p.match_id = id and p.user_id = auth.uid())
);
drop policy if exists br_players_participants on public.online_battle_royale_players;
create policy br_players_participants on public.online_battle_royale_players for select to authenticated using (
  user_id = auth.uid() or exists (select 1 from public.online_battle_royale_players self where self.match_id = match_id and self.user_id = auth.uid())
);

create or replace function public.create_element6_custom_room(p_settings jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); code text; r public.online_custom_rooms%rowtype;
begin
 if u is null then raise exception 'Sign in first'; end if;
 loop
   code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
   begin
     insert into public.online_custom_rooms(room_code,host_id,settings) values (code,u,coalesce(p_settings,'{}'::jsonb)) returning * into r;
     exit;
   exception when unique_violation then end;
 end loop;
 insert into public.online_custom_room_players(room_id,user_id,player_slot) values (r.id,u,1);
 return jsonb_build_object('room_id',r.id,'room_code',r.room_code,'role','host','seed',r.random_seed);
end $$;

create or replace function public.join_element6_custom_room(p_room_code text, p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); r public.online_custom_rooms%rowtype; slot smallint;
begin
 if u is null then raise exception 'Sign in first'; end if;
 select * into r from public.online_custom_rooms where room_code=upper(trim(p_room_code)) and status='waiting' for update;
 if r.id is null then raise exception 'Room is unavailable'; end if;
 select player_slot into slot from public.online_custom_room_players where room_id=r.id and user_id=u;
 if slot is null then
   select coalesce(max(player_slot),0)+1 into slot from public.online_custom_room_players where room_id=r.id;
   if slot > coalesce((r.settings->>'maxPlayers')::smallint, 2) then raise exception 'Room is full'; end if;
   insert into public.online_custom_room_players(room_id,user_id,player_slot,loadout) values (r.id,u,slot,coalesce(p_loadout,'{}'::jsonb));
 end if;
 return jsonb_build_object('room_id',r.id,'room_code',r.room_code,'role',case when r.host_id=u then 'host' else 'guest' end,'slot',slot,'seed',r.random_seed);
end $$;

create or replace function public.find_or_create_element6_battle_royale(p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); m public.online_battle_royale_matches%rowtype; slot smallint;
begin
 if u is null then raise exception 'Sign in first'; end if;
 select * into m from public.online_battle_royale_matches where status='searching' and host_id<>u order by created_at asc limit 1 for update skip locked;
 if m.id is null then
  insert into public.online_battle_royale_matches(host_id) values(u) returning * into m;
  insert into public.online_battle_royale_players(match_id,user_id,player_slot,loadout) values(m.id,u,1,coalesce(p_loadout,'{}'::jsonb));
  return jsonb_build_object('match_id',m.id,'role','host','slot',1,'seed',m.random_seed);
 end if;
 select coalesce(max(player_slot),0)+1 into slot from public.online_battle_royale_players where match_id=m.id;
 if slot > m.max_players then raise exception 'Match filled; try again'; end if;
 insert into public.online_battle_royale_players(match_id,user_id,player_slot,loadout) values(m.id,u,slot,coalesce(p_loadout,'{}'::jsonb));
 return jsonb_build_object('match_id',m.id,'role','guest','slot',slot,'seed',m.random_seed);
end $$;

-- Safe username search: returns the matching player even outside the top 100.
create or replace function public.get_element6_elo_leaderboard(p_mode text, p_username text default null)
returns table(rank_position bigint,user_id uuid,username text,rating integer,wins integer,losses integer,matches_played integer)
language sql security definer set search_path=public as $$
 with rating_source as (
   select rr.user_id,coalesce(pp.username,'Player') username,greatest(0,least(4000,coalesce(rr.rating,1000))) rating,coalesce(rr.wins,0) wins,coalesce(rr.losses,0) losses,coalesce(rr.matches_played,coalesce(rr.wins,0)+coalesce(rr.losses,0)) matches_played
   from public.ranked_ratings rr left join public.player_profiles pp on pp.user_id=rr.user_id where p_mode='ranked'
   union all
   select r.user_id,coalesce(pp.username,'Player'),greatest(0,least(4000,coalesce(r.rating,1000))),coalesce(r.wins,0),coalesce(r.losses,0),coalesce(r.matches_played,coalesce(r.wins,0)+coalesce(r.losses,0))
   from public.online_sport_ratings r left join public.player_profiles pp on pp.user_id=r.user_id where p_mode<>'ranked' and r.mode=p_mode
 ), ranked as (
   select rank() over(order by rating desc,wins desc,user_id) rank_position,* from rating_source
 ) select rank_position,user_id,username,rating,wins,losses,matches_played from ranked
 where rank_position<=100 or (nullif(trim(p_username),'') is not null and username ilike '%' || trim(p_username) || '%')
 order by rank_position,username;
$$;
grant execute on function public.create_element6_custom_room(jsonb),public.join_element6_custom_room(text,jsonb),public.find_or_create_element6_battle_royale(jsonb),public.get_element6_elo_leaderboard(text,text) to authenticated;
commit;
