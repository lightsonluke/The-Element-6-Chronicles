-- Party sports launch and active sports-host recovery.
-- Apply after Supabase-online-sports-setup.sql,
-- Supabase-party-table-integration.sql, and Supabase-party-linked-custom-rooms.sql.
begin;

alter table public.element6_parties
  add column if not exists active_sport_match_id uuid
    references public.online_sport_matches(id) on delete set null;
alter table public.online_sport_matches
  add column if not exists party_id uuid
    references public.element6_parties(id) on delete set null,
  add column if not exists host_epoch bigint not null default 0;

create index if not exists online_sport_matches_party_active_idx
  on public.online_sport_matches(party_id, status)
  where party_id is not null;

-- Keep the party snapshot complete for every PartyScreen polling client.
create or replace function public.element6_party_json(p_party_id uuid)
returns jsonb
language sql
security definer
set search_path=pg_catalog,public
stable
as $$
  select jsonb_build_object(
    'id',p.id,'party_code',p.party_code,'host_user_id',p.host_user_id,
    'host_username',p.host_username,'name',p.name,'is_public',p.is_public,
    'status',p.status,'queued_mode',p.queued_mode,
    'active_room_id',p.active_room_id,'active_table_id',p.active_table_id,
    'active_sport_match_id',p.active_sport_match_id,
    'member_count',(select count(*) from public.element6_party_members m where m.party_id=p.id),
    'members',coalesce((select jsonb_agg(jsonb_build_object(
      'user_id',m.user_id,'username',m.username,
      'title',(select nullif(up.progress_json->>'equippedTitle','') from public.user_progress up where up.user_id=m.user_id),
      'slot',m.slot,'spectator',m.spectator,'is_ready',m.is_ready,
      'app_status',case when ap.updated_at>=now()-interval '90 seconds' then ap.app_status else 'offline' end,
      'current_mode',case when ap.updated_at>=now()-interval '90 seconds' then ap.current_mode else null end
    ) order by m.slot) from public.element6_party_members m
      left join public.element6_app_presence ap on ap.user_id=m.user_id
      where m.party_id=p.id),'[]'::jsonb)
  )
  from public.element6_parties p where p.id=p_party_id;
$$;

create or replace function public.element6_party_queue_online_sport(
  p_party_id uuid,
  p_mode text
) returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_user uuid:=auth.uid();
  v_party public.element6_parties%rowtype;
  v_match public.online_sport_matches%rowtype;
  v_required smallint;
  v_count integer;
  v_unready integer;
  v_unavailable integer;
  v_member record;
  v_slot smallint:=0;
  v_team smallint;
  v_progress jsonb;
  v_character text;
  v_loadout jsonb;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_mode is null or p_mode not in ('soccer_online','volleyball_2v2_online','dodgeball_online','banger_online') then
    raise exception 'This online sport is not available for party matchmaking';
  end if;
  v_required:=public.online_sport_required_players(p_mode);
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null then raise exception 'Party is unavailable'; end if;
  if v_party.host_user_id<>v_user then raise exception 'Only the party host can launch a sport match'; end if;
  if v_party.status not in ('open','queued') then raise exception 'The party is already in an activity'; end if;
  if v_party.active_room_id is not null and exists(
    select 1 from public.online_custom_rooms r where r.id=v_party.active_room_id and r.status in ('waiting','playing')
  ) then raise exception 'Leave the active Custom Room before starting a sport match'; end if;
  if v_party.active_table_id is not null and exists(
    select 1 from public.element6_table_tournaments t where t.id=v_party.active_table_id and t.status in ('queue','voting','playing')
  ) then raise exception 'Leave The Table before starting a sport match'; end if;
  if v_party.active_sport_match_id is not null then
    select * into v_match from public.online_sport_matches m
      where m.id=v_party.active_sport_match_id and m.party_id=v_party.id
        and m.status in ('matched','active') for update;
    if v_match.id is not null then return public.element6_party_json(v_party.id); end if;
  end if;

  perform 1 from public.element6_party_members m where m.party_id=v_party.id for update;
  select count(*),count(*) filter(where not m.is_ready),
    count(*) filter(where ap.user_id is null or ap.updated_at<=now()-interval '90 seconds' or ap.app_status='away')
    into v_count,v_unready,v_unavailable
    from public.element6_party_members m
    left join public.element6_app_presence ap on ap.user_id=m.user_id
    where m.party_id=v_party.id and not m.spectator;
  if exists(select 1 from public.element6_party_members m where m.party_id=v_party.id and m.spectator) then
    raise exception 'Party spectators cannot enter active sport matches';
  end if;
  if v_count<>v_required then raise exception 'This sport requires exactly % party players',v_required; end if;
  if v_unready>0 then raise exception 'Every party member must be ready before starting'; end if;
  if v_unavailable>0 then raise exception 'Every party member must be online before starting'; end if;
  if exists(select 1 from public.online_sport_players sp join public.online_sport_matches sm on sm.id=sp.match_id
      join public.element6_party_members pm on pm.user_id=sp.user_id
      where pm.party_id=v_party.id and sm.status in ('searching','matched','active')) then
    raise exception 'A party member is already in an online sport match';
  end if;

  insert into public.online_sport_matches(mode,required_players,status,host_user_id,party_id)
    values(p_mode,v_required,'matched',v_party.host_user_id,v_party.id) returning * into v_match;
  for v_member in
    select m.user_id,m.slot from public.element6_party_members m
      where m.party_id=v_party.id and not m.spectator order by m.slot
  loop
    select progress_json into v_progress from public.user_progress where user_id=v_member.user_id;
    v_character:=coalesce(nullif(v_progress->>'favoriteId',''),'yellow');
    v_loadout:=jsonb_build_object(
      'element',coalesce(v_progress->'equippedElements'->>v_character,'basic'),
      'equippedSkins',coalesce(v_progress->'equippedSkins','{}'::jsonb),
      'equippedAccessories',coalesce(v_progress->'equippedAccessories','{}'::jsonb),
      'equippedShikigami',coalesce(v_progress->'equippedShikigami','{}'::jsonb)
    );
    v_team:=case when v_required=2 then v_slot+1
      when v_required=4 then case when v_slot in (0,2) then 1 else 2 end
      else case when v_slot<3 then 1 else 2 end end;
    insert into public.online_sport_players(match_id,user_id,slot,team,character_id,loadout,last_seen)
      values(v_match.id,v_member.user_id,v_slot,v_team,v_character,v_loadout,now());
    v_slot:=v_slot+1;
  end loop;
  update public.element6_party_members set is_ready=false where party_id=v_party.id;
  update public.element6_parties set status='queued',queued_mode='sports-match',
    active_sport_match_id=v_match.id,active_room_id=null,active_table_id=null,updated_at=now()
    where id=v_party.id;
  return public.element6_party_json(v_party.id);
end;
$$;

-- Each connected participant refreshes its seat. If the current host has gone
-- stale, the oldest live participant is elected in this row-locked RPC and the
-- epoch fences packets from the previous host. Keep the legacy void RPC below
-- for older clients; Postgres cannot change its return type with CREATE OR REPLACE.
create or replace function public.element6_online_sport_heartbeat(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_user uuid:=auth.uid();
  v_match public.online_sport_matches%rowtype;
  v_next_host uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_match from public.online_sport_matches where id=p_match_id for update;
  if v_match.id is null then raise exception 'Sport match not found'; end if;
  update public.online_sport_players set last_seen=now()
    where match_id=p_match_id and user_id=v_user;
  if not found then raise exception 'You are not a participant in this sport match'; end if;
  if v_match.status='matched' then
    update public.online_sport_matches set status='active',updated_at=now()
      where id=p_match_id returning * into v_match;
  end if;
  if v_match.status='active' and not exists(
    select 1 from public.online_sport_players p where p.match_id=p_match_id
      and p.user_id=v_match.host_user_id and p.last_seen>now()-interval '20 seconds'
  ) then
    select p.user_id into v_next_host from public.online_sport_players p
      where p.match_id=p_match_id and p.user_id is not null and p.last_seen>now()-interval '20 seconds'
      order by p.joined_at,p.slot,p.user_id limit 1;
    if v_next_host is not null then
      update public.online_sport_matches set host_user_id=v_next_host,
        host_epoch=host_epoch+1,updated_at=now()
        where id=p_match_id returning * into v_match;
    end if;
  end if;
  return jsonb_build_object('status',v_match.status,'host_user_id',v_match.host_user_id,'host_epoch',v_match.host_epoch);
end;
$$;

create or replace function public.online_sport_heartbeat(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
begin
  perform public.element6_online_sport_heartbeat(p_match_id);
end;
$$;

create or replace function public.element6_clear_finished_party_sport()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if new.status in ('finished','cancelled','disputed') and new.party_id is not null then
    update public.element6_parties set status='open',queued_mode=null,active_sport_match_id=null,updated_at=now()
      where id=new.party_id and active_sport_match_id=new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists element6_clear_finished_party_sport on public.online_sport_matches;
create trigger element6_clear_finished_party_sport
  after update of status on public.online_sport_matches
  for each row when (new.status is distinct from old.status)
  execute function public.element6_clear_finished_party_sport();

revoke all on function public.element6_party_queue_online_sport(uuid,text),public.online_sport_heartbeat(uuid),public.element6_online_sport_heartbeat(uuid),public.element6_clear_finished_party_sport() from public,anon;
grant execute on function public.element6_party_queue_online_sport(uuid,text),public.online_sport_heartbeat(uuid),public.element6_online_sport_heartbeat(uuid) to authenticated;

commit;
