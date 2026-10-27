-- Element 6 party completion migration.
-- Apply after Supabase-party-table-race-replays.sql and
-- Supabase-2026-09-28-party-table-community-replay-fix.sql.
begin;

create or replace function public.element6_list_public_parties()
returns jsonb
language sql
security definer
stable
set search_path=public
as $$
  select coalesce(jsonb_agg(public.element6_party_json(p.id) order by p.created_at desc), '[]'::jsonb)
    from public.element6_parties p
   where p.is_public = true and p.status = 'open'
     and (select count(*) from public.element6_party_members m where m.party_id=p.id) < 8;
$$;

create or replace function public.element6_respond_party_invite(p_invite_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_invite public.element6_party_invites%rowtype;
  v_result jsonb;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_invite from public.element6_party_invites
   where id=p_invite_id and to_user_id=v_user and status='pending' for update;
  if v_invite.id is null then raise exception 'Party invite is no longer available'; end if;
  if p_accept then
    if exists (select 1 from public.element6_party_members mine join public.element6_parties active on active.id=mine.party_id where mine.user_id=v_user and active.status in ('open','queued','playing') and mine.party_id<>v_invite.party_id) then
      raise exception 'Leave your current party before joining another';
    end if;
    v_result := public.element6_join_party(v_invite.party_id, null);
    update public.element6_party_invites set status='accepted' where id=v_invite.id;
    return v_result;
  end if;
  update public.element6_party_invites set status='declined' where id=v_invite.id;
  return jsonb_build_object('accepted', false);
end;
$$;

create or replace function public.element6_list_my_party_invites()
returns jsonb language sql security definer stable set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',i.id,'party_id',i.party_id,'from_user_id',i.from_user_id,'to_user_id',i.to_user_id,
    'from_username',coalesce(pp.username,'Player'),'party_name',coalesce(p.name,'a party'),'created_at',i.created_at
  ) order by i.created_at desc),'[]'::jsonb)
  from public.element6_party_invites i
  left join public.player_profiles pp on pp.user_id=i.from_user_id
  left join public.element6_parties p on p.id=i.party_id
  where i.to_user_id=auth.uid() and i.status='pending';
$$;

grant execute on function public.element6_list_public_parties() to authenticated;
grant execute on function public.element6_list_my_party_invites() to authenticated;
grant execute on function public.element6_respond_party_invite(uuid,boolean) to authenticated;


create table if not exists public.element6_app_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Player',
  app_status text not null default 'online' check (app_status in ('online','playing','away')),
  current_mode text,
  updated_at timestamptz not null default now()
);
alter table public.element6_app_presence enable row level security;
drop policy if exists element6_app_presence_read on public.element6_app_presence;
create policy element6_app_presence_read on public.element6_app_presence for select to authenticated using (
  user_id = auth.uid() or exists (
    select 1 from public.element6_party_members mine
    join public.element6_party_members theirs on theirs.party_id=mine.party_id
    where mine.user_id=auth.uid() and theirs.user_id=element6_app_presence.user_id
  )
);
revoke insert,update,delete on public.element6_app_presence from anon,authenticated;
grant select on public.element6_app_presence to authenticated;

create or replace function public.element6_set_app_presence(p_status text default 'online', p_mode text default null)
returns void language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); n text;
begin
  if u is null then return; end if;
  if p_status not in ('online','playing','away') then raise exception 'Invalid presence status'; end if;
  select coalesce(username,'Player') into n from public.player_profiles where user_id=u;
  insert into public.element6_app_presence(user_id,username,app_status,current_mode,updated_at)
  values(u,coalesce(n,'Player'),p_status,nullif(trim(p_mode),''),now())
  on conflict(user_id) do update set username=excluded.username,app_status=excluded.app_status,current_mode=excluded.current_mode,updated_at=now();
end $$;

create or replace function public.element6_get_party_presence()
returns jsonb language plpgsql security definer stable set search_path=public as $$
declare u uuid:=auth.uid(); pid uuid;
begin
  if u is null then return null; end if;
  select m.party_id into pid from public.element6_party_members m join public.element6_parties p on p.id=m.party_id
   where m.user_id=u and p.status in ('open','queued','playing') order by p.updated_at desc limit 1;
  if pid is null then return null; end if;
  return jsonb_build_object(
    'party', public.element6_party_json(pid),
    'members', coalesce((select jsonb_agg(jsonb_build_object(
      'user_id',m.user_id,'username',m.username,'slot',m.slot,
      'app_status',case when ap.updated_at >= now()-interval '90 seconds' then ap.app_status else 'offline' end,
      'current_mode',case when ap.updated_at >= now()-interval '90 seconds' then ap.current_mode else null end,
      'updated_at',ap.updated_at
    ) order by m.slot) from public.element6_party_members m left join public.element6_app_presence ap on ap.user_id=m.user_id where m.party_id=pid),'[]'::jsonb)
  );
end $$;

grant execute on function public.element6_set_app_presence(text,text),public.element6_get_party_presence() to authenticated;

commit;
