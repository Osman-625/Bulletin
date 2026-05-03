-- ============================================================
-- Bulletin — Migration 008: Post Status Enum Extensions
-- Must run BEFORE role_system migration so new enum values
-- are committed before they are referenced in RLS policies.
-- ============================================================

ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'rejected';
