-- Element 6: Rock Climbing leaderboard per track
-- Run after the existing element6_world_scores table/RPC exists.

begin;

alter table public.element6_world_scores drop constraint if exists element6_world_scores_user_id_mode_key;
drop index if exists element6_world_scores_user_id_mode_track_idx;
create unique index if not exists element6_world_scores_user_id_mode_track_idx
on public.element6_world_scores (user_id, mode, ((coalesce(score_meta->>'track_id', '0'))));

create or replace function public.submit_element6_world_score(p_mode text, p_score numeric, p_meta jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid(); v_username text; v_existing numeric; v_should_replace boolean; v_rank bigint; v_track text := coalesce(p_meta->>'track_id', '0');
begin
 if v_user is null then raise exception 'Sign in first'; end if;
 if p_mode not in ('parkour','rockclimb','zipline','honored_bot') then raise exception 'Unknown leaderboard mode'; end if;
 select coalesce(nullif(trim(pp.username),''),nullif(trim(au.raw_user_meta_data->>'username'),''),nullif(trim(au.raw_user_meta_data->>'full_name'),''),nullif(split_part(au.email,'@',1),''),'Player') into v_username from auth.users au left join public.player_profiles pp on pp.user_id=au.id where au.id=v_user;
 v_username:=coalesce(v_username,'Player');
 select score into v_existing from public.element6_world_scores where user_id=v_user and mode=p_mode and coalesce(score_meta->>'track_id','0')=v_track limit 1;
 v_should_replace:=v_existing is null or (p_mode='rockclimb' and p_score<v_existing) or (p_mode<>'rockclimb' and p_score>v_existing);
 if v_should_replace then
   insert into public.element6_world_scores(user_id,username,mode,score,score_meta,updated_at) values(v_user,v_username,p_mode,p_score,coalesce(p_meta,'{}'::jsonb),now())
   on conflict (user_id,mode,((coalesce(score_meta->>'track_id','0')))) do update set username=excluded.username,score=excluded.score,score_meta=excluded.score_meta,updated_at=now();
 end if;
 select count(*)+1 into v_rank from public.element6_world_scores s where s.mode=p_mode and coalesce(s.score_meta->>'track_id','0')=v_track and ((p_mode='rockclimb' and s.score<coalesce((select score from public.element6_world_scores where user_id=v_user and mode=p_mode and coalesce(score_meta->>'track_id','0')=v_track),p_score)) or (p_mode<>'rockclimb' and s.score>coalesce((select score from public.element6_world_scores where user_id=v_user and mode=p_mode and coalesce(score_meta->>'track_id','0')=v_track),p_score)));
 return jsonb_build_object('updated',v_should_replace,'mode',p_mode,'track_id',v_track,'score',coalesce(v_existing,p_score),'rank',coalesce(v_rank,1),'user_id',v_user);
end; $$;

grant execute on function public.submit_element6_world_score(text,numeric,jsonb) to authenticated;
commit;
