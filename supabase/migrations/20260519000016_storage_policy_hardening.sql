-- ============================================================
-- Bulletin — Migration 016: Banner Storage Policy Hardening
-- Ensures banner uploads are scoped to the authenticated user
-- folder and to an organization the actor can publish for.
-- Current upload path: {user_id}/{organization_id}/{filename}
-- ============================================================

drop policy if exists "banners: publisher upload" on storage.objects;

create policy "banners: publisher upload" on storage.objects
  for insert with check (
    bucket_id = 'banner-images'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
    and (storage.foldername(name))[2] is not null
    and (
      exists (
        select 1
        from public.organization_members
        where user_id = auth.uid()
          and organization_id::text = (storage.foldername(name))[2]
      )
      or public.current_user_role() in ('admin', 'super_admin', 'owner')
    )
  );
