import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, surveys, applications, resumes, fitEvaluations,
  reports, goals, emailAlerts, consultingWaitlist,
  type InsertSurvey, type InsertApplication, type Survey, type Application,
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
