-- Element 6 online match compatibility repair.
-- Run the entire file once in Supabase SQL Editor.
-- It preserves existing matches and fixes an old required host_id column that
-- conflicts with the current server-side matchmaking RPC (host_user_id).

begin;

alter table public.online_matches add column if not exists host_user_id uuid;
alter table public.online_matches add column if not exists guest_user_id uuid;
alter table public.online_matches add column if not exists status text default 'searching';
alter table public.online_matches add column if not exists mode text;
alter table public.online_matches add column if not exists host_last_seen timestamptz default now();
alter table public.online_matches add column if not exists guest_last_seen timestamptz;

-- Copy old records across if this database used host_id before host_user_id.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='online_matches' and column_name='host_id') then
    execute 'update public.online_matches set host_user_id = coalesce(host_user_id, host_id) where host_user_id is null and host_id is not null';
    -- The current matchmake_online_game RPC inserts host_user_id. host_id must
    -- therefore be optional; keeping it mandatory creates the exact error shown.
    execute 'alter table public.online_matches alter column host_id drop not null';
  end if;
end $$;

-- Old custom-room schemas can also force this unrelated column.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='online_matches' and column_name='room_code') then
    execute 'alter table public.online_matches alter column room_code drop not null';
  end if;
end $$;

-- Complete stale, unstarted rows so they cannot be joined by a new search.
update public.online_matches
set status = 'cancelled', updated_at = now()
where status = 'searching'
  and created_at < now() - interval '30 minutes';

commit;
