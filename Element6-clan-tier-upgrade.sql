-- Element 6 - Clan Tier / Lifetime XP Upgrade
-- Additive migration. Run in Supabase SQL Editor.
-- Preserves existing clan XP and tier progress.

begin;

-- 1) Lifetime XP never resets. Existing clans are backfilled from their activity events.
alter table public.element6_clans
  add column if not exists lifetime_xp bigint not null default 0;

update public.element6_clans c
set lifetime_xp = greatest(
  coalesce(c.lifetime_xp, 0),
  coalesce((
    select sum(e.xp)::bigint
    from public.element6_clan_activity_events e
    where e.clan_id = c.id
  ), 0),
  coalesce(c.xp, 0)
);

-- 2) Keep the existing server-side activity path authoritative while also
--    accumulating lifetime XP. The function signature is unchanged.
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
  v_awarded_xp integer := greatest(0, p_xp);
begin
  if p_user_id is null then raise exception 'Missing user'; end if;
  if p_xp < 0 then raise exception 'Invalid XP'; end if;

  select exists(
    select 1
    from public.element6_clan_members
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

  if p_source_match_id is not null then
    insert into public.element6_clan_activity_events(
      clan_id,user_id,event_key,xp,source_match_id
    )
    values(
      v_clan.id,p_user_id,p_event_key,v_awarded_xp,p_source_match_id
    )
    on conflict do nothing;
  else
    insert into public.element6_clan_activity_events(
      clan_id,user_id,event_key,xp
    )
    values(
      v_clan.id,p_user_id,p_event_key,v_awarded_xp
    );
  end if;

  if p_source_match_id is not null and not found then
    return jsonb_build_object(
      'recorded',false,
      'reason','already_recorded',
      'tier',v_clan.tier,
      'xp',v_clan.xp,
      'lifetime_xp',v_clan.lifetime_xp
    );
  end if;

  update public.element6_clans
  set xp=xp+v_awarded_xp,
      lifetime_xp=lifetime_xp+v_awarded_xp,
      tier=greatest(tier,
        case
          when tier=0 then 1
          else tier
        end
      ),
      tier1_unlocked_at=coalesce(tier1_unlocked_at,now()),
      updated_at=now()
  where id=v_clan.id;

  select * into v_clan
  from public.element6_clans
  where id=v_clan.id
  for update;

  v_new_tier:=v_clan.tier;

  while v_new_tier < 10
    and v_clan.xp >= public.element6_clan_required_xp(v_new_tier)
    and now() >= v_clan.created_at + make_interval(days => public.element6_clan_min_days_for_tier(v_new_tier+1))
  loop
    v_new_tier:=v_new_tier+1;
  end loop;

  if v_new_tier <> v_clan.tier then
    update public.element6_clans
    set tier=v_new_tier, updated_at=now()
    where id=v_clan.id;
  end if;

  return jsonb_build_object(
    'recorded',true,
    'clan_id',v_clan.id,
    'tier',v_new_tier,
    'xp',v_clan.xp,
    'lifetime_xp',v_clan.lifetime_xp
  );
end;
$$;

revoke all on function public.element6_record_clan_activity(uuid,text,integer,text) from public,anon;
grant execute on function public.element6_record_clan_activity(uuid,text,integer,text) to authenticated;

commit;

-- Verification:
-- select id,name,tier,xp,lifetime_xp from public.element6_clans order by lifetime_xp desc;
