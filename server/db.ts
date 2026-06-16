import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, surveys, applications, resumes, fitEvaluations,
  reports, goals, emailAlerts, consultingWaitlist,
  oauthAccounts, emailAccounts, emailMessages,
  userXP, xpEvents, dailyChecklist, journal,
  consultants, consultingApplications, consultingSessions, userCredits, creditTransactions,
  chatSessions, chatMessages, resumeAnalysisResults, reviews,
  userProfiles, passwordResetTokens, careerProfiles, jobs, savedJobs, resumeAnalyses, jobFitEvaluations,
  interviewPreps, agentTasks, apiHealthLogs,
  type InsertSurvey, type InsertApplication, type Survey, type Application,
  type InsertUserXP, type InsertDailyChecklistItem, type InsertJournalEntry,
  type InsertUserProfile, type InsertCareerProfile, type InsertJob,
  type InsertSavedJob, type InsertResumeAnalysis, type InsertJobFitEvaluation,
  type InsertInterviewPrep, type InsertAgentTask, type InsertApiHealthLog,
  type InsertEmailAccount, type InsertEmailMessage,
} from "../drizzle/schema";
import { isAdminEmail } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) {
      console.warn("[Database] Failed to connect:", error); _db = null;
    }
  }
  return _db;
}

function roleForEmail(email?: string | null): "admin" | "user" {
  return isAdminEmail(email) ? "admin" : "user";
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const user = result[0];
  if (!user) return undefined;
  if (isAdminEmail(user.email) && user.role !== "admin") {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, id));
    return { ...user, role: "admin" as const };
  }
  return user;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = result[0];
  if (!user) return undefined;
  if (isAdminEmail(user.email) && user.role !== "admin") {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
    return { ...user, role: "admin" as const };
  }
  return user;
}

export async function createUserWithPassword(data: { email: string; passwordHash: string; name?: string }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const email = data.email.trim().toLowerCase();
  const result = await db.insert(users).values({
    email,
    passwordHash: data.passwordHash,
    name: data.name ?? null,
    loginMethod: "email",
    role: roleForEmail(email),
    lastSignedIn: new Date(),
  });
  return (result[0] as any).insertId as number;
}

function mergeLoginMethod(existing: string | null | undefined, provider: string) {
  const parts = new Set((existing || "").split("+").filter(Boolean));
  parts.add(provider);
  return Array.from(parts).join("+");
}

export async function upsertOAuthUser(data: {
  provider: string;
  providerUserId: string;
  email: string;
  name?: string;
  scopes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const email = data.email.trim().toLowerCase();
  const role = roleForEmail(email);

  const linked = await db.select().from(oauthAccounts).where(
    and(eq(oauthAccounts.provider, data.provider), eq(oauthAccounts.providerUserId, data.providerUserId))
  ).limit(1);

  if (linked.length > 0) {
    const user = await getUserById(linked[0].userId);
    if (!user) throw new Error("Linked OAuth user not found");
    await db.update(users).set({
      email: user.email || email,
      name: user.name || data.name || null,
      loginMethod: mergeLoginMethod(user.loginMethod, data.provider),
      role: role === "admin" ? "admin" : user.role,
      lastSignedIn: new Date(),
    }).where(eq(users.id, user.id));
    await db.update(oauthAccounts).set({
      email,
      scopes: data.scopes,
    }).where(eq(oauthAccounts.id, linked[0].id));
    return (await getUserById(user.id))!;
  }

  let user = await getUserByEmail(email);
  if (!user) {
    const result = await db.insert(users).values({
      email,
      name: data.name ?? null,
      loginMethod: data.provider,
      role,
      lastSignedIn: new Date(),
    });
    const insertedId = (result[0] as any).insertId as number;
    user = await getUserById(insertedId);
  } else {
    await db.update(users).set({
      name: user.name || data.name || null,
      loginMethod: mergeLoginMethod(user.loginMethod, data.provider),
      role: role === "admin" ? "admin" : user.role,
      lastSignedIn: new Date(),
    }).where(eq(users.id, user.id));
    user = await getUserById(user.id);
  }

  if (!user) throw new Error("OAuth user could not be created");

  await db.insert(oauthAccounts).values({
    userId: user.id,
    provider: data.provider,
    providerUserId: data.providerUserId,
    email,
    scopes: data.scopes,
  }).onDuplicateKeyUpdate({
    set: {
      userId: user.id,
      email,
      scopes: data.scopes,
    },
  });

  return user;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId && !user.email) throw new Error("openId or email is required");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId ?? undefined };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field]; if (value === undefined) return;
      const normalized = value ?? null; values[field] = normalized; updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    if (isAdminEmail(values.email ?? user.email)) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Survey helpers
export async function saveSurvey(data: InsertSurvey) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const existing = await db.select().from(surveys).where(eq(surveys.userId, data.userId)).limit(1);
  if (existing.length > 0) {
    await db.update(surveys).set(data).where(eq(surveys.userId, data.userId));
    return existing[0];
  }
  const [result] = await db.insert(surveys).values(data).$returningId();
  return result;
}

export async function getSurveyByUserId(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(surveys).where(eq(surveys.userId, userId)).limit(1);
  return result[0];
}

// Application helpers
export async function saveApplication(data: InsertApplication) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(applications).values(data).$returningId();
  return result;
}

export async function getApplicationsByUserId(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
}

export async function updateApplicationStatus(id: number, userId: number, status: string, notes?: string) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const updateData: Record<string, unknown> = { status };
  if (notes !== undefined) updateData.notes = notes;
  await db.update(applications).set(updateData).where(and(eq(applications.id, id), eq(applications.userId, userId)));
}

export async function deleteApplication(id: number, userId: number) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  await db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, userId)));
}

// Resume helpers
export async function saveResume(userId: number, data: { fileName?: string; fileUrl?: string; fileKey?: string; analysisResult?: any; overallScore?: number }) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const existing = await db.select().from(resumes).where(eq(resumes.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(resumes).set(data).where(eq(resumes.userId, userId));
    return existing[0];
  }
  const [result] = await db.insert(resumes).values({ userId, ...data }).$returningId();
  return result;
}

export async function getResumeByUserId(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.createdAt)).limit(1);
  return result[0];
}

// Fit evaluation helpers
export async function saveFitEvaluation(userId: number, data: { targetRole?: string; jobDescription?: string; fitScore?: number; result?: any }) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(fitEvaluations).values({ userId, ...data }).$returningId();
  return result;
}

export async function getFitEvaluationsByUserId(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(fitEvaluations).where(eq(fitEvaluations.userId, userId)).orderBy(desc(fitEvaluations.createdAt));
}

// Report helpers
export async function saveReport(userId: number, data: { title?: string; content?: string; reportType?: string }) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(reports).values({ userId, ...data }).$returningId();
  return result;
}

export async function getReportsByUserId(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.createdAt));
}

// Goal helpers
export async function saveGoal(userId: number, data: Partial<typeof goals.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const existing = await db.select().from(goals).where(eq(goals.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(goals).set(data).where(eq(goals.userId, userId));
    return existing[0];
  }
  const [result] = await db.insert(goals).values({ userId, ...data }).$returningId();
  return result;
}

export async function getGoalByUserId(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(goals).where(eq(goals.userId, userId)).limit(1);
  return result[0];
}

// Email alert helpers
export async function saveEmailAlert(userId: number, data: Partial<typeof emailAlerts.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const existing = await db.select().from(emailAlerts).where(eq(emailAlerts.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(emailAlerts).set(data).where(eq(emailAlerts.userId, userId));
    return existing[0];
  }
  const [result] = await db.insert(emailAlerts).values({ userId, ...data }).$returningId();
  return result;
}

export async function getEmailAlertByUserId(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(emailAlerts).where(eq(emailAlerts.userId, userId)).limit(1);
  return result[0];
}

// Consulting waitlist helpers
export async function joinConsultingWaitlist(data: { userId?: number; name?: string; email: string; interests?: string[]; message?: string }) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(consultingWaitlist).values(data).$returningId();
  return result;
}

export async function getConsultingWaitlist() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(consultingWaitlist).orderBy(desc(consultingWaitlist.createdAt));
}

// Admin helpers
export async function getAdminStats() {
  const emptyAdminStats = {
    totalUsers: 0,
    totalApplications: 0,
    totalResumes: 0,
    totalResumeAnalyses: 0,
    totalJobFitEvaluations: 0,
    totalInterviewPreps: 0,
    totalReports: 0,
    totalChecklistItems: 0,
    totalJournalEntries: 0,
    totalChatSessions: 0,
    totalChatMessages: 0,
    totalAgentTasks: 0,
    totalEmailAccounts: 0,
    totalEmailMessages: 0,
    totalSavedJobs: 0,
    totalWaitlist: 0,
    active7: 0,
    active30: 0,
    profileManagedUsers: 0,
    resumeManagedUsers: 0,
    applicationUsers: 0,
    savedJobUsers: 0,
    fitUsers: 0,
    interviewPrepUsers: 0,
    longTermManagedUsers: 0,
    aiAssistedUsers: 0,
    journeyManagementScore: 0,
    applicationStatusCounts: { bookmarked: 0, applied: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0 },
    journeyFunnel: [] as Array<{ key: string; label: string; count: number; percent: number; description: string }>,
    agentTaskBreakdown: [] as Array<{ agent: string | null; status: string | null; count: number }>,
    apiHealthBreakdown: [] as Array<{ service: string | null; status: string | null; fallbackUsed: boolean; count: number }>,
    qualitativeInsights: ["Database is unavailable, so admin analytics are showing an offline empty state."],
    recentSignups: [] as any[],
  };
  const db = await getDb(); if (!db) return emptyAdminStats;
  const safeCount = async (table: any) => {
    try {
      const [row] = await db.select({ count: sql<number>`count(*)` }).from(table);
      return Number(row?.count ?? 0);
    } catch (error) {
      console.warn("[Admin] Count skipped:", error);
      return 0;
    }
  };
  const safeDistinctUsers = async (table: any, column: any) => {
    try {
      const [row] = await db.select({ count: sql<number>`count(distinct ${column})` }).from(table);
      return Number(row?.count ?? 0);
    } catch (error) {
      console.warn("[Admin] Distinct user count skipped:", error);
      return 0;
    }
  };
  const safePercent = (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : 0;

  const [
    totalUsers,
    totalApplications,
    totalResumes,
    totalResumeAnalyses,
    totalJobFitEvaluations,
    totalInterviewPreps,
    totalReports,
    totalChecklistItems,
    totalJournalEntries,
    totalChatSessions,
    totalChatMessages,
    totalAgentTasks,
    totalEmailAccounts,
    totalEmailMessages,
    totalSavedJobs,
    totalWaitlist,
    profileUsers,
    careerProfileUsers,
    resumeUsersLegacy,
    resumeAnalysisUsers,
    applicationUsers,
    savedJobUsers,
    fitUsers,
    interviewPrepUsers,
    reportUsers,
    checklistUsers,
    journalUsers,
    chatUsers,
    emailConnectedUsers,
  ] = await Promise.all([
    safeCount(users),
    safeCount(applications),
    safeCount(resumes),
    safeCount(resumeAnalyses),
    safeCount(jobFitEvaluations),
    safeCount(interviewPreps),
    safeCount(reports),
    safeCount(dailyChecklist),
    safeCount(journal),
    safeCount(chatSessions),
    safeCount(chatMessages),
    safeCount(agentTasks),
    safeCount(emailAccounts),
    safeCount(emailMessages),
    safeCount(savedJobs),
    safeCount(consultingWaitlist),
    safeDistinctUsers(userProfiles, userProfiles.userId),
    safeDistinctUsers(careerProfiles, careerProfiles.userId),
    safeDistinctUsers(resumes, resumes.userId),
    safeDistinctUsers(resumeAnalyses, resumeAnalyses.userId),
    safeDistinctUsers(applications, applications.userId),
    safeDistinctUsers(savedJobs, savedJobs.userId),
    safeDistinctUsers(jobFitEvaluations, jobFitEvaluations.userId),
    safeDistinctUsers(interviewPreps, interviewPreps.userId),
    safeDistinctUsers(reports, reports.userId),
    safeDistinctUsers(dailyChecklist, dailyChecklist.userId),
    safeDistinctUsers(journal, journal.userId),
    safeDistinctUsers(chatSessions, chatSessions.userId),
    safeDistinctUsers(emailAccounts, emailAccounts.userId),
  ]);

  const [active7, active30] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users).where(sql`${users.lastSignedIn} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`).then(([row]) => Number(row?.count ?? 0)).catch(() => 0),
    db.select({ count: sql<number>`count(*)` }).from(users).where(sql`${users.lastSignedIn} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`).then(([row]) => Number(row?.count ?? 0)).catch(() => 0),
  ]);

  const applicationStatusRows = await db.select({
    status: applications.status,
    count: sql<number>`count(*)`,
  }).from(applications).groupBy(applications.status).catch(() => []);
  const applicationStatusCounts: Record<string, number> = {
    bookmarked: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  };
  for (const row of applicationStatusRows) {
    applicationStatusCounts[String(row.status)] = Number(row.count ?? 0);
  }

  const agentRows = await db.select({
    agent: agentTasks.agent,
    status: agentTasks.status,
    count: sql<number>`count(*)`,
  }).from(agentTasks).groupBy(agentTasks.agent, agentTasks.status).catch(() => []);

  const apiHealthRows = await db.select({
    service: apiHealthLogs.service,
    status: apiHealthLogs.status,
    fallbackUsed: apiHealthLogs.fallbackUsed,
    count: sql<number>`count(*)`,
  }).from(apiHealthLogs).groupBy(apiHealthLogs.service, apiHealthLogs.status, apiHealthLogs.fallbackUsed).catch(() => []);

  const recentSignups = await db.select({
    date: sql<string>`DATE(createdAt)`,
    count: sql<number>`count(*)`,
  }).from(users).groupBy(sql`DATE(createdAt)`).orderBy(desc(sql`DATE(createdAt)`)).limit(30).catch(() => []);

  const profileManagedUsers = Math.max(profileUsers, careerProfileUsers);
  const resumeManagedUsers = Math.max(resumeUsersLegacy, resumeAnalysisUsers);
  const longTermManagedUsers = Math.max(reportUsers, checklistUsers, journalUsers);
  const aiAssistedUsers = Math.max(fitUsers, interviewPrepUsers, chatUsers, resumeAnalysisUsers);

  const journeyFunnel = [
    {
      key: "profile",
      label: "Profile understood",
      count: profileManagedUsers,
      percent: safePercent(profileManagedUsers, totalUsers),
      description: "Career profile, onboarding, goals, salary/visa/language context",
    },
    {
      key: "job_discovery",
      label: "Jobs saved",
      count: savedJobUsers,
      percent: safePercent(savedJobUsers, totalUsers),
      description: "Saved jobs and target opportunity curation",
    },
    {
      key: "resume",
      label: "Resume analyzed",
      count: resumeManagedUsers,
      percent: safePercent(resumeManagedUsers, totalUsers),
      description: "Resume analysis, gaps, keywords, and paste/upload fallback",
    },
    {
      key: "application",
      label: "Applications tracked",
      count: applicationUsers,
      percent: safePercent(applicationUsers, totalUsers),
      description: "Applied, interview, offer, rejection, and saved workflows",
    },
    {
      key: "fit",
      label: "Job fit evaluated",
      count: fitUsers,
      percent: safePercent(fitUsers, totalUsers),
      description: "Role/profile/resume fit scoring and strategy",
    },
    {
      key: "interview",
      label: "Interview prepared",
      count: interviewPrepUsers,
      percent: safePercent(interviewPrepUsers, totalUsers),
      description: "Likely questions, STAR stories, and follow-up emails",
    },
    {
      key: "career_management",
      label: "Long-term managed",
      count: longTermManagedUsers,
      percent: safePercent(longTermManagedUsers, totalUsers),
      description: "Reports, checklists, journal, and ongoing next actions",
    },
  ];

  const journeyManagementScore = Math.round(
    journeyFunnel.reduce((sum, item) => sum + item.percent, 0) / Math.max(journeyFunnel.length, 1)
  );

  const qualitativeInsights = [
    totalUsers === 0
      ? "No users yet. Keep the app in internal/staging review until auth, database, and onboarding are verified."
      : `${safePercent(active30, totalUsers)}% of users were active in the last 30 days; weekly active coverage is ${safePercent(active7, totalUsers)}%.`,
    profileManagedUsers < totalUsers
      ? "Some users have not completed career context. Push onboarding/profile CTAs before job recommendations."
      : "All tracked users have some profile context, so agent guidance can be role/market-aware.",
    resumeManagedUsers < applicationUsers
      ? "Some applicants are tracking jobs before resume analysis. Recommend resume upload or paste-text fallback earlier."
      : "Resume coverage is aligned with or ahead of application tracking.",
    applicationStatusCounts.interview > totalInterviewPreps
      ? "Interview-stage applications exceed generated prep. Surface Interview Prep as the next required action."
      : "Interview prep coverage is keeping pace with interview-stage activity.",
    totalReports + totalChecklistItems + totalJournalEntries > 0
      ? "Long-term career management is active through reports, checklists, or journal entries."
      : "Long-term management is not active yet. Add weekly reports and post-interview follow-up prompts.",
  ];

  return {
    totalUsers,
    totalApplications,
    totalResumes,
    totalResumeAnalyses,
    totalJobFitEvaluations,
    totalInterviewPreps,
    totalReports,
    totalChecklistItems,
    totalJournalEntries,
    totalChatSessions,
    totalChatMessages,
    totalAgentTasks,
    totalEmailAccounts,
    totalEmailMessages,
    totalSavedJobs,
    totalWaitlist,
    active7,
    active30,
    profileManagedUsers,
    resumeManagedUsers,
    applicationUsers,
    savedJobUsers,
    fitUsers,
    interviewPrepUsers,
    longTermManagedUsers,
    aiAssistedUsers,
    journeyManagementScore,
    applicationStatusCounts,
    journeyFunnel,
    agentTaskBreakdown: agentRows.map(row => ({
      agent: row.agent,
      status: row.status,
      count: Number(row.count ?? 0),
    })),
    apiHealthBreakdown: apiHealthRows.map(row => ({
      service: row.service,
      status: row.status,
      fallbackUsed: Boolean(row.fallbackUsed),
      count: Number(row.count ?? 0),
    })),
    qualitativeInsights,
    recentSignups,
  };
}

export async function getAllUsers() {
  const db = await getDb(); if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    loginMethod: users.loginMethod,
    role: users.role,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(desc(users.createdAt));
}

// ─── Gamification helpers ───────────────────────────────────────
const XP_ACTIONS: Record<string, number> = {
  apply: 50,
  checklist: 10,
  journal: 20,
  resume: 30,
  fit: 25,
  login: 5,
  streak_bonus: 15,
};

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

const BADGES: Record<string, { name: string; condition: (stats: any) => boolean }> = {
  first_apply: { name: "First Application", condition: (s) => s.totalApply >= 1 },
  apply_10: { name: "Job Hunter", condition: (s) => s.totalApply >= 10 },
  apply_50: { name: "Application Machine", condition: (s) => s.totalApply >= 50 },
  streak_3: { name: "3-Day Streak", condition: (s) => s.longestStreak >= 3 },
  streak_7: { name: "Week Warrior", condition: (s) => s.longestStreak >= 7 },
  streak_30: { name: "Monthly Master", condition: (s) => s.longestStreak >= 30 },
  journal_5: { name: "Reflective Mind", condition: (s) => s.totalJournal >= 5 },
  checklist_20: { name: "Task Crusher", condition: (s) => s.totalChecklist >= 20 },
  level_5: { name: "Rising Star", condition: (s) => s.level >= 5 },
  level_10: { name: "Career Pro", condition: (s) => s.level >= 10 },
};

export async function getOrCreateUserXP(userId: number) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const existing = await db.select().from(userXP).where(eq(userXP.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(userXP).values({ userId, totalXP: 0, level: 1, currentStreak: 0, longestStreak: 0, badges: [] });
  const created = await db.select().from(userXP).where(eq(userXP.userId, userId)).limit(1);
  return created[0];
}

export async function awardXP(userId: number, action: string, description?: string) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const xpAmount = XP_ACTIONS[action] || 5;

  // Record event
  await db.insert(xpEvents).values({ userId, action, xpAmount, description });

  // Update user XP
  const profile = await getOrCreateUserXP(userId);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let newStreak = profile.currentStreak;
  let newLongest = profile.longestStreak;

  if (profile.lastActiveDate !== today) {
    if (profile.lastActiveDate === yesterday) {
      newStreak = profile.currentStreak + 1;
    } else {
      newStreak = 1;
    }
    newLongest = Math.max(newLongest, newStreak);
  }

  const newXP = profile.totalXP + xpAmount;
  const newLevel = calculateLevel(newXP);

  // Check badges
  const stats = {
    totalApply: 0, totalJournal: 0, totalChecklist: 0,
    longestStreak: newLongest, level: newLevel,
  };
  const [applyCount] = await db.select({ count: sql<number>`count(*)` }).from(xpEvents).where(and(eq(xpEvents.userId, userId), eq(xpEvents.action, "apply")));
  const [journalCount] = await db.select({ count: sql<number>`count(*)` }).from(xpEvents).where(and(eq(xpEvents.userId, userId), eq(xpEvents.action, "journal")));
  const [checklistCount] = await db.select({ count: sql<number>`count(*)` }).from(xpEvents).where(and(eq(xpEvents.userId, userId), eq(xpEvents.action, "checklist")));
  stats.totalApply = applyCount.count;
  stats.totalJournal = journalCount.count;
  stats.totalChecklist = checklistCount.count;

  const currentBadges = (profile.badges || []) as string[];
  const newBadges = [...currentBadges];
  for (const [key, badge] of Object.entries(BADGES)) {
    if (!newBadges.includes(key) && badge.condition(stats)) {
      newBadges.push(key);
    }
  }

  await db.update(userXP).set({
    totalXP: newXP,
    level: newLevel,
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastActiveDate: today,
    badges: newBadges,
  }).where(eq(userXP.userId, userId));

  return { totalXP: newXP, level: newLevel, xpGained: xpAmount, currentStreak: newStreak, badges: newBadges };
}

export async function getXPHistory(userId: number, limit: number = 20) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(xpEvents).where(eq(xpEvents.userId, userId)).orderBy(desc(xpEvents.createdAt)).limit(limit);
}

// ─── Daily Checklist helpers ────────────────────────────────────
export async function getChecklistByDate(userId: number, date: string) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(dailyChecklist).where(and(eq(dailyChecklist.userId, userId), eq(dailyChecklist.date, date))).orderBy(dailyChecklist.sortOrder);
}

export async function addChecklistItem(userId: number, data: { date: string; title: string; category?: string; isAIGenerated?: boolean }) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(dailyChecklist).values({ userId, ...data }).$returningId();
  return result;
}

export async function toggleChecklistItem(id: number, userId: number, isCompleted: boolean) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  await db.update(dailyChecklist).set({ isCompleted }).where(and(eq(dailyChecklist.id, id), eq(dailyChecklist.userId, userId)));
}

export async function deleteChecklistItem(id: number, userId: number) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  await db.delete(dailyChecklist).where(and(eq(dailyChecklist.id, id), eq(dailyChecklist.userId, userId)));
}

// ─── Journal helpers ────────────────────────────────────────────
export async function getJournalEntries(userId: number, limit: number = 30) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(journal).where(eq(journal.userId, userId)).orderBy(desc(journal.date)).limit(limit);
}

export async function getJournalByDate(userId: number, date: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(journal).where(and(eq(journal.userId, userId), eq(journal.date, date))).limit(1);
  return result[0];
}

export async function saveJournalEntry(userId: number, data: { date: string; mood?: string; content?: string; highlights?: string[]; goals?: string[] }) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const existing = await db.select().from(journal).where(and(eq(journal.userId, userId), eq(journal.date, data.date))).limit(1);
  if (existing.length > 0) {
    await db.update(journal).set(data).where(and(eq(journal.userId, userId), eq(journal.date, data.date)));
    return existing[0];
  }
  const [result] = await db.insert(journal).values({ userId, ...data }).$returningId();
  return result;
}

// ─── Consulting Marketplace helpers ────────────────────────────
export async function getApprovedConsultants() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(consultants)
    .where(and(eq(consultants.isApproved, true), eq(consultants.isActive, true)))
    .orderBy(desc(consultants.totalSessions));
}

export async function getConsultantByUserId(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(consultants).where(eq(consultants.userId, userId)).limit(1);
  return result[0];
}
export async function getConsultantById(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(consultants).where(eq(consultants.id, id)).limit(1);
  return result[0];
}

export async function applyToBeConsultant(userId: number, data: {
  displayName: string; title?: string; bio?: string; specialties?: string[];
  targetRegions?: string[]; languages?: string[]; yearsExperience?: number;
  linkedinUrl?: string; motivation?: string;
}) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(consultingApplications).values({ userId, ...data }).$returningId();
  return result;
}

export async function getConsultingApplicationByUserId(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(consultingApplications)
    .where(eq(consultingApplications.userId, userId))
    .orderBy(desc(consultingApplications.createdAt)).limit(1);
  return result[0];
}

export async function getAllConsultingApplications() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(consultingApplications).orderBy(desc(consultingApplications.createdAt));
}

export async function approveConsultantApplication(applicationId: number, userId: number) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  // Update application status
  const [app] = await db.select().from(consultingApplications)
    .where(eq(consultingApplications.id, applicationId)).limit(1);
  if (!app) throw new Error("Application not found");
  await db.update(consultingApplications)
    .set({ status: "approved" })
    .where(eq(consultingApplications.id, applicationId));
  // Create consultant profile
  await db.insert(consultants).values({
    userId: app.userId,
    displayName: app.displayName,
    title: app.title ?? undefined,
    bio: app.bio ?? undefined,
    specialties: app.specialties ?? [],
    targetRegions: app.targetRegions ?? [],
    languages: app.languages ?? [],
    yearsExperience: app.yearsExperience ?? 0,
    linkedinUrl: app.linkedinUrl ?? undefined,
    isApproved: true,
    isActive: true,
  }).onDuplicateKeyUpdate({ set: { isApproved: true, isActive: true } });
  return { success: true };
}

// ─── Credits helpers ────────────────────────────────────────────
export async function getUserCredits(userId: number) {
  const db = await getDb(); if (!db) return { balance: 0, totalEarned: 0, totalSpent: 0 };
  const result = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  if (result.length > 0) return result[0];
  // Auto-create with welcome bonus
  await db.insert(userCredits).values({ userId, balance: 5, totalEarned: 5, totalSpent: 0 });
  await db.insert(creditTransactions).values({
    userId, amount: 5, type: "welcome_bonus", description: "Welcome bonus credits",
  });
  const created = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  return created[0];
}

export async function getCreditTransactions(userId: number, limit = 20) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt)).limit(limit);
}

export async function bookConsultingSession(clientUserId: number, data: {
  consultantId: number; creditsCharged: number; topic?: string; scheduledAt?: number;
}) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  // Check balance
  const credits = await getUserCredits(clientUserId);
  if (credits.balance < data.creditsCharged) {
    throw new Error("Insufficient credits");
  }
  // Deduct credits
  await db.update(userCredits).set({
    balance: credits.balance - data.creditsCharged,
    totalSpent: credits.totalSpent + data.creditsCharged,
  }).where(eq(userCredits.userId, clientUserId));
  // Record transaction
  await db.insert(creditTransactions).values({
    userId: clientUserId, amount: -data.creditsCharged,
    type: "session_payment",
    description: `Consulting session booking`,
    referenceId: data.consultantId,
  });
  // Create session
  const [session] = await db.insert(consultingSessions).values({
    consultantId: data.consultantId,
    clientUserId,
    creditsCharged: data.creditsCharged,
    topic: data.topic,
    scheduledAt: data.scheduledAt,
    status: "pending",
  }).$returningId();
  return session;
}

export async function getSessionsByUser(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(consultingSessions)
    .where(eq(consultingSessions.clientUserId, userId))
    .orderBy(desc(consultingSessions.createdAt));
}

export async function getSessionsByConsultant(consultantId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(consultingSessions)
    .where(eq(consultingSessions.consultantId, consultantId))
    .orderBy(desc(consultingSessions.createdAt));
}

// ─── Chat History ────────────────────────────────────────────────
export async function upsertChatSession(userId: number, sessionId: string, title?: string) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const existing = await db.select().from(chatSessions)
    .where(and(eq(chatSessions.sessionId, sessionId), eq(chatSessions.userId, userId))).limit(1);
  if (existing.length > 0) {
    if (title) await db.update(chatSessions).set({ title }).where(eq(chatSessions.sessionId, sessionId));
    return existing[0];
  }
  const [result] = await db.insert(chatSessions).values({ userId, sessionId, title: title || 'New Chat' }).$returningId();
  return result;
}

export async function saveChatMessage(userId: number, sessionId: string, role: string, content: string) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(chatMessages).values({ userId, sessionId, role, content }).$returningId();
  return result;
}

export async function getChatSessions(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt))
    .limit(50);
}

export async function getChatMessages(userId: number, sessionId: string) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(chatMessages)
    .where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId)))
    .orderBy(chatMessages.createdAt);
}

export async function deleteChatSession(userId: number, sessionId: string) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  await db.delete(chatMessages).where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId)));
  await db.delete(chatSessions).where(and(eq(chatSessions.sessionId, sessionId), eq(chatSessions.userId, userId)));
}

// ─── Resume Analysis Results ─────────────────────────────────────
export async function saveResumeAnalysisResult(userId: number, data: {
  resumeText?: string; targetRole?: string; targetMarket?: string;
  overallScore?: number; summary?: string; strengths?: unknown;
  improvements?: unknown; keywords?: unknown; rawResult?: unknown;
}) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(resumeAnalysisResults).values({ userId, ...data }).$returningId();
  return result;
}

export async function getResumeAnalysisHistory(userId: number, limit = 10) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(resumeAnalysisResults)
    .where(eq(resumeAnalysisResults.userId, userId))
    .orderBy(desc(resumeAnalysisResults.createdAt))
    .limit(limit);
}

export async function getLatestResumeAnalysis(userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(resumeAnalysisResults)
    .where(eq(resumeAnalysisResults.userId, userId))
    .orderBy(desc(resumeAnalysisResults.createdAt))
    .limit(1);
  return result[0];
}

// ─── Reviews / Testimonials ───────────────────────────────────────
export async function submitReview(userId: number, data: {
  rating: number; comment: string; displayName?: string;
  targetRole?: string; targetMarket?: string; isAnonymous?: boolean;
}) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(reviews).values({ userId, ...data }).$returningId();
  return result;
}

export async function getApprovedReviews(limit = 20) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(reviews)
    .where(eq(reviews.isApproved, true))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export async function getUserReviews(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(reviews)
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));
}

export async function approveReview(id: number) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  await db.update(reviews).set({ isApproved: true }).where(eq(reviews.id, id));
}

// ─── User Profiles (MyProfile) ───────────────────────────────────
export async function getUserProfile(userId: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserProfile(userId: number, data: Omit<InsertUserProfile, 'userId' | 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
    const updated = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return updated[0];
  } else {
    await db.insert(userProfiles).values({ userId, ...data });
    const inserted = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return inserted[0];
  }
}

// ─── Password Reset Token helpers ────────────────────────────────────────────

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete any existing tokens for this user first
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.token, token));
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

// Career OS adapter helpers. These are deliberately additive and defensive so a
// missing migration or database outage does not break the local review app.
export async function upsertCareerProfile(userId: number, data: Omit<InsertCareerProfile, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const existing = await db.select().from(careerProfiles).where(eq(careerProfiles.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(careerProfiles).set(data).where(eq(careerProfiles.userId, userId));
    const updated = await db.select().from(careerProfiles).where(eq(careerProfiles.userId, userId)).limit(1);
    return updated[0];
  }
  await db.insert(careerProfiles).values({ userId, ...data });
  const inserted = await db.select().from(careerProfiles).where(eq(careerProfiles.userId, userId)).limit(1);
  return inserted[0];
}

export async function getCareerProfile(userId: number) {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(careerProfiles).where(eq(careerProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertCachedJobs(jobRows: InsertJob[]) {
  const db = await getDb(); if (!db || jobRows.length === 0) return;
  for (const job of jobRows) {
    await db.insert(jobs).values(job).onDuplicateKeyUpdate({
      set: {
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
        skills: job.skills,
        raw: job.raw,
        fetchedAt: new Date(),
      },
    });
  }
}

export async function getCachedJobs(options?: { search?: string; location?: string; limit?: number }) {
  const db = await getDb(); if (!db) return [];
  const limit = Math.min(options?.limit ?? 100, 500);
  const rows = await db.select().from(jobs).orderBy(desc(jobs.updatedAt)).limit(500);
  const search = options?.search?.trim().toLowerCase();
  const location = options?.location && options.location !== "all" ? options.location : undefined;
  return rows
    .filter(job => !location || job.location === location || job.remote)
    .filter(job => {
      if (!search) return true;
      const haystack = `${job.title} ${job.company} ${job.description ?? ""} ${(job.skills ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(search);
    })
    .slice(0, limit);
}

export async function saveSavedJob(userId: number, data: Omit<InsertSavedJob, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(savedJobs).values({ userId, ...data }).$returningId();
  return result;
}

export async function getSavedJobsByUserId(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(savedJobs).where(eq(savedJobs.userId, userId)).orderBy(desc(savedJobs.createdAt));
}

export async function createResumeAnalysis(data: InsertResumeAnalysis) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(resumeAnalyses).values(data).$returningId();
  return result;
}

export async function getResumeAnalysesByUserId(userId: number, limit = 10) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(resumeAnalyses)
    .where(eq(resumeAnalyses.userId, userId))
    .orderBy(desc(resumeAnalyses.createdAt))
    .limit(limit);
}

export async function createJobFitEvaluation(data: InsertJobFitEvaluation) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(jobFitEvaluations).values(data).$returningId();
  return result;
}

export async function getApplicationById(id: number, userId: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);
  return result[0];
}

export async function saveInterviewPrep(data: InsertInterviewPrep) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const [result] = await db.insert(interviewPreps).values(data).$returningId();
  return result;
}

export async function getInterviewPrepsByUserId(userId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(interviewPreps)
    .where(eq(interviewPreps.userId, userId))
    .orderBy(desc(interviewPreps.createdAt))
    .limit(20);
}

export async function recordAgentTask(data: InsertAgentTask) {
  const db = await getDb(); if (!db) return undefined;
  try {
    const [result] = await db.insert(agentTasks).values(data).$returningId();
    return result;
  } catch (error) {
    console.warn("[Database] Could not record agent task:", error);
    return undefined;
  }
}

export async function recordApiHealth(data: InsertApiHealthLog) {
  const db = await getDb(); if (!db) return undefined;
  try {
    const [result] = await db.insert(apiHealthLogs).values(data).$returningId();
    return result;
  } catch (error) {
    console.warn("[Database] Could not record API health:", error);
    return undefined;
  }
}

export async function saveEmailAccount(data: InsertEmailAccount) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  const existing = await db.select().from(emailAccounts)
    .where(and(
      eq(emailAccounts.userId, data.userId),
      eq(emailAccounts.provider, data.provider ?? "gmail"),
      eq(emailAccounts.email, data.email)
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.update(emailAccounts).set({
      scopes: data.scopes,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? existing[0].refreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      status: data.status ?? "connected",
    }).where(eq(emailAccounts.id, existing[0].id));
    const updated = await db.select().from(emailAccounts).where(eq(emailAccounts.id, existing[0].id)).limit(1);
    return updated[0];
  }

  const [result] = await db.insert(emailAccounts).values(data).$returningId();
  const inserted = await db.select().from(emailAccounts).where(eq(emailAccounts.id, result.id)).limit(1);
  return inserted[0];
}

export async function getPrimaryEmailAccount(userId: number, provider = "gmail") {
  const db = await getDb(); if (!db) return null;
  const result = await db.select().from(emailAccounts)
    .where(and(eq(emailAccounts.userId, userId), eq(emailAccounts.provider, provider), eq(emailAccounts.status, "connected")))
    .orderBy(desc(emailAccounts.updatedAt))
    .limit(1);
  return result[0] ?? null;
}

export async function updateEmailAccountTokens(accountId: number, data: {
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  status?: string;
}) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  await db.update(emailAccounts).set(data).where(eq(emailAccounts.id, accountId));
}

export async function markEmailAccountSynced(accountId: number) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  await db.update(emailAccounts).set({ lastSyncedAt: new Date() }).where(eq(emailAccounts.id, accountId));
}

export async function saveEmailMessage(data: InsertEmailMessage) {
  const db = await getDb(); if (!db) throw new Error("DB not available");
  await db.insert(emailMessages).values(data).onDuplicateKeyUpdate({
    set: {
      threadId: data.threadId,
      fromEmail: data.fromEmail,
      toEmail: data.toEmail,
      subject: data.subject,
      snippet: data.snippet,
      receivedAt: data.receivedAt,
      rawMetadata: data.rawMetadata,
    },
  });
}

export async function getEmailMessages(userId: number, limit = 20) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(emailMessages)
    .where(eq(emailMessages.userId, userId))
    .orderBy(desc(emailMessages.receivedAt))
    .limit(limit);
}
