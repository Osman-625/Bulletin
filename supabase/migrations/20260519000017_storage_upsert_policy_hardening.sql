-- ============================================================
-- Bulletin — Migration 017: Banner Storage Upsert Policy Hardening
-- Keeps update/upsert and delete behavior aligned with the
-- upload path convention: {user_id}/{organization_id}/{filename}
-- ============================================================

drop policy if exists "banners: owner manage" on storage.objects;
drop policy if exists "banners: owner delete" on storage.objects;

create policy "banners: owner manage" on storage.objects
  for update using (
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
  )
  with check (
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

create policy "banners: owner delete" on storage.objects
  for delete using (
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
