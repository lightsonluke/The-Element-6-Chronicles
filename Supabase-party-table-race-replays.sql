-- Element 6 replacement: Party + The Table + Race + Match Replays
-- Run after the existing Element 6 social/online SQL. Safe to run repeatedly.

begin;

create table if not exists public.element6_parties (
  id uuid primary key default gen_random_uuid(),
  party_code text not null unique check (party_code ~ '^[A-Z0-9]{6}$'),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  host_username text not null default 'Player',
  name text not null default 'Party',
  is_public boolean not null default true,
  status text not null default 'open' check (status in ('open','queued','playing','closed')),
  queued_mode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.element6_party_members (
  party_id uuid not null references public.element6_parties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null default 'Player',
  slot smallint not null check (slot between 1 and 8),
  joined_at timestamptz not null default now(),
  spectator boolean not null default false,
  primary key (party_id,user_id),
  unique(party_id,slot)
);
create table if not exists public.element6_party_invites (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.element6_parties(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique(party_id,to_user_id)
);

alter table public.element6_parties enable row level security;
alter table public.element6_party_members enable row level security;
alter table public.element6_party_invites enable row level security;
drop policy if exists element6_party_read on public.element6_parties;
create policy element6_party_read on public.element6_parties for select to authenticated using (
  is_public or host_user_id=auth.uid() or exists(select 1 from public.element6_party_members m where m.party_id=id and m.user_id=auth.uid())
);
drop policy if exists element6_party_members_read on public.element6_party_members;
create policy element6_party_members_read on public.element6_party_members for select to authenticated using (
  exists(select 1 from public.element6_party_members m where m.party_id=element6_party_members.party_id and m.user_id=auth.uid())
);
drop policy if exists element6_party_invites_read on public.element6_party_invites;
create policy element6_party_invites_read on public.element6_party_invites for select to authenticated using (to_user_id=auth.uid() or from_user_id=auth.uid());
revoke insert,update,delete on public.element6_parties,public.element6_party_members,public.element6_party_invites from anon,authenticated;
grant select on public.element6_parties,public.element6_party_members,public.element6_party_invites to authenticated;

create or replace function public.element6_party_json(p_party_id uuid)
returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object(
    'id',p.id,'party_code',p.party_code,'host_user_id',p.host_user_id,'host_username',p.host_username,
    'name',p.name,'is_public',p.is_public,'status',p.status,'queued_mode',p.queued_mode,
    'member_count',(select count(*) from public.element6_party_members m where m.party_id=p.id),
    'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',m.user_id,'username',m.username,'slot',m.slot,'spectator',m.spectator) order by m.slot) from public.element6_party_members m where m.party_id=p.id),'[]'::jsonb)
  ) from public.element6_parties p where p.id=p_party_id;
$$;

create or replace function public.element6_create_party(p_public boolean default true,p_name text default 'Party')
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); p public.element6_parties%rowtype; code text;
begin
 if u is null then raise exception 'Sign in first'; end if;
 if exists(select 1 from public.element6_party_members m join public.element6_parties p on p.id=m.party_id where m.user_id=u and p.status in('open','queued','playing')) then raise exception 'You are already in a party'; end if;
 loop
   code:=upper(substr(md5(random()::text||clock_timestamp()::text),1,6));
   begin insert into public.element6_parties(party_code,host_user_id,host_username,name,is_public) values(code,u,coalesce((select username from public.player_profiles where user_id=u),'Player'),coalesce(nullif(trim(p_name),''),'Party'),coalesce(p_public,true)) returning * into p; exit;
   exception when unique_violation then end;
 end loop;
 insert into public.element6_party_members(party_id,user_id,username,slot) values(p.id,u,p.host_username,1);
 return public.element6_party_json(p.id);
end $$;

create or replace function public.element6_join_party(p_party_id uuid default null,p_party_code text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); p public.element6_parties%rowtype; slot smallint;
begin
 if u is null then raise exception 'Sign in first'; end if;
 select * into p from public.element6_parties where ((p_party_id is not null and id=p_party_id) or (p_party_code is not null and party_code=upper(trim(p_party_code)))) and status='open' for update;
 if p.id is null then raise exception 'Party is unavailable'; end if;
 if exists(select 1 from public.element6_party_members where party_id=p.id and user_id=u) then return public.element6_party_json(p.id); end if;
 select coalesce(max(slot),0)+1 into slot from public.element6_party_members where party_id=p.id;
 if slot>8 then raise exception 'Party is full'; end if;
 insert into public.element6_party_members(party_id,user_id,username,slot) values(p.id,u,coalesce((select username from public.player_profiles where user_id=u),'Player'),slot);
 return public.element6_party_json(p.id);
end $$;

create or replace function public.element6_leave_party(p_party_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); p public.element6_parties%rowtype;
begin
 select * into p from public.element6_parties where id=p_party_id for update;
 if p.id is null or not exists(select 1 from public.element6_party_members where party_id=p.id and user_id=u) then raise exception 'Party not found'; end if;
 delete from public.element6_party_members where party_id=p.id and user_id=u;
 if p.host_user_id=u then
   select user_id into p.host_user_id from public.element6_party_members where party_id=p.id order by slot limit 1;
   if p.host_user_id is null then delete from public.element6_parties where id=p_party_id; return; end if;
   update public.element6_parties set host_user_id=p.host_user_id, updated_at=now() where id=p_party_id;
 end if;
end $$;

create or replace function public.element6_send_party_invite(p_party_id uuid,p_to_user uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); n int;
begin
 if not exists(select 1 from public.element6_party_members where party_id=p_party_id and user_id=u) then raise exception 'You are not in this party'; end if;
 select count(*) into n from public.element6_party_members where party_id=p_party_id;
 if n>=8 then raise exception 'Party is full'; end if;
 insert into public.element6_party_invites(party_id,from_user_id,to_user_id) values(p_party_id,u,p_to_user) on conflict(party_id,to_user_id) do update set status='pending',created_at=now();
 return jsonb_build_object('sent',true);
end $$;

create or replace function public.element6_party_prepare_match(p_party_id uuid,p_mode text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); n int;
begin
 if not exists(select 1 from public.element6_parties where id=p_party_id and host_user_id=u) then raise exception 'Only the party host can queue'; end if;
 if p_mode not in('customrooms','banger-online','volleyball-online','thetable','battleroyale','grandcircuit-online','lan','soccer-online','dodgeball-online','race','ctf-online') then raise exception 'Unsupported party mode'; end if;
 select count(*) into n from public.element6_party_members where party_id=p_party_id;
 update public.element6_parties set status='queued',queued_mode=p_mode,updated_at=now() where id=p_party_id;
 return jsonb_build_object('party_id',p_party_id,'mode',p_mode,'members',n);
end $$;

grant execute on function public.element6_party_json(uuid),public.element6_create_party(boolean,text),public.element6_join_party(uuid,text),public.element6_leave_party(uuid),public.element6_send_party_invite(uuid,uuid),public.element6_party_prepare_match(uuid,text) to authenticated;

-- THE TABLE
create table if not exists public.element6_table_tournaments (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'queue' check(status in('queue','voting','playing','finished','cancelled')),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  stage_id text,
  stage_votes jsonb not null default '{}'::jsonb,
  current_round smallint not null default 0,
  active_match_id uuid,
  active_p1 uuid,
  active_p2 uuid,
  winner_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.element6_table_players (
  tournament_id uuid not null references public.element6_table_tournaments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  slot smallint not null check(slot between 1 and 8),
  username text not null default 'Player',
  char_id text not null default 'yellow',
  loadout jsonb not null default '{}'::jsonb,
  status text not null default 'active' check(status in('active','eliminated','winner')),
  vote_stage text,
  joined_at timestamptz not null default now(),
  primary key(tournament_id,user_id),
  unique(tournament_id,slot)
);
create table if not exists public.element6_table_rounds (
  tournament_id uuid not null references public.element6_table_tournaments(id) on delete cascade,
  round_index smallint not null,
  match_id uuid not null default gen_random_uuid(),
  p1 uuid not null references auth.users(id),
  p2 uuid not null references auth.users(id),
  stage_id text not null,
  status text not null default 'playing' check(status in('playing','finished')),
  winner uuid,
  loser uuid,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  primary key(tournament_id,round_index),
  unique(match_id)
);
alter table public.element6_table_tournaments enable row level security;
alter table public.element6_table_players enable row level security;
alter table public.element6_table_rounds enable row level security;
create or replace function public.is_table_participant(p_id uuid) returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from public.element6_table_players where tournament_id=p_id and user_id=auth.uid());
$$;
drop policy if exists table_tournament_read on public.element6_table_tournaments;
create policy table_tournament_read on public.element6_table_tournaments for select to authenticated using(public.is_table_participant(id));
drop policy if exists table_players_read on public.element6_table_players;
create policy table_players_read on public.element6_table_players for select to authenticated using(public.is_table_participant(tournament_id));
drop policy if exists table_rounds_read on public.element6_table_rounds;
create policy table_rounds_read on public.element6_table_rounds for select to authenticated using(public.is_table_participant(tournament_id));
revoke insert,update,delete on public.element6_table_tournaments,public.element6_table_players,public.element6_table_rounds from anon,authenticated;
grant select on public.element6_table_tournaments,public.element6_table_players,public.element6_table_rounds to authenticated;

create or replace function public.element6_join_the_table(p_char_id text,p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); t public.element6_table_tournaments%rowtype; slot smallint; cnt int;
begin
 if u is null then raise exception 'Sign in first'; end if;
 select count(*) into cnt from public.element6_table_players p join public.element6_table_tournaments t on t.id=p.tournament_id where p.user_id=u and t.status in('queue','voting','playing');
 if cnt>0 then raise exception 'Already in The Table'; end if;
 select * into t from public.element6_table_tournaments where status='queue' order by created_at for update skip locked limit 1;
 if t.id is null then insert into public.element6_table_tournaments(host_user_id) values(u) returning * into t; end if;
 select coalesce(max(slot),0)+1 into slot from public.element6_table_players where tournament_id=t.id;
 if slot>8 then raise exception 'The Table is full'; end if;
 insert into public.element6_table_players(tournament_id,user_id,slot,username,char_id,loadout) values(t.id,u,slot,coalesce((select username from public.player_profiles where user_id=u),'Player'),p_char_id,coalesce(p_loadout,'{}'::jsonb));
 select count(*) into cnt from public.element6_table_players where tournament_id=t.id;
 if cnt=8 then update public.element6_table_tournaments set status='voting',updated_at=now() where id=t.id; end if;
 return jsonb_build_object('tournament_id',t.id,'status',case when cnt=8 then 'voting' else 'queue' end);
end $$;

create or replace function public.element6_vote_the_table(p_tournament_id uuid,p_stage_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); t public.element6_table_tournaments%rowtype; cnt int; winner text;
begin
 if not exists(select 1 from public.element6_table_players where tournament_id=p_tournament_id and user_id=u) then raise exception 'Not a participant'; end if;
 update public.element6_table_players set vote_stage=p_stage_id where tournament_id=p_tournament_id and user_id=u;
 select count(*) into cnt from public.element6_table_players where tournament_id=p_tournament_id and vote_stage is not null;
 if cnt=8 then
   -- Randomize the vote result among all received votes, weighted by vote count.
   select vote_stage into winner from public.element6_table_players where tournament_id=p_tournament_id and vote_stage is not null order by random() limit 1;
   update public.element6_table_tournaments set stage_id=winner,status='playing',updated_at=now() where id=p_tournament_id and status='voting';
 end if;
 select * into t from public.element6_table_tournaments where id=p_tournament_id;
 return to_jsonb(t);
end $$;

create or replace function public.element6_table_start_next(p_tournament_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); t public.element6_table_tournaments%rowtype; a uuid[]; p1 uuid;p2 uuid; idx smallint; rid uuid;
begin
 if not exists(select 1 from public.element6_table_players where tournament_id=p_tournament_id and user_id=u) then raise exception 'Not a participant'; end if;
 select * into t from public.element6_table_tournaments where id=p_tournament_id for update;
 if t.id is null or t.status<>'playing' then return jsonb_build_object('started',false); end if;
 if t.active_match_id is not null and exists(select 1 from public.element6_table_rounds r where r.tournament_id=t.id and r.match_id=t.active_match_id and r.status='playing') then return jsonb_build_object('started',false); end if;
 select array_agg(user_id order by random()) into a from public.element6_table_players where tournament_id=t.id and status='active';
 if coalesce(array_length(a,1),0)<2 then
   if array_length(a,1)=1 then update public.element6_table_players set status='winner' where tournament_id=t.id and user_id=a[1]; update public.element6_table_tournaments set status='finished',winner_user_id=a[1],updated_at=now() where id=t.id; end if;
   return jsonb_build_object('started',false,'finished',true);
 end if;
 p1:=a[1];p2:=a[2];idx:=t.current_round+1;rid:=gen_random_uuid();
 insert into public.element6_table_rounds(tournament_id,round_index,match_id,p1,p2,stage_id) values(t.id,idx,rid,p1,p2,t.stage_id);
 update public.element6_table_tournaments set current_round=idx,active_match_id=rid,active_p1=p1,active_p2=p2,updated_at=now() where id=t.id;
 return jsonb_build_object('started',true,'match_id',rid,'p1',p1,'p2',p2,'stage_id',t.stage_id,'round_index',idx);
end $$;

create or replace function public.element6_table_report_result(p_tournament_id uuid,p_match_id uuid,p_winner uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); r public.element6_table_rounds%rowtype; t public.element6_table_tournaments%rowtype; loser uuid;
begin
 select * into r from public.element6_table_rounds where tournament_id=p_tournament_id and match_id=p_match_id for update;
 if r.p1<>u and r.p2<>u then raise exception 'Not a player in this round'; end if;
 if r.status='finished' then select * into t from public.element6_table_tournaments where id=p_tournament_id; return to_jsonb(t); end if;
 if p_winner<>r.p1 and p_winner<>r.p2 then raise exception 'Winner is not a player in this round'; end if;
 loser:=case when p_winner=r.p1 then r.p2 else r.p1 end;
 update public.element6_table_rounds set status='finished',winner=p_winner,loser=loser,finished_at=now() where tournament_id=p_tournament_id and round_index=r.round_index;
 update public.element6_table_players set status='eliminated' where tournament_id=p_tournament_id and user_id=loser;
 update public.element6_table_tournaments set active_match_id=null,active_p1=null,active_p2=null,updated_at=now() where id=p_tournament_id;
 select * into t from public.element6_table_tournaments where id=p_tournament_id;
 return jsonb_build_object('tournament',to_jsonb(t),'winner',p_winner,'loser',loser);
end $$;

create or replace function public.element6_leave_the_table(p_tournament_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 delete from public.element6_table_players where tournament_id=p_tournament_id and user_id=auth.uid();
end $$;

grant execute on function public.element6_join_the_table(text,jsonb),public.element6_vote_the_table(uuid,text),public.element6_table_start_next(uuid),public.element6_table_report_result(uuid,uuid,uuid),public.element6_leave_the_table(uuid) to authenticated;

-- RACE
create table if not exists public.element6_race_matches (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'searching' check(status in('searching','playing','finished','cancelled')),
  max_players smallint not null default 30 check(max_players=30),
  settings jsonb not null default '{"knockbackMultiplier":0.5,"constantDamage":true}'::jsonb,
  authoritative_state jsonb not null default '{}'::jsonb,
  random_seed bigint not null default floor(random()*2147483647)::bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.element6_race_players (
  match_id uuid not null references public.element6_race_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  player_slot smallint not null check(player_slot between 1 and 30),
  loadout jsonb not null default '{}'::jsonb,
  input_state jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  primary key(match_id,user_id), unique(match_id,player_slot)
);
alter table public.element6_race_matches enable row level security;
alter table public.element6_race_players enable row level security;
create or replace function public.is_element6_race_participant(p_id uuid,p_user_id uuid default auth.uid()) returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from public.element6_race_players where match_id=p_id and user_id=p_user_id) or exists(select 1 from public.element6_race_matches where id=p_id and host_id=p_user_id);
$$;
drop policy if exists race_match_read on public.element6_race_matches;
create policy race_match_read on public.element6_race_matches for select to authenticated using(public.is_element6_race_participant(id,auth.uid()));
drop policy if exists race_players_read on public.element6_race_players;
create policy race_players_read on public.element6_race_players for select to authenticated using(public.is_element6_race_participant(match_id,auth.uid()));
revoke insert,update,delete on public.element6_race_matches,public.element6_race_players from anon,authenticated;
grant select on public.element6_race_matches,public.element6_race_players to authenticated;

create or replace function public.find_or_create_element6_race(p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); m public.element6_race_matches%rowtype; slot smallint;
begin
 if u is null then raise exception 'Sign in first'; end if;
 update public.element6_race_matches set status='cancelled',updated_at=now() where status='searching' and created_at<now()-interval '90 seconds';
 if exists(select 1 from public.element6_race_players p join public.element6_race_matches m on m.id=p.match_id where p.user_id=u and m.status in('searching','playing')) then raise exception 'Already in an active Race match'; end if;
 select * into m from public.element6_race_matches where status='searching' and host_id<>u order by created_at for update skip locked limit 1;
 if m.id is null then
   insert into public.element6_race_matches(host_id) values(u) returning * into m;
   insert into public.element6_race_players(match_id,user_id,player_slot,loadout) values(m.id,u,1,coalesce(p_loadout,'{}'::jsonb));
   return jsonb_build_object('match_id',m.id,'role','host','slot',1);
 end if;
 select coalesce(max(player_slot),0)+1 into slot from public.element6_race_players where match_id=m.id;
 if slot>30 then raise exception 'Race is full'; end if;
 insert into public.element6_race_players(match_id,user_id,player_slot,loadout) values(m.id,u,slot,coalesce(p_loadout,'{}'::jsonb));
 return jsonb_build_object('match_id',m.id,'role','guest','slot',slot);
end $$;

create or replace function public.element6_race_heartbeat(p_match_id uuid) returns void language sql security definer set search_path=public as $$
 update public.element6_race_matches set updated_at=now() where id=p_match_id and public.is_element6_race_participant(p_match_id,auth.uid());
$$;

create or replace function public.start_element6_race(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); m public.element6_race_matches%rowtype;
begin
 select * into m from public.element6_race_matches where id=p_match_id for update;
 if m.host_id<>u then raise exception 'Only the host can start Race'; end if;
 update public.element6_race_matches set status='playing',updated_at=now() where id=p_match_id and status='searching' returning * into m;
 return to_jsonb(m);
end $$;
create or replace function public.leave_element6_race(p_match_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 delete from public.element6_race_players where match_id=p_match_id and user_id=auth.uid();
 update public.element6_race_matches set status='cancelled',updated_at=now() where id=p_match_id and status='searching' and not exists(select 1 from public.element6_race_players where match_id=p_match_id);
end $$;
grant execute on function public.find_or_create_element6_race(jsonb),public.element6_race_heartbeat(uuid),public.start_element6_race(uuid),public.leave_element6_race(uuid) to authenticated;

-- Match replays are local browser media, so no cloud table is required.

commit;
