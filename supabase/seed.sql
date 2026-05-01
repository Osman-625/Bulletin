-- ============================================================
-- Bulletin — Seed Data (design & layout testing)
-- Run in Supabase SQL Editor with service role
--
-- Test credentials
--   Email    : test@bulletin.inti.edu.my
--   Password : BulletinTest2024
-- ============================================================

DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_org_id  uuid := '00000000-0000-0000-0000-000000000002';

  -- category IDs (fetched by slug)
  cat_academic     uuid;
  cat_events       uuid;
  cat_sports       uuid;
  cat_student_life uuid;
  cat_opps         uuid;
  cat_general      uuid;
BEGIN

  -- ── 1. Auth user ──────────────────────────────────────────

  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'test@bulletin.inti.edu.my',
    crypt('BulletinTest2024', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}', '{}',
    now(), now(),
    '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_user_id, v_user_id,
    json_build_object('sub', v_user_id::text, 'email', 'test@bulletin.inti.edu.my'),
    'email', 'test@bulletin.inti.edu.my',
    now(), now(), now()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- ── 2. Public user profile ────────────────────────────────

  INSERT INTO public.users (id, email, display_name, role)
  VALUES (v_user_id, 'test@bulletin.inti.edu.my', 'Test Publisher', 'publisher')
  ON CONFLICT (id) DO NOTHING;

  -- ── 3. Organization ───────────────────────────────────────

  INSERT INTO public.organizations (
    id, name, slug, description, status, owner_id, approved_by, approved_at
  ) VALUES (
    v_org_id,
    'INTI Student Affairs',
    'inti-student-affairs',
    'Official student affairs office of INTI International University.',
    'approved',
    v_user_id,
    v_user_id,
    now()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.organization_members (organization_id, user_id)
  VALUES (v_org_id, v_user_id)
  ON CONFLICT DO NOTHING;

  -- ── 4. Resolve category IDs ───────────────────────────────

  SELECT id INTO cat_academic     FROM public.categories WHERE slug = 'academic';
  SELECT id INTO cat_events       FROM public.categories WHERE slug = 'events';
  SELECT id INTO cat_sports       FROM public.categories WHERE slug = 'sports';
  SELECT id INTO cat_student_life FROM public.categories WHERE slug = 'student-life';
  SELECT id INTO cat_opps         FROM public.categories WHERE slug = 'opportunities';
  SELECT id INTO cat_general      FROM public.categories WHERE slug = 'general';

  -- ── 5. Announcements ──────────────────────────────────────

  -- PUBLISHED ------------------------------------------------

  INSERT INTO public.announcements (
    title, body, status, category_id, organization_id, author_id,
    registration_link, published_at, expires_at
  ) VALUES (
    'INTI Convocation Ceremony 2025 — Registration Now Open',
    E'## Congratulations, Graduating Class of 2025!\n\nWe are pleased to announce that online registration for the **INTI Convocation Ceremony 2025** is now open.\n\n### Key Dates\n\n- **Registration closes:** 30 May 2025\n- **Gown fitting:** 10–12 June 2025\n- **Ceremony day:** 28 June 2025\n\n### What You Need to Do\n\n1. Log in to the Student Portal\n2. Navigate to *Convocation > Register*\n3. Select your session and confirm attendance\n4. Pay the gown deposit (RM 50, refundable)\n\nGuests are limited to **2 per graduate**. Additional guest tickets may be purchased at the counter from 1 June 2025, subject to availability.\n\nFor enquiries, contact the Registrar''s Office at **registrar@newinti.edu.my**.',
    'published',
    cat_events,
    v_org_id,
    v_user_id,
    'https://portal.newinti.edu.my/convocation',
    now() - interval '3 days',
    now() + interval '27 days'
  );

  INSERT INTO public.announcements (
    title, body, status, category_id, organization_id, author_id,
    published_at, expires_at
  ) VALUES (
    'Mid-Semester Examination Schedule — Semester 2, 2024/25',
    E'## Mid-Semester Exams: 19–23 May 2025\n\nThe timetable for mid-semester examinations has been finalised and uploaded to the Student Portal.\n\n### General Guidelines\n\n- Arrive at least **15 minutes** before your scheduled time.\n- Bring your **student ID card** — no entry without it.\n- Only approved calculators are permitted in quantitative papers.\n- Mobile phones must be switched off and placed in your bag at the front of the hall.\n\n### Special Arrangements\n\nStudents with approved special accommodations (OKU status, medical letters) should contact the Examinations Unit by **12 May 2025** to confirm seating.\n\n### Results\n\nResults will be released via the portal within **10 working days** of the last exam date.',
    'published',
    cat_academic,
    v_org_id,
    v_user_id,
    now() - interval '1 day',
    now() + interval '29 days'
  );

  INSERT INTO public.announcements (
    title, body, status, category_id, organization_id, author_id,
    registration_link, published_at, expires_at
  ) VALUES (
    'INTI Inter-College Futsal Championship 2025',
    E'## Calling All Futsal Teams!\n\nThe **INTI Inter-College Futsal Championship** returns for its 8th edition. Open to all currently enrolled students.\n\n### Tournament Details\n\n| | |\n|---|---|\n| **Format** | 5-a-side, round-robin + knockouts |\n| **Date** | 7–8 June 2025 |\n| **Venue** | INTI Sports Complex, Court A & B |\n| **Registration fee** | RM 80 per team |\n| **Max teams** | 16 (first come, first served) |\n\n### Prizes\n\n- Champion: RM 1,000 + trophy\n- 1st Runner-up: RM 500 + trophy\n- Best Player (MVP): RM 150 voucher\n\nRegister your team of 5–8 players before slots run out.',
    'published',
    cat_sports,
    v_org_id,
    v_user_id,
    'https://forms.gle/example-futsal',
    now() - interval '5 days',
    now() + interval '25 days'
  );

  INSERT INTO public.announcements (
    title, body, status, category_id, organization_id, author_id,
    registration_link, published_at, expires_at
  ) VALUES (
    'StudyPal Peer Mentorship Programme — Semester 2 Applications',
    E'## Give Back. Grow Together.\n\nThe **StudyPal Peer Mentorship Programme** is accepting applications for both mentors and mentees for Semester 2, 2024/25.\n\n### For Mentors (Year 2 and above)\n\n- Minimum CGPA 3.0\n- Commit to 2 sessions/month with your mentee\n- Earn **co-curricular points** and a certificate of recognition\n\n### For Mentees (Year 1)\n\n- Get matched with a senior from your programme\n- Guidance on academic planning, campus life, and career prep\n\n### Timeline\n\n- Applications close: **9 May 2025**\n- Matching announced: **16 May 2025**\n- Orientation session: **20 May 2025**\n\nApply via the link below. Both roles are available in the same form.',
    'published',
    cat_opps,
    v_org_id,
    v_user_id,
    'https://forms.gle/example-studypal',
    now() - interval '2 days',
    now() + interval '8 days'
  );

  INSERT INTO public.announcements (
    title, body, status, category_id, organization_id, author_id,
    published_at
  ) VALUES (
    'Library Extended Hours During Finals Week',
    E'## More Time to Study\n\nIn response to student feedback, the **INTI Library** will operate extended hours during the final examination period.\n\n### Extended Schedule (2–13 June 2025)\n\n| Day | Hours |\n|-----|-------|\n| Monday – Friday | 7:30 am – 12:00 midnight |\n| Saturday | 8:00 am – 10:00 pm |\n| Sunday | 10:00 am – 8:00 pm |\n\n### Reminder\n\n- Silent zone rules are strictly enforced after 8:00 pm.\n- Borrowing and returns remain available during all hours.\n- The café closes at 10:00 pm on weekdays.',
    'published',
    cat_general,
    v_org_id,
    v_user_id,
    now() - interval '6 hours'
  );

  INSERT INTO public.announcements (
    title, body, status, category_id, organization_id, author_id,
    published_at, expires_at
  ) VALUES (
    'Wellness Week 2025 — Free Counselling, Yoga & More',
    E'## Your Wellbeing Matters\n\n**Wellness Week 2025** runs from **12–16 May** across all INTI campuses. All activities are free for currently enrolled students.\n\n### What''s On\n\n- **Drop-in counselling** — Room L2-08, no appointment needed\n- **Morning yoga** — Multipurpose Hall, 7:00–8:00 am daily\n- **Stress-busting art workshop** — Thu 15 May, 2:00–4:00 pm\n- **Sleep hygiene talk** — Fri 16 May, 12:00 pm, Auditorium\n\nBring your student ID. Refreshments provided at selected sessions.',
    'published',
    cat_student_life,
    v_org_id,
    v_user_id,
    now() - interval '12 hours',
    now() + interval '15 days'
  );

  -- DRAFT ----------------------------------------------------

  INSERT INTO public.announcements (
    title, body, status, category_id, organization_id, author_id
  ) VALUES (
    'INTI Career Fair 2025 — Participating Employers List',
    E'## Draft — Do Not Publish Yet\n\nThe confirmed employer list will be updated here once all RSVPs are received.\n\n### Confirmed So Far\n\n- Maybank\n- AirAsia\n- TM\n- Petronas (pending confirmation)\n\nMore details to follow.',
    'draft',
    cat_opps,
    v_org_id,
    v_user_id
  );

  INSERT INTO public.announcements (
    title, body, status, category_id, organization_id, author_id
  ) VALUES (
    'Scheduled Maintenance — Block B Lifts (Draft)',
    E'## Notice to Students and Staff\n\nThe two passenger lifts in **Block B** will be taken offline for scheduled maintenance.\n\n**Date:** TBC\n**Duration:** Approximately 6 hours\n\nStudents with mobility needs should contact Student Affairs in advance so alternative arrangements can be made.',
    'draft',
    cat_general,
    v_org_id,
    v_user_id
  );

  -- ARCHIVED -------------------------------------------------

  INSERT INTO public.announcements (
    title, body, status, category_id, organization_id, author_id,
    published_at, archived_at
  ) VALUES (
    'Welcome Back — Semester 2, 2024/25 Begins 13 January',
    E'## A New Semester Starts\n\nWelcome back to all returning students, and a warm welcome to those joining INTI for the first time this semester.\n\nOrientation for new students runs **13–14 January**. All new students must attend.\n\nSemester 2 classes commence on **15 January 2025**.',
    'archived',
    cat_student_life,
    v_org_id,
    v_user_id,
    now() - interval '110 days',
    now() - interval '80 days'
  );

END $$;
