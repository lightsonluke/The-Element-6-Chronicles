-- Ranked sport ELO: 15..25 for wins, 15..20 for losses.
-- Run after the existing online sports setup.
create or replace function public.report_online_sport_result(p_match_id uuid,p_winner_team smallint,p_final_frame integer,p_final_checksum text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare m public.online_sport_matches%rowtype; u uuid:=auth.uid(); expected integer; reports integer; disagreements integer; own_team smallint; ranked boolean; player record; own_rating integer; opponent_rating integer; chance numeric; delta integer;
begin
 if u is null then raise exception 'Sign in first'; end if;
 if p_winner_team not in (1,2) or p_final_frame<0 or length(coalesce(p_final_checksum,''))<4 then raise exception 'Invalid result proof'; end if;
 select * into m from public.online_sport_matches where id=p_match_id for update;
 if m.id is null then raise exception 'Match not found'; end if;
 if not exists(select 1 from public.online_sport_players where match_id=p_match_id and user_id=u) then raise exception 'Not a participant'; end if;
 if m.result_status='finalized' then select team into own_team from public.online_sport_players where match_id=p_match_id and user_id=u; return jsonb_build_object('finalized',true,'winnerTeam',m.winner_team,'won',own_team=m.winner_team); end if;
 insert into public.online_sport_result_reports(match_id,user_id,winner_team,final_frame,final_checksum) values(p_match_id,u,p_winner_team,p_final_frame,p_final_checksum)
 on conflict(match_id,user_id) do update set winner_team=excluded.winner_team,final_frame=excluded.final_frame,final_checksum=excluded.final_checksum,created_at=now();
 select count(*) into expected from public.online_sport_players where match_id=p_match_id;
 select count(*) into reports from public.online_sport_result_reports where match_id=p_match_id;
 if reports<expected then return jsonb_build_object('finalized',false,'waitingForPlayers',expected-reports); end if;
 select count(*) into disagreements from public.online_sport_result_reports where match_id=p_match_id and (winner_team<>p_winner_team or final_frame<>p_final_frame or final_checksum<>p_final_checksum);
 if disagreements>0 then update public.online_sport_matches set status='disputed',result_status='disputed',updated_at=now() where id=p_match_id; return jsonb_build_object('finalized',false,'disputed',true); end if;
 ranked:=m.mode in ('soccer_ranked','volleyball_1v1_ranked','dodgeball_ranked');
 if ranked then
   insert into public.online_sport_ratings(user_id,mode) select user_id,m.mode from public.online_sport_players where match_id=p_match_id on conflict(user_id,mode) do nothing;
   for player in select p.user_id,p.team from public.online_sport_players p where p.match_id=p_match_id loop
     select rating into own_rating from public.online_sport_ratings where user_id=player.user_id and mode=m.mode for update;
     select coalesce(avg(r.rating),1000)::integer into opponent_rating from public.online_sport_ratings r join public.online_sport_players op on op.user_id=r.user_id and op.match_id=p_match_id where r.mode=m.mode and op.team<>player.team;
     chance:=1.0/(1.0+power(10.0,(opponent_rating-own_rating)::numeric/400.0));
     if player.team=p_winner_team then delta:=greatest(15,least(25,15+round(10*(1-chance))::integer)); else delta:=-greatest(15,least(20,15+round(5*(1-chance))::integer)); end if;
     update public.online_sport_ratings set rating=greatest(0,least(4000,rating+delta)),wins=wins+(player.team=p_winner_team)::integer,losses=losses+(player.team<>p_winner_team)::integer,matches_played=matches_played+1,updated_at=now() where user_id=player.user_id and mode=m.mode;
   end loop;
 end if;
 update public.online_sport_matches set status='finished',winner_team=p_winner_team,result_status='finalized',updated_at=now() where id=p_match_id;
 select team into own_team from public.online_sport_players where match_id=p_match_id and user_id=u;
 return jsonb_build_object('finalized',true,'winnerTeam',p_winner_team,'won',own_team=p_winner_team);
end; $$;
revoke all on function public.report_online_sport_result(uuid,smallint,integer,text) from public,anon;
grant execute on function public.report_online_sport_result(uuid,smallint,integer,text) to authenticated;
