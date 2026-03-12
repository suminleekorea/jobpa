import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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

  consulting: router({
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
  }),
});

export type AppRouter = typeof appRouter;
