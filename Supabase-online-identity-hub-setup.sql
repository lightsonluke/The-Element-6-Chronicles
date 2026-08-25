-- Element 6: online usernames, Community Hub presence, and direct challenges.
-- Run this whole file once in Supabase SQL Editor.

alter table public.online_matches add column if not exists host_username text;
alter table public.online_matches add column if not exists guest_username text;
alter table public.online_sport_players add column if not exists username text;

-- Keep usernames server-owned: clients never choose another person's display name.
create or replace function public.current_element6_username(p_user_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select username from public.player_profiles where user_id = p_user_id), 'Player');
$$;

create or replace function public.fill_match_usernames()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.host_username := public.current_element6_username(new.host_user_id);
  if new.guest_user_id is not null then new.guest_username := public.current_element6_username(new.guest_user_id); end if;
  return new;
end;
$$;
drop trigger if exists fill_match_usernames_trigger on public.online_matches;
create trigger fill_match_usernames_trigger before insert or update of host_user_id, guest_user_id on public.online_matches
for each row execute function public.fill_match_usernames();

create or replace function public.fill_sport_player_username()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.username := public.current_element6_username(new.user_id);
  return new;
end;
$$;
drop trigger if exists fill_sport_player_username_trigger on public.online_sport_players;
create trigger fill_sport_player_username_trigger before insert or update of user_id on public.online_sport_players
for each row execute function public.fill_sport_player_username();

update public.online_matches set host_username = public.current_element6_username(host_user_id), guest_username = case when guest_user_id is null then null else public.current_element6_username(guest_user_id) end;
update public.online_sport_players set username = public.current_element6_username(user_id) where username is null;

-- A realtime social hub uses position/presence syncing, not rollback. Rollback
-- is only correct for deterministic matches.
create table if not exists public.online_hub_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hub_server text not null,
  username text not null,
  character_id text not null default 'yellow',
  color text not null default '#FFD700',
  title text not null default '',
  x numeric not null default 1200,
  y numeric not null default 340,
  facing smallint not null default 1,
  frame integer not null default 0,
  emote text,
  updated_at timestamptz not null default now()
);
alter table public.online_hub_presence enable row level security;
drop policy if exists "hub presence readable" on public.online_hub_presence;
create policy "hub presence readable" on public.online_hub_presence for select to authenticated using (true);
drop policy if exists "players manage own hub presence" on public.online_hub_presence;
create policy "players manage own hub presence" on public.online_hub_presence for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.online_match_challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references auth.users(id) on delete cascade,
  challenged_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('ranked', 'unranked')),
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '5 minutes',
  check (challenger_id <> challenged_id)
);
alter table public.online_match_challenges enable row level security;
drop policy if exists "challenge participants read" on public.online_match_challenges;
create policy "challenge participants read" on public.online_match_challenges for select to authenticated using (auth.uid() = challenger_id or auth.uid() = challenged_id);
drop policy if exists "challenger sends challenge" on public.online_match_challenges;
create policy "challenger sends challenge" on public.online_match_challenges for insert to authenticated with check (auth.uid() = challenger_id);
drop policy if exists "challenge recipient responds" on public.online_match_challenges;
create policy "challenge recipient responds" on public.online_match_challenges for update to authenticated using (auth.uid() = challenged_id) with check (auth.uid() = challenged_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='online_hub_presence') then alter publication supabase_realtime add table public.online_hub_presence; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='online_match_challenges') then alter publication supabase_realtime add table public.online_match_challenges; end if;
end $$;
