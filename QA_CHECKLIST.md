# JobPA QA Checklist

Scope: internal/local/staging review only. Do not deploy publicly or expose externally without explicit approval.

## Workflow Coverage

- [ ] App loads locally without uncaught errors.
- [ ] Landing page route works.
- [ ] Onboarding captures interests, target country, role, experience, salary, visa status, and preferred language.
- [ ] Dashboard shows guided next action and no dead-end empty state.
- [ ] My Profile saves and reloads through the adapter.
- [ ] Job Postings loads with live API, cached DB, or sanitized demo fallback.
- [ ] Career Ops Center runs an approved-source scan and shows A-F grades without auto-applying.
- [ ] Career Ops manual JD paste evaluation works and saves a fit evaluation.
- [ ] Career Ops resume draft PDF download works from scan and pasted JD results.
- [ ] Career Ops save/start-application CTAs persist through existing saved job/application paths.
- [ ] Saved Jobs route lists bookmarked jobs and can move a saved job to applications.
- [ ] Applications Tracker can update statuses without resetting notes.
- [ ] Moving an application to Interview exposes Interview Prep CTA.
- [ ] Resume upload handles PDF, DOCX, TXT, empty, oversized, unsupported, corrupted, and missing-text files without raw errors.
- [ ] Resume paste-text fallback works after parsing failure.
- [ ] Resume analysis stores status: pending, success, partial, or failed.
- [ ] Job Fit Evaluation works with profile-only context when resume analysis is unavailable.
- [ ] Interview Prep creates likely questions, STAR prompts, follow-up timing, and thank-you email.
- [ ] Reports generate with deterministic fallback if AI or database save fails.
- [ ] Industry Trends generates with deterministic fallback if AI fails.
- [ ] AI Career Chat includes guidance-only and official-source caveats for visa/legal topics.
- [ ] Checklist, Journal, Level/Progress, Career Consulting, Disclaimer/Privacy routes remain reachable.

## Data And API Fallbacks

- [ ] Database unavailable state does not break dashboard, jobs, resume analysis, reports, or application creation UI.
- [ ] Job API failure returns cached database results when available.
- [ ] Job API and cache failure returns sanitized demo jobs with visible fallback message.
- [ ] No job-board scraping is introduced.
- [ ] Company ATS scanning remains disabled unless an explicit allowlist and approved endpoint policy is configured.
- [ ] Existing Manus auth/runtime/database integration remains in place.
- [x] Google callback without OAuth code redirects to a safe login error state.
- [ ] Google OAuth succeeds after `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and redirect URIs are configured.
- [ ] Gmail connect, career-mail sync, and send-email flows work after Gmail OAuth consent.

## Verification Log

- [x] `pnpm run check`
- [x] `pnpm test`
- [x] `pnpm run build`
- [x] Local HTTP smoke: `/api/auth/google/callback` returns `302 /login?authError=google_not_configured` when Google env is missing.
- [x] Local HTTP smoke: `/dashboard/career-ops` returns `200` from the local dev server.
- [ ] Browser smoke test blocked: in-app browser automation failed with a Windows sandbox process-start error.
- [ ] Browser smoke test at local URL
