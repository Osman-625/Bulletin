-- ============================================================
-- Bulletin — Migration 009: Role System
-- Adds: submitted/rejected statuses, org_member_role, review tables,
--       org_category_permissions, force_password_change, invite org_ids
-- ============================================================

-- ─── New enum: org_member_role ──────────────────────────────
CREATE TYPE public.org_member_role AS ENUM ('publisher', 'admin');

-- ─── organization_members: add member_role ──────────────────
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS member_role public.org_member_role NOT NULL DEFAULT 'publisher';

-- ─── users: add force_password_change ───────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS force_password_change boolean NOT NULL DEFAULT false;

-- ─── announcements: add rejection_comment ───────────────────
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS rejection_comment text;

-- ─── invitations: add org_ids + member_role ─────────────────
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS org_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS member_role public.org_member_role NOT NULL DEFAULT 'publisher';

-- ─── announcement_reviews ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcement_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  reviewer_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action          text NOT NULL CHECK (action IN ('approved', 'rejected')),
  comment         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcement_reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reviews_announcement ON public.announcement_reviews(announcement_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer     ON public.announcement_reviews(reviewer_id);

CREATE POLICY "reviews: admin full" ON public.announcement_reviews
  FOR ALL USING (public.current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "reviews: publisher read own" ON public.announcement_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id AND a.author_id = auth.uid()
    )
  );

-- ─── org_category_permissions ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_category_permissions (
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  granted_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, category_id)
);

ALTER TABLE public.org_category_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_cat_perms: read" ON public.org_category_permissions
  FOR SELECT USING (true);

CREATE POLICY "org_cat_perms: admin manage" ON public.org_category_permissions
  FOR ALL USING (public.current_user_role() IN ('admin', 'super_admin'));

-- ─── Update announcements RLS ────────────────────────────────

DROP POLICY IF EXISTS "announcements: publisher create draft"      ON public.announcements;
DROP POLICY IF EXISTS "announcements: publisher manage own drafts" ON public.announcements;
DROP POLICY IF EXISTS "announcements: publisher delete own drafts" ON public.announcements;

-- Publishers can create announcements for their org
CREATE POLICY "announcements: publisher create" ON public.announcements
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = announcements.organization_id
        AND user_id = auth.uid()
    )
    AND status IN ('draft', 'submitted')
  );

-- Publishers can edit their own draft/submitted/rejected announcements
CREATE POLICY "announcements: publisher update own" ON public.announcements
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND status IN ('draft', 'submitted', 'rejected')
  )
  WITH CHECK (
    author_id = auth.uid()
    AND status IN ('draft', 'submitted')
  );

-- Publishers can delete their own drafts only
CREATE POLICY "announcements: publisher delete draft" ON public.announcements
  FOR DELETE USING (
    author_id = auth.uid()
    AND status = 'draft'
  );
