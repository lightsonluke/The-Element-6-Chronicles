-- Make The Table queue assignment idempotent and serialize simultaneous joins.
-- Apply after the existing party/table migrations.
begin;

create or replace function public.element6_join_the_table(
  p_char_id text,
  p_loadout jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid:=auth.uid();
  v_tournament public.element6_table_tournaments%rowtype;
  v_slot smallint;
  v_count int;
begin
  if v_user is null then raise exception 'Sign in first'; end if;

  -- The per-account lock prevents retries or duplicate clicks from creating
  -- multiple memberships. The queue lock prevents concurrent friends from
  -- both observing an empty queue and creating separate tournaments.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  select tt.* into v_tournament
    from public.element6_table_players tp
    join public.element6_table_tournaments tt on tt.id=tp.tournament_id
   where tp.user_id=v_user and tt.status in ('queue','voting','playing')
   order by tt.updated_at desc
   limit 1;
  if v_tournament.id is not null then
    return jsonb_build_object('tournament_id',v_tournament.id,'status',v_tournament.status,'joined',false);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('element6-table-open-queue',0));
  select tt.* into v_tournament
    from public.element6_table_tournaments tt
   where tt.status='queue'
   order by tt.created_at,tt.id
   for update
   limit 1;

  if v_tournament.id is null then
    insert into public.element6_table_tournaments(host_user_id)
    values(v_user) returning * into v_tournament;
  end if;

  select coalesce(max(tp.slot),0)+1 into v_slot
    from public.element6_table_players tp where tp.tournament_id=v_tournament.id;
  if v_slot>8 then raise exception 'The Table is full'; end if;

  insert into public.element6_table_players(
    tournament_id,user_id,slot,username,char_id,loadout
  ) values (
    v_tournament.id,
    v_user,
    v_slot,
    coalesce((select pp.username from public.player_profiles pp where pp.user_id=v_user),'Player'),
    coalesce(nullif(trim(p_char_id),''),'yellow'),
    coalesce(p_loadout,'{}'::jsonb)
  );

  select count(*) into v_count
    from public.element6_table_players tp where tp.tournament_id=v_tournament.id;
  if v_count=8 then
    update public.element6_table_tournaments
       set status='voting',updated_at=now()
     where id=v_tournament.id and status='queue';
  end if;
  return jsonb_build_object(
    'tournament_id',v_tournament.id,
    'status',case when v_count=8 then 'voting' else 'queue' end,
    'joined',true
  );
end;
$$;

revoke all on function public.element6_join_the_table(text,jsonb) from public,anon;
grant execute on function public.element6_join_the_table(text,jsonb) to authenticated;

commit;
