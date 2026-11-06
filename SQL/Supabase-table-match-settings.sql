-- Apply after the Element 6 Table setup scripts.
begin;

alter table public.element6_table_tournaments
  add column if not exists match_settings jsonb not null
  default '{"stocks":1,"matchTime":180,"startingDamage":0,"maxPlayers":8}'::jsonb;
alter table public.element6_table_players
  add column if not exists last_seen_at timestamptz not null default now();
update public.element6_table_tournaments
  set match_settings=coalesce(match_settings,'{}'::jsonb) || '{"maxPlayers":8}'::jsonb
  where not (coalesce(match_settings,'{}'::jsonb) ? 'maxPlayers');

create or replace function public.element6_table_update_match_settings(
  p_tournament_id uuid,
  p_settings jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user uuid := auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
  v_settings jsonb;
  v_value text;
  v_humans integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if jsonb_typeof(p_settings) is distinct from 'object' or octet_length(p_settings::text)>4000 then
    raise exception 'Match settings are invalid';
  end if;

  select * into v_tournament
    from public.element6_table_tournaments
    where id=p_tournament_id for update;
  if v_tournament.id is null then raise exception 'The Table session is unavailable'; end if;
  if v_tournament.host_user_id<>v_user then raise exception 'Only the Table host can change match settings'; end if;
  if v_tournament.status not in ('queue','voting') then raise exception 'Match settings are locked after the match starts'; end if;

  -- Patch semantics let quick successive field changes merge atomically.
  v_settings := coalesce(v_tournament.match_settings,'{}'::jsonb) || p_settings;
  v_value := v_settings->>'stocks';
  if v_value is null or v_value not in ('1','2','3','4','5','7','9') then raise exception 'Unsupported stock count'; end if;
  v_value := v_settings->>'matchTime';
  if v_value is null or v_value not in ('60','120','180','240','300','480','600') then raise exception 'Match time must be 1 to 10 minutes'; end if;
  v_value := v_settings->>'startingDamage';
  if v_value is null or v_value not in ('0','50','100','150','200','250') then raise exception 'Starting damage must use a supported value from 0 to 250 percent'; end if;
  v_value := v_settings->>'maxPlayers';
  if v_value is null or v_value !~ '^[2-8]$' then raise exception 'Active player count must be between 2 and 8'; end if;
  select count(*)::integer into v_humans from public.element6_table_players
    where tournament_id=p_tournament_id and last_seen_at>now()-interval '20 seconds';
  if v_value::integer < coalesce(v_humans,0) then raise exception 'Active player count cannot be lower than the connected human roster'; end if;
  if exists(select 1 from jsonb_object_keys(p_settings) as keys(key) where keys.key not in ('stocks','matchTime','startingDamage','maxPlayers')) then
    raise exception 'This match setting is not supported';
  end if;

  update public.element6_table_tournaments
    set match_settings=v_settings,updated_at=now()
    where id=p_tournament_id
    returning * into v_tournament;
  return jsonb_build_object('settings',v_tournament.match_settings);
end;
$$;
revoke all on function public.element6_table_update_match_settings(uuid,jsonb) from public,anon;
grant execute on function public.element6_table_update_match_settings(uuid,jsonb) to authenticated;

commit;
