-- ELEMENT 6: shared online-fight stage + ELO cap repair
-- Run this entire file once in Supabase SQL Editor.
-- Safe to run again.

begin;

alter table public.online_matches add column if not exists stage_id text;

-- Old active/searching matches can safely use a normal default stage.
update public.online_matches
set stage_id = 'splitcity'
where stage_id is null or stage_id like 'custom%';

alter table public.online_matches alter column stage_id set default 'splitcity';

-- 0–4000 is enforced on the server, so no browser can award an invalid ELO.
create or replace function public.element6_cap_rating()
returns trigger
language plpgsql
as $$
begin
  new.rating := greatest(0, least(4000, coalesce(new.rating, 1000)));
  return new;
end;
$$;

update public.ranked_ratings
set rating = greatest(0, least(4000, rating));

drop trigger if exists element6_cap_ranked_rating on public.ranked_ratings;
create trigger element6_cap_ranked_rating
before insert or update of rating on public.ranked_ratings
for each row execute function public.element6_cap_rating();

do $$
begin
  if to_regclass('public.online_sport_ratings') is not null then
    execute 'update public.online_sport_ratings set rating = greatest(0, least(4000, rating))';
    execute 'drop trigger if exists element6_cap_sport_rating on public.online_sport_ratings';
    execute 'create trigger element6_cap_sport_rating before insert or update of rating on public.online_sport_ratings for each row execute function public.element6_cap_rating()';
  end if;
end;
$$;

-- This fully replaces the fight queue. It writes both the random seed and one
-- shared built-in stage when the host row is created. Guests use that same row.
create or replace function public.matchmake_online_game(
  p_mode text,
  p_character_id text,
  p_loadout jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match public.online_matches%rowtype;
  v_rating integer := 1000;
  v_stage text;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_mode not in ('ranked', 'unranked') then raise exception 'Unsupported online mode'; end if;
  if coalesce(length(trim(p_character_id)), 0) = 0 then raise exception 'Choose a character'; end if;

  if p_mode = 'ranked' then
    insert into public.ranked_ratings(user_id) values(v_user)
    on conflict(user_id) do nothing;
    select rating into v_rating from public.ranked_ratings where user_id = v_user;
  end if;
  v_rating := greatest(0, least(4000, coalesce(v_rating, 1000)));

  update public.online_matches
  set status = 'cancelled', updated_at = now()
  where host_user_id = v_user and status = 'searching';

  select * into v_match
  from public.online_matches
  where mode = p_mode
    and status = 'searching'
    and guest_user_id is null
    and host_user_id <> v_user
    and host_last_seen > now() - interval '45 seconds'
  order by created_at
  for update skip locked
  limit 1;

  if v_match.id is not null then
    update public.online_matches
    set guest_user_id = v_user,
        guest_char = p_character_id,
        guest_loadout = coalesce(p_loadout, '{}'::jsonb),
        guest_elo = v_rating,
        guest_last_seen = now(),
        status = 'matched',
        ranked_status = case when p_mode = 'ranked' then 'pending' else null end,
        updated_at = now()
    where id = v_match.id
    returning * into v_match;
    return jsonb_build_object('role', 'guest', 'match', to_jsonb(v_match));
  end if;

  v_stage := (array[
    'splitcity', 'silvermansion', 'controllerforest', 'traininggrounds',
    'voidplane', 'neonspire', 'sunsetridge', 'frozenlake',
    'crystalcavern', 'skysanctuary'
  ]::text[])[1 + floor(random() * 10)::integer];

  insert into public.online_matches (
    mode, status, host_user_id, host_char, host_loadout, host_elo,
    ranked_status, host_last_seen, random_seed, stage_id
  ) values (
    p_mode, 'searching', v_user, p_character_id,
    coalesce(p_loadout, '{}'::jsonb), v_rating,
    case when p_mode = 'ranked' then 'pending' else null end,
    now(), floor(random() * 2147483647)::bigint, v_stage
  )
  returning * into v_match;

  return jsonb_build_object('role', 'host', 'match', to_jsonb(v_match));
end;
$$;

revoke all on function public.matchmake_online_game(text, text, jsonb) from public, anon;
grant execute on function public.matchmake_online_game(text, text, jsonb) to authenticated;

commit;
