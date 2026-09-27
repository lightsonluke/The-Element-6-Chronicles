-- Element 6: online recovery, global hub/room discovery, direct trade/gift,
-- and three-person Community Founding.
-- Run after the existing Element 6 Supabase setup files.

begin;

-- ================================================================
-- COMMUNITY HUB: richer online presence fields
-- ================================================================
alter table public.online_hub_presence add column if not exists skin text;
alter table public.online_hub_presence add column if not exists accessory text;
alter table public.online_hub_presence add column if not exists killfx text default 'none';
alter table public.online_hub_presence add column if not exists level integer default 1;
alter table public.online_hub_presence add column if not exists region text default 'NA-EAST';

-- ================================================================
-- CUSTOM ROOMS: allow regional discovery and host-controlled settings
-- ================================================================
alter table public.online_custom_rooms add column if not exists region text not null default 'NA-EAST';

-- Existing participant-only policies prevent the Open Rooms browser from seeing
-- rooms before joining. Replace them with safe regional discovery policies.
-- Supabase clients cannot normally set request claims, so also allow authenticated
-- users to see waiting rooms globally; the client applies its explicit region
-- filter and never hides a room that is in the player's region.
drop policy if exists custom_rooms_global_waiting on public.online_custom_rooms;
create policy custom_rooms_global_waiting on public.online_custom_rooms
  for select to authenticated using (status = 'waiting');

drop policy if exists custom_rooms_participant_access on public.online_custom_rooms;
create policy custom_rooms_participant_access on public.online_custom_rooms
  for select to authenticated using (public.is_element6_custom_room_participant(id, auth.uid()));

drop policy if exists custom_rooms_host_update on public.online_custom_rooms;
create policy custom_rooms_host_update on public.online_custom_rooms
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists custom_rooms_host_delete on public.online_custom_rooms;
create policy custom_rooms_host_delete on public.online_custom_rooms
  for delete to authenticated using (host_id = auth.uid());

drop policy if exists custom_room_players_discovery on public.online_custom_room_players;
create policy custom_room_players_discovery on public.online_custom_room_players
  for select to authenticated using (
    exists (select 1 from public.online_custom_rooms r where r.id = room_id and r.status = 'waiting')
    or public.is_element6_custom_room_participant(room_id, auth.uid())
  );

drop policy if exists custom_room_players_owner_delete on public.online_custom_room_players;
create policy custom_room_players_owner_delete on public.online_custom_room_players
  for delete to authenticated using (user_id = auth.uid() or exists (select 1 from public.online_custom_rooms r where r.id = room_id and r.host_id = auth.uid()));

create or replace function public.element6_custom_room_snapshot(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.online_custom_rooms%rowtype; rows jsonb;
begin
  select * into r from public.online_custom_rooms where id=p_room_id;
  if r.id is null then raise exception 'Room not found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'slot', p.player_slot,
    'user_id', p.user_id,
    'loadout', p.loadout,
    'username', coalesce(pp.username,'Player')
  ) order by p.player_slot),'[]'::jsonb)
  into rows
  from public.online_custom_room_players p
  left join public.player_profiles pp on pp.user_id=p.user_id
  where p.room_id=r.id;
  return jsonb_build_object('room',to_jsonb(r),'players',rows);
end $$;

grant execute on function public.element6_custom_room_snapshot(uuid) to authenticated;

create or replace function public.update_element6_custom_room_player(p_room_id uuid,p_character_id text,p_loadout jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.online_custom_room_players where room_id=p_room_id and user_id=auth.uid()) then raise exception 'You are not in this room'; end if;
  update public.online_custom_room_players
  set loadout=coalesce(p_loadout,'{}'::jsonb) || jsonb_build_object('character_id',p_character_id)
  where room_id=p_room_id and user_id=auth.uid();
end $$;

grant execute on function public.update_element6_custom_room_player(uuid,text,jsonb) to authenticated;

create or replace function public.start_element6_custom_room(p_room_id uuid,p_settings jsonb default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.online_custom_rooms%rowtype;
begin
  select * into r from public.online_custom_rooms where id=p_room_id for update;
  if r.id is null then raise exception 'Room not found'; end if;
  if r.host_id <> auth.uid() then raise exception 'Only the host can start the room'; end if;
  update public.online_custom_rooms set status='playing', settings=case when p_settings is null then settings else p_settings end, updated_at=now() where id=r.id returning * into r;
  return to_jsonb(r);
end $$;

grant execute on function public.start_element6_custom_room(uuid,jsonb) to authenticated;

create or replace function public.finish_element6_custom_room(p_room_id uuid,p_winner text default 'draw')
returns void language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.online_custom_room_players where room_id=p_room_id and user_id=auth.uid())
     and not exists(select 1 from public.online_custom_rooms where id=p_room_id and host_id=auth.uid()) then raise exception 'Not a participant'; end if;
  update public.online_custom_rooms set status='finished', updated_at=now(), authoritative_state=jsonb_build_object('winner',p_winner) where id=p_room_id;
end $$;

grant execute on function public.finish_element6_custom_room(uuid,text) to authenticated;

create or replace function public.leave_element6_custom_room(p_room_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_host uuid;
begin
  select host_id into v_host from public.online_custom_rooms where id=p_room_id;
  delete from public.online_custom_room_players where room_id=p_room_id and user_id=auth.uid();
  if v_host=auth.uid() then
    update public.online_custom_rooms set status='cancelled',updated_at=now() where id=p_room_id;
  end if;
end $$;

grant execute on function public.leave_element6_custom_room(uuid) to authenticated;

-- Ensure the creator's region is recorded when the existing RPC is used.
create or replace function public.create_element6_custom_room(p_settings jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid := auth.uid(); code text; r public.online_custom_rooms%rowtype; s jsonb;
begin
 if u is null then raise exception 'Sign in first'; end if;
 s := coalesce(p_settings,'{}'::jsonb);
 s := jsonb_set(s,'{maxPlayers}',to_jsonb(greatest(2,least(8,coalesce((s->>'maxPlayers')::int,2)))),true);
 loop
   code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
   begin
     insert into public.online_custom_rooms(room_code,host_id,settings,region) values (code,u,s,coalesce(s->>'region','NA-EAST')) returning * into r;
     exit;
   exception when unique_violation then end;
 end loop;
 insert into public.online_custom_room_players(room_id,user_id,player_slot,loadout)
 values(r.id,u,1,jsonb_build_object('character_id',coalesce(s->>'characterId','yellow')));
 return jsonb_build_object('room_id',r.id,'room_code',r.room_code,'role','host','seed',r.random_seed);
end $$;

grant execute on function public.create_element6_custom_room(jsonb) to authenticated;

-- ================================================================
-- DIRECT TRADE/GIFT RECORDS (cloud, not browser-local)
-- ================================================================
create table if not exists public.element6_trade_gifts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('gift','trade_request','trade_completed')),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  from_username text not null,
  to_username text not null,
  status text not null default 'pending' check (status in ('pending','completed','declined')),
  give jsonb not null default '{}'::jsonb,
  request jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);
create index if not exists element6_trade_gifts_to_idx on public.element6_trade_gifts(to_user_id,created_at desc);
create index if not exists element6_trade_gifts_from_idx on public.element6_trade_gifts(from_user_id,created_at desc);
alter table public.element6_trade_gifts enable row level security;
drop policy if exists element6_trade_gifts_read on public.element6_trade_gifts;
create policy element6_trade_gifts_read on public.element6_trade_gifts for select to authenticated using (auth.uid()=from_user_id or auth.uid()=to_user_id);
drop policy if exists element6_trade_gifts_insert on public.element6_trade_gifts;
create policy element6_trade_gifts_insert on public.element6_trade_gifts for insert to authenticated with check (auth.uid()=from_user_id);
drop policy if exists element6_trade_gifts_update on public.element6_trade_gifts;
create policy element6_trade_gifts_update on public.element6_trade_gifts for update to authenticated using (auth.uid()=to_user_id or auth.uid()=from_user_id) with check (auth.uid()=to_user_id or auth.uid()=from_user_id);

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='element6_trade_gifts') then alter publication supabase_realtime add table public.element6_trade_gifts; end if;
end $$;

-- ================================================================
-- THREE-PERSON COMMUNITY FOUNDING
-- ================================================================
create table if not exists public.element6_community_foundings (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references auth.users(id) on delete cascade,
  invitee_one uuid not null references auth.users(id) on delete cascade,
  invitee_two uuid not null references auth.users(id) on delete cascade,
  clan_name text not null,
  clan_tag text not null,
  clan_bio text not null default '',
  clan_icon_url text,
  status text not null default 'active' check(status in ('active','completed','expired','cancelled')),
  expires_at timestamptz not null default now()+interval '24 hours',
  created_at timestamptz not null default now(),
  unique(founder_id,invitee_one,invitee_two)
);
create table if not exists public.element6_community_founding_payments (
  session_id uuid not null references public.element6_community_foundings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  paid_at timestamptz not null default now(),
  primary key(session_id,user_id)
);
alter table public.element6_community_foundings enable row level security;
alter table public.element6_community_founding_payments enable row level security;
drop policy if exists community_foundings_participants on public.element6_community_foundings;
create policy community_foundings_participants on public.element6_community_foundings for select to authenticated using (auth.uid()=founder_id or auth.uid()=invitee_one or auth.uid()=invitee_two);
drop policy if exists community_foundings_payments_participants on public.element6_community_founding_payments;
create policy community_foundings_payments_participants on public.element6_community_founding_payments for select to authenticated using (exists(select 1 from public.element6_community_foundings f where f.id=session_id and (f.founder_id=auth.uid() or f.invitee_one=auth.uid() or f.invitee_two=auth.uid())));

create or replace function public.element6_start_community_founding(
 p_invitee_one_username text,p_invitee_two_username text,p_name text,p_tag text,p_bio text default '',p_icon_url text default null
)
returns jsonb language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); a uuid; b uuid; sid uuid; msg text;
begin
 if u is null then raise exception 'Sign in first'; end if;
 if exists(select 1 from public.element6_clan_members where user_id=u) then raise exception 'You are already in a clan'; end if;
 select user_id into a from public.player_profiles where lower(username)=lower(trim(p_invitee_one_username)) limit 1;
 select user_id into b from public.player_profiles where lower(username)=lower(trim(p_invitee_two_username)) limit 1;
 if a is null or b is null then raise exception 'Both usernames must belong to existing players'; end if;
 if a=b or a=u or b=u then raise exception 'Choose two different players who are not you'; end if;
 if exists(select 1 from public.element6_clan_members where user_id in(a,b)) then raise exception 'Every founder must currently be clan-free'; end if;
 if coalesce(length(trim(p_name)),0)<2 or coalesce(length(trim(p_tag)),0)<2 then raise exception 'Enter a clan name and tag first'; end if;
 insert into public.element6_community_foundings(founder_id,invitee_one,invitee_two,clan_name,clan_tag,clan_bio,clan_icon_url)
 values(u,a,b,trim(p_name),upper(trim(p_tag)),coalesce(p_bio,''),p_icon_url) returning id into sid;
 msg := 'You have been requested to Found a clan! Click here to accept! (5000 Tokens) [E6CLAN_INVITE:'||sid::text||']';
 insert into public.player_direct_messages(sender_id,recipient_id,sender_username,body)
 select u,a,'Element 6',msg where a is not null;
 insert into public.player_direct_messages(sender_id,recipient_id,sender_username,body)
 select u,b,'Element 6',msg where b is not null;
 return jsonb_build_object('session_id',sid,'expires_at',(select expires_at from public.element6_community_foundings where id=sid),'invitees',jsonb_build_array(a,b));
end $$;

grant execute on function public.element6_start_community_founding(text,text,text,text,text,text) to authenticated;

create or replace function public.element6_pay_community_founding(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare f public.element6_community_foundings%rowtype; u uuid:=auth.uid(); paid integer; clan public.element6_clans%rowtype;
begin
 select * into f from public.element6_community_foundings where id=p_session_id for update;
 if f.id is null then raise exception 'Founding request not found'; end if;
 if f.status<>'active' or f.expires_at<=now() then update public.element6_community_foundings set status='expired' where id=f.id; raise exception 'This founding request has expired'; end if;
 if u<>f.founder_id and u<>f.invitee_one and u<>f.invitee_two then raise exception 'You are not one of the three founders'; end if;
 if exists(select 1 from public.element6_clan_members where user_id=u) then raise exception 'You are already in a clan'; end if;
 insert into public.element6_community_founding_payments(session_id,user_id) values(f.id,u) on conflict do nothing;
 select count(*) into paid from public.element6_community_founding_payments where session_id=f.id;
 if paid<3 then return jsonb_build_object('complete',false,'paid',paid,'required',3); end if;
 if exists(select 1 from public.element6_clan_members where user_id in(f.founder_id,f.invitee_one,f.invitee_two)) then raise exception 'A founder joined a clan before completion'; end if;
 insert into public.element6_clans(name,tag,bio,icon_url,owner_id)
 values(f.clan_name,f.clan_tag,f.clan_bio,f.clan_icon_url,f.founder_id) returning * into clan;
 insert into public.element6_clan_members(clan_id,user_id,role) values
   (clan.id,f.founder_id,'leader'),(clan.id,f.invitee_one,'leader'),(clan.id,f.invitee_two,'leader');
 update public.element6_community_foundings set status='completed' where id=f.id;
 return jsonb_build_object('complete',true,'paid',3,'clan',to_jsonb(clan));
end $$;

grant execute on function public.element6_pay_community_founding(uuid) to authenticated;

-- Multi-founder clans cannot have one founder demoted/kicked by another. Existing
-- role/removal functions already protect leader targets; also block ownership
-- transfer for clans with more than one leader.
create or replace function public.element6_transfer_clan_ownership(p_new_owner uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_clan uuid; v_leaders integer;
begin
 select clan_id into v_clan from public.element6_clan_members where user_id=v_user and role='leader';
 if v_clan is null then raise exception 'Only a leader can transfer ownership'; end if;
 select count(*) into v_leaders from public.element6_clan_members where clan_id=v_clan and role='leader';
 if v_leaders>1 then raise exception 'Community-founded clans have shared leadership and cannot transfer ownership'; end if;
 if not exists(select 1 from public.element6_clan_members where clan_id=v_clan and user_id=p_new_owner) then raise exception 'New owner must be a clan member'; end if;
 update public.element6_clan_members set role='lieutenant' where clan_id=v_clan and user_id=v_user;
 update public.element6_clan_members set role='leader' where clan_id=v_clan and user_id=p_new_owner;
 update public.element6_clans set owner_id=p_new_owner,updated_at=now() where id=v_clan;
end $$;

grant execute on function public.element6_transfer_clan_ownership(uuid) to authenticated;

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='element6_community_foundings') then alter publication supabase_realtime add table public.element6_community_foundings; end if;
end $$;


-- Atomic cloud trade acceptance. Both progress rows are changed in one server-side transaction.
create or replace function public.element6_accept_trade(p_trade_id uuid,p_accept boolean default true)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
 t public.element6_trade_gifts%rowtype;
 me uuid:=auth.uid();
 sender jsonb; receiver jsonb; give jsonb; req jsonb;
 k text; base_key text;
begin
 if me is null then raise exception 'Sign in first'; end if;
 select * into t from public.element6_trade_gifts where id=p_trade_id for update;
 if t.id is null or t.to_user_id<>me or t.type<>'trade_request' or t.status<>'pending' then raise exception 'Trade is no longer pending'; end if;
 if not p_accept then update public.element6_trade_gifts set status='declined' where id=t.id; return jsonb_build_object('accepted',false); end if;
 select progress_json into receiver from public.user_progress where user_id=t.to_user_id for update;
 select progress_json into sender from public.user_progress where user_id=t.from_user_id for update;
 receiver:=coalesce(receiver,'{}'::jsonb); sender:=coalesce(sender,'{}'::jsonb); give:=coalesce(t.give,'{}'::jsonb); req:=coalesce(t.request,'{}'::jsonb);
 if coalesce((give->>'tokens')::numeric,0) > coalesce((sender->>'coins')::numeric,0) then raise exception 'Sender no longer has enough tokens'; end if;
 if coalesce((req->>'tokens')::numeric,0) > coalesce((receiver->>'coins')::numeric,0) then raise exception 'You no longer have enough tokens'; end if;
 receiver:=jsonb_set(receiver,'{coins}',to_jsonb(greatest(0,coalesce((receiver->>'coins')::numeric,0)+coalesce((give->>'tokens')::numeric,0)-coalesce((req->>'tokens')::numeric,0))),true);
 sender:=jsonb_set(sender,'{coins}',to_jsonb(greatest(0,coalesce((sender->>'coins')::numeric,0)-coalesce((give->>'tokens')::numeric,0)+coalesce((req->>'tokens')::numeric,0))),true);
 foreach k in array['skins','accessories','killFX','chars'] loop
   base_key:=case k when 'skins' then 'ownedSkins' when 'accessories' then 'ownedAccessories' when 'killFX' then 'ownedKillFX' else 'unlockedIds' end;
   receiver:=jsonb_set(receiver,ARRAY[base_key],coalesce((select jsonb_agg(v) from (select distinct value as v from jsonb_array_elements_text(coalesce(receiver->base_key,'[]'::jsonb)) where not exists(select 1 from jsonb_array_elements_text(coalesce(req->k,'[]'::jsonb)) r where r.value=value) union select distinct value from jsonb_array_elements_text(coalesce(give->k,'[]'::jsonb))) q),'[]'::jsonb),true);
   sender:=jsonb_set(sender,ARRAY[base_key],coalesce((select jsonb_agg(v) from (select distinct value as v from jsonb_array_elements_text(coalesce(sender->base_key,'[]'::jsonb)) where not exists(select 1 from jsonb_array_elements_text(coalesce(give->k,'[]'::jsonb)) g where g.value=value) union select distinct value from jsonb_array_elements_text(coalesce(req->k,'[]'::jsonb))) q),'[]'::jsonb),true);
 end loop;
 update public.user_progress set progress_json=receiver,updated_at=now() where user_id=t.to_user_id;
 update public.user_progress set progress_json=sender,updated_at=now() where user_id=t.from_user_id;
 update public.element6_trade_gifts set status='completed',type='trade_completed' where id=t.id;
 return jsonb_build_object('accepted',true,'trade_id',t.id);
end $$;
grant execute on function public.element6_accept_trade(uuid,boolean) to authenticated;


create or replace function public.element6_send_gift(p_to_user uuid,p_to_username text,p_from_username text,p_give jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare me uuid:=auth.uid(); prog jsonb; give jsonb:=coalesce(p_give,'{}'::jsonb); rid uuid; k text; base_key text;
begin
 if me is null then raise exception 'Sign in first'; end if;
 if p_to_user is null or p_to_user=me then raise exception 'Invalid recipient'; end if;
 select progress_json into prog from public.user_progress where user_id=me for update;
 prog:=coalesce(prog,'{}'::jsonb);
 if coalesce((give->>'tokens')::numeric,0)>coalesce((prog->>'coins')::numeric,0) then raise exception 'Not enough tokens'; end if;
 prog:=jsonb_set(prog,'{coins}',to_jsonb(greatest(0,coalesce((prog->>'coins')::numeric,0)-coalesce((give->>'tokens')::numeric,0))),true);
 foreach k in array['skins','accessories','killFX','chars'] loop
   base_key:=case k when 'skins' then 'ownedSkins' when 'accessories' then 'ownedAccessories' when 'killFX' then 'ownedKillFX' else 'unlockedIds' end;
   if jsonb_array_length(coalesce(give->k,'[]'::jsonb))>0 then
     if exists(select 1 from jsonb_array_elements_text(coalesce(give->k,'[]'::jsonb)) x where not exists(select 1 from jsonb_array_elements_text(coalesce(prog->base_key,'[]'::jsonb)) o where o.value=x.value)) then raise exception 'You do not own every gifted item'; end if;
     prog:=jsonb_set(prog,ARRAY[base_key],coalesce((select jsonb_agg(value) from jsonb_array_elements_text(coalesce(prog->base_key,'[]'::jsonb)) where not exists(select 1 from jsonb_array_elements_text(coalesce(give->k,'[]'::jsonb)) g where g.value=value)),'[]'::jsonb),true);
   end if;
 end loop;
 update public.user_progress set progress_json=prog,updated_at=now() where user_id=me;
 insert into public.element6_trade_gifts(type,from_user_id,to_user_id,from_username,to_username,status,give) values('gift',me,p_to_user,coalesce(p_from_username,'Player'),coalesce(p_to_username,'Player'),'completed',give) returning id into rid;
 insert into public.player_direct_messages(sender_id,recipient_id,sender_username,body) values(me,p_to_user,coalesce(p_from_username,'Player'),'🎁 Sent you a gift! Open this chat to receive it.');
 return jsonb_build_object('gift_id',rid,'sent',true);
end $$;
grant execute on function public.element6_send_gift(uuid,text,text,jsonb) to authenticated;

commit;
