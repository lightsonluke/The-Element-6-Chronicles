-- Apply after the Element 6 party/table and Custom Room setup scripts.
-- Fixes recursive party-member RLS and validates the new host match settings.
begin;

create or replace function public.element6_current_user_is_party_member(p_party_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.element6_party_members pm
    where pm.party_id = p_party_id and pm.user_id = auth.uid()
  );
$$;
revoke all on function public.element6_current_user_is_party_member(uuid) from public, anon;
grant execute on function public.element6_current_user_is_party_member(uuid) to authenticated;

alter table public.element6_party_members enable row level security;
do $$ declare v_policy record; begin
  -- Replace any old self-referencing read policy; it recurses before it can
  -- decide whether the viewer belongs to the party.
  for v_policy in select policyname from pg_policies
    where schemaname='public' and tablename='element6_party_members'
  loop
    execute format('drop policy %I on public.element6_party_members',v_policy.policyname);
  end loop;
end $$;
create policy element6_party_members_read on public.element6_party_members
  for select to authenticated
  using (public.element6_current_user_is_party_member(party_id));
revoke all on public.element6_party_members from anon;
revoke insert, update, delete on public.element6_party_members from authenticated;
grant select on public.element6_party_members to authenticated;

create or replace function public.validate_element6_custom_room_settings()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_settings jsonb := coalesce(new.settings, '{}'::jsonb);
  v_value text;
begin
  v_value := v_settings->>'maxPlayers';
  if v_value is not null then
    if v_value !~ '^[0-9]{1,2}$' then raise exception 'Room capacity must be a whole number'; end if;
    if v_value::integer not between 2 and 8 then raise exception 'Room capacity must be between 2 and 8 players'; end if;
  end if;

  v_value := v_settings->>'stocks';
  if v_value is not null and v_value not in ('1','2','3','4','5','7','9') then
    raise exception 'Stocks must be one of the supported match values';
  end if;

  v_value := v_settings->>'matchTime';
  if v_value is not null and v_value not in ('60','120','180','240','300','480','600') then
    raise exception 'Match time must be between 1 and 10 minutes';
  end if;

  v_value := v_settings->>'startingDamage';
  if v_value is not null and v_value not in ('0','50','100','150','200','250') then
    raise exception 'Starting damage must use a supported 0–250% setting';
  end if;

  v_value := v_settings->>'defaultCPUDifficulty';
  if v_value is not null and v_value not in ('newcomer','beginner','easy','amateur','regular','pro','hard','insane','honored') then
    raise exception 'Bot difficulty is not supported';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_element6_custom_room_settings() from public, anon, authenticated;

drop trigger if exists element6_custom_room_settings_validate on public.online_custom_rooms;
create trigger element6_custom_room_settings_validate
  before insert or update of settings on public.online_custom_rooms
  for each row execute function public.validate_element6_custom_room_settings();

commit;
