-- Replace deprecated storage role-helper predicates.
--
-- The policies already target `to authenticated`; these recreated policies keep
-- the same bucket, folder ownership, organization membership, and privileged
-- role checks while removing redundant authenticated-role helper checks.

drop policy if exists "banners: publisher upload" on storage.objects;
drop policy if exists "banners: owner manage" on storage.objects;
drop policy if exists "banners: owner delete" on storage.objects;
drop policy if exists "banners: privileged delete" on storage.objects;

create policy "banners: publisher upload" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'banner-images'
    and auth.uid()::text = (storage.foldername(name))[1]
    and (storage.foldername(name))[2] is not null
    and (
      exists (
        select 1
        from public.organization_members
        where user_id = auth.uid()
          and organization_id::text = (storage.foldername(name))[2]
      )
      or public.current_user_role() in ('owner', 'super_admin')
    )
  );

create policy "banners: owner manage" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'banner-images'
    and auth.uid()::text = (storage.foldername(name))[1]
    and (storage.foldername(name))[2] is not null
    and (
      exists (
        select 1
        from public.organization_members
        where user_id = auth.uid()
          and organization_id::text = (storage.foldername(name))[2]
      )
      or public.current_user_role() in ('owner', 'super_admin')
    )
  )
  with check (
    bucket_id = 'banner-images'
    and auth.uid()::text = (storage.foldername(name))[1]
    and (storage.foldername(name))[2] is not null
    and (
      exists (
        select 1
        from public.organization_members
        where user_id = auth.uid()
          and organization_id::text = (storage.foldername(name))[2]
      )
      or public.current_user_role() in ('owner', 'super_admin')
    )
  );

create policy "banners: owner delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'banner-images'
    and auth.uid()::text = (storage.foldername(name))[1]
    and (storage.foldername(name))[2] is not null
    and (
      exists (
        select 1
        from public.organization_members
        where user_id = auth.uid()
          and organization_id::text = (storage.foldername(name))[2]
      )
      or public.current_user_role() in ('owner', 'super_admin')
    )
  );

create policy "banners: privileged delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'banner-images'
    and (storage.foldername(name))[2] is not null
    and (
      public.current_user_role() in ('owner', 'super_admin')
      or (
        public.current_user_role() = 'admin'
        and (storage.foldername(name))[2] in (
          select organization_id::text
          from public.current_user_admin_org_ids() as admin_orgs(organization_id)
        )
      )
    )
  );
