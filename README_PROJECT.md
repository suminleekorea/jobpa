# JobPA 취업비서 — AI-Powered Career Strategy Platform

> **JobPA is NOT an auto-apply tool.** It's your AI-powered career guidance & strategic partner — helping overseas Koreans and global job seekers navigate the job market with intelligence.

---

## 🎯 Project Background & Vision

JobPA was built for a specific, underserved audience: **Korean professionals living abroad** (Singapore, UAE, USA, Australia, etc.) who are either:
1. Seeking jobs in their current country of residence
2. Planning to return to Korea and re-enter the Korean job market
3. Looking for global opportunities across multiple regions simultaneously

The core insight: most job platforms are region-specific. A Korean in Singapore has to juggle MyCareersFuture (SG), LinkedIn, JobsDB, Saramin (KR), and JobKorea simultaneously — with no unified intelligence layer. JobPA solves this.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React 19 + Tailwind 4 + shadcn/ui)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Landing     │  │  Dashboard   │  │  Feature Pages       │   │
│  │  (Home.tsx)  │  │  Layout      │  │  Jobs, Resume, Fit,  │   │
│  │              │  │  (Sidebar)   │  │  Reports, Checklist, │   │
│  └──────────────┘  └──────────────┘  │  Journal, Trends...  │   │
│                                       └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  tRPC API Layer (type-safe end-to-end)                          │
│  server/routers.ts → procedures → ctx.user (auth)              │
├─────────────────────────────────────────────────────────────────┤
│  Backend (Express 4 + Drizzle ORM + MySQL/TiDB)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Auth        │  │  Job         │  │  AI Agents           │   │
│  │  (Manus      │  │  Fetcher     │  │  (Forge API /        │   │
│  │   OAuth)     │  │  (JSearch +  │  │   LLM streaming)     │   │
│  │              │  │   Saramin)   │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS 4, shadcn/ui |
| Routing | Wouter (lightweight) |
| API | tRPC 11 + Superjson |
| Auth | Manus OAuth (session cookies + JWT) |
| Database | MySQL/TiDB via Drizzle ORM |
| AI/LLM | Manus Forge API (OpenAI-compatible) + AI SDK |
| Job Data | JSearch (RapidAPI) + Saramin API (Korea) |
| i18n | Custom context — Korean (ko) + English (en) |
| Design | Inter font, Notion-inspired clean white theme |

---

## 🌏 Supported Job Markets

| Region | Platforms | Status |
|--------|-----------|--------|
| 🇸🇬 Singapore | MyCareersFuture, MCF | ✅ Active |
| 🇦🇪 UAE / Gulf | Bayt, GulfTalent | ✅ Active |
| 🌐 Global | LinkedIn, Indeed, Glassdoor, Google Jobs | ✅ Active |
| 🇰🇷 Korea | Saramin API | ✅ Key required (`SARAMIN_API_KEY`) |
| 🇰🇷 Korea | JobKorea | ⏳ API approval pending |
| 🇰🇷 Korea | Incruit, PeopleNJob | 🔗 External links only (no public API) |
| 🇦🇺 Australia | Seek | ✅ via JSearch |
| 🇺🇸 USA | LinkedIn, Indeed | ✅ via JSearch |

---

## ✨ Core Features

### 1. Job Search & Filtering
- Multi-platform job aggregation (JSearch + Saramin)
- **Source filter**: filter by specific job portal (LinkedIn, Indeed, Saramin, etc.)
- **Experience level filter**: 인턴 / 신입(0-1yr) / 주니어(1-3yr) / 미들(3-7yr) / 시니어(7yr+) / 임원·디렉터
- **Location filter**: Singapore, UAE, Korea, Australia, USA, Global
- Active filter chips with individual dismiss
- Korean platform external resource links (JobKorea, Incruit, PeopleNJob) shown when Korea filter is active

### 2. AI Resume Analysis
- Upload resume → AI extracts skills, experience, gaps
- Region-aware feedback (different advice for SG vs KR vs UAE market)
- Interview probability scoring per job posting

### 3. Job Fit Evaluation
- Paste job description → AI scores fit (0-100%)
- Identifies matching skills and gaps
- Actionable improvement suggestions

### 4. Daily Reports
- Personalized morning briefing
- Market trend summaries by industry
- Recommended actions for the day

### 5. Application Tracking
- Kanban-style pipeline: Bookmarked → Applied → Interview → Offer/Rejected
- Notes and follow-up reminders per application

### 6. Daily Checklist & Journal
- AI-generated daily action items from resume insights
- Job search journal for reflection and tracking

### 7. Gamification (Level System)
- XP points for completing job search activities
- Level progression with badges

### 8. Industry Trends
- Real-time hiring trends by sector (IT, Finance, Healthcare, Energy)
- Salary benchmarks by region

### 9. AI Career Chatbot
- Conversational AI for job strategy, visa info, salary negotiation
- Streaming responses via Forge API

### 10. Consulting Marketplace (Planned)
- 1:1 career consulting with experienced professionals
- Resume deep-dive, interview coaching, salary negotiation, visa consultation
- Credit-based booking system

---

## 📁 Key File Structure

```
client/src/
  pages/
    Home.tsx              ← Landing page (public)
    Jobs.tsx              ← Job search with filters
    Applications.tsx      ← Application pipeline tracking
    ResumeAnalysis.tsx    ← AI resume analysis
    JobFit.tsx            ← Job fit scoring
    Reports.tsx           ← Daily AI reports
    Checklist.tsx         ← Daily action checklist
    Journal.tsx           ← Job search journal
    Level.tsx             ← Gamification / XP system
    Trends.tsx            ← Industry hiring trends
    ChatBot.tsx           ← AI career chatbot
    Consulting.tsx        ← Consulting marketplace
    Admin.tsx             ← Admin panel (role-gated)
  components/
    DashboardLayout.tsx   ← Sidebar navigation shell
    DashboardLayoutSkeleton.tsx
    AIChatBox.tsx         ← Reusable AI chat component
    Map.tsx               ← Google Maps integration
  contexts/
    i18nContext.tsx       ← KO/EN translations
    ThemeContext.tsx      ← Light/dark theme
  hooks/
    useMobile.tsx

server/
  routers.ts             ← All tRPC procedures
  db.ts                  ← Database query helpers
  jobFetcher.ts          ← JSearch + Saramin job fetching
  features.test.ts       ← Gamification tests
  korean-jobs.test.ts    ← Korean platform integration tests
  rapidapi.test.ts       ← JSearch API tests

shared/
  i18n.ts               ← All KO/EN translation strings

drizzle/
  schema.ts             ← Database schema (all tables)

DESIGN.md               ← Design system reference (Linear × Notion)
```

---

## 🔑 Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | MySQL/TiDB connection | ✅ Auto-injected |
| `JWT_SECRET` | Session signing | ✅ Auto-injected |
| `BUILT_IN_FORGE_API_KEY` | LLM / AI features | ✅ Auto-injected |
| `BUILT_IN_FORGE_API_URL` | Forge API endpoint | ✅ Auto-injected |
| `RAPIDAPI_KEY` | JSearch job data | ✅ Auto-injected |
| `SARAMIN_API_KEY` | Korean job listings | ⚠️ Manual — get from oapi.saramin.co.kr |
| `VITE_APP_ID` | Manus OAuth | ✅ Auto-injected |

---

## 🚀 Setup & Development

```bash
# Install dependencies
pnpm install

# Start dev server (frontend + backend)
pnpm dev

# Database migrations
pnpm drizzle-kit generate   # generate SQL from schema changes
# Then apply via webdev_execute_sql tool

# Run tests
pnpm test

# Build for production
pnpm build
```

---

## 🎨 Design System

See [`DESIGN.md`](./DESIGN.md) for the full design system reference.

**Summary:**
- **Theme**: Clean white light mode (Notion-inspired)
- **Font**: Inter (tight tracking, antialiased)
- **Accent color**: Indigo `#4f6ef7` — single brand color for all interactive elements
- **Cards**: Off-white `#f9fafb`, subtle `#e5e7eb` borders, 10px radius
- **Typography**: 600 weight headings with -0.5px tracking, 400 body text

---

## 🗺️ Roadmap

- [ ] Saramin API key integration (pending approval)
- [ ] JobKorea API integration (email inquiry sent to api@jobkorea.co.kr)
- [ ] Resume-to-Daily-Action-Plan auto-generation
- [ ] Interview probability engine with region-aware scoring
- [ ] Consulting marketplace with credit system
- [ ] Mobile app (React Native)
- [ ] Notification system (daily report push)
- [ ] Saved filter presets

---

## 📝 Notes for Future Development

1. **Korean market strategy**: Saramin is the only viable API. JobKorea requires institutional approval. Incruit and PeopleNJob have no public APIs — treat them as external resource links.

2. **JSearch rate limits**: The RapidAPI JSearch endpoint has rate limits. In development, tests may fail with 429 errors — this is expected and not a code bug.

3. **i18n**: All user-facing strings live in `shared/i18n.ts`. Both `ko` and `en` must be updated together. The language toggle is in the sidebar footer and landing page navbar.

4. **Gamification XP values**: Defined in `server/routers.ts` under the `gamification` router. XP events: job_bookmarked (5), job_applied (20), interview_scheduled (50), offer_received (100), resume_analyzed (15), checklist_completed (10), journal_entry (5).

5. **Auth**: Uses Manus OAuth. `protectedProcedure` requires login. `adminProcedure` additionally checks `ctx.user.role === 'admin'`. To promote a user to admin, update the `role` field in the database directly.

---

## 👤 Target Users

- Korean professionals in Singapore, UAE, Australia, USA seeking local jobs
- Overseas Koreans planning to return to Korea
- International job seekers targeting Korea
- Career changers needing structured guidance

---

*Built with [Manus](https://manus.im) — AI-powered web development platform*
