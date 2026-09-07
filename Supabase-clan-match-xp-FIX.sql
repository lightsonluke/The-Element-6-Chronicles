-- ELEMENT 6 - CLAN MATCH XP FIX
-- Targeted additive migration. Does NOT replace the clan system.
--
-- IMPORTANT:
-- The existing clan system already has element6_record_clan_activity(), but that
-- function is only a server-side hook; it does not magically know when a local
-- match ends. The game must call a completion endpoint for offline matches.
-- This migration fixes the server endpoint and automatically awards XP for
-- matches that are already recorded in the existing online match tables.

begin;

-- ---------------------------------------------------------------------------
-- Secure, authenticated match-completion endpoint for ANY game mode.
-- The client never supplies another user's id. auth.uid() is used.
-- ---------------------------------------------------------------------------
create or replace function public.element6_record_clan_match_completion(
  p_mode text,
  p_source_match_id text default null,
  p_xp integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_event_key text;
  v_result jsonb;
begin
  if v_user is null then
    raise exception 'Sign in first';
  end if;

  if p_mode not in (
    'regularbattle',
    'bot_ranked',
    'time_battle',
    'ranked',
    'unranked',
    'soccer',
    'soccer_ranked',
    'soccer_online',
    'volleyball',
    'volleyball_1v1_ranked',
    'volleyball_2v2_online',
    'dodgeball',
    'dodgeball_ranked',
    'dodgeball_online',
    'baseball',
    'banger',
    'banger_online',
    'battle_royale',
    'custom_room'
  ) then
    raise exception 'Unsupported clan XP mode: %', p_mode;
  end if;

  if p_xp < 1 or p_xp > 100 then
    raise exception 'Clan XP must be between 1 and 100';
  end if;

  v_event_key := 'match_complete:' || p_mode;

  select public.element6_record_clan_activity(
    v_user,
    v_event_key,
    p_xp,
    nullif(trim(coalesce(p_source_match_id,'')), '')
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.element6_record_clan_match_completion(text,text,integer) from public, anon;
grant execute on function public.element6_record_clan_match_completion(text,text,integer) to authenticated;

-- ---------------------------------------------------------------------------
-- ONLINE MATCHES: automatically award clan XP when an online match becomes
-- finished/finalized. This covers Ranked and Unranked combat matches already
-- stored in public.online_matches.
-- ---------------------------------------------------------------------------
create or replace function public.element6_award_clan_xp_from_online_match()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_xp integer := 5;
  p record;
  v_mode text;
begin
  if new.status <> 'finished' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'finished' then
    return new;
  end if;

  v_mode := case
    when new.mode = 'ranked' then 'ranked'
    when new.mode = 'unranked' then 'unranked'
    else new.mode
  end;

  for p in
    select user_id
    from public.online_matches_players
    where match_id = new.id
  loop
    perform public.element6_record_clan_activity(
      p.user_id,
      'match_complete:' || v_mode,
      v_xp,
      new.id::text
    );
  end loop;

  return new;
exception
  when undefined_table then
    -- Older installs may not have an online_matches_players table. Do not make
    -- match completion fail because the optional player table is absent.
    return new;
end;
$$;

-- Do not create the trigger unless the base table exists.
do $$
begin
  if to_regclass('public.online_matches') is not null
     and to_regclass('public.online_matches_players') is not null then
    drop trigger if exists element6_award_clan_xp_online_match on public.online_matches;
    create trigger element6_award_clan_xp_online_match
      after insert or update of status on public.online_matches
      for each row
      when (new.status = 'finished')
      execute function public.element6_award_clan_xp_from_online_match();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- ONLINE SPORTS: automatically award XP when a sport match is finalized.
-- ---------------------------------------------------------------------------
create or replace function public.element6_award_clan_xp_from_sport_match()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  p record;
  v_xp integer := 5;
begin
  if new.status <> 'finished' or coalesce(new.result_status,'') <> 'finalized' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.status = 'finished'
     and old.result_status = 'finalized' then
    return new;
  end if;

  for p in
    select user_id
    from public.online_sport_players
    where match_id = new.id
  loop
    perform public.element6_record_clan_activity(
      p.user_id,
      'match_complete:' || new.mode,
      v_xp,
      new.id::text
    );
  end loop;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.online_sport_matches') is not null
     and to_regclass('public.online_sport_players') is not null then
    drop trigger if exists element6_award_clan_xp_sport_match on public.online_sport_matches;
    create trigger element6_award_clan_xp_sport_match
      after insert or update of status, result_status on public.online_sport_matches
      for each row
      when (new.status = 'finished' and new.result_status = 'finalized')
      execute function public.element6_award_clan_xp_from_sport_match();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Repair/backfill the exact problem class: completed online matches that were
-- already finished before the trigger was installed.
-- This is intentionally idempotent because source_match_id is unique per
-- clan/member/event.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  p record;
begin
  if to_regclass('public.online_matches') is not null
     and to_regclass('public.online_matches_players') is not null then
    for r in
      select id, mode
      from public.online_matches
      where status = 'finished'
        and mode in ('ranked','unranked')
    loop
      for p in
        select user_id from public.online_matches_players where match_id=r.id
      loop
        perform public.element6_record_clan_activity(
          p.user_id,
          'match_complete:' || r.mode,
          5,
          r.id::text
        );
      end loop;
    end loop;
  end if;
end;
$$;

do $$
declare
  r record;
  p record;
begin
  if to_regclass('public.online_sport_matches') is not null
     and to_regclass('public.online_sport_players') is not null then
    for r in
      select id, mode
      from public.online_sport_matches
      where status = 'finished'
        and result_status = 'finalized'
    loop
      for p in
        select user_id from public.online_sport_players where match_id=r.id
      loop
        perform public.element6_record_clan_activity(
          p.user_id,
          'match_complete:' || r.mode,
          5,
          r.id::text
        );
      end loop;
    end loop;
  end if;
end;
$$;

commit;
