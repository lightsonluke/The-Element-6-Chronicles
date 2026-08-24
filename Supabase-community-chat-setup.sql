-- Element 6: cloud friend chat, public stages, and public campaigns.
-- Run this complete file once in Supabase SQL Editor.

create table if not exists public.player_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_username text not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index if not exists player_dm_pair_time on public.player_direct_messages(sender_id, recipient_id, created_at);

create table if not exists public.community_stages (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  owner_username text not null,
  name text not null,
  description text not null default '',
  emoji text not null default '🎨',
  backdrop text not null default 'city',
  stage_data jsonb not null,
  is_private boolean not null default false,
  hidden boolean not null default false,
  plays integer not null default 0,
  likes integer not null default 0,
  liked_by jsonb not null default '[]'::jsonb,
  favorited_by jsonb not null default '[]'::jsonb,
  reported_count integer not null default 0,
  reporters jsonb not null default '[]'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index if not exists community_stages_public_newest on public.community_stages(is_private, hidden, created_date desc);

create table if not exists public.community_campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  owner_username text not null,
  name text not null,
  description text not null default '',
  thumbnail text not null default '🎮',
  difficulty text not null default 'normal',
  estimated_minutes integer not null default 15,
  is_public boolean not null default true,
  hidden boolean not null default false,
  battles jsonb not null default '[]'::jsonb,
  dialogues jsonb not null default '[]'::jsonb,
  plays integer not null default 0,
  likes integer not null default 0,
  liked_by jsonb not null default '[]'::jsonb,
  favorited_by jsonb not null default '[]'::jsonb,
  reported_count integer not null default 0,
  reporters jsonb not null default '[]'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index if not exists community_campaigns_public_newest on public.community_campaigns(is_public, hidden, created_date desc);

alter table public.player_direct_messages enable row level security;
alter table public.community_stages enable row level security;
alter table public.community_campaigns enable row level security;

drop policy if exists "DM participants read" on public.player_direct_messages;
create policy "DM participants read" on public.player_direct_messages for select to authenticated using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "Friends send DMs" on public.player_direct_messages;
create policy "Friends send DMs" on public.player_direct_messages for insert to authenticated with check (
  auth.uid() = sender_id and exists (
    select 1 from public.player_friend_requests f where f.status = 'accepted'
      and ((f.sender_id = sender_id and f.recipient_id = recipient_id) or (f.sender_id = recipient_id and f.recipient_id = sender_id))
  )
);

drop policy if exists "Everyone views public stages" on public.community_stages;
create policy "Everyone views public stages" on public.community_stages for select using ((not is_private and not hidden) or auth.uid() = owner_user_id);
drop policy if exists "Creators publish stages" on public.community_stages;
create policy "Creators publish stages" on public.community_stages for insert to authenticated with check (auth.uid() = owner_user_id);
drop policy if exists "Signed players update stages" on public.community_stages;
create policy "Signed players update stages" on public.community_stages for update to authenticated using (true) with check (true);
drop policy if exists "Creators delete stages" on public.community_stages;
create policy "Creators delete stages" on public.community_stages for delete to authenticated using (auth.uid() = owner_user_id);

drop policy if exists "Everyone views public campaigns" on public.community_campaigns;
create policy "Everyone views public campaigns" on public.community_campaigns for select using ((is_public and not hidden) or auth.uid() = owner_user_id);
drop policy if exists "Creators publish campaigns" on public.community_campaigns;
create policy "Creators publish campaigns" on public.community_campaigns for insert to authenticated with check (auth.uid() = owner_user_id);
drop policy if exists "Signed players update campaigns" on public.community_campaigns;
create policy "Signed players update campaigns" on public.community_campaigns for update to authenticated using (true) with check (true);
drop policy if exists "Creators delete campaigns" on public.community_campaigns;
create policy "Creators delete campaigns" on public.community_campaigns for delete to authenticated using (auth.uid() = owner_user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'player_direct_messages') then
    alter publication supabase_realtime add table public.player_direct_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_stages') then
    alter publication supabase_realtime add table public.community_stages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'community_campaigns') then
    alter publication supabase_realtime add table public.community_campaigns;
  end if;
end $$;
