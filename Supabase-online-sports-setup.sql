-- Element 6 Online Sports: queues, team slots, and protected sport ratings.
-- Run this whole file in Supabase SQL Editor. It is safe to run again.

create extension if not exists pgcrypto;

create table if not exists public.online_sport_matches (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in (
    'soccer_ranked', 'soccer_online',
    'volleyball_1v1_ranked', 'volleyball_2v2_online',
    'dodgeball_ranked', 'dodgeball_online', 'banger_online'
  )),
  required_players smallint not null check (required_players in (2, 4, 6)),
  status text not null default 'searching' check (status in ('searching', 'matched', 'active', 'finished', 'cancelled', 'disputed')),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  winner_team smallint check (winner_team in (1, 2) or winner_team is null),
  result_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.online_sport_players (
  match_id uuid not null references public.online_sport_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  slot smallint not null,
  team smallint not null check (team in (1, 2)),
  character_id text not null,
  loadout jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (match_id, user_id),
  unique (match_id, slot)
);

create table if not exists public.online_sport_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('soccer_ranked', 'volleyball_1v1_ranked', 'dodgeball_ranked')),
  rating integer not null default 1000 check (rating >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  matches_played integer not null default 0 check (matches_played >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, mode)
);

create table if not exists public.online_sport_result_reports (
  match_id uuid not null references public.online_sport_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  winner_team smallint not null check (winner_team in (1, 2)),
  final_frame integer not null check (final_frame >= 0),
  final_checksum text not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create index if not exists online_sport_match_queue_idx on public.online_sport_matches(mode, status, created_at);
create index if not exists online_sport_player_match_idx on public.online_sport_players(match_id, slot);

alter table public.online_sport_matches enable row level security;
alter table public.online_sport_players enable row level security;
alter table public.online_sport_ratings enable row level security;
alter table public.online_sport_result_reports enable row level security;

drop policy if exists "sport participants can view matches" on public.online_sport_matches;
create policy "sport participants can view matches" on public.online_sport_matches
  for select to authenticated using (
    exists (select 1 from public.online_sport_players p where p.match_id = id and p.user_id = auth.uid())
  );

drop policy if exists "sport participants can view players" on public.online_sport_players;
create policy "sport participants can view players" on public.online_sport_players
  for select to authenticated using (
    exists (select 1 from public.online_sport_players mine where mine.match_id = online_sport_players.match_id and mine.user_id = auth.uid())
  );

drop policy if exists "sport ratings readable" on public.online_sport_ratings;
create policy "sport ratings readable" on public.online_sport_ratings for select to authenticated using (true);

drop policy if exists "sport reports visible to reporter" on public.online_sport_result_reports;
create policy "sport reports visible to reporter" on public.online_sport_result_reports for select to authenticated using (user_id = auth.uid());

revoke insert, update, delete on public.online_sport_matches from anon, authenticated;
revoke insert, update, delete on public.online_sport_players from anon, authenticated;
revoke insert, update, delete on public.online_sport_ratings from anon, authenticated;
revoke insert, update, delete on public.online_sport_result_reports from anon, authenticated;
grant select on public.online_sport_matches, public.online_sport_players, public.online_sport_ratings, public.online_sport_result_reports to authenticated;

create or replace function public.online_sport_required_players(p_mode text)
returns smallint language sql immutable as $$
  select case p_mode
    when 'volleyball_2v2_online' then 4
    when 'banger_online' then 6
    else 2
  end::smallint;
$$;

create or replace function public.join_online_sport_queue(p_mode text, p_character_id text, p_loadout jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_match public.online_sport_matches%rowtype;
  v_required smallint;
  v_slot smallint;
  v_team smallint;
  v_count integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_mode not in ('soccer_ranked','soccer_online','volleyball_1v1_ranked','volleyball_2v2_online','dodgeball_ranked','dodgeball_online','banger_online') then
    raise exception 'Unsupported sport mode';
  end if;
  if coalesce(length(trim(p_character_id)), 0) = 0 then raise exception 'Choose a character'; end if;
  v_required := public.online_sport_required_players(p_mode);

  -- Remove only this player's abandoned searching entry before retrying.
  delete from public.online_sport_players p
  using public.online_sport_matches m
  where p.match_id = m.id and p.user_id = v_user and m.status = 'searching';
  update public.online_sport_matches m set status = 'cancelled', updated_at = now()
  where m.status = 'searching' and not exists (select 1 from public.online_sport_players p where p.match_id = m.id);

  select m.* into v_match
  from public.online_sport_matches m
  where m.mode = p_mode and m.status = 'searching'
    and (select count(*) from public.online_sport_players p where p.match_id = m.id) < m.required_players
  order by m.created_at
  for update skip locked
  limit 1;

  if v_match.id is null then
    insert into public.online_sport_matches(mode, required_players, host_user_id)
    values (p_mode, v_required, v_user)
    returning * into v_match;
  end if;

  select count(*) into v_count from public.online_sport_players where match_id = v_match.id;
  v_slot := v_count;
  v_team := case
    when v_required = 2 then case when v_slot = 0 then 1 else 2 end
    when v_required = 4 then case when v_slot in (0, 2) then 1 else 2 end
    when v_required = 6 then case when v_slot < 3 then 1 else 2 end
  end;

  insert into public.online_sport_players(match_id, user_id, slot, team, character_id, loadout)
  values (v_match.id, v_user, v_slot, v_team, p_character_id, coalesce(p_loadout, '{}'::jsonb));

  if v_count + 1 = v_required then
    update public.online_sport_matches set status = 'matched', updated_at = now() where id = v_match.id returning * into v_match;
  else
    select * into v_match from public.online_sport_matches where id = v_match.id;
  end if;

  return jsonb_build_object('match', to_jsonb(v_match), 'slot', v_slot, 'team', v_team, 'requiredPlayers', v_required);
end;
$$;

create or replace function public.online_sport_heartbeat(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.online_sport_players set last_seen = now() where match_id = p_match_id and user_id = auth.uid();
end;
$$;

create or replace function public.leave_online_sport_queue(p_match_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.online_sport_players where match_id = p_match_id and user_id = auth.uid();
  update public.online_sport_matches m set status = 'cancelled', updated_at = now()
  where m.id = p_match_id and m.status in ('searching', 'matched')
    and not exists (select 1 from public.online_sport_players p where p.match_id = m.id);
end;
$$;

create or replace function public.get_my_online_sport_ratings()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); begin
  if v_user is null then raise exception 'Sign in first'; end if;
  insert into public.online_sport_ratings(user_id, mode)
  values (v_user, 'soccer_ranked'), (v_user, 'volleyball_1v1_ranked'), (v_user, 'dodgeball_ranked')
  on conflict (user_id, mode) do nothing;
  return coalesce((select jsonb_object_agg(mode, to_jsonb(r)) from public.online_sport_ratings r where r.user_id = v_user), '{}'::jsonb);
end;
$$;

-- Results are finalized only when every participant submits the same frame/checksum/winner.
create or replace function public.report_online_sport_result(p_match_id uuid, p_winner_team smallint, p_final_frame integer, p_final_checksum text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_match public.online_sport_matches%rowtype;
  v_expected integer; v_reports integer; v_disagreements integer; v_user uuid := auth.uid();
  v_is_ranked boolean; v_own_team smallint; v_change integer := 16;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_winner_team not in (1,2) or p_final_frame < 0 or length(coalesce(p_final_checksum,'')) < 4 then raise exception 'Invalid result proof'; end if;
  select * into v_match from public.online_sport_matches where id = p_match_id for update;
  if v_match.id is null then raise exception 'Match not found'; end if;
  if not exists (select 1 from public.online_sport_players where match_id = p_match_id and user_id = v_user) then raise exception 'Not a participant'; end if;
  if v_match.result_status = 'finalized' then return jsonb_build_object('finalized', true, 'winnerTeam', v_match.winner_team); end if;
  insert into public.online_sport_result_reports(match_id, user_id, winner_team, final_frame, final_checksum)
  values (p_match_id, v_user, p_winner_team, p_final_frame, p_final_checksum)
  on conflict (match_id, user_id) do update set winner_team = excluded.winner_team, final_frame = excluded.final_frame, final_checksum = excluded.final_checksum, created_at = now();
  select count(*) into v_expected from public.online_sport_players where match_id = p_match_id;
  select count(*) into v_reports from public.online_sport_result_reports where match_id = p_match_id;
  if v_reports < v_expected then return jsonb_build_object('finalized', false, 'waitingForPlayers', v_expected - v_reports); end if;
  select count(*) into v_disagreements from public.online_sport_result_reports where match_id = p_match_id and (winner_team <> p_winner_team or final_frame <> p_final_frame or final_checksum <> p_final_checksum);
  if v_disagreements > 0 then
    update public.online_sport_matches set status='disputed', result_status='disputed', updated_at=now() where id=p_match_id;
    return jsonb_build_object('finalized', false, 'disputed', true);
  end if;
  v_is_ranked := v_match.mode in ('soccer_ranked','volleyball_1v1_ranked','dodgeball_ranked');
  if v_is_ranked then
    insert into public.online_sport_ratings(user_id, mode)
    select user_id, v_match.mode from public.online_sport_players where match_id=p_match_id
    on conflict (user_id, mode) do nothing;
    update public.online_sport_ratings r set
      rating = greatest(0, rating + case when p.team = p_winner_team then v_change else -v_change end),
      wins = wins + case when p.team = p_winner_team then 1 else 0 end,
      losses = losses + case when p.team <> p_winner_team then 1 else 0 end,
      matches_played = matches_played + 1, updated_at = now()
    from public.online_sport_players p where p.match_id=p_match_id and r.user_id=p.user_id and r.mode=v_match.mode;
  end if;
  update public.online_sport_matches set status='finished', winner_team=p_winner_team, result_status='finalized', updated_at=now() where id=p_match_id;
  select team into v_own_team from public.online_sport_players where match_id=p_match_id and user_id=v_user;
  return jsonb_build_object('finalized', true, 'winnerTeam', p_winner_team, 'won', v_own_team = p_winner_team);
end;
$$;

revoke all on function public.join_online_sport_queue(text,text,jsonb), public.online_sport_heartbeat(uuid), public.leave_online_sport_queue(uuid), public.get_my_online_sport_ratings(), public.report_online_sport_result(uuid,smallint,integer,text) from public, anon;
grant execute on function public.join_online_sport_queue(text,text,jsonb), public.online_sport_heartbeat(uuid), public.leave_online_sport_queue(uuid), public.get_my_online_sport_ratings(), public.report_online_sport_result(uuid,smallint,integer,text) to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='online_sport_matches') then alter publication supabase_realtime add table public.online_sport_matches; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='online_sport_players') then alter publication supabase_realtime add table public.online_sport_players; end if;
end $$;
