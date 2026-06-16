# JobPA

Agentic AI Career Ops for international job seekers.

JobPA is an AI career operating system that helps cross-border talent find better roles, evaluate fit, tailor resumes, prepare interviews, and track applications without turning the job search into blind mass applying.

[Live demo](https://jobpa2.manus.space)

## Why JobPA

International job seekers do not just need another job board. They need operational support:

- Which roles are actually worth applying to?
- Is the job visa-friendly and realistic for my background?
- Which resume version should I use?
- What should I say in the cover letter or interview?
- What is the next action in my job pipeline?

JobPA turns those repeated decisions into an agent-assisted workflow while keeping the human in control.

## Core Features

- **Career Ops Center**: agentic job scan, A-F fit grading, matched evidence, gaps, strategy, interview hooks, and tailored resume drafts.
- **Resume Analysis**: PDF, DOCX, TXT, and paste-text support with structured feedback and target-role scoring.
- **Job Fit Evaluation**: compare a resume/profile against a job description and identify missing keywords.
- **Application Tracker**: save jobs, track applications, interviews, offers, and follow-up status.
- **Interview Prep**: convert a target role into practice questions and talking points.
- **AI Career Chat**: personal career guidance with saved profile context.
- **Multi-market Support**: built for Singapore-first job search with Korea, Dubai, Hong Kong, and remote expansion.
- **Dark/Light Mode**: coding-style dark mode plus white reading mode for mobile and presentation usage.

## What Makes It Different

JobPA is not an auto-apply bot. It is an agentic career workflow layer.

- Agents recommend, rank, draft, and organize.
- Users review and approve important actions.
- Job-board scraping and login bypassing are not part of the product.
- Visa, salary, and employment guidance is treated as decision support, not legal advice.

## Screenshots

<img src="docs/assets/jobpa-mobile-home.png" alt="JobPA mobile homepage" width="320" />

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- tRPC
- Express
- Drizzle ORM
- MySQL/TiDB
- Vitest

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm run db:push
pnpm run seed:demo
pnpm run dev
```

The server selects an available local port starting at `3000`.

## Environment Variables

Copy `.env.example` to `.env` and configure local values. Do not commit `.env`.

Required for a full local run:

```bash
DATABASE_URL=
JWT_SECRET=
APP_BASE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_GMAIL_REDIRECT_URI=http://localhost:3000/api/integrations/gmail/callback
```

## Development Commands

```bash
pnpm run dev
pnpm run check
pnpm test
pnpm run build
```

## Repository Structure

```text
client/      React frontend
server/      Express, tRPC, auth, AI, and integrations
shared/      Shared schemas and i18n
drizzle/     Database schema and migrations
api/         Vercel API entrypoint
scripts/     Demo seed and helper scripts
```

## Safety Policy

JobPA is designed as guidance software.

- No automatic job submissions.
- No credential collection for third-party job boards.
- No bypassing job-board logins or terms.
- AI outputs must be verified for visa, salary, employment, immigration, tax, and legal decisions.

## Roadmap

- Public screenshots and product demo video
- GitHub issue templates and contribution guide
- More approved job-source integrations
- Better mobile-first dashboard interactions
- Region-specific salary and visa intelligence
- Consultant marketplace workflow

## Founder

Built by Sumin Lee for international talent navigating Singapore-first cross-border careers.

- Website: [jobpa2.manus.space](https://jobpa2.manus.space)
- LinkedIn: [linkedin.com/in/suminlee-apac](https://linkedin.com/in/suminlee-apac)

## License

MIT
