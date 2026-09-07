-- ELEMENT 6 — CLAN FOUNDING ROUTES ADDITIVE MIGRATION
-- Run after the existing clan SQL.
-- Adds:
--   1) Wealthy Founder: 15,000 tokens
--   2) Proven Founder: 50 lifetime wins + 5 hours playtime
--   3) Community Founder: 3 other player confirmations + 5,000 tokens

create table if not exists public.element6_clan_founder_sessions (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  status text not null default 'active' check (status in ('active','confirmed','used','expired')),
  confirmations_required smallint not null default 3 check (confirmations_required between 3 and 5),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists element6_clan_founder_sessions_founder_idx
on public.element6_clan_founder_sessions(founder_id,status,created_at desc);

create table if not exists public.element6_clan_founder_confirmations (
  session_id uuid not null references public.element6_clan_founder_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  primary key(session_id,user_id)
);

create index if not exists element6_clan_founder_confirmations_session_idx
on public.element6_clan_founder_confirmations(session_id,confirmed_at);

alter table public.element6_clan_founder_sessions enable row level security;
alter table public.element6_clan_founder_confirmations enable row level security;

drop policy if exists element6_founder_sessions_none on public.element6_clan_founder_sessions;
drop policy if exists element6_founder_confirmations_none on public.element6_clan_founder_confirmations;

create or replace function public.element6_get_clan_founder_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_session public.element6_clan_founder_sessions%rowtype;
  v_count integer:=0;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select * into v_session from public.element6_clan_founder_sessions where id=p_session_id;
  if v_session.id is null then raise exception 'Founding session not found'; end if;
  if v_session.expires_at <= now() and v_session.status in ('active','confirmed') then
    update public.element6_clan_founder_sessions set status='expired',updated_at=now() where id=p_session_id;
    v_session.status:='expired';
  end if;
  if v_session.founder_id <> v_user then raise exception 'Only the founder can view this session'; end if;

  select count(*) into v_count
  from public.element6_clan_founder_confirmations
  where session_id=p_session_id;

  return jsonb_build_object(
    'session_id',v_session.id,
    'code',v_session.code,
    'status',v_session.status,
    'confirmations',v_count,
    'confirmations_required',v_session.confirmations_required,
    'confirmed',(v_count >= v_session.confirmations_required),
    'expires_at',v_session.expires_at
  );
end;
$$;

revoke all on function public.element6_get_clan_founder_session(uuid) from public,anon;
grant execute on function public.element6_get_clan_founder_session(uuid) to authenticated;

create or replace function public.element6_start_clan_founder_session()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_id uuid;
  v_code text;
  v_attempt integer:=0;
  v_exists boolean;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if exists(select 1 from public.element6_clan_members where user_id=v_user) then raise exception 'You are already in a clan'; end if;

  update public.element6_clan_founder_sessions
  set status='expired',updated_at=now()
  where founder_id=v_user and status in ('active','confirmed') and expires_at <= now();

  if exists(select 1 from public.element6_clan_founder_sessions where founder_id=v_user and status in ('active','confirmed') and expires_at > now()) then
    select id, code into v_id, v_code
    from public.element6_clan_founder_sessions
    where founder_id=v_user and status in ('active','confirmed') and expires_at > now()
    order by created_at desc limit 1;
  else
    loop
      v_attempt:=v_attempt+1;
      v_code:=upper(substr(encode(gen_random_bytes(5),'hex'),1,8));
      select exists(select 1 from public.element6_clan_founder_sessions where code=v_code) into v_exists;
      exit when not v_exists or v_attempt >= 10;
    end loop;
    if v_exists then raise exception 'Could not generate a founding code. Try again'; end if;
    insert into public.element6_clan_founder_sessions(founder_id,code)
    values(v_user,v_code)
    returning id into v_id;
  end if;

  return public.element6_get_clan_founder_session(v_id);
end;
$$;

revoke all on function public.element6_start_clan_founder_session() from public,anon;
grant execute on function public.element6_start_clan_founder_session() to authenticated;

create or replace function public.element6_confirm_clan_founder(p_code text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_session public.element6_clan_founder_sessions%rowtype;
  v_count integer:=0;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if exists(select 1 from public.element6_clan_members where user_id=v_user) then raise exception 'You must leave your clan before confirming a new founding'; end if;

  select * into v_session
  from public.element6_clan_founder_sessions
  where code=upper(trim(p_code));
  if v_session.id is null then raise exception 'Founding code not found'; end if;
  if v_session.expires_at <= now() or v_session.status in ('expired','used') then raise exception 'This founding session has expired'; end if;
  if v_session.founder_id=v_user then raise exception 'The founder cannot confirm their own session'; end if;

  insert into public.element6_clan_founder_confirmations(session_id,user_id)
  values(v_session.id,v_user)
  on conflict do nothing;

  select count(*) into v_count from public.element6_clan_founder_confirmations where session_id=v_session.id;
  if v_count >= v_session.confirmations_required then
    update public.element6_clan_founder_sessions
    set status='confirmed',updated_at=now()
    where id=v_session.id and status='active';
  end if;

  return jsonb_build_object(
    'message','Community founding confirmed.',
    'session_id',v_session.id,
    'confirmations',v_count,
    'confirmations_required',v_session.confirmations_required
  );
end;
$$;

revoke all on function public.element6_confirm_clan_founder(text) from public,anon;
grant execute on function public.element6_confirm_clan_founder(text) to authenticated;

create or replace function public.element6_create_clan_v2(
  p_name text,
  p_tag text,
  p_bio text default '',
  p_icon_url text default null,
  p_creation_method text default 'wealthy',
  p_founder_session_id uuid default null,
  p_proof_wins bigint default 0,
  p_proof_playtime_seconds bigint default 0
)
returns public.element6_clans
language plpgsql security definer set search_path=''
as $$
declare
  v_user uuid:=auth.uid();
  v_clan public.element6_clans;
  v_session public.element6_clan_founder_sessions%rowtype;
  v_confirmations integer:=0;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if exists(select 1 from public.element6_clan_members where user_id=v_user) then raise exception 'You are already in a clan'; end if;
  if char_length(trim(p_name)) not between 3 and 24 then raise exception 'Clan name must be 3-24 characters'; end if;
  if p_tag is null or trim(p_tag) !~ '^[A-Za-z0-9]{2,6}$' then raise exception 'Clan tag must be 2-6 letters or numbers'; end if;
  if p_creation_method not in ('wealthy','proven','community') then raise exception 'Invalid founding route'; end if;

  if p_creation_method='proven' then
    if coalesce(p_proof_wins,0) < 50 then raise exception 'Proven Founder requires 50 total wins'; end if;
    if coalesce(p_proof_playtime_seconds,0) < 18000 then raise exception 'Proven Founder requires 5 hours of playtime'; end if;
  elsif p_creation_method='community' then
    if p_founder_session_id is null then raise exception 'Community founding session required'; end if;
    select * into v_session from public.element6_clan_founder_sessions where id=p_founder_session_id;
    if v_session.id is null then raise exception 'Founding session not found'; end if;
    if v_session.founder_id<>v_user then raise exception 'Only the founder can complete this session'; end if;
    if v_session.expires_at<=now() or v_session.status not in ('active','confirmed') then raise exception 'Founding session is no longer active'; end if;
    select count(*) into v_confirmations from public.element6_clan_founder_confirmations where session_id=v_session.id;
    if v_confirmations < v_session.confirmations_required then raise exception 'Not enough founding confirmations'; end if;
  end if;

  insert into public.element6_clans(name,tag,bio,icon_url,owner_id)
  values(trim(p_name),upper(trim(p_tag)),left(coalesce(p_bio,''),500),p_icon_url,v_user)
  returning * into v_clan;

  insert into public.element6_clan_members(clan_id,user_id,role)
  values(v_clan.id,v_user,'leader');

  if p_creation_method='community' then
    update public.element6_clan_founder_sessions
    set status='used',updated_at=now()
    where id=p_founder_session_id;
  end if;

  return v_clan;
end;
$$;

revoke all on function public.element6_create_clan_v2(text,text,text,text,text,uuid,bigint,bigint) from public,anon;
grant execute on function public.element6_create_clan_v2(text,text,text,text,text,uuid,bigint,bigint) to authenticated;

create or replace function public.element6_create_clan(
  p_name text,p_tag text,p_bio text default '',p_icon_url text default null
)
returns public.element6_clans
language plpgsql security definer set search_path=public
as $$
begin
  raise exception 'Use one of the three clan founding routes';
end;
$$;
revoke all on function public.element6_create_clan(text,text,text,text) from public,anon;
