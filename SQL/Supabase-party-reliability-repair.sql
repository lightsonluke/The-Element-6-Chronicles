-- Party state hardening for the existing Supabase party implementation.
-- Apply after Supabase-party-table-race-replays.sql and
-- Supabase-party-presence-completion.sql.
begin;

alter table public.element6_party_members
  add column if not exists is_ready boolean not null default false;

alter table public.element6_party_invites
  add column if not exists expires_at timestamptz not null default (now() + interval '24 hours');

alter table public.element6_party_invites
  drop constraint if exists element6_party_invites_status_check;
alter table public.element6_party_invites
  add constraint element6_party_invites_status_check
  check (status in ('pending','accepted','declined','expired','canceled'));

create index if not exists element6_party_invites_recipient_status_expiry_idx
  on public.element6_party_invites(to_user_id,status,expires_at);

create or replace function public.element6_party_json(p_party_id uuid)
returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object(
    'id',p.id,'party_code',p.party_code,'host_user_id',p.host_user_id,'host_username',p.host_username,
    'name',p.name,'is_public',p.is_public,'status',p.status,'queued_mode',p.queued_mode,
    'member_count',(select count(*) from public.element6_party_members m where m.party_id=p.id),
    'members',coalesce((select jsonb_agg(jsonb_build_object(
      'user_id',m.user_id,'username',m.username,'slot',m.slot,'spectator',m.spectator,'is_ready',m.is_ready,
      'app_status',case when ap.updated_at >= now()-interval '90 seconds' then ap.app_status else 'offline' end,
      'current_mode',case when ap.updated_at >= now()-interval '90 seconds' then ap.current_mode else null end
    ) order by m.slot) from public.element6_party_members m
      left join public.element6_app_presence ap on ap.user_id=m.user_id where m.party_id=p.id),'[]'::jsonb)
  ) from public.element6_parties p where p.id=p_party_id;
$$;

create or replace function public.element6_create_party(p_public boolean default true,p_name text default 'Party')
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_party public.element6_parties%rowtype;
  v_code text;
  v_name text;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  delete from public.element6_party_members m where m.user_id=v_user and not exists(
    select 1 from public.element6_parties p where p.id=m.party_id and p.status in ('open','queued','playing')
  );
  if exists(select 1 from public.element6_party_members m join public.element6_parties p on p.id=m.party_id where m.user_id=v_user and p.status in ('open','queued','playing')) then
    raise exception 'You are already in a party';
  end if;
  select coalesce(username,'Player') into v_name from public.player_profiles where user_id=v_user;
  loop
    v_code:=upper(substr(md5(random()::text||clock_timestamp()::text),1,6));
    begin
      insert into public.element6_parties(party_code,host_user_id,host_username,name,is_public)
      values(v_code,v_user,coalesce(v_name,'Player'),coalesce(nullif(trim(p_name),''),'Party'),coalesce(p_public,true))
      returning * into v_party;
      exit;
    exception when unique_violation then
      -- Generate a new code and retry; no partial party row was created.
    end;
  end loop;
  insert into public.element6_party_members(party_id,user_id,username,slot,is_ready)
  values(v_party.id,v_user,coalesce(v_name,'Player'),1,false);
  return public.element6_party_json(v_party.id);
end;
$$;

create or replace function public.element6_join_party(p_party_id uuid default null,p_party_code text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid := auth.uid();
  v_party public.element6_parties%rowtype;
  v_slot smallint;
  v_now uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  if (p_party_id is null) = (nullif(trim(p_party_code),'') is null) then
    raise exception 'Provide a party code or public party';
  end if;

  select m.party_id into v_now
    from public.element6_party_members m
    join public.element6_parties p on p.id=m.party_id
   where m.user_id=v_user and p.status in ('open','queued','playing')
   order by p.updated_at desc limit 1;

  if p_party_id is not null then
    select * into v_party from public.element6_parties where id=p_party_id and status='open' for update;
  else
    select * into v_party from public.element6_parties where party_code=upper(trim(p_party_code)) and status='open' for update;
  end if;
  if v_party.id is null then raise exception 'Party is unavailable'; end if;

  if not v_party.is_public and not exists(
    select 1 from public.element6_party_invites i
     where i.party_id=v_party.id and i.to_user_id=v_user and i.status='pending' and i.expires_at>now()
  ) then raise exception 'This party is invite only'; end if;

  if v_now is not null and v_now<>v_party.id then raise exception 'Leave your current party before joining another'; end if;
  if exists(select 1 from public.element6_party_members where party_id=v_party.id and user_id=v_user) then
    return public.element6_party_json(v_party.id);
  end if;

  select coalesce(max(slot),0)+1 into v_slot from public.element6_party_members where party_id=v_party.id;
  if v_slot>8 then raise exception 'Party is full'; end if;
  insert into public.element6_party_members(party_id,user_id,username,slot)
  values(v_party.id,v_user,coalesce((select username from public.player_profiles where user_id=v_user),'Player'),v_slot);
  return public.element6_party_json(v_party.id);
end;
$$;

create or replace function public.element6_leave_party(p_party_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare
  v_user uuid := auth.uid();
  v_party public.element6_parties%rowtype;
  v_next_host uuid;
  v_next_name text;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  -- Match the user-then-party lock order used by create and join.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_user is null or v_party.id is null or not exists(
    select 1 from public.element6_party_members where party_id=p_party_id and user_id=v_user
  ) then raise exception 'Party not found'; end if;
  delete from public.element6_party_members where party_id=p_party_id and user_id=v_user;
  if v_party.host_user_id=v_user then
    select m.user_id,m.username into v_next_host,v_next_name
      from public.element6_party_members m
      left join public.element6_app_presence ap on ap.user_id=m.user_id
     where m.party_id=p_party_id
     order by (ap.updated_at >= now()-interval '90 seconds') desc nulls last,m.joined_at,m.slot
     limit 1;
    if v_next_host is null then delete from public.element6_parties where id=p_party_id; return; end if;
    update public.element6_parties set host_user_id=v_next_host,host_username=v_next_name,updated_at=now() where id=p_party_id;
  else
    update public.element6_parties set updated_at=now() where id=p_party_id;
  end if;
end;
$$;

create or replace function public.element6_send_party_invite(p_party_id uuid,p_to_user uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid := auth.uid();
  v_lock_user uuid;
  v_count int;
  v_invite public.element6_party_invites%rowtype;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_to_user is null or p_to_user=v_user then raise exception 'Choose another player'; end if;
  -- Lock both identities in stable order to serialize joins against invites.
  for v_lock_user in
    select lock_item.user_id from unnest(array[v_user,p_to_user]) as lock_item(user_id) order by lock_item.user_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_lock_user::text,0));
  end loop;
  perform 1 from public.element6_parties where id=p_party_id and status='open' for update;
  if not found then raise exception 'This party is not accepting invites'; end if;
  if not exists(select 1 from public.element6_party_members where party_id=p_party_id and user_id=v_user) then raise exception 'You are not in this party'; end if;
  if not exists(select 1 from auth.users where id=p_to_user) then raise exception 'The invited account is unavailable'; end if;
  if not exists(
    select 1 from public.player_friend_requests f
     where f.status='accepted'
       and ((f.sender_id=v_user and f.recipient_id=p_to_user) or (f.sender_id=p_to_user and f.recipient_id=v_user))
  ) then raise exception 'Party invitations can only be sent to accepted friends'; end if;
  select count(*) into v_count from public.element6_party_members where party_id=p_party_id;
  if v_count>=8 then raise exception 'Party is full'; end if;
  if exists(select 1 from public.element6_party_members m join public.element6_parties p on p.id=m.party_id where m.user_id=p_to_user and p.status in ('open','queued','playing')) then
    raise exception 'That player is already in a party';
  end if;
  insert into public.element6_party_invites(party_id,from_user_id,to_user_id,status,created_at,expires_at)
  values(p_party_id,v_user,p_to_user,'pending',now(),now()+interval '24 hours')
  on conflict(party_id,to_user_id) do update
    set from_user_id=excluded.from_user_id,status='pending',created_at=now(),expires_at=now()+interval '24 hours'
  returning * into v_invite;
  return jsonb_build_object('sent',true,'invite_id',v_invite.id,'expires_at',v_invite.expires_at);
end;
$$;

create or replace function public.element6_respond_party_invite(p_invite_id uuid,p_accept boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_user uuid := auth.uid();
  v_invite public.element6_party_invites%rowtype;
  v_party public.element6_parties%rowtype;
  v_result jsonb;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  select * into v_invite from public.element6_party_invites
   where id=p_invite_id and to_user_id=v_user and status='pending' for update;
  if v_invite.id is null then raise exception 'Party invite is no longer available'; end if;
  if v_invite.expires_at<=now() then
    update public.element6_party_invites set status='expired' where id=v_invite.id;
    return jsonb_build_object('accepted',false,'expired',true);
  end if;
  if not p_accept then
    update public.element6_party_invites set status='declined' where id=v_invite.id;
    return jsonb_build_object('accepted',false,'declined',true);
  end if;
  select * into v_party from public.element6_parties where id=v_invite.party_id and status='open' for update;
  if v_party.id is null then raise exception 'Party is no longer open'; end if;
  v_result:=public.element6_join_party(v_party.id,null);
  update public.element6_party_invites set status='accepted' where id=v_invite.id;
  return v_result;
end;
$$;

create or replace function public.element6_list_my_party_invites()
returns jsonb language sql security definer stable set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',i.id,'party_id',i.party_id,'from_user_id',i.from_user_id,'to_user_id',i.to_user_id,
    'from_username',coalesce(pp.username,'Player'),'party_name',coalesce(p.name,'a party'),'created_at',i.created_at,'expires_at',i.expires_at
  ) order by i.created_at desc),'[]'::jsonb)
  from public.element6_party_invites i
  left join public.player_profiles pp on pp.user_id=i.from_user_id
  left join public.element6_parties p on p.id=i.party_id
  where i.to_user_id=auth.uid() and i.status='pending' and i.expires_at>now() and p.status='open';
$$;

create or replace function public.element6_set_party_ready(p_ready boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_party_id uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  select m.party_id into v_party_id from public.element6_party_members m
    join public.element6_parties p on p.id=m.party_id where m.user_id=v_user and p.status='open' limit 1;
  if v_party_id is null then raise exception 'You are not in an open party'; end if;
  perform 1 from public.element6_parties where id=v_party_id and status='open' for update;
  if not found then raise exception 'Party is no longer open'; end if;
  update public.element6_party_members set is_ready=coalesce(p_ready,false) where party_id=v_party_id and user_id=v_user;
  update public.element6_parties set updated_at=now() where id=v_party_id;
  return public.element6_party_json(v_party_id);
end;
$$;

create or replace function public.element6_transfer_party_host(p_party_id uuid,p_to_user uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_lock_user uuid;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_to_user is null or p_to_user=v_user then raise exception 'Choose another current party member'; end if;
  for v_lock_user in
    select lock_item.user_id from unnest(array[v_user,p_to_user]) as lock_item(user_id) order by lock_item.user_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_lock_user::text,0));
  end loop;
  perform 1 from public.element6_parties where id=p_party_id for update;
  if not found then raise exception 'Party not found'; end if;
  update public.element6_parties set host_user_id=p_to_user,
    host_username=coalesce((select username from public.element6_party_members where party_id=p_party_id and user_id=p_to_user),'Player'),
    updated_at=now()
   where id=p_party_id and host_user_id=v_user and status='open'
     and exists(select 1 from public.element6_party_members where party_id=p_party_id and user_id=p_to_user);
  if not found then raise exception 'Only the host can transfer leadership to a current party member'; end if;
  return public.element6_party_json(p_party_id);
end;
$$;

create or replace function public.element6_party_prepare_match(p_party_id uuid,p_mode text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_party public.element6_parties%rowtype; v_count int; v_unready int;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null or v_party.host_user_id<>v_user then raise exception 'Only the party host can start an activity'; end if;
  if v_party.status not in ('open','queued') then raise exception 'Party is not available to start an activity'; end if;
  if p_mode is null or p_mode not in('customrooms','banger-online','volleyball-online','thetable','battleroyale','grandcircuit-online','lan','soccer-online','dodgeball-online','ctf-online') then raise exception 'Unsupported party mode'; end if;
  if not exists(select 1 from public.element6_party_members where party_id=p_party_id and user_id=v_user) then raise exception 'Party host is not an active member'; end if;
  select count(*),count(*) filter (where not is_ready) into v_count,v_unready from public.element6_party_members where party_id=p_party_id;
  if v_count<1 then raise exception 'At least one party member is required'; end if;
  if v_unready>0 then raise exception 'Every party member must be ready before the host starts'; end if;
  update public.element6_party_members set is_ready=false where party_id=p_party_id;
  update public.element6_parties set status='queued',queued_mode=p_mode,updated_at=now() where id=p_party_id;
  return public.element6_party_json(p_party_id);
end;
$$;

grant execute on function public.element6_join_party(uuid,text),public.element6_leave_party(uuid),
  public.element6_create_party(boolean,text),
  public.element6_send_party_invite(uuid,uuid),public.element6_respond_party_invite(uuid,boolean),
  public.element6_list_my_party_invites(),public.element6_set_party_ready(boolean),
  public.element6_transfer_party_host(uuid,uuid),public.element6_party_prepare_match(uuid,text)
to authenticated;

-- SECURITY DEFINER functions are executable by PUBLIC by default. Keep these
-- party APIs available to signed-in players only.
revoke all on function public.element6_party_json(uuid),
  public.element6_join_party(uuid,text),public.element6_leave_party(uuid),
  public.element6_create_party(boolean,text),public.element6_send_party_invite(uuid,uuid),
  public.element6_respond_party_invite(uuid,boolean),public.element6_list_my_party_invites(),
  public.element6_set_party_ready(boolean),public.element6_transfer_party_host(uuid,uuid),
  public.element6_party_prepare_match(uuid,text) from public,anon;
grant execute on function public.element6_party_json(uuid),
  public.element6_join_party(uuid,text),public.element6_leave_party(uuid),
  public.element6_create_party(boolean,text),public.element6_send_party_invite(uuid,uuid),
  public.element6_respond_party_invite(uuid,boolean),public.element6_list_my_party_invites(),
  public.element6_set_party_ready(boolean),public.element6_transfer_party_host(uuid,uuid),
  public.element6_party_prepare_match(uuid,text) to authenticated;

commit;
