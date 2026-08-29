-- Account-bound save codes. Codes cannot be imported by another account.
begin;
create table if not exists public.element6_save_codes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 code text not null unique, payload jsonb not null, active boolean not null default true,
 invalidated_reason text, created_at timestamptz not null default now(), invalidated_at timestamptz
);
alter table public.element6_save_codes enable row level security;
drop policy if exists own_save_codes on public.element6_save_codes;
create policy own_save_codes on public.element6_save_codes for select to authenticated using (user_id=auth.uid());
create or replace function public.create_element6_save_code(p_payload jsonb) returns text language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); c text;
begin
 if u is null then raise exception 'Sign in first'; end if;
 update public.element6_save_codes set active=false,invalidated_reason='replaced',invalidated_at=now() where user_id=u and active;
 loop c:=upper(substr(md5(random()::text||clock_timestamp()::text),1,16)); begin insert into public.element6_save_codes(user_id,code,payload) values(u,c,p_payload); exit; exception when unique_violation then end; end loop;
 return c;
end $$;
create or replace function public.load_element6_save_code(p_code text) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.element6_save_codes%rowtype;
begin select * into r from public.element6_save_codes where code=upper(trim(p_code));
 if r.id is null or not r.active then raise exception 'Save code is invalid'; end if;
 if r.user_id<>auth.uid() then raise exception 'This save code belongs to a different Element 6 account'; end if;
 return r.payload;
end $$;
create or replace function public.invalidate_my_element6_save_codes(p_reason text default 'purchase_or_trade') returns void language sql security definer set search_path=public as $$ update public.element6_save_codes set active=false,invalidated_reason=p_reason,invalidated_at=now() where user_id=auth.uid() and active; $$;
grant execute on function public.create_element6_save_code(jsonb),public.load_element6_save_code(text),public.invalidate_my_element6_save_codes(text) to authenticated;
commit;
