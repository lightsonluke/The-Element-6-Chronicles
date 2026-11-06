-- Party-linked Custom Room flow. Apply after the Element 6 party/presence and
-- online Custom Room migrations. Membership remains server-owned on both sides.
begin;

-- Keep this migration safe when party readiness was not added by the earlier hardening migration.
alter table public.element6_party_members
  add column if not exists is_ready boolean not null default false;

alter table public.element6_parties
  add column if not exists active_room_id uuid references public.online_custom_rooms(id) on delete set null,
  add column if not exists active_table_id uuid references public.element6_table_tournaments(id) on delete set null;
alter table public.online_custom_rooms
  add column if not exists party_id uuid references public.element6_parties(id) on delete set null;
create index if not exists online_custom_rooms_party_id_idx
  on public.online_custom_rooms(party_id) where party_id is not null;

create or replace function public.is_element6_custom_room_participant(p_room_id uuid,p_user_id uuid default auth.uid())
returns boolean language sql security definer stable set search_path=public as $$
  select p_user_id=auth.uid() and (
       exists(select 1 from public.online_custom_room_players p where p.room_id=p_room_id and p.user_id=p_user_id)
      or exists(select 1 from public.online_custom_rooms r where r.id=p_room_id and r.host_id=p_user_id)
      or exists(
        select 1 from public.online_custom_rooms r
        join public.element6_party_members m on m.party_id=r.party_id
        where r.id=p_room_id and r.party_id is not null and m.user_id=p_user_id
      ));
$$;

revoke all on function public.is_element6_custom_room_participant(uuid,uuid) from public,anon;
grant execute on function public.is_element6_custom_room_participant(uuid,uuid) to authenticated;

drop policy if exists custom_rooms_global_waiting on public.online_custom_rooms;
create policy custom_rooms_global_waiting on public.online_custom_rooms
  for select to authenticated using (
    status='waiting' and (party_id is null or exists(
      select 1 from public.element6_party_members m where m.party_id=online_custom_rooms.party_id and m.user_id=auth.uid()
    ))
  );
drop policy if exists custom_rooms_participant_access on public.online_custom_rooms;
create policy custom_rooms_participant_access on public.online_custom_rooms
  for select to authenticated using (public.is_element6_custom_room_participant(id,auth.uid()));
drop policy if exists custom_room_players_discovery on public.online_custom_room_players;
create policy custom_room_players_discovery on public.online_custom_room_players
  for select to authenticated using (
    exists(select 1 from public.online_custom_rooms r where r.id=room_id and r.status='waiting' and
      (r.party_id is null or exists(select 1 from public.element6_party_members m where m.party_id=r.party_id and m.user_id=auth.uid())))
    or public.is_element6_custom_room_participant(room_id,auth.uid())
  );

create or replace function public.element6_party_json(p_party_id uuid)
returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object(
    'id',p.id,'party_code',p.party_code,'host_user_id',p.host_user_id,'host_username',p.host_username,
    'name',p.name,'is_public',p.is_public,'status',p.status,'queued_mode',p.queued_mode,
    'active_room_id',p.active_room_id,'active_table_id',p.active_table_id,
    'member_count',(select count(*) from public.element6_party_members m where m.party_id=p.id),
    'members',coalesce((select jsonb_agg(jsonb_build_object(
      'user_id',m.user_id,'username',m.username,'title',(select nullif(up.progress_json->>'equippedTitle','') from public.user_progress up where up.user_id=m.user_id),'slot',m.slot,'spectator',m.spectator,'is_ready',m.is_ready,
      'app_status',case when ap.updated_at>=now()-interval '90 seconds' then ap.app_status else 'offline' end,
      'current_mode',case when ap.updated_at>=now()-interval '90 seconds' then ap.current_mode else null end
    ) order by m.slot) from public.element6_party_members m
      left join public.element6_app_presence ap on ap.user_id=m.user_id where m.party_id=p.id),'[]'::jsonb)
  ) from public.element6_parties p where p.id=p_party_id;
$$;

create or replace function public.element6_party_create_custom_room(p_party_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_party public.element6_parties%rowtype;
  v_settings jsonb;
  v_room_result jsonb;
  v_room_id uuid;
  v_character text;
  v_progress jsonb;
  v_member record;
  v_member_count integer;
  v_unavailable integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null or v_party.host_user_id<>v_user then raise exception 'Only the party host can create its Custom Room'; end if;
  if v_party.status not in ('open','queued') then raise exception 'This party cannot create a room right now'; end if;
  select count(*),count(*) filter(where ap.user_id is null or ap.updated_at<=now()-interval '90 seconds' or ap.app_status='away')
    into v_member_count,v_unavailable
    from public.element6_party_members m
    left join public.element6_app_presence ap on ap.user_id=m.user_id
    where m.party_id=v_party.id;
  if v_member_count<2 then raise exception 'At least two party members are required to create a shared Custom Room'; end if;
  if v_unavailable>0 then raise exception 'Every party member must be online before creating a shared Custom Room'; end if;
  if exists(select 1 from public.element6_party_members m where m.party_id=v_party.id and not m.is_ready) then
    raise exception 'Every party member must be ready before entering its Custom Room';
  end if;
  if exists(select 1 from public.element6_party_members m where m.party_id=v_party.id and m.spectator) then
    raise exception 'Spectator slots are not supported in Custom Rooms yet';
  end if;
  if v_party.active_table_id is not null and exists(select 1 from public.element6_table_tournaments t where t.id=v_party.active_table_id and t.status in ('queue','voting','playing')) then
    raise exception 'Leave the active Table session before creating a Custom Room';
  end if;
  if v_party.active_room_id is not null then
    if exists(select 1 from public.online_custom_rooms r where r.id=v_party.active_room_id and r.status='playing') then
      return public.element6_party_json(v_party.id);
    end if;
    if exists(select 1 from public.online_custom_rooms r where r.id=v_party.active_room_id and r.status='waiting') then
      update public.element6_parties set status='queued',queued_mode='customrooms',updated_at=now() where id=v_party.id;
      return public.element6_party_json(v_party.id);
    end if;
    update public.element6_parties set active_room_id=null where id=v_party.id;
  end if;
  if (select count(*) from public.element6_party_members m where m.party_id=v_party.id)>8 then
    raise exception 'Custom Rooms support up to eight party members';
  end if;

  select progress_json into v_progress from public.user_progress where user_id=v_user;
  v_character:=coalesce(nullif(v_progress->>'favoriteId',''),'yellow');
  v_settings:=jsonb_build_object(
    'mode','fight','maxPlayers',8,'region','NA-EAST','characterId',v_character,
    'stageName','Split City','stagePlatforms','[]'::jsonb,'stageSpawnPoints','[]'::jsonb,
    'bots','[]'::jsonb,'partyLinked',true,'stocks',3,'matchTime',180,
    'equippedSkins',coalesce(v_progress->'equippedSkins','{}'::jsonb),
    'equippedAccessories',coalesce(v_progress->'equippedAccessories','{}'::jsonb),
    'equippedMovementTrails',coalesce(v_progress->'equippedMovementTrails','{}'::jsonb),
    'equippedShikigami',coalesce(v_progress->'equippedShikigami','{}'::jsonb),
    'equippedEmotes',coalesce(v_progress->'equippedEmotes','{}'::jsonb),
    'element',coalesce(v_progress->'equippedElements'->>v_character,'basic')
  );
  v_room_result:=public.create_element6_custom_room(v_settings);
  v_room_id:=(v_room_result->>'room_id')::uuid;
  update public.online_custom_rooms set party_id=v_party.id where id=v_room_id;
  update public.online_custom_room_players rp set player_slot=pm.slot
   from public.element6_party_members pm
   where rp.room_id=v_room_id and rp.user_id=v_user and pm.party_id=v_party.id and pm.user_id=v_user;

  for v_member in
    select m.user_id,m.slot from public.element6_party_members m
    where m.party_id=v_party.id and m.user_id<>v_user order by m.slot
  loop
    select progress_json into v_progress from public.user_progress where user_id=v_member.user_id;
    v_character:=coalesce(nullif(v_progress->>'favoriteId',''),'yellow');
    insert into public.online_custom_room_players(room_id,user_id,player_slot,loadout)
    values(v_room_id,v_member.user_id,v_member.slot,jsonb_build_object(
      'character_id',v_character,
      'equippedSkins',coalesce(v_progress->'equippedSkins','{}'::jsonb),
      'equippedAccessories',coalesce(v_progress->'equippedAccessories','{}'::jsonb),
      'equippedMovementTrails',coalesce(v_progress->'equippedMovementTrails','{}'::jsonb),
      'equippedShikigami',coalesce(v_progress->'equippedShikigami','{}'::jsonb),
      'equippedEmotes',coalesce(v_progress->'equippedEmotes','{}'::jsonb),
      'element',coalesce(v_progress->'equippedElements'->>v_character,'basic')
    ));
  end loop;

  update public.element6_party_members set is_ready=false where party_id=v_party.id;
  update public.element6_parties set status='queued',queued_mode='customrooms',active_room_id=v_room_id,active_table_id=null,updated_at=now()
   where id=v_party.id;
  return public.element6_party_json(v_party.id);
end $$;

create or replace function public.element6_join_party_custom_room(p_party_id uuid,p_room_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_room public.online_custom_rooms%rowtype;
  v_slot smallint;
  v_party_slot smallint;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if not exists(select 1 from public.element6_party_members m where m.party_id=p_party_id and m.user_id=v_user) then
    raise exception 'You are not a member of this party';
  end if;
  select r.* into v_room from public.online_custom_rooms r
   join public.element6_parties p on p.id=r.party_id
   where r.id=p_room_id and p.id=p_party_id and p.active_room_id=r.id and r.status='waiting';
  if v_room.id is null then raise exception 'The party room is no longer available'; end if;
  select player_slot into v_slot from public.online_custom_room_players
   where room_id=p_room_id and user_id=v_user;
  if v_slot is null then
    select slot into v_party_slot from public.element6_party_members where party_id=p_party_id and user_id=v_user;
    v_slot:=v_party_slot;
    if v_slot is null or v_slot<1 or v_slot>coalesce((v_room.settings->>'maxPlayers')::smallint,8) then raise exception 'The party room is full'; end if;
    if exists(select 1 from public.online_custom_room_players where room_id=p_room_id and player_slot=v_slot) then
      raise exception 'Your party slot is already occupied';
    end if;
    insert into public.online_custom_room_players(room_id,user_id,player_slot,loadout)
    values(p_room_id,v_user,v_party_slot,jsonb_build_object('character_id','yellow'));
  end if;
  return jsonb_build_object('room_id',v_room.id,'room_code',v_room.room_code,'role',case when v_room.host_id=v_user then 'host' else 'guest' end,'slot',v_slot,'seed',v_room.random_seed);
end $$;

create or replace function public.join_element6_custom_room(p_room_code text,p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_room public.online_custom_rooms%rowtype;
  v_slot smallint;
  v_count integer;
  v_limit smallint;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_room from public.online_custom_rooms
   where room_code=upper(trim(p_room_code)) and status='waiting' for update;
  if v_room.id is null then raise exception 'Room is unavailable'; end if;
  if v_room.party_id is not null and not exists(
    select 1 from public.element6_party_members m where m.party_id=v_room.party_id and m.user_id=v_user
  ) then raise exception 'This room is reserved for its party'; end if;
  select player_slot into v_slot from public.online_custom_room_players where room_id=v_room.id and user_id=v_user;
  if v_slot is null then
    if exists(select 1 from public.online_custom_room_players p join public.online_custom_rooms r on r.id=p.room_id
      where p.user_id=v_user and p.room_id<>v_room.id and r.status='playing') then
      raise exception 'You are already in an active Custom Room match';
    end if;
    select count(*) into v_count from public.online_custom_room_players where room_id=v_room.id and user_id is not null;
    v_limit:=greatest(2,least(8,coalesce((v_room.settings->>'maxPlayers')::smallint,8)));
    if v_count>=v_limit then raise exception 'Room is full'; end if;
    select s.slot into v_slot from generate_series(1,v_limit) as s(slot)
      where not exists(select 1 from public.online_custom_room_players p where p.room_id=v_room.id and p.player_slot=s.slot)
      order by s.slot limit 1;
    if v_slot is null then raise exception 'Room is full'; end if;
    insert into public.online_custom_room_players(room_id,user_id,player_slot,loadout)
    values(v_room.id,v_user,v_slot,coalesce(p_loadout,'{}'::jsonb));
  end if;
  return jsonb_build_object('room_id',v_room.id,'room_code',v_room.room_code,
    'role',case when v_room.host_id=v_user then 'host' else 'guest' end,'slot',v_slot,'seed',v_room.random_seed);
end $$;

create or replace function public.leave_element6_custom_room(p_room_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_room public.online_custom_rooms%rowtype;
  v_next_host uuid;
  v_remaining integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_room from public.online_custom_rooms where id=p_room_id for update;
  if v_room.id is null then return; end if;
  if not public.is_element6_custom_room_participant(p_room_id,v_user) then raise exception 'You are not a room participant'; end if;
  if v_room.host_id=v_user and v_room.status='playing' then raise exception 'The host cannot leave while the match is active'; end if;
  delete from public.online_custom_room_players where room_id=p_room_id and user_id=v_user;
  select count(*) into v_remaining from public.online_custom_room_players where room_id=p_room_id and user_id is not null;
  if v_room.host_id=v_user then
    select user_id into v_next_host from public.online_custom_room_players where room_id=p_room_id order by player_slot limit 1;
    if v_next_host is null then
      update public.online_custom_rooms set status='cancelled',updated_at=now() where id=p_room_id;
      if v_room.party_id is not null then
        update public.element6_parties set status='open',queued_mode=null,active_room_id=null,updated_at=now() where id=v_room.party_id;
      end if;
      return;
    end if;
    update public.online_custom_rooms set host_id=v_next_host,updated_at=now() where id=p_room_id;
  elsif v_remaining=0 then
    update public.online_custom_rooms set status='cancelled',updated_at=now() where id=p_room_id;
  end if;
  if v_room.party_id is not null then
    update public.element6_party_members set is_ready=false where party_id=v_room.party_id;
    update public.element6_parties set status='open',queued_mode=null,active_room_id=p_room_id,updated_at=now()
     where id=v_room.party_id and status in ('queued','playing');
  end if;
end $$;

create or replace function public.start_element6_custom_room(p_room_id uuid,p_settings jsonb default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  r public.online_custom_rooms%rowtype;
  v_humans integer;
  v_total integer;
  v_limit integer;
  v_mode_limit integer;
  v_mode text;
begin
  select * into r from public.online_custom_rooms where id=p_room_id for update;
  if r.id is null then raise exception 'Room not found'; end if;
  if r.host_id<>auth.uid() then raise exception 'Only the host can start the room'; end if;
  if r.status<>'waiting' then raise exception 'This room is not waiting to start'; end if;
  v_mode:=coalesce(r.settings->>'mode','fight');
  if v_mode not in ('fight','soccer','volleyball','banger') then
    raise exception 'The selected room mode is unavailable';
  end if;
  v_mode_limit:=case when v_mode in ('volleyball','banger') then 6 else 8 end;
  v_limit:=greatest(2,least(v_mode_limit,coalesce((r.settings->>'maxPlayers')::integer,v_mode_limit)));
  if coalesce((r.settings->>'maxPlayers')::integer,v_limit)>v_mode_limit then
    raise exception 'The selected mode supports at most % participants',v_mode_limit;
  end if;
  if coalesce(jsonb_typeof(r.settings->'bots'),'array')<>'array' then
    raise exception 'The room bot list is invalid';
  end if;
  select count(*) into v_humans from public.online_custom_room_players p where p.room_id=r.id and p.user_id is not null;
  if v_humans<2 then raise exception 'At least two human players are required'; end if;
  if v_humans>8 then raise exception 'Custom Rooms support up to eight human players'; end if;
  v_total:=v_humans+jsonb_array_length(coalesce(r.settings->'bots','[]'::jsonb));
  if v_total>v_limit then raise exception 'The room exceeds the selected mode player limit'; end if;
  -- Match settings were saved to the room before Start. Ignore client snapshots
  -- here so a stale or forged p_settings payload cannot bypass room validation.
  update public.online_custom_rooms set status='playing',updated_at=now()
   where id=r.id returning * into r;
  if r.party_id is not null then
    update public.element6_parties set status='playing',queued_mode='customrooms',active_room_id=r.id,updated_at=now()
     where id=r.party_id;
  end if;
  return to_jsonb(r);
end $$;

create or replace function public.finish_element6_custom_room(p_room_id uuid,p_winner text default 'draw')
returns void language plpgsql security definer set search_path=public as $$
declare r public.online_custom_rooms%rowtype;
begin
  select * into r from public.online_custom_rooms where id=p_room_id for update;
  if r.id is null then raise exception 'Room not found'; end if;
  if r.host_id<>auth.uid() then raise exception 'Only the host can finish the match'; end if;
  if r.status<>'playing' then raise exception 'This match is no longer active'; end if;
  update public.online_custom_rooms set status='waiting',updated_at=now(),
    authoritative_state=jsonb_build_object('winner',coalesce(nullif(trim(p_winner),''),'draw')) where id=r.id;
  if r.party_id is not null then
    update public.element6_parties set status='open',queued_mode='customrooms',active_room_id=r.id,updated_at=now()
     where id=r.party_id;
  end if;
end $$;

revoke all on function public.element6_party_create_custom_room(uuid),public.element6_join_party_custom_room(uuid,uuid) from public,anon;
grant execute on function public.element6_party_create_custom_room(uuid),public.element6_join_party_custom_room(uuid,uuid) to authenticated;
grant execute on function public.start_element6_custom_room(uuid,jsonb),public.finish_element6_custom_room(uuid,text) to authenticated;
grant execute on function public.leave_element6_custom_room(uuid) to authenticated;
grant execute on function public.join_element6_custom_room(text,jsonb) to authenticated;

commit;
