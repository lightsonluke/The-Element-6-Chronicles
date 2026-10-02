-- Element 6 focused fixes: World Stage likes, tournament duplicate rows, badge uploads.
begin;

-- One monthly standing per clan and month (the existing scores table already uses this key).
-- Repair duplicate legacy rows deterministically before enforcing uniqueness.
with ranked as (
  select ctid, row_number() over (
    partition by month_key, clan_id
    order by coalesce(tournament_points,0) desc, coalesce(monthly_xp,0) desc, coalesce(rank,2147483647) asc
  ) as rn
  from public.element6_clan_tournament_scores
)
delete from public.element6_clan_tournament_scores s using ranked r
where s.ctid = r.ctid and r.rn > 1;
create unique index if not exists element6_clan_tournament_scores_month_clan_uq
  on public.element6_clan_tournament_scores(month_key, clan_id);

-- Like state is tied to the authenticated account, not local storage. Repeated taps toggle.
create or replace function public.element6_toggle_world_stage_like(p_stage_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid := auth.uid(); v_row public.community_stages%rowtype; v_liked boolean;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select * into v_row from public.community_stages where id=p_stage_id and not is_private and not hidden for update;
  if not found then raise exception 'Public stage not found'; end if;
  v_liked := coalesce(v_row.liked_by,'[]'::jsonb) ? v_uid::text;
  if v_liked then
    update public.community_stages
      set liked_by = coalesce(liked_by,'[]'::jsonb) - v_uid::text,
          likes = greatest(0, likes - 1), updated_date = updated_date
      where id=p_stage_id returning * into v_row;
    v_liked := false;
  else
    update public.community_stages
      set liked_by = coalesce(liked_by,'[]'::jsonb) || to_jsonb(v_uid::text),
          likes = likes + 1
      where id=p_stage_id returning * into v_row;
    v_liked := true;
  end if;
  return jsonb_build_object('id',v_row.id,'likes',v_row.likes,'liked',v_liked);
end; $$;
revoke all on function public.element6_toggle_world_stage_like(uuid) from public, anon;
grant execute on function public.element6_toggle_world_stage_like(uuid) to authenticated;

-- Ensure the bucket and policies used by the client-side badge upload exist.
insert into storage.buckets(id,name,public)
values ('clan-logos','clan-logos',true)
on conflict(id) do update set public=true;
drop policy if exists element6_clan_logos_public_read on storage.objects;
create policy element6_clan_logos_public_read on storage.objects for select using (bucket_id='clan-logos');
drop policy if exists element6_clan_logos_insert on storage.objects;
create policy element6_clan_logos_insert on storage.objects for insert to authenticated
with check (bucket_id='clan-logos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists element6_clan_logos_update on storage.objects;
create policy element6_clan_logos_update on storage.objects for update to authenticated
using (bucket_id='clan-logos' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='clan-logos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists element6_clan_logos_delete on storage.objects;
create policy element6_clan_logos_delete on storage.objects for delete to authenticated
using (bucket_id='clan-logos' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
