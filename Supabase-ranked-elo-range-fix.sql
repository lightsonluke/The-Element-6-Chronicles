-- ELO range rules for ranked fights and ranked sports.
-- Win: 15..25 points (larger reward for beating a higher-rated opponent).
-- Loss: 15..20 points (larger loss when losing to a lower-rated opponent).
-- Run once in Supabase SQL Editor. Safe to rerun.

create or replace function public.report_ranked_match_result(
  p_match_id uuid, p_winner_role text, p_final_frame integer, p_final_checksum text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); m public.online_matches%rowtype; other public.ranked_match_reports%rowtype;
  hr integer; gr integer; he numeric; ge numeric; hg integer; gl integer; caller integer;
begin
  if v_user is null then raise exception 'Sign in first'; end if;
  if p_winner_role not in ('host','guest','draw') or p_final_frame < 0 or length(coalesce(p_final_checksum,'')) < 4 then raise exception 'Invalid result proof'; end if;
  select * into m from public.online_matches where id=p_match_id for update;
  if m.id is null or m.mode <> 'ranked' or m.guest_user_id is null then raise exception 'Ranked match not found'; end if;
  if v_user not in (m.host_user_id,m.guest_user_id) then raise exception 'Not a participant'; end if;
  if m.ranked_status='finalized' then select rating into caller from public.ranked_ratings where user_id=v_user; return jsonb_build_object('finalized',true,'rating',caller,'winner',m.winner); end if;
  insert into public.ranked_match_reports(match_id,user_id,reported_winner,final_frame,final_checksum)
  values(p_match_id,v_user,p_winner_role,p_final_frame,p_final_checksum)
  on conflict(match_id,user_id) do update set reported_winner=excluded.reported_winner,final_frame=excluded.final_frame,final_checksum=excluded.final_checksum,created_at=now();
  select * into other from public.ranked_match_reports where match_id=p_match_id and user_id<>v_user limit 1;
  if other.user_id is null then return jsonb_build_object('finalized',false,'waiting_for_opponent',true); end if;
  if other.reported_winner<>p_winner_role or other.final_frame<>p_final_frame or other.final_checksum<>p_final_checksum then update public.online_matches set ranked_status='disputed' where id=p_match_id; return jsonb_build_object('finalized',false,'disputed',true); end if;
  insert into public.ranked_ratings(user_id) values(m.host_user_id),(m.guest_user_id) on conflict do nothing;
  select rating into hr from public.ranked_ratings where user_id=m.host_user_id for update;
  select rating into gr from public.ranked_ratings where user_id=m.guest_user_id for update;
  he := 1.0/(1.0+power(10.0,(gr-hr)::numeric/400.0)); ge := 1.0-he;
  hg := case when p_winner_role='host' then greatest(15,least(25,15+round(10*(1-he))::integer)) when p_winner_role='guest' then -greatest(15,least(20,15+round(5*he)::integer)) else 0 end;
  gl := case when p_winner_role='guest' then greatest(15,least(25,15+round(10*(1-ge))::integer)) when p_winner_role='host' then -greatest(15,least(20,15+round(5*ge)::integer)) else 0 end;
  update public.ranked_ratings set rating=greatest(0,least(4000,rating+hg)),wins=wins+(p_winner_role='host')::integer,losses=losses+(p_winner_role='guest')::integer,draws=draws+(p_winner_role='draw')::integer,matches_played=matches_played+1,updated_at=now() where user_id=m.host_user_id;
  update public.ranked_ratings set rating=greatest(0,least(4000,rating+gl)),wins=wins+(p_winner_role='guest')::integer,losses=losses+(p_winner_role='host')::integer,draws=draws+(p_winner_role='draw')::integer,matches_played=matches_played+1,updated_at=now() where user_id=m.guest_user_id;
  update public.online_matches set status='finished',winner=p_winner_role,ranked_status='finalized',ranked_finalized_at=now(),updated_at=now() where id=p_match_id;
  select rating into caller from public.ranked_ratings where user_id=v_user;
  return jsonb_build_object('finalized',true,'rating',caller,'winner',p_winner_role,'elo_change',case when v_user=m.host_user_id then abs(hg) else abs(gl) end);
end; $$;

revoke all on function public.report_ranked_match_result(uuid,text,integer,text) from public,anon;
grant execute on function public.report_ranked_match_result(uuid,text,integer,text) to authenticated;
