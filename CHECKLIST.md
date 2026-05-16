# Pre-Deployment Platform Checklist

Use this as your **full pre-deployment platform checklist**.

Security references: OWASP ASVS, OWASP Top 10, security headers, and Core Web Vitals.

---

## 1. Frontend UI/UX

### Layout & Responsiveness

- [ ] Works on mobile, tablet, laptop, desktop, ultrawide.
- [ ] No horizontal scrolling bugs.
- [ ] Header and footer responsive.
- [ ] Sidebar/drawer works on mobile.
- [ ] Cards, tables, forms, modals scale correctly.
- [ ] Empty states designed.
- [ ] Error states designed.
- [ ] Loading states designed.
- [ ] Skeleton loaders or spinners added.
- [ ] No broken layouts with long text.
- [ ] Posters/images do not overflow.
- [ ] Buttons are easy to tap on mobile.
- [ ] Theme spacing is consistent.
- [ ] Typography hierarchy is clear.

### Visual Quality

- [ ] Brand colors applied consistently.
- [ ] Logo is clear and visible.
- [ ] Light mode tested.
- [ ] Dark mode tested.
- [ ] Contrast is readable.
- [ ] Hover states exist.
- [ ] Focus states exist.
- [ ] Active states exist.
- [ ] Disabled states exist.
- [ ] Animations feel smooth, not excessive.
- [ ] No generic-looking placeholder UI left.
- [ ] No inconsistent border radius/shadows.
- [ ] Icons match style.
- [ ] Images are optimized and not blurry.

### Accessibility

- [ ] Keyboard navigation works.
- [ ] Tab order is logical.
- [ ] Forms have labels.
- [ ] Buttons have accessible names.
- [ ] Images have alt text.
- [ ] Color is not the only way to show status.
- [ ] Modal focus is trapped.
- [ ] Escape key closes modals.
- [ ] Text contrast passes basic accessibility.
- [ ] Page can zoom to 200% without breaking.

---

## 2. Frontend Functionality

- [ ] All links work.
- [ ] All buttons perform correct actions.
- [ ] Navigation works after refresh.
- [ ] Protected pages redirect unauthenticated users.
- [ ] Authenticated users cannot see login/register pages unnecessarily.
- [ ] Search works.
- [ ] Filters work.
- [ ] Sorting works.
- [ ] Pagination works.
- [ ] Uploads work.
- [ ] Form validation works.
- [ ] Toast notifications work.
- [ ] Copy/share/download actions work.
- [ ] Browser back/forward works.
- [ ] State does not reset unexpectedly.
- [ ] No console errors.
- [ ] No hydration errors.
- [ ] No broken routes.
- [ ] 404 page exists.
- [ ] Maintenance/error page exists.

---

## 3. Forms

- [ ] Required fields validated.
- [ ] Email format validated.
- [ ] Password rules validated.
- [ ] File type validated.
- [ ] File size validated.
- [ ] Long input handled safely.
- [ ] Special characters handled.
- [ ] Empty submissions blocked.
- [ ] Duplicate submissions prevented.
- [ ] Submit button shows loading.
- [ ] Clear success message shown.
- [ ] Clear error message shown.
- [ ] Form data does not disappear after minor error.
- [ ] Server-side validation also exists.

---

## 4. Authentication

- [ ] Sign up works.
- [ ] Login works.
- [ ] Logout works.
- [ ] Forgot password works.
- [ ] Reset password works.
- [ ] Email verification works if used.
- [ ] Session persists correctly.
- [ ] Session expires correctly.
- [ ] User cannot access another user's data.
- [ ] Admin-only pages are protected.
- [ ] Role-based access tested.
- [ ] Auth state updates after profile changes.
- [ ] Invalid credentials show safe error.
- [ ] Passwords are never logged.
- [ ] Tokens are not exposed in frontend logs.
- [ ] Cookies use secure settings where applicable.
- [ ] Rate limiting exists for login attempts.

---

## 5. Backend/API

- [ ] Every API endpoint tested.
- [ ] GET/POST/PUT/PATCH/DELETE behave correctly.
- [ ] Invalid input rejected.
- [ ] Unauthorized requests rejected.
- [ ] Wrong role requests rejected.
- [ ] Missing data handled.
- [ ] Duplicate data handled.
- [ ] Large payloads handled or rejected.
- [ ] API errors return clean messages.
- [ ] No stack traces exposed.
- [ ] API response format consistent.
- [ ] API status codes correct.
- [ ] CORS configured correctly.
- [ ] Rate limits enabled.
- [ ] Webhooks verified if used.
- [ ] Background jobs tested if used.
- [ ] External API failure handled.

---

## 6. Database

- [ ] Tables structured correctly.
- [ ] Relationships tested.
- [ ] Foreign keys set.
- [ ] Indexes added for common queries.
- [ ] Unique constraints added.
- [ ] Required fields are NOT NULL.
- [ ] Soft delete/hard delete behavior clear.
- [ ] Migration files tested.
- [ ] Seed data separated from production data.
- [ ] Backup plan exists.
- [ ] Restore process tested.
- [ ] No test records in production.
- [ ] Sensitive data encrypted or protected.
- [ ] Row-level security enabled if using Supabase.
- [ ] RLS policies tested for each role.
- [ ] Users cannot query private records directly.

---

## 7. Security

- [ ] OWASP Top 10 risks reviewed.
- [ ] Broken access control tested.
- [ ] SQL/NoSQL injection tested.
- [ ] XSS tested.
- [ ] CSRF considered.
- [ ] SSRF considered.
- [ ] File upload abuse tested.
- [ ] Admin routes protected.
- [ ] API keys are not exposed.
- [ ] Environment variables are private.
- [ ] Debug mode disabled.
- [ ] Error stack traces hidden.
- [ ] Dependencies scanned.
- [ ] Unused packages removed.
- [ ] Security headers configured.
- [ ] Content Security Policy added where possible.
- [ ] HSTS enabled on production.
- [ ] X-Frame-Options or CSP frame protection set to prevent clickjacking.
- [ ] HTTPS forced.
- [ ] Cookies use Secure, HttpOnly, SameSite.
- [ ] Rate limiting added to sensitive endpoints.
- [ ] Logging does not store passwords/tokens.

---

## 8. Performance

- [ ] Lighthouse tested.
- [ ] Core Web Vitals checked: LCP, INP, CLS.
- [ ] Images compressed.
- [ ] Lazy loading added.
- [ ] Large components split.
- [ ] Unused JS removed.
- [ ] Fonts optimized.
- [ ] API calls minimized.
- [ ] Database queries optimized.
- [ ] Caching added where useful.
- [ ] Loading under slow network tested.
- [ ] Mobile performance tested.
- [ ] No unnecessary re-renders.
- [ ] No huge bundle size.
- [ ] CDN configured if needed.

---

## 9. Admin/Dashboard

- [ ] Admin login protected.
- [ ] Admin role required.
- [ ] Create/edit/delete actions tested.
- [ ] Confirmation dialogs for destructive actions.
- [ ] Audit trail/logs if needed.
- [ ] Admin cannot accidentally break public site.
- [ ] Form validation for admin content.
- [ ] Image/poster upload tested.
- [ ] Draft/publish workflow tested if used.
- [ ] Status labels work.
- [ ] Search/filter works.
- [ ] Empty dashboard states exist.

---

## 10. Content & SEO

- [ ] Page titles added.
- [ ] Meta descriptions added.
- [ ] Open Graph image added.
- [ ] Favicon added.
- [ ] Sitemap added if public.
- [ ] Robots.txt configured.
- [ ] Canonical URLs set if needed.
- [ ] No placeholder text.
- [ ] No lorem ipsum.
- [ ] Spelling checked.
- [ ] Public pages readable without login.
- [ ] Social sharing preview tested.
- [ ] 404 page branded.

---

## 11. Deployment

- [ ] Production environment variables added.
- [ ] Development keys removed.
- [ ] Build command works.
- [ ] Production build succeeds.
- [ ] Preview deployment tested.
- [ ] Domain connected.
- [ ] HTTPS active.
- [ ] Redirects configured.
- [ ] Old routes redirected if needed.
- [ ] Database connected to production.
- [ ] Storage bucket connected.
- [ ] Email service connected.
- [ ] Payment service connected if used.
- [ ] Deployment logs clean.
- [ ] Rollback plan ready.

---

## 12. Monitoring & Maintenance

- [ ] Error tracking added.
- [ ] Analytics added.
- [ ] Uptime monitoring added.
- [ ] Server/API logs checked.
- [ ] Database logs checked.
- [ ] Security alerts enabled.
- [ ] Backup schedule enabled.
- [ ] Admin contact email working.
- [ ] User feedback/report issue option added.
- [ ] Version/release notes tracked.
- [ ] Maintenance plan written.

---

## 13. Final Launch Test

- [ ] Test as guest user.
- [ ] Test as normal user.
- [ ] Test as admin.
- [ ] Test on Chrome.
- [ ] Test on Brave.
- [ ] Test on Firefox/Safari if possible.
- [ ] Test on Android.
- [ ] Test on iPhone if possible.
- [ ] Test slow internet.
- [ ] Test fresh account.
- [ ] Test returning account.
- [ ] Test wrong input.
- [ ] Test expired session.
- [ ] Test after hard refresh.
- [ ] Test production URL, not only localhost.

---

## ⛔ Final Rule

Do not deploy until ALL of these are true:

- [ ] No critical security issue.
- [ ] No broken auth.
- [ ] No exposed secrets.
- [ ] No broken public pages.
- [ ] No database permission leaks.
- [ ] No console-breaking errors.
- [ ] Backup and rollback plan exist.
