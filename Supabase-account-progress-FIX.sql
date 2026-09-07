-- Element 6 — account-bound cloud progress fix
-- Run once in Supabase SQL Editor.
-- Progress is permanently keyed to the signed-in Supabase Auth user.

begin;

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress
  add column if not exists progress_json jsonb not null default '{}'::jsonb;

alter table public.user_progress
  add column if not exists updated_at timestamptz not null default now();

alter table public.user_progress enable row level security;

revoke all on table public.user_progress from anon;
revoke all on table public.user_progress from authenticated;
grant select, insert, update on table public.user_progress to authenticated;

drop policy if exists "Players can read their own progress" on public.user_progress;
create policy "Players can read their own progress"
on public.user_progress
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players can create their own progress" on public.user_progress;
create policy "Players can create their own progress"
on public.user_progress
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Players can update their own progress" on public.user_progress;
create policy "Players can update their own progress"
on public.user_progress
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists user_progress_updated_at_idx
on public.user_progress(updated_at desc);

-- Server-side save endpoint. The browser supplies only progress data;
-- the account identity always comes from auth.uid().
create or replace function public.save_element6_progress(p_progress jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $E6SAVE$
declare
  v_user uuid := (select auth.uid());
  v_progress jsonb := coalesce(p_progress, '{}'::jsonb);
  v_saved_at timestamptz := now();
begin
  if v_user is null then
    raise exception 'Sign in first';
  end if;

  insert into public.user_progress(user_id, progress_json, updated_at)
  values (v_user, v_progress, v_saved_at)
  on conflict (user_id) do update
    set progress_json = excluded.progress_json,
        updated_at = excluded.updated_at;

  return jsonb_build_object(
    'saved', true,
    'user_id', v_user,
    'updated_at', v_saved_at
  );
end;
$E6SAVE$;

-- Server-side load endpoint. It can only return the signed-in user's row.
create or replace function public.load_element6_progress()
returns jsonb
language sql
security invoker
set search_path = ''
as $E6LOAD$
  select coalesce(
    (
      select jsonb_build_object(
        'progress', up.progress_json,
        'updated_at', up.updated_at
      )
      from public.user_progress up
      where up.user_id = (select auth.uid())
    ),
    jsonb_build_object(
      'progress', '{}'::jsonb,
      'updated_at', null
    )
  );
$E6LOAD$;

revoke all on function public.save_element6_progress(jsonb) from public, anon;
revoke all on function public.load_element6_progress() from public, anon;
grant execute on function public.save_element6_progress(jsonb) to authenticated;
grant execute on function public.load_element6_progress() to authenticated;

commit;
