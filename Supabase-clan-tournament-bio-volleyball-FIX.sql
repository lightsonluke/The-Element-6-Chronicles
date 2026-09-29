-- Element 6: Clan tournament + clan management + Volleyball screen fix
-- Run this ONCE in Supabase SQL Editor after the existing clan/tournament SQL.
-- Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1) Monthly championship status/reward
-- ---------------------------------------------------------------------------
-- The old reward RPC looked at the PREVIOUS calendar month while the UI showed
-- the CURRENT month. It also had no four-completed-week gate. This version uses
-- the current monthly tournament, requires four completed weekly battles, and
-- only lets the #1 clan claim the championship reward.

create or replace function public.element6_claim_clan_tournament_reward()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_now timestamptz := now();
  v_month text := to_char(v_now, 'YYYY-MM');
  v_month_start timestamptz := date_trunc('month', v_now);
  v_clan uuid;
  v_completed integer;
  v_rank integer;
  v_reward integer := 100000;
  v_existing timestamptz;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;

  perform public.element6_ensure_clan_tournament_current_period();

  select clan_id into v_clan
  from public.element6_clan_members
  where user_id = auth.uid()
  limit 1;

  if v_clan is null then
    return jsonb_build_object('claimed',false,'reason','not_in_clan');
  end if;

  select count(*)::integer into v_completed
  from public.element6_clan_tournament_matchups m
  join public.element6_clan_tournament_weeks w on w.week_key=m.week_key
  where (m.clan_a_id=v_clan or m.clan_b_id=v_clan)
    and m.status='complete'
    and m.completed_at is not null
    and m.completed_at >= v_month_start
    and m.completed_at <= v_now;

  if v_completed < 4 then
    return jsonb_build_object(
      'claimed',false,
      'reason','need_four_weekly_battles',
      'completed_battles',v_completed,
      'required_battles',4,
      'month_key',v_month
    );
  end if;

  select rank into v_rank
  from public.element6_clan_tournament_scores
  where month_key=v_month and clan_id=v_clan;

  if coalesce(v_rank,0) <> 1 then
    return jsonb_build_object('claimed',false,'reason','not_winner','rank',v_rank,'month_key',v_month);
  end if;

  select claimed_at into v_existing
  from public.element6_clan_tournament_rewards
  where month_key=v_month and clan_id=v_clan and user_id=auth.uid();

  if v_existing is not null then
    return jsonb_build_object('claimed',false,'reason','already_claimed','month_key',v_month);
  end if;

  insert into public.element6_clan_tournament_rewards(month_key,clan_id,user_id,reward_tokens,claimed_at)
  values(v_month,v_clan,auth.uid(),v_reward,v_now)
  on conflict(month_key,clan_id,user_id) do update
    set reward_tokens=excluded.reward_tokens, claimed_at=excluded.claimed_at;

  return jsonb_build_object(
    'claimed',true,
    'tokens',v_reward,
    'month_key',v_month,
    'completed_battles',v_completed,
    'rank',v_rank
  );
end;
$$;
revoke all on function public.element6_claim_clan_tournament_reward() from public,anon;
grant execute on function public.element6_claim_clan_tournament_reward() to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Reliable clan badge update
-- ---------------------------------------------------------------------------
-- Use both the clan membership role and owner_id so ownership transfers do not
-- leave the badge RPC pointing at stale ownership data.

create or replace function public.element6_update_clan_badge(p_icon_url text)
returns public.element6_clans
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_clan uuid;
  v_row public.element6_clans;
  v_icon text := nullif(trim(p_icon_url), '');
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  select m.clan_id into v_clan
  from public.element6_clan_members m
  where m.user_id=v_user and m.role='leader'
  limit 1;

  if v_clan is null then
    select c.id into v_clan
    from public.element6_clans c
    where c.owner_id=v_user
    limit 1;
  end if;

  if v_clan is null then raise exception 'Only the clan leader can change the clan badge'; end if;
  if v_icon is not null and length(v_icon)>500000 then raise exception 'Badge image is too large'; end if;
  if v_icon is not null
     and v_icon not ilike 'http://%'
     and v_icon not ilike 'https://%'
     and v_icon not ilike 'data:image/%' then
    raise exception 'Badge must be an image URL or image data';
  end if;

  update public.element6_clans
  set icon_url=v_icon, updated_at=now()
  where id=v_clan
  returning * into v_row;

  if v_row.id is null then raise exception 'Clan badge update failed'; end if;
  return v_row;
end;
$$;
revoke all on function public.element6_update_clan_badge(text) from public,anon;
grant execute on function public.element6_update_clan_badge(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Leader + Lieutenant clan bio editing
-- ---------------------------------------------------------------------------

create or replace function public.element6_update_clan_bio(p_bio text)
returns public.element6_clans
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_clan uuid;
  v_role text;
  v_row public.element6_clans;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  select clan_id, role into v_clan, v_role
  from public.element6_clan_members
  where user_id=v_user
  limit 1;

  if v_clan is null then raise exception 'You are not in a clan'; end if;
  if v_role not in ('leader','lieutenant') then raise exception 'Only leaders and lieutenants can change the clan bio'; end if;

  update public.element6_clans
  set bio=left(coalesce(p_bio,''),500), updated_at=now()
  where id=v_clan
  returning * into v_row;

  return v_row;
end;
$$;
revoke all on function public.element6_update_clan_bio(text) from public,anon;
grant execute on function public.element6_update_clan_bio(text) to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- 4) IMPORTANT: Volleyball viewport CSS fix is in index.css.
-- The existing global `.el6-game-canvas-host > canvas` rule uses
-- `position: relative !important` and `transform:none !important`, overriding
-- VolleyballGame's centering code. Replace that rule with the scoped Volleyball
-- override from the supplied index.css.
-- ---------------------------------------------------------------------------
