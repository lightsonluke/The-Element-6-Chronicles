-- Element 6: fix ambiguous PL/pgSQL variable/table-alias references
-- Run this AFTER Supabase-party-table-race-replays.sql.
-- This only replaces the affected The Table and Race RPC functions.

begin;

-- THE TABLE: use distinct SQL aliases so the PL/pgSQL record variable `t`
-- can never collide with a table alias named `t`.
create or replace function public.element6_join_the_table(
  p_char_id text,
  p_loadout jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid := auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
  v_slot smallint;
  v_count int;
begin
  if v_user_id is null then
    raise exception 'Sign in first';
  end if;

  select count(*)
    into v_count
    from public.element6_table_players as tp
    join public.element6_table_tournaments as tt
      on tt.id = tp.tournament_id
   where tp.user_id = v_user_id
     and tt.status in ('queue','voting','playing');

  if v_count > 0 then
    raise exception 'Already in The Table';
  end if;

  select tt.*
    into v_tournament
    from public.element6_table_tournaments as tt
   where tt.status = 'queue'
   order by tt.created_at
   for update skip locked
   limit 1;

  if v_tournament.id is null then
    insert into public.element6_table_tournaments(host_user_id)
    values (v_user_id)
    returning * into v_tournament;
  end if;

  select coalesce(max(tp.slot), 0) + 1
    into v_slot
    from public.element6_table_players as tp
   where tp.tournament_id = v_tournament.id;

  if v_slot > 8 then
    raise exception 'The Table is full';
  end if;

  insert into public.element6_table_players(
    tournament_id, user_id, slot, username, char_id, loadout
  )
  values (
    v_tournament.id,
    v_user_id,
    v_slot,
    coalesce((select pp.username from public.player_profiles as pp where pp.user_id = v_user_id), 'Player'),
    p_char_id,
    coalesce(p_loadout, '{}'::jsonb)
  );

  select count(*)
    into v_count
    from public.element6_table_players as tp
   where tp.tournament_id = v_tournament.id;

  if v_count = 8 then
    update public.element6_table_tournaments as tt
       set status = 'voting', updated_at = now()
     where tt.id = v_tournament.id;
  end if;

  return jsonb_build_object(
    'tournament_id', v_tournament.id,
    'status', case when v_count = 8 then 'voting' else 'queue' end
  );
end;
$$;

create or replace function public.element6_vote_the_table(
  p_tournament_id uuid,
  p_stage_id text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid := auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
  v_count int;
  v_winner text;
begin
  if not exists (
    select 1
      from public.element6_table_players as tp
     where tp.tournament_id = p_tournament_id
       and tp.user_id = v_user_id
  ) then
    raise exception 'Not a participant';
  end if;

  update public.element6_table_players as tp
     set vote_stage = p_stage_id
   where tp.tournament_id = p_tournament_id
     and tp.user_id = v_user_id;

  select count(*)
    into v_count
    from public.element6_table_players as tp
   where tp.tournament_id = p_tournament_id
     and tp.vote_stage is not null;

  if v_count = 8 then
    select tp.vote_stage
      into v_winner
      from public.element6_table_players as tp
     where tp.tournament_id = p_tournament_id
       and tp.vote_stage is not null
     order by random()
     limit 1;

    update public.element6_table_tournaments as tt
       set stage_id = v_winner,
           status = 'playing',
           updated_at = now()
     where tt.id = p_tournament_id
       and tt.status = 'voting';
  end if;

  select tt.*
    into v_tournament
    from public.element6_table_tournaments as tt
   where tt.id = p_tournament_id;

  return to_jsonb(v_tournament);
end;
$$;

create or replace function public.element6_table_start_next(p_tournament_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid := auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
  v_players uuid[];
  v_p1 uuid;
  v_p2 uuid;
  v_round smallint;
  v_match_id uuid;
begin
  if not exists (
    select 1
      from public.element6_table_players as tp
     where tp.tournament_id = p_tournament_id
       and tp.user_id = v_user_id
  ) then
    raise exception 'Not a participant';
  end if;

  select tt.*
    into v_tournament
    from public.element6_table_tournaments as tt
   where tt.id = p_tournament_id
   for update;

  if v_tournament.id is null or v_tournament.status <> 'playing' then
    return jsonb_build_object('started', false);
  end if;

  if v_tournament.active_match_id is not null
     and exists (
       select 1
         from public.element6_table_rounds as tr
        where tr.tournament_id = v_tournament.id
          and tr.match_id = v_tournament.active_match_id
          and tr.status = 'playing'
     ) then
    return jsonb_build_object('started', false);
  end if;

  select array_agg(tp.user_id order by random())
    into v_players
    from public.element6_table_players as tp
   where tp.tournament_id = v_tournament.id
     and tp.status = 'active';

  if coalesce(array_length(v_players, 1), 0) < 2 then
    if array_length(v_players, 1) = 1 then
      update public.element6_table_players as tp
         set status = 'winner'
       where tp.tournament_id = v_tournament.id
         and tp.user_id = v_players[1];

      update public.element6_table_tournaments as tt
         set status = 'finished',
             winner_user_id = v_players[1],
             updated_at = now()
       where tt.id = v_tournament.id;
    end if;

    return jsonb_build_object('started', false, 'finished', true);
  end if;

  v_p1 := v_players[1];
  v_p2 := v_players[2];
  v_round := v_tournament.current_round + 1;
  v_match_id := gen_random_uuid();

  insert into public.element6_table_rounds(
    tournament_id, round_index, match_id, p1, p2, stage_id
  )
  values (
    v_tournament.id,
    v_round,
    v_match_id,
    v_p1,
    v_p2,
    v_tournament.stage_id
  );

  update public.element6_table_tournaments as tt
     set current_round = v_round,
         active_match_id = v_match_id,
         active_p1 = v_p1,
         active_p2 = v_p2,
         updated_at = now()
   where tt.id = v_tournament.id;

  return jsonb_build_object(
    'started', true,
    'match_id', v_match_id,
    'p1', v_p1,
    'p2', v_p2,
    'stage_id', v_tournament.stage_id,
    'round_index', v_round
  );
end;
$$;

create or replace function public.element6_table_report_result(
  p_tournament_id uuid,
  p_match_id uuid,
  p_winner uuid
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid := auth.uid();
  v_round public.element6_table_rounds%rowtype;
  v_tournament public.element6_table_tournaments%rowtype;
  v_loser uuid;
begin
  select tr.*
    into v_round
    from public.element6_table_rounds as tr
   where tr.tournament_id = p_tournament_id
     and tr.match_id = p_match_id
   for update;

  if v_round.p1 <> v_user_id and v_round.p2 <> v_user_id then
    raise exception 'Not a player in this round';
  end if;

  if v_round.status = 'finished' then
    select tt.*
      into v_tournament
      from public.element6_table_tournaments as tt
     where tt.id = p_tournament_id;
    return to_jsonb(v_tournament);
  end if;

  if p_winner <> v_round.p1 and p_winner <> v_round.p2 then
    raise exception 'Winner is not a player in this round';
  end if;

  v_loser := case when p_winner = v_round.p1 then v_round.p2 else v_round.p1 end;

  update public.element6_table_rounds as tr
     set status = 'finished',
         winner = p_winner,
         loser = v_loser,
         finished_at = now()
   where tr.tournament_id = p_tournament_id
     and tr.round_index = v_round.round_index;

  update public.element6_table_players as tp
     set status = 'eliminated'
   where tp.tournament_id = p_tournament_id
     and tp.user_id = v_loser;

  update public.element6_table_tournaments as tt
     set active_match_id = null,
         active_p1 = null,
         active_p2 = null,
         updated_at = now()
   where tt.id = p_tournament_id;

  select tt.*
    into v_tournament
    from public.element6_table_tournaments as tt
   where tt.id = p_tournament_id;

  return jsonb_build_object(
    'tournament', to_jsonb(v_tournament),
    'winner', p_winner,
    'loser', v_loser
  );
end;
$$;

-- RACE: use distinct aliases so the PL/pgSQL record variable `m`
-- can never collide with a table alias named `m`.
create or replace function public.find_or_create_element6_race(
  p_loadout jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid := auth.uid();
  v_match public.element6_race_matches%rowtype;
  v_slot smallint;
begin
  if v_user_id is null then
    raise exception 'Sign in first';
  end if;

  update public.element6_race_matches as rm
     set status = 'cancelled', updated_at = now()
   where rm.status = 'searching'
     and rm.created_at < now() - interval '90 seconds';

  if exists (
    select 1
      from public.element6_race_players as rp
      join public.element6_race_matches as rm
        on rm.id = rp.match_id
     where rp.user_id = v_user_id
       and rm.status in ('searching','playing')
  ) then
    raise exception 'Already in an active Race match';
  end if;

  select rm.*
    into v_match
    from public.element6_race_matches as rm
   where rm.status = 'searching'
     and rm.host_id <> v_user_id
   order by rm.created_at
   for update skip locked
   limit 1;

  if v_match.id is null then
    insert into public.element6_race_matches(host_id)
    values (v_user_id)
    returning * into v_match;

    insert into public.element6_race_players(
      match_id, user_id, player_slot, loadout
    )
    values (
      v_match.id, v_user_id, 1, coalesce(p_loadout, '{}'::jsonb)
    );

    return jsonb_build_object(
      'match_id', v_match.id,
      'role', 'host',
      'slot', 1
    );
  end if;

  select coalesce(max(rp.player_slot), 0) + 1
    into v_slot
    from public.element6_race_players as rp
   where rp.match_id = v_match.id;

  if v_slot > 30 then
    raise exception 'Race is full';
  end if;

  insert into public.element6_race_players(
    match_id, user_id, player_slot, loadout
  )
  values (
    v_match.id, v_user_id, v_slot, coalesce(p_loadout, '{}'::jsonb)
  );

  return jsonb_build_object(
    'match_id', v_match.id,
    'role', 'guest',
    'slot', v_slot
  );
end;
$$;

create or replace function public.start_element6_race(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user_id uuid := auth.uid();
  v_match public.element6_race_matches%rowtype;
begin
  select rm.*
    into v_match
    from public.element6_race_matches as rm
   where rm.id = p_match_id
   for update;

  if v_match.host_id <> v_user_id then
    raise exception 'Only the host can start Race';
  end if;

  update public.element6_race_matches as rm
     set status = 'playing', updated_at = now()
   where rm.id = p_match_id
     and rm.status = 'searching'
  returning rm.* into v_match;

  return to_jsonb(v_match);
end;
$$;

grant execute on function public.element6_join_the_table(text,jsonb) to authenticated;
grant execute on function public.element6_vote_the_table(uuid,text) to authenticated;
grant execute on function public.element6_table_start_next(uuid) to authenticated;
grant execute on function public.element6_table_report_result(uuid,uuid,uuid) to authenticated;
grant execute on function public.element6_leave_the_table(uuid) to authenticated;
grant execute on function public.find_or_create_element6_race(jsonb) to authenticated;
grant execute on function public.element6_race_heartbeat(uuid) to authenticated;
grant execute on function public.start_element6_race(uuid) to authenticated;
grant execute on function public.leave_element6_race(uuid) to authenticated;

commit;



-- RACE IS REMOVED FROM ELEMENT 6.
-- Clear stale Race state from the earlier implementation and remove its RPCs/tables.
-- This also clears the exact "already in one" state caused by an abandoned Race.

drop function if exists public.find_or_create_element6_race(jsonb);
drop function if exists public.element6_race_heartbeat(uuid);
drop function if exists public.start_element6_race(uuid);
drop function if exists public.leave_element6_race(uuid);
drop function if exists public.is_element6_race_participant(uuid,uuid);

drop table if exists public.element6_race_players cascade;
drop table if exists public.element6_race_matches cascade;

-- Remove Race from party queue validation as well.
create or replace function public.element6_party_prepare_match(p_party_id uuid,p_mode text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user_id uuid:=auth.uid(); v_count int;
begin
  if not exists(select 1 from public.element6_parties where id=p_party_id and host_user_id=v_user_id) then
    raise exception 'Only the party host can queue';
  end if;
  if p_mode not in('customrooms','banger-online','volleyball-online','thetable','battleroyale','grandcircuit-online','lan','soccer-online','dodgeball-online','ctf-online') then
    raise exception 'Unsupported party mode';
  end if;
  select count(*) into v_count from public.element6_party_members where party_id=p_party_id;
  update public.element6_parties set status='queued',queued_mode=p_mode,updated_at=now() where id=p_party_id;
  return jsonb_build_object('party_id',p_party_id,'mode',p_mode,'members',v_count);
end $$;

grant execute on function public.element6_party_prepare_match(uuid,text) to authenticated;

-- USERNAME UNIQUENESS: case-insensitive and enforced before auth metadata is changed.
-- player_profiles already has a unique lower(username) index in the social schema;
-- this RPC also checks auth metadata so a player cannot bypass the rule by having
-- a stale/missing player_profiles row.
create or replace function public.sync_current_username(p_username text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_name text := trim(regexp_replace(coalesce(p_username, ''), '[[:space:]]+', ' ', 'g'));
  v_uid uuid := auth.uid();
  v_taken boolean;
  tbl text;
  col text;
begin
  if v_uid is null then raise exception 'You must be signed in.'; end if;
  if length(v_name) < 2 or length(v_name) > 20 then raise exception 'Username must be 2–20 characters.'; end if;
  if v_name !~ '^[A-Za-z0-9 _.-]+$' then raise exception 'Username contains unsupported characters.'; end if;

  select exists(
    select 1 from public.player_profiles pp
    where lower(trim(pp.username)) = lower(v_name) and pp.user_id <> v_uid
  ) or exists(
    select 1 from auth.users au
    where au.id <> v_uid
      and lower(trim(coalesce(au.raw_user_meta_data->>'username', au.raw_user_meta_data->>'full_name', ''))) = lower(v_name)
  ) into v_taken;

  if v_taken then raise exception 'That username is already taken by another player.'; end if;

  -- The player_profiles unique index is the final database-level guard.
  if to_regclass('public.player_profiles') is not null then
    update public.player_profiles set username=v_name, updated_at=now() where user_id=v_uid;
  end if;

  update auth.users
     set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('username', v_name, 'full_name', v_name),
         updated_at = now()
   where id = v_uid;

  foreach tbl in array array['profiles','player_profiles','shared_leaderboard','presence','online_sport_players','online_match_players','leaderboard_entries','parkour_scores','rock_climb_scores','zipline_scores','honored_bot_matches','player_direct_messages','chat_conversations','friend_requests'] loop
    if to_regclass('public.' || tbl) is not null then
      foreach col in array array['username','user_name','display_name','from_username','to_username'] loop
        if exists (select 1 from information_schema.columns where table_schema='public' and table_name=tbl and column_name=col)
           and exists (select 1 from information_schema.columns where table_schema='public' and table_name=tbl and column_name='user_id') then
          execute format('update public.%I set %I = $1 where user_id = $2', tbl, col) using v_name, v_uid;
        end if;
      end loop;
    end if;
  end loop;

  if to_regclass('public.player_direct_messages') is not null then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='player_direct_messages' and column_name='from_user_id')
       and exists (select 1 from information_schema.columns where table_schema='public' and table_name='player_direct_messages' and column_name='from_username') then
      update public.player_direct_messages set from_username=v_name where from_user_id=v_uid;
    end if;
  end if;
  if to_regclass('public.friend_requests') is not null then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='friend_requests' and column_name='from_user_id')
       and exists (select 1 from information_schema.columns where table_schema='public' and table_name='friend_requests' and column_name='from_username') then
      update public.friend_requests set from_username=v_name where from_user_id=v_uid;
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='friend_requests' and column_name='to_user_id')
       and exists (select 1 from information_schema.columns where table_schema='public' and table_name='friend_requests' and column_name='to_username') then
      update public.friend_requests set to_username=v_name where to_user_id=v_uid;
    end if;
  end if;
end;
$$;

grant execute on function public.sync_current_username(text) to authenticated;

-- ============================================================
-- 2026-09-28 PARTY STATE + THE TABLE RECOVERY + COMMUNITY HUB CHAT
-- ============================================================

-- PARTY: resolve the current player's membership from the member table,
-- not only host_user_id. Also remove memberships pointing at closed/deleted
-- parties so an old record cannot permanently block party creation.
create or replace function public.element6_get_my_party()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_party_id uuid;
  v_status text;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  delete from public.element6_party_members as pm
   where pm.user_id = v_user
     and not exists (
       select 1 from public.element6_parties as ep
        where ep.id = pm.party_id
          and ep.status in ('open','queued','playing')
     );

  select ep.id, ep.status
    into v_party_id, v_status
    from public.element6_party_members as pm
    join public.element6_parties as ep on ep.id = pm.party_id
   where pm.user_id = v_user
     and ep.status in ('open','queued','playing')
   order by ep.updated_at desc, ep.created_at desc
   limit 1;

  if v_party_id is null then return null; end if;
  return public.element6_party_json(v_party_id);
end;
$$;

grant execute on function public.element6_get_my_party() to authenticated;

create or replace function public.element6_create_party(
  p_public boolean default true,
  p_name text default 'Party'
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_party public.element6_parties%rowtype;
  v_code text;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  -- Clear only stale/closed memberships. Never silently remove a real active party.
  delete from public.element6_party_members as pm
   where pm.user_id = v_user
     and not exists (
       select 1 from public.element6_parties as ep
        where ep.id = pm.party_id
          and ep.status in ('open','queued','playing')
     );

  if exists (
    select 1
      from public.element6_party_members as pm
      join public.element6_parties as ep on ep.id = pm.party_id
     where pm.user_id = v_user
       and ep.status in ('open','queued','playing')
  ) then
    raise exception 'You are already in a party';
  end if;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text),1,6));
    begin
      insert into public.element6_parties(
        party_code,host_user_id,host_username,name,is_public
      ) values (
        v_code,
        v_user,
        coalesce((select pp.username from public.player_profiles as pp where pp.user_id=v_user),'Player'),
        coalesce(nullif(trim(p_name),''),'Party'),
        coalesce(p_public,true)
      ) returning * into v_party;
      exit;
    exception when unique_violation then null;
    end;
  end loop;

  insert into public.element6_party_members(party_id,user_id,username,slot)
  values(v_party.id,v_user,v_party.host_username,1);

  return public.element6_party_json(v_party.id);
end;
$$;

grant execute on function public.element6_create_party(boolean,text) to authenticated;

create or replace function public.element6_join_party(
  p_party_id uuid default null,
  p_party_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_party public.element6_parties%rowtype;
  v_slot smallint;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  -- If the user is already in an active party, return it instead of leaving
  -- the client with a false-looking failed join.
  select ep.* into v_party
    from public.element6_party_members as pm
    join public.element6_parties as ep on ep.id=pm.party_id
   where pm.user_id=v_user
     and ep.status in ('open','queued','playing')
   order by ep.updated_at desc
   limit 1;
  if v_party.id is not null then
    return public.element6_party_json(v_party.id);
  end if;

  select ep.* into v_party
    from public.element6_parties as ep
   where ((p_party_id is not null and ep.id=p_party_id)
       or (p_party_code is not null and ep.party_code=upper(trim(p_party_code))))
     and ep.status='open'
   for update;

  if v_party.id is null then raise exception 'Party is unavailable'; end if;

  select coalesce(max(pm.slot),0)+1 into v_slot
    from public.element6_party_members as pm
   where pm.party_id=v_party.id;
  if v_slot>8 then raise exception 'Party is full'; end if;

  insert into public.element6_party_members(party_id,user_id,username,slot)
  values(v_party.id,v_user,v_slot,coalesce((select pp.username from public.player_profiles as pp where pp.user_id=v_user),'Player'))
  on conflict (party_id,user_id) do nothing;

  return public.element6_party_json(v_party.id);
end;
$$;

grant execute on function public.element6_join_party(uuid,text) to authenticated;

create or replace function public.element6_leave_party(p_party_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_host uuid;
  v_new_host uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select ep.host_user_id into v_host from public.element6_parties as ep where ep.id=p_party_id for update;
  if v_host is null then raise exception 'Party not found'; end if;
  if not exists(select 1 from public.element6_party_members as pm where pm.party_id=p_party_id and pm.user_id=v_user) then
    raise exception 'You are not in this party';
  end if;

  delete from public.element6_party_members as pm where pm.party_id=p_party_id and pm.user_id=v_user;

  if v_host=v_user then
    select pm.user_id into v_new_host
      from public.element6_party_members as pm
     where pm.party_id=p_party_id
     order by pm.slot
     limit 1;
    if v_new_host is null then
      delete from public.element6_parties as ep where ep.id=p_party_id;
    else
      update public.element6_parties as ep
         set host_user_id=v_new_host,updated_at=now()
       where ep.id=p_party_id;
    end if;
  end if;
end;
$$;

grant execute on function public.element6_leave_party(uuid) to authenticated;

-- THE TABLE: return the current membership so the client can recover from a
-- refresh/reload instead of appearing to ignore the JOIN button.
create or replace function public.element6_get_my_table()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_status text;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select tt.id,tt.status into v_id,v_status
    from public.element6_table_players as tp
    join public.element6_table_tournaments as tt on tt.id=tp.tournament_id
   where tp.user_id=v_user
     and tt.status in ('queue','voting','playing')
   order by tt.updated_at desc
   limit 1;
  if v_id is null then return null; end if;
  return jsonb_build_object('tournament_id',v_id,'status',v_status);
end;
$$;

grant execute on function public.element6_get_my_table() to authenticated;

-- Replace the Table join RPC so an existing active membership is recoverable.
-- A lone queue membership older than 30 minutes is treated as stale and cleaned.
create or replace function public.element6_join_the_table(
  p_char_id text,
  p_loadout jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_existing public.element6_table_tournaments%rowtype;
  v_tournament public.element6_table_tournaments%rowtype;
  v_slot smallint;
  v_count int;
  v_existing_count int;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  select tt.* into v_existing
    from public.element6_table_players as tp
    join public.element6_table_tournaments as tt on tt.id=tp.tournament_id
   where tp.user_id=v_user
     and tt.status in ('queue','voting','playing')
   order by tt.updated_at desc
   limit 1;

  if v_existing.id is not null then
    select count(*) into v_existing_count
      from public.element6_table_players as tp
     where tp.tournament_id=v_existing.id;

    if v_existing.status='queue'
       and v_existing.created_at < now()-interval '30 minutes'
       and v_existing_count <= 1 then
      delete from public.element6_table_players as tp where tp.tournament_id=v_existing.id and tp.user_id=v_user;
      delete from public.element6_table_tournaments as tt where tt.id=v_existing.id;
      v_existing.id := null;
    else
      return jsonb_build_object('tournament_id',v_existing.id,'status',v_existing.status);
    end if;
  end if;

  select tt.* into v_tournament
    from public.element6_table_tournaments as tt
   where tt.status='queue'
   order by tt.created_at
   for update skip locked
   limit 1;

  if v_tournament.id is null then
    insert into public.element6_table_tournaments(host_user_id)
    values(v_user) returning * into v_tournament;
  end if;

  select coalesce(max(tp.slot),0)+1 into v_slot
    from public.element6_table_players as tp
   where tp.tournament_id=v_tournament.id;
  if v_slot>8 then raise exception 'The Table is full'; end if;

  insert into public.element6_table_players(
    tournament_id,user_id,slot,username,char_id,loadout
  ) values(
    v_tournament.id,v_user,v_slot,
    coalesce((select pp.username from public.player_profiles as pp where pp.user_id=v_user),'Player'),
    p_char_id,coalesce(p_loadout,'{}'::jsonb)
  );

  select count(*) into v_count from public.element6_table_players as tp where tp.tournament_id=v_tournament.id;
  if v_count=8 then
    update public.element6_table_tournaments as tt set status='voting',updated_at=now() where tt.id=v_tournament.id;
  end if;

  return jsonb_build_object('tournament_id',v_tournament.id,'status',case when v_count=8 then 'voting' else 'queue' end);
end;
$$;

grant execute on function public.element6_join_the_table(text,jsonb) to authenticated;

-- COMMUNITY HUB CHAT: shared server/world/party chat instead of browser-local
-- localBackend storage. Messages are visible across players and tabs.
create table if not exists public.community_hub_chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null check(channel in ('server','world','party')),
  channel_key text not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_username text not null default 'Player',
  body text not null check(char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists community_hub_chat_channel_time
  on public.community_hub_chat_messages(channel,channel_key,created_at desc);

alter table public.community_hub_chat_messages enable row level security;
drop policy if exists community_hub_chat_read on public.community_hub_chat_messages;
create policy community_hub_chat_read on public.community_hub_chat_messages
for select to authenticated using (
  channel in ('world','server')
  or exists (
    select 1 from public.element6_party_members as pm
     where community_hub_chat_messages.channel='party'
       and pm.party_id::text=community_hub_chat_messages.channel_key
       and pm.user_id=auth.uid()
  )
);
drop policy if exists community_hub_chat_insert on public.community_hub_chat_messages;
create policy community_hub_chat_insert on public.community_hub_chat_messages
for insert to authenticated with check (
  sender_id=auth.uid()
  and (
    channel in ('world','server')
    or exists (
      select 1 from public.element6_party_members as pm
       where community_hub_chat_messages.channel='party'
         and pm.party_id::text=community_hub_chat_messages.channel_key
         and pm.user_id=auth.uid()
    )
  )
);

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname='supabase_realtime'
       and schemaname='public'
       and tablename='community_hub_chat_messages'
  ) then
    alter publication supabase_realtime add table public.community_hub_chat_messages;
  end if;
end $$;

grant select,insert on public.community_hub_chat_messages to authenticated;
