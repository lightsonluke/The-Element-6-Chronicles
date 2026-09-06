-- ELEMENT 6: ranked/unranked matchmaking repair
-- Paste this ENTIRE file into Supabase SQL Editor and press Run once.
-- Safe to run again. It fixes both old required columns and the queue RPC.

begin;

alter table public.online_matches add column if not exists random_seed bigint;
alter table public.online_matches add column if not exists host_user_id uuid;
alter table public.online_matches add column if not exists guest_user_id uuid;
alter table public.online_matches add column if not exists mode text;
alter table public.online_matches add column if not exists status text default 'searching';
alter table public.online_matches add column if not exists host_char text;
alter table public.online_matches add column if not exists guest_char text;
alter table public.online_matches add column if not exists host_loadout jsonb default '{}'::jsonb;
alter table public.online_matches add column if not exists guest_loadout jsonb default '{}'::jsonb;
alter table public.online_matches add column if not exists host_elo integer default 1000;
alter table public.online_matches add column if not exists guest_elo integer;
alter table public.online_matches add column if not exists ranked_status text;
alter table public.online_matches add column if not exists host_last_seen timestamptz default now();
alter table public.online_matches add column if not exists guest_last_seen timestamptz;
alter table public.online_matches add column if not exists created_at timestamptz default now();
alter table public.online_matches add column if not exists updated_at timestamptz default now();

-- Every historical row gets a seed and every new row gets one automatically.
update public.online_matches
set random_seed = floor(random() * 2147483647)::bigint
where random_seed is null;
alter table public.online_matches
  alter column random_seed set default floor(random() * 2147483647)::bigint;
alter table public.online_matches alter column random_seed set not null;

alter table public.online_matches enable row level security;
create or replace function public.is_online_match_participant(p_match_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql security definer stable set search_path=public as $$
  select exists (select 1 from public.online_matches m where m.id=p_match_id and (m.host_user_id=p_user_id or m.guest_user_id=p_user_id));
$$;
revoke all on function public.is_online_match_participant(uuid,uuid) from public,anon;
grant execute on function public.is_online_match_participant(uuid,uuid) to authenticated;
drop policy if exists "participants read online matches" on public.online_matches;
create policy "participants read online matches" on public.online_matches for select to authenticated using (public.is_online_match_participant(id,auth.uid()));
revoke insert,update,delete on public.online_matches from anon,authenticated;
grant select on public.online_matches to authenticated;

-- Compatibility with older Base44/custom-room columns. Current matchmaking
-- uses host_user_id, so an old required host_id or room_code must be optional.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='online_matches' and column_name='host_id') then
    execute 'update public.online_matches set host_user_id = coalesce(host_user_id, host_id) where host_user_id is null and host_id is not null';
    execute 'alter table public.online_matches alter column host_id drop not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='online_matches' and column_name='room_code') then
    execute 'alter table public.online_matches alter column room_code drop not null';
  end if;
end $$;

-- Replace the fight queue function. This explicitly writes random_seed, so it
-- works even if a previous migration removed the table default.
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

  -- Expire abandoned search rows so stale hosts never block the queue.
  update public.online_matches
  set status='cancelled', updated_at=now()
  where status='searching' and host_last_seen < now() - interval '45 seconds';

  if exists (select 1 from public.online_matches where status='matched' and (host_user_id=v_user or guest_user_id=v_user)) then
    raise exception 'Already in an active online match';
  end if;

  if p_mode = 'ranked' then
    insert into public.ranked_ratings (user_id) values (v_user)
    on conflict (user_id) do nothing;
    select rating into v_rating from public.ranked_ratings where user_id = v_user;
  end if;

  update public.online_matches set status='cancelled', updated_at=now()
  where status='searching' and host_last_seen < now() - interval '45 seconds';
  update public.online_matches m set status='finished', winner=case when m.host_last_seen < now()-interval '25 seconds' and (m.guest_user_id is null or m.guest_last_seen >= now()-interval '25 seconds') then 'guest' when m.guest_user_id is not null and m.guest_last_seen < now()-interval '25 seconds' and m.host_last_seen >= now()-interval '25 seconds' then 'host' else 'draw' end, updated_at=now()
  where m.status in ('matched','active') and (m.host_last_seen < now()-interval '25 seconds' or (m.guest_user_id is not null and m.guest_last_seen < now()-interval '25 seconds'));
  if exists (select 1 from public.online_matches m where (m.host_user_id=v_user or m.guest_user_id=v_user) and m.status in ('matched','active')) then raise exception 'Already in an active online match'; end if;

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
    ranked_status, host_last_seen, random_seed
  ) values (
    p_mode, 'searching', v_user, p_character_id,
    coalesce(p_loadout, '{}'::jsonb), v_rating,
    case when p_mode = 'ranked' then 'pending' else null end,
    now(), floor(random() * 2147483647)::bigint
  )
  returning * into v_match;

  return jsonb_build_object('role', 'host', 'match', to_jsonb(v_match));
end;
$$;

revoke all on function public.matchmake_online_game(text, text, jsonb) from public, anon;
grant execute on function public.matchmake_online_game(text, text, jsonb) to authenticated;

create or replace function public.complete_online_match(p_match_id uuid, p_winner_role text)
returns void language plpgsql security definer set search_path=public as $$
declare m public.online_matches%rowtype;
begin
  if p_winner_role not in ('host','guest','draw') then raise exception 'Invalid winner'; end if;
  select * into m from public.online_matches where id=p_match_id for update;
  if m.id is null or auth.uid() not in (m.host_user_id,m.guest_user_id) then raise exception 'Match not found'; end if;
  if m.mode <> 'unranked' then raise exception 'Use ranked result reporting for ranked matches'; end if;
  update public.online_matches set status='finished',winner=p_winner_role,updated_at=now() where id=p_match_id;
end; $$;
revoke all on function public.complete_online_match(uuid,text) from public,anon;
grant execute on function public.complete_online_match(uuid,text) to authenticated;

commit;
