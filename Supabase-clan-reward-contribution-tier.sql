-- Element 6: tier-scoped clan reward contribution scaling.
--
-- Every token reward from clan tier/milestone rewards and the existing monthly
-- clan tournament reward is now proportional to the member's share of the XP
-- earned by the clan during the relevant tier/reward period.
-- Cosmetic/Shikigami unlocks remain one-per-member; token amounts are scaled.

begin;

-- New activity is tagged with the clan tier that was active when the XP was earned.
alter table public.element6_clan_activity_events
  add column if not exists tier_at_event smallint;

create index if not exists element6_clan_activity_tier_idx
  on public.element6_clan_activity_events(clan_id,tier_at_event,created_at);

-- Replace the secure activity writer so every new XP event carries the tier
-- that the clan was actually in before that event was added.
create or replace function public.element6_record_clan_activity(
  p_user_id uuid,
  p_event_key text,
  p_xp integer,
  p_source_match_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_clan public.element6_clans%rowtype;
  v_member boolean;
  v_new_tier smallint;
  v_event_tier smallint;
begin
  if p_user_id is null then raise exception 'Missing user'; end if;
  if p_xp < 0 then raise exception 'Invalid XP'; end if;

  select exists(
    select 1 from public.element6_clan_members
    where clan_id is not null and user_id=p_user_id
  ) into v_member;
  if not v_member then
    return jsonb_build_object('recorded',false,'reason','not_in_clan');
  end if;

  select c.* into v_clan
  from public.element6_clans c
  join public.element6_clan_members m on m.clan_id=c.id
  where m.user_id=p_user_id
  for update;

  if v_clan.id is null then
    return jsonb_build_object('recorded',false,'reason','not_in_clan');
  end if;

  v_event_tier := greatest(1, v_clan.tier);

  if p_source_match_id is not null then
    insert into public.element6_clan_activity_events(
      clan_id,user_id,event_key,xp,source_match_id,tier_at_event
    ) values(
      v_clan.id,p_user_id,p_event_key,greatest(0,p_xp),p_source_match_id,v_event_tier
    ) on conflict do nothing;
  else
    insert into public.element6_clan_activity_events(
      clan_id,user_id,event_key,xp,tier_at_event
    ) values(
      v_clan.id,p_user_id,p_event_key,greatest(0,p_xp),v_event_tier
    );
  end if;

  if p_source_match_id is not null and not found then
    return jsonb_build_object('recorded',false,'reason','already_recorded','tier',v_clan.tier,'xp',v_clan.xp);
  end if;

  update public.element6_clans
  set xp=xp+greatest(0,p_xp),
      tier=greatest(tier,case when tier=0 then 1 else tier end),
      tier1_unlocked_at=coalesce(tier1_unlocked_at,now()),
      updated_at=now()
  where id=v_clan.id;

  select * into v_clan from public.element6_clans where id=v_clan.id for update;

  v_new_tier:=v_clan.tier;
  while v_new_tier < 10
    and v_clan.xp >= public.element6_clan_required_xp(v_new_tier)
    and now() >= v_clan.created_at + make_interval(days => public.element6_clan_min_days_for_tier(v_new_tier+1))
  loop
    v_new_tier:=v_new_tier+1;
  end loop;

  if v_new_tier <> v_clan.tier then
    update public.element6_clans set tier=v_new_tier,updated_at=now() where id=v_clan.id;
  end if;

  return jsonb_build_object('recorded',true,'clan_id',v_clan.id,'tier',v_new_tier,'xp',v_clan.xp,'tier_at_event',v_event_tier);
end;
$$;
revoke all on function public.element6_record_clan_activity(uuid,text,integer,text) from public,anon;
grant execute on function public.element6_record_clan_activity(uuid,text,integer,text) to authenticated;

-- Returns the member's XP share for the exact tier interval that produced a
-- milestone. The interval starts at clan creation for Tier 1, otherwise at the
-- previous tier's completion milestone, and ends at this milestone's reached_at.
create or replace function public.element6_clan_reward_share(
  p_clan uuid,
  p_user uuid,
  p_tier smallint,
  p_reached_at timestamptz
)
returns numeric
language sql
stable
security definer
set search_path=public
as $$
  with bounds as (
    select
      coalesce(
        (select rr.reached_at
         from public.element6_clan_milestone_reached rr
         where rr.clan_id=p_clan and rr.milestone_key=('tier' || greatest(1,p_tier-1)::text || '_full')
         limit 1),
        (select c.created_at from public.element6_clans c where c.id=p_clan)
      ) as tier_start,
      p_reached_at as tier_end
  ), totals as (
    select
      coalesce(sum(e.xp),0)::numeric as total_xp,
      coalesce(sum(case when e.user_id=p_user then e.xp else 0 end),0)::numeric as user_xp
    from public.element6_clan_activity_events e, bounds b
    where e.clan_id=p_clan
      and e.created_at > b.tier_start
      and e.created_at <= b.tier_end
      and e.xp > 0
  )
  select case when total_xp > 0 then least(1::numeric,user_xp/total_xp) else 0::numeric end
  from totals;
$$;
revoke all on function public.element6_clan_reward_share(uuid,uuid,smallint,timestamptz) from public,anon;
grant execute on function public.element6_clan_reward_share(uuid,uuid,smallint,timestamptz) to authenticated;

-- Tier reward token amount = base reward × this member's XP share for that tier.
create or replace function public.element6_claim_clan_reward(p_tier smallint)
returns integer
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid:=auth.uid();
  v_clan uuid;
  v_reward integer;
  v_reached timestamptz;
  v_share numeric;
  v_scaled integer;
begin
  select clan_id into v_clan from public.element6_clan_members where user_id=v_user;
  if v_clan is null then raise exception 'Not in a clan'; end if;
  if not exists(select 1 from public.element6_clans where id=v_clan and tier>=p_tier) then raise exception 'Tier not reached'; end if;
  select token_reward into v_reward from public.element6_clan_rewards where tier=p_tier;
  if v_reward is null then raise exception 'Reward not found'; end if;
  select reached_at into v_reached from public.element6_clan_milestone_reached where clan_id=v_clan and milestone_key=('tier'||p_tier::text||'_full');
  if v_reached is null then v_reached:=now(); end if;

  v_share:=public.element6_clan_reward_share(v_clan,v_user,p_tier,v_reached);
  v_scaled:=floor(v_reward*greatest(0,least(1,v_share)))::integer;

  insert into public.element6_clan_reward_claims(clan_id,user_id,tier)
  values(v_clan,v_user,p_tier) on conflict do nothing;
  if not found then raise exception 'Reward already claimed'; end if;
  return v_scaled;
end;
$$;
revoke all on function public.element6_claim_clan_reward(smallint) from public,anon;
grant execute on function public.element6_claim_clan_reward(smallint) to authenticated;

-- Milestone reward token amount uses the same tier-specific XP share.
create or replace function public.element6_claim_clan_milestone(p_milestone_key text)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid:=auth.uid();
  v_clan uuid;
  v_row public.element6_clan_milestone_rewards%rowtype;
  v_reached timestamptz;
  v_share numeric;
  v_scaled integer;
begin
  select clan_id into v_clan from public.element6_clan_members where user_id=v_user;
  if v_clan is null then raise exception 'Not in a clan'; end if;
  select * into v_row from public.element6_clan_milestone_rewards where milestone_key=p_milestone_key;
  if v_row.milestone_key is null then raise exception 'Milestone not found'; end if;
  select reached_at into v_reached from public.element6_clan_milestone_reached where clan_id=v_clan and milestone_key=p_milestone_key;
  if v_reached is null then raise exception 'Milestone not reached'; end if;
  if not exists (
    select 1 from public.element6_clan_members mm
    where mm.clan_id=v_clan and mm.user_id=v_user and mm.joined_at <= v_reached
  ) then raise exception 'Milestone not reached or member joined too late'; end if;

  v_share:=public.element6_clan_reward_share(v_clan,v_user,v_row.tier,v_reached);
  v_scaled:=floor(v_row.token_reward*greatest(0,least(1,v_share)))::integer;

  insert into public.element6_clan_milestone_claims(clan_id,user_id,milestone_key)
  values(v_clan,v_user,p_milestone_key) on conflict do nothing;
  if not found then raise exception 'Milestone already claimed'; end if;

  return jsonb_build_object(
    'milestone_key',v_row.milestone_key,'tier',v_row.tier,'milestone_type',v_row.milestone_type,
    'token_reward',v_scaled,'base_token_reward',v_row.token_reward,'xp_share',v_share,
    'shikigami_id',v_row.shikigami_id,'accessory_id',v_row.accessory_id,'label',v_row.label
  );
end;
$$;
revoke all on function public.element6_claim_clan_milestone(text) from public,anon;
grant execute on function public.element6_claim_clan_milestone(text) to authenticated;

-- Existing monthly championship reward is also contribution-scaled: the member
-- receives their share of the clan's tournament-month XP, not the full clan pool.
create or replace function public.element6_claim_clan_tournament_reward()
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_month text:=to_char(date_trunc('month',now())-interval '1 month','YYYY-MM');
  v_clan uuid; v_user uuid:=auth.uid(); v_base integer:=100000;
  v_total numeric:=0; v_user_xp numeric:=0; v_share numeric:=0; v_reward integer:=0;
begin
  select clan_id into v_clan from public.element6_clan_members where user_id=v_user limit 1;
  if v_clan is null then return jsonb_build_object('claimed',false,'reason','not_in_clan'); end if;
  if not exists(select 1 from public.element6_clan_tournament_scores where month_key=v_month and clan_id=v_clan and rank=1) then
    return jsonb_build_object('claimed',false,'reason','not_winner');
  end if;
  if exists(select 1 from public.element6_clan_tournament_rewards where month_key=v_month and clan_id=v_clan and user_id=v_user and claimed_at is not null) then
    return jsonb_build_object('claimed',false,'reason','already_claimed');
  end if;

  select coalesce(sum(e.xp),0),coalesce(sum(case when e.user_id=v_user then e.xp else 0 end),0)
    into v_total,v_user_xp
  from public.element6_clan_activity_events e
  where e.clan_id=v_clan
    and e.created_at >= date_trunc('month',to_date(v_month,'YYYY-MM'))
    and e.created_at < date_trunc('month',to_date(v_month,'YYYY-MM')) + interval '1 month';
  if v_total > 0 then v_share:=least(1,v_user_xp/v_total); end if;
  v_reward:=floor(v_base*v_share)::integer;

  insert into public.element6_clan_tournament_rewards(month_key,clan_id,user_id,reward_tokens,claimed_at)
  values(v_month,v_clan,v_user,v_reward,now()) on conflict(month_key,clan_id,user_id) do nothing;
  return jsonb_build_object('claimed',true,'tokens',v_reward,'base_tokens',v_base,'xp_share',v_share,'month_key',v_month);
end; $$;
revoke all on function public.element6_claim_clan_tournament_reward() from public,anon;
grant execute on function public.element6_claim_clan_tournament_reward() to authenticated;

commit;
