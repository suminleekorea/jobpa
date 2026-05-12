# JobPA 취업비서 - Project TODO

- [x] Brand rename to JobPA 취업비서 (logo, title, positioning)
- [x] Database schema (surveys, applications, jobs, goals, reports, email_alerts, consulting_waitlist)
- [x] i18n system with KO/EN translations
- [x] tRPC routers for all features
- [x] Landing page (hero, features, how it works, FAQ, consulting teaser, CTA)
- [x] Enhanced onboarding with Step 0 "What are you looking for?"
- [x] Job listings page with multi-location filtering
- [x] Detailed filter panel (job type, experience, industry, salary, visa, date, remote)
- [x] External apply link tracking with confirmation modal
- [x] Application tracking dashboard with status management
- [x] Job Fit Evaluation with bug fixes (validation, error handling, loading states)
- [x] Resume Analysis page
- [x] Market Trends page
- [x] Daily Reports page
- [x] Job consulting coming soon section + waitlist
- [x] Dashboard layout with sidebar navigation
- [x] Job source badges (Career@Gov, MCF, LinkedIn, JobsDB, Bayt)
- [x] Bilingual KO/EN for all new features
- [x] Vitest tests for key features
- [x] Admin dashboard (owner-only) with user stats, signup count, waitlist count
- [x] Admin role restricted to owner only
- [x] Pricing section on landing page (Free now / Premium coming soon / Per-use pricing planned)
- [x] Commercialization-ready positioning (free launch → paid SaaS or per-use billing)
- [x] Integrate Career@Gov CSV real data (opengovsg/careersgovsg-jobs-data)
- [x] Integrate MCF Jobs real data (gabrielchua/mcf-jobs)
- [x] Construct proper Career@Gov job URLs from JobId + PostingNo
- [x] Format job closing dates from timestamps
- [x] Replace demo/mock job data with real data ingestion pipeline
- [x] Add data refresh mechanism (30min cache TTL)
- [x] Fix Job Fit TypeError: Cannot read properties of undefined (reading 'toLowerCase') when selecting Data Analyst
- [x] MCF API integration confirmed working (200+ jobs)
- [x] Industry news/trends dashboard (multi-sector: IT, finance, healthcare, etc.) with news API
- [x] AI career chatbot for guidance and Q&A
- [ ] IR Deck (investor pitch slides) for LinkedIn sharing
- [ ] Dashboard home page with summary view (resume, applications, trends at a glance)
- [x] 1-minute demo video with feature description overlays
- [x] LinkedIn post (EN+KR mixed) about JobPA update with story (why built, visa sponsorship, etc.)
- [x] Integrate LinkedIn Jobs data source (via JSearch API)
- [x] Integrate JobStreet data source (via JSearch API)
- [x] Integrate Monster Jobs data source (via JSearch API)
- [x] Integrate Google Jobs data source (via JSearch API)
- [x] Integrate Indeed Jobs data source (via JSearch API)
- [x] Research and integrate any other available free job APIs (Adzuna, JSearch, etc.)
- [x] Update frontend job source badges for all new sources
- [x] Gamification: XP system, levels, streaks, badges for job search activities
- [x] Daily goals & AI-recommended action items (based on user profile & target role)
- [x] Custom checklist creation by user
- [x] Job search journal / daily diary feature
- [x] Data isolation audit - ensure no user data leaks between accounts (resume skills, etc.)
- [x] Fun/differentiated UI - gamification, journal, mood tracking, XP badges
- [x] JSearch API integration for LinkedIn, Indeed, Glassdoor, Google Jobs aggregation
- [x] Integrate Saramin API (사람인) for Korean domestic jobs
- [x] Integrate JobKorea (잡코리아) — API requires approval (email inquiry draft written); added as external resource link in Korea filter
- [x] Integrate Incruit (인크루트) — No public API; added as external resource link in Korea filter
- [x] Integrate PeopleNJob (피플앤잡) — No public API; added as external resource link in Korea filter
- [ ] Add "Korea (귀국)" tab/filter for domestic returnee job seekers
- [x] Korean platform source badges in job cards (사람인 indigo, 잡코리아 rose)
- [x] Add job portal (source) filter — filter by 사람인/잡코리아/LinkedIn/Indeed/Glassdoor/Career@Gov/MCF etc.
- [x] Expand experience level filter — 인턴/신입/주니어/미들/시니어/임원직 (6 levels)
- [x] Update i18n KO/EN for new filter labels
- [ ] Landing page hero dashboard preview screenshot/mockup
- [x] Interview probability engine (resume vs job description → interview likelihood %)
- [x] Region-aware resume feedback (different advice for SG/KR/UAE/AU/US markets)
- [x] Resume-to-Daily-Action-Plan auto-generation (checklist tasks from resume insights)
- [x] Consulting Marketplace (consultant profiles, session booking, credit system)
- [ ] Disable Saramin API gracefully (반려됨 — skip if no key, no UI error)
- [ ] MCF MCP server integration (mcpmarket.com/server/mycareersfuture)
- [ ] jobscrapers (pwaaron/jobscrapers) integration for additional SG job sources
- [x] Consultant application form — activate real DB submission + owner notification

## Consulting Marketplace Rebuild
- [x] Add linkedinUrl, photoUrl, industry, specialties fields to consultants table
- [x] Seed Sumin Lee as first consultant with full profile
- [x] Consulting directory: industry/role filter grid + consultant cards
- [x] Consultant detail page: LinkedIn, photo, career, Sprouts purchase flow
- [ ] Replace Home.tsx with pitch-structured landing page

## Bug Fixes
- [x] Fix Resume Analysis Unauthorized error (server route auth issue)
- [x] Fix AI Career Chat "messages array is required" error
- [x] Add floating AI chat button to landing page (bottom-right corner)

## New Features (May 2026)
- [x] Chat history DB persistence (save/load conversations per user)
- [x] Resume Analysis result saving to DB + dashboard summary card
- [x] Dashboard Home summary screen (resume, applications, trends at a glance)
- [x] Founders Live Singapore pitch deck (7 slides max, EN)
- [ ] Update pitch deck slide 3 with Singapore local job market data (why SG investors should care)
- [x] Add user reviews/testimonials section to website (DB + landing page + consultant profiles)

## Feedback Fixes (May 2026 Round 2)
- [x] Fix resume analysis "load failed" error
- [x] Fix daily report detail view (상세보기 broken + add criteria explanation)
- [x] Industry trends: real AI generation on button click (not static demo data)
- [ ] Industry trends: future email alert notification (placeholder)
- [x] Guided user flow: after resume analysis → suggest next step
- [x] Daily goal nudge popup when user is active mid-session
- [x] Complete reviews DB helpers + reviews section on landing page
- [x] Add Japanese (日本語) language support
- [x] Add Chinese (中文) language support

## Feedback Fixes (May 2026 Round 3)
- [x] Fix resume analysis CV parsing error (multer error handler + better error messages)
- [x] Move My Level, Journal, Reports, Industry Trends to collapsible "기타 기능" section in sidebar
- [x] Add MyProfile tab with one-time profile form (personal info, skills, experience, education)
- [x] Prioritize LinkedIn jobs in job search results (high-paid/MNC/foreigner target)
- [x] Add resume template styles (International standard + Korean Saramin 자소서 style)

## New Features (May 2026 Round 4)
- [x] MyProfile tab: DB schema (user_profiles table), tRPC procedures, profile form (name, headline, skills, experience, education, target role, target location, visa status)
- [x] Wire MyProfile into Job Fit evaluation (use profile instead of requiring resume upload)
- [x] Wire MyProfile into AI Career Chat (personalized context from profile)
- [x] LinkedIn priority filter + MNC/foreigner-friendly badge + high salary filter
- [x] Resume template download: International standard style (PDF)
- [x] Resume template download: Korean Saramin 자소서 style (PDF)
