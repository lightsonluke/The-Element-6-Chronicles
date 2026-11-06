-- Server-authoritative ready flow for Custom Rooms.
-- Apply after Supabase-party-linked-custom-rooms.sql.
begin;

alter table public.online_custom_room_players
  add column if not exists ready boolean not null default false,
  add column if not exists last_seen_at timestamptz not null default now();
alter table public.community_hub_chat_messages
  add column if not exists sender_title text;
alter table if exists public.player_direct_messages
  add column if not exists sender_title text;

create or replace function public.set_element6_chat_sender_title()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  select nullif(up.progress_json->>'equippedTitle','') into new.sender_title
    from public.user_progress up where up.user_id=new.sender_id;
  return new;
end $$;
drop trigger if exists community_hub_chat_title_snapshot on public.community_hub_chat_messages;
create trigger community_hub_chat_title_snapshot
  before insert on public.community_hub_chat_messages
  for each row execute function public.set_element6_chat_sender_title();

create or replace function public.set_element6_dm_sender_title()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  select nullif(up.progress_json->>'equippedTitle','') into new.sender_title
    from public.user_progress up where up.user_id=new.sender_id;
  return new;
end $$;
do $$ begin
  if to_regclass('public.player_direct_messages') is not null then
    execute 'drop trigger if exists player_direct_messages_title_snapshot on public.player_direct_messages';
    execute 'create trigger player_direct_messages_title_snapshot before insert on public.player_direct_messages for each row execute function public.set_element6_dm_sender_title()';
  end if;
end $$;

-- Hub nametags come from account progress. Ignore any title supplied by a
-- modified client in its presence upsert.
create or replace function public.set_element6_hub_presence_title()
returns trigger language plpgsql security definer set search_path = '' as $E6HUBTITLE$
begin
  select nullif(up.progress_json->>'equippedTitle','')
    into new.title
  from public.user_progress up
  where up.user_id = new.user_id;
  new.title := coalesce(new.title, '');
  return new;
end;
$E6HUBTITLE$;
drop trigger if exists online_hub_presence_title_snapshot on public.online_hub_presence;
create trigger online_hub_presence_title_snapshot
  before insert or update of title,user_id on public.online_hub_presence
  for each row execute function public.set_element6_hub_presence_title();

create index if not exists online_custom_room_players_ready_idx
  on public.online_custom_room_players(room_id,ready);
create index if not exists online_custom_room_players_presence_idx
  on public.online_custom_room_players(room_id,last_seen_at desc);

create or replace function public.enforce_one_active_custom_room_per_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.user_id is null then raise exception 'A room participant must be an authenticated player'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
  if exists(
    select 1 from public.online_custom_room_players p
    join public.online_custom_rooms r on r.id=p.room_id
    where p.user_id=new.user_id and p.room_id<>new.room_id
      and r.status in ('waiting','playing')
  ) then
    raise exception 'You are already in another active Custom Room';
  end if;
  return new;
end $$;

drop trigger if exists online_custom_room_single_active_membership on public.online_custom_room_players;
create trigger online_custom_room_single_active_membership
  before insert or update of room_id,user_id on public.online_custom_room_players
  for each row execute function public.enforce_one_active_custom_room_per_user();

create or replace function public.set_element6_custom_room_ready(p_room_id uuid,p_ready boolean)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_room public.online_custom_rooms%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into v_room from public.online_custom_rooms where id=p_room_id for update;
  if v_room.id is null or v_room.status<>'waiting' then raise exception 'This room is not accepting ready changes'; end if;
  update public.online_custom_room_players
    set ready=coalesce(p_ready,false),last_seen_at=now()
    where room_id=p_room_id and user_id=auth.uid();
  if not found then raise exception 'You are not a player in this room'; end if;
  return coalesce(p_ready,false);
end $$;

create or replace function public.element6_heartbeat_custom_room(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_room public.online_custom_rooms%rowtype;
  v_next_host uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into v_room from public.online_custom_rooms where id=p_room_id for update;
  if v_room.id is null then raise exception 'Room not found'; end if;
  update public.online_custom_room_players set last_seen_at=now()
    where room_id=p_room_id and user_id=auth.uid();
  if not found then raise exception 'You are not a player in this room'; end if;
  if v_room.status='waiting' then
    delete from public.online_custom_room_players where room_id=p_room_id
      and user_id<>auth.uid() and last_seen_at<=now()-interval '25 seconds';
    if not exists(select 1 from public.online_custom_room_players p
        where p.room_id=p_room_id and p.user_id=v_room.host_id and p.last_seen_at>now()-interval '25 seconds') then
      select p.user_id into v_next_host from public.online_custom_room_players p
        where p.room_id=p_room_id and p.last_seen_at>now()-interval '25 seconds'
        order by p.joined_at,p.player_slot limit 1;
      if v_next_host is not null then
        update public.online_custom_rooms set host_id=v_next_host,updated_at=now() where id=p_room_id returning * into v_room;
      end if;
    end if;
  end if;
  return jsonb_build_object('ok',true,'status',v_room.status,'host_id',v_room.host_id);
end $$;

create or replace function public.invalidate_custom_room_ready_on_change()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.settings is distinct from old.settings
     or (old.status='playing' and new.status='waiting') then
    update public.online_custom_room_players set ready=false where room_id=new.id;
  end if;
  return new;
end $$;

drop trigger if exists online_custom_room_ready_invalidation on public.online_custom_rooms;
create trigger online_custom_room_ready_invalidation
  after update of settings,status on public.online_custom_rooms
  for each row execute function public.invalidate_custom_room_ready_on_change();

create or replace function public.validate_element6_custom_room_stage_data(p_settings jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare
  v_item jsonb;
  v_platforms jsonb:=coalesce(p_settings->'stagePlatforms','[]'::jsonb);
  v_spawns jsonb:=coalesce(p_settings->'stageSpawnPoints','[]'::jsonb);
begin
  if jsonb_typeof(v_platforms) is distinct from 'array' then
    raise exception 'Stage platform data is invalid or too large';
  end if;
  if jsonb_array_length(v_platforms)>512 then raise exception 'Stage platform data is invalid or too large'; end if;
  for v_item in select value from jsonb_array_elements(v_platforms) as platform_entry(value) loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or jsonb_typeof(v_item->'x') is distinct from 'number'
       or jsonb_typeof(v_item->'y') is distinct from 'number'
       or jsonb_typeof(v_item->'w') is distinct from 'number'
       or jsonb_typeof(v_item->'h') is distinct from 'number' then
      raise exception 'A stage platform has invalid geometry';
    end if;
    if (v_item->>'x')::numeric not between -10000 and 10000
       or (v_item->>'y')::numeric not between -10000 and 10000
       or (v_item->>'w')::numeric not between 1 and 10000
       or (v_item->>'h')::numeric not between 1 and 10000 then
      raise exception 'A stage platform is outside the supported world bounds';
    end if;
  end loop;
  if jsonb_typeof(v_spawns) is distinct from 'array' then
    raise exception 'Stage spawn data is invalid or too large';
  end if;
  if jsonb_array_length(v_spawns)>8 then raise exception 'Stage spawn data is invalid or too large'; end if;
  for v_item in select value from jsonb_array_elements(v_spawns) as spawn_entry(value) loop
    if jsonb_typeof(v_item) is distinct from 'object'
       or jsonb_typeof(v_item->'x') is distinct from 'number'
       or jsonb_typeof(v_item->'y') is distinct from 'number' then
      raise exception 'A stage spawn point has invalid coordinates';
    end if;
    if (v_item->>'x')::numeric not between -10000 and 10000
       or (v_item->>'y')::numeric not between -10000 and 10000 then
      raise exception 'A stage spawn point is outside the supported world bounds';
    end if;
  end loop;
end $$;

create or replace function public.update_element6_custom_room_settings_v1(p_room_id uuid,p_settings jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_room public.online_custom_rooms%rowtype;
  v_settings jsonb:=p_settings;
  v_mode text;
  v_limit integer;
  v_mode_limit integer;
  v_humans integer;
  v_bot jsonb;
  v_slots integer[]:='{}'::integer[];
  v_slot integer;
  v_difficulty text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if jsonb_typeof(v_settings) is distinct from 'object' or octet_length(v_settings::text)>100000 then
    raise exception 'Room settings are invalid or too large';
  end if;
  select * into v_room from public.online_custom_rooms where id=p_room_id for update;
  if v_room.id is null or v_room.status<>'waiting' then raise exception 'This room is not accepting setting changes'; end if;
  if v_room.host_id<>auth.uid() then raise exception 'Only the host can change room settings'; end if;

  v_mode:=coalesce(v_settings->>'mode','fight');
  if v_mode<>'fight' then raise exception 'This mode does not have a shared Custom Room renderer yet'; end if;
  v_mode_limit:=case when v_mode in ('volleyball','banger') then 6 else 8 end;
  if coalesce(v_settings->>'maxPlayers','') !~ '^[0-9]{1,2}$' then raise exception 'Player capacity must be a whole number'; end if;
  v_limit:=(v_settings->>'maxPlayers')::integer;
  if v_limit<2 or v_limit>v_mode_limit then raise exception 'The selected mode supports 2 to % players',v_mode_limit; end if;
  if v_settings ? 'bots' and jsonb_typeof(v_settings->'bots') is distinct from 'array' then raise exception 'The room bot list is invalid'; end if;
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
    if exists(select 1 from public.online_custom_room_players p where p.room_id=v_room.id and p.player_slot=v_slot+1) then
      raise exception 'A bot cannot occupy a human player slot';
    end if;
    if coalesce(v_bot->>'char','')='' or char_length(v_bot->>'char')>64 then raise exception 'Invalid bot character'; end if;
    v_difficulty:=coalesce(v_bot->>'difficulty','regular');
    if v_difficulty not in ('newcomer','beginner','easy','amateur','regular','pro','hard','insane','honored') then
      raise exception 'Invalid bot difficulty';
    end if;
    if char_length(coalesce(v_bot->>'name',''))>40 then raise exception 'Bot name is too long'; end if;
    v_slots:=array_append(v_slots,v_slot);
  end loop;
  if v_humans+coalesce(jsonb_array_length(v_settings->'bots'),0)>v_limit then
    raise exception 'The room exceeds the selected mode player limit';
  end if;

  update public.online_custom_rooms set settings=v_settings,region=coalesce(nullif(v_settings->>'region',''),region),updated_at=now()
    where id=v_room.id returning * into v_room;
  return to_jsonb(v_room);
end $$;

create or replace function public.create_element6_custom_room(p_settings jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_settings jsonb:=coalesce(p_settings,'{}'::jsonb);
  v_mode text;
  v_mode_limit integer;
  v_limit integer;
  v_code text;
  v_room public.online_custom_rooms%rowtype;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  -- Serialize room creation per account so simultaneous clicks/requests cannot
  -- create two active rooms before the duplicate-membership check completes.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  if jsonb_typeof(v_settings) is distinct from 'object' or octet_length(v_settings::text)>100000 then
    raise exception 'Room settings are invalid or too large';
  end if;
  v_mode:=coalesce(v_settings->>'mode','fight');
  if v_mode<>'fight' then raise exception 'This mode does not have a shared Custom Room renderer yet'; end if;
  v_mode_limit:=case when v_mode in ('volleyball','banger') then 6 else 8 end;
  if coalesce(v_settings->>'maxPlayers','') !~ '^[0-9]{1,2}$' then raise exception 'Player capacity must be a whole number'; end if;
  v_limit:=(v_settings->>'maxPlayers')::integer;
  if v_limit<2 or v_limit>v_mode_limit then raise exception 'The selected mode supports 2 to % players',v_mode_limit; end if;
  if v_settings ? 'bots' and jsonb_typeof(v_settings->'bots') is distinct from 'array' then raise exception 'The room bot list is invalid'; end if;
  if v_settings ? 'stagePlatforms' and jsonb_typeof(v_settings->'stagePlatforms') is distinct from 'array' then raise exception 'Stage data is invalid'; end if;
  if v_settings ? 'stageSpawnPoints' and jsonb_typeof(v_settings->'stageSpawnPoints') is distinct from 'array' then raise exception 'Stage spawn data is invalid'; end if;
  perform public.validate_element6_custom_room_stage_data(v_settings);
  if jsonb_array_length(coalesce(v_settings->'bots','[]'::jsonb))>0 then raise exception 'Create the room first, then add bot slots from its lobby'; end if;
  if exists(select 1 from public.online_custom_rooms where host_id=v_user and status in ('waiting','playing'))
     or exists(select 1 from public.online_custom_room_players p join public.online_custom_rooms r on r.id=p.room_id
       where p.user_id=v_user and r.status in ('waiting','playing')) then
    raise exception 'You are already in an active Custom Room';
  end if;
  loop
    v_code:=upper(substr(md5(random()::text||clock_timestamp()::text),1,6));
    begin
      insert into public.online_custom_rooms(room_code,host_id,settings,region)
      values(v_code,v_user,v_settings,coalesce(v_settings->>'region','NA-EAST')) returning * into v_room;
      exit;
    exception when unique_violation then
      if exists(select 1 from public.online_custom_rooms where host_id=v_user and status in ('waiting','playing')) then
        raise exception 'You are already in an active Custom Room';
      end if;
    end;
  end loop;
  insert into public.online_custom_room_players(room_id,user_id,player_slot,loadout,ready)
  values(v_room.id,v_user,1,jsonb_build_object('character_id',coalesce(v_settings->>'characterId','yellow')),false);
  return jsonb_build_object('room_id',v_room.id,'room_code',v_room.room_code,'role','host','seed',v_room.random_seed);
end $$;

create or replace function public.join_element6_custom_room(p_room_code text,p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_room public.online_custom_rooms%rowtype;
  v_mode text;
  v_mode_limit integer;
  v_limit integer;
  v_slot smallint;
  v_count integer;
  v_next_host uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  -- A user may only occupy one active room; serialize joins across rooms before
  -- checking membership so two simultaneous joins cannot both succeed.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  select * into v_room from public.online_custom_rooms
    where room_code=upper(trim(p_room_code)) and status='waiting' for update;
  if v_room.id is null then raise exception 'Room is unavailable'; end if;
  if v_room.party_id is not null and not exists(select 1 from public.element6_party_members m where m.party_id=v_room.party_id and m.user_id=v_user) then
    raise exception 'This room is reserved for its party';
  end if;
  delete from public.online_custom_room_players where room_id=v_room.id
    and user_id<>v_user and last_seen_at<=now()-interval '25 seconds';
  v_mode:=coalesce(v_room.settings->>'mode','fight');
  if v_mode<>'fight' then raise exception 'This mode does not have a shared Custom Room renderer yet'; end if;
  v_mode_limit:=case when v_mode in ('volleyball','banger') then 6 else 8 end;
  if coalesce(v_room.settings->>'maxPlayers','2') !~ '^[0-9]{1,2}$' then raise exception 'Room capacity is invalid'; end if;
  v_limit:=(v_room.settings->>'maxPlayers')::integer;
  if v_limit<2 or v_limit>v_mode_limit then raise exception 'Room capacity is invalid'; end if;
  if coalesce(jsonb_typeof(v_room.settings->'bots'),'array')<>'array' then raise exception 'The room bot list is invalid'; end if;
  if exists(select 1 from public.online_custom_room_players p join public.online_custom_rooms r on r.id=p.room_id
      where p.user_id=v_user and p.room_id<>v_room.id and r.status in ('waiting','playing')) then
    raise exception 'You are already in another Custom Room';
  end if;
  select player_slot into v_slot from public.online_custom_room_players where room_id=v_room.id and user_id=v_user;
  if v_slot is null then
    select count(*) into v_count from public.online_custom_room_players where room_id=v_room.id and user_id is not null;
    if v_count+jsonb_array_length(coalesce(v_room.settings->'bots','[]'::jsonb))>=v_limit then raise exception 'Room is full'; end if;
    select free_slot.slot into v_slot from generate_series(1,v_limit) as free_slot(slot)
      where not exists(select 1 from public.online_custom_room_players p where p.room_id=v_room.id and p.player_slot=free_slot.slot)
        and not exists(select 1 from jsonb_array_elements(coalesce(v_room.settings->'bots','[]'::jsonb)) as bot(value)
          where (case when coalesce(bot.value->>'slot','') ~ '^[0-7]$' then (bot.value->>'slot')::integer else -1 end)=free_slot.slot-1)
      order by free_slot.slot limit 1;
    if v_slot is null then raise exception 'Room is full'; end if;
    insert into public.online_custom_room_players(room_id,user_id,player_slot,loadout,ready)
      values(v_room.id,v_user,v_slot,coalesce(p_loadout,'{}'::jsonb),false);
  else
    update public.online_custom_room_players set last_seen_at=now() where room_id=v_room.id and user_id=v_user;
  end if;
  if not exists(select 1 from public.online_custom_room_players p where p.room_id=v_room.id and p.user_id=v_room.host_id and p.last_seen_at>now()-interval '25 seconds') then
    select p.user_id into v_next_host from public.online_custom_room_players p
      where p.room_id=v_room.id and p.last_seen_at>now()-interval '25 seconds'
      order by p.joined_at,p.player_slot limit 1;
     if v_next_host is not null then
       update public.online_custom_rooms set host_id=v_next_host,updated_at=now()
         where id=v_room.id returning * into v_room;
     end if;
  end if;
  return jsonb_build_object('room_id',v_room.id,'room_code',v_room.room_code,
    'role',case when v_room.host_id=v_user then 'host' else 'guest' end,'slot',v_slot,'seed',v_room.random_seed);
end $$;

create or replace function public.element6_custom_room_snapshot(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_room public.online_custom_rooms%rowtype;
  v_players jsonb;
  v_next_host uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not public.is_element6_custom_room_participant(p_room_id,auth.uid()) then raise exception 'You are not a participant in this room'; end if;
  select * into v_room from public.online_custom_rooms where id=p_room_id for update;
  if v_room.id is null then raise exception 'Room not found'; end if;
  -- If the owner stopped heartbeating while the room is still in its lobby,
  -- elect the longest-connected live human. Playing matches retain their
  -- current simulation owner so a room snapshot cannot restart a match loop.
  if v_room.status='waiting' and not exists(
    select 1 from public.online_custom_room_players p
     where p.room_id=v_room.id and p.user_id=v_room.host_id
       and p.last_seen_at>now()-interval '25 seconds'
  ) then
    select p.user_id into v_next_host
      from public.online_custom_room_players p
     where p.room_id=v_room.id and p.user_id is not null
       and p.last_seen_at>now()-interval '25 seconds'
     order by p.joined_at,p.player_slot,p.user_id
     limit 1;
    if v_next_host is not null then
      update public.online_custom_rooms set host_id=v_next_host,updated_at=now()
       where id=v_room.id and status='waiting'
       returning * into v_room;
    end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'player_slot',p.player_slot,'user_id',p.user_id,'loadout',p.loadout,'ready',p.ready,
    'connected',p.last_seen_at>now()-interval '25 seconds',
    'username',coalesce(pp.username,'Player'),
    'title',nullif(up.progress_json->>'equippedTitle','')
  ) order by p.player_slot),'[]'::jsonb)
    into v_players
    from public.online_custom_room_players p
    left join public.player_profiles pp on pp.user_id=p.user_id
    left join public.user_progress up on up.user_id=p.user_id
    where p.room_id=v_room.id;
  return jsonb_build_object('room',to_jsonb(v_room),'players',v_players);
end $$;

-- Recover a party whose host disappeared while its lobby is still open. Do
-- this from the authoritative snapshot RPC so every member observes the same
-- leader after the next poll. Active room/Table matches keep their own host
-- lifecycle and are deliberately not changed here.
create or replace function public.element6_get_party_presence()
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_party_id uuid;
  v_party public.element6_parties%rowtype;
  v_host_seen timestamptz;
  v_next_host uuid;
  v_next_name text;
begin
  if v_user is null then return null; end if;
  select m.party_id into v_party_id
    from public.element6_party_members m
    join public.element6_parties p on p.id=m.party_id
   where m.user_id=v_user and p.status in ('open','queued','playing')
   order by p.updated_at desc limit 1;
  if v_party_id is null then return null; end if;

  select * into v_party from public.element6_parties where id=v_party_id for update;
  if v_party.id is null then return null; end if;
  if v_party.status='open' then
    select ap.updated_at into v_host_seen
      from public.element6_app_presence ap where ap.user_id=v_party.host_user_id;
    if v_host_seen is null or v_host_seen<=now()-interval '90 seconds' then
      select m.user_id,m.username into v_next_host,v_next_name
        from public.element6_party_members m
        join public.element6_app_presence ap on ap.user_id=m.user_id
       where m.party_id=v_party.id and m.user_id<>v_party.host_user_id
         and ap.updated_at>now()-interval '90 seconds'
       order by m.joined_at,m.slot,m.user_id
       limit 1;
      if v_next_host is not null then
        update public.element6_parties
           set host_user_id=v_next_host,host_username=v_next_name,updated_at=now()
         where id=v_party.id and host_user_id=v_party.host_user_id and status='open';
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'party',public.element6_party_json(v_party.id),
    'members',coalesce((select jsonb_agg(jsonb_build_object(
      'user_id',m.user_id,'username',m.username,
      'title',nullif(up.progress_json->>'equippedTitle',''),'slot',m.slot,
      'app_status',case when ap.updated_at>=now()-interval '90 seconds' then ap.app_status else 'offline' end,
      'current_mode',case when ap.updated_at>=now()-interval '90 seconds' then ap.current_mode else null end,
      'updated_at',ap.updated_at
    ) order by m.slot)
    from public.element6_party_members m
    left join public.element6_app_presence ap on ap.user_id=m.user_id
    left join public.user_progress up on up.user_id=m.user_id
    where m.party_id=v_party.id),'[]'::jsonb)
  );
end $$;

create or replace function public.update_element6_custom_room_player(p_room_id uuid,p_character_id text,p_loadout jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
declare v_room public.online_custom_rooms%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if p_character_id is null or char_length(p_character_id)>64 then raise exception 'Choose a valid character'; end if;
  if p_loadout is not null and (jsonb_typeof(p_loadout) is distinct from 'object' or octet_length(p_loadout::text)>16000) then
    raise exception 'The player loadout is invalid or too large';
  end if;
  select * into v_room from public.online_custom_rooms where id=p_room_id for update;
  if v_room.id is null or v_room.status<>'waiting' then raise exception 'This room is not accepting loadout changes'; end if;
  update public.online_custom_room_players
    set loadout=coalesce(p_loadout,'{}'::jsonb) || jsonb_build_object('character_id',p_character_id),ready=false
    where room_id=p_room_id and user_id=auth.uid();
  if not found then raise exception 'You are not in this room'; end if;
end $$;

create or replace function public.start_element6_custom_room(p_room_id uuid,p_settings jsonb default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  r public.online_custom_rooms%rowtype;
  v_humans integer;
  v_unready integer;
  v_total integer;
  v_limit integer;
  v_mode_limit integer;
  v_mode text;
begin
  select * into r from public.online_custom_rooms where id=p_room_id for update;
  if r.id is null then raise exception 'Room not found'; end if;
  if r.host_id<>auth.uid() then raise exception 'Only the host can start the room'; end if;
  if r.status<>'waiting' then raise exception 'This room is not waiting to start'; end if;
  update public.online_custom_room_players set last_seen_at=now()
    where room_id=r.id and user_id=auth.uid();
  if not found then raise exception 'The host is no longer in this room'; end if;
  delete from public.online_custom_room_players where room_id=r.id
    and user_id<>auth.uid() and last_seen_at<=now()-interval '25 seconds';
  v_mode:=coalesce(r.settings->>'mode','fight');
  if v_mode<>'fight' then raise exception 'This mode does not have a shared Custom Room renderer yet'; end if;
  v_mode_limit:=case when v_mode in ('volleyball','banger') then 6 else 8 end;
  v_limit:=greatest(2,least(v_mode_limit,coalesce((r.settings->>'maxPlayers')::integer,v_mode_limit)));
  if coalesce((r.settings->>'maxPlayers')::integer,v_limit)>v_mode_limit then
    raise exception 'The selected mode supports at most % participants',v_mode_limit;
  end if;
  if coalesce(jsonb_typeof(r.settings->'bots'),'array')<>'array' then raise exception 'The room bot list is invalid'; end if;
  select count(*),count(*) filter(where not p.ready) into v_humans,v_unready
    from public.online_custom_room_players p where p.room_id=r.id and p.user_id is not null;
  if v_humans<2 then raise exception 'At least two human players are required'; end if;
  if v_humans>8 then raise exception 'Custom Rooms support up to eight human players'; end if;
  if v_unready>0 then raise exception 'Every human player must be ready before the host can start'; end if;
  v_total:=v_humans+jsonb_array_length(coalesce(r.settings->'bots','[]'::jsonb));
  if v_total>v_limit then raise exception 'The room exceeds the selected mode player limit'; end if;
  -- Use the room's saved settings; a client snapshot cannot override them.
  update public.online_custom_rooms set status='playing',updated_at=now()
    where id=r.id returning * into r;
  if r.party_id is not null then
    update public.element6_parties set status='playing',queued_mode='customrooms',active_room_id=r.id,updated_at=now()
      where id=r.party_id;
  end if;
  return to_jsonb(r);
end $$;

revoke all on function public.set_element6_custom_room_ready(uuid,boolean) from public,anon;
revoke all on function public.element6_heartbeat_custom_room(uuid) from public,anon;
revoke all on function public.enforce_one_active_custom_room_per_user() from public,anon,authenticated;
revoke all on function public.set_element6_chat_sender_title() from public,anon,authenticated;
revoke all on function public.set_element6_dm_sender_title() from public,anon,authenticated;
revoke all on function public.validate_element6_custom_room_stage_data(jsonb) from public,anon,authenticated;
revoke all on function public.update_element6_custom_room_settings_v1(uuid,jsonb) from public,anon;
revoke all on function public.create_element6_custom_room(jsonb) from public,anon;
revoke all on function public.join_element6_custom_room(text,jsonb) from public,anon;
revoke all on function public.update_element6_custom_room_player(uuid,text,jsonb) from public,anon;
revoke all on function public.start_element6_custom_room(uuid,jsonb) from public,anon;
revoke all on function public.element6_custom_room_snapshot(uuid) from public,anon;
grant execute on function public.set_element6_custom_room_ready(uuid,boolean) to authenticated;
grant execute on function public.element6_heartbeat_custom_room(uuid) to authenticated;
grant execute on function public.update_element6_custom_room_settings_v1(uuid,jsonb) to authenticated;
grant execute on function public.create_element6_custom_room(jsonb) to authenticated;
grant execute on function public.join_element6_custom_room(text,jsonb) to authenticated;
grant execute on function public.update_element6_custom_room_player(uuid,text,jsonb) to authenticated;
grant execute on function public.start_element6_custom_room(uuid,jsonb) to authenticated;
grant execute on function public.element6_custom_room_snapshot(uuid) to authenticated;
revoke all on function public.element6_get_party_presence() from public,anon;
grant execute on function public.element6_get_party_presence() to authenticated;

-- All room and slot mutation goes through validated RPCs; clients may only read.
revoke insert,update,delete on public.online_custom_rooms from public,anon,authenticated;
revoke insert,update,delete on public.online_custom_room_players from public,anon,authenticated;

commit;
