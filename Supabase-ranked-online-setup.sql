-- Element 6: shared ranked/unranked matchmaking + server-owned ranked ELO
-- Safe to run more than once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.online_matches (
  id uuid primary key default gen_random_uuid(),
  mode text not null,
  status text not null default 'searching',
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete set null,
  host_char text not null,
  guest_char text,
  host_loadout jsonb not null default '{}'::jsonb,
  guest_loadout jsonb not null default '{}'::jsonb,
  host_elo integer not null default 1000,
  guest_elo integer,
  winner text,
  ranked_status text,
  ranked_finalized_at timestamptz,
  host_last_seen timestamptz not null default now(),
  guest_last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.online_matches add column if not exists mode text;
alter table public.online_matches add column if not exists status text default 'searching';
alter table public.online_matches add column if not exists host_user_id uuid;
alter table public.online_matches add column if not exists guest_user_id uuid;
alter table public.online_matches add column if not exists host_char text;
alter table public.online_matches add column if not exists guest_char text;
alter table public.online_matches add column if not exists host_loadout jsonb default '{}'::jsonb;
alter table public.online_matches add column if not exists guest_loadout jsonb default '{}'::jsonb;
alter table public.online_matches add column if not exists host_elo integer default 1000;
alter table public.online_matches add column if not exists guest_elo integer;
alter table public.online_matches add column if not exists winner text;
alter table public.online_matches add column if not exists ranked_status text;
alter table public.online_matches add column if not exists ranked_finalized_at timestamptz;
alter table public.online_matches add column if not exists host_last_seen timestamptz default now();
alter table public.online_matches add column if not exists guest_last_seen timestamptz;
alter table public.online_matches add column if not exists created_at timestamptz default now();
alter table public.online_matches add column if not exists updated_at timestamptz default now();

create index if not exists online_matches_queue_idx
  on public.online_matches (mode, status, created_at);
create index if not exists online_matches_host_idx on public.online_matches (host_user_id);
create index if not exists online_matches_guest_idx on public.online_matches (guest_user_id);

create table if not exists public.ranked_ratings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rating integer not null default 1000 check (rating >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  draws integer not null default 0 check (draws >= 0),
  matches_played integer not null default 0 check (matches_played >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.ranked_match_reports (
  match_id uuid not null references public.online_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reported_winner text not null check (reported_winner in ('host', 'guest', 'draw')),
  final_frame integer not null check (final_frame >= 0),
  final_checksum text not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

alter table public.online_matches enable row level security;
alter table public.ranked_ratings enable row level security;
alter table public.ranked_match_reports enable row level security;

drop policy if exists "participants read online matches" on public.online_matches;
create policy "participants read online matches" on public.online_matches
  for select to authenticated
  using (auth.uid() = host_user_id or auth.uid() = guest_user_id);

drop policy if exists "ratings are publicly readable" on public.ranked_ratings;
create policy "ratings are publicly readable" on public.ranked_ratings
  for select to anon, authenticated using (true);

drop policy if exists "players read own ranked reports" on public.ranked_match_reports;
create policy "players read own ranked reports" on public.ranked_match_reports
  for select to authenticated using (auth.uid() = user_id);

-- Clients get SELECT only. All matchmaking, reports and rating writes happen
-- through SECURITY DEFINER functions below.
revoke insert, update, delete on public.online_matches from anon, authenticated;
revoke insert, update, delete on public.ranked_ratings from anon, authenticated;
revoke insert, update, delete on public.ranked_match_reports from anon, authenticated;
grant select on public.online_matches to authenticated;
grant select on public.ranked_ratings to anon, authenticated;
grant select on public.ranked_match_reports to authenticated;

create or replace function public.get_my_ranked_rating()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_rating public.ranked_ratings%rowtype;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  insert into public.ranked_ratings (user_id) values (v_user)
  on conflict (user_id) do nothing;
  select * into v_rating from public.ranked_ratings where user_id = v_user;
  return to_jsonb(v_rating);
end;
$$;

create or replace function public.matchmake_online_game(
  p_mode text,
  p_character_id text,
  p_loadout jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.online_matches%rowtype;
  v_rating integer := 1000;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_mode not in ('ranked', 'unranked') then raise exception 'Unsupported online mode'; end if;
  if coalesce(length(trim(p_character_id)), 0) = 0 then raise exception 'Choose a character'; end if;

  if p_mode = 'ranked' then
    insert into public.ranked_ratings (user_id) values (v_user)
    on conflict (user_id) do nothing;
    select rating into v_rating from public.ranked_ratings where user_id = v_user;
  end if;

  update public.online_matches
  set status = 'cancelled', updated_at = now()
  where host_user_id = v_user and status = 'searching';

  select * into v_match
  from public.online_matches
  where mode = p_mode
    and status = 'searching'
    and guest_user_id is null
    and host_user_id <> v_user
    and host_last_seen > now() - interval '45 seconds'
  order by created_at
  for update skip locked
  limit 1;

  if v_match.id is not null then
    update public.online_matches
    set guest_user_id = v_user,
        guest_char = p_character_id,
        guest_loadout = coalesce(p_loadout, '{}'::jsonb),
        guest_elo = v_rating,
        guest_last_seen = now(),
        status = 'matched',
        ranked_status = case when p_mode = 'ranked' then 'pending' else null end,
        updated_at = now()
    where id = v_match.id
    returning * into v_match;
    return jsonb_build_object('role', 'guest', 'match', to_jsonb(v_match));
  end if;

  insert into public.online_matches (
    mode, status, host_user_id, host_char, host_loadout, host_elo,
    ranked_status, host_last_seen
  ) values (
    p_mode, 'searching', v_user, p_character_id,
    coalesce(p_loadout, '{}'::jsonb), v_rating,
    case when p_mode = 'ranked' then 'pending' else null end, now()
  ) returning * into v_match;

  return jsonb_build_object('role', 'host', 'match', to_jsonb(v_match));
end;
$$;

create or replace function public.online_match_heartbeat(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.online_matches
  set host_last_seen = case when host_user_id = auth.uid() then now() else host_last_seen end,
      guest_last_seen = case when guest_user_id = auth.uid() then now() else guest_last_seen end,
      updated_at = now()
  where id = p_match_id and auth.uid() in (host_user_id, guest_user_id);
end;
$$;

create or replace function public.leave_online_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.online_matches%rowtype;
begin
  select * into v_match from public.online_matches where id = p_match_id for update;
  if v_match.id is null or (
    auth.uid() <> v_match.host_user_id
    and (v_match.guest_user_id is null or auth.uid() <> v_match.guest_user_id)
  ) then
    raise exception 'Match not found';
  end if;
  if v_match.mode = 'ranked'
     and v_match.guest_user_id is not null
     and coalesce(v_match.ranked_status, 'pending') <> 'finalized'
     and v_match.status in ('matched', 'active') then
    insert into public.ranked_ratings (user_id)
    values (v_match.host_user_id), (v_match.guest_user_id)
    on conflict (user_id) do nothing;

    if auth.uid() = v_match.host_user_id then
      update public.ranked_ratings set rating = greatest(0, rating - 16), losses = losses + 1, matches_played = matches_played + 1, updated_at = now() where user_id = v_match.host_user_id;
      update public.ranked_ratings set rating = rating + 16, wins = wins + 1, matches_played = matches_played + 1, updated_at = now() where user_id = v_match.guest_user_id;
    else
      update public.ranked_ratings set rating = greatest(0, rating - 16), losses = losses + 1, matches_played = matches_played + 1, updated_at = now() where user_id = v_match.guest_user_id;
      update public.ranked_ratings set rating = rating + 16, wins = wins + 1, matches_played = matches_played + 1, updated_at = now() where user_id = v_match.host_user_id;
    end if;

    update public.online_matches
    set status = 'finished',
        winner = case when auth.uid() = v_match.host_user_id then 'guest' else 'host' end,
        ranked_status = 'finalized', ranked_finalized_at = now(), updated_at = now()
    where id = p_match_id;
    if to_regclass('public.shared_leaderboard') is not null then
      execute 'update public.shared_leaderboard s set ranked_elo = r.rating from public.ranked_ratings r where s.user_id = r.user_id and s.user_id in ($1, $2)'
      using v_match.host_user_id, v_match.guest_user_id;
    end if;
    return;
  end if;

  update public.online_matches
  set status = case when v_match.status = 'searching' then 'cancelled' else 'finished' end,
      winner = case
        when v_match.status = 'searching' then winner
        when auth.uid() = v_match.host_user_id then 'guest'
        else 'host'
      end,
      updated_at = now()
  where id = p_match_id;
end;
$$;

create or replace function public.report_ranked_match_result(
  p_match_id uuid,
  p_winner_role text,
  p_final_frame integer,
  p_final_checksum text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.online_matches%rowtype;
  v_other public.ranked_match_reports%rowtype;
  v_host_rating integer;
  v_guest_rating integer;
  v_expected_host numeric;
  v_host_score numeric;
  v_change integer;
  v_caller_rating integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_winner_role not in ('host', 'guest', 'draw') then raise exception 'Invalid winner'; end if;
  if p_final_frame < 0 or length(coalesce(p_final_checksum, '')) < 4 then raise exception 'Invalid result proof'; end if;

  select * into v_match from public.online_matches where id = p_match_id for update;
  if v_match.id is null or v_match.mode <> 'ranked' then raise exception 'Ranked match not found'; end if;
  if v_match.guest_user_id is null or v_match.status not in ('matched', 'active', 'finished') then raise exception 'Match is not ready'; end if;
  if v_user <> v_match.host_user_id and v_user <> v_match.guest_user_id then raise exception 'Not a participant'; end if;

  if v_match.ranked_status = 'finalized' then
    select rating into v_caller_rating from public.ranked_ratings where user_id = v_user;
    return jsonb_build_object('finalized', true, 'rating', v_caller_rating, 'winner', v_match.winner);
  end if;

  insert into public.ranked_match_reports (match_id, user_id, reported_winner, final_frame, final_checksum)
  values (p_match_id, v_user, p_winner_role, p_final_frame, p_final_checksum)
  on conflict (match_id, user_id) do update set
    reported_winner = excluded.reported_winner,
    final_frame = excluded.final_frame,
    final_checksum = excluded.final_checksum,
    created_at = now();

  select * into v_other
  from public.ranked_match_reports
  where match_id = p_match_id and user_id <> v_user
  limit 1;

  if v_other.user_id is null then
    return jsonb_build_object('finalized', false, 'waiting_for_opponent', true);
  end if;

  if v_other.reported_winner <> p_winner_role
     or v_other.final_frame <> p_final_frame
     or v_other.final_checksum <> p_final_checksum then
    update public.online_matches set ranked_status = 'disputed', updated_at = now() where id = p_match_id;
    return jsonb_build_object('finalized', false, 'disputed', true);
  end if;

  insert into public.ranked_ratings (user_id) values (v_match.host_user_id), (v_match.guest_user_id)
  on conflict (user_id) do nothing;
  select rating into v_host_rating from public.ranked_ratings where user_id = v_match.host_user_id for update;
  select rating into v_guest_rating from public.ranked_ratings where user_id = v_match.guest_user_id for update;

  v_expected_host := 1.0 / (1.0 + power(10.0, (v_guest_rating - v_host_rating)::numeric / 400.0));
  v_host_score := case p_winner_role when 'host' then 1.0 when 'guest' then 0.0 else 0.5 end;
  v_change := round(32.0 * (v_host_score - v_expected_host));

  update public.ranked_ratings
  set rating = greatest(0, rating + v_change),
      wins = wins + case when p_winner_role = 'host' then 1 else 0 end,
      losses = losses + case when p_winner_role = 'guest' then 1 else 0 end,
      draws = draws + case when p_winner_role = 'draw' then 1 else 0 end,
      matches_played = matches_played + 1,
      updated_at = now()
  where user_id = v_match.host_user_id;

  update public.ranked_ratings
  set rating = greatest(0, rating - v_change),
      wins = wins + case when p_winner_role = 'guest' then 1 else 0 end,
      losses = losses + case when p_winner_role = 'host' then 1 else 0 end,
      draws = draws + case when p_winner_role = 'draw' then 1 else 0 end,
      matches_played = matches_played + 1,
      updated_at = now()
  where user_id = v_match.guest_user_id;

  update public.online_matches
  set status = 'finished', winner = p_winner_role, ranked_status = 'finalized',
      ranked_finalized_at = now(), updated_at = now()
  where id = p_match_id;

  if to_regclass('public.shared_leaderboard') is not null then
    execute 'update public.shared_leaderboard s set ranked_elo = r.rating from public.ranked_ratings r where s.user_id = r.user_id and s.user_id in ($1, $2)'
    using v_match.host_user_id, v_match.guest_user_id;
  end if;

  select rating into v_caller_rating from public.ranked_ratings where user_id = v_user;
  return jsonb_build_object('finalized', true, 'rating', v_caller_rating, 'winner', p_winner_role, 'elo_change', abs(v_change));
end;
$$;

-- Disable older client-authoritative matchmaking/result RPCs if a previous
-- setup created them. The new functions above are the only write path.
do $$
declare
  v_function regprocedure;
begin
  for v_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_online_match', 'join_online_match', 'finish_online_match')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', v_function);
  end loop;
end $$;

revoke all on function public.get_my_ranked_rating() from public, anon;
revoke all on function public.matchmake_online_game(text, text, jsonb) from public, anon;
revoke all on function public.online_match_heartbeat(uuid) from public, anon;
revoke all on function public.leave_online_match(uuid) from public, anon;
revoke all on function public.report_ranked_match_result(uuid, text, integer, text) from public, anon;
grant execute on function public.get_my_ranked_rating() to authenticated;
grant execute on function public.matchmake_online_game(text, text, jsonb) to authenticated;
grant execute on function public.online_match_heartbeat(uuid) to authenticated;
grant execute on function public.leave_online_match(uuid) to authenticated;
grant execute on function public.report_ranked_match_result(uuid, text, integer, text) to authenticated;

-- If the shared leaderboard exists, force its ranked_elo column to mirror the
-- protected server rating even when the client syncs other statistics.
create or replace function public.protect_shared_ranked_elo()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_rating integer;
begin
  if to_regclass('public.ranked_ratings') is not null then
    select rating into v_rating from public.ranked_ratings where user_id = new.user_id;
    new.ranked_elo := coalesce(v_rating, 1000);
  end if;
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.shared_leaderboard') is not null then
    execute 'drop trigger if exists protect_shared_ranked_elo_trigger on public.shared_leaderboard';
    execute 'create trigger protect_shared_ranked_elo_trigger before insert or update on public.shared_leaderboard for each row execute function public.protect_shared_ranked_elo()';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'online_matches'
  ) then
    alter publication supabase_realtime add table public.online_matches;
  end if;
end $$;
