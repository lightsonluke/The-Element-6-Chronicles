-- Element 6: online reliability, forfeit results, character XP, and ELO board
-- Run this COMPLETE file once in Supabase SQL Editor.
-- It is safe to run again.

create extension if not exists pgcrypto;

-- The old Base44-shaped table required a seed but the original queue RPC did
-- not write one. A database default makes every old/new queue path safe.
alter table public.online_matches add column if not exists random_seed bigint;
update public.online_matches set random_seed = floor(random() * 2147483647)::bigint where random_seed is null;
alter table public.online_matches alter column random_seed set default floor(random() * 2147483647)::bigint;
alter table public.online_matches alter column random_seed set not null;
alter table public.online_matches add column if not exists host_state jsonb;
alter table public.online_matches add column if not exists guest_state jsonb;

-- Replaces the old matchmaking function. It includes random_seed explicitly
-- and keeps all player/loadout information server-owned.
create or replace function public.matchmake_online_game(p_mode text, p_character_id text, p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_match public.online_matches%rowtype; v_rating integer := 1000;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_mode not in ('ranked','unranked') then raise exception 'Unsupported online mode'; end if;
  if coalesce(length(trim(p_character_id)),0)=0 then raise exception 'Choose a character'; end if;
  if p_mode='ranked' then
    insert into public.ranked_ratings(user_id) values(v_user) on conflict(user_id) do nothing;
    select rating into v_rating from public.ranked_ratings where user_id=v_user;
  end if;
  update public.online_matches set status='cancelled',updated_at=now()
    where host_user_id=v_user and status='searching';
  select * into v_match from public.online_matches
    where mode=p_mode and status='searching' and guest_user_id is null and host_user_id<>v_user
      and host_last_seen > now()-interval '45 seconds'
    order by created_at for update skip locked limit 1;
  if v_match.id is not null then
    update public.online_matches set guest_user_id=v_user,guest_char=p_character_id,
      guest_loadout=coalesce(p_loadout,'{}'::jsonb),guest_elo=v_rating,guest_last_seen=now(),
      status='matched',ranked_status=case when p_mode='ranked' then 'pending' else null end,updated_at=now()
    where id=v_match.id returning * into v_match;
    return jsonb_build_object('role','guest','match',to_jsonb(v_match));
  end if;
  insert into public.online_matches(mode,status,host_user_id,host_char,host_loadout,host_elo,ranked_status,host_last_seen,random_seed)
  values(p_mode,'searching',v_user,p_character_id,coalesce(p_loadout,'{}'::jsonb),v_rating,
    case when p_mode='ranked' then 'pending' else null end,now(),floor(random()*2147483647)::bigint)
  returning * into v_match;
  return jsonb_build_object('role','host','match',to_jsonb(v_match));
end;
$$;

-- Sports use this when someone leaves. Banger players become spectators:
-- they may leave without ending that six-player match. Every other match
-- finalizes immediately and ranked sport ELO is written here, on the server.
alter table public.online_sport_players add column if not exists left_at timestamptz;
alter table public.online_sport_players add column if not exists is_spectator boolean not null default false;
create or replace function public.leave_online_sport_queue(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid:=auth.uid(); v_match public.online_sport_matches%rowtype; v_team smallint; v_winner smallint;
begin
  select * into v_match from public.online_sport_matches where id=p_match_id for update;
  if v_match.id is null then raise exception 'Match not found'; end if;
  select team into v_team from public.online_sport_players where match_id=p_match_id and user_id=v_user;
  if v_team is null then raise exception 'Not a participant'; end if;
  if v_match.status='searching' then
    delete from public.online_sport_players where match_id=p_match_id and user_id=v_user;
    update public.online_sport_matches m set status='cancelled',updated_at=now() where id=p_match_id and not exists(select 1 from public.online_sport_players p where p.match_id=m.id);
    return;
  end if;
  if v_match.mode='banger_online' then
    update public.online_sport_players set left_at=now(),is_spectator=true where match_id=p_match_id and user_id=v_user;
    return;
  end if;
  v_winner:=case when v_team=1 then 2 else 1 end;
  if v_match.mode in ('soccer_ranked','volleyball_1v1_ranked','dodgeball_ranked') then
    insert into public.online_sport_ratings(user_id,mode)
      select user_id,v_match.mode from public.online_sport_players where match_id=p_match_id
    on conflict(user_id,mode) do nothing;
    update public.online_sport_ratings r set rating=greatest(0,rating+case when p.team=v_winner then 16 else -16 end),
      wins=wins+case when p.team=v_winner then 1 else 0 end,losses=losses+case when p.team<>v_winner then 1 else 0 end,
      matches_played=matches_played+1,updated_at=now()
    from public.online_sport_players p where p.match_id=p_match_id and r.user_id=p.user_id and r.mode=v_match.mode;
  end if;
  update public.online_sport_matches set status='finished',winner_team=v_winner,result_status='forfeit_finalized',updated_at=now() where id=p_match_id;
end;
$$;

-- Cloud record of earned online character XP. Game UI also updates the local
-- character level immediately; this protects the result for later cloud-save work.
create table if not exists public.player_character_online_xp(
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id text not null,
  xp integer not null default 0 check(xp>=0), updated_at timestamptz not null default now(),
  primary key(user_id,character_id)
);
alter table public.player_character_online_xp enable row level security;
drop policy if exists "read own online character xp" on public.player_character_online_xp;
create policy "read own online character xp" on public.player_character_online_xp for select to authenticated using(auth.uid()=user_id);
revoke insert,update,delete on public.player_character_online_xp from anon,authenticated;
grant select on public.player_character_online_xp to authenticated;

-- One shared RPC powers Top 100 and username lookup for all four ranked modes.
create or replace function public.get_element6_elo_leaderboard(p_mode text, p_username text default null)
returns table(rank_position bigint,user_id uuid,username text,rating integer,wins integer,losses integer,matches_played integer)
language plpgsql security definer set search_path=public as $$
begin
  if p_mode not in ('ranked','soccer_ranked','volleyball_1v1_ranked','dodgeball_ranked') then raise exception 'Unsupported leaderboard mode'; end if;
  return query
  with source as (
    select r.user_id,coalesce(p.username,'Player') as uname,r.rating,r.wins,r.losses,r.matches_played
    from public.ranked_ratings r left join public.player_profiles p on p.user_id=r.user_id where p_mode='ranked'
    union all
    select r.user_id,coalesce(p.username,'Player') as uname,r.rating,r.wins,r.losses,r.matches_played
    from public.online_sport_ratings r left join public.player_profiles p on p.user_id=r.user_id where p_mode<>'ranked' and r.mode=p_mode
  ), ranked as (
    select rank() over(order by rating desc,wins desc,updated_at_placeholder) as pos,user_id,uname,rating,wins,losses,matches_played
    from (select source.*, '2000-01-01'::timestamptz as updated_at_placeholder from source) x
  )
  select pos,user_id,uname,rating,wins,losses,matches_played from ranked
  where pos<=100 or (p_username is not null and lower(uname)=lower(trim(p_username)))
  order by pos;
end;
$$;

-- Allow the browser to call only these safe, server-owned endpoints.
revoke all on function public.matchmake_online_game(text,text,jsonb),public.leave_online_sport_queue(uuid),public.get_element6_elo_leaderboard(text,text) from public,anon;
grant execute on function public.matchmake_online_game(text,text,jsonb),public.leave_online_sport_queue(uuid),public.get_element6_elo_leaderboard(text,text) to authenticated;

-- Supabase signaling for LAN WebRTC rooms. The actual game packets go directly
-- device-to-device after this short offer/answer exchange.
create table if not exists public.element6_lan_rooms(
  id uuid primary key default gen_random_uuid(), room_code text not null unique,
  status text not null default 'open' check(status in ('open','connected','closed')),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  host_name text, game_mode text not null default 'fight', host_char text not null, host_element text,
  host_sdp text not null, host_ice jsonb not null default '[]'::jsonb,
  guest_user_id uuid references auth.users(id) on delete set null, guest_name text, guest_char text, guest_element text,
  guest_sdp text, guest_ice jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.element6_lan_rooms enable row level security;
drop policy if exists "signed in users find open lan rooms" on public.element6_lan_rooms;
create policy "signed in users find open lan rooms" on public.element6_lan_rooms for select to authenticated using(status='open' or auth.uid()=host_user_id or auth.uid()=guest_user_id);
revoke insert,update,delete on public.element6_lan_rooms from anon,authenticated;
grant select on public.element6_lan_rooms to authenticated;

create or replace function public.create_element6_lan_room(p_room_code text,p_game_mode text,p_host_char text,p_host_element text,p_host_sdp text,p_host_ice jsonb default '[]'::jsonb)
returns public.element6_lan_rooms language plpgsql security definer set search_path=public as $$
declare v_room public.element6_lan_rooms%rowtype; v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_room_code !~ '^[A-Z0-9]{4,6}$' then raise exception 'Invalid room code'; end if;
  update public.element6_lan_rooms set status='closed',updated_at=now() where host_user_id=v_user and status in('open','connected');
  insert into public.element6_lan_rooms(room_code,status,host_user_id,host_name,game_mode,host_char,host_element,host_sdp,host_ice)
  values(upper(p_room_code),'open',v_user,coalesce((select username from public.player_profiles where user_id=v_user),'Player'),p_game_mode,p_host_char,p_host_element,p_host_sdp,coalesce(p_host_ice,'[]'::jsonb)) returning * into v_room;
  return v_room;
end;
$$;

create or replace function public.join_element6_lan_room(p_room_code text,p_guest_char text,p_guest_element text,p_guest_sdp text,p_guest_ice jsonb default '[]'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  update public.element6_lan_rooms set guest_user_id=v_user,guest_name=coalesce((select username from public.player_profiles where user_id=v_user),'Player'),guest_char=p_guest_char,guest_element=p_guest_element,guest_sdp=p_guest_sdp,guest_ice=coalesce(p_guest_ice,'[]'::jsonb),status='connected',updated_at=now()
  where room_code=upper(p_room_code) and status='open' and host_user_id<>v_user;
  if not found then raise exception 'Room not found, expired, or already joined'; end if;
end;
$$;

create or replace function public.close_element6_lan_room(p_room_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin update public.element6_lan_rooms set status='closed',updated_at=now() where id=p_room_id and auth.uid() in(host_user_id,guest_user_id); end;
$$;
revoke all on function public.create_element6_lan_room(text,text,text,text,text,jsonb),public.join_element6_lan_room(text,text,text,text,jsonb),public.close_element6_lan_room(uuid) from public,anon;
grant execute on function public.create_element6_lan_room(text,text,text,text,text,jsonb),public.join_element6_lan_room(text,text,text,text,jsonb),public.close_element6_lan_room(uuid) to authenticated;
do $$ begin if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='element6_lan_rooms') then alter publication supabase_realtime add table public.element6_lan_rooms; end if; end $$;
