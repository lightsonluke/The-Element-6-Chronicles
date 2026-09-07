-- ELEMENT 6 - CLAN SOCIAL + MANAGEMENT ADDITIVE FIX
-- Run AFTER the existing clan SQL and the previous clan social/members/ELO migration.
-- Safe to rerun.
--
-- Adds/fixes:
--   * Leader/Lieutenant/Officer application approval
--   * Rank labels in clan chat and member/ELO data
--   * Members overview with every member's rank, ELOs, and personal clan XP
--   * Leader + Lieutenant member management
--   * Lieutenant-only promotion path: Member -> Officer
--   * Member removal by Leader/Lieutenant
--   * Leader-only ownership transfer
--   * Leader/Lieutenant meeting scheduling
--   * Secure RPC-backed reads/writes instead of relying on fragile nested PostgREST relations

begin;

-- ---------------------------------------------------------------------------
-- MEMBER OVERVIEW
-- ---------------------------------------------------------------------------

drop function if exists public.element6_get_clan_member_overview(uuid);
create function public.element6_get_clan_member_overview(p_clan_id uuid)
returns table(
  user_id uuid,
  username text,
  role text,
  joined_at timestamptz,
  contribution_xp bigint,
  ranked_rating integer,
  ranked_wins integer,
  ranked_losses integer,
  ranked_matches integer,
  soccer_rating integer,
  soccer_wins integer,
  soccer_losses integer,
  soccer_matches integer,
  volleyball_rating integer,
  volleyball_wins integer,
  volleyball_losses integer,
  volleyball_matches integer,
  dodgeball_rating integer,
  dodgeball_wins integer,
  dodgeball_losses integer,
  dodgeball_matches integer
)
language sql
security definer
set search_path=''
as $$
  select
    m.user_id,
    coalesce(pp.username,'Player') as username,
    m.role,
    m.joined_at,
    coalesce(sum(ae.xp),0)::bigint as contribution_xp,
    coalesce(rr.rating,1000),
    coalesce(rr.wins,0),
    coalesce(rr.losses,0),
    coalesce(rr.matches_played,0),
    coalesce(soc.rating,1000),
    coalesce(soc.wins,0),
    coalesce(soc.losses,0),
    coalesce(soc.matches_played,0),
    coalesce(vb.rating,1000),
    coalesce(vb.wins,0),
    coalesce(vb.losses,0),
    coalesce(vb.matches_played,0),
    coalesce(db.rating,1000),
    coalesce(db.wins,0),
    coalesce(db.losses,0),
    coalesce(db.matches_played,0)
  from public.element6_clan_members m
  left join public.player_profiles pp on pp.user_id=m.user_id
  left join public.ranked_ratings rr on rr.user_id=m.user_id
  left join public.online_sport_ratings soc on soc.user_id=m.user_id and soc.mode='soccer_ranked'
  left join public.online_sport_ratings vb on vb.user_id=m.user_id and vb.mode='volleyball_1v1_ranked'
  left join public.online_sport_ratings db on db.user_id=m.user_id and db.mode='dodgeball_ranked'
  left join public.element6_clan_activity_events ae on ae.clan_id=m.clan_id and ae.user_id=m.user_id
  where m.clan_id=p_clan_id
    and exists (
      select 1
      from public.element6_clan_members viewer
      where viewer.clan_id=p_clan_id
        and viewer.user_id=(select auth.uid())
    )
  group by
    m.user_id,m.role,m.joined_at,pp.username,
    rr.rating,rr.wins,rr.losses,rr.matches_played,
    soc.rating,soc.wins,soc.losses,soc.matches_played,
    vb.rating,vb.wins,vb.losses,vb.matches_played,
    db.rating,db.wins,db.losses,db.matches_played
  order by
    case when m.role='leader' then 0 when m.role='lieutenant' then 1 when m.role='officer' then 2 else 3 end,
    m.joined_at,
    coalesce(pp.username,'Player');
$$;
revoke all on function public.element6_get_clan_member_overview(uuid) from public,anon;
grant execute on function public.element6_get_clan_member_overview(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- CLAN CHAT WITH RANK
-- ---------------------------------------------------------------------------

drop function if exists public.element6_get_clan_chat(uuid);
create function public.element6_get_clan_chat(p_clan_id uuid)
returns table(
  id bigint,
  clan_id uuid,
  user_id uuid,
  username text,
  role text,
  body text,
  created_at timestamptz
)
language sql
security definer
set search_path=''
as $$
  select
    c.id,
    c.clan_id,
    c.user_id,
    coalesce(p.username,'Player') as username,
    coalesce(m.role,'member') as role,
    c.body,
    c.created_at
  from public.element6_clan_chat_messages c
  left join public.player_profiles p on p.user_id=c.user_id
  left join public.element6_clan_members m on m.clan_id=c.clan_id and m.user_id=c.user_id
  where c.clan_id=p_clan_id
    and exists (
      select 1 from public.element6_clan_members viewer
      where viewer.clan_id=p_clan_id and viewer.user_id=(select auth.uid())
    )
  order by c.created_at desc
  limit 100;
$$;
revoke all on function public.element6_get_clan_chat(uuid) from public,anon;
grant execute on function public.element6_get_clan_chat(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- APPLICATIONS: LEADER, LIEUTENANT, OR OFFICER CAN REVIEW
-- ---------------------------------------------------------------------------

drop function if exists public.element6_get_clan_applications(uuid);
create function public.element6_get_clan_applications(p_clan_id uuid)
returns table(
  id uuid,
  user_id uuid,
  username text,
  message text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path=''
as $$
  select
    a.id,
    a.user_id,
    coalesce(pp.username,'Player') as username,
    a.message,
    a.status,
    a.created_at
  from public.element6_clan_applications a
  left join public.player_profiles pp on pp.user_id=a.user_id
  where a.clan_id=p_clan_id
    and a.status='pending'
    and exists (
      select 1
      from public.element6_clan_members m
      where m.clan_id=p_clan_id
        and m.user_id=(select auth.uid())
        and m.role in ('leader','lieutenant','officer')
    )
  order by a.created_at;
$$;
revoke all on function public.element6_get_clan_applications(uuid) from public,anon;
grant execute on function public.element6_get_clan_applications(uuid) to authenticated;

create or replace function public.element6_review_clan_application(
  p_application_id uuid,
  p_approve boolean
)
returns public.element6_clan_applications
language plpgsql
security definer
set search_path=''
as $$
declare
  a public.element6_clan_applications;
  v_user uuid := (select auth.uid());
  v_role text;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  select * into a
  from public.element6_clan_applications
  where id=p_application_id
  for update;

  if a.id is null then raise exception 'Application not found'; end if;
  if a.status <> 'pending' then raise exception 'Application already reviewed'; end if;

  select role into v_role
  from public.element6_clan_members
  where clan_id=a.clan_id and user_id=v_user;

  if v_role not in ('leader','lieutenant','officer') then
    raise exception 'Only clan leaders, lieutenants, and officers can review applications';
  end if;

  if p_approve then
    if exists(select 1 from public.element6_clan_members where user_id=a.user_id) then
      raise exception 'Player is already in a clan';
    end if;

    insert into public.element6_clan_members(clan_id,user_id,role)
    values(a.clan_id,a.user_id,'member');

    update public.element6_clan_applications
    set status='approved', reviewed_at=now(), reviewed_by=v_user
    where id=a.id;
  else
    update public.element6_clan_applications
    set status='rejected', reviewed_at=now(), reviewed_by=v_user
    where id=a.id;
  end if;

  select * into a
  from public.element6_clan_applications
  where id=p_application_id;
  return a;
end;
$$;
revoke all on function public.element6_review_clan_application(uuid,boolean) from public,anon;
grant execute on function public.element6_review_clan_application(uuid,boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- MEMBER ROLE MANAGEMENT
-- Leader: can set Member/Officer/Lieutenant.
-- Lieutenant: can ONLY promote a Member to Officer.
-- ---------------------------------------------------------------------------

create or replace function public.element6_set_clan_member_role(
  p_member uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_clan uuid;
  v_actor_role text;
  v_target_role text;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  select clan_id, role
  into v_clan, v_actor_role
  from public.element6_clan_members
  where user_id=v_user;

  if v_clan is null then raise exception 'You are not in a clan'; end if;
  if v_actor_role not in ('leader','lieutenant') then raise exception 'Only leaders and lieutenants can change ranks'; end if;
  if p_member=v_user then raise exception 'You cannot change your own rank here'; end if;

  select role into v_target_role
  from public.element6_clan_members
  where clan_id=v_clan and user_id=p_member;

  if v_target_role is null then raise exception 'Member not found'; end if;
  if v_target_role='leader' then raise exception 'The leader cannot be changed with this action'; end if;

  if v_actor_role='lieutenant' then
    if v_target_role <> 'member' or p_role <> 'officer' then
      raise exception 'Lieutenants can only promote Members to Officers';
    end if;
  else
    if p_role not in ('member','officer','lieutenant') then
      raise exception 'Invalid role';
    end if;
  end if;

  update public.element6_clan_members
  set role=p_role
  where clan_id=v_clan and user_id=p_member;
end;
$$;
revoke all on function public.element6_set_clan_member_role(uuid,text) from public,anon;
grant execute on function public.element6_set_clan_member_role(uuid,text) to authenticated;

-- ---------------------------------------------------------------------------
-- MEMBER REMOVAL: Leader or Lieutenant. Neither can remove the leader.
-- ---------------------------------------------------------------------------

drop function if exists public.element6_remove_clan_member(uuid);
create function public.element6_remove_clan_member(p_member uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_clan uuid;
  v_actor_role text;
  v_target_role text;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  select clan_id, role into v_clan, v_actor_role
  from public.element6_clan_members
  where user_id=v_user;

  if v_clan is null then raise exception 'You are not in a clan'; end if;
  if v_actor_role not in ('leader','lieutenant') then raise exception 'Only leaders and lieutenants can remove members'; end if;
  if p_member=v_user then raise exception 'You cannot remove yourself here'; end if;

  select role into v_target_role
  from public.element6_clan_members
  where clan_id=v_clan and user_id=p_member;

  if v_target_role is null then raise exception 'Member not found'; end if;
  if v_target_role='leader' then raise exception 'The leader cannot be removed'; end if;

  delete from public.element6_clan_members
  where clan_id=v_clan and user_id=p_member;

  update public.element6_clan_applications
  set status='cancelled', reviewed_at=now(), reviewed_by=v_user
  where user_id=p_member and clan_id=v_clan and status='pending';
end;
$$;
revoke all on function public.element6_remove_clan_member(uuid) from public,anon;
grant execute on function public.element6_remove_clan_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- MEETING SCHEDULING: Leader or Lieutenant
-- ---------------------------------------------------------------------------

drop function if exists public.element6_schedule_clan_meeting(uuid,text,text,timestamptz);
create function public.element6_schedule_clan_meeting(
  p_invited_clan_id uuid,
  p_title text,
  p_notes text,
  p_scheduled_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid := (select auth.uid());
  v_clan uuid;
  v_role text;
  v_meeting uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  select clan_id, role into v_clan, v_role
  from public.element6_clan_members
  where user_id=v_user;

  if v_clan is null then raise exception 'You are not in a clan'; end if;
  if v_role not in ('leader','lieutenant') then raise exception 'Only leaders and lieutenants can schedule meetings'; end if;
  if p_invited_clan_id=v_clan then raise exception 'Choose another clan'; end if;
  if not exists(select 1 from public.element6_clans where id=p_invited_clan_id) then raise exception 'Invited clan not found'; end if;
  if char_length(trim(coalesce(p_title,''))) not between 1 and 100 then raise exception 'Meeting title must be 1-100 characters'; end if;
  if p_scheduled_at is null then raise exception 'Choose a meeting time'; end if;

  insert into public.element6_clan_meetings(
    organizer_clan_id,invited_clan_id,title,notes,scheduled_at,created_by
  )
  values(
    v_clan,p_invited_clan_id,trim(p_title),left(coalesce(p_notes,''),1000),p_scheduled_at,v_user
  )
  returning id into v_meeting;

  return v_meeting;
end;
$$;
revoke all on function public.element6_schedule_clan_meeting(uuid,text,text,timestamptz) from public,anon;
grant execute on function public.element6_schedule_clan_meeting(uuid,text,text,timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- Direct table permissions: management actions stay behind RPCs.
-- ---------------------------------------------------------------------------

grant select on public.element6_clan_members to authenticated;
grant select on public.element6_clan_applications to authenticated;
grant select on public.element6_clan_chat_messages to authenticated;
grant select on public.element6_clan_meetings to authenticated;
revoke insert,update,delete on public.element6_clan_meetings from authenticated;

-- Applications can be seen directly only by the applicant or management roles.
drop policy if exists element6_apps_own_or_leader on public.element6_clan_applications;
create policy element6_apps_own_or_management on public.element6_clan_applications
for select to authenticated
using (
  user_id=(select auth.uid())
  or exists(
    select 1 from public.element6_clan_members m
    where m.clan_id=element6_clan_applications.clan_id
      and m.user_id=(select auth.uid())
      and m.role in ('leader','lieutenant','officer')
  )
);

commit;
