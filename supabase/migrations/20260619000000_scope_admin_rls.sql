-- Scope admin database access to assigned organizations.
--
-- App-layer authorization treats `admin` as org-scoped. These policies make
-- RLS match that boundary so an authenticated admin cannot bypass server
-- actions and manage platform-wide rows through the Data API.

create or replace function public.current_user_admin_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public, pg_catalog
as $$
  select membership.organization_id
  from public.organization_members as membership
  where membership.user_id = auth.uid()
    and membership.member_role = 'admin';
$$;

revoke execute on function public.current_user_admin_org_ids() from public, anon;
grant execute on function public.current_user_admin_org_ids() to authenticated, service_role;

drop policy if exists "users: admins read all" on public.users;
drop policy if exists "users: platform read all" on public.users;
drop policy if exists "users: admin read assigned" on public.users;

create policy "users: platform read all" on public.users
  for select
  to authenticated
  using (public.current_user_role() in ('owner', 'super_admin'));

create policy "users: admin read assigned" on public.users
  for select
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and role in ('admin', 'publisher')
    and exists (
      select 1
      from public.organization_members as target_membership
      where target_membership.user_id = users.id
        and target_membership.organization_id in (select public.current_user_admin_org_ids())
    )
  );

drop policy if exists "orgs: admin full" on public.organizations;
drop policy if exists "orgs: platform full" on public.organizations;
drop policy if exists "orgs: admin manage assigned" on public.organizations;

create policy "orgs: platform full" on public.organizations
  for all
  to authenticated
  using (public.current_user_role() in ('owner', 'super_admin'))
  with check (public.current_user_role() in ('owner', 'super_admin'));

create policy "orgs: admin manage assigned" on public.organizations
  for all
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and id in (select public.current_user_admin_org_ids())
  )
  with check (
    public.current_user_role() = 'admin'
    and (
      id in (select public.current_user_admin_org_ids())
      or owner_id = auth.uid()
    )
  );

drop policy if exists "org_members: read" on public.organization_members;
drop policy if exists "org_members: admin manage" on public.organization_members;
drop policy if exists "org_members: platform manage" on public.organization_members;
drop policy if exists "org_members: admin manage assigned" on public.organization_members;

create policy "org_members: read" on public.organization_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() in ('owner', 'super_admin')
    or organization_id in (select public.current_user_admin_org_ids())
  );

create policy "org_members: platform manage" on public.organization_members
  for all
  to authenticated
  using (public.current_user_role() in ('owner', 'super_admin'))
  with check (public.current_user_role() in ('owner', 'super_admin'));

create policy "org_members: admin manage assigned" on public.organization_members
  for all
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and organization_id in (select public.current_user_admin_org_ids())
  )
  with check (
    public.current_user_role() = 'admin'
    and (
      organization_id in (select public.current_user_admin_org_ids())
      or (
        user_id = auth.uid()
        and member_role = 'admin'
        and exists (
          select 1
          from public.organizations
          where id = organization_members.organization_id
            and owner_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "announcements: admin full" on public.announcements;
drop policy if exists "announcements: platform full" on public.announcements;
drop policy if exists "announcements: admin manage assigned orgs" on public.announcements;

create policy "announcements: platform full" on public.announcements
  for all
  to authenticated
  using (public.current_user_role() in ('owner', 'super_admin'))
  with check (public.current_user_role() in ('owner', 'super_admin'));

create policy "announcements: admin manage assigned orgs" on public.announcements
  for all
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and organization_id in (select public.current_user_admin_org_ids())
  )
  with check (
    public.current_user_role() = 'admin'
    and organization_id in (select public.current_user_admin_org_ids())
  );

drop policy if exists "invitations: admin manage" on public.invitations;
drop policy if exists "invitations: platform manage" on public.invitations;
drop policy if exists "invitations: admin manage assigned publisher invites" on public.invitations;

create policy "invitations: platform manage" on public.invitations
  for all
  to authenticated
  using (public.current_user_role() in ('owner', 'super_admin'))
  with check (public.current_user_role() in ('owner', 'super_admin'));

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

drop policy if exists "reviews: admin full" on public.announcement_reviews;
drop policy if exists "reviews: platform full" on public.announcement_reviews;
drop policy if exists "reviews: admin manage assigned orgs" on public.announcement_reviews;

create policy "reviews: platform full" on public.announcement_reviews
  for all
  to authenticated
  using (public.current_user_role() in ('owner', 'super_admin'))
  with check (public.current_user_role() in ('owner', 'super_admin'));

create policy "reviews: admin manage assigned orgs" on public.announcement_reviews
  for all
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and exists (
      select 1
      from public.announcements
      where id = announcement_reviews.announcement_id
        and organization_id in (select public.current_user_admin_org_ids())
    )
  )
  with check (
    public.current_user_role() = 'admin'
    and exists (
      select 1
      from public.announcements
      where id = announcement_reviews.announcement_id
        and organization_id in (select public.current_user_admin_org_ids())
    )
  );

drop policy if exists "org_cat_perms: admin manage" on public.org_category_permissions;
drop policy if exists "org_cat_perms: platform manage" on public.org_category_permissions;
drop policy if exists "org_cat_perms: admin manage assigned" on public.org_category_permissions;

create policy "org_cat_perms: platform manage" on public.org_category_permissions
  for all
  to authenticated
  using (public.current_user_role() in ('owner', 'super_admin'))
  with check (public.current_user_role() in ('owner', 'super_admin'));

create policy "org_cat_perms: admin manage assigned" on public.org_category_permissions
  for all
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and org_id in (select public.current_user_admin_org_ids())
  )
  with check (
    public.current_user_role() = 'admin'
    and org_id in (select public.current_user_admin_org_ids())
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
        and (storage.foldername(name))[2] in (select organization_id::text from public.current_user_admin_org_ids() as admin_orgs(organization_id))
      )
    )
  );
