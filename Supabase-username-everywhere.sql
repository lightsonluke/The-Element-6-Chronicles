-- ELEMENT 6 — permanent username synchronization
-- Run once in Supabase SQL Editor. Safe to run again.
-- It updates auth metadata and every known social/leaderboard table that
-- exists in this project. Missing tables are skipped safely.

create or replace function public.sync_current_username(p_username text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_name text := trim(regexp_replace(coalesce(p_username, ''), '[[:space:]]+', ' ', 'g'));
  v_uid uuid := auth.uid();
  tbl text;
  col text;
begin
  if v_uid is null then raise exception 'You must be signed in.'; end if;
  if length(v_name) < 2 or length(v_name) > 20 then raise exception 'Username must be 2–20 characters.'; end if;
  if v_name !~ '^[A-Za-z0-9 _.-]+$' then raise exception 'Username contains unsupported characters.'; end if;

  update auth.users
     set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('username', v_name, 'full_name', v_name),
         updated_at = now()
   where id = v_uid;

  -- Update safely only where both the table and expected display-name column exist.
  foreach tbl in array array['profiles','player_profiles','shared_leaderboard','presence','online_sport_players','online_match_players','leaderboard_entries','parkour_scores','rock_climb_scores','zipline_scores','honored_bot_matches','player_direct_messages','chat_conversations','friend_requests'] loop
    if to_regclass('public.' || tbl) is not null then
      foreach col in array array['username','user_name','display_name','from_username','to_username'] loop
        if exists (select 1 from information_schema.columns where table_schema='public' and table_name=tbl and column_name=col)
           and exists (select 1 from information_schema.columns where table_schema='public' and table_name=tbl and column_name='user_id') then
          execute format('update public.%I set %I = $1 where user_id = $2', tbl, col) using v_name, v_uid;
        end if;
      end loop;
    end if;
  end loop;

  -- Message / request tables commonly use sender/recipient ids rather than user_id.
  if to_regclass('public.player_direct_messages') is not null then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='player_direct_messages' and column_name='from_user_id') then
      update public.player_direct_messages set from_username=v_name where from_user_id=v_uid;
    end if;
  end if;
  if to_regclass('public.friend_requests') is not null then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='friend_requests' and column_name='from_user_id') then
      update public.friend_requests set from_username=v_name where from_user_id=v_uid;
    end if;
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='friend_requests' and column_name='to_user_id') then
      update public.friend_requests set to_username=v_name where to_user_id=v_uid;
    end if;
  end if;
end;
$$;

grant execute on function public.sync_current_username(text) to authenticated;
