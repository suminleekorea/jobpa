import type { JobListing } from "./jobFetcher";
import { DEMO_CHECKLIST } from "./demoData";

export type AnalysisStatus = "pending" | "success" | "partial" | "failed";

export interface ResumeAgentInput {
  resumeText: string;
  targetRole?: string;
  targetMarket?: string;
  jobDescription?: string;
  parseWarning?: string;
}

const MARKET_TIPS: Record<string, string[]> = {
  singapore: [
    "For Singapore roles, make quantified business impact easy to scan and align seniority with EP salary expectations.",
    "Use MyCareersFuture and company career pages for official postings; treat third-party listings as discovery leads.",
    "Visa guidance is informational only. Check MOM or official employer instructions before making decisions.",
  ],
  korea: [
    "For Korea, show Korean language level, global collaboration experience, and role-specific certifications where relevant.",
    "Large companies may use structured aptitude or group interview steps; prepare concise self-introductions in Korean and English.",
    "Visa guidance is informational only. Check HiKorea or official employer instructions before making decisions.",
  ],
  hongkong: [
    "For Hong Kong, highlight bilingual English/Mandarin/Cantonese ability and finance or regional market exposure.",
    "Keep resumes concise and emphasize credentials, internships, and commercial outcomes.",
    "Visa guidance is informational only. Check official Hong Kong immigration sources before making decisions.",
  ],
  dubai: [
    "For Dubai/UAE, state current visa status clearly and evaluate total package, not just base salary.",
    "LinkedIn, company career pages, and sector networks matter heavily for shortlisted roles.",
    "Visa guidance is informational only. Check official UAE or employer sources before making decisions.",
  ],
  uae: [
    "For Dubai/UAE, state current visa status clearly and evaluate total package, not just base salary.",
    "LinkedIn, company career pages, and sector networks matter heavily for shortlisted roles.",
    "Visa guidance is informational only. Check official UAE or employer sources before making decisions.",
  ],
  remote: [
    "For remote roles, state timezone overlap, async communication examples, and measurable ownership.",
    "Clarify contractor versus employee status before accepting an offer.",
    "Legal and tax implications vary by country; confirm with official or professional sources.",
  ],
};

const COMMON_SKILLS = [
  "sql", "python", "excel", "tableau", "power bi", "analytics", "market research",
  "stakeholder", "project management", "product", "marketing", "crm", "seo",
  "paid media", "data visualization", "ai", "machine learning", "generative ai",
  "korean", "english", "mandarin", "salesforce", "hubspot", "figma",
  "product management", "product marketing", "go-to-market", "gtm", "positioning",
  "messaging", "growth marketing", "digital marketing", "marketing analytics",
  "brand marketing", "campaign management", "content strategy", "copywriting",
  "social media", "community", "customer success", "account management", "sales",
  "business development", "partnerships", "strategy", "business operations",
  "operations", "supply chain", "consulting", "financial modeling", "forecasting",
  "budgeting", "market sizing", "competitive analysis", "user research",
  "customer research", "lead generation", "pipeline", "notion", "jira",
];

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function keywordize(text: string) {
  const lower = text.toLowerCase();
  return unique(COMMON_SKILLS.filter(skill => lower.includes(skill)));
}

function titleKeywords(text?: string) {
  if (!text) return [];
  return unique(
    text
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter(word => word.length > 2 && !["the", "and", "for", "with", "role", "job"].includes(word))
      .slice(0, 12)
  );
}

function scoreResume(text: string, targetKeywords: string[]) {
  const lower = text.toLowerCase();
  let score = 35;
  if (text.length > 800) score += 10;
  if (text.length > 1800) score += 10;
  if (/experience|work|employment|경력/i.test(text)) score += 8;
  if (/education|university|degree|학력/i.test(text)) score += 7;
  if (/skills|tools|certification|기술|자격/i.test(text)) score += 7;
  if (/\d+%|\$|s\$|krw|aed|hkd|increased|reduced|grew|saved|launched/i.test(text)) score += 10;
  const matchedTargets = targetKeywords.filter(keyword => lower.includes(keyword));
  score += Math.min(matchedTargets.length * 4, 16);
  return Math.max(0, Math.min(100, score));
}

function improvement(issue: string, suggestion: string, priority: "high" | "medium" | "low", impact = "Improves recruiter scan confidence.") {
  return { issue, suggestion, priority, impact };
}

export const marketVisaAgent = {
  guidance(country?: string) {
    const key = (country || "singapore").toLowerCase();
    const tips = MARKET_TIPS[key] ?? MARKET_TIPS.singapore;
    return {
      country: key,
      tips,
      disclaimer:
        "AI guidance only. This is not legal, visa, tax, or guaranteed employment advice; verify with official government and employer sources.",
    };
  },
};

export const intakeAgent = {
  buildCareerProfile(input: Record<string, any>) {
    const targetCountries = input.preferredLocations ?? input.targetCountries ?? [];
    const interests = input.interests ?? [];
    const targetRole = input.targetRole || "Open target role";
    return {
      interests,
      targetCountries,
      targetRole,
      experienceLevel: input.experienceLevel,
      salaryRange: input.salaryExpectation ?? input.salaryRange,
      visaStatus: input.needsVisaSponsorship ? "Needs employer sponsorship" : input.visaStatus,
      preferredLanguage: input.preferredLanguage ?? "English",
      profileSummary: `${targetRole} candidate targeting ${(targetCountries || []).join(", ") || "global"} roles with interests in ${(interests || []).join(", ") || "multiple fields"}.`,
      agentState: {
        intakeCompletedAt: new Date().toISOString(),
        source: "onboarding",
      },
    };
  },
};

export const profileAgent = {
  mergeProfile(existing: Record<string, any> | null | undefined, updates: Record<string, any>) {
    return {
      ...(existing ?? {}),
      ...updates,
      agentState: {
        ...((existing?.agentState as Record<string, unknown>) ?? {}),
        lastProfileAgentUpdate: new Date().toISOString(),
      },
    };
  },
};

export const resumeAgent = {
  analyzeResumeText(input: ResumeAgentInput) {
    const resumeText = (input.resumeText || "").trim();
    if (!resumeText || resumeText.length < 50) {
      return {
        status: "failed" as AnalysisStatus,
        message: "We could not fully parse this file. You can paste your resume text instead.",
        analysis: null,
      };
    }

    const roleKeywords = titleKeywords(input.targetRole);
    const jdKeywords = titleKeywords(input.jobDescription).slice(0, 10);
    const targetKeywords = unique([...roleKeywords, ...jdKeywords]);
    const foundSkills = keywordize(resumeText);
    const missingKeywords = targetKeywords.filter(keyword => !resumeText.toLowerCase().includes(keyword)).slice(0, 10);
    const overallScore = scoreResume(resumeText, targetKeywords);
    const status: AnalysisStatus = input.parseWarning || resumeText.length < 300 ? "partial" : "success";
    const market = input.targetMarket || "singapore";

    const strengths = [
      foundSkills.length > 0
        ? `Shows relevant skills: ${foundSkills.slice(0, 5).join(", ")}.`
        : "Contains enough text for a structured first-pass review.",
      /\d+%|\$|s\$|krw|aed|hkd/i.test(resumeText)
        ? "Includes quantified outcomes that can help recruiters judge impact."
        : "Has room to add quantified outcomes for stronger recruiter scanning.",
      /project|campaign|launched|managed|led|built/i.test(resumeText)
        ? "Mentions ownership of projects, campaigns, or initiatives."
        : "Can become stronger by adding project ownership examples.",
    ];

    const improvements = [
      ...(!/\d+%|\$|s\$|krw|aed|hkd|increased|reduced|grew|saved|launched/i.test(resumeText)
        ? [improvement("Impact is not quantified enough", "Add metrics such as growth, cost saved, conversion lift, revenue, users, or cycle time.", "high", "Can materially improve shortlist probability.")]
        : []),
      ...(missingKeywords.length > 0
        ? [improvement("Missing target keywords", `Add truthful evidence for keywords such as ${missingKeywords.slice(0, 5).join(", ")}.`, "high", "Improves ATS and recruiter matching for this role.")]
        : []),
      ...(!/summary|profile|objective/i.test(resumeText)
        ? [improvement("No clear positioning summary", "Add a 2-3 line summary connecting your background to the target role and market.", "medium")]
        : []),
      improvement("Application strategy needs tailoring", "Create one resume variant per role family and mirror each JD's strongest requirements.", "medium"),
    ].slice(0, 5);

    const actionPlanTasks = [
      { title: "Add two quantified achievements to the resume", category: "resume" as const },
      { title: "Create a keyword gap list from one target job description", category: "research" as const },
      { title: "Draft one STAR story for the strongest project", category: "prep" as const },
    ];

    const analysis = {
      interviewProbability: Math.max(15, Math.min(90, overallScore - 5)),
      overallScore,
      strengths,
      improvements,
      regionSpecificTips: marketVisaAgent.guidance(market).tips,
      missingKeywords,
      actionPlanTasks,
      summary:
        status === "partial"
          ? "We could parse enough resume text for a partial review. Paste the full resume text if any section is missing."
          : "Resume analysis completed. Use the improvement list to tailor the next application batch.",
      targetRegion: market,
      analyzedAt: Date.now(),
    };

    return {
      status,
      message: status === "partial" ? "We created a partial analysis. You can paste your resume text for a fuller retry." : "Analysis completed.",
      analysis,
      keywords: foundSkills,
    };
  },
};

export const jobFitAgent = {
  evaluate(input: {
    profile?: Record<string, any> | null;
    resumeAnalysis?: Record<string, any> | null;
    jobDescription: string;
    targetRole?: string;
    jobTitle?: string;
    company?: string;
  }) {
    const jd = input.jobDescription || "";
    const profileText = JSON.stringify(input.profile ?? {});
    const resumeText = JSON.stringify(input.resumeAnalysis ?? {});
    const candidateKeywords = unique([...keywordize(profileText), ...keywordize(resumeText)]);
    const jdKeywords = unique([...keywordize(jd), ...titleKeywords(input.targetRole), ...titleKeywords(input.jobTitle)]).slice(0, 16);
    const matchedSkills = jdKeywords.filter(keyword => candidateKeywords.includes(keyword));
    const missingSkills = jdKeywords.filter(keyword => !candidateKeywords.includes(keyword)).slice(0, 8);
    const fitScore = Math.max(20, Math.min(95, 45 + matchedSkills.length * 7 - missingSkills.length * 3));

    return {
      fitScore,
      result: {
        fitScore,
        matchedSkills,
        missingSkills,
        fitLevel: fitScore >= 80 ? "excellent" : fitScore >= 65 ? "good" : fitScore >= 45 ? "fair" : "poor",
        strategy: [
          "Lead the application with the two strongest JD-aligned achievements.",
          missingSkills.length > 0
            ? `Close visible gaps by adding truthful examples for ${missingSkills.slice(0, 3).join(", ")}.`
            : "Maintain the current keyword alignment and focus on company-specific tailoring.",
          "Use a short cover note explaining market fit, visa/work status, and availability.",
        ],
        interviewTips: [
          "Prepare a 90-second walkthrough connecting your background to this role.",
          "Create STAR stories for ownership, conflict, measurable impact, and learning agility.",
          "Prepare two company-specific questions about goals, metrics, and team operating rhythm.",
        ],
        disclaimer: "AI fit scoring is guidance only and does not predict recruiter decisions.",
      },
    };
  },
};

export const jobDiscoveryAgent = {
  rankJobs(jobs: JobListing[], profile?: Record<string, any> | null) {
    const targetRole = String(profile?.targetRole ?? "").toLowerCase();
    const interests = Array.isArray(profile?.interests) ? profile?.interests.join(" ").toLowerCase() : "";
    const countries = Array.isArray(profile?.targetCountries) ? profile?.targetCountries : [];
    return [...jobs]
      .map(job => {
        let score = 50;
        const title = job.title.toLowerCase();
        const text = `${job.title} ${job.description} ${(job.skills ?? []).join(" ")}`.toLowerCase();
        if (targetRole && title.includes(targetRole)) score += 20;
        for (const word of titleKeywords(targetRole)) if (text.includes(word)) score += 5;
        for (const word of titleKeywords(interests)) if (text.includes(word)) score += 3;
        if (countries.includes(job.location)) score += 8;
        if (job.visa) score += 4;
        if (job.remote) score += 2;
        return { ...job, matchScore: Math.min(100, score) };
      })
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  },
};

export const applicationAgent = {
  nextActions(status?: string) {
    switch (status) {
      case "bookmarked":
        return ["Run job fit evaluation", "Tailor resume keywords", "Decide whether to apply within 48 hours"];
      case "applied":
        return ["Log application date", "Find recruiter or hiring manager", "Prepare a follow-up note for day 5-7"];
      case "interview":
        return ["Generate interview prep", "Draft STAR stories", "Send thank-you note within 24 hours after interview"];
      case "offer":
        return ["Compare offer to target salary", "Prepare negotiation points", "Check visa and start-date constraints"];
      case "rejected":
        return ["Capture lessons in journal", "Reuse tailored resume for similar roles", "Ask for feedback if relationship is warm"];
      default:
        return ["Choose a target job", "Save it", "Run fit evaluation", "Track next action"];
    }
  },
};

export const interviewAgent = {
  createPrep(input: { jobTitle?: string; company?: string; targetMarket?: string; notes?: string }) {
    const role = input.jobTitle || "target role";
    const company = input.company || "the company";
    const market = input.targetMarket || "singapore";
    return {
      role,
      company,
      likelyQuestions: [
        `Walk me through your background and why ${role}.`,
        `Why ${company}, and what do you understand about our market?`,
        "Tell me about a time you used data or customer insight to make a decision.",
        "Describe a project where you had ambiguity, conflict, or shifting priorities.",
        "What would you do in your first 30 days in this role?",
      ],
      starStories: [
        "A measurable project where you improved growth, efficiency, or customer outcomes.",
        "A cross-functional collaboration story with a difficult stakeholder.",
        "A learning-agility story showing how you picked up a new tool, market, or domain quickly.",
      ],
      followUpTiming: "Send a concise thank-you note within 24 hours, then follow up after 5-7 business days if no timeline was given.",
      followUpEmail:
        `Subject: Thank you - ${role} interview\n\nHi [Name],\n\nThank you for speaking with me about the ${role} opportunity at ${company}. I appreciated learning more about the team priorities and how this role contributes to [specific goal discussed].\n\nOur conversation reinforced my interest in the role, especially the opportunity to apply my experience in [relevant skill/project] to [company/team objective]. Please let me know if I can share any additional information.\n\nBest,\n[Your Name]`,
      marketNotes: marketVisaAgent.guidance(market).tips,
      disclaimer: "AI interview preparation is guidance only; tailor all examples truthfully to your own experience.",
    };
  },
};

export const careerManagerAgent = {
  buildReport(input: {
    applications?: Array<{ status: string; company?: string; jobTitle?: string }>;
    resumeScore?: number | null;
    checklistDone?: number;
    checklistTotal?: number;
    targetRole?: string | null;
  }) {
    const applications = input.applications ?? [];
    const interviews = applications.filter(app => app.status === "interview").length;
    const offers = applications.filter(app => app.status === "offer").length;
    const active = applications.filter(app => ["bookmarked", "applied", "interview"].includes(app.status)).length;
    const checklistLine = `${input.checklistDone ?? 0}/${input.checklistTotal ?? 0}`;
    return `## Career Management Report

**Pipeline:** ${applications.length} total records, ${active} active, ${interviews} interview-stage, ${offers} offer-stage.

**Resume:** ${input.resumeScore != null ? `${input.resumeScore}/100` : "No successful analysis yet. Upload a resume or paste text to continue."}

**Target:** ${input.targetRole || "No target role saved yet."}

**Checklist:** ${checklistLine} tasks completed.

## Recommended Next Actions
- Save or apply to 3 roles that match the target role.
- Run a fit evaluation before applying to high-priority roles.
- If any role is at interview stage, generate prep and send a thank-you note within 24 hours after the call.
- Add one journal note about what worked this week and what to change next week.

AI guidance only; employment, salary, and visa outcomes are not guaranteed.`;
  },
};

export const qaErrorAgent = {
  audit(input: {
    hasProfile: boolean;
    hasJobs: boolean;
    hasResumeAnalysis: boolean;
    hasApplications: boolean;
    hasInterviewPrep: boolean;
    jobDataMode?: string;
    resumeStatus?: AnalysisStatus | null;
  }) {
    const issues: string[] = [];
    const nextActions: string[] = [];
    if (!input.hasProfile) nextActions.push("Complete onboarding or My Profile.");
    if (!input.hasJobs) issues.push("No live, cached, or demo jobs are available.");
    if (!input.hasResumeAnalysis) nextActions.push("Upload a resume or paste resume text.");
    if (!input.hasApplications) nextActions.push("Save a job or create an application.");
    if (!input.hasInterviewPrep) nextActions.push("Move an application to interview and generate prep.");
    if (input.jobDataMode && input.jobDataMode !== "live") issues.push(`Job data is running in ${input.jobDataMode} mode.`);
    if (input.resumeStatus === "failed") nextActions.push("Use the paste-text resume fallback.");
    return {
      status: issues.length === 0 ? "ok" : "degraded",
      issues,
      nextActions: nextActions.length > 0 ? nextActions : DEMO_CHECKLIST,
    };
  },
};
