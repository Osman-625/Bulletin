-- ============================================================
-- Bulletin — Migration 010: Owner Role
-- Adds: owner to user_role enum (highest privilege tier)
-- Updates: all RLS policies that gated on admin/super_admin to
--          also include owner.
-- Note:  The owner account is created post-migration via:
--        UPDATE public.users SET role = 'owner'
--        WHERE email = '<owner-email>';
-- ============================================================

-- ─── 1. Add owner to user_role enum ────────────────────────
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'owner';

-- ─── 2. Update current_user_role() to recognise owner ──────
-- (No change needed — it just returns the stored role value.)

-- ─── 3. RLS: users ──────────────────────────────────────────

-- users: update own — owner must not self-demote through the
-- regular update path; role changes happen via service client.
DROP POLICY IF EXISTS "users: update own" ON public.users;
CREATE POLICY "users: update own" ON public.users
  FOR UPDATE
  USING  (id = auth.uid())
  WITH CHECK (
    id   = auth.uid()
    AND  role = public.current_user_role()
  );

-- ─── 4. RLS: organizations ──────────────────────────────────

DROP POLICY IF EXISTS "orgs: admin full" ON public.organizations;
CREATE POLICY "orgs: admin full" ON public.organizations
  FOR ALL USING (
    public.current_user_role() IN ('admin', 'super_admin', 'owner')
  );

-- ─── 5. RLS: organization_members ───────────────────────────

DROP POLICY IF EXISTS "org_members: read" ON public.organization_members;
CREATE POLICY "org_members: read" ON public.organization_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.current_user_role() IN ('admin', 'super_admin', 'owner')
  );

DROP POLICY IF EXISTS "org_members: admin manage" ON public.organization_members;
CREATE POLICY "org_members: admin manage" ON public.organization_members
  FOR ALL USING (
    public.current_user_role() IN ('admin', 'super_admin', 'owner')
  );

-- ─── 6. RLS: categories ─────────────────────────────────────

DROP POLICY IF EXISTS "categories: admin full" ON public.categories;
CREATE POLICY "categories: admin full" ON public.categories
  FOR ALL USING (
    public.current_user_role() IN ('admin', 'super_admin', 'owner')
  );

-- ─── 7. RLS: announcements ──────────────────────────────────

DROP POLICY IF EXISTS "announcements: admin full" ON public.announcements;
CREATE POLICY "announcements: admin full" ON public.announcements
  FOR ALL USING (
    public.current_user_role() IN ('admin', 'super_admin', 'owner')
  );

-- ─── 8. RLS: invitations ────────────────────────────────────

DROP POLICY IF EXISTS "invitations: admin manage" ON public.invitations;
CREATE POLICY "invitations: admin manage" ON public.invitations
  FOR ALL USING (
    public.current_user_role() IN ('admin', 'super_admin', 'owner')
  );

-- ─── 9. RLS: audit_log ──────────────────────────────────────

DROP POLICY IF EXISTS "audit_log: admin read" ON public.audit_log;
CREATE POLICY "audit_log: admin read" ON public.audit_log
  FOR SELECT USING (
    public.current_user_role() IN ('admin', 'super_admin', 'owner')
  );

-- ─── 10. RLS: announcement_reviews ──────────────────────────

DROP POLICY IF EXISTS "reviews: admin full" ON public.announcement_reviews;
CREATE POLICY "reviews: admin full" ON public.announcement_reviews
  FOR ALL USING (
    public.current_user_role() IN ('admin', 'super_admin', 'owner')
  );

-- ─── 11. RLS: org_category_permissions ──────────────────────

DROP POLICY IF EXISTS "org_cat_perms: admin manage" ON public.org_category_permissions;
CREATE POLICY "org_cat_perms: admin manage" ON public.org_category_permissions
  FOR ALL USING (
    public.current_user_role() IN ('admin', 'super_admin', 'owner')
  );

-- ─── 12. Storage: banners admin delete ──────────────────────

DROP POLICY IF EXISTS "banners: admin delete" ON storage.objects;
CREATE POLICY "banners: admin delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'banner-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'owner')
    )
  );
