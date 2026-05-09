import { COOKIE_NAME } from "@shared/const";
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
      return db.getSurveyByUserId(ctx.user.id);
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
      return db.getResumeByUserId(ctx.user.id);
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
      return db.saveReport(ctx.user.id, {
        title: `Daily Report - ${new Date().toLocaleDateString()}`,
        content: "Report generation in progress...",
        reportType: "daily",
      });
    }),
  }),

  goal: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getGoalByUserId(ctx.user.id);
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
      return db.getEmailAlertByUserId(ctx.user.id);
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
      return db.getConsultantById(input.id);
    }),
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      return db.getConsultantByUserId(ctx.user.id);
    }),
    myApplication: protectedProcedure.query(async ({ ctx }) => {
      return db.getConsultingApplicationByUserId(ctx.user.id);
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
      return db.getJournalByDate(ctx.user.id, input.date);
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
});

export type AppRouter = typeof appRouter;
