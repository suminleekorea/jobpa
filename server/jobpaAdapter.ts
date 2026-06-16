import * as db from "./db";
import { DEMO_JOBS } from "./demoData";
import { fetchAllJobs, type JobListing } from "./jobFetcher";

export type DataMode = "live" | "cached" | "demo" | "offline";

export interface JobAdapterResult {
  jobs: JobListing[];
  total: number;
  sources: Record<string, number>;
  mode: DataMode;
  message?: string;
}

function countSources(jobs: JobListing[]) {
  return jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.source] = (acc[job.source] || 0) + 1;
    return acc;
  }, {});
}

function dbJobToListing(job: any): JobListing {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location || "remote",
    salary: job.salary || undefined,
    source: (job.source || "other") as JobListing["source"],
    applyUrl: job.applyUrl || "#",
    visa: Boolean(job.visa),
    type: job.type || "fulltime",
    experience: job.experience || "mid",
    industry: job.industry || "others",
    posted: job.posted ?? 0,
    remote: Boolean(job.remote),
    description: job.description || "",
    closingDate: job.closingDate || undefined,
    skills: Array.isArray(job.skills) ? job.skills : [],
  };
}

function listingToDbJob(job: JobListing) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    source: job.source,
    applyUrl: job.applyUrl,
    visa: job.visa,
    type: job.type,
    experience: job.experience,
    industry: job.industry,
    posted: job.posted,
    remote: job.remote,
    description: job.description,
    closingDate: job.closingDate,
    skills: job.skills ?? [],
    raw: job,
  };
}

function filterDemoJobs(options?: { search?: string; location?: string; limit?: number }) {
  const search = options?.search?.trim().toLowerCase();
  const location = options?.location && options.location !== "all" ? options.location : undefined;
  return DEMO_JOBS
    .filter(job => !location || job.location === location || job.remote)
    .filter(job => {
      if (!search) return true;
      const haystack = `${job.title} ${job.company} ${job.description} ${(job.skills ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(search);
    })
    .slice(0, options?.limit ?? 100);
}

async function recordHealth(service: string, status: string, startedAt: number, message?: string, fallbackUsed = false) {
  await db.recordApiHealth({
    service,
    status,
    message,
    responseMs: Date.now() - startedAt,
    fallbackUsed,
  });
}

export async function fetchJobs(options?: { search?: string; location?: string; limit?: number }): Promise<JobAdapterResult> {
  const startedAt = Date.now();
  try {
    const live = await fetchAllJobs(options);
    if (live.jobs.length > 0) {
      db.upsertCachedJobs(live.jobs.map(listingToDbJob)).catch(error => {
        console.warn("[JobPA Adapter] Job cache write skipped:", error?.message || error);
      });
      await recordHealth("jobs.live", "ok", startedAt);
      return {
        ...live,
        mode: "live",
      };
    }
    throw new Error("Live job APIs returned no jobs");
  } catch (error: any) {
    const liveMessage = error?.message || "Live job APIs unavailable";
    console.warn("[JobPA Adapter] Live job fetch failed:", liveMessage);
    await recordHealth("jobs.live", "degraded", startedAt, liveMessage, true);

    try {
      const cached = await db.getCachedJobs(options);
      if (cached.length > 0) {
        const jobs = cached.map(dbJobToListing);
        return {
          jobs,
          total: jobs.length,
          sources: countSources(jobs),
          mode: "cached",
          message: "Live job APIs are temporarily unavailable. Showing cached database results.",
        };
      }
    } catch (cacheError: any) {
      console.warn("[JobPA Adapter] Cached job fallback failed:", cacheError?.message || cacheError);
    }

    const jobs = filterDemoJobs(options);
    return {
      jobs,
      total: jobs.length,
      sources: countSources(jobs),
      mode: "demo",
      message: "Live job APIs and cached database results are unavailable. Showing sanitized demo jobs for review.",
    };
  }
}

export async function searchJobs(options?: { search?: string; location?: string; limit?: number }) {
  return fetchJobs(options);
}

export async function saveJob(userId: number, job: JobListing, notes?: string) {
  const snapshot = { ...job };
  let savedJobResult: unknown = null;
  let applicationResult: unknown = null;

  try {
    savedJobResult = await db.saveSavedJob(userId, {
      jobId: job.id,
      status: "saved",
      notes,
      snapshot,
    });
  } catch (error: any) {
    console.warn("[JobPA Adapter] saved_jobs write skipped:", error?.message || error);
  }

  try {
    applicationResult = await db.saveApplication({
      userId,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      applyUrl: job.applyUrl,
      source: job.source,
      status: "bookmarked",
      salary: job.salary,
      notes,
    });
    await db.awardXP(userId, "apply", "Saved a job").catch(() => undefined);
  } catch (error: any) {
    console.warn("[JobPA Adapter] bookmark application write skipped:", error?.message || error);
  }

  if (!savedJobResult && !applicationResult) {
    return { offline: true, mode: "offline" as const, message: "Database unavailable. Job was not persisted." };
  }

  return { savedJob: savedJobResult, application: applicationResult, mode: "live" as const };
}

export async function createApplication(userId: number, input: {
  jobTitle: string;
  company: string;
  location?: string;
  applyUrl?: string;
  source?: string;
  status?: "applied" | "interview" | "offer" | "rejected" | "withdrawn" | "bookmarked";
  salary?: string;
  visaType?: string;
  notes?: string;
}) {
  try {
    const result = await db.saveApplication({ userId, status: "applied", ...input });
    await db.awardXP(userId, "apply", "Tracked an application").catch(() => undefined);
    return result;
  } catch (error: any) {
    console.warn("[JobPA Adapter] Application write failed:", error?.message || error);
    return {
      id: -Date.now(),
      userId,
      ...input,
      status: input.status ?? "applied",
      offline: true,
      message: "Database unavailable. Application was not persisted.",
      createdAt: new Date(),
      updatedAt: new Date(),
      appliedAt: new Date(),
    };
  }
}

export async function updateApplicationStatus(userId: number, id: number, status: string, notes?: string) {
  try {
    await db.updateApplicationStatus(id, userId, status, notes);
    return { success: true, mode: "live" as const };
  } catch (error: any) {
    console.warn("[JobPA Adapter] Application status update failed:", error?.message || error);
    return { success: false, mode: "offline" as const, message: "Database unavailable. Status was not persisted." };
  }
}

export async function getUserProfile(userId: number) {
  const [careerProfile, legacyProfile, survey] = await Promise.all([
    db.getCareerProfile(userId).catch(() => null),
    db.getUserProfile(userId).catch(() => null),
    db.getSurveyByUserId(userId).catch(() => null),
  ]);

  if (!careerProfile && !legacyProfile && !survey) return null;

  return {
    ...(legacyProfile ?? {}),
    ...(careerProfile ?? {}),
    survey,
    targetRole: careerProfile?.targetRole ?? legacyProfile?.targetRole ?? survey?.targetRole ?? null,
    targetLocation:
      legacyProfile?.targetLocation ??
      careerProfile?.market ??
      (Array.isArray(survey?.preferredLocations) ? survey?.preferredLocations?.[0] : null),
    targetSalary: legacyProfile?.targetSalary ?? careerProfile?.salaryRange ?? survey?.salaryExpectation ?? null,
    visaStatus: legacyProfile?.visaStatus ?? careerProfile?.visaStatus ?? (survey?.needsVisaSponsorship ? "Needs sponsorship" : null),
    interests: careerProfile?.interests ?? survey?.interests ?? [],
  };
}

export async function saveUserProfile(userId: number, input: Record<string, any>) {
  const careerData = {
    interests: input.interests ?? input.skills ?? [],
    targetCountries: input.targetCountries ?? input.preferredLocations ?? (input.targetLocation ? [input.targetLocation] : []),
    targetRole: input.targetRole,
    experienceLevel: input.experienceLevel,
    salaryRange: input.salaryRange ?? input.targetSalary,
    visaStatus: input.visaStatus,
    preferredLanguage: input.preferredLanguage,
    languages: input.languages,
    market: input.market ?? input.targetLocation,
    profileSummary: input.profileSummary ?? input.summary,
    agentState: input.agentState,
  };

  const legacyData = {
    fullName: input.fullName,
    headline: input.headline,
    email: input.email,
    phone: input.phone,
    location: input.location,
    skills: input.skills,
    experience: input.experience,
    education: input.education,
    targetRole: input.targetRole,
    targetLocation: input.targetLocation ?? input.market,
    targetSalary: input.targetSalary ?? input.salaryRange,
    visaStatus: input.visaStatus,
    linkedinUrl: input.linkedinUrl,
    portfolioUrl: input.portfolioUrl,
    summary: input.summary ?? input.profileSummary,
  };

  const [careerResult, legacyResult] = await Promise.all([
    db.upsertCareerProfile(userId, careerData).catch(error => {
      console.warn("[JobPA Adapter] career profile write skipped:", error?.message || error);
      return null;
    }),
    db.upsertUserProfile(userId, legacyData).catch(error => {
      console.warn("[JobPA Adapter] legacy profile write skipped:", error?.message || error);
      return null;
    }),
  ]);

  if (!careerResult && !legacyResult) {
    return { offline: true, mode: "offline" as const, message: "Database unavailable. Profile was not persisted.", ...input };
  }

  return { careerProfile: careerResult, userProfile: legacyResult, mode: "live" as const };
}

export async function createResumeAnalysis(input: {
  userId: number;
  resumeId?: number;
  source?: string;
  fileName?: string;
  resumeText?: string;
  targetRole?: string;
  targetMarket?: string;
  status: "pending" | "success" | "partial" | "failed";
  parseMethod?: string;
  parseWarning?: string;
  errorMessage?: string;
  overallScore?: number;
  summary?: string;
  strengths?: unknown;
  improvements?: unknown;
  keywords?: unknown;
  rawResult?: unknown;
}) {
  try {
    return await db.createResumeAnalysis(input);
  } catch (error: any) {
    console.warn("[JobPA Adapter] resume_analyses write skipped:", error?.message || error);
    return { offline: true, mode: "offline" as const, message: "Database unavailable. Analysis status was not persisted." };
  }
}

export async function createJobFitEvaluation(userId: number, input: {
  jobId?: string;
  targetRole?: string;
  jobTitle?: string;
  company?: string;
  jobDescription: string;
  fitScore?: number;
  status?: string;
  result?: unknown;
}) {
  const [newResult, legacyResult] = await Promise.all([
    db.createJobFitEvaluation({ userId, ...input }).catch(error => {
      console.warn("[JobPA Adapter] job_fit_evaluations write skipped:", error?.message || error);
      return null;
    }),
    db.saveFitEvaluation(userId, {
      targetRole: input.targetRole,
      jobDescription: input.jobDescription,
      fitScore: input.fitScore,
      result: input.result,
    }).catch(error => {
      console.warn("[JobPA Adapter] legacy fit evaluation write skipped:", error?.message || error);
      return null;
    }),
  ]);

  if (!newResult && !legacyResult) {
    return { offline: true, mode: "offline" as const, message: "Database unavailable. Fit evaluation was not persisted.", ...input };
  }

  return { jobFitEvaluation: newResult, legacyFitEvaluation: legacyResult, mode: "live" as const, ...input };
}
