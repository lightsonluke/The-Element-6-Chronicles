-- Direct, party-locked online sports sessions using the existing sport engines.
-- Apply after Supabase-online-sports-setup.sql, the party presence/readiness
-- migrations, and Supabase-party-linked-custom-rooms.sql.
begin;

alter table public.element6_parties
  add column if not exists active_sport_match_id uuid
    references public.online_sport_matches(id) on delete set null;
create index if not exists element6_parties_active_sport_match_idx
  on public.element6_parties(active_sport_match_id)
  where active_sport_match_id is not null;

-- Preserve the established party snapshot shape while exposing the active
-- sport match so every client can enter the same server-created session.
create or replace function public.element6_party_json(p_party_id uuid)
returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object(
    'id',p.id,'party_code',p.party_code,'host_user_id',p.host_user_id,'host_username',p.host_username,
    'name',p.name,'is_public',p.is_public,'status',p.status,'queued_mode',p.queued_mode,
    'active_room_id',p.active_room_id,'active_table_id',p.active_table_id,
    'active_sport_match_id',p.active_sport_match_id,
    'member_count',(select count(*) from public.element6_party_members m where m.party_id=p.id),
    'members',coalesce((select jsonb_agg(jsonb_build_object(
      'user_id',m.user_id,'username',m.username,
      'title',(select nullif(up.progress_json->>'equippedTitle','') from public.user_progress up where up.user_id=m.user_id),
      'slot',m.slot,'spectator',m.spectator,'is_ready',m.is_ready,
      'app_status',case when ap.updated_at>=now()-interval '90 seconds' then ap.app_status else 'offline' end,
      'current_mode',case when ap.updated_at>=now()-interval '90 seconds' then ap.current_mode else null end
    ) order by m.slot) from public.element6_party_members m
      left join public.element6_app_presence ap on ap.user_id=m.user_id
      where m.party_id=p.id),'[]'::jsonb)
  ) from public.element6_parties p where p.id=p_party_id;
$$;

create or replace function public.element6_party_queue_online_sport(
  p_party_id uuid,
  p_mode text
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid();
  v_party public.element6_parties%rowtype;
  v_match public.online_sport_matches%rowtype;
  v_member record;
  v_progress jsonb;
  v_character text;
  v_required smallint;
  v_count integer;
  v_unready integer;
  v_unavailable integer;
  v_slot smallint:=0;
  v_team smallint;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_mode not in ('soccer_online','volleyball_2v2_online','dodgeball_online','banger_online') then
    raise exception 'This sport does not support direct party matchmaking';
  end if;
  v_required:=public.online_sport_required_players(p_mode);
  if v_required not in (2,4,6) then raise exception 'The selected sport has invalid player requirements'; end if;

  select * into v_party from public.element6_parties where id=p_party_id for update;
  if v_party.id is null then raise exception 'Party is unavailable'; end if;
  if v_party.host_user_id<>v_user then raise exception 'Only the party host can start a sport match'; end if;
  if v_party.status not in ('open','queued') then raise exception 'The party is already in a match'; end if;

  if v_party.active_sport_match_id is not null then
    select * into v_match from public.online_sport_matches
      where id=v_party.active_sport_match_id;
    if v_match.id is not null and v_match.status in ('searching','matched','active') then
      if v_match.mode<>p_mode then raise exception 'The party already has a different active sport match'; end if;
      update public.element6_parties set status='queued',queued_mode='sports-match',updated_at=now()
        where id=v_party.id;
      return public.element6_party_json(v_party.id);
    end if;
    update public.element6_parties set active_sport_match_id=null where id=v_party.id;
  end if;
  if v_party.active_room_id is not null and exists(
    select 1 from public.online_custom_rooms r where r.id=v_party.active_room_id and r.status in ('waiting','playing')
  ) then raise exception 'Leave the active Custom Room before starting a sport match'; end if;
  if v_party.active_table_id is not null and exists(
    select 1 from public.element6_table_tournaments t where t.id=v_party.active_table_id and t.status in ('queue','voting','playing')
  ) then raise exception 'Leave The Table before starting a sport match'; end if;

  select count(*),count(*) filter(where not m.is_ready),
    count(*) filter(where ap.user_id is null or ap.updated_at<now()-interval '90 seconds' or ap.app_status not in ('online','playing'))
  into v_count,v_unready,v_unavailable
  from public.element6_party_members m
  left join public.element6_app_presence ap on ap.user_id=m.user_id
  where m.party_id=v_party.id;
  if v_count<>v_required then
    raise exception 'This sport requires exactly % party members; the current party has %',v_required,v_count;
  end if;
  if v_unready>0 then raise exception 'Every party member must be ready before the match starts'; end if;
  if v_unavailable>0 then raise exception 'Every party member must be online before the match starts'; end if;
  if exists(select 1 from public.element6_party_members m where m.party_id=v_party.id and m.spectator) then
    raise exception 'Spectators are not supported for this sport';
  end if;

  -- Serialize cross-party starts for each account so one user cannot be
  -- admitted to two active sport matches at once.
  for v_member in select m.user_id from public.element6_party_members m where m.party_id=v_party.id order by m.user_id loop
    perform pg_advisory_xact_lock(hashtextextended(v_member.user_id::text,0));
  end loop;
  if exists(
    select 1 from public.online_sport_players sp
    join public.online_sport_matches sm on sm.id=sp.match_id
    join public.element6_party_members pm on pm.user_id=sp.user_id and pm.party_id=v_party.id
    where sm.status in ('matched','active')
  ) then raise exception 'A party member is already in an online sport match'; end if;

  insert into public.online_sport_matches(mode,required_players,status,host_user_id)
  values(p_mode,v_required,'matched',v_party.host_user_id)
  returning * into v_match;

  for v_member in
    select m.user_id,m.slot from public.element6_party_members m
    where m.party_id=v_party.id order by m.slot
  loop
    v_slot:=v_slot+1;
    v_progress:='{}'::jsonb;
    select coalesce(progress_json,'{}'::jsonb) into v_progress
      from public.user_progress where user_id=v_member.user_id;
    v_character:=coalesce(nullif(v_progress->>'favoriteId',''),'yellow');
    v_team:=case when v_required=2 then v_slot
                 when v_slot<=v_required/2 then 1 else 2 end;
    insert into public.online_sport_players(match_id,user_id,slot,team,character_id,loadout)
    values(v_match.id,v_member.user_id,v_slot,v_team,v_character,jsonb_build_object(
      'equippedSkins',coalesce(v_progress->'equippedSkins','{}'::jsonb),
      'equippedAccessories',coalesce(v_progress->'equippedAccessories','{}'::jsonb),
      'element',coalesce(v_progress->'equippedElements'->>v_character,'basic'),
      'equippedShikigami',coalesce(v_progress->'equippedShikigami','{}'::jsonb),
      'equippedEmotes',coalesce(v_progress->'equippedEmotes','{}'::jsonb)
    ));
  end loop;

  update public.element6_party_members set is_ready=false where party_id=v_party.id;
  update public.element6_parties set status='queued',queued_mode='sports-match',
    active_sport_match_id=v_match.id,active_room_id=null,active_table_id=null,updated_at=now()
    where id=v_party.id;
  return public.element6_party_json(v_party.id);
end;
$$;
revoke all on function public.element6_party_queue_online_sport(uuid,text) from public,anon;
grant execute on function public.element6_party_queue_online_sport(uuid,text) to authenticated;

-- When an existing sport engine finalizes/cancels a party match, release the
-- party back to its lobby without touching any other party or match state.
create or replace function public.element6_release_finished_party_sport()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_party_id uuid;
begin
  if new.status in ('finished','cancelled','disputed') and old.status is distinct from new.status then
    for v_party_id in select p.id from public.element6_parties p where p.active_sport_match_id=new.id loop
      update public.element6_parties set status='open',queued_mode=null,
        active_sport_match_id=null,updated_at=now() where id=v_party_id;
      update public.element6_party_members set is_ready=false where party_id=v_party_id;
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists element6_release_finished_party_sport on public.online_sport_matches;
create trigger element6_release_finished_party_sport
after update of status on public.online_sport_matches
for each row execute function public.element6_release_finished_party_sport();
revoke all on function public.element6_release_finished_party_sport() from public,anon,authenticated;

commit;
