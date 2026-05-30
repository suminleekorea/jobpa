# JobPA 취업비서 — AI-Powered Career Guidance Platform

> **Your AI-Powered Career Strategy Partner**  
> From market trends to resume analysis and job fit evaluation, JobPA guides you through every step of your job search.

🌐 **Live Demo:** [jobpa2.manus.space](https://jobpa2.manus.space)  
📊 **Supported Markets:** Singapore, Korea, UAE, Hong Kong, Australia  
🌍 **Languages:** English, Korean, Chinese (Simplified & Traditional), Japanese

---

## 🎯 What is JobPA?

JobPA is **not** an auto-apply tool. It's an **AI-powered guidance & strategy platform** that helps job seekers make smarter career decisions through:

- **Resume Analysis** — Get AI-powered feedback on your resume with region-specific insights
- **Job Fit Evaluation** — Understand how well you match specific job descriptions
- **AI Career Chat** — Ask your personal career coach anything about your job search strategy
- **Market Intelligence** — Discover trends, salary insights, and hiring patterns
- **LinkedIn Priority Filter** — Spot high-value opportunities (LinkedIn, MNC, high-salary roles)
- **Personalized Profile** — One-time profile setup for instant job fit scoring without repeated uploads

---

## ✨ Key Features

### 1. **Resume Analysis Engine**
- **Multi-Format Support:** PDF (including LaTeX), DOCX, TXT
- **Advanced PDF Parsing:** 2-layer fallback system
  - Layer 1: pdfjs-dist (Mozilla PDF.js) — handles LaTeX, Type1 fonts, ligatures
  - Layer 2: Gemini Vision API — for scanned/image-based PDFs
- **Region-Specific Feedback:** Tailored advice for Singapore, Korea, UAE, Hong Kong, Australia
- **Actionable Insights:**
  - Interview probability score (0-100%)
  - Overall resume quality score
  - Strengths & improvement recommendations
  - Missing keywords from job description
  - Action plan tasks for your daily checklist

### 2. **MyProfile Tab**
- **One-Time Setup:** Enter your name, headline, skills, experience, education, target role, location, visa status
- **Instant Job Fit Scoring:** No need to upload resume every time
- **Personalized AI Chat:** Your career coach knows your background and gives context-aware advice

### 3. **Job Fit Evaluation**
- **Smart Matching:** Compare your profile/resume against job descriptions
- **Industry/Seniority/Role Analysis:** Understand how your experience maps to the role
- **Keyword Extraction:** See exactly which skills are missing or underemphasized

### 4. **AI Career Chat**
- **Personalized Context:** Chat remembers your profile, resume, and previous conversations
- **Multi-Topic Support:**
  - Resume improvement strategies
  - Interview preparation
  - Salary negotiation tips
  - Career pivots & transitions
  - Market insights for your target role
- **Streaming Responses:** Real-time AI guidance

### 5. **LinkedIn Priority Filter**
- **High-Value Opportunities:** Filter for LinkedIn-posted jobs, MNC companies, high-salary roles
- **Visual Badges:**
  - 🔵 LinkedIn badge (posted on LinkedIn)
  - 🟣 MNC badge (multinational corporation)
  - 🟡 High-salary badge (top quartile for role/region)
- **Foreigner-Friendly Filter:** Find companies known for hiring international talent

### 6. **Resume Template Download**
- **International Standard (ATS-Friendly):** Blue header, clean layout optimized for Applicant Tracking Systems
- **Korean Saramin Style (자소서):** Red accents, Korean business format
- **DOCX Export:** Download with proper Korean encoding (no character corruption)
- **Pre-Filled:** Your MyProfile data auto-populates the templates

---

## 🏗️ Tech Stack

### Frontend
- **React 19** + Vite
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **shadcn/ui** for accessible components
- **tRPC** for end-to-end type-safe API calls
- **Wouter** for lightweight routing

### Backend
- **Express.js** for HTTP server
- **tRPC** for RPC procedures
- **Drizzle ORM** for database queries
- **MySQL/TiDB** for data persistence

### AI & APIs
- **Gemini 2.5 Flash** via Forge API (LLM, Vision, Embeddings)
- **pdfjs-dist** for PDF text extraction (pure Node.js, no Python)
- **Mammoth** for DOCX parsing
- **Manus OAuth** for authentication

### Infrastructure
- **Node.js 22** runtime
- **Vite** for dev server & bundling
- **Vitest** for unit testing
- **GitHub** for version control

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- pnpm (or npm/yarn)
- MySQL/TiDB database

### Installation

```bash
# Clone the repository
git clone https://github.com/suminleekorea/jobpa.git
cd jobpa

# Install dependencies
pnpm install

# Set up environment variables
# Copy .env.example to .env and fill in your credentials
cp .env.example .env

# Run database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Start dev server
pnpm dev
```

The app will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
jobpa/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components (Home, Jobs, Resume Analysis, etc.)
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # tRPC client setup
│   │   ├── App.tsx           # Main app routes
│   │   └── main.tsx          # React entry point
│   └── index.html
├── server/                    # Express backend
│   ├── _core/                # Core infrastructure
│   │   ├── context.ts        # tRPC context (auth, db)
│   │   ├── chat.ts           # AI chat integration
│   │   ├── env.ts            # Environment variables
│   │   └── index.ts          # Server entry point
│   ├── routers.ts            # tRPC procedure definitions
│   ├── db.ts                 # Database query helpers
│   ├── pdfParser.ts          # PDF text extraction (2-layer fallback)
│   ├── resumeRoutes.ts       # Resume upload & analysis endpoint
│   └── storage.ts            # S3 file storage helpers
├── drizzle/                  # Database schema & migrations
│   └── schema.ts             # Drizzle table definitions
├── shared/                   # Shared code
│   └── i18n.ts               # Multi-language translations (4 languages)
└── package.json
```

---

## 🔑 Key Implementation Details

### PDF Parsing Strategy

JobPA uses a **2-layer fallback system** to handle all PDF types reliably:

**Layer 1: pdfjs-dist (Mozilla PDF.js)**
- Pure JavaScript, no Python dependency
- Handles standard PDFs, LaTeX PDFs, Type1 fonts, ligatures
- Fast and reliable for 95% of resumes

**Layer 2: Gemini Vision API**
- Fallback for scanned/image-based PDFs
- Converts PDF to images and sends to Gemini 2.5 Flash
- Handles handwritten or complex layouts

```typescript
// Example: Extract text from any PDF
const result = await extractTextFromPdf(buffer);
console.log(result.text);      // Extracted text
console.log(result.method);    // "pdfjs" or "gemini-vision"
console.log(result.pageCount); // Number of pages
```

### Multi-Language Support

JobPA supports 4 languages with complete UI localization:

- **English (EN)**
- **Korean (KO)** — 한국어
- **Chinese Simplified (ZH)** — 简体中文
- **Chinese Traditional (TW)** — 繁體中文
- **Japanese (JA)** — 日本語

Translations are managed in `shared/i18n.ts` with a type-safe schema.

### Region-Specific Resume Analysis

Resume feedback is tailored to each market:

| Region | Key Focus |
|--------|-----------|
| **Singapore** | EP salary requirements, MOM guidelines, Fair Consideration Framework, LinkedIn presence |
| **Korea** | Photo/age/military service, GSAT tests, chaebols, hierarchy, TOPIK scores |
| **UAE** | Visa sponsorship, nationality, Arabic skills, free zones, tax-free salary |
| **Hong Kong** | IANG visa, bilingual skills, CFA/CPA, 1-2 page format, top universities |
| **Australia** | Skills-based immigration, SOL/MLTSSL, work rights, superannuation, cover letter |

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- server/pdfParser.test.ts

# Watch mode
pnpm test -- --watch
```

### Test Coverage
- **PDF Parser:** 9 tests (pdfjs, Gemini Vision, error handling)
- **Auth:** Logout flow, session management
- **API:** Resume analysis, job fit scoring

---

## 🌐 Deployment

JobPA is deployed on **Manus** (built-in hosting platform):

```bash
# Create a checkpoint (required before deployment)
# This is done via the Management UI

# Deploy
# Click "Publish" button in the Management UI
```

The app is automatically deployed to:
- **jobpa2.manus.space** (primary domain)
- **jobpa-ai-7cdwvffx.manus.space** (auto-generated domain)

---

## 🔐 Authentication

JobPA uses **Manus OAuth** for authentication:

- Users log in with their Manus account
- Session tokens are stored in secure HTTP-only cookies
- All API calls are protected with `protectedProcedure`
- User profiles are isolated by user ID

```typescript
// Example: Protected tRPC procedure
export const myProfile = protectedProcedure
  .input(z.object({ /* ... */ }))
  .mutation(async ({ ctx, input }) => {
    // ctx.user is guaranteed to exist
    const userId = ctx.user.id;
    // ... save profile
  });
```

---

## 📊 Database Schema

### Key Tables

**users**
- `id` (primary key)
- `email`, `name`, `role` (admin | user)
- `createdAt`, `updatedAt`

**user_profiles**
- `id`, `userId` (foreign key)
- `name`, `headline`, `skills`, `experience`, `education`
- `targetRole`, `targetLocation`, `targetSalary`, `visaStatus`
- `createdAt`, `updatedAt`

**resumes**
- `id`, `userId` (foreign key)
- `fileName`, `fileUrl`, `fileKey` (S3 reference)
- `analysisResult` (JSON with scores, feedback, recommendations)
- `overallScore`, `targetRegion`, `analyzedAt`
- `createdAt`

---

## 🚧 Roadmap

- [ ] **Resume Score History** — Track improvements across multiple uploads
- [ ] **DOCX Template Download** — Export to Word format with Korean encoding
- [ ] **Keyword Extraction by Industry/Seniority** — Advanced skill mapping
- [ ] **Interview Prep Module** — Practice Q&A with AI interviewer
- [ ] **Salary Negotiation Guide** — Region-specific salary benchmarks
- [ ] **Job Application Tracker** — Track applications, interviews, offers
- [ ] **Referral Network** — Connect with alumni & mentors
- [ ] **Mobile App** — React Native version for iOS/Android

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Check TypeScript
pnpm tsc --noEmit

# Format code
pnpm format
```

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Sumin Lee** — Founder & CEO
  - SK SOVAC Grand Prize Winner
  - NTU Merit Scholar
  - 7 languages, 3 markets
  - [LinkedIn](https://linkedin.com/in/suminlee)

- **Sapranshu Agrawal** — Co-Founder & CTO
  - MSc Business Analytics (SMU)
  - Accenture PMO Experience
  - Multilingual Strategy Professional
  - [LinkedIn](https://linkedin.com/in/sapranshuagrawal)

---

## 📧 Contact & Support

- **Website:** [jobpa2.manus.space](https://jobpa2.manus.space)
- **Email:** support@jobpa.com
- **LinkedIn:** [@JobPA](https://linkedin.com/company/jobpa)
- **Issues:** [GitHub Issues](https://github.com/suminleekorea/jobpa/issues)

---

## 🙏 Acknowledgments

- **Manus** — For hosting & infrastructure
- **Gemini** — For AI/Vision capabilities
- **Mozilla** — For pdfjs-dist
- **React & Tailwind** — For frontend framework & styling
- **All contributors** — For making JobPA better

---

**JobPA: Your AI-Powered Career Strategy Partner** 🚀
