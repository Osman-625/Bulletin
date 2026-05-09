-- ============================================================
-- Bulletin — Migration 014: Password Reset Requests
-- Adds a governed forgot-password queue for super admins.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled')),
  fulfilled_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  fulfilled_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status_created
  ON public.password_reset_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_pending
  ON public.password_reset_requests(user_id)
  WHERE status = 'pending';

CREATE POLICY "password_reset_requests: super admins manage" ON public.password_reset_requests
  FOR ALL USING (public.current_user_role() IN ('owner', 'super_admin'))
  WITH CHECK (public.current_user_role() IN ('owner', 'super_admin'));

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'announcement_submitted',
      'announcement_approved',
      'announcement_rejected',
      'password_reset_requested'
    )
  );
