-- Announcement urgency and typography controls.

DO $$
BEGIN
  CREATE TYPE public.announcement_urgency AS ENUM ('normal', 'important', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.announcement_display_font AS ENUM ('editorial', 'clean');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.announcement_display_size AS ENUM ('compact', 'standard', 'large');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS urgency public.announcement_urgency NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS display_font public.announcement_display_font NOT NULL DEFAULT 'editorial',
  ADD COLUMN IF NOT EXISTS display_size public.announcement_display_size NOT NULL DEFAULT 'standard';

CREATE INDEX IF NOT EXISTS idx_announcements_urgency ON public.announcements(urgency);

COMMENT ON COLUMN public.announcements.urgency IS 'Editorial urgency shown on public cards and detail pages.';
COMMENT ON COLUMN public.announcements.display_font IS 'Announcement title font treatment for public presentation.';
COMMENT ON COLUMN public.announcements.display_size IS 'Announcement public text sizing treatment.';
