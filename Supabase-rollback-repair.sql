-- Element 6 rollback repair patch.
-- Run this ENTIRE file once in Supabase SQL Editor.
-- It fixes the two errors shown in game:
-- 1) infinite recursion detected in policy for online_sport_players
-- 2) online_matches.room_code NOT NULL blocking ranked matchmaking

create extension if not exists pgcrypto;

-- Old local-room versions of the game made room_code mandatory. Global
-- matchmaking creates matches server-side and does not use a room code.
alter table public.online_matches
  alter column room_code drop not null;

alter table public.online_matches
  alter column room_code set default ('match-' || substring(gen_random_uuid()::text from 1 for 8));

-- SECURITY DEFINER prevents the RLS policy from querying its own protected
-- table, which was the source of the recursion error.
create or replace function public.is_online_sport_participant(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.online_sport_players
    where match_id = p_match_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_online_sport_participant(uuid) from public, anon;
grant execute on function public.is_online_sport_participant(uuid) to authenticated;

drop policy if exists "sport participants can view matches" on public.online_sport_matches;
create policy "sport participants can view matches"
on public.online_sport_matches
for select to authenticated
using (public.is_online_sport_participant(id));

drop policy if exists "sport participants can view players" on public.online_sport_players;
create policy "sport participants can view players"
on public.online_sport_players
for select to authenticated
using (public.is_online_sport_participant(match_id));

-- Existing queues may have been left in a bad state while the policy failed.
-- Cancel only incomplete, stale queues; completed/active matches are untouched.
update public.online_sport_matches
set status = 'cancelled', updated_at = now()
where status = 'searching'
  and created_at < now() - interval '30 minutes';
