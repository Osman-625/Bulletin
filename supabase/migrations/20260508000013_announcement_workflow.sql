-- ============================================================
-- Bulletin — Migration 013: Announcement Workflow
-- Adds scheduled publishing, pinned posts, view analytics, and
-- in-app notifications for review decisions.
-- ============================================================

-- ─── announcements: workflow metadata ───────────────────────
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned_until timestamptz,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_announcements_scheduled_publish_at
  ON public.announcements(status, scheduled_publish_at);

CREATE INDEX IF NOT EXISTS idx_announcements_pinned_until
  ON public.announcements(pinned_until);

CREATE INDEX IF NOT EXISTS idx_announcements_view_count
  ON public.announcements(view_count DESC);

-- Public reads should not expose scheduled posts before their publish time.
DROP POLICY IF EXISTS "announcements: public read published" ON public.announcements;
CREATE POLICY "announcements: public read published" ON public.announcements
  FOR SELECT USING (
    status = 'published'
    AND (scheduled_publish_at IS NULL OR scheduled_publish_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Publishers need to be able to revise rejected work before submitting again.
DROP POLICY IF EXISTS "announcements: publisher update own" ON public.announcements;
CREATE POLICY "announcements: publisher update own" ON public.announcements
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND status IN ('draft', 'submitted', 'rejected')
  )
  WITH CHECK (
    author_id = auth.uid()
    AND status IN ('draft', 'submitted', 'rejected')
  );

-- Public-safe RPC used by the announcement detail page.
CREATE OR REPLACE FUNCTION public.increment_announcement_view(p_announcement_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.announcements
  SET view_count = view_count + 1
  WHERE id = p_announcement_id
    AND status = 'published'
    AND (scheduled_publish_at IS NULL OR scheduled_publish_at <= now())
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_announcement_view(uuid) TO anon, authenticated;

-- ─── notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (
    type IN (
      'announcement_submitted',
      'announcement_approved',
      'announcement_rejected'
    )
  ),
  title           text NOT NULL,
  body            text,
  href            text,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON public.notifications(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(recipient_id, read_at)
  WHERE read_at IS NULL;

CREATE POLICY "notifications: read own" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "notifications: update own read state" ON public.notifications
  FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());
