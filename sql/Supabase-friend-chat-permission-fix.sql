-- Element 6 — Friend Chat Permission Fix
-- Fixes "permission denied for table users" when sending a direct message.
-- The previous RLS policy queried auth.users from inside the policy. The foreign
-- key already guarantees that recipient_id is a real auth user, so no auth.users
-- query is necessary (and removing it avoids the permission error).

begin;

create table if not exists public.player_direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_username text not null default 'Player',
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists player_dm_pair_time
  on public.player_direct_messages(sender_id, recipient_id, created_at);

alter table public.player_direct_messages enable row level security;

drop policy if exists "DM participants read" on public.player_direct_messages;
drop policy if exists "Friends send DMs" on public.player_direct_messages;
drop policy if exists "Authenticated players send DMs" on public.player_direct_messages;
drop policy if exists "Players send DMs" on public.player_direct_messages;

create policy "DM participants read"
on public.player_direct_messages
for select to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Friend chat is allowed between accepted friends. No lookup against auth.users
-- is performed here; the recipient_id foreign key handles that validation.
create policy "Friends send DMs"
on public.player_direct_messages
for insert to authenticated
with check (
  auth.uid() = sender_id
  and sender_id <> recipient_id
  and exists (
    select 1
    from public.player_friend_requests f
    where f.status = 'accepted'
      and (
        (f.sender_id = sender_id and f.recipient_id = recipient_id)
        or
        (f.sender_id = recipient_id and f.recipient_id = sender_id)
      )
  )
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'player_direct_messages'
  ) then
    alter publication supabase_realtime add table public.player_direct_messages;
  end if;
end $$;

commit;
