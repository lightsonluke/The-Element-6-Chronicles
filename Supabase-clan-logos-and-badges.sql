-- Element 6 — Clan logo storage + Clan Badge support
-- Run after Supabase-clans.sql.
-- Stores uploaded clan logos in a public Supabase Storage bucket and keeps the
-- URL in element6_clans.icon_url. The client uses clan_badge:<clan_id> as the
-- dynamic accessory id; the badge artwork is the current clan logo.

begin;

insert into storage.buckets (id, name, public)
values ('clan-logos', 'clan-logos', true)
on conflict (id) do update set public = true;

-- Public read: clan logos are intentionally public because clan cards and
-- multiplayer cosmetics need to render them without signed URLs.
drop policy if exists element6_clan_logos_public_read on storage.objects;
create policy element6_clan_logos_public_read
on storage.objects for select
using (bucket_id = 'clan-logos');

-- Uploads are scoped to the authenticated user's folder: <user_id>/<clan_id>/file.
drop policy if exists element6_clan_logos_insert on storage.objects;
create policy element6_clan_logos_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'clan-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Owners may replace/delete files in their own folder.
drop policy if exists element6_clan_logos_update on storage.objects;
create policy element6_clan_logos_update
on storage.objects for update to authenticated
using (
  bucket_id = 'clan-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'clan-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists element6_clan_logos_delete on storage.objects;
create policy element6_clan_logos_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'clan-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
