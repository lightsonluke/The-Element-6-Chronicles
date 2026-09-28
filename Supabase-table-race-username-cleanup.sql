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
