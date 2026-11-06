-- Party Battle Royale queue and recovery.
-- Apply after Supabase-battle-royale-custom-rooms-and-elo-search.sql,
-- Supabase-party-table-integration.sql, and
-- Supabase-party-sports-and-host-migration.sql.
begin;

alter table public.element6_parties
  add column if not exists active_battle_royale_match_id uuid
    references public.online_battle_royale_matches(id) on delete set null;
alter table public.online_battle_royale_matches
  add column if not exists party_id uuid references public.element6_parties(id) on delete set null;
create index if not exists online_battle_royale_party_active_idx
  on public.online_battle_royale_matches(party_id,status) where party_id is not null;

-- The lobby watches this Supabase row. The older renderer only wrote its
-- completion state to browser-local storage, leaving matches stuck as active.
create or replace function public.element6_finish_battle_royale(
  p_match_id uuid,
  p_result jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_user uuid:=auth.uid();
  v_match public.online_battle_royale_matches%rowtype;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if jsonb_typeof(coalesce(p_result,'{}'::jsonb)) is distinct from 'object'
     or octet_length(coalesce(p_result,'{}'::jsonb)::text)>16000 then
    raise exception 'Battle Royale result data is invalid';
  end if;
  select * into v_match from public.online_battle_royale_matches where id=p_match_id for update;
  if v_match.id is null or v_match.host_id<>v_user then
    raise exception 'Only the Battle Royale host can finish this match';
  end if;
  if v_match.status='playing' then
    update public.online_battle_royale_matches
      set status='finished',
          authoritative_state=coalesce(authoritative_state,'{}'::jsonb)||jsonb_build_object('result',p_result),
          updated_at=now()
      where id=p_match_id returning * into v_match;
  elsif v_match.status<>'finished' then
    raise exception 'Battle Royale match is not active';
  end if;
  return jsonb_build_object('match_id',v_match.id,'status',v_match.status,
    'authoritative_state',v_match.authoritative_state);
end;
$$;
revoke all on function public.element6_finish_battle_royale(uuid,jsonb) from public,anon;
grant execute on function public.element6_finish_battle_royale(uuid,jsonb) to authenticated;

-- Harden the original start RPC too, so clients cannot skip the party roster
-- gate by calling the public Battle Royale start function directly.
create or replace function public.start_element6_battle_royale(
  p_match_id uuid,
  p_max_players smallint default 50,
  p_bot_difficulty text default 'honored'
) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_user uuid:=auth.uid();
  v_match public.online_battle_royale_matches%rowtype;
  v_party_count integer;
  v_joined_count integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_match from public.online_battle_royale_matches where id=p_match_id for update;
  if v_match.id is null or v_match.host_id<>v_user then raise exception 'Only the host can start this match'; end if;
  if v_match.status='playing' then return jsonb_build_object('match',to_jsonb(v_match)); end if;
  if v_match.status<>'searching' then raise exception 'This Battle Royale match is no longer open'; end if;
  if coalesce(p_max_players,50) not between 2 and 50 then raise exception 'Battle Royale player count must be between 2 and 50'; end if;
  if coalesce(p_bot_difficulty,'honored') not in ('newcomer','beginner','easy','amateur','regular','pro','hard','insane','honored') then
    raise exception 'Bot difficulty is not supported';
  end if;
  if v_match.party_id is not null then
    if not exists(select 1 from public.element6_parties p
      where p.id=v_match.party_id and p.host_user_id=v_user
        and p.queued_mode='battleroyale' and p.active_battle_royale_match_id=v_match.id) then
      raise exception 'The party no longer owns this Battle Royale session';
    end if;
    if exists(select 1 from public.element6_party_members pm
      left join public.element6_app_presence ap on ap.user_id=pm.user_id
      where pm.party_id=v_match.party_id and (pm.spectator or not pm.is_ready
        or ap.user_id is null or ap.updated_at<=now()-interval '90 seconds' or ap.app_status='away')) then
      raise exception 'Every party player must remain online and ready until the match starts';
    end if;
    select count(*) into v_party_count from public.element6_party_members pm
      where pm.party_id=v_match.party_id and not pm.spectator;
    select count(*) into v_joined_count from public.online_battle_royale_players bp
      join public.element6_party_members pm on pm.party_id=v_match.party_id and pm.user_id=bp.user_id
      where bp.match_id=v_match.id and not pm.spectator;
    if v_party_count not between 2 and 8 or v_joined_count<>v_party_count
       or exists(select 1 from public.online_battle_royale_players bp
         where bp.match_id=v_match.id and not exists(select 1 from public.element6_party_members pm
           where pm.party_id=v_match.party_id and pm.user_id=bp.user_id and not pm.spectator)) then
      raise exception 'Every party member must choose a fighter before the match starts';
    end if;
  end if;
  update public.online_battle_royale_matches
    set max_players=least(50,greatest(2,coalesce(p_max_players,50))),
        settings=jsonb_set(coalesce(settings,'{}'::jsonb),'{botDifficulty}',to_jsonb(coalesce(p_bot_difficulty,'honored')),true),
        status='playing',updated_at=now()
    where id=p_match_id returning * into v_match;
  return jsonb_build_object('match',to_jsonb(v_match));
end;
$$;
revoke all on function public.start_element6_battle_royale(uuid,smallint,text) from public,anon;
grant execute on function public.start_element6_battle_royale(uuid,smallint,text) to authenticated;

create or replace function public.element6_party_json(p_party_id uuid)
returns jsonb language sql security definer stable set search_path=pg_catalog,public as $$
  select jsonb_build_object(
    'id',p.id,'party_code',p.party_code,'host_user_id',p.host_user_id,
    'host_username',p.host_username,'name',p.name,'is_public',p.is_public,
    'status',p.status,'queued_mode',p.queued_mode,
    'active_room_id',p.active_room_id,'active_table_id',p.active_table_id,
    'active_sport_match_id',p.active_sport_match_id,
    'active_battle_royale_match_id',p.active_battle_royale_match_id,
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
  ) from public.element6_parties p where p.id=p_party_id;
$$;

create or replace function public.element6_party_prepare_battle_royale(p_party_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_user uuid:=auth.uid();
  v_party public.element6_parties%rowtype;
  v_count integer; v_unready integer; v_unavailable integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null then raise exception 'Party is unavailable'; end if;
  if v_party.host_user_id<>v_user then raise exception 'Only the party host can launch Battle Royale'; end if;
  if v_party.status not in ('open','queued') then raise exception 'The party is already in an activity'; end if;
  if exists(select 1 from public.element6_party_members where party_id=p_party_id and spectator) then
    raise exception 'Spectators cannot enter Battle Royale';
  end if;
  select count(*),count(*) filter(where not m.is_ready),
    count(*) filter(where ap.user_id is null or ap.updated_at<=now()-interval '90 seconds' or ap.app_status='away')
    into v_count,v_unready,v_unavailable
    from public.element6_party_members m left join public.element6_app_presence ap on ap.user_id=m.user_id
    where m.party_id=p_party_id;
  if v_count<2 then raise exception 'Party Battle Royale requires at least two members'; end if;
  if v_count>8 then raise exception 'Party Battle Royale supports up to eight party members'; end if;
  if v_unready>0 then raise exception 'Every party member must be ready before launch'; end if;
  if v_unavailable>0 then raise exception 'Every party member must be online before launch'; end if;
  if v_party.active_room_id is not null and exists(select 1 from public.online_custom_rooms r where r.id=v_party.active_room_id and r.status in ('waiting','playing')) then
    raise exception 'Leave the active Custom Room before launching Battle Royale';
  end if;
  if v_party.active_table_id is not null and exists(select 1 from public.element6_table_tournaments t where t.id=v_party.active_table_id and t.status in ('queue','voting','playing')) then
    raise exception 'Leave The Table before launching Battle Royale';
  end if;
  if v_party.active_sport_match_id is not null and exists(select 1 from public.online_sport_matches m where m.id=v_party.active_sport_match_id and m.status in ('searching','matched','active')) then
    raise exception 'Leave the active sport match before launching Battle Royale';
  end if;
  update public.element6_parties set status='queued',queued_mode='battleroyale',
    active_room_id=null,active_table_id=null,active_sport_match_id=null,
    active_battle_royale_match_id=null,updated_at=now() where id=p_party_id;
  return public.element6_party_json(p_party_id);
end;
$$;

create or replace function public.element6_party_join_battle_royale(p_party_id uuid,p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_user uuid:=auth.uid();
  v_party public.element6_parties%rowtype;
  v_match public.online_battle_royale_matches%rowtype;
  v_slot smallint;
  v_count integer;
  v_progress jsonb;
  v_loadout jsonb;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if jsonb_typeof(coalesce(p_loadout,'{}'::jsonb)) is distinct from 'object' or octet_length(coalesce(p_loadout,'{}'::jsonb)::text)>4000 then
    raise exception 'Battle Royale character selection is invalid';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_party_id::text,0));
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null or not exists(select 1 from public.element6_party_members m where m.party_id=p_party_id and m.user_id=v_user) then
    raise exception 'You are not a member of this party';
  end if;
  if v_party.status<>'queued' or v_party.queued_mode<>'battleroyale' then
    raise exception 'The party is not queued for Battle Royale';
  end if;
  if exists(select 1 from public.element6_party_members m where m.party_id=p_party_id and m.spectator) then
    raise exception 'Spectators cannot enter Battle Royale';
  end if;
  select * into v_match from public.online_battle_royale_matches m
   where m.id=v_party.active_battle_royale_match_id and m.party_id=p_party_id for update;
  if v_match.id is null then
    insert into public.online_battle_royale_matches(host_id,party_id,status,max_players)
      values(v_party.host_user_id,p_party_id,'searching',50) returning * into v_match;
    update public.element6_parties set active_battle_royale_match_id=v_match.id,updated_at=now() where id=p_party_id;
  elsif v_match.status<>'searching' then
    raise exception 'The party Battle Royale match has already started';
  end if;

  select player_slot into v_slot from public.online_battle_royale_players where match_id=v_match.id and user_id=v_user;
  if v_slot is null then
    select count(*) into v_count from public.online_battle_royale_players where match_id=v_match.id;
    if v_count>=8 then raise exception 'The party Battle Royale roster is full'; end if;
    v_slot:=v_count+1;
  end if;
  select progress_json into v_progress from public.user_progress where user_id=v_user;
  v_loadout:=coalesce(p_loadout,'{}'::jsonb)
    || jsonb_build_object('username',coalesce(nullif(p_loadout->>'username',''),(select username from public.element6_party_members where party_id=p_party_id and user_id=v_user),'Player'));
  if nullif(v_loadout->>'character_id','') is null then
    v_loadout:=jsonb_set(v_loadout,'{character_id}',to_jsonb(coalesce(nullif(v_progress->>'favoriteId',''),'yellow')),true);
  end if;
  insert into public.online_battle_royale_players(match_id,user_id,player_slot,loadout)
    values(v_match.id,v_user,v_slot,v_loadout)
  on conflict(match_id,user_id) do update set loadout=excluded.loadout;
  return jsonb_build_object('match_id',v_match.id,'party_id',p_party_id,
    'role',case when v_user=v_party.host_user_id then 'host' else 'guest' end,
    'slot',v_slot,'seed',v_match.random_seed);
end;
$$;

create or replace function public.element6_party_start_battle_royale(
  p_party_id uuid,p_match_id uuid,p_max_players smallint default 50,p_bot_difficulty text default 'honored'
) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_user uuid:=auth.uid();
  v_party public.element6_parties%rowtype;
  v_match public.online_battle_royale_matches%rowtype;
  v_party_count integer; v_joined_count integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null or v_party.host_user_id<>v_user then raise exception 'Only the party host can start Battle Royale'; end if;
  if v_party.active_battle_royale_match_id is distinct from p_match_id then raise exception 'This is not the active party match'; end if;
  select * into v_match from public.online_battle_royale_matches where id=p_match_id and party_id=p_party_id for update;
  if v_match.id is null then raise exception 'The party match is unavailable'; end if;
  select count(*) into v_party_count from public.element6_party_members where party_id=p_party_id and not spectator;
  select count(*) into v_joined_count from public.online_battle_royale_players bp
    join public.element6_party_members pm on pm.user_id=bp.user_id and pm.party_id=p_party_id
    where bp.match_id=p_match_id and not pm.spectator;
  if v_party_count<2 or v_party_count>8 or v_joined_count<>v_party_count then
    raise exception 'Every party member must choose a fighter before the match starts';
  end if;
  return public.start_element6_battle_royale(p_match_id,p_max_players,p_bot_difficulty);
end;
$$;

create or replace function public.element6_cancel_party_battle_royale(p_party_id uuid,p_match_id uuid default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_user uuid:=auth.uid();
  v_party public.element6_parties%rowtype;
  v_match_id uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null or not exists(select 1 from public.element6_party_members m where m.party_id=p_party_id and m.user_id=v_user) then
    raise exception 'You are not a member of this party';
  end if;
  v_match_id:=coalesce(p_match_id,v_party.active_battle_royale_match_id);
  if v_match_id is not null and exists(select 1 from public.online_battle_royale_matches m where m.id=v_match_id and m.party_id=p_party_id and m.status='playing') then
    raise exception 'A started party match cannot be canceled';
  end if;
  if v_match_id is not null then
    update public.online_battle_royale_matches set status='cancelled',updated_at=now()
      where id=v_match_id and party_id=p_party_id and status='searching';
  end if;
  update public.element6_parties set status='open',queued_mode=null,active_battle_royale_match_id=null,updated_at=now()
    where id=p_party_id and queued_mode='battleroyale';
  update public.element6_party_members set is_ready=false where party_id=p_party_id;
  return public.element6_party_json(p_party_id);
end;
$$;

create or replace function public.element6_finish_party_battle_royale(p_party_id uuid,p_match_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
  v_user uuid:=auth.uid();
  v_match public.online_battle_royale_matches%rowtype;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_match from public.online_battle_royale_matches where id=p_match_id and party_id=p_party_id for update;
  if v_match.id is null or not exists(select 1 from public.online_battle_royale_players p where p.match_id=p_match_id and p.user_id=v_user) then
    raise exception 'You are not a participant in this party match';
  end if;
  if v_match.status<>'finished' then
    raise exception 'The shared match is still active; wait for the host to finish it';
  end if;
  update public.element6_parties set status='open',queued_mode=null,active_battle_royale_match_id=null,updated_at=now()
    where id=p_party_id and active_battle_royale_match_id=p_match_id;
  update public.element6_party_members set is_ready=false where party_id=p_party_id;
  return public.element6_party_json(p_party_id);
end;
$$;

-- Public matchmaking must never put a solo queue player into a private party match.
create or replace function public.find_or_create_element6_battle_royale(p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare u uuid:=auth.uid(); m public.online_battle_royale_matches%rowtype; slot smallint;
begin
  if u is null then raise exception 'Sign in first'; end if;
  update public.online_battle_royale_matches set status='cancelled',updated_at=now()
    where status='searching' and party_id is null and created_at<now()-interval '90 seconds'
      and not exists(select 1 from public.online_battle_royale_players p where p.match_id=id);
  if exists(select 1 from public.online_battle_royale_players p join public.online_battle_royale_matches m on m.id=p.match_id
    where p.user_id=u and m.status in ('searching','playing')) then raise exception 'Already in an active Battle Royale match'; end if;
  select * into m from public.online_battle_royale_matches where status='searching' and party_id is null and host_id<>u
    order by created_at asc limit 1 for update skip locked;
  if m.id is null then
    insert into public.online_battle_royale_matches(host_id) values(u) returning * into m;
    insert into public.online_battle_royale_players(match_id,user_id,player_slot,loadout) values(m.id,u,1,coalesce(p_loadout,'{}'::jsonb));
    return jsonb_build_object('match_id',m.id,'role','host','slot',1,'seed',m.random_seed);
  end if;
  select coalesce(max(player_slot),0)+1 into slot from public.online_battle_royale_players where match_id=m.id;
  if slot>m.max_players then raise exception 'Match filled; try again'; end if;
  insert into public.online_battle_royale_players(match_id,user_id,player_slot,loadout) values(m.id,u,slot,coalesce(p_loadout,'{}'::jsonb));
  return jsonb_build_object('match_id',m.id,'role','guest','slot',slot,'seed',m.random_seed);
end;
$$;

revoke all on function public.element6_party_prepare_battle_royale(uuid),
  public.element6_party_join_battle_royale(uuid,jsonb),
  public.element6_party_start_battle_royale(uuid,uuid,smallint,text),
  public.element6_cancel_party_battle_royale(uuid,uuid),
  public.element6_finish_party_battle_royale(uuid,uuid) from public,anon;
grant execute on function public.element6_party_prepare_battle_royale(uuid),
  public.element6_party_join_battle_royale(uuid,jsonb),
  public.element6_party_start_battle_royale(uuid,uuid,smallint,text),
  public.element6_cancel_party_battle_royale(uuid,uuid),
  public.element6_finish_party_battle_royale(uuid,uuid) to authenticated;
grant execute on function public.find_or_create_element6_battle_royale(jsonb) to authenticated;

commit;
