/**
 * resumeAgent.ts — Multi-step Resume Analysis Agent
 *
 * Architecture: 5-step autonomous agent using Vercel AI SDK generateObject
 *
 * Step 1: Structure Parser     — Identify resume sections & extract structured data
 * Step 2: JD Keyword Matcher   — Match resume against JD / target role keywords
 * Step 3: Section Scorer       — Score each section (impact, clarity, ATS-friendliness)
 * Step 4: Improvement Planner  — Generate prioritized improvement suggestions
 * Step 5: Report Generator     — Compile final report + action plan
 *
 * Each step feeds its output into the next step (chain-of-thought agentic pattern).
 * Progress is streamed back to the client via SSE (Server-Sent Events).
 */

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { createPatchedFetch } from "./_core/patchedFetch";
import type { Response } from "express";

// ─── Schemas for each agent step ─────────────────────────────────────────────

const Step1Schema = z.object({
  sections: z.array(z.object({
    name: z.string().describe("Section name, e.g. 'Work Experience', 'Skills', 'Education'"),
    present: z.boolean(),
    content: z.string().describe("Brief summary of section content (max 200 chars)"),
    quality: z.enum(["strong", "adequate", "weak", "missing"]),
  })),
  totalWords: z.number().describe("Approximate word count"),
  format: z.enum(["chronological", "functional", "hybrid", "unknown"]),
  contactInfoComplete: z.boolean().describe("Has name, email, phone, LinkedIn/GitHub"),
  yearsOfExperience: z.number().describe("Estimated years of experience"),
  seniorityLevel: z.enum(["entry", "mid", "senior", "executive"]),
  primarySkills: z.array(z.string()).describe("Top 5-8 technical/professional skills found"),
  targetRole: z.string().describe("Inferred target role from resume content"),
});

const Step2Schema = z.object({
  matchedKeywords: z.array(z.string()).describe("Keywords from JD/role found in resume"),
  missingKeywords: z.array(z.string()).describe("Important keywords from JD missing in resume"),
  matchScore: z.number().min(0).max(100).describe("JD-to-resume keyword match percentage"),
  roleAlignment: z.enum(["excellent", "good", "partial", "poor"]).describe("How well resume aligns with target role"),
  skillGaps: z.array(z.object({
    skill: z.string(),
    importance: z.enum(["critical", "important", "nice-to-have"]),
    suggestion: z.string().describe("How to address this gap"),
  })),
  atsRisks: z.array(z.string()).describe("ATS parsing risks, e.g. tables, images, unusual fonts"),
});

const Step3Schema = z.object({
  sectionScores: z.array(z.object({
    section: z.string(),
    impactScore: z.number().min(0).max(10).describe("How impactful/quantified the content is"),
    clarityScore: z.number().min(0).max(10).describe("How clear and readable"),
    atsScore: z.number().min(0).max(10).describe("ATS-friendliness of this section"),
    overallScore: z.number().min(0).max(10),
    topIssue: z.string().describe("Single most important issue in this section"),
  })),
  overallScore: z.number().min(0).max(100),
  interviewProbability: z.number().min(0).max(100).describe("Realistic interview callback probability"),
  strengths: z.array(z.string()).describe("3-5 genuine strengths of this resume"),
  criticalWeaknesses: z.array(z.string()).describe("2-3 most critical weaknesses"),
});

const Step4Schema = z.object({
  improvements: z.array(z.object({
    priority: z.enum(["critical", "high", "medium", "low"]),
    section: z.string().describe("Which resume section this applies to"),
    issue: z.string().describe("Specific problem identified"),
    suggestion: z.string().describe("Concrete, actionable fix"),
    example: z.string().optional().describe("Before/after example if helpful"),
    impact: z.string().describe("Expected improvement if fixed, e.g. '+10% interview rate'"),
    timeToFix: z.enum(["30min", "1-2hrs", "half-day", "multi-day"]),
  })),
  quickWins: z.array(z.string()).describe("3-5 changes that take <30 min but have high impact"),
  regionSpecificTips: z.array(z.string()).describe("2-3 tips specific to target market/region"),
});

const Step5Schema = z.object({
  executiveSummary: z.string().describe("3-4 sentence honest overall assessment"),
  finalScore: z.number().min(0).max(100),
  finalInterviewProbability: z.number().min(0).max(100),
  topStrengths: z.array(z.string()).max(5),
  topImprovements: z.array(z.object({
    issue: z.string(),
    suggestion: z.string(),
    impact: z.string(),
    priority: z.enum(["high", "medium", "low"]),
  })).max(5),
  actionPlanTasks: z.array(z.object({
    title: z.string().describe("Short task title for checklist"),
    category: z.enum(["skill", "resume", "research", "network", "prep"]),
    timeEstimate: z.string().describe("e.g. '30 min', '2 hours'"),
  })).max(6),
  missingKeywords: z.array(z.string()).max(10),
  regionSpecificTips: z.array(z.string()).max(3),
  nextSteps: z.array(z.string()).describe("3 concrete next steps the user should take this week"),
});

// ─── Final combined result type ───────────────────────────────────────────────

export type AgentAnalysisResult = {
  step1: z.infer<typeof Step1Schema>;
  step2: z.infer<typeof Step2Schema>;
  step3: z.infer<typeof Step3Schema>;
  step4: z.infer<typeof Step4Schema>;
  step5: z.infer<typeof Step5Schema>;
  // Flattened for backward compatibility with existing DB schema
  overallScore: number;
  interviewProbability: number;
  strengths: string[];
  improvements: Array<{ issue: string; suggestion: string; impact: string; priority: "high" | "medium" | "low" }>;
  regionSpecificTips: string[];
  missingKeywords: string[];
  actionPlanTasks: Array<{ title: string; category: string }>;
  summary: string;
  agentSteps: string[];
};

// ─── Helper: create AI model ──────────────────────────────────────────────────

function createModel() {
  // Use Manus Forge API (built-in LLM access)
  const openai = createOpenAI({
    apiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
    baseURL: `${process.env.BUILT_IN_FORGE_API_URL}/v1`,
    fetch: createPatchedFetch(fetch) as any,
  });
  return openai.chat("gemini-2.5-flash");
}

// ─── SSE helper ──────────────────────────────────────────────────────────────

export function sendAgentProgress(res: Response, step: number, total: number, message: string, data?: object) {
  const payload = JSON.stringify({ step, total, message, data: data ?? null, ts: Date.now() });
  res.write(`data: ${payload}\n\n`);
}

// ─── Main Agent Function ──────────────────────────────────────────────────────

export async function runResumeAgent(
  resumeText: string,
  targetRegion: string,
  jobDescription: string,
  targetRole: string,
  onProgress?: (step: number, total: number, message: string) => void
): Promise<AgentAnalysisResult> {
  const model = createModel();
  const TOTAL_STEPS = 5;
  const progress = (step: number, msg: string) => onProgress?.(step, TOTAL_STEPS, msg);

  const regionCtx = REGION_CONTEXT[targetRegion] || REGION_CONTEXT.singapore;
  const jdContext = jobDescription
    ? `Target Job Description:\n${jobDescription.slice(0, 1500)}`
    : targetRole
    ? `Target Role: ${targetRole}`
    : "No specific JD provided — analyze for general job market fit.";

  // ── Step 1: Structure Parser ────────────────────────────────────────────────
  progress(1, "📄 Parsing resume structure and sections...");

  const { object: step1 } = await generateObject({
    model,
    schema: Step1Schema,
    prompt: `You are an expert resume parser. Analyze the structure and content of this resume.
Extract all sections, identify the format, seniority level, and key skills.

${regionCtx}
${jdContext}

Resume:
${resumeText.slice(0, 3500)}

Be precise and objective. Identify every section present or missing.`,
  });

  // ── Step 2: JD Keyword Matcher ──────────────────────────────────────────────
  progress(2, "🔍 Matching keywords against job description...");

  const { object: step2 } = await generateObject({
    model,
    schema: Step2Schema,
    prompt: `You are an ATS (Applicant Tracking System) expert. Analyze keyword alignment between this resume and the target role.

Resume Structure Summary:
- Format: ${step1.format}
- Seniority: ${step1.seniorityLevel} (${step1.yearsOfExperience} years)
- Primary Skills: ${step1.primarySkills.join(", ")}
- Sections Present: ${step1.sections.filter(s => s.present).map(s => s.name).join(", ")}

${jdContext}

Resume Content:
${resumeText.slice(0, 3000)}

${regionCtx}

Identify matched/missing keywords, skill gaps, and ATS risks. Be specific about what's missing.`,
  });

  // ── Step 3: Section Scorer ──────────────────────────────────────────────────
  progress(3, "📊 Scoring each section for impact and clarity...");

  const { object: step3 } = await generateObject({
    model,
    schema: Step3Schema,
    prompt: `You are a senior hiring manager. Score each resume section on impact, clarity, and ATS-friendliness.

Resume Analysis So Far:
- Sections: ${step1.sections.map(s => `${s.name} (${s.quality})`).join(", ")}
- Keyword Match: ${step2.matchScore}% — Missing: ${step2.missingKeywords.slice(0, 5).join(", ")}
- Role Alignment: ${step2.roleAlignment}
- Skill Gaps: ${step2.skillGaps.filter(g => g.importance === "critical").map(g => g.skill).join(", ")}

${jdContext}

Resume:
${resumeText.slice(0, 3000)}

${regionCtx}

Score honestly. The interviewProbability should be realistic (most resumes get 20-40% without strong JD match).`,
  });

  // ── Step 4: Improvement Planner ─────────────────────────────────────────────
  progress(4, "💡 Generating prioritized improvement plan...");

  const { object: step4 } = await generateObject({
    model,
    schema: Step4Schema,
    prompt: `You are a career coach. Based on the analysis, create a prioritized improvement plan.

Analysis Summary:
- Overall Score: ${step3.overallScore}/100
- Interview Probability: ${step3.interviewProbability}%
- Critical Weaknesses: ${step3.criticalWeaknesses.join("; ")}
- Missing Keywords: ${step2.missingKeywords.slice(0, 8).join(", ")}
- Skill Gaps (Critical): ${step2.skillGaps.filter(g => g.importance === "critical").map(g => g.skill).join(", ")}
- ATS Risks: ${step2.atsRisks.join(", ")}
- Section Issues: ${step3.sectionScores.map(s => `${s.section}: ${s.topIssue}`).join("; ")}

Target: ${targetRole || "general professional role"} in ${targetRegion}
${regionCtx}

Resume:
${resumeText.slice(0, 2000)}

Generate specific, actionable improvements with concrete examples. Prioritize by impact.`,
  });

  // ── Step 5: Report Generator ────────────────────────────────────────────────
  progress(5, "📋 Compiling final report and action plan...");

  const { object: step5 } = await generateObject({
    model,
    schema: Step5Schema,
    prompt: `You are a senior career advisor. Compile the final comprehensive report.

Full Analysis:
- Structure: ${step1.format} format, ${step1.seniorityLevel} level, ${step1.yearsOfExperience} yrs exp
- Keyword Match: ${step2.matchScore}%, Role Alignment: ${step2.roleAlignment}
- Overall Score: ${step3.overallScore}/100, Interview Probability: ${step3.interviewProbability}%
- Strengths: ${step3.strengths.join("; ")}
- Top Issues: ${step3.criticalWeaknesses.join("; ")}
- Priority Improvements: ${step4.improvements.filter(i => i.priority === "critical" || i.priority === "high").map(i => i.issue).join("; ")}
- Quick Wins: ${step4.quickWins.join("; ")}
- Missing Keywords: ${step2.missingKeywords.slice(0, 8).join(", ")}

Target: ${targetRole || step1.targetRole} in ${targetRegion}
${regionCtx}

Create a final score (may adjust slightly from step3 based on full picture), executive summary, and a concrete 6-task action plan for this week.`,
  });

  // ── Compile final result ────────────────────────────────────────────────────
  return {
    step1,
    step2,
    step3,
    step4,
    step5,
    // Flattened fields for backward compatibility
    overallScore: step5.finalScore,
    interviewProbability: step5.finalInterviewProbability,
    strengths: step5.topStrengths,
    improvements: step5.topImprovements.map(i => ({
      issue: i.issue,
      suggestion: i.suggestion,
      impact: i.impact,
      priority: i.priority,
    })),
    regionSpecificTips: step5.regionSpecificTips,
    missingKeywords: step5.missingKeywords,
    actionPlanTasks: step5.actionPlanTasks.map(t => ({ title: t.title, category: t.category })),
    summary: step5.executiveSummary,
    agentSteps: [
      `Step 1: Parsed ${step1.sections.filter(s => s.present).length} sections, ${step1.yearsOfExperience} yrs exp, ${step1.seniorityLevel} level`,
      `Step 2: Keyword match ${step2.matchScore}%, ${step2.missingKeywords.length} missing keywords, ${step2.skillGaps.filter(g => g.importance === "critical").length} critical skill gaps`,
      `Step 3: Overall score ${step3.overallScore}/100, interview probability ${step3.interviewProbability}%`,
      `Step 4: Generated ${step4.improvements.length} improvements, ${step4.quickWins.length} quick wins`,
      `Step 5: Final report compiled — ${step5.actionPlanTasks.length} action plan tasks`,
    ],
  };
}

// ─── Region context (shared with resumeRoutes.ts) ────────────────────────────

const REGION_CONTEXT: Record<string, string> = {
  singapore: `Target Market: Singapore
- ATS systems are widely used by MNCs and tech companies
- Emphasize quantified achievements (numbers, %, $)
- LinkedIn profile is essential; include URL
- Highlight any Singapore-relevant experience (MAS, CPF, local market knowledge)
- EP/SP visa eligibility matters for non-citizens
- Preferred format: 1-2 pages, reverse chronological`,

  korea: `Target Market: South Korea
- Korean companies prefer formal, structured resumes (이력서 + 자기소개서)
- Photo is typically expected for Korean companies
- Emphasize education, certifications, and company prestige
- Korean language proficiency is a major plus
- For global/tech companies: English resume is fine, focus on technical skills
- Preferred format: 1 page for Korean companies, 2 pages for global firms`,

  us: `Target Market: United States
- No photo, no age, no marital status (legal requirement)
- Strong action verbs + quantified achievements are critical
- ATS optimization is essential (keyword density matters)
- Tailor for each application
- 1 page for <10 years experience, 2 pages for senior roles
- Include GitHub/portfolio links for tech roles`,

  japan: `Target Market: Japan
- Rirekisho (履歴書) format for Japanese companies
- Japanese language ability is critical for most roles
- Emphasize stability, team contribution, and company loyalty
- For global companies: English resume acceptable
- JLPT certification level should be prominently listed
- Preferred format: Standard rirekisho or 1-2 page English resume for global firms`,
};
