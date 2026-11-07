-- Party-only online Grand Circuit and Capture the Flag.
-- Apply after the ranked online, online sports, party presence, party sports,
-- party/Table integration, and Table Honored Bot migrations.
begin;

-- Capture the Flag is deliberately absent from public online sports queues.
-- It is provisioned only as a complete four-person party match.
do $$ declare c record; begin
  for c in select conname from pg_constraint
    where conrelid='public.online_sport_matches'::regclass and contype='c'
      and pg_get_constraintdef(oid) ilike '%mode%'
  loop execute format('alter table public.online_sport_matches drop constraint %I',c.conname); end loop;
  for c in select conname from pg_constraint
    where conrelid='public.online_sport_matches'::regclass and contype='c'
      and pg_get_constraintdef(oid) ilike '%required_players%'
  loop execute format('alter table public.online_sport_matches drop constraint %I',c.conname); end loop;
end $$;
alter table public.online_sport_matches
  add constraint online_sport_matches_mode_check check (mode in (
    'soccer_ranked','soccer_online','volleyball_1v1_ranked','volleyball_2v2_online',
    'dodgeball_ranked','dodgeball_online','banger_online','ctf_party'
  )),
  add constraint online_sport_matches_required_players_check check (required_players in (2,4,6));

create or replace function public.online_sport_required_players(p_mode text)
returns smallint language sql immutable as $$
  select case p_mode when 'volleyball_2v2_online' then 4
    when 'banger_online' then 6 when 'ctf_party' then 4 else 2 end::smallint;
$$;

create or replace function public.element6_party_queue_ctf(p_party_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_user uuid:=auth.uid(); v_party public.element6_parties%rowtype;
  v_match public.online_sport_matches%rowtype; v_member record;
  v_progress jsonb; v_character text; v_loadout jsonb; v_slot smallint:=0;
  v_count integer; v_unready integer; v_unavailable integer; v_team smallint;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null then raise exception 'Party is unavailable'; end if;
  if v_party.host_user_id<>v_user then raise exception 'Only the party host can start Capture the Flag'; end if;
  if v_party.status not in ('open','queued') then raise exception 'The party is already in a match'; end if;
  if v_party.active_sport_match_id is not null then
    select * into v_match from public.online_sport_matches m
     where m.id=v_party.active_sport_match_id and m.party_id=v_party.id and m.mode='ctf_party'
       and m.status in ('matched','active') for update;
    if v_match.id is not null then return public.element6_party_json(v_party.id); end if;
  end if;
  if v_party.active_room_id is not null and exists(select 1 from public.online_custom_rooms r where r.id=v_party.active_room_id and r.status in ('waiting','playing')) then
    raise exception 'Leave the active Custom Room before starting Capture the Flag';
  end if;
  if v_party.active_table_id is not null and exists(select 1 from public.element6_table_tournaments t where t.id=v_party.active_table_id and t.status in ('queue','voting','playing')) then
    raise exception 'Leave the active tournament before starting Capture the Flag';
  end if;
  perform 1 from public.element6_party_members m where m.party_id=v_party.id for update;
  select count(*),count(*) filter(where not m.is_ready),
    count(*) filter(where ap.user_id is null or ap.updated_at<=now()-interval '90 seconds' or ap.app_status='away')
    into v_count,v_unready,v_unavailable
    from public.element6_party_members m left join public.element6_app_presence ap on ap.user_id=m.user_id
    where m.party_id=v_party.id and not m.spectator;
  if exists(select 1 from public.element6_party_members m where m.party_id=v_party.id and m.spectator) then
    raise exception 'Party spectators cannot enter Capture the Flag';
  end if;
  if v_count<>4 then raise exception 'Party Capture the Flag requires exactly four ready players'; end if;
  if v_unready>0 then raise exception 'Every party member must be ready before starting'; end if;
  if v_unavailable>0 then raise exception 'Every party member must be online before starting'; end if;
  if exists(select 1 from public.online_sport_players sp join public.online_sport_matches sm on sm.id=sp.match_id
      join public.element6_party_members pm on pm.user_id=sp.user_id
      where pm.party_id=v_party.id and sm.status in ('searching','matched','active')) then
    raise exception 'A party member is already in an online sport match';
  end if;

  insert into public.online_sport_matches(mode,required_players,status,host_user_id,party_id)
    values('ctf_party',4,'matched',v_party.host_user_id,v_party.id) returning * into v_match;
  for v_member in select m.user_id,m.slot from public.element6_party_members m
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
    v_team:=case when v_slot in (0,2) then 1 else 2 end;
    insert into public.online_sport_players(match_id,user_id,slot,team,character_id,loadout,last_seen)
      values(v_match.id,v_member.user_id,v_slot,v_team,v_character,v_loadout,now());
    v_slot:=v_slot+1;
  end loop;
  update public.element6_party_members set is_ready=false where party_id=v_party.id;
  update public.element6_parties set status='queued',queued_mode='sports-match',active_sport_match_id=v_match.id,
    active_room_id=null,active_table_id=null,updated_at=now() where id=v_party.id;
  return public.element6_party_json(v_party.id);
end;
$$;

create or replace function public.element6_party_prepare_grand_circuit(p_party_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_user uuid:=auth.uid(); v_party public.element6_parties%rowtype; v_tournament uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null or v_party.host_user_id<>v_user then raise exception 'Only the party host can start Grand Circuit'; end if;
  if v_party.status not in ('open','queued') then raise exception 'The party is already in a match'; end if;
  if v_party.queued_mode='grandcircuit-online' and v_party.active_table_id is not null
     and exists(select 1 from public.element6_table_tournaments t where t.id=v_party.active_table_id and t.status in ('queue','playing')) then
    return public.element6_party_json(v_party.id);
  end if;
  if v_party.active_table_id is not null and exists(select 1 from public.element6_table_tournaments t where t.id=v_party.active_table_id and t.status in ('queue','voting','playing')) then
    raise exception 'Leave the active Table activity before starting Grand Circuit';
  end if;
  perform public.element6_party_join_the_table(p_party_id);
  select active_table_id into v_tournament from public.element6_parties where id=p_party_id;
  if v_tournament is null then raise exception 'The party tournament could not be created'; end if;
  update public.element6_table_tournaments set match_settings=jsonb_build_object('stocks',1,'matchTime',180,'startingDamage',0)
    where id=v_tournament and party_id=p_party_id and status='queue';
  if not found then raise exception 'The party tournament is not ready'; end if;
  update public.element6_party_members set is_ready=true where party_id=p_party_id;
  update public.element6_parties set status='queued',queued_mode='grandcircuit-online',active_table_id=v_tournament,
    active_room_id=null,active_sport_match_id=null,updated_at=now() where id=p_party_id;
  return public.element6_party_json(p_party_id);
end;
$$;

create or replace function public.element6_party_start_grand_circuit(p_tournament_id uuid,p_stage_id text default 'splitcity')
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_user uuid:=auth.uid(); v_t public.element6_table_tournaments%rowtype; v_party public.element6_parties%rowtype;
  v_count integer; v_unready integer; v_unavailable integer; v_stage text:=coalesce(nullif(trim(p_stage_id),''),'splitcity');
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_t from public.element6_table_tournaments where id=p_tournament_id for update;
  if v_t.id is null or v_t.party_id is null then raise exception 'Party Grand Circuit is unavailable'; end if;
  select * into v_party from public.element6_parties where id=v_t.party_id for update;
  if v_t.host_user_id<>v_user or v_party.host_user_id<>v_user then raise exception 'Only the party host can start Grand Circuit'; end if;
  if v_party.queued_mode<>'grandcircuit-online' or v_party.active_table_id<>v_t.id then raise exception 'This is not the active party Grand Circuit'; end if;
  if v_t.status='playing' then return jsonb_build_object('started',true,'already_started',true); end if;
  if v_t.status<>'queue' then raise exception 'The party tournament is not ready'; end if;
  if v_stage not in ('splitcity','basic','silvermansion','controllerforest','traininggrounds','voidplane','neonspire','sunsetridge','frozenlake','lavafalls','crystalcavern','skysanctuary','underworld','auroraborealis','goldentemple','stormpeak','toxicmarsh','cosmicvoid','emberforge','tidalreef','shadowrealm','dawnbreak','midnighttower','junglecanopy','desertoasis','icepalace','volcanocrater','starlightmeadow','thunderdome','rainbowbridge','coralreef','obsidianfield','solflare','mintgardens','cobaltmines','crimsonarena','phoenixroost','nebulareach','emeraldcove','grandarena','skycitadel','colossalcoliseum','infiniteexpanse','opalcave','g1_thunder_peak','g1_inferno_realm','g1_ocean_depth','g1_verdant_grove','g1_glacier_realm','g5_golden_arena','g5_tidal_sanctum','g5_shadow_dojo','g5_portal_nexus','g5_mountain_keep','g5_mind_palace','dawn_battleground','shogun_castle','iron_forge_town','rift_valley','blood_arena','resonance_lab','harvest_stronghold','crystal_library','element6_source') then
    raise exception 'That stage is not available in Grand Circuit';
  end if;
  select count(*),count(*) filter(where not m.is_ready),
    count(*) filter(where ap.user_id is null or ap.updated_at<=now()-interval '90 seconds' or ap.app_status='away')
    into v_count,v_unready,v_unavailable
    from public.element6_party_members m left join public.element6_app_presence ap on ap.user_id=m.user_id
    where m.party_id=v_party.id and not m.spectator;
  if v_count<2 or v_count>8 then raise exception 'Grand Circuit requires 2–8 party players'; end if;
  if exists(select 1 from public.element6_party_members m where m.party_id=v_party.id and m.spectator) then raise exception 'Party spectators are not supported in Grand Circuit'; end if;
  if v_unready>0 or v_unavailable>0 then raise exception 'Every party member must be ready and online before starting'; end if;
  if (select count(*) from public.element6_table_players p where p.tournament_id=v_t.id)<>v_count then raise exception 'The tournament roster no longer matches the party'; end if;
  update public.element6_table_tournaments set status='playing',stage_id=v_stage,current_round=0,active_match_id=null,
    active_p1=null,active_p2=null,winner_user_id=null,updated_at=now() where id=v_t.id;
  update public.element6_parties set status='playing',updated_at=now() where id=v_party.id;
  return jsonb_build_object('started',true,'tournament_id',v_t.id,'stage_id',v_stage,'players',v_count);
end;
$$;

create or replace function public.element6_party_gc_start_next(p_tournament_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_user uuid:=auth.uid(); v_t public.element6_table_tournaments%rowtype; v_active uuid[]; v_p1 uuid; v_p2 uuid; v_round smallint; v_match uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_t from public.element6_table_tournaments where id=p_tournament_id for update;
  if v_t.id is null or v_t.party_id is null or not exists(select 1 from public.element6_table_players where tournament_id=v_t.id and user_id=v_user) then
    raise exception 'Not a Grand Circuit participant';
  end if;
  if v_t.status<>'playing' then return jsonb_build_object('started',false,'status',v_t.status); end if;
  if v_t.active_match_id is not null and exists(select 1 from public.element6_table_rounds r where r.tournament_id=v_t.id and r.match_id=v_t.active_match_id and r.status='playing') then
    return jsonb_build_object('started',false,'match_id',v_t.active_match_id);
  end if;
  select array_agg(user_id order by random()) into v_active from public.element6_table_players where tournament_id=v_t.id and status='active';
  if coalesce(array_length(v_active,1),0)<2 then
    if array_length(v_active,1)=1 then
      update public.element6_table_players set status='winner' where tournament_id=v_t.id and user_id=v_active[1];
      update public.element6_table_tournaments set status='finished',winner_user_id=v_active[1],updated_at=now() where id=v_t.id;
    else
      update public.element6_table_tournaments set status='finished',updated_at=now() where id=v_t.id;
    end if;
    update public.element6_party_members set is_ready=false where party_id=v_t.party_id;
    update public.element6_parties set status='open',queued_mode=null,active_table_id=null,updated_at=now()
      where id=v_t.party_id and active_table_id=v_t.id;
    return jsonb_build_object('started',false,'finished',true,'winner',v_active[1]);
  end if;
  v_p1:=v_active[1]; v_p2:=v_active[2]; v_round:=v_t.current_round+1; v_match:=gen_random_uuid();
  insert into public.element6_table_rounds(tournament_id,round_index,match_id,p1,p2,stage_id)
    values(v_t.id,v_round,v_match,v_p1,v_p2,v_t.stage_id);
  update public.element6_table_tournaments set current_round=v_round,active_match_id=v_match,active_p1=v_p1,active_p2=v_p2,updated_at=now()
    where id=v_t.id;
  return jsonb_build_object('started',true,'match_id',v_match,'p1',v_p1,'p2',v_p2,'stage_id',v_t.stage_id,'round_index',v_round);
end;
$$;

create or replace function public.element6_party_gc_report_result(p_tournament_id uuid,p_match_id uuid,p_winner uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_user uuid:=auth.uid(); v_t public.element6_table_tournaments%rowtype; v_r public.element6_table_rounds%rowtype; v_loser uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_t from public.element6_table_tournaments where id=p_tournament_id for update;
  if v_t.id is null or v_t.party_id is null then raise exception 'Party Grand Circuit is unavailable'; end if;
  select * into v_r from public.element6_table_rounds where tournament_id=v_t.id and match_id=p_match_id for update;
  if v_r.match_id is null then raise exception 'This Grand Circuit round is unavailable'; end if;
  if v_user<>v_r.p1 and v_user<>v_r.p2 then raise exception 'Only a player in this round can submit its result'; end if;
  if v_r.status='finished' then return jsonb_build_object('reported',true,'already_reported',true,'winner',v_r.winner); end if;
  if v_t.status<>'playing' or v_t.active_match_id<>p_match_id then raise exception 'This Grand Circuit round is no longer active'; end if;
  if p_winner<>v_r.p1 and p_winner<>v_r.p2 then raise exception 'Winner is not a player in this round'; end if;
  v_loser:=case when p_winner=v_r.p1 then v_r.p2 else v_r.p1 end;
  update public.element6_table_rounds set status='finished',winner=p_winner,loser=v_loser,finished_at=now()
    where tournament_id=v_t.id and round_index=v_r.round_index;
  update public.element6_table_players set status='eliminated' where tournament_id=v_t.id and user_id=v_loser;
  update public.element6_table_tournaments set active_match_id=null,active_p1=null,active_p2=null,updated_at=now() where id=v_t.id;
  return jsonb_build_object('reported',true,'winner',p_winner,'loser',v_loser);
end;
$$;

revoke all on function public.element6_party_queue_ctf(uuid),public.element6_party_prepare_grand_circuit(uuid),
  public.element6_party_start_grand_circuit(uuid,text),public.element6_party_gc_start_next(uuid),
  public.element6_party_gc_report_result(uuid,uuid,uuid) from public,anon;
grant execute on function public.element6_party_queue_ctf(uuid),public.element6_party_prepare_grand_circuit(uuid),
  public.element6_party_start_grand_circuit(uuid,text),public.element6_party_gc_start_next(uuid),
  public.element6_party_gc_report_result(uuid,uuid,uuid) to authenticated;

commit;
