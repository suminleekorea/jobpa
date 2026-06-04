/**
 * Career AI Chatbot Handler
 *
 * Express endpoint for AI SDK streaming chat customized for JobPA career guidance.
 */

import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { Express } from "express";
import { z } from "zod/v4";
import { ENV } from "./env";
import { createPatchedFetch } from "./patchedFetch";
import * as db from "../db";
import { sdk } from "./sdk";

function createLLMProvider() {
  const baseURL = ENV.forgeApiUrl.endsWith("/v1")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/v1`;

  return createOpenAI({
    baseURL,
    apiKey: ENV.forgeApiKey,
    fetch: createPatchedFetch(fetch),
  });
}

const careerTools = {
  searchJobs: tool({
    description: "Search for job listings by keyword, location, or industry",
    inputSchema: z.object({
      query: z.string().describe("Job search keyword, e.g. 'data analyst'"),
      location: z.string().optional().describe("Location filter: singapore, hongkong, dubai, korea, remote"),
    }),
    execute: async ({ query, location }) => {
      // This returns guidance about where to search
      const platforms: Record<string, string[]> = {
        singapore: ["Career@Gov (jobs.careers.gov.sg)", "MyCareersFuture (mycareersfuture.gov.sg)", "LinkedIn"],
        hongkong: ["JobsDB (jobsdb.com)", "LinkedIn", "CTgoodjobs"],
        dubai: ["Bayt (bayt.com)", "GulfTalent (gulftalent.com)", "LinkedIn"],
        korea: ["Saramin (saramin.co.kr)", "JobKorea (jobkorea.co.kr)", "LinkedIn"],
        remote: ["LinkedIn Remote", "We Work Remotely", "Remote.co"],
      };
      const loc = location || "singapore";
      return {
        query,
        location: loc,
        recommendedPlatforms: platforms[loc] || platforms.singapore,
        tip: `Search for "${query}" on these platforms. Use the Jobs tab in JobPA to see curated listings.`,
      };
    },
  }),

  getVisaInfo: tool({
    description: "Get visa and work permit information for a specific country",
    inputSchema: z.object({
      country: z.string().describe("Country: singapore, hongkong, dubai, korea"),
    }),
    execute: async ({ country }) => {
      const visaInfo: Record<string, object> = {
        singapore: {
          types: [
            { name: "Employment Pass (EP)", minSalary: "S$5,000/mo", description: "For professionals, managers, executives" },
            { name: "S Pass", minSalary: "S$3,150/mo", description: "For mid-skilled workers" },
            { name: "Tech.Pass", minSalary: "S$20,000/mo", description: "For top tech talent" },
          ],
          tip: "Most tech roles qualify for EP. Companies must advertise on MCF for 14 days before hiring foreigners.",
        },
        hongkong: {
          types: [
            { name: "General Employment Policy (GEP)", description: "Standard work visa for professionals" },
            { name: "IANG", description: "For non-local graduates of HK institutions" },
            { name: "QMAS (Quality Migrant Admission)", description: "Points-based talent scheme" },
            { name: "Top Talent Pass", description: "For high earners or top university graduates" },
          ],
          tip: "HK has no minimum salary for GEP but you need a job offer from a HK company.",
        },
        dubai: {
          types: [
            { name: "Employment Visa", description: "Sponsored by employer, valid 2-3 years" },
            { name: "Freelance Visa", description: "For independent professionals" },
            { name: "Golden Visa", description: "10-year residency for exceptional talent" },
          ],
          tip: "No income tax in UAE. Most companies provide housing and flight allowances.",
        },
        korea: {
          types: [
            { name: "E-7 (Specific Activities)", description: "For professional workers in designated fields" },
            { name: "D-10 (Job Seeking)", description: "6-month visa for job hunting" },
            { name: "F-2-7 (Points-based)", description: "Long-term residency via points system" },
          ],
          tip: "E-7 is the most common work visa. Korean language ability is a plus but not always required for tech roles.",
        },
      };
      return visaInfo[country] || { error: "Country not found. Supported: singapore, hongkong, dubai, korea" };
    },
  }),

  getInterviewTips: tool({
    description: "Get interview preparation tips for a specific role or company type",
    inputSchema: z.object({
      role: z.string().describe("Target role, e.g. 'Software Engineer'"),
      companyType: z.string().optional().describe("Company type: startup, enterprise, government, fintech"),
    }),
    execute: async ({ role, companyType }) => {
      return {
        role,
        companyType: companyType || "general",
        generalTips: [
          "Research the company's recent news, products, and culture",
          "Prepare STAR method stories for behavioral questions",
          "Have 3-5 thoughtful questions ready for the interviewer",
          "Practice explaining your resume in 2 minutes",
        ],
        technicalTips: [
          "Review fundamentals relevant to the role",
          "Practice coding/case studies if applicable",
          "Be ready to discuss past projects in detail",
          "Prepare a portfolio or work samples if relevant",
        ],
        salaryTips: [
          "Research market rates on Glassdoor, Levels.fyi, or NodeFlair",
          "Consider total compensation (base + bonus + equity + benefits)",
          "Don't give a number first — ask for their budget range",
          "Factor in cost of living for the target city",
        ],
      };
    },
  }),

  getSalaryBenchmark: tool({
    description: "Get salary benchmarks for a role in a specific location",
    inputSchema: z.object({
      role: z.string().describe("Job role, e.g. 'Data Analyst'"),
      location: z.string().describe("Location: singapore, hongkong, dubai, korea"),
      experience: z.string().optional().describe("Experience level: junior, mid, senior"),
    }),
    execute: async ({ role, location, experience }) => {
      // General benchmarks (these are approximations for guidance)
      const benchmarks: Record<string, Record<string, { junior: string; mid: string; senior: string }>> = {
        singapore: {
          default: { junior: "S$4,000-6,000/mo", mid: "S$6,000-10,000/mo", senior: "S$10,000-18,000/mo" },
          tech: { junior: "S$4,500-7,000/mo", mid: "S$7,000-12,000/mo", senior: "S$12,000-22,000/mo" },
        },
        hongkong: {
          default: { junior: "HK$20,000-35,000/mo", mid: "HK$35,000-60,000/mo", senior: "HK$60,000-100,000/mo" },
          tech: { junior: "HK$25,000-40,000/mo", mid: "HK$40,000-70,000/mo", senior: "HK$70,000-120,000/mo" },
        },
        dubai: {
          default: { junior: "AED 8,000-15,000/mo", mid: "AED 15,000-30,000/mo", senior: "AED 30,000-50,000/mo" },
          tech: { junior: "AED 10,000-18,000/mo", mid: "AED 18,000-35,000/mo", senior: "AED 35,000-60,000/mo" },
        },
        korea: {
          default: { junior: "₩3M-4.5M/mo", mid: "₩4.5M-7M/mo", senior: "₩7M-12M/mo" },
          tech: { junior: "₩3.5M-5.5M/mo", mid: "₩5.5M-9M/mo", senior: "₩9M-15M/mo" },
        },
      };
      const loc = benchmarks[location] || benchmarks.singapore;
      const roleLower = (role || "").toLowerCase();
      const category = (roleLower.includes("engineer") || roleLower.includes("developer") || roleLower.includes("data") || roleLower.includes("devops") || roleLower.includes("ai")) ? "tech" : "default";
      const data = loc[category] || loc.default;
      const exp = experience || "mid";
      return {
        role,
        location,
        experience: exp,
        salaryRange: data[exp as keyof typeof data] || data.mid,
        note: "These are approximate ranges. Actual salary depends on company, specific skills, and negotiation.",
        sources: ["Glassdoor", "Levels.fyi", "NodeFlair (SG)", "JobsDB Salary Report"],
      };
    },
  }),
};

const CAREER_SYSTEM_PROMPT = `You are JobPA Career Assistant, an AI-powered career guidance and strategic partner. You help job seekers with:

1. **Job Search Strategy**: Help users find the right roles across Singapore, Hong Kong, Dubai/UAE, South Korea, and remote positions.
2. **Resume & Interview Advice**: Provide actionable feedback on resumes, cover letters, and interview preparation.
3. **Visa & Relocation**: Share visa requirements and relocation tips for different countries.
4. **Salary Negotiation**: Help users understand market rates and negotiate effectively.
5. **Career Planning**: Guide users on career transitions, skill development, and long-term strategy.

Important guidelines:
- You are NOT an auto-apply tool. You provide guidance and strategy — users apply themselves.
- Be specific and actionable in your advice.
- When discussing salaries, always mention that ranges are approximate and vary by company.
- Encourage users to use JobPA's built-in tools (Resume Analysis, Job Fit, Job Listings) for detailed analysis.
- Be supportive and encouraging — job searching can be stressful.
- You can respond in both Korean and English. Match the user's language.
- Keep responses concise but helpful. Use bullet points for clarity.`;

export function registerChatRoutes(app: Express) {
  const openai = createLLMProvider();

  app.post("/api/chat", async (req, res) => {
    try {
      // AIChatBox sends { message: lastMessage, chatId, userId } via prepareSendMessagesRequest
      // The message is a UIMessage with { parts: [{type: 'text', text: '...'}], role, id }
      // Legacy callers may send { messages: [...] } with plain text content
      // AI SDK v6 streamText requires ModelMessage[] format
      let uiMessages = req.body.messages;
      if (!uiMessages || !Array.isArray(uiMessages)) {
        const singleMessage = req.body.message;
        if (singleMessage) {
          uiMessages = [singleMessage];
        } else {
          res.status(400).json({ error: "messages array is required" });
          return;
        }
      }

      // Convert UIMessage[] (with parts) to ModelMessage[] for streamText
      // convertToModelMessages is async in AI SDK v6
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let modelMessages: any[];
      try {
        modelMessages = await convertToModelMessages(uiMessages);
      } catch {
        // Fallback: messages may already be in ModelMessage format (plain content string)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        modelMessages = uiMessages.map((m: any) => ({
          role: m.role,
          content: typeof m.content === 'string'
            ? m.content
            : (m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text ?? '').join('') ?? ''),
        }));
      }

      // Build personalized system prompt with user profile if available
      let systemPrompt = CAREER_SYSTEM_PROMPT;
      try {
        const authResult = await sdk.authenticateRequest(req);
        if (authResult?.id) {
          const profile = await db.getUserProfile(authResult.id);
          if (profile && (profile.fullName || profile.skills || profile.experience)) {
            const skills = (profile.skills as string[] | null) ?? [];
            const experience = (profile.experience as {company: string; role: string; period: string}[] | null) ?? [];
            const education = (profile.education as {school: string; degree: string; field: string}[] | null) ?? [];
            const profileContext = `

## User Profile (Personalization Context)
Name: ${profile.fullName || 'Not provided'}
Headline: ${profile.headline || 'Not provided'}
Location: ${profile.location || 'Not provided'}
Target Role: ${profile.targetRole || 'Not provided'}
Target Location: ${profile.targetLocation || 'Not provided'}
Target Salary: ${profile.targetSalary || 'Not provided'}
Visa Status: ${profile.visaStatus || 'Not provided'}
Skills: ${skills.length > 0 ? skills.join(', ') : 'Not provided'}
Work Experience: ${experience.length > 0 ? experience.map(e => `${e.role} at ${e.company} (${e.period})`).join('; ') : 'Not provided'}
Education: ${education.length > 0 ? education.map(e => `${e.degree} in ${e.field} from ${e.school}`).join('; ') : 'Not provided'}

Use this profile to provide highly personalized career advice. Reference their specific background, skills, and goals when giving recommendations.`;
            systemPrompt = CAREER_SYSTEM_PROMPT + profileContext;
          }
        }
      } catch {
        // Profile fetch failed, use default system prompt
      }

      const result = streamText({
        model: openai.chat("gemini-2.5-flash"),
        system: systemPrompt,
        messages: modelMessages,
        tools: careerTools,
        stopWhen: stepCountIs(5),
      });

      result.pipeUIMessageStreamToResponse(res);
    } catch (error) {
      console.error("[/api/chat] Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });
}

export { careerTools as tools };
