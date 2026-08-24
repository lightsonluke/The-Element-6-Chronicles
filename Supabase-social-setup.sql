-- Element 6 social system: usernames, friend codes, friend requests, and friends.
-- Run this whole file ONCE in Supabase → SQL Editor → New query → Run.

create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  friend_code text not null unique check (friend_code ~ '^E6-[A-F0-9]{8}$'),
  updated_at timestamptz not null default now()
);
create unique index if not exists player_profiles_username_unique on public.player_profiles (lower(username));

create table if not exists public.player_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  last_active timestamptz not null default now()
);

create table if not exists public.player_friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create unique index if not exists player_friend_pair_unique on public.player_friend_requests (least(sender_id, recipient_id), greatest(sender_id, recipient_id));

alter table public.player_profiles enable row level security;
alter table public.player_presence enable row level security;
alter table public.player_friend_requests enable row level security;

drop policy if exists "Public player directory" on public.player_profiles;
create policy "Public player directory" on public.player_profiles for select using (true);
drop policy if exists "Players create own profile" on public.player_profiles;
create policy "Players create own profile" on public.player_profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Players update own profile" on public.player_profiles;
create policy "Players update own profile" on public.player_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Presence is readable" on public.player_presence;
create policy "Presence is readable" on public.player_presence for select using (true);
drop policy if exists "Players update own presence" on public.player_presence;
create policy "Players update own presence" on public.player_presence for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Players view own friend requests" on public.player_friend_requests;
create policy "Players view own friend requests" on public.player_friend_requests for select to authenticated using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "Players send friend requests" on public.player_friend_requests;
create policy "Players send friend requests" on public.player_friend_requests for insert to authenticated with check (auth.uid() = sender_id);
drop policy if exists "Recipients answer friend requests" on public.player_friend_requests;
create policy "Recipients answer friend requests" on public.player_friend_requests for update to authenticated using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
drop policy if exists "Participants remove friend requests" on public.player_friend_requests;
create policy "Participants remove friend requests" on public.player_friend_requests for delete to authenticated using (auth.uid() = sender_id or auth.uid() = recipient_id);
