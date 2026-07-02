-- Finalize admin-scoped RLS for environments that applied the preceding
-- migration before its policy roles and storage rules were completed.

revoke execute on function public.current_user_admin_org_ids() from public, anon;
grant execute on function public.current_user_admin_org_ids() to authenticated, service_role;

alter policy "users: platform read all" on public.users to authenticated;
alter policy "users: admin read assigned" on public.users to authenticated;
alter policy "orgs: platform full" on public.organizations to authenticated;
alter policy "orgs: admin manage assigned" on public.organizations to authenticated;
alter policy "org_members: read" on public.organization_members to authenticated;
alter policy "org_members: platform manage" on public.organization_members to authenticated;
alter policy "org_members: admin manage assigned" on public.organization_members to authenticated;
alter policy "announcements: platform full" on public.announcements to authenticated;
alter policy "announcements: admin manage assigned orgs" on public.announcements to authenticated;
alter policy "invitations: platform manage" on public.invitations to authenticated;
alter policy "reviews: platform full" on public.announcement_reviews to authenticated;
alter policy "reviews: admin manage assigned orgs" on public.announcement_reviews to authenticated;
alter policy "org_cat_perms: platform manage" on public.org_category_permissions to authenticated;
alter policy "org_cat_perms: admin manage assigned" on public.org_category_permissions to authenticated;

drop policy if exists "invitations: admin manage assigned publisher invites" on public.invitations;

create policy "invitations: admin manage assigned publisher invites" on public.invitations
  for all
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and role = 'publisher'
    and cardinality(org_ids) > 0
    and org_ids <@ array(select public.current_user_admin_org_ids())
  )
  with check (
    public.current_user_role() = 'admin'
    and role = 'publisher'
    and cardinality(org_ids) > 0
    and org_ids <@ array(select public.current_user_admin_org_ids())
  );

drop policy if exists "audit_log: admin read" on public.audit_log;
drop policy if exists "audit_log: platform read" on public.audit_log;

create policy "audit_log: platform read" on public.audit_log
  for select
  to authenticated
  using (public.current_user_role() in ('owner', 'super_admin'));

drop policy if exists "banners: admin delete" on storage.objects;
drop policy if exists "banners: publisher upload" on storage.objects;
drop policy if exists "banners: owner manage" on storage.objects;
drop policy if exists "banners: owner delete" on storage.objects;
drop policy if exists "banners: privileged delete" on storage.objects;

create policy "banners: publisher upload" on storage.objects
  for insert
  to authenticated
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
      or public.current_user_role() in ('owner', 'super_admin')
    )
  );

create policy "banners: owner manage" on storage.objects
  for update
  to authenticated
  using (
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
      or public.current_user_role() in ('owner', 'super_admin')
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
      or public.current_user_role() in ('owner', 'super_admin')
    )
  );

create policy "banners: owner delete" on storage.objects
  for delete
  to authenticated
  using (
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
