import { COOKIE_NAME } from "@shared/const";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { fetchAllJobs } from "./jobFetcher";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  survey: router({
    save: protectedProcedure.input(z.object({
      lookingFor: z.array(z.string()).optional(),
      targetRole: z.string().optional(),
      experienceLevel: z.string().optional(),
      interests: z.array(z.string()).optional(),
      targetCompanies: z.string().optional(),
      preferredLocations: z.array(z.string()).optional(),
      salaryExpectation: z.string().optional(),
      needsVisaSponsorship: z.boolean().optional(),
      preferredJobTypes: z.array(z.string()).optional(),
      howHeardAbout: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.saveSurvey({ userId: ctx.user.id, ...input });
    }),
    get: protectedProcedure.query(async ({ ctx }) => {
      const survey = await db.getSurveyByUserId(ctx.user.id);
      return survey ?? null;
    }),
  }),

  application: router({
    save: protectedProcedure.input(z.object({
      jobTitle: z.string(),
      company: z.string(),
      location: z.string().optional(),
      applyUrl: z.string().optional(),
      source: z.string().optional(),
      status: z.enum(["applied", "interview", "offer", "rejected", "withdrawn", "bookmarked"]).default("applied"),
      salary: z.string().optional(),
      visaType: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.saveApplication({ userId: ctx.user.id, ...input });
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getApplicationsByUserId(ctx.user.id);
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["applied", "interview", "offer", "rejected", "withdrawn", "bookmarked"]),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.updateApplicationStatus(input.id, ctx.user.id, input.status, input.notes);
    }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      return db.deleteApplication(input.id, ctx.user.id);
    }),
  }),

  resume: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const resume = await db.getResumeByUserId(ctx.user.id);
      return resume ?? null;
    }),
    save: protectedProcedure.input(z.object({
      fileName: z.string().optional(),
      fileUrl: z.string().optional(),
      fileKey: z.string().optional(),
      analysisResult: z.any().optional(),
      overallScore: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.saveResume(ctx.user.id, input);
    }),
  }),

  fit: router({
    evaluate: protectedProcedure.input(z.object({
      targetRole: z.string().optional(),
      jobDescription: z.string(),
    })).mutation(async ({ ctx, input }) => {
      // Validate resume exists
      const resume = await db.getResumeByUserId(ctx.user.id);
      if (!resume || !resume.analysisResult) {
        throw new Error("Please upload and analyze your resume first.");
      }
      // Save evaluation placeholder (AI analysis would go here)
      return db.saveFitEvaluation(ctx.user.id, {
        targetRole: input.targetRole,
        jobDescription: input.jobDescription,
        fitScore: undefined,
        result: undefined,
      });
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      return db.getFitEvaluationsByUserId(ctx.user.id);
    }),
  }),

  report: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getReportsByUserId(ctx.user.id);
    }),
    generate: protectedProcedure.mutation(async ({ ctx }) => {
      // Gather user data for personalized report
      const [applications, latestResume, goal, checklist] = await Promise.all([
        db.getApplicationsByUserId(ctx.user.id),
        db.getLatestResumeAnalysis(ctx.user.id),
        db.getGoalByUserId(ctx.user.id),
        db.getChecklistByDate(ctx.user.id, new Date().toISOString().split("T")[0]),
      ]);

      const baseURL = `${process.env.BUILT_IN_FORGE_API_URL}/v1`;
      const openai = createOpenAI({ apiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "", baseURL });

      const appSummary = applications?.slice(0, 5).map((a: any) => `${a.company} - ${a.position} (${a.status})`).join(", ") || "No applications yet";
      const resumeScore = latestResume?.overallScore ? `${latestResume.overallScore}/100` : "Not analyzed yet";
      const goalText = goal?.targetRole ? `Target: ${goal.targetRole} in ${goal.targetJobType || "any field"}` : "No goal set";
      const checklistDone = checklist?.filter((c: any) => c.isCompleted).length || 0;
      const checklistTotal = checklist?.length || 0;

      const prompt = `You are a career coach AI. Generate a concise, encouraging daily career report for a job seeker.

User data:
- Recent applications: ${appSummary}
- Resume score: ${resumeScore}
- Career goal: ${goalText}
- Today's checklist: ${checklistDone}/${checklistTotal} tasks completed

Write a personalized daily report with:
1. **Today's Progress** - What they've accomplished
2. **Key Insights** - 2-3 specific observations about their job search
3. **Tomorrow's Focus** - 3 concrete action items
4. **Motivation** - One encouraging sentence

Keep it concise (under 300 words). Use markdown formatting. Be specific and actionable, not generic.`;

      try {
        const { text } = await generateText({
          model: openai.chat("gemini-2.5-flash"),
          prompt,
          maxOutputTokens: 500,
        });

        return db.saveReport(ctx.user.id, {
          title: `Daily Report - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
          content: text,
          reportType: "daily",
        });
      } catch {
        return db.saveReport(ctx.user.id, {
          title: `Daily Report - ${new Date().toLocaleDateString()}`,
          content: `## Today's Career Progress\n\nYour job search is on track! Keep applying consistently.\n\n**Applications:** ${appSummary}\n\n**Resume Score:** ${resumeScore}\n\n**Goal:** ${goalText}\n\n**Checklist:** ${checklistDone}/${checklistTotal} tasks completed today.`,
          reportType: "daily",
        });
      }
    }),
  }),

  goal: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const goal = await db.getGoalByUserId(ctx.user.id);
      return goal ?? null;
    }),
    save: protectedProcedure.input(z.object({
      targetJobType: z.string().optional(),
      targetRole: z.string().optional(),
      targetCompany: z.string().optional(),
      deadlineMonths: z.number().optional(),
      weeklyApplicationTarget: z.number().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.saveGoal(ctx.user.id, input);
    }),
  }),

  emailAlert: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const alert = await db.getEmailAlertByUserId(ctx.user.id);
      return alert ?? null;
    }),
    save: protectedProcedure.input(z.object({
      targetRoles: z.array(z.string()).optional(),
      targetLocations: z.array(z.string()).optional(),
      frequency: z.string().optional(),
      isActive: z.boolean().optional(),
      email: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.saveEmailAlert(ctx.user.id, input);
    }),
  }),

  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return db.getAdminStats();
    }),
    users: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return db.getAllUsers();
    }),
  }),

  jobs: router({
    list: publicProcedure.input(z.object({
      search: z.string().optional(),
      location: z.string().optional(),
      limit: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      const result = await fetchAllJobs({
        search: input?.search,
        location: input?.location,
        limit: input?.limit || 100,
      });
      return result;
    }),
  }),

  consulting: router({
    // Legacy waitlist (keep for backwards compat)
    joinWaitlist: publicProcedure.input(z.object({
      name: z.string().optional(),
      email: z.string().email(),
      interests: z.array(z.string()).optional(),
      message: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      return db.joinConsultingWaitlist({ ...input, userId: userId ?? undefined });
    }),
    getWaitlist: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return db.getConsultingWaitlist();
    }),
    // Marketplace: list approved consultants
    list: publicProcedure.query(async () => {
      return db.getApprovedConsultants();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const consultant = await db.getConsultantById(input.id);
      return consultant ?? null;
    }),
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getConsultantByUserId(ctx.user.id);
      return profile ?? null;
    }),
    myApplication: protectedProcedure.query(async ({ ctx }) => {
      const app = await db.getConsultingApplicationByUserId(ctx.user.id);
      return app ?? null;
    }),
    applyConsultant: protectedProcedure.input(z.object({
      displayName: z.string().min(2),
      title: z.string().optional(),
      bio: z.string().optional(),
      specialties: z.array(z.string()).optional(),
      targetRegions: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      yearsExperience: z.number().optional(),
      linkedinUrl: z.string().optional(),
      motivation: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.applyToBeConsultant(ctx.user.id, input);
    }),
    allApplications: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new Error('Forbidden');
      return db.getAllConsultingApplications();
    }),
    approveApplication: protectedProcedure.input(z.object({
      applicationId: z.number(),
      userId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new Error('Forbidden');
      return db.approveConsultantApplication(input.applicationId, input.userId);
    }),
    myCredits: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserCredits(ctx.user.id);
    }),
    creditHistory: protectedProcedure.query(async ({ ctx }) => {
      return db.getCreditTransactions(ctx.user.id);
    }),
    bookSession: protectedProcedure.input(z.object({
      consultantId: z.number(),
      topic: z.string().optional(),
      scheduledAt: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const consultantList = await db.getApprovedConsultants();
      const c = consultantList.find(c => c.id === input.consultantId);
      if (!c) throw new Error('Consultant not found');
      return db.bookConsultingSession(ctx.user.id, {
        consultantId: input.consultantId,
        creditsCharged: c.sessionPriceCredits ?? 10,
        topic: input.topic,
        scheduledAt: input.scheduledAt,
      });
    }),
    mySessions: protectedProcedure.query(async ({ ctx }) => {
      return db.getSessionsByUser(ctx.user.id);
    }),
  }),

  gamification: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrCreateUserXP(ctx.user.id);
    }),
    awardXP: protectedProcedure.input(z.object({
      action: z.string(),
      description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.awardXP(ctx.user.id, input.action, input.description);
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      return db.getXPHistory(ctx.user.id);
    }),
  }),

  checklist: router({
    get: protectedProcedure.input(z.object({
      date: z.string(),
    })).query(async ({ ctx, input }) => {
      return db.getChecklistByDate(ctx.user.id, input.date);
    }),
    add: protectedProcedure.input(z.object({
      date: z.string(),
      title: z.string(),
      category: z.string().optional(),
      isAIGenerated: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.addChecklistItem(ctx.user.id, input);
    }),
    toggle: protectedProcedure.input(z.object({
      id: z.number(),
      isCompleted: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      await db.toggleChecklistItem(input.id, ctx.user.id, input.isCompleted);
      // Award XP when completing
      if (input.isCompleted) {
        await db.awardXP(ctx.user.id, "checklist", "Completed a checklist item");
      }
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      return db.deleteChecklistItem(input.id, ctx.user.id);
    }),
  }),

  journal: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getJournalEntries(ctx.user.id);
    }),
    getByDate: protectedProcedure.input(z.object({
      date: z.string(),
    })).query(async ({ ctx, input }) => {
      const entry = await db.getJournalByDate(ctx.user.id, input.date);
      return entry ?? null;
    }),
    save: protectedProcedure.input(z.object({
      date: z.string(),
      mood: z.string().optional(),
      content: z.string().optional(),
      highlights: z.array(z.string()).optional(),
      goals: z.array(z.string()).optional(),
    })).mutation(async ({ ctx, input }) => {
      const result = await db.saveJournalEntry(ctx.user.id, input);
      await db.awardXP(ctx.user.id, "journal", "Wrote a journal entry");
      return result;
    }),
  }),

  chat: router({
    sessions: protectedProcedure.query(async ({ ctx }) => {
      return db.getChatSessions(ctx.user.id);
    }),
    messages: protectedProcedure.input(z.object({
      sessionId: z.string(),
    })).query(async ({ ctx, input }) => {
      return db.getChatMessages(ctx.user.id, input.sessionId);
    }),
    saveMessage: protectedProcedure.input(z.object({
      sessionId: z.string(),
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      sessionTitle: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.upsertChatSession(ctx.user.id, input.sessionId, input.sessionTitle);
      return db.saveChatMessage(ctx.user.id, input.sessionId, input.role, input.content);
    }),
    deleteSession: protectedProcedure.input(z.object({
      sessionId: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await db.deleteChatSession(ctx.user.id, input.sessionId);
      return { success: true };
    }),
  }),

  resumeAnalysis: router({
    history: protectedProcedure.query(async ({ ctx }) => {
      return db.getResumeAnalysisHistory(ctx.user.id);
    }),
    latest: protectedProcedure.query(async ({ ctx }) => {
      const analysis = await db.getLatestResumeAnalysis(ctx.user.id);
      return analysis ?? null;
    }),
    save: protectedProcedure.input(z.object({
      resumeText: z.string().optional(),
      targetRole: z.string().optional(),
      targetMarket: z.string().optional(),
      overallScore: z.number().optional(),
      summary: z.string().optional(),
      strengths: z.array(z.string()).optional(),
      improvements: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
      rawResult: z.any().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.saveResumeAnalysisResult(ctx.user.id, input);
    }),
  }),

  reviews: router({
    // Public: get all approved reviews
    list: publicProcedure.query(async () => {
      return db.getApprovedReviews();
    }),
    // Protected: submit a review
    submit: protectedProcedure.input(z.object({
      rating: z.number().min(1).max(5),
      comment: z.string().min(10).max(1000),
      displayName: z.string().max(128).optional(),
      targetRole: z.string().max(128).optional(),
      targetMarket: z.string().max(64).optional(),
      isAnonymous: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.submitReview(ctx.user.id, input);
    }),
    // Protected: get my own reviews
    mine: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserReviews(ctx.user.id);
    }),
  }),
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProfile(ctx.user.id);
    }),
    upsert: protectedProcedure.input(z.object({
      fullName: z.string().optional(),
      headline: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      skills: z.array(z.string()).optional(),
      experience: z.array(z.object({
        company: z.string(),
        role: z.string(),
        period: z.string(),
        description: z.string(),
      })).optional(),
      education: z.array(z.object({
        school: z.string(),
        degree: z.string(),
        field: z.string(),
        period: z.string(),
      })).optional(),
      targetRole: z.string().optional(),
      targetLocation: z.string().optional(),
      targetSalary: z.string().optional(),
      visaStatus: z.string().optional(),
      linkedinUrl: z.string().optional(),
      portfolioUrl: z.string().optional(),
      summary: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      return db.upsertUserProfile(ctx.user.id, input);
    }),
  }),

  trend: router({
    generate: protectedProcedure.input(z.object({
      sector: z.string().optional(),
      region: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const baseURL2 = `${process.env.BUILT_IN_FORGE_API_URL}/v1`;
      const openai = createOpenAI({ apiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "", baseURL: baseURL2 });
      const sector = input.sector || "all sectors";
      const region = input.region || "Singapore, Korea, India";
      const today = new Date().toISOString().split("T")[0];
      const prompt = `You are a career market analyst specializing in Singapore, Korea, and India job markets.
Generate a comprehensive industry trends report for ${sector} in ${region} as of ${today}.

Include:
## Hot Skills in Demand
List the top 5-8 skills most in demand right now with brief explanations.

## Salary Trends
Describe current salary trends (realistic ranges in SGD for Singapore, KRW for Korea, INR for India).

## Top Hiring Companies
List 5-8 companies actively hiring in this sector in these regions.

## Market Insights
Key observations about the job market and opportunities for Korean and Indian professionals in Singapore.

## Action Items
3-5 specific actionable recommendations for job seekers targeting these markets.

Be specific, data-driven, and practical. Use real company names and realistic figures.`;

      const { text } = await generateText({
        model: openai("gemini-2.5-flash"),
        prompt,
        maxOutputTokens: 1200,
      });

      return {
        content: text,
        sector,
        region,
        generatedAt: new Date().toISOString(),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
