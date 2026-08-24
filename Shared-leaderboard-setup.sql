create table if not exists public.shared_leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  total_xp integer not null default 0,
  soccer_xp integer not null default 0,
  combat_xp integer not null default 0,
  ranked_elo integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  soccer_goals integer not null default 0,
  soccer_saves integer not null default 0,
  combat_kills integer not null default 0,
  combat_deaths integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.shared_leaderboard enable row level security;

drop policy if exists "Anyone can view shared leaderboard" on public.shared_leaderboard;
create policy "Anyone can view shared leaderboard" on public.shared_leaderboard for select using (true);

drop policy if exists "Players can create own leaderboard row" on public.shared_leaderboard;
create policy "Players can create own leaderboard row" on public.shared_leaderboard for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Players can update own leaderboard row" on public.shared_leaderboard;
create policy "Players can update own leaderboard row" on public.shared_leaderboard for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
