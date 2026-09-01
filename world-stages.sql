begin;

create table if not exists public.community_stages (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  owner_username text not null default 'Player',
  name text not null,
  description text not null default '',
  emoji text not null default '🎨',
  backdrop text not null default 'splitcity',
  stage_data jsonb not null default '{}'::jsonb,
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

alter table public.community_stages add column if not exists kill_perimeter jsonb;
create index if not exists community_stages_public_newest on public.community_stages(is_private, hidden, created_date desc);
create index if not exists community_stages_owner on public.community_stages(owner_user_id);

alter table public.community_stages enable row level security;
drop policy if exists "World stages public read" on public.community_stages;
create policy "World stages public read" on public.community_stages for select to authenticated
using ((not is_private and not hidden) or auth.uid() = owner_user_id);
drop policy if exists "World stages owner insert" on public.community_stages;
create policy "World stages owner insert" on public.community_stages for insert to authenticated
with check (auth.uid() = owner_user_id);
drop policy if exists "World stages owner update" on public.community_stages;
create policy "World stages owner update" on public.community_stages for update to authenticated
using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
drop policy if exists "World stages owner delete" on public.community_stages;
create policy "World stages owner delete" on public.community_stages for delete to authenticated
using (auth.uid() = owner_user_id);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_stages') then
    alter publication supabase_realtime add table public.community_stages;
  end if;
end $$;

commit;
