# JobPA — Claude Code Context

## Project Overview
JobPA is a **niche AI-powered resume optimizer** targeting IT foreign talent seeking jobs in Singapore, Korea, and the US. It is NOT a general job board — the core value is AI-driven resume building, regional format conversion (Singapore ATS / Korea Saramin / US Tech), and job-specific tailoring.

**Live URL:** https://jobpa2.manus.space  
**GitHub:** https://github.com/suminleekorea/jobpa  
**Stack:** React 19 + Tailwind 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL/TiDB

---

## Architecture

```
client/src/
  pages/           ← Feature pages (Home, Jobs, ResumeAnalysis, MyProfile, ChatBot, JobFit, etc.)
  components/      ← Reusable UI (DashboardLayout, ResumeTemplates, AIChatBox, Map)
  contexts/        ← React contexts (AuthContext)
  hooks/           ← Custom hooks
  lib/trpc.ts      ← tRPC client binding
  App.tsx          ← Routes & layout
  index.css        ← Global theme (pure black #000000 + cyan #00d4ff)

server/
  routers.ts       ← tRPC procedures (main router)
  db.ts            ← Drizzle query helpers
  resumeRoutes.ts  ← Resume upload & analysis REST endpoint
  pdfParser.ts     ← 3-layer PDF parser: pdfjs-dist → Gemini Vision API
  jobFetcher.ts    ← Multi-source job fetcher (LinkedIn, MCF, PSG, GovTech, etc.)
  governmentResumeAnalysis.ts ← PSC/civil service resume feedback
  adapters/
    psgAdapter.ts     ← Singapore Public Service job board adapter
    govtechAdapter.ts ← GovTech Singapore job board adapter
  _core/           ← Framework plumbing (OAuth, context, chat, imageGeneration)
    chat.ts        ← AI chat with profile context injection
    env.ts         ← Environment variable definitions

drizzle/
  schema.ts        ← Database tables (users, userProfiles, jobs, etc.)
  migrations/      ← SQL migration files

shared/
  i18n.ts          ← Translations: KO, EN, JA, ZH (4 languages)
```

---

## Key Design Decisions

### Theme
- **Pure black** (#000000) background — VS Code / GitHub Copilot aesthetic
- **Cyan** (#00d4ff) accent — tech/hacker feel
- **White** (#ffffff) text
- Dark mode is default (`defaultTheme="dark"` in App.tsx)
- Font: Inter (body) + Roboto Mono (code elements)

### PDF Parsing (pdfParser.ts)
3-layer fallback — **zero Python dependency** (critical for Node.js deploy runtime):
1. **pdfjs-dist** — primary, handles LaTeX/Type1/ligature fonts
2. **Gemini Vision API** — fallback for scanned/image-based PDFs (via Forge API)

### Job Sources (jobFetcher.ts)
Multi-source with source badges:
- `linkedin` — blue badge
- `mcf` — Singapore MyCareersFuture
- `psg` — Singapore Public Service (tech roles)
- `govtech` — GovTech Singapore
- `saramin` — Korea Saramin
- `jobkorea` — Korea JobKorea

### AI Chat (server/_core/chat.ts)
- Uses Forge API (Gemini 2.5 Flash by default)
- Injects user profile context from `userProfiles` table
- System prompt includes: user's skills, experience, target role, visa status

### Resume Analysis (resumeRoutes.ts)
- POST `/api/upload-analyze` — upload PDF/DOCX, extract text, run AI analysis
- Returns: `overallScore`, `strengths`, `improvements`, `atsScore`, `parseInfo`
- `parseInfo.method`: `pdfjs` | `vision-api`

---

## Database Schema (drizzle/schema.ts)

Key tables:
- `users` — OAuth users (id, openId, name, email, role: admin|user)
- `userProfiles` — Career profile (name, headline, skills, experience, education, targetRole, targetLocation, visaStatus, expectedSalary)
- `jobs` — Cached job listings (title, company, location, source, skills, isLinkedIn, isMNC, isForeignFriendly, isHighSalary)

---

## tRPC Procedures (server/routers.ts)

```
auth.me               — get current user
auth.logout           — logout
profile.get           — get user profile
profile.upsert        — create/update user profile
jobs.list             — list jobs with filters
jobs.refresh          — trigger job refresh
system.notifyOwner    — send notification to owner
```

---

## Environment Variables

See `.env.example` for all required variables. Key ones:
- `DATABASE_URL` — MySQL/TiDB connection string
- `JWT_SECRET` — Session signing secret
- `BUILT_IN_FORGE_API_KEY` — Manus Forge API (LLM, Vision, Storage)
- `BUILT_IN_FORGE_API_URL` — Forge API base URL
- `VITE_APP_ID` — OAuth app ID
- `OAUTH_SERVER_URL` — Manus OAuth backend

---

## i18n (shared/i18n.ts)

4 languages: Korean (ko), English (en), Japanese (ja), Chinese (zh).  
Structure: `translations[lang].nav`, `.common`, `.jobs`, `.resume`, `.myProfile`, `.resumeTemplate`

To add a new key, add it to all 4 language sections.

---

## Development Workflow

```bash
# Install
pnpm install

# Dev server (runs both client + server)
pnpm dev

# Database migrations
pnpm drizzle-kit generate   # generate SQL from schema changes
# Then apply SQL via webdev_execute_sql or direct DB connection

# TypeScript check
npx tsc --noEmit

# Tests
pnpm test
```

---

## Strategic Context (Phase 1 MVP)

**Target:** IT foreign talent seeking Singapore/Korea/US tech roles  
**Core Value:** AI resume optimizer with regional format conversion  
**NOT:** A general job board or auto-apply tool

**Phase 1 Features (Priority):**
1. Resume builder with AI auto-fill from uploaded PDF
2. Regional format conversion: Singapore ATS, Korea Saramin, US Tech, Europe CV
3. ATS score calculation (0-100)
4. Job-specific resume tailoring (paste JD → AI optimizes resume)

**Phase 2 (Planned):**
- Token-based consulting marketplace
- Human consultants for managerial/leadership roles
- 15-20% platform commission

---

## Common Pitfalls

1. **Never use Python** in server code — deploy runtime is Node.js only
2. **pdfjs-dist** must be imported as ESM: `import * as pdfjsLib from 'pdfjs-dist'`
3. **i18n**: Always add keys to all 4 languages (ko, en, ja, zh)
4. **Theme**: `:root` and `.dark` both use same dark values (dark-first design)
5. **tRPC**: Use `trpc.*.useQuery/useMutation` — never raw fetch/axios
6. **Drizzle**: After schema changes, always run `drizzle-kit generate` and apply SQL

---

## File Naming Conventions

- Pages: `client/src/pages/FeatureName.tsx`
- Server modules: `server/featureName.ts`
- Adapters: `server/adapters/sourceName.ts`
- Tests: `server/featureName.test.ts`
