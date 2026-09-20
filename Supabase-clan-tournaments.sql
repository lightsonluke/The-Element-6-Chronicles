-- Element 6: Clan Tournaments
-- Weekly random pairings + monthly Top 100 championship standings/rewards.
-- Run after the existing clan tables/migrations.

create table if not exists public.element6_clan_tournament_weeks (
  week_key text primary key,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.element6_clan_tournament_matchups (
  id uuid primary key default gen_random_uuid(),
  week_key text not null references public.element6_clan_tournament_weeks(week_key) on delete cascade,
  clan_a_id uuid not null references public.element6_clans(id) on delete cascade,
  clan_b_id uuid references public.element6_clans(id) on delete cascade,
  clan_a_xp bigint not null default 0,
  clan_b_xp bigint not null default 0,
  winner_clan_id uuid references public.element6_clans(id) on delete set null,
  status text not null default 'active' check (status in ('active','complete','bye')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (clan_b_id is null or clan_a_id <> clan_b_id)
);
create unique index if not exists element6_clan_tournament_pair_uq on public.element6_clan_tournament_matchups(week_key, least(clan_a_id,coalesce(clan_b_id,clan_a_id)), greatest(clan_a_id,coalesce(clan_b_id,clan_a_id)));
create index if not exists element6_clan_tournament_week_idx on public.element6_clan_tournament_matchups(week_key,status);

create table if not exists public.element6_clan_tournament_scores (
  month_key text not null,
  clan_id uuid not null references public.element6_clans(id) on delete cascade,
  tournament_points integer not null default 0,
  monthly_xp bigint not null default 0,
  monthly_wins integer not null default 0,
  rank integer,
  qualified boolean not null default false,
  reward_granted boolean not null default false,
  primary key(month_key,clan_id)
);
create index if not exists element6_clan_tournament_scores_rank_idx on public.element6_clan_tournament_scores(month_key,rank);

create table if not exists public.element6_clan_tournament_rewards (
  month_key text not null,
  clan_id uuid not null references public.element6_clans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_tokens integer not null default 0,
  claimed_at timestamptz,
  primary key(month_key,clan_id,user_id)
);

create or replace view public.element6_clan_tournament_weekly as
select m.*, w.starts_at, w.ends_at,
       case when exists(select 1 from public.element6_clan_members me where me.user_id=auth.uid() and me.clan_id=m.clan_a_id) then m.clan_a_id
            when exists(select 1 from public.element6_clan_members me where me.user_id=auth.uid() and me.clan_id=m.clan_b_id) then m.clan_b_id end as user_clan_id
from public.element6_clan_tournament_matchups m
join public.element6_clan_tournament_weeks w on w.week_key=m.week_key;

create or replace view public.element6_clan_tournament_monthly as
select row_number() over(partition by s.month_key order by s.tournament_points desc,s.monthly_wins desc,s.monthly_xp desc,c.name asc)::integer rank,
       s.clan_id,c.name as clan_name,c.tag,s.tournament_points,s.monthly_xp,s.monthly_wins,
       (row_number() over(partition by s.month_key order by s.tournament_points desc,s.monthly_wins desc,s.monthly_xp desc,c.name asc) <= 100) as qualified,
       s.month_key
from public.element6_clan_tournament_scores s
join public.element6_clans c on c.id=s.clan_id;

create or replace function public.element6_ensure_clan_tournament_current_period()
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_now timestamptz:=now(); v_start timestamptz; v_end timestamptz; v_week text; v_month text;
  v_ids uuid[]; v_i integer; v_a uuid; v_b uuid; v_seed text; v_exists boolean;
begin
  v_start:=date_trunc('week',v_now); v_end:=v_start+interval '7 days'; v_week:=to_char(v_start,'IYYY-IW'); v_month:=to_char(v_start,'YYYY-MM');
  insert into element6_clan_tournament_weeks(week_key,starts_at,ends_at) values(v_week,v_start,v_end) on conflict do nothing;

  -- Deterministic shuffle for the current week: random-looking, but identical for every client.
  select array_agg(id order by md5(id::text||':'||v_week)) into v_ids from element6_clans;
  if v_ids is not null then
    v_i:=1;
    while v_i <= coalesce(array_length(v_ids,1),0) loop
      v_a:=v_ids[v_i]; v_b:=case when v_i+1<=array_length(v_ids,1) then v_ids[v_i+1] else null end;
      if v_b is null then
        insert into element6_clan_tournament_matchups(week_key,clan_a_id,status,winner_clan_id,completed_at)
        values(v_week,v_a,'bye',v_a,v_now)
        on conflict do nothing;
      else
        insert into element6_clan_tournament_matchups(week_key,clan_a_id,clan_b_id)
        values(v_week,v_a,v_b) on conflict do nothing;
      end if;
      v_i:=v_i+2;
    end loop;
  end if;

  -- Finalize completed weeks and award one tournament point to each winner.
  update element6_clan_tournament_matchups m set
    clan_a_xp=coalesce((select sum(e.xp) from element6_clan_activity_events e where e.clan_id=m.clan_a_id and e.created_at>=w.starts_at and e.created_at<w.ends_at),0),
    clan_b_xp=coalesce((select sum(e.xp) from element6_clan_activity_events e where e.clan_id=m.clan_b_id and e.created_at>=w.starts_at and e.created_at<w.ends_at),0)
  from element6_clan_tournament_weeks w where m.week_key=w.week_key and w.ends_at<=v_now and m.status='active';

  update element6_clan_tournament_matchups m set winner_clan_id=case when m.clan_a_xp>=m.clan_b_xp then m.clan_a_id else m.clan_b_id end,status='complete',completed_at=v_now
  from element6_clan_tournament_weeks w where m.week_key=w.week_key and w.ends_at<=v_now and m.status='active';

  delete from element6_clan_tournament_scores where month_key=v_month;
  insert into element6_clan_tournament_scores(month_key,clan_id,tournament_points,monthly_xp,monthly_wins)
  select v_month,c.id,
    coalesce((select count(*) from element6_clan_tournament_matchups m where m.winner_clan_id=c.id and m.status='complete' and m.week_key in (select week_key from element6_clan_tournament_weeks where to_char(starts_at,'YYYY-MM')=v_month)),0)::integer,
    coalesce((select sum(e.xp) from element6_clan_activity_events e where e.clan_id=c.id and e.created_at>=date_trunc('month',v_now) and e.created_at<date_trunc('month',v_now)+interval '1 month'),0),
    coalesce((select count(*) from element6_clan_tournament_matchups m where m.winner_clan_id=c.id and m.status='complete' and m.week_key in (select week_key from element6_clan_tournament_weeks where to_char(starts_at,'YYYY-MM')=v_month)),0)::integer
  from element6_clans c;

  insert into element6_clan_tournament_scores(month_key,clan_id,monthly_xp)
  select v_month,c.id,coalesce((select sum(e.xp) from element6_clan_activity_events e where e.clan_id=c.id and e.created_at>=date_trunc('month',v_now) and e.created_at<date_trunc('month',v_now)+interval '1 month'),0)
  from element6_clans c on conflict(month_key,clan_id) do update set monthly_xp=excluded.monthly_xp;

  with ranked as (select month_key,clan_id,row_number() over(partition by month_key order by tournament_points desc,monthly_wins desc,monthly_xp desc,clan_id)::integer r from element6_clan_tournament_scores where month_key=v_month)
  update element6_clan_tournament_scores s set rank=r,qualified=(r<=100) from ranked where s.month_key=ranked.month_key and s.clan_id=ranked.clan_id;

  return jsonb_build_object('week_key',v_week,'month_key',v_month);
end; $$;
revoke all on function public.element6_ensure_clan_tournament_current_period() from public,anon;
grant execute on function public.element6_ensure_clan_tournament_current_period() to authenticated;

-- 3x XP thresholds for clan tier progression. Tier 1 remains first qualifying activity;
-- subsequent thresholds are tripled while minimum-age gates remain unchanged.
create or replace function public.element6_clan_required_xp(p_tier smallint)
returns bigint language sql immutable as $$
select case p_tier
 when 0 then 1
 when 1 then 225
 when 2 then 750
 when 3 then 1650
 when 4 then 3000
 when 5 then 4800
 when 6 then 7200
 when 7 then 10200
 when 8 then 14100
 when 9 then 19500
 else 0 end; $$;


create or replace function public.element6_claim_clan_tournament_reward()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_month text:=to_char(date_trunc('month',now())-interval '1 month','YYYY-MM'); v_clan uuid; v_reward integer:=100000; v_claimed timestamptz;
begin
  select clan_id into v_clan from element6_clan_members where user_id=auth.uid() limit 1;
  if v_clan is null then return jsonb_build_object('claimed',false,'reason','not_in_clan'); end if;
  if not exists(select 1 from element6_clan_tournament_scores where month_key=v_month and clan_id=v_clan and rank=1) then return jsonb_build_object('claimed',false,'reason','not_winner'); end if;
  if exists(select 1 from element6_clan_tournament_rewards where month_key=v_month and clan_id=v_clan and user_id=auth.uid() and claimed_at is not null) then
    return jsonb_build_object('claimed',false,'reason','already_claimed');
  end if;
  insert into element6_clan_tournament_rewards(month_key,clan_id,user_id,reward_tokens,claimed_at)
  values(v_month,v_clan,auth.uid(),v_reward,now()) on conflict(month_key,clan_id,user_id) do nothing;
  return jsonb_build_object('claimed',true,'tokens',v_reward,'month_key',v_month);
end; $$;
revoke all on function public.element6_claim_clan_tournament_reward() from public,anon;
grant execute on function public.element6_claim_clan_tournament_reward() to authenticated;

alter table public.element6_clan_tournament_weeks enable row level security;
alter table public.element6_clan_tournament_matchups enable row level security;
alter table public.element6_clan_tournament_scores enable row level security;
alter table public.element6_clan_tournament_rewards enable row level security;
drop policy if exists element6_tournament_weeks_read on public.element6_clan_tournament_weeks;
create policy element6_tournament_weeks_read on public.element6_clan_tournament_weeks for select to authenticated using (true);
drop policy if exists element6_tournament_scores_read on public.element6_clan_tournament_scores;
create policy element6_tournament_scores_read on public.element6_clan_tournament_scores for select to authenticated using (true);
drop policy if exists element6_tournament_matchups_read on public.element6_clan_tournament_matchups;
create policy element6_tournament_matchups_read on public.element6_clan_tournament_matchups for select to authenticated using (exists(select 1 from element6_clan_members m where m.user_id=auth.uid() and (m.clan_id=clan_a_id or m.clan_id=clan_b_id)));
drop policy if exists element6_tournament_rewards_read on public.element6_clan_tournament_rewards;
create policy element6_tournament_rewards_read on public.element6_clan_tournament_rewards for select to authenticated using (user_id=auth.uid());
