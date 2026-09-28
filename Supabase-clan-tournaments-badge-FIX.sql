-- Element 6 — Clan Tournament + Clan Badge fix
-- Run this ONCE in Supabase SQL Editor after the existing clan/tournament tables.
-- Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1) Fix the monthly tournament view.
-- The client expects clan_tag; the old view exposed the column as tag.
-- ---------------------------------------------------------------------------

drop view if exists public.element6_clan_tournament_monthly;
create view public.element6_clan_tournament_monthly as
select
  row_number() over (
    partition by s.month_key
    order by s.tournament_points desc, s.monthly_wins desc, s.monthly_xp desc, c.name asc
  )::integer as rank,
  s.clan_id,
  c.name as clan_name,
  c.tag as clan_tag,
  s.tournament_points,
  s.monthly_xp,
  s.monthly_wins,
  (
    row_number() over (
      partition by s.month_key
      order by s.tournament_points desc, s.monthly_wins desc, s.monthly_xp desc, c.name asc
    ) <= 100
  ) as qualified,
  s.month_key
from public.element6_clan_tournament_scores s
join public.element6_clans c on c.id = s.clan_id;

-- ---------------------------------------------------------------------------
-- 2) Fix the tournament period builder.
-- - The current player's weekly row is discoverable by clan_id, not user_id.
-- - Active weekly matchups now display live XP instead of staying at 0 until
--   the week ends.
-- - Current-month standings are maintained with UPSERTs rather than deleting
--   the entire table on every refresh.
-- - Week/month keys use the actual current date consistently.
-- ---------------------------------------------------------------------------

create or replace function public.element6_ensure_clan_tournament_current_period()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_now timestamptz := now();
  v_start timestamptz := date_trunc('week', v_now);
  v_end timestamptz := v_start + interval '7 days';
  v_week text := to_char(v_start, 'IYYY-IW');
  v_month text := to_char(v_now, 'YYYY-MM');
  v_ids uuid[];
  v_i integer;
  v_a uuid;
  v_b uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;

  insert into public.element6_clan_tournament_weeks(week_key, starts_at, ends_at)
  values(v_week, v_start, v_end)
  on conflict (week_key) do nothing;

  -- One deterministic weekly pairing set shared by every client.
  select array_agg(c.id order by md5(c.id::text || ':' || v_week))
  into v_ids
  from public.element6_clans c;

  v_i := 1;
  while v_i <= coalesce(array_length(v_ids, 1), 0) loop
    v_a := v_ids[v_i];
    v_b := case when v_i + 1 <= array_length(v_ids, 1) then v_ids[v_i + 1] else null end;

    if v_b is null then
      insert into public.element6_clan_tournament_matchups(
        week_key, clan_a_id, status, winner_clan_id, completed_at
      )
      values(v_week, v_a, 'bye', v_a, v_now)
      on conflict do nothing;
    else
      insert into public.element6_clan_tournament_matchups(
        week_key, clan_a_id, clan_b_id, status
      )
      values(v_week, v_a, v_b, 'active')
      on conflict do nothing;
    end if;

    v_i := v_i + 2;
  end loop;

  -- Update both completed and active matchups from the authoritative clan
  -- activity events. This makes the weekly scoreboard visibly progress.
  update public.element6_clan_tournament_matchups m
  set clan_a_xp = coalesce((
        select sum(e.xp)
        from public.element6_clan_activity_events e
        where e.clan_id = m.clan_a_id
          and e.created_at >= w.starts_at
          and e.created_at < w.ends_at
      ), 0),
      clan_b_xp = coalesce((
        select sum(e.xp)
        from public.element6_clan_activity_events e
        where e.clan_id = m.clan_b_id
          and e.created_at >= w.starts_at
          and e.created_at < w.ends_at
      ), 0)
  from public.element6_clan_tournament_weeks w
  where m.week_key = w.week_key
    and w.week_key = v_week;

  -- Close the week exactly once after its end.
  update public.element6_clan_tournament_matchups m
  set winner_clan_id = case
        when m.clan_b_id is null then m.clan_a_id
        when m.clan_a_xp >= m.clan_b_xp then m.clan_a_id
        else m.clan_b_id
      end,
      status = 'complete',
      completed_at = coalesce(m.completed_at, v_now)
  from public.element6_clan_tournament_weeks w
  where m.week_key = w.week_key
    and w.ends_at <= v_now
    and m.status = 'active';

  -- Rebuild the current month's scores without destroying rows that clients
  -- may currently be reading.
  insert into public.element6_clan_tournament_scores(
    month_key, clan_id, tournament_points, monthly_xp, monthly_wins
  )
  select
    v_month,
    c.id,
    coalesce((
      select count(*)
      from public.element6_clan_tournament_matchups m
      where m.winner_clan_id = c.id
        and m.status = 'complete'
        and m.week_key in (
          select tw.week_key
          from public.element6_clan_tournament_weeks tw
          where to_char(tw.starts_at, 'YYYY-MM') = v_month
        )
    ), 0)::integer,
    coalesce((
      select sum(e.xp)
      from public.element6_clan_activity_events e
      where e.clan_id = c.id
        and e.created_at >= date_trunc('month', v_now)
        and e.created_at < date_trunc('month', v_now) + interval '1 month'
    ), 0),
    coalesce((
      select count(*)
      from public.element6_clan_tournament_matchups m
      where m.winner_clan_id = c.id
        and m.status = 'complete'
        and m.week_key in (
          select tw.week_key
          from public.element6_clan_tournament_weeks tw
          where to_char(tw.starts_at, 'YYYY-MM') = v_month
        )
    ), 0)::integer
  from public.element6_clans c
  on conflict (month_key, clan_id) do update set
    tournament_points = excluded.tournament_points,
    monthly_xp = excluded.monthly_xp,
    monthly_wins = excluded.monthly_wins;

  with ranked as (
    select
      s.month_key,
      s.clan_id,
      row_number() over (
        partition by s.month_key
        order by s.tournament_points desc, s.monthly_wins desc, s.monthly_xp desc, s.clan_id
      )::integer as r
    from public.element6_clan_tournament_scores s
    where s.month_key = v_month
  )
  update public.element6_clan_tournament_scores s
  set rank = ranked.r,
      qualified = ranked.r <= 100
  from ranked
  where s.month_key = ranked.month_key
    and s.clan_id = ranked.clan_id;

  return jsonb_build_object(
    'week_key', v_week,
    'month_key', v_month
  );
end;
$$;

revoke all on function public.element6_ensure_clan_tournament_current_period() from public, anon;
grant execute on function public.element6_ensure_clan_tournament_current_period() to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Make the clan badge RPC always available and owner-only.
-- The existing UI accepts a URL or a small data:image URL. Keep that behavior
-- so no browser permission or external hosting is required.
-- ---------------------------------------------------------------------------

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
  if v_user is null then
    raise exception 'Sign in first';
  end if;

  select m.clan_id
  into v_clan
  from public.element6_clan_members m
  where m.user_id = v_user
    and m.role = 'leader'
  limit 1;

  if v_clan is null then
    raise exception 'Only the clan owner can change the clan badge';
  end if;

  if v_icon is not null and length(v_icon) > 300000 then
    raise exception 'Badge image is too large';
  end if;

  if v_icon is not null
     and v_icon not ilike 'http://%'
     and v_icon not ilike 'https://%'
     and v_icon not ilike 'data:image/%' then
    raise exception 'Badge must be an image URL or image data';
  end if;

  update public.element6_clans
  set icon_url = v_icon,
      updated_at = now()
  where id = v_clan
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.element6_update_clan_badge(text) from public, anon;
grant execute on function public.element6_update_clan_badge(text) to authenticated;

commit;
