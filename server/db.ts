import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, surveys, applications, resumes, fitEvaluations,
  reports, goals, emailAlerts, consultingWaitlist,
  userXP, xpEvents, dailyChecklist, journal,
  type InsertSurvey, type InsertApplication, type Survey, type Application,
  type InsertUserXP, type InsertDailyChecklistItem, type InsertJournalEntry,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) {
      console.warn("[Database] Failed to connect:", error); _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
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
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
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
  const db = await getDb(); if (!db) return { totalUsers: 0, totalApplications: 0, totalResumes: 0, totalWaitlist: 0, recentSignups: [] as any[] };
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [appCount] = await db.select({ count: sql<number>`count(*)` }).from(applications);
  const [resumeCount] = await db.select({ count: sql<number>`count(*)` }).from(resumes);
  const [waitlistCount] = await db.select({ count: sql<number>`count(*)` }).from(consultingWaitlist);
  const recentSignups = await db.select({
    date: sql<string>`DATE(createdAt)`,
    count: sql<number>`count(*)`,
  }).from(users).groupBy(sql`DATE(createdAt)`).orderBy(desc(sql`DATE(createdAt)`)).limit(30);
  return {
    totalUsers: userCount.count,
    totalApplications: appCount.count,
    totalResumes: resumeCount.count,
    totalWaitlist: waitlistCount.count,
    recentSignups,
  };
}

export async function getAllUsers() {
  const db = await getDb(); if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
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
