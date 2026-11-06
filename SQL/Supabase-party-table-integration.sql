-- Atomically admit an entire ready party to The Table. Apply after
-- Supabase-party-linked-custom-rooms.sql and the Honored Bot launch migration.
begin;

-- Ensure columns introduced by the linked-room/party readiness migrations exist.
alter table public.element6_parties
  add column if not exists active_room_id uuid references public.online_custom_rooms(id) on delete set null,
  add column if not exists active_table_id uuid references public.element6_table_tournaments(id) on delete set null;
alter table public.element6_party_members
  add column if not exists is_ready boolean not null default false;

alter table public.element6_table_tournaments
  add column if not exists party_id uuid references public.element6_parties(id) on delete set null;
alter table public.element6_table_players
  add column if not exists title text;

create or replace function public.element6_snapshot_table_player_title()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  select nullif(up.progress_json->>'equippedTitle','') into new.title
    from public.user_progress up where up.user_id=new.user_id;
  return new;
end $$;
drop trigger if exists element6_table_player_title_snapshot on public.element6_table_players;
create trigger element6_table_player_title_snapshot
  before insert or update of user_id on public.element6_table_players
  for each row execute function public.element6_snapshot_table_player_title();
update public.element6_table_players tp
  set title=nullif(up.progress_json->>'equippedTitle','')
  from public.user_progress up
  where up.user_id=tp.user_id and tp.title is distinct from nullif(up.progress_json->>'equippedTitle','');
revoke all on function public.element6_snapshot_table_player_title() from public,anon,authenticated;

create unique index if not exists element6_table_active_party_unique
  on public.element6_table_tournaments(party_id)
  where party_id is not null and status in ('queue','voting','playing');
create index if not exists element6_table_players_user_active_idx
  on public.element6_table_players(user_id,tournament_id);

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

create or replace function public.element6_party_join_the_table(p_party_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_party public.element6_parties%rowtype;
  v_table public.element6_table_tournaments%rowtype;
  v_member record;
  v_progress jsonb;
  v_character text;
  v_count integer;
  v_unready integer;
  v_unavailable integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null or v_party.host_user_id<>v_user then raise exception 'Only the party host can start The Table'; end if;
  if v_party.status not in ('open','queued') then raise exception 'The party is already in a match'; end if;
  if v_party.active_room_id is not null and exists(select 1 from public.online_custom_rooms r where r.id=v_party.active_room_id and r.status in ('waiting','playing')) then
    raise exception 'Leave the active Custom Room before starting The Table';
  end if;

  if v_party.active_table_id is not null then
    select * into v_table from public.element6_table_tournaments t
     where t.id=v_party.active_table_id and t.party_id=v_party.id and t.status in ('queue','voting','playing') for update;
    if v_table.id is not null then
      update public.element6_parties set status=case when v_table.status='playing' then 'playing' else 'queued' end,
        queued_mode='thetable',updated_at=now() where id=v_party.id;
      return public.element6_party_json(v_party.id);
    end if;
  end if;

  select count(*),count(*) filter(where not m.is_ready),
    count(*) filter(where ap.user_id is null or ap.updated_at<=now()-interval '90 seconds' or ap.app_status='away')
    into v_count,v_unready,v_unavailable
    from public.element6_party_members m
    left join public.element6_app_presence ap on ap.user_id=m.user_id
    where m.party_id=v_party.id;
  if v_count<2 then raise exception 'The Table requires at least two real human party members'; end if;
  if v_count>8 then raise exception 'The Table supports at most eight humans'; end if;
  if v_unavailable>0 then raise exception 'Every party member must be online before starting The Table'; end if;
  if v_unready>0 then raise exception 'Every party member must be ready before starting The Table'; end if;
  if exists(select 1 from public.element6_party_members m where m.party_id=v_party.id and m.spectator) then
    raise exception 'Spectator slots are not supported in The Table yet';
  end if;

  for v_member in select m.user_id from public.element6_party_members m where m.party_id=v_party.id order by m.user_id loop
    perform pg_advisory_xact_lock(hashtextextended(v_member.user_id::text,0));
  end loop;
  if exists(
    select 1 from public.element6_table_players tp join public.element6_table_tournaments t on t.id=tp.tournament_id
    join public.element6_party_members pm on pm.user_id=tp.user_id and pm.party_id=v_party.id
    where t.status in ('queue','voting','playing')
  ) then raise exception 'A party member is already in another Table session'; end if;

  insert into public.element6_table_tournaments(host_user_id,party_id,status)
  values(v_party.host_user_id,v_party.id,'queue') returning * into v_table;
  for v_member in select m.user_id,m.username,m.slot from public.element6_party_members m where m.party_id=v_party.id order by m.slot loop
    select progress_json into v_progress from public.user_progress where user_id=v_member.user_id;
    v_character:=coalesce(nullif(v_progress->>'favoriteId',''),'yellow');
    insert into public.element6_table_players(tournament_id,user_id,slot,username,char_id,loadout,last_seen_at)
    values(v_table.id,v_member.user_id,v_member.slot,v_member.username,v_character,jsonb_build_object(
      'element',coalesce(v_progress->'equippedElements'->>v_character,'basic'),
      'equippedSkins',coalesce(v_progress->'equippedSkins','{}'::jsonb),
      'equippedAccessories',coalesce(v_progress->'equippedAccessories','{}'::jsonb),
      'equippedShikigami',coalesce(v_progress->'equippedShikigami','{}'::jsonb),
      'equippedMovementTrails',coalesce(v_progress->'equippedMovementTrails','{}'::jsonb),
      'equippedEmotes',coalesce(v_progress->'equippedEmotes','{}'::jsonb)
    ),now());
  end loop;
  update public.element6_party_members set is_ready=false where party_id=v_party.id;
  update public.element6_parties set status='queued',queued_mode='thetable',active_table_id=v_table.id,active_room_id=null,updated_at=now()
   where id=v_party.id;
  return public.element6_party_json(v_party.id);
end;
$$;

-- Keep public Table matchmaking separate from a party's private tournament.
create or replace function public.element6_join_the_table(p_char_id text,p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
  v_slot smallint;
  v_count integer;
  v_next_host uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  select tt.* into v_tournament from public.element6_table_players tp
    join public.element6_table_tournaments tt on tt.id=tp.tournament_id
   where tp.user_id=v_user and tt.status in ('queue','voting','playing') order by tt.updated_at desc limit 1;
  if v_tournament.id is not null then
    update public.element6_table_players set last_seen_at=now() where tournament_id=v_tournament.id and user_id=v_user;
    return jsonb_build_object('tournament_id',v_tournament.id,'status',v_tournament.status,'joined',false);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('element6-table-open-queue',0));
  select tt.* into v_tournament from public.element6_table_tournaments tt
   where tt.status='queue' and tt.party_id is null order by tt.created_at,tt.id for update limit 1;
  if v_tournament.id is null then
    insert into public.element6_table_tournaments(host_user_id) values(v_user) returning * into v_tournament;
  else
    delete from public.element6_table_players
     where tournament_id=v_tournament.id and last_seen_at<=now()-interval '20 seconds';
    if not exists(select 1 from public.element6_table_players p
        where p.tournament_id=v_tournament.id and p.user_id=v_tournament.host_user_id
          and p.last_seen_at>now()-interval '20 seconds') then
      select p.user_id into v_next_host from public.element6_table_players p
       where p.tournament_id=v_tournament.id and p.last_seen_at>now()-interval '20 seconds'
       order by p.joined_at,p.slot limit 1;
      update public.element6_table_tournaments set host_user_id=coalesce(v_next_host,v_user),updated_at=now()
       where id=v_tournament.id returning * into v_tournament;
    end if;
  end if;
  select count(*) into v_count from public.element6_table_players tp where tp.tournament_id=v_tournament.id;
  if v_count>=8 then raise exception 'The Table is full'; end if;
  select free.slot into v_slot from generate_series(1,8) as free(slot)
   where not exists(select 1 from public.element6_table_players p where p.tournament_id=v_tournament.id and p.slot=free.slot)
   order by free.slot limit 1;
  if v_slot is null then raise exception 'The Table is full'; end if;
  insert into public.element6_table_players(tournament_id,user_id,slot,username,char_id,loadout,last_seen_at)
  values(v_tournament.id,v_user,v_slot,coalesce((select pp.username from public.player_profiles pp where pp.user_id=v_user),'Player'),
    coalesce(nullif(trim(p_char_id),''),'yellow'),coalesce(p_loadout,'{}'::jsonb),now());
  select count(*) into v_count from public.element6_table_players where tournament_id=v_tournament.id;
  return jsonb_build_object('tournament_id',v_tournament.id,'status','queue','joined',true,'human_count',v_count,'host_user_id',v_tournament.host_user_id);
end;
$$;

create or replace function public.element6_table_start_match(p_tournament_id uuid,p_stage_id text default 'splitcity')
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
  v_humans integer;
  v_bots jsonb;
  v_chars text[]:=array['red','blue','green','purple','orange','pink','cyan','yellow'];
  v_match uuid;
  v_stage text:=coalesce(nullif(trim(p_stage_id),''),'splitcity');
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_tournament from public.element6_table_tournaments where id=p_tournament_id for update;
  if v_tournament.id is null then raise exception 'The Table no longer exists'; end if;
  if v_tournament.host_user_id<>v_user then raise exception 'Only the Table host can start'; end if;
  if v_tournament.status='playing' and v_tournament.active_match_id is not null then
    return jsonb_build_object('started',false,'already_started',true,'match_id',v_tournament.active_match_id,'stage_id',v_tournament.stage_id,'bot_slots',v_tournament.bot_slots);
  end if;
  if v_tournament.status not in ('queue','voting') then raise exception 'The Table is not ready to start'; end if;
  if v_stage not in ('splitcity','basic','silvermansion','controllerforest','traininggrounds','voidplane','neonspire','sunsetridge','frozenlake','lavafalls','crystalcavern','skysanctuary','underworld','auroraborealis','goldentemple','stormpeak','toxicmarsh','cosmicvoid','emberforge','tidalreef','shadowrealm','dawnbreak','midnighttower','junglecanopy','desertoasis','icepalace','volcanocrater','starlightmeadow','thunderdome','rainbowbridge','coralreef','obsidianfield','solflare','mintgardens','cobaltmines','crimsonarena','phoenixroost','nebulareach','emeraldcove','grandarena','skycitadel','colossalcoliseum','infiniteexpanse','opalcave','g1_thunder_peak','g1_inferno_realm','g1_ocean_depth','g1_verdant_grove','g1_glacier_realm','g5_golden_arena','g5_tidal_sanctum','g5_shadow_dojo','g5_portal_nexus','g5_mountain_keep','g5_mind_palace','dawn_battleground','shogun_castle','iron_forge_town','rift_valley','blood_arena','resonance_lab','harvest_stronghold','crystal_library','element6_source') then
    raise exception 'That stage is not available in The Table';
  end if;
  update public.element6_table_players set last_seen_at=now()
   where tournament_id=p_tournament_id and user_id=v_user;
  if not found then raise exception 'The host must be connected at the Table to start'; end if;
  delete from public.element6_table_players p where p.tournament_id=p_tournament_id and p.last_seen_at<=now()-interval '20 seconds';
  select count(*) into v_humans from public.element6_table_players p where p.tournament_id=p_tournament_id and p.last_seen_at>now()-interval '20 seconds';
  if v_humans<2 then raise exception 'At least two connected human players are required'; end if;
  if v_humans>8 then raise exception 'The Table supports at most eight humans'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('slot',free.slot,
    'char',v_chars[((free.slot-1)%array_length(v_chars,1))+1],
    'name','Honored Bot '||free.bot_index,'username','Honored Bot '||free.bot_index,'user_id',null,
    'is_bot',true,'difficulty','honored','loadout','{}'::jsonb) order by free.slot),'[]'::jsonb)
    into v_bots
    from (
      select open_slot.slot,row_number() over(order by open_slot.slot) as bot_index
      from generate_series(1,8) as open_slot(slot)
      where not exists(select 1 from public.element6_table_players human
        where human.tournament_id=p_tournament_id and human.slot=open_slot.slot)
      order by open_slot.slot limit 8-v_humans
    ) as free;
  v_match:=gen_random_uuid();
  update public.element6_table_tournaments set status='playing',stage_id=v_stage,bot_slots=v_bots,
    active_match_id=v_match,active_p1=null,active_p2=null,current_round=1,updated_at=now()
   where id=p_tournament_id returning * into v_tournament;
  if v_tournament.party_id is not null then
    update public.element6_parties set status='playing',queued_mode='thetable',active_table_id=v_tournament.id,updated_at=now()
     where id=v_tournament.party_id;
  end if;
  return jsonb_build_object('started',true,'match_id',v_match,'stage_id',v_stage,'human_count',v_humans,'bot_slots',v_bots);
end;
$$;

create or replace function public.element6_table_complete_match(
  p_tournament_id uuid,p_match_id uuid,p_winner_user_id uuid default null,
  p_winner_name text default null,p_winner_is_bot boolean default false
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_tournament public.element6_table_tournaments%rowtype;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_tournament from public.element6_table_tournaments where id=p_tournament_id for update;
  if v_tournament.id is null or v_tournament.active_match_id<>p_match_id then raise exception 'This match is no longer active'; end if;
  if v_tournament.host_user_id<>v_user then raise exception 'Only the match host can submit the result'; end if;
  if v_tournament.status='finished' then return to_jsonb(v_tournament); end if;
  if v_tournament.status<>'playing' then raise exception 'This match is no longer active'; end if;
  if p_winner_user_id is not null and not exists(select 1 from public.element6_table_players p where p.tournament_id=p_tournament_id and p.user_id=p_winner_user_id) then raise exception 'The winner is not a human participant'; end if;
  if p_winner_user_id is not null and p_winner_is_bot then raise exception 'A bot cannot be identified as a human winner'; end if;
  if p_winner_is_bot and not exists(select 1 from jsonb_array_elements(coalesce(v_tournament.bot_slots,'[]'::jsonb)) as item(slot)
    where item.slot->>'name'=p_winner_name and coalesce((item.slot->>'is_bot')::boolean,false)) then raise exception 'The winning bot is not active'; end if;
  if p_winner_user_id is null and not p_winner_is_bot and coalesce(p_winner_name,'Draw') not in ('Draw','Disconnected') then raise exception 'The result must identify a participant or a draw'; end if;
  update public.element6_table_tournaments set status='finished',winner_user_id=p_winner_user_id,
    winner_name=case when p_winner_user_id is not null then (select p.username from public.element6_table_players p where p.tournament_id=p_tournament_id and p.user_id=p_winner_user_id) else coalesce(p_winner_name,'Draw') end,
    winner_is_bot=p_winner_is_bot,updated_at=now() where id=p_tournament_id returning * into v_tournament;
  if v_tournament.party_id is not null then
    update public.element6_party_members set is_ready=false where party_id=v_tournament.party_id;
    update public.element6_parties set status='open',queued_mode=null,updated_at=now() where id=v_tournament.party_id;
  end if;
  return to_jsonb(v_tournament);
end;
$$;

create or replace function public.element6_table_requeue_match(p_tournament_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_tournament public.element6_table_tournaments%rowtype; v_humans integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_tournament from public.element6_table_tournaments where id=p_tournament_id for update;
  if v_tournament.id is null or v_tournament.host_user_id<>v_user then raise exception 'Only the Table host can start a rematch'; end if;
  if v_tournament.status<>'finished' then raise exception 'The previous match has not finished'; end if;
  delete from public.element6_table_players p where p.tournament_id=p_tournament_id and p.last_seen_at<=now()-interval '20 seconds';
  select count(*) into v_humans from public.element6_table_players p where p.tournament_id=p_tournament_id and p.last_seen_at>now()-interval '20 seconds';
  if v_humans<2 then raise exception 'At least two connected human players are required for a rematch'; end if;
  update public.element6_table_tournaments set status='queue',bot_slots='[]'::jsonb,active_match_id=null,
    active_p1=null,active_p2=null,winner_user_id=null,winner_name=null,winner_is_bot=false,current_round=0,updated_at=now()
   where id=p_tournament_id returning * into v_tournament;
  if v_tournament.party_id is not null then
    update public.element6_parties set status='queued',queued_mode='thetable',active_table_id=v_tournament.id,updated_at=now()
     where id=v_tournament.party_id;
  end if;
  return to_jsonb(v_tournament);
end;
$$;

revoke all on function public.element6_party_join_the_table(uuid) from public,anon;
grant execute on function public.element6_party_join_the_table(uuid) to authenticated;
grant execute on function public.element6_table_start_match(uuid,text),public.element6_table_complete_match(uuid,uuid,uuid,text,boolean),public.element6_table_requeue_match(uuid) to authenticated;
grant execute on function public.element6_join_the_table(text,jsonb) to authenticated;

commit;
