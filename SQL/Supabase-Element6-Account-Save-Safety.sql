-- Run once in Supabase SQL Editor. This versioned save endpoint prevents an
-- older tab/device snapshot from silently replacing newer account progress.
begin;

create or replace function public.save_element6_progress_v2(
  p_progress jsonb,
  p_expected_updated_at timestamptz default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $E6SAVEV2$
declare
  v_user uuid := (select auth.uid());
  v_current jsonb;
  v_updated timestamptz;
  v_now timestamptz := clock_timestamp();
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  select up.progress_json, up.updated_at into v_current, v_updated
  from public.user_progress up where up.user_id = v_user for update;
  if found then
    if p_expected_updated_at is null or p_expected_updated_at is distinct from v_updated then
      return jsonb_build_object('saved',false,'conflict',true,'progress',v_current,'updated_at',v_updated);
    end if;
    update public.user_progress
    set progress_json = coalesce(p_progress,'{}'::jsonb), updated_at = v_now
    where user_id = v_user;
  else
    if p_expected_updated_at is not null then
      return jsonb_build_object('saved',false,'conflict',true,'progress','{}'::jsonb,'updated_at',null);
    end if;
    insert into public.user_progress(user_id,progress_json,updated_at)
    values(v_user,coalesce(p_progress,'{}'::jsonb),v_now)
    on conflict(user_id) do nothing;
    if not found then
      select up.progress_json,up.updated_at into v_current,v_updated
      from public.user_progress up where up.user_id=v_user;
      return jsonb_build_object('saved',false,'conflict',true,'progress',v_current,'updated_at',v_updated);
    end if;
  end if;
  return jsonb_build_object('saved',true,'conflict',false,'updated_at',v_now);
end;
$E6SAVEV2$;

revoke all on function public.save_element6_progress_v2(jsonb,timestamptz) from public,anon;
grant execute on function public.save_element6_progress_v2(jsonb,timestamptz) to authenticated;

commit;
