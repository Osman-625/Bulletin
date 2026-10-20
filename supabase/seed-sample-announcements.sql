-- ============================================================
-- Bulletin — sample announcements (25 rows, all announcement types)
--
-- Plain SQL: paste it into the Supabase SQL editor and run it. It does not create any login.
-- It posts as an EXISTING user: a publisher who belongs to an approved organization, otherwise
-- the owner (then the first approved organization is used). Nothing is inserted if neither exists.
--
-- Safe to re-run: every row has a fixed id and every date is relative to now(), so running it
-- again moves all the dates forward. It only ever touches rows with ids ending 0201 to 0225.
--
-- Coverage
--   urgency x display font x display size   all 18 combinations, one live notice each
--   public board sections                   4 "New today", 6 "Closing soon", 8 "Plan ahead"
--   categories                              all six
--   banners / registration links / pinned   a mix (3 pinned, 10 banners, 13 links)
--   lifecycle                               2 scheduled, 1 draft, 1 submitted, 1 rejected,
--                                           1 expired, 1 archived
--
-- A trigger gives every published notice a 30-day expiry when expires_at is empty, so each
-- live row below sets its own expires_at.
-- ============================================================

WITH ctx AS (
  SELECT
    author.id AS author_id,
    coalesce(
      author.member_org_id,
      (SELECT o.id FROM public.organizations o WHERE o.status = 'approved' ORDER BY o.created_at LIMIT 1)
    ) AS org_id,
    (date_trunc('day', now() AT TIME ZONE 'Asia/Kuala_Lumpur') AT TIME ZONE 'Asia/Kuala_Lumpur') AS today,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 1, 'FMDay, FMDD FMMonth YYYY') AS d1,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 2, 'FMDay, FMDD FMMonth YYYY') AS d2,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 3, 'FMDay, FMDD FMMonth YYYY') AS d3,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 5, 'FMDay, FMDD FMMonth YYYY') AS d5,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 6, 'FMDay, FMDD FMMonth YYYY') AS d6,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 8, 'FMDay, FMDD FMMonth YYYY') AS d8,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 10, 'FMDay, FMDD FMMonth YYYY') AS d10,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 14, 'FMDay, FMDD FMMonth YYYY') AS d14,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 21, 'FMDay, FMDD FMMonth YYYY') AS d21,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 28, 'FMDay, FMDD FMMonth YYYY') AS d28,
    to_char((now() AT TIME ZONE 'Asia/Kuala_Lumpur')::date + 45, 'FMDay, FMDD FMMonth YYYY') AS d45
  FROM (
    SELECT * FROM (
      SELECT
        u.id,
        u.role,
        u.created_at,
        (
          SELECT m.organization_id
          FROM public.organization_members m
          JOIN public.organizations o ON o.id = m.organization_id AND o.status = 'approved'
          WHERE m.user_id = u.id
          ORDER BY m.organization_id
          LIMIT 1
        ) AS member_org_id
      FROM public.users u
      WHERE u.role IN ('publisher', 'owner')
    ) candidates
    ORDER BY (candidates.member_org_id IS NOT NULL) DESC, (candidates.role = 'publisher') DESC, candidates.created_at
    LIMIT 1
  ) author
),

seed (
  id, title, body, status, category_slug, urgency, display_font, display_size,
  banner_url, registration_link, scheduled_in, pinned_in,
  published_ago, expires_in_days, archived_ago, rejection_comment, view_count
) AS (
  VALUES
    ('20000000-0000-4000-8000-000000000201'::uuid,
     'Library Extended Hours This Week',
     format(E'## More Study Time This Week\n\nThe **INTI Library** is extending its opening hours until %s to support students preparing for assessments.\n\n### Extended Schedule\n\n| Day | Hours |\n|---|---|\n| Monday – Friday | 8:00 am – 10:00 pm |\n| Saturday | 9:00 am – 6:00 pm |\n| Sunday | Closed |\n\nQuiet study zones on Level 2 remain silent areas. Group rooms can be booked at the front desk.', (SELECT d6 FROM ctx)),
     'published', 'general', 'normal', 'editorial', 'compact',
     NULL, NULL, NULL, NULL,
     interval '1 hour', 6, NULL, NULL, 18),

    ('20000000-0000-4000-8000-000000000202'::uuid,
     'Free Breakfast Mondays at the Student Lounge',
     E'## Start Your Week Right\n\nStudent Affairs is serving **free breakfast every Monday morning** at the Student Lounge for the next three weeks.\n\n- **Time:** 8:00 am – 9:30 am\n- **Where:** Student Lounge, Block A, Level 1\n- **Menu:** Nasi lemak, sandwiches, fruit, and coffee or tea\n\nBring your student card. Vegetarian and halal options are always available.',
     'published', 'student-life', 'normal', 'clean', 'standard',
     '/sample-announcements/free-breakfast.png', NULL, NULL, NULL,
     interval '3 hours', 21, NULL, NULL, 41),

    ('20000000-0000-4000-8000-000000000203'::uuid,
     'Campus Night Market & Food Festival',
     format(E'## Campus Night Market & Food Festival\n\nThe central plaza turns into a night market on **%s** with food booths, mini games, and live acoustic sets.\n\n### Event Details\n\n- **Date:** %s\n- **Time:** 5:00 pm – 10:00 pm\n- **Venue:** Central Plaza\n- **Entry:** Free for INTI students and staff\n\n### Want a Booth?\n\nStudent clubs can reserve a booth through the registration form. Booth spaces are limited and allocated first come, first served.', (SELECT d8 FROM ctx), (SELECT d8 FROM ctx)),
     'published', 'events', 'urgent', 'editorial', 'large',
     '/sample-announcements/night-market.png', 'https://forms.gle/example-night-market', NULL, interval '4 days',
     interval '5 hours', 9, NULL, NULL, 212),

    ('20000000-0000-4000-8000-000000000204'::uuid,
     'Timetable Update for Block C Rooms',
     format(E'## Room Changes Effective Next Week\n\nSeveral classes scheduled in **Block C** have moved because of lab upgrades.\n\n- Lecture rooms C2-01 to C2-04 are closed until %s.\n- Affected classes are now in **Block D, Level 3**.\n- Updated timetables are live in the Student Portal.\n\nCheck your timetable before your next class. Lecturers will confirm changes in class channels.', (SELECT d14 FROM ctx)),
     'published', 'academic', 'important', 'clean', 'compact',
     NULL, NULL, NULL, NULL,
     interval '7 hours', 14, NULL, NULL, 67),

    ('20000000-0000-4000-8000-000000000205'::uuid,
     'Scholarship Applications Close Tonight',
     E'## Last Chance to Apply\n\nApplications for the **INTI Merit Scholarship** close **tonight at 11:59 pm**.\n\n### What You Need\n\n1. Latest academic transcript\n2. A one-page personal statement\n3. Recommendation letter from a lecturer\n\nLate submissions cannot be accepted. Submit through the online form now.',
     'published', 'opportunities', 'urgent', 'clean', 'large',
     '/sample-announcements/merit-scholarship.png', 'https://forms.gle/example-merit-scholarship', NULL, NULL,
     interval '4 days', 0, NULL, NULL, 340),

    ('20000000-0000-4000-8000-000000000206'::uuid,
     'Final Call: Exam Resit Registration',
     format(E'## Resit Registration Closes Tomorrow\n\nStudents who need to resit an examination must register by **%s**.\n\n- Register in the Student Portal under *Examinations > Resit*.\n- The resit fee is payable at the Finance counter or online.\n- Timetables are released three days after registration closes.\n\nMissing the deadline means waiting for the next resit window.', (SELECT d1 FROM ctx)),
     'published', 'academic', 'urgent', 'editorial', 'standard',
     NULL, 'https://forms.gle/example-exam-resit', NULL, NULL,
     interval '5 days', 1, NULL, NULL, 188),

    ('20000000-0000-4000-8000-000000000207'::uuid,
     'Graduate Career Booth Week',
     format(E'## Meet Employers Before Internship Season\n\nCareer Services is hosting booth sessions with employers from banking, logistics, hospitality, technology, and creative industries.\n\n### What to Bring\n\n- Updated résumé (printed copies help)\n- Student card\n- Questions about internships and graduate roles\n\nBooths run until **%s**. Walk-ins are welcome, but registered students get priority slots.', (SELECT d3 FROM ctx)),
     'published', 'opportunities', 'important', 'editorial', 'standard',
     '/sample-announcements/career-week.png', 'https://forms.gle/example-career-week', NULL, interval '2 days',
     interval '2 days', 3, NULL, NULL, 276),

    ('20000000-0000-4000-8000-000000000208'::uuid,
     'Student Creative Showcase Submissions',
     format(E'## Share Your Best Work\n\nThe Student Creative Showcase is accepting posters, short films, photography, prototypes, and performance proposals.\n\n### Submission Categories\n\n- Visual design and illustration\n- Photography and short film\n- Product and prototype demos\n- Music and live performance\n\nSubmissions close on **%s**. Selected work will be displayed on campus and featured online.', (SELECT d5 FROM ctx)),
     'published', 'student-life', 'important', 'clean', 'large',
     '/sample-announcements/creative-showcase.png', 'https://forms.gle/example-creative-showcase', NULL, NULL,
     interval '3 days', 5, NULL, NULL, 143),

    ('20000000-0000-4000-8000-000000000209'::uuid,
     'AI Study Skills Workshop',
     format(E'## Use AI Responsibly for Learning\n\nThis hands-on workshop shows how to use AI tools for planning, revision, feedback, and citation checking while staying within academic integrity rules.\n\n### Topics\n\n- Writing better prompts for study support\n- Checking AI answers against your course material\n- Citing AI assistance correctly\n\nSeats are limited. Register before **%s**.', (SELECT d6 FROM ctx)),
     'published', 'academic', 'normal', 'editorial', 'large',
     '/sample-announcements/ai-workshop.png', 'https://forms.gle/example-ai-study-skills', NULL, NULL,
     interval '1 day', 6, NULL, NULL, 96),

    ('20000000-0000-4000-8000-000000000210'::uuid,
     'Futsal Team Registration Closes in Two Days',
     format(E'## Inter-College Futsal Championship\n\nTeam registration closes on **%s**.\n\n- Teams of 5 to 8 players\n- Open to all enrolled students\n- Captains register through the form\n\nFixtures are published the day after registration closes.', (SELECT d2 FROM ctx)),
     'published', 'sports', 'urgent', 'clean', 'compact',
     NULL, 'https://forms.gle/example-futsal', NULL, NULL,
     interval '2 days', 2, NULL, NULL, 154),

    ('20000000-0000-4000-8000-000000000211'::uuid,
     'Updated Campus Shuttle Timetable',
     E'## New Shuttle Times\n\nThe campus shuttle timetable has been updated for the semester.\n\n- Weekday shuttles run every 20 minutes from 7:30 am to 6:30 pm.\n- There is no service on public holidays.\n- Pick-up points are unchanged.\n\nPrinted timetables are available at the security counter.',
     'published', 'general', 'normal', 'clean', 'compact',
     NULL, NULL, NULL, NULL,
     interval '6 days', 30, NULL, NULL, 52),

    ('20000000-0000-4000-8000-000000000212'::uuid,
     'Inter-Faculty Badminton Tournament',
     format(E'## Smash Into the Semester\n\nFaculties are invited to field teams for the inter-faculty badminton tournament.\n\n| | |\n|---|---|\n| **Format** | Men''s, women''s, and mixed doubles |\n| **Venue** | Sports Hall, Level 1 |\n| **Starts** | %s |\n\nRegister your pair through the form. Rackets and shuttlecocks are provided for the finals.', (SELECT d21 FROM ctx)),
     'published', 'sports', 'normal', 'editorial', 'standard',
     '/sample-announcements/badminton.png', 'https://forms.gle/example-badminton', NULL, NULL,
     interval '8 days', 45, NULL, NULL, 88),

    ('20000000-0000-4000-8000-000000000213'::uuid,
     'INTI Cultural Day',
     format(E'## Celebrating Our Many Cultures\n\nINTI Cultural Day brings together student societies for a day of performances, food stalls, and traditional games.\n\n### Highlights\n\n- Traditional dance and music showcase\n- Cultural costume parade\n- Food stalls from across the region\n\n**Date:** %s at the Central Plaza. Societies can sign up to perform or run a stall.', (SELECT d45 FROM ctx)),
     'published', 'events', 'normal', 'clean', 'large',
     '/sample-announcements/cultural-day.png', 'https://forms.gle/example-cultural-day', NULL, NULL,
     interval '3 days', 60, NULL, NULL, 131),

    ('20000000-0000-4000-8000-000000000214'::uuid,
     'Final Year Project Briefing Sessions',
     E'## Final Year Project Briefing\n\nFinal year students must attend one of the briefing sessions on project topics, supervision, and the submission schedule.\n\n- Session slots are posted in the Student Portal.\n- Bring your proposed topic ideas.\n- Supervisors are assigned after the briefing.',
     'published', 'academic', 'important', 'editorial', 'compact',
     NULL, NULL, NULL, NULL,
     interval '10 days', 90, NULL, NULL, 74),

    ('20000000-0000-4000-8000-000000000215'::uuid,
     'Open Mic & Art Night',
     format(E'## An Evening for Creatives\n\nJoin us for live music, poetry, and an art walk organised by the student arts societies.\n\n### Details\n\n- **When:** %s, 7:00 pm\n- **Where:** Student Lounge and Gallery Corridor\n- **Cost:** Free\n\nPerformers can sign up on the night or through the registration form.', (SELECT d28 FROM ctx)),
     'published', 'student-life', 'important', 'editorial', 'large',
     '/sample-announcements/open-mic.png', 'https://forms.gle/example-open-mic', NULL, interval '12 days',
     interval '5 days', 120, NULL, NULL, 233),

    ('20000000-0000-4000-8000-000000000216'::uuid,
     'Internship Placement Briefing for Diploma Students',
     E'## Plan Your Internship Early\n\nCareer Services will walk diploma students through the placement process, from CV preparation to employer interviews.\n\n- Eligibility and duration requirements\n- How to apply for industry placements\n- Documents you need before placement starts\n\nSign up to receive reminders and session links.',
     'published', 'opportunities', 'important', 'clean', 'standard',
     NULL, 'https://forms.gle/example-internship-briefing', NULL, NULL,
     interval '7 days', 180, NULL, NULL, 109),

    ('20000000-0000-4000-8000-000000000217'::uuid,
     'Campus Safety Reminder: Carry Your Student Card',
     E'## Safety Reminder\n\nSecurity officers are checking student cards at building entrances. Please carry your card at all times.\n\n- Lost your card? Report it at the Student Services counter.\n- Replacement cards take two working days.\n- Never share your card or lend it to others.',
     'published', 'general', 'urgent', 'editorial', 'compact',
     NULL, NULL, NULL, NULL,
     interval '1 day', 240, NULL, NULL, 45),

    ('20000000-0000-4000-8000-000000000218'::uuid,
     'Varsity Basketball Trials Open',
     format(E'## Varsity Basketball Trials\n\nThe INTI varsity basketball team is holding open trials for the new season.\n\n- **Dates:** two sessions, starting %s\n- **Venue:** Indoor Court\n- **Bring:** Sports attire, a water bottle, and your student card\n\nPlayers of all years are welcome to try out.', (SELECT d10 FROM ctx)),
     'published', 'sports', 'urgent', 'clean', 'standard',
     '/sample-announcements/basketball-trials.png', 'https://forms.gle/example-basketball-trials', NULL, NULL,
     interval '12 days', 300, NULL, NULL, 167),

    ('20000000-0000-4000-8000-000000000219'::uuid,
     'Orientation Week Schedule',
     E'## Welcome to Orientation Week\n\nNew students: your orientation week schedule, campus tours, and club showcase times are listed here.\n\n- Campus tours start at the main lobby.\n- The club showcase runs in the Central Plaza.\n- Bring your offer letter and student card on day one.',
     'published', 'student-life', 'important', 'clean', 'standard',
     NULL, NULL, interval '2 days 9 hours', NULL,
     NULL, 40, NULL, NULL, 0),

    ('20000000-0000-4000-8000-000000000220'::uuid,
     'Alumni Homecoming Dinner',
     E'## Welcome Back, Alumni\n\nThe annual alumni homecoming dinner brings graduates back to campus for an evening of reunions and awards.\n\n- Dress code: smart casual\n- Tickets are limited and sold through the registration form\n- Current students are welcome to volunteer as ushers',
     'published', 'events', 'normal', 'editorial', 'standard',
     NULL, 'https://forms.gle/example-alumni-dinner', interval '9 days 10 hours', NULL,
     NULL, 70, NULL, NULL, 0),

    ('20000000-0000-4000-8000-000000000221'::uuid,
     'Block B Lift Maintenance',
     E'## Notice to Students and Staff\n\nThe two passenger lifts in **Block B** will be offline for scheduled maintenance.\n\n**Date:** to be confirmed\n**Duration:** about 6 hours\n\nStudents with mobility needs should contact the Student Services counter for assistance.',
     'draft', 'general', 'normal', 'editorial', 'standard',
     NULL, NULL, NULL, NULL,
     NULL, NULL, NULL, NULL, 0),

    ('20000000-0000-4000-8000-000000000222'::uuid,
     'Updated Assessment Policy for Semester 2',
     E'## Policy Changes Awaiting Review\n\nThe assessment policy for Semester 2 now covers late submission penalties, resubmission windows, and the appeals process.\n\n- Late work loses 10% per day, up to five days.\n- Appeals must be filed within 7 days of results.\n- Extensions need supporting documents.',
     'submitted', 'academic', 'important', 'clean', 'standard',
     NULL, NULL, NULL, NULL,
     NULL, NULL, NULL, NULL, 0),

    ('20000000-0000-4000-8000-000000000223'::uuid,
     'Part-Time Campus Jobs Open for Applications',
     E'## Earn While You Study\n\nSeveral departments are hiring student assistants for the coming semester.\n\nApply through Career Services.',
     'rejected', 'opportunities', 'normal', 'clean', 'compact',
     NULL, NULL, NULL, NULL,
     NULL, NULL, NULL, 'Please add the application deadline and a contact email before resubmitting.', 0),

    ('20000000-0000-4000-8000-000000000224'::uuid,
     'Annual Sports Day Highlights',
     E'## Thank You for Joining Sports Day\n\nStudents, staff, and alumni competed across relay, tug-of-war, and a charity fun run. Photos and results are available at the Sports Office.',
     'expired', 'events', 'normal', 'editorial', 'standard',
     NULL, NULL, NULL, NULL,
     interval '45 days', -15, NULL, NULL, 402),

    ('20000000-0000-4000-8000-000000000225'::uuid,
     'Welcome Back Orientation',
     E'## A New Semester Starts\n\nWelcome back to returning students, and a warm welcome to those joining INTI for the first time. Orientation sessions ran across the first two weeks of term.',
     'archived', 'general', 'normal', 'clean', 'compact',
     NULL, NULL, NULL, NULL,
     interval '120 days', -90, interval '60 days', NULL, 975)
),

resolved AS (
  SELECT
    s.id, s.title, s.body, s.status, s.urgency, s.display_font, s.display_size,
    s.banner_url, s.registration_link, s.rejection_comment, s.view_count,
    c.author_id,
    c.org_id,
    cat.id AS category_id,
    c.today + s.scheduled_in AS scheduled_publish_at,
    now() + s.pinned_in AS pinned_until,
    CASE
      WHEN s.scheduled_in IS NOT NULL THEN c.today + s.scheduled_in
      WHEN s.published_ago IS NULL THEN NULL
      WHEN s.published_ago < interval '1 day'
        THEN greatest(c.today + interval '1 minute', now() - s.published_ago)
      ELSE now() - s.published_ago
    END AS published_at,
    c.today + s.expires_in_days * interval '1 day' + interval '23 hours 59 minutes' AS expires_at,
    now() - s.archived_ago AS archived_at
  FROM seed s
  CROSS JOIN ctx c
  LEFT JOIN public.categories cat ON cat.slug = s.category_slug
  WHERE c.author_id IS NOT NULL AND c.org_id IS NOT NULL
)

INSERT INTO public.announcements (
  id, title, body, status, category_id, organization_id, author_id,
  urgency, display_font, display_size,
  banner_url, registration_link, scheduled_publish_at, pinned_until,
  published_at, expires_at, archived_at, rejection_comment, view_count, created_at
)
SELECT
  r.id, r.title, r.body, r.status::public.post_status, r.category_id, r.org_id, r.author_id,
  r.urgency::public.announcement_urgency,
  r.display_font::public.announcement_display_font,
  r.display_size::public.announcement_display_size,
  r.banner_url, r.registration_link, r.scheduled_publish_at, r.pinned_until,
  r.published_at, r.expires_at, r.archived_at, r.rejection_comment, r.view_count,
  coalesce(r.published_at, now()) - interval '1 day'
FROM resolved r
ON CONFLICT (id) DO UPDATE SET
  title = excluded.title,
  body = excluded.body,
  status = excluded.status,
  category_id = excluded.category_id,
  organization_id = excluded.organization_id,
  author_id = excluded.author_id,
  urgency = excluded.urgency,
  display_font = excluded.display_font,
  display_size = excluded.display_size,
  banner_url = excluded.banner_url,
  registration_link = excluded.registration_link,
  scheduled_publish_at = excluded.scheduled_publish_at,
  pinned_until = excluded.pinned_until,
  published_at = excluded.published_at,
  expires_at = excluded.expires_at,
  archived_at = excluded.archived_at,
  rejection_comment = excluded.rejection_comment,
  view_count = excluded.view_count,
  created_at = excluded.created_at;

-- Shows how many sample rows exist now (expect 25).
SELECT count(*) AS sample_announcements
FROM public.announcements
WHERE id BETWEEN '20000000-0000-4000-8000-000000000201'::uuid
             AND '20000000-0000-4000-8000-000000000225'::uuid;

-- To remove all 25 sample rows again (reviews and notifications on them go too):
-- DELETE FROM public.announcements
-- WHERE id BETWEEN '20000000-0000-4000-8000-000000000201'::uuid
--              AND '20000000-0000-4000-8000-000000000225'::uuid;

-- Optional: remove the older sample rows made by the original seed.sql (its Test Publisher only).
-- DELETE FROM public.announcements
-- WHERE author_id = '00000000-0000-0000-0000-000000000001'
--   AND id NOT BETWEEN '20000000-0000-4000-8000-000000000201'::uuid
--                  AND '20000000-0000-4000-8000-000000000225'::uuid;
