-- Apply after clan tournament tables and activity tracking are installed.
-- Updates both weekly and monthly pools to 7,000 Tokens per member, shared by XP.
begin;

create or replace function public.element6_claim_pending_clan_weekly_rewards()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_clan uuid;
  v_base integer := 0;
  v_member_count integer := 0;
  v_tokens_per_member integer := 7000;
  v_out jsonb := '[]'::jsonb;
  v_m record;
  v_total numeric;
  v_user_xp numeric;
  v_share numeric;
  v_reward integer;
  v_joined timestamptz;
  v_inserted boolean;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  -- Finalize any week that has ended before looking for pending rewards.
  perform public.element6_ensure_clan_tournament_current_period();

  select clan_id, joined_at
    into v_clan, v_joined
  from public.element6_clan_members
  where user_id = v_user
  limit 1;

  if v_clan is null then return '[]'::jsonb; end if;

  for v_m in
    select m.week_key, m.winner_clan_id, m.clan_a_xp, m.clan_b_xp,
           w.starts_at, w.ends_at, m.completed_at
    from public.element6_clan_tournament_matchups m
    join public.element6_clan_tournament_weeks w on w.week_key = m.week_key
    where m.winner_clan_id = v_clan
      and m.status = 'complete'
      and w.ends_at <= now()
      and coalesce(v_joined, w.starts_at) <= w.ends_at
      and not exists (
        select 1
        from public.element6_clan_tournament_weekly_rewards r
        where r.week_key = m.week_key
          and r.clan_id = v_clan
          and r.user_id = v_user
      )
    order by w.starts_at
  loop
    select
      coalesce(sum(e.xp),0)::numeric,
      coalesce(sum(case when e.user_id = v_user then e.xp else 0 end),0)::numeric
      into v_total, v_user_xp
    from public.element6_clan_activity_events e
    where e.clan_id = v_clan
      and e.created_at >= v_m.starts_at
      and e.created_at < v_m.ends_at
      and e.xp > 0;

    -- Scale the weekly reward pool from the winning clan's member count.
    -- The pool is 7,000 tokens per member, then split by that week's XP contribution.
    select count(*)::integer into v_member_count
    from public.element6_clan_members
    where clan_id = v_clan;

    v_base := greatest(0, v_member_count) * v_tokens_per_member;

    if v_total > 0 then
      v_share := least(1::numeric, greatest(0::numeric, v_user_xp / v_total));
    else
      v_share := 0;
    end if;

    v_reward := floor(v_base * v_share)::integer;

    insert into public.element6_clan_tournament_weekly_rewards(
      week_key, clan_id, user_id, reward_tokens, xp_share, claimed_at
    ) values (
      v_m.week_key, v_clan, v_user, v_reward, v_share, now()
    ) on conflict (week_key, clan_id, user_id) do nothing;

    if found then
      v_out := v_out || jsonb_build_array(
        jsonb_build_object(
          'week_key', v_m.week_key,
          'clan_id', v_clan,
          'tokens', v_reward,
          'base_tokens', v_base,
          'member_count', v_member_count,
          'tokens_per_member', v_tokens_per_member,
          'xp_share', v_share,
          'user_xp', v_user_xp,
          'clan_xp', v_total,
          'winner', true
        )
      );
    end if;
  end loop;

  return v_out;
end;
$$;

revoke all on function public.element6_claim_pending_clan_weekly_rewards() from public, anon;
grant execute on function public.element6_claim_pending_clan_weekly_rewards() to authenticated;

create or replace function public.element6_claim_clan_tournament_reward()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_month text := to_char(date_trunc('month',now()) - interval '1 month','YYYY-MM');
  v_month_start timestamptz := date_trunc('month',now()) - interval '1 month';
  v_month_end timestamptz := date_trunc('month',now());
  v_completed_weeks integer := 0;
  v_clan uuid;
  v_user uuid := auth.uid();
  v_base integer := 0;
  v_member_count integer := 0;
  v_tokens_per_member integer := 7000;
  v_total numeric := 0;
  v_user_xp numeric := 0;
  v_share numeric := 0;
  v_reward integer := 0;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select clan_id into v_clan from public.element6_clan_members where user_id=v_user limit 1;
  if v_clan is null then return jsonb_build_object('claimed',false,'reason','not_in_clan'); end if;

  select count(*)::integer into v_member_count
    from public.element6_clan_members where clan_id=v_clan;
  v_base := greatest(0, v_member_count) * v_tokens_per_member;

  select count(*)::integer into v_completed_weeks
  from public.element6_clan_tournament_weeks w
  where w.starts_at >= v_month_start
    and w.starts_at < v_month_end
    and w.ends_at <= now();

  if v_completed_weeks < 4 then
    return jsonb_build_object('claimed',false,'reason','not_four_weeks','completed_weeks',v_completed_weeks);
  end if;

  if not exists(
    select 1 from public.element6_clan_tournament_scores
    where month_key=v_month and clan_id=v_clan and rank=1
  ) then
    return jsonb_build_object('claimed',false,'reason','not_winner','completed_weeks',v_completed_weeks);
  end if;

  if exists(
    select 1 from public.element6_clan_tournament_rewards
    where month_key=v_month and clan_id=v_clan and user_id=v_user and claimed_at is not null
  ) then
    return jsonb_build_object('claimed',false,'reason','already_claimed','completed_weeks',v_completed_weeks);
  end if;

  select coalesce(sum(e.xp),0),
         coalesce(sum(case when e.user_id=v_user then e.xp else 0 end),0)
    into v_total,v_user_xp
  from public.element6_clan_activity_events e
  where e.clan_id=v_clan
    and e.created_at >= v_month_start
    and e.created_at < v_month_end;

  if v_total > 0 then v_share:=least(1,v_user_xp/v_total); end if;
  v_reward:=floor(v_base*v_share)::integer;

  insert into public.element6_clan_tournament_rewards(month_key,clan_id,user_id,reward_tokens,claimed_at)
  values(v_month,v_clan,v_user,v_reward,now())
  on conflict(month_key,clan_id,user_id) do nothing;

  return jsonb_build_object(
    'claimed',true,
    'tokens',v_reward,
    'base_tokens',v_base,
    'xp_share',v_share,
    'month_key',v_month,
    'completed_weeks',v_completed_weeks
  );
end;
$$;
revoke all on function public.element6_claim_clan_tournament_reward() from public,anon;
grant execute on function public.element6_claim_clan_tournament_reward() to authenticated;

commit;
