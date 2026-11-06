-- Apply after Supabase-online-sports-setup.sql, Supabase-custom-room-ready-controls.sql,
-- and Supabase-party-linked-custom-rooms.sql. Adds Custom Room support only for
-- the sport renderers that already expose the shared host/state/input contract.
begin;

alter table public.online_custom_rooms add column if not exists host_epoch bigint not null default 0;

-- Heartbeats also perform server-serialized active-match host recovery. The
-- prior renderer checkpoint is returned so the newly elected host can resume
-- from the last accepted state instead of starting another simulation.
create or replace function public.element6_heartbeat_custom_room(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_room public.online_custom_rooms%rowtype; v_next_host uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  update public.online_custom_room_players set last_seen_at=now()
   where room_id=p_room_id and user_id=v_user;
  if not found then raise exception 'You are not a participant in this room'; end if;
  select * into v_room from public.online_custom_rooms where id=p_room_id for update;
  if v_room.id is null then raise exception 'Room not found'; end if;
  if v_room.status in ('waiting','playing') and not exists(
    select 1 from public.online_custom_room_players p where p.room_id=p_room_id and p.user_id=v_room.host_id and p.last_seen_at>now()-interval '20 seconds'
  ) then
    select p.user_id into v_next_host from public.online_custom_room_players p
     where p.room_id=p_room_id and p.user_id is not null and p.last_seen_at>now()-interval '20 seconds'
     order by p.joined_at,p.player_slot,p.user_id limit 1;
    if v_next_host is not null then
      update public.online_custom_rooms set host_id=v_next_host,host_epoch=host_epoch+1,updated_at=now()
       where id=p_room_id returning * into v_room;
    end if;
  end if;
  return jsonb_build_object('ok',true,'status',v_room.status,'host_id',v_room.host_id,
    'host_epoch',v_room.host_epoch,'game_state',v_room.authoritative_state->'game_state');
end $$;

create or replace function public.element6_custom_room_mode_limit(p_mode text)
returns integer language sql immutable as $$
  select case p_mode
    when 'fight' then 8
    when 'banger' then 6
    when 'soccer' then 2
    when 'volleyball' then 2
    when 'dodgeball' then 2
    else 0
  end;
$$;
revoke all on function public.element6_custom_room_mode_limit(text) from public,anon,authenticated;

create or replace function public.create_element6_custom_room(p_settings jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid(); v_settings jsonb:=coalesce(p_settings,'{}'::jsonb);
  v_mode text; v_limit integer; v_code text; v_room public.online_custom_rooms%rowtype;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  if jsonb_typeof(v_settings) is distinct from 'object' or octet_length(v_settings::text)>100000 then raise exception 'Room settings are invalid or too large'; end if;
  v_mode:=coalesce(v_settings->>'mode','fight');
  if public.element6_custom_room_mode_limit(v_mode)=0 then raise exception 'This mode has no shared Custom Room renderer'; end if;
  if coalesce(v_settings->>'maxPlayers','') !~ '^[0-9]{1,2}$' then raise exception 'Player capacity must be a whole number'; end if;
  v_limit:=(v_settings->>'maxPlayers')::integer;
  if v_mode='fight' and v_limit between 2 and 8 then null;
  elsif v_mode='volleyball' and v_limit=2 then null;
  elsif v_limit<>public.element6_custom_room_mode_limit(v_mode) then
    raise exception 'This mode requires a roster of % players',public.element6_custom_room_mode_limit(v_mode);
  end if;
  if v_limit<2 or v_limit>public.element6_custom_room_mode_limit(v_mode) then raise exception 'The selected mode player capacity is invalid'; end if;
  if v_settings ? 'bots' and jsonb_typeof(v_settings->'bots') is distinct from 'array' then raise exception 'The room bot list is invalid'; end if;
  if v_mode<>'fight' and jsonb_array_length(coalesce(v_settings->'bots','[]'::jsonb))>0 then raise exception 'Sports Custom Rooms require human players'; end if;
  if v_settings ? 'stagePlatforms' and jsonb_typeof(v_settings->'stagePlatforms') is distinct from 'array' then raise exception 'Stage data is invalid'; end if;
  if v_settings ? 'stageSpawnPoints' and jsonb_typeof(v_settings->'stageSpawnPoints') is distinct from 'array' then raise exception 'Stage spawn data is invalid'; end if;
  perform public.validate_element6_custom_room_stage_data(v_settings);
  if exists(select 1 from public.online_custom_rooms where host_id=v_user and status in ('waiting','playing'))
     or exists(select 1 from public.online_custom_room_players p join public.online_custom_rooms r on r.id=p.room_id where p.user_id=v_user and r.status in ('waiting','playing')) then
    raise exception 'You are already in an active Custom Room';
  end if;
  loop
    v_code:=upper(substr(md5(random()::text||clock_timestamp()::text),1,6));
    begin
      insert into public.online_custom_rooms(room_code,host_id,settings,region)
      values(v_code,v_user,v_settings,coalesce(v_settings->>'region','NA-EAST')) returning * into v_room;
      exit;
    exception when unique_violation then
      if exists(select 1 from public.online_custom_rooms where host_id=v_user and status in ('waiting','playing')) then raise exception 'You are already in an active Custom Room'; end if;
    end;
  end loop;
  insert into public.online_custom_room_players(room_id,user_id,player_slot,loadout,ready)
  values(v_room.id,v_user,1,jsonb_build_object('character_id',coalesce(v_settings->>'characterId','yellow'),'element',coalesce(v_settings->>'element','basic')),false);
  return jsonb_build_object('room_id',v_room.id,'room_code',v_room.room_code,'role','host','seed',v_room.random_seed);
end $$;

create or replace function public.join_element6_custom_room(p_room_code text,p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid(); v_room public.online_custom_rooms%rowtype; v_mode text; v_limit integer;
  v_slot smallint; v_count integer; v_next_host uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  select * into v_room from public.online_custom_rooms where room_code=upper(trim(p_room_code)) and status='waiting' for update;
  if v_room.id is null then raise exception 'Room is unavailable'; end if;
  if v_room.party_id is not null and not exists(select 1 from public.element6_party_members m where m.party_id=v_room.party_id and m.user_id=v_user) then raise exception 'This room is reserved for its party'; end if;
  delete from public.online_custom_room_players where room_id=v_room.id and user_id<>v_user and last_seen_at<=now()-interval '25 seconds';
  v_mode:=coalesce(v_room.settings->>'mode','fight'); v_limit:=coalesce((v_room.settings->>'maxPlayers')::integer,0);
  if public.element6_custom_room_mode_limit(v_mode)=0 or v_limit<2 or v_limit>public.element6_custom_room_mode_limit(v_mode) then raise exception 'Room mode or capacity is invalid'; end if;
  if v_mode='banger' and v_limit<>6 or v_mode in ('soccer','volleyball','dodgeball') and v_limit<>2 then raise exception 'The selected sport requires a fixed player count'; end if;
  if v_room.settings ? 'bots' and jsonb_typeof(v_room.settings->'bots') is distinct from 'array' then raise exception 'The room bot list is invalid'; end if;
  if v_mode<>'fight' and jsonb_array_length(coalesce(v_room.settings->'bots','[]'::jsonb))>0 then raise exception 'Sports Custom Rooms do not support bots'; end if;
  if exists(select 1 from public.online_custom_room_players p join public.online_custom_rooms r on r.id=p.room_id where p.user_id=v_user and p.room_id<>v_room.id and r.status in ('waiting','playing')) then raise exception 'You are already in another Custom Room'; end if;
  select player_slot into v_slot from public.online_custom_room_players where room_id=v_room.id and user_id=v_user;
  if v_slot is null then
    select count(*) into v_count from public.online_custom_room_players where room_id=v_room.id and user_id is not null;
    if v_count+jsonb_array_length(coalesce(v_room.settings->'bots','[]'::jsonb))>=v_limit then raise exception 'Room is full'; end if;
    select free_slot.slot into v_slot from generate_series(1,v_limit) as free_slot(slot)
     where not exists(select 1 from public.online_custom_room_players p where p.room_id=v_room.id and p.player_slot=free_slot.slot)
       and not exists(select 1 from jsonb_array_elements(coalesce(v_room.settings->'bots','[]'::jsonb)) as bot(value) where (case when coalesce(bot.value->>'slot','')~'^[0-7]$' then (bot.value->>'slot')::integer else -1 end)=free_slot.slot-1)
     order by free_slot.slot limit 1;
    if v_slot is null then raise exception 'Room is full'; end if;
    insert into public.online_custom_room_players(room_id,user_id,player_slot,loadout,ready) values(v_room.id,v_user,v_slot,coalesce(p_loadout,'{}'::jsonb),false);
  else update public.online_custom_room_players set last_seen_at=now() where room_id=v_room.id and user_id=v_user;
  end if;
  if not exists(select 1 from public.online_custom_room_players p where p.room_id=v_room.id and p.user_id=v_room.host_id and p.last_seen_at>now()-interval '25 seconds') then
    select p.user_id into v_next_host from public.online_custom_room_players p where p.room_id=v_room.id and p.last_seen_at>now()-interval '25 seconds' order by p.joined_at,p.player_slot limit 1;
    if v_next_host is not null then update public.online_custom_rooms set host_id=v_next_host,host_epoch=host_epoch+1,updated_at=now() where id=v_room.id returning * into v_room; end if;
  end if;
  return jsonb_build_object('room_id',v_room.id,'room_code',v_room.room_code,'role',case when v_room.host_id=v_user then 'host' else 'guest' end,'slot',v_slot,'seed',v_room.random_seed);
end $$;

-- Keep host election consistent whether a room is being polled, joined, or
-- heartbeated. The epoch fences stale broadcasts from the former host.
create or replace function public.element6_custom_room_snapshot(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_room public.online_custom_rooms%rowtype; v_players jsonb; v_next_host uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not public.is_element6_custom_room_participant(p_room_id,auth.uid()) then raise exception 'You are not a participant in this room'; end if;
  select * into v_room from public.online_custom_rooms where id=p_room_id for update;
  if v_room.id is null then raise exception 'Room not found'; end if;
  if v_room.status='waiting' and not exists(
    select 1 from public.online_custom_room_players p where p.room_id=v_room.id and p.user_id=v_room.host_id and p.last_seen_at>now()-interval '20 seconds'
  ) then
    select p.user_id into v_next_host from public.online_custom_room_players p
      where p.room_id=v_room.id and p.user_id is not null and p.last_seen_at>now()-interval '20 seconds'
      order by p.joined_at,p.player_slot,p.user_id limit 1;
    if v_next_host is not null then
      update public.online_custom_rooms set host_id=v_next_host,host_epoch=host_epoch+1,updated_at=now()
        where id=v_room.id and status='waiting' returning * into v_room;
    end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'player_slot',p.player_slot,'user_id',p.user_id,'loadout',p.loadout,'ready',p.ready,
    'connected',p.last_seen_at>now()-interval '25 seconds',
    'username',coalesce(pp.username,'Player'),
    'title',nullif(up.progress_json->>'equippedTitle','')
  ) order by p.player_slot),'[]'::jsonb)
    into v_players from public.online_custom_room_players p
    left join public.player_profiles pp on pp.user_id=p.user_id
    left join public.user_progress up on up.user_id=p.user_id
    where p.room_id=v_room.id;
  return jsonb_build_object('room',to_jsonb(v_room),'players',v_players);
end $$;

-- Explicit leave also hands an active match to the next connected player.
-- If no client remains connected, close the match instead of leaving a
-- permanently ownerless active room.
create or replace function public.leave_element6_custom_room(p_room_id uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_user uuid:=auth.uid(); v_room public.online_custom_rooms%rowtype; v_next_host uuid; v_remaining integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_room from public.online_custom_rooms where id=p_room_id for update;
  if v_room.id is null then return; end if;
  if not public.is_element6_custom_room_participant(p_room_id,v_user) then raise exception 'You are not a room participant'; end if;
  if v_room.status='playing' then
    -- Keep the departed seat in the running match snapshot. Removing it would
    -- change a sport engine's roster mid-match and can unmount the renderer.
    if v_room.host_id=v_user then
      select p.user_id into v_next_host from public.online_custom_room_players p
        where p.room_id=p_room_id and p.user_id is not null and p.user_id<>v_user
          and p.last_seen_at>now()-interval '20 seconds'
        order by p.joined_at,p.player_slot,p.user_id limit 1;
      if v_next_host is null then
        update public.online_custom_room_players set ready=false,last_seen_at=now()-interval '1 day'
          where room_id=p_room_id and user_id=v_user;
        update public.online_custom_rooms set status='cancelled',host_epoch=host_epoch+1,updated_at=now() where id=p_room_id;
        if v_room.party_id is not null then
          update public.element6_parties set status='open',queued_mode=null,active_room_id=null,updated_at=now() where id=v_room.party_id;
        end if;
        return;
      end if;
      update public.online_custom_room_players set ready=false,last_seen_at=now()-interval '1 day'
        where room_id=p_room_id and user_id=v_user;
      update public.online_custom_rooms set host_id=v_next_host,host_epoch=host_epoch+1,updated_at=now() where id=p_room_id;
    else
      update public.online_custom_room_players set ready=false,last_seen_at=now()-interval '1 day'
        where room_id=p_room_id and user_id=v_user;
    end if;
    return;
  end if;
  delete from public.online_custom_room_players where room_id=p_room_id and user_id=v_user;
  select count(*) into v_remaining from public.online_custom_room_players where room_id=p_room_id and user_id is not null;
  if v_room.host_id=v_user then
    select p.user_id into v_next_host from public.online_custom_room_players p
      where p.room_id=p_room_id and p.user_id is not null and p.last_seen_at>now()-interval '20 seconds'
      order by p.joined_at,p.player_slot,p.user_id limit 1;
    if v_next_host is null then
      update public.online_custom_rooms set status='cancelled',host_epoch=host_epoch+1,updated_at=now() where id=p_room_id;
      if v_room.party_id is not null then
        update public.element6_parties set status='open',queued_mode=null,active_room_id=null,updated_at=now() where id=v_room.party_id;
      end if;
      return;
    end if;
    update public.online_custom_rooms set host_id=v_next_host,host_epoch=host_epoch+1,updated_at=now() where id=p_room_id;
  elsif v_remaining=0 then
    update public.online_custom_rooms set status='cancelled',host_epoch=host_epoch+1,updated_at=now() where id=p_room_id;
  end if;
  if v_room.party_id is not null and v_room.status<>'playing' then
    update public.element6_party_members set is_ready=false where party_id=v_room.party_id;
    update public.element6_parties set status='open',queued_mode=null,active_room_id=p_room_id,updated_at=now()
      where id=v_room.party_id and status in ('queued','playing');
  end if;
end $$;

-- Replace the earlier fight-only start gate with the same supported roster
-- contract used by the sport renderer and lobby.
create or replace function public.start_element6_custom_room(p_room_id uuid,p_settings jsonb default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  r public.online_custom_rooms%rowtype; v_humans integer; v_unready integer;
  v_total integer; v_limit integer; v_mode_limit integer; v_mode text; v_expected integer;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into r from public.online_custom_rooms where id=p_room_id for update;
  if r.id is null then raise exception 'Room not found'; end if;
  if r.host_id<>auth.uid() then raise exception 'Only the host can start the room'; end if;
  if r.status<>'waiting' then raise exception 'This room is not waiting to start'; end if;
  update public.online_custom_room_players set last_seen_at=now() where room_id=r.id and user_id=auth.uid();
  if not found then raise exception 'The host is no longer in this room'; end if;
  delete from public.online_custom_room_players where room_id=r.id and user_id<>auth.uid() and last_seen_at<=now()-interval '25 seconds';
  v_mode:=coalesce(r.settings->>'mode','fight');
  v_mode_limit:=public.element6_custom_room_mode_limit(v_mode);
  if v_mode_limit=0 then raise exception 'The selected room mode has no shared renderer'; end if;
  if coalesce(r.settings->>'maxPlayers','') !~ '^[0-9]{1,2}$' then raise exception 'Room capacity is invalid'; end if;
  v_limit:=(r.settings->>'maxPlayers')::integer;
  if v_limit<2 or v_limit>v_mode_limit then raise exception 'Room capacity is invalid for the selected mode'; end if;
  if coalesce(jsonb_typeof(r.settings->'bots'),'array')<>'array' then raise exception 'The room bot list is invalid'; end if;
  select count(*) filter(where p.user_id is not null),count(*) filter(where p.user_id is not null and not p.ready)
    into v_humans,v_unready from public.online_custom_room_players p where p.room_id=r.id;
  if v_humans<2 then raise exception 'At least two human players are required'; end if;
  if v_humans>8 then raise exception 'Custom Rooms support up to eight human players'; end if;
  if v_unready>0 then raise exception 'Every human player must be ready before the host can start'; end if;
  v_total:=v_humans+jsonb_array_length(coalesce(r.settings->'bots','[]'::jsonb));
  if v_mode='fight' then
    if v_total>v_limit then raise exception 'The room exceeds its selected player limit'; end if;
  else
    v_expected:=v_mode_limit;
    if v_limit<>v_expected or v_humans<>v_expected or v_total<>v_expected then
      raise exception 'This sport requires exactly % ready human players and no bots',v_expected;
    end if;
    if exists(select 1 from public.online_custom_room_players p where p.room_id=r.id and p.user_id is null) then
      raise exception 'Sports rooms do not support bot participants';
    end if;
  end if;
  update public.online_custom_rooms set status='playing',updated_at=now() where id=r.id returning * into r;
  if r.party_id is not null then
    update public.element6_parties set status='playing',queued_mode='customrooms',active_room_id=r.id,updated_at=now() where id=r.party_id;
  end if;
  return to_jsonb(r);
end $$;

create or replace function public.update_element6_custom_room_settings_v1(p_room_id uuid,p_settings jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_room public.online_custom_rooms%rowtype; v_settings jsonb:=p_settings; v_mode text; v_limit integer;
  v_humans integer; v_bot jsonb; v_slots integer[]:='{}'::integer[]; v_slot integer; v_difficulty text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if jsonb_typeof(v_settings) is distinct from 'object' or octet_length(v_settings::text)>100000 then raise exception 'Room settings are invalid or too large'; end if;
  select * into v_room from public.online_custom_rooms where id=p_room_id for update;
  if v_room.id is null or v_room.status<>'waiting' then raise exception 'This room is not accepting setting changes'; end if;
  if v_room.host_id<>auth.uid() then raise exception 'Only the host can change room settings'; end if;
  v_mode:=coalesce(v_settings->>'mode','fight');
  if public.element6_custom_room_mode_limit(v_mode)=0 then raise exception 'This mode has no shared Custom Room renderer'; end if;
  if coalesce(v_settings->>'maxPlayers','') !~ '^[0-9]{1,2}$' then raise exception 'Player capacity must be a whole number'; end if;
  v_limit:=(v_settings->>'maxPlayers')::integer;
  if v_mode='fight' then
    if v_limit<2 or v_limit>8 then raise exception 'Fight rooms support 2 to 8 players'; end if;
  elsif v_mode='volleyball' then
    if v_limit<>2 then raise exception 'This volleyball renderer supports two human players'; end if;
  elsif v_limit<>public.element6_custom_room_mode_limit(v_mode) then
    raise exception 'This mode requires exactly % players',public.element6_custom_room_mode_limit(v_mode);
  end if;
  if v_settings ? 'bots' and jsonb_typeof(v_settings->'bots') is distinct from 'array' then raise exception 'The room bot list is invalid'; end if;
  if v_mode<>'fight' and jsonb_array_length(coalesce(v_settings->'bots','[]'::jsonb))>0 then raise exception 'Sports Custom Rooms do not support bots'; end if;
  if v_settings ? 'stagePlatforms' and jsonb_typeof(v_settings->'stagePlatforms') is distinct from 'array' then raise exception 'Stage data is invalid'; end if;
  if v_settings ? 'stageSpawnPoints' and jsonb_typeof(v_settings->'stageSpawnPoints') is distinct from 'array' then raise exception 'Stage spawn data is invalid'; end if;
  perform public.validate_element6_custom_room_stage_data(v_settings);
  select count(*) into v_humans from public.online_custom_room_players p where p.room_id=v_room.id and p.user_id is not null;
  if v_humans>v_limit then raise exception 'Current players exceed the selected capacity'; end if;
  for v_bot in select value from jsonb_array_elements(coalesce(v_settings->'bots','[]'::jsonb)) as item(value) loop
    if jsonb_typeof(v_bot)<>'object' or (v_bot->>'is_bot') is distinct from 'true' then raise exception 'Invalid bot entry'; end if;
    if coalesce(v_bot->>'slot','') !~ '^[0-7]$' then raise exception 'Invalid bot slot'; end if;
    v_slot:=(v_bot->>'slot')::integer;
    if v_slot>=v_limit or v_slot=any(v_slots) then raise exception 'Bot slots must be unique and within room capacity'; end if;
    if exists(select 1 from public.online_custom_room_players p where p.room_id=v_room.id and p.player_slot=v_slot+1) then raise exception 'A bot cannot occupy a human player slot'; end if;
    if coalesce(v_bot->>'char','')='' or char_length(v_bot->>'char')>64 then raise exception 'Invalid bot character'; end if;
    v_difficulty:=coalesce(v_bot->>'difficulty','regular');
    if v_difficulty not in ('newcomer','beginner','easy','amateur','regular','pro','hard','insane','honored') then raise exception 'Invalid bot difficulty'; end if;
    if char_length(coalesce(v_bot->>'name',''))>40 then raise exception 'Bot name is too long'; end if;
    v_slots:=array_append(v_slots,v_slot);
  end loop;
  if v_humans+jsonb_array_length(coalesce(v_settings->'bots','[]'::jsonb))>v_limit then raise exception 'The room exceeds its selected capacity'; end if;
  update public.online_custom_rooms set settings=v_settings,region=coalesce(nullif(v_settings->>'region',''),region),updated_at=now() where id=v_room.id returning * into v_room;
  return to_jsonb(v_room);
end $$;

-- Enforce exact sport rosters atomically at the same status update that starts
-- the room. No local-only copy is allowed to masquerade as a shared match.
create or replace function public.validate_element6_custom_room_start_roster()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_mode text; v_expected integer; v_humans integer; v_bots integer;
begin
  if new.status<>'playing' or old.status='playing' then return new; end if;
  v_mode:=coalesce(new.settings->>'mode','fight');
  if public.element6_custom_room_mode_limit(v_mode)=0 then raise exception 'This room mode has no shared renderer'; end if;
  select count(*) filter(where user_id is not null),count(*) filter(where user_id is null)
    into v_humans,v_bots from public.online_custom_room_players where room_id=new.id;
  v_expected:=case when v_mode='banger' then 6 when v_mode in ('soccer','volleyball','dodgeball') then 2 else null end;
  if v_mode='fight' then
    if v_humans<2 or v_humans+jsonb_array_length(coalesce(new.settings->'bots','[]'::jsonb))>coalesce((new.settings->>'maxPlayers')::integer,8) then raise exception 'Fight room roster does not meet its configured capacity'; end if;
  else
    if v_humans<>v_expected or v_bots>0 or jsonb_array_length(coalesce(new.settings->'bots','[]'::jsonb))>0 then raise exception 'This sport requires exactly % human players and no bots',v_expected; end if;
  end if;
  return new;
end $$;
drop trigger if exists element6_custom_room_start_roster_check on public.online_custom_rooms;
create trigger element6_custom_room_start_roster_check before update of status on public.online_custom_rooms
  for each row execute function public.validate_element6_custom_room_start_roster();

-- Persist bounded host checkpoints for client recovery. Only the current host
-- can submit one, and the state is stored in the room snapshot the participants
-- already fetch after reconnecting.
create or replace function public.element6_custom_room_checkpoint(p_room_id uuid,p_state jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if jsonb_typeof(p_state) is distinct from 'object' or octet_length(p_state::text)>500000 then raise exception 'Room state checkpoint is invalid'; end if;
  update public.online_custom_rooms set authoritative_state=jsonb_set(coalesce(authoritative_state,'{}'::jsonb),'{game_state}',p_state,true),updated_at=now()
   where id=p_room_id and host_id=auth.uid() and status='playing';
  if not found then raise exception 'Only the active room host can checkpoint a running match'; end if;
end $$;

revoke all on function public.create_element6_custom_room(jsonb),public.join_element6_custom_room(text,jsonb),public.update_element6_custom_room_settings_v1(uuid,jsonb),public.validate_element6_custom_room_start_roster(),public.element6_custom_room_checkpoint(uuid,jsonb),public.element6_heartbeat_custom_room(uuid),public.element6_custom_room_snapshot(uuid),public.leave_element6_custom_room(uuid),public.start_element6_custom_room(uuid,jsonb) from public,anon;
grant execute on function public.create_element6_custom_room(jsonb),public.join_element6_custom_room(text,jsonb),public.update_element6_custom_room_settings_v1(uuid,jsonb),public.element6_custom_room_checkpoint(uuid,jsonb),public.element6_heartbeat_custom_room(uuid),public.element6_custom_room_snapshot(uuid),public.leave_element6_custom_room(uuid),public.start_element6_custom_room(uuid,jsonb) to authenticated;

commit;
