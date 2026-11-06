-- The Table: start with 2–8 connected humans and fill remaining slots with
-- real Honored AI participants. Apply after the Table and join-concurrency SQL.
begin;

alter table public.element6_table_tournaments
  add column if not exists bot_slots jsonb not null default '[]'::jsonb,
  add column if not exists winner_name text,
  add column if not exists winner_is_bot boolean not null default false;
alter table public.element6_table_players
  add column if not exists last_seen_at timestamptz not null default now();

create or replace function public.element6_join_the_table(
  p_char_id text,
  p_loadout jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
  v_slot smallint;
  v_count int;
  v_next_host uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  select tt.* into v_tournament
    from public.element6_table_players tp
    join public.element6_table_tournaments tt on tt.id=tp.tournament_id
   where tp.user_id=v_user and tt.status in ('queue','voting','playing')
   order by tt.updated_at desc limit 1;
  if v_tournament.id is not null then
    update public.element6_table_players set last_seen_at=now()
     where tournament_id=v_tournament.id and user_id=v_user;
    return jsonb_build_object('tournament_id',v_tournament.id,'status',v_tournament.status,'joined',false);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('element6-table-open-queue',0));
  select tt.* into v_tournament from public.element6_table_tournaments tt
   where tt.status='queue' order by tt.created_at,tt.id for update limit 1;
  if v_tournament.id is null then
    insert into public.element6_table_tournaments(host_user_id)
    values(v_user) returning * into v_tournament;
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
  select count(*) into v_count from public.element6_table_players where tournament_id=v_tournament.id;
  if v_count>=8 then raise exception 'The Table is full'; end if;
  select free.slot into v_slot from generate_series(1,8) as free(slot)
   where not exists(select 1 from public.element6_table_players p where p.tournament_id=v_tournament.id and p.slot=free.slot)
   order by free.slot limit 1;
  if v_slot is null then raise exception 'The Table is full'; end if;
  insert into public.element6_table_players(tournament_id,user_id,slot,username,char_id,loadout,last_seen_at)
  values(v_tournament.id,v_user,v_slot,
    coalesce((select pp.username from public.player_profiles pp where pp.user_id=v_user),'Player'),
    coalesce(nullif(trim(p_char_id),''),'yellow'),coalesce(p_loadout,'{}'::jsonb),now());
  select count(*) into v_count from public.element6_table_players where tournament_id=v_tournament.id;
  return jsonb_build_object('tournament_id',v_tournament.id,'status','queue','joined',true,'human_count',v_count);
end;
$$;

create or replace function public.element6_heartbeat_the_table(p_tournament_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  update public.element6_table_players set last_seen_at=now()
   where tournament_id=p_tournament_id and user_id=v_user;
  if not found then raise exception 'You are not a member of this Table'; end if;
  select * into v_tournament from public.element6_table_tournaments
   where id=p_tournament_id for update;
  if v_tournament.host_user_id<>v_user and v_tournament.status in ('queue','voting') then
    if not exists(select 1 from public.element6_table_players p
       where p.tournament_id=p_tournament_id and p.user_id=v_tournament.host_user_id
         and p.last_seen_at>now()-interval '20 seconds') then
      update public.element6_table_tournaments t
         set host_user_id=(select p.user_id from public.element6_table_players p
           where p.tournament_id=p_tournament_id and p.last_seen_at>now()-interval '20 seconds'
           order by p.joined_at,p.user_id limit 1), updated_at=now()
       where t.id=p_tournament_id;
    end if;
  end if;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.element6_table_start_match(
  p_tournament_id uuid,
  p_stage_id text default 'splitcity'
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
  v_humans integer;
  v_capacity integer;
  v_bots jsonb;
  v_chars text[]:=array['red','blue','green','purple','orange','pink','cyan','yellow'];
  v_match uuid;
  v_stage text:=coalesce(nullif(trim(p_stage_id),''),'splitcity');
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_tournament from public.element6_table_tournaments
   where id=p_tournament_id for update;
  if v_tournament.id is null then raise exception 'The Table no longer exists'; end if;
  if v_tournament.host_user_id<>v_user then raise exception 'Only the Table host can start'; end if;
  if v_tournament.status='playing' and v_tournament.active_match_id is not null then
    return jsonb_build_object('started',false,'already_started',true,'match_id',v_tournament.active_match_id,
      'stage_id',v_tournament.stage_id,'bot_slots',v_tournament.bot_slots);
  end if;
  if v_tournament.status not in ('queue','voting') then raise exception 'The Table is not ready to start'; end if;
  v_capacity:=coalesce((v_tournament.match_settings->>'maxPlayers')::integer,8);
  if v_capacity not between 2 and 8 then raise exception 'Active player count must be between 2 and 8'; end if;
  if v_stage not in ('splitcity','basic','silvermansion','controllerforest','traininggrounds','voidplane','neonspire','sunsetridge','frozenlake','lavafalls','crystalcavern','skysanctuary','underworld','auroraborealis','goldentemple','stormpeak','toxicmarsh','cosmicvoid','emberforge','tidalreef','shadowrealm','dawnbreak','midnighttower','junglecanopy','desertoasis','icepalace','volcanocrater','starlightmeadow','thunderdome','rainbowbridge','coralreef','obsidianfield','solflare','mintgardens','cobaltmines','crimsonarena','phoenixroost','nebulareach','emeraldcove','grandarena','skycitadel','colossalcoliseum','infiniteexpanse','opalcave','g1_thunder_peak','g1_inferno_realm','g1_ocean_depth','g1_verdant_grove','g1_glacier_realm','g5_golden_arena','g5_tidal_sanctum','g5_shadow_dojo','g5_portal_nexus','g5_mountain_keep','g5_mind_palace','dawn_battleground','shogun_castle','iron_forge_town','rift_valley','blood_arena','resonance_lab','harvest_stronghold','crystal_library','element6_source') then
    raise exception 'That stage is not available in The Table';
  end if;
  update public.element6_table_players set last_seen_at=now()
   where tournament_id=p_tournament_id and user_id=v_user;
  if not found then raise exception 'The host must be connected at the Table to start'; end if;
  delete from public.element6_table_players p
   where p.tournament_id=p_tournament_id and p.last_seen_at<=now()-interval '20 seconds';
  select count(*) into v_humans from public.element6_table_players p
   where p.tournament_id=p_tournament_id and p.last_seen_at>now()-interval '20 seconds';
  if v_humans<2 then raise exception 'At least two connected human players are required'; end if;
  if v_humans>v_capacity then raise exception 'Increase active player count to fit the connected human roster'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'slot',free.slot,
      'char',v_chars[((free.slot-1)%array_length(v_chars,1))+1],
      'name','Honored Bot '||free.bot_index,
      'username','Honored Bot '||free.bot_index,
      'user_id',null,
      'is_bot',true,
      'difficulty','honored',
      'loadout','{}'::jsonb
    ) order by free.slot),'[]'::jsonb)
    into v_bots
    from (
      select open_slot.slot,row_number() over(order by open_slot.slot) as bot_index
      from generate_series(1,v_capacity) as open_slot(slot)
      where not exists(select 1 from public.element6_table_players human
        where human.tournament_id=p_tournament_id and human.slot=open_slot.slot)
      order by open_slot.slot limit v_capacity-v_humans
    ) as free;
  v_match:=gen_random_uuid();
  update public.element6_table_tournaments set status='playing',stage_id=v_stage,
    bot_slots=v_bots,active_match_id=v_match,active_p1=null,active_p2=null,
    current_round=1,updated_at=now()
   where id=p_tournament_id;
  return jsonb_build_object('started',true,'match_id',v_match,'stage_id',v_stage,
    'human_count',v_humans,'bot_slots',v_bots);
end $$;

drop function if exists public.element6_table_complete_match(uuid,uuid,uuid);
create or replace function public.element6_table_complete_match(
  p_tournament_id uuid,
  p_match_id uuid,
  p_winner_user_id uuid default null,
  p_winner_name text default null,
  p_winner_is_bot boolean default false
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_tournament from public.element6_table_tournaments
   where id=p_tournament_id for update;
  if v_tournament.id is null or v_tournament.active_match_id<>p_match_id then
    raise exception 'This match is no longer active';
  end if;
  if v_tournament.host_user_id<>v_user then raise exception 'Only the match host can submit the result'; end if;
  if p_winner_user_id is not null and not exists(select 1 from public.element6_table_players p
      where p.tournament_id=p_tournament_id and p.user_id=p_winner_user_id) then
    raise exception 'The winner is not a human participant';
  end if;
  if p_winner_user_id is not null and p_winner_is_bot then
    raise exception 'A bot cannot be identified as a human winner';
  end if;
  if p_winner_is_bot and not exists(
    select 1 from jsonb_array_elements(coalesce(v_tournament.bot_slots,'[]'::jsonb)) as item(slot)
     where item.slot->>'name'=p_winner_name and coalesce((item.slot->>'is_bot')::boolean,false)
  ) then raise exception 'The winning bot is not an active participant'; end if;
  if p_winner_user_id is null and not p_winner_is_bot and coalesce(p_winner_name,'Draw') not in ('Draw','Disconnected') then
    raise exception 'The result must identify a participant or a draw';
  end if;
  if v_tournament.status='finished' then return to_jsonb(v_tournament); end if;
  update public.element6_table_tournaments set status='finished',winner_user_id=p_winner_user_id,
    winner_name=case when p_winner_user_id is not null then (select p.username from public.element6_table_players p where p.tournament_id=p_tournament_id and p.user_id=p_winner_user_id) else coalesce(p_winner_name,'Draw') end,
    winner_is_bot=p_winner_is_bot,updated_at=now()
   where id=p_tournament_id returning * into v_tournament;
  return to_jsonb(v_tournament);
end $$;

create or replace function public.element6_table_requeue_match(p_tournament_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
  v_humans integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_tournament from public.element6_table_tournaments
   where id=p_tournament_id for update;
  if v_tournament.id is null then raise exception 'The Table no longer exists'; end if;
  if v_tournament.host_user_id<>v_user then raise exception 'Only the Table host can start a rematch'; end if;
  if v_tournament.status<>'finished' then raise exception 'The previous match has not finished'; end if;

  delete from public.element6_table_players p
   where p.tournament_id=p_tournament_id and p.last_seen_at<=now()-interval '20 seconds';
  select count(*) into v_humans from public.element6_table_players p
   where p.tournament_id=p_tournament_id and p.last_seen_at>now()-interval '20 seconds';
  if v_humans<2 then raise exception 'At least two connected human players are required for a rematch'; end if;

  update public.element6_table_tournaments set status='queue',bot_slots='[]'::jsonb,
    active_match_id=null,active_p1=null,active_p2=null,winner_user_id=null,winner_name=null,winner_is_bot=false,
    current_round=0,updated_at=now()
   where id=p_tournament_id returning * into v_tournament;
  return to_jsonb(v_tournament);
end $$;

create or replace function public.element6_leave_the_table(p_tournament_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_host uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select host_user_id into v_host from public.element6_table_tournaments
   where id=p_tournament_id for update;
  if not found then return; end if;
  delete from public.element6_table_players where tournament_id=p_tournament_id and user_id=v_user;
  if v_host=v_user then
    update public.element6_table_tournaments t set
      host_user_id=coalesce((select p.user_id from public.element6_table_players p
        where p.tournament_id=p_tournament_id order by p.slot,p.joined_at limit 1),t.host_user_id),
      status=case when exists(select 1 from public.element6_table_players p where p.tournament_id=p_tournament_id)
        then t.status else 'cancelled' end,
      updated_at=now()
    where t.id=p_tournament_id and t.status in ('queue','voting');
  end if;
end $$;

revoke all on function public.element6_join_the_table(text,jsonb) from public,anon;
revoke all on function public.element6_heartbeat_the_table(uuid) from public,anon;
revoke all on function public.element6_table_start_match(uuid,text) from public,anon;
revoke all on function public.element6_table_complete_match(uuid,uuid,uuid,text,boolean) from public,anon;
revoke all on function public.element6_table_requeue_match(uuid) from public,anon;
revoke all on function public.element6_leave_the_table(uuid) from public,anon;
grant execute on function public.element6_join_the_table(text,jsonb) to authenticated;
grant execute on function public.element6_heartbeat_the_table(uuid) to authenticated;
grant execute on function public.element6_table_start_match(uuid,text) to authenticated;
grant execute on function public.element6_table_complete_match(uuid,uuid,uuid,text,boolean) to authenticated;
grant execute on function public.element6_table_requeue_match(uuid) to authenticated;
grant execute on function public.element6_leave_the_table(uuid) to authenticated;

commit;
