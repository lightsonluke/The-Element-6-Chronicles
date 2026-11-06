-- Apply after Supabase-Element6-Season-2027-Claims.sql.
-- Closes client-controlled seasonal XP grants. Only a trusted server using
-- the Supabase service role can record a completed-match award. The app can
-- claim that award only for the authenticated participant and exact match ID.
begin;

create table if not exists public.element6_verified_match_xp (
  match_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (length(mode) between 1 and 48),
  xp integer not null check (xp between 1 and 300),
  verified_at timestamptz not null default clock_timestamp(),
  primary key (match_id, user_id)
);

alter table public.element6_verified_match_xp enable row level security;
revoke all on public.element6_verified_match_xp from public, anon, authenticated, service_role;

create or replace function public.element6_record_verified_match_xp_v1(
  p_match_id uuid,
  p_user_id uuid,
  p_mode text,
  p_xp integer
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_existing public.element6_verified_match_xp%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Trusted match service required' using errcode = '42501';
  end if;
  if p_match_id is null or p_user_id is null
     or p_mode is null or length(p_mode) not between 1 and 48
     or p_xp is null or p_xp not between 1 and 300 then
    raise exception 'Verified match award is invalid' using errcode = '22023';
  end if;

  insert into public.element6_verified_match_xp(match_id, user_id, mode, xp)
  values (p_match_id, p_user_id, p_mode, p_xp)
  on conflict (match_id, user_id) do nothing;

  select * into v_existing
  from public.element6_verified_match_xp
  where match_id = p_match_id and user_id = p_user_id;
  if v_existing.mode <> p_mode or v_existing.xp <> p_xp then
    raise exception 'A different verified result already exists for this match' using errcode = '23505';
  end if;
  return jsonb_build_object('recorded', true, 'match_id', p_match_id, 'user_id', p_user_id);
end;
$$;
revoke all on function public.element6_record_verified_match_xp_v1(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.element6_record_verified_match_xp_v1(uuid, uuid, text, integer) to service_role;

-- The former RPC trusted p_xp and p_match_id supplied by any signed-in client.
revoke all on function public.element6_award_season_xp_v1(text[], integer, uuid) from public, anon, authenticated;

create or replace function public.element6_award_verified_season_xp_v1(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_xp integer;
  v_event_ids text[];
  v_award jsonb;
begin
  if v_user is null then
    raise exception 'Sign in to save seasonal progress' using errcode = '28000';
  end if;
  if p_match_id is null then
    raise exception 'A verified match ID is required' using errcode = '22023';
  end if;

  select m.xp into v_xp
  from public.element6_verified_match_xp m
  where m.match_id = p_match_id and m.user_id = v_user;
  if v_xp is null then
    return jsonb_build_object('awarded', false, 'reason', 'unverified_match');
  end if;

  select coalesce(array_agg(active.event_id), array[]::text[]) into v_event_ids
  from (
    select distinct c.event_id
    from public.element6_season_reward_catalog c
    where clock_timestamp() between c.starts_at and c.ends_at
  ) active;
  if cardinality(v_event_ids) = 0 then
    return jsonb_build_object('awarded', false, 'reason', 'no_active_event');
  end if;

  -- The old routine still performs the row locking, daily cap, idempotency,
  -- and progress projection; its XP now comes only from the trusted ledger.
  v_award := public.element6_award_season_xp_v1(v_event_ids, v_xp, p_match_id);
  return coalesce(v_award, '{}'::jsonb) || jsonb_build_object('awarded', true);
end;
$$;
revoke all on function public.element6_award_verified_season_xp_v1(uuid) from public, anon;
grant execute on function public.element6_award_verified_season_xp_v1(uuid) to authenticated;

commit;
