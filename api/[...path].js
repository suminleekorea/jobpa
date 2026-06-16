// server/_core/apiApp.ts
import express2 from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/auth.ts
import crypto from "node:crypto";
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, bigint, uniqueIndex } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  // legacy Manus field — nullable
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  // null for OAuth-only legacy users
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var oauthAccounts = mysqlTable("oauth_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  scopes: text("scopes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
}, (table) => [
  uniqueIndex("oauth_accounts_provider_user_unique").on(table.provider, table.providerUserId)
]);
var emailAccounts = mysqlTable("email_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  provider: varchar("provider", { length: 32 }).notNull().default("gmail"),
  email: varchar("email", { length: 320 }).notNull(),
  scopes: text("scopes"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  status: varchar("status", { length: 32 }).notNull().default("connected"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
}, (table) => [
  uniqueIndex("email_accounts_user_provider_email_unique").on(table.userId, table.provider, table.email)
]);
var emailMessages = mysqlTable("email_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  provider: varchar("provider", { length: 32 }).notNull().default("gmail"),
  providerMessageId: varchar("provider_message_id", { length: 255 }).notNull(),
  threadId: varchar("thread_id", { length: 255 }),
  fromEmail: text("from_email"),
  toEmail: text("to_email"),
  subject: text("subject"),
  snippet: text("snippet"),
  receivedAt: timestamp("received_at"),
  rawMetadata: json("raw_metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
}, (table) => [
  uniqueIndex("email_messages_user_provider_message_unique").on(table.userId, table.provider, table.providerMessageId)
]);
var surveys = mysqlTable("surveys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lookingFor: json("lookingFor").$type(),
  targetRole: varchar("targetRole", { length: 255 }),
  experienceLevel: varchar("experienceLevel", { length: 64 }),
  interests: json("interests").$type(),
  targetCompanies: text("targetCompanies"),
  preferredLocations: json("preferredLocations").$type(),
  salaryExpectation: varchar("salaryExpectation", { length: 128 }),
  needsVisaSponsorship: boolean("needsVisaSponsorship").default(false),
  preferredJobTypes: json("preferredJobTypes").$type(),
  howHeardAbout: varchar("howHeardAbout", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobTitle: varchar("jobTitle", { length: 512 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  location: varchar("location", { length: 128 }),
  applyUrl: text("applyUrl"),
  source: varchar("source", { length: 64 }),
  status: mysqlEnum("status", ["applied", "interview", "offer", "rejected", "withdrawn", "bookmarked"]).default("applied").notNull(),
  notes: text("notes"),
  salary: varchar("salary", { length: 128 }),
  visaType: varchar("visaType", { length: 64 }),
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var resumes = mysqlTable("resumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  analysisResult: json("analysisResult"),
  overallScore: int("overallScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var fitEvaluations = mysqlTable("fitEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetRole: varchar("targetRole", { length: 255 }),
  jobDescription: text("jobDescription"),
  fitScore: int("fitScore"),
  result: json("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }),
  content: text("content"),
  reportType: varchar("reportType", { length: 64 }).default("daily"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetJobType: varchar("targetJobType", { length: 64 }),
  targetRole: varchar("targetRole", { length: 255 }),
  targetCompany: varchar("targetCompany", { length: 255 }),
  deadlineMonths: int("deadlineMonths").default(3),
  weeklyApplicationTarget: int("weeklyApplicationTarget").default(5),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var emailAlerts = mysqlTable("emailAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetRoles: json("targetRoles").$type(),
  targetLocations: json("targetLocations").$type(),
  frequency: varchar("frequency", { length: 32 }).default("weekly"),
  isActive: boolean("isActive").default(true),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var consultingWaitlist = mysqlTable("consultingWaitlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  interests: json("interests").$type(),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var userXP = mysqlTable("userXP", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalXP: int("totalXP").default(0).notNull(),
  level: int("level").default(1).notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActiveDate: varchar("lastActiveDate", { length: 10 }),
  badges: json("badges").$type(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var xpEvents = mysqlTable("xpEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  xpAmount: int("xpAmount").notNull(),
  description: varchar("description", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var dailyChecklist = mysqlTable("dailyChecklist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  isAIGenerated: boolean("isAIGenerated").default(false),
  isCompleted: boolean("isCompleted").default(false),
  category: varchar("category", { length: 64 }),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var journal = mysqlTable("journal", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  mood: varchar("mood", { length: 32 }),
  content: text("content"),
  highlights: json("highlights").$type(),
  goals: json("goals").$type(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var consultants = mysqlTable("consultants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  bio: text("bio"),
  specialties: json("specialties").$type(),
  targetRegions: json("targetRegions").$type(),
  languages: json("languages").$type(),
  yearsExperience: int("yearsExperience").default(0),
  sessionPriceCredits: int("sessionPriceCredits").default(10),
  avatarUrl: text("avatarUrl"),
  photoUrl: text("photoUrl"),
  linkedinUrl: text("linkedinUrl"),
  industry: varchar("industry", { length: 128 }),
  industries: json("industries").$type(),
  careerHistory: json("careerHistory").$type(),
  sessionTypes: json("sessionTypes").$type(),
  isApproved: boolean("isApproved").default(false),
  isActive: boolean("isActive").default(true),
  totalSessions: int("totalSessions").default(0),
  avgRating: int("avgRating").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var consultingApplications = mysqlTable("consultingApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  bio: text("bio"),
  specialties: json("specialties").$type(),
  targetRegions: json("targetRegions").$type(),
  languages: json("languages").$type(),
  yearsExperience: int("yearsExperience").default(0),
  linkedinUrl: text("linkedinUrl"),
  motivation: text("motivation"),
  status: varchar("status", { length: 32 }).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var consultingSessions = mysqlTable("consultingSessions", {
  id: int("id").autoincrement().primaryKey(),
  consultantId: int("consultantId").notNull(),
  clientUserId: int("clientUserId").notNull(),
  status: varchar("status", { length: 32 }).default("pending"),
  scheduledAt: bigint("scheduledAt", { mode: "number" }),
  durationMinutes: int("durationMinutes").default(60),
  creditsCharged: int("creditsCharged").notNull(),
  topic: varchar("topic", { length: 512 }),
  notes: text("notes"),
  meetingUrl: text("meetingUrl"),
  rating: int("rating"),
  review: text("review"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var userCredits = mysqlTable("userCredits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: int("balance").default(0).notNull(),
  totalEarned: int("totalEarned").default(0).notNull(),
  totalSpent: int("totalSpent").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  description: varchar("description", { length: 512 }),
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var resumeAnalysisResults = mysqlTable("resumeAnalysisResults", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resumeText: text("resumeText"),
  targetRole: varchar("targetRole", { length: 256 }),
  targetMarket: varchar("targetMarket", { length: 64 }),
  overallScore: int("overallScore"),
  summary: text("summary"),
  strengths: json("strengths"),
  improvements: json("improvements"),
  keywords: json("keywords"),
  rawResult: json("rawResult"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(),
  // 1-5
  comment: text("comment").notNull(),
  displayName: varchar("displayName", { length: 128 }),
  // user-chosen display name
  targetRole: varchar("targetRole", { length: 128 }),
  // e.g. "Software Engineer"
  targetMarket: varchar("targetMarket", { length: 64 }),
  // e.g. "Singapore", "Korea"
  isApproved: boolean("isApproved").default(false),
  // owner approves before public display
  isAnonymous: boolean("isAnonymous").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  fullName: varchar("fullName", { length: 255 }),
  headline: varchar("headline", { length: 512 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  location: varchar("location", { length: 255 }),
  skills: json("skills").$type(),
  experience: json("experience").$type(),
  education: json("education").$type(),
  targetRole: varchar("targetRole", { length: 255 }),
  targetLocation: varchar("targetLocation", { length: 255 }),
  targetSalary: varchar("targetSalary", { length: 128 }),
  visaStatus: varchar("visaStatus", { length: 128 }),
  linkedinUrl: text("linkedinUrl"),
  portfolioUrl: text("portfolioUrl"),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var careerProfiles = mysqlTable("career_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  interests: json("interests").$type(),
  targetCountries: json("target_countries").$type(),
  targetRole: varchar("target_role", { length: 255 }),
  experienceLevel: varchar("experience_level", { length: 64 }),
  salaryRange: varchar("salary_range", { length: 128 }),
  visaStatus: varchar("visa_status", { length: 128 }),
  preferredLanguage: varchar("preferred_language", { length: 64 }),
  languages: json("languages").$type(),
  market: varchar("market", { length: 128 }),
  profileSummary: text("profile_summary"),
  agentState: json("agent_state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var jobs = mysqlTable("jobs", {
  id: varchar("id", { length: 160 }).primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  location: varchar("location", { length: 128 }),
  salary: varchar("salary", { length: 128 }),
  source: varchar("source", { length: 64 }),
  applyUrl: text("apply_url"),
  visa: boolean("visa").default(false),
  type: varchar("type", { length: 64 }),
  experience: varchar("experience", { length: 64 }),
  industry: varchar("industry", { length: 128 }),
  posted: int("posted").default(0),
  remote: boolean("remote").default(false),
  description: text("description"),
  closingDate: varchar("closing_date", { length: 128 }),
  skills: json("skills").$type(),
  raw: json("raw"),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var savedJobs = mysqlTable("saved_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  jobId: varchar("job_id", { length: 160 }),
  status: varchar("status", { length: 32 }).default("saved").notNull(),
  notes: text("notes"),
  snapshot: json("snapshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var resumeAnalyses = mysqlTable("resume_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  resumeId: int("resume_id"),
  source: varchar("source", { length: 32 }).default("upload").notNull(),
  fileName: varchar("file_name", { length: 255 }),
  resumeText: text("resume_text"),
  targetRole: varchar("target_role", { length: 255 }),
  targetMarket: varchar("target_market", { length: 64 }),
  status: mysqlEnum("status", ["pending", "success", "partial", "failed"]).default("pending").notNull(),
  parseMethod: varchar("parse_method", { length: 64 }),
  parseWarning: text("parse_warning"),
  errorMessage: text("error_message"),
  overallScore: int("overall_score"),
  summary: text("summary"),
  strengths: json("strengths"),
  improvements: json("improvements"),
  keywords: json("keywords"),
  rawResult: json("raw_result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var jobFitEvaluations = mysqlTable("job_fit_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  jobId: varchar("job_id", { length: 160 }),
  targetRole: varchar("target_role", { length: 255 }),
  jobTitle: varchar("job_title", { length: 512 }),
  company: varchar("company", { length: 255 }),
  jobDescription: text("job_description"),
  fitScore: int("fit_score"),
  status: varchar("status", { length: 32 }).default("success"),
  result: json("result"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var interviewPreps = mysqlTable("interview_preps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  applicationId: int("application_id"),
  jobTitle: varchar("job_title", { length: 512 }),
  company: varchar("company", { length: 255 }),
  stage: varchar("stage", { length: 64 }).default("interview"),
  prep: json("prep"),
  followUpEmail: text("follow_up_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var agentTasks = mysqlTable("agent_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  agent: varchar("agent", { length: 64 }).notNull(),
  taskType: varchar("task_type", { length: 128 }),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  input: json("input"),
  output: json("output"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var apiHealthLogs = mysqlTable("api_health_logs", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 128 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  message: text("message"),
  responseMs: int("response_ms"),
  fallbackUsed: boolean("fallback_used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// server/_core/env.ts
var DEFAULT_ADMIN_EMAILS = ["leewaterfolk@gmail.com"];
function parseAdminEmails(value) {
  return (value ?? DEFAULT_ADMIN_EMAILS.join(",")).split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}
var ENV = {
  appBaseUrl: process.env.APP_BASE_URL ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  adminEmails: parseAdminEmails(process.env.ADMIN_EMAILS),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
  googleGmailRedirectUri: process.env.GOOGLE_GMAIL_REDIRECT_URI ?? "",
  llmBaseUrl: process.env.LLM_BASE_URL ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "gemini-2.5-flash"
};
function isAdminEmail(email) {
  return Boolean(email && ENV.adminEmails.includes(email.trim().toLowerCase()));
}

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
function roleForEmail(email) {
  return isAdminEmail(email) ? "admin" : "user";
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const user = result[0];
  if (!user) return void 0;
  if (isAdminEmail(user.email) && user.role !== "admin") {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, id));
    return { ...user, role: "admin" };
  }
  return user;
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = result[0];
  if (!user) return void 0;
  if (isAdminEmail(user.email) && user.role !== "admin") {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
    return { ...user, role: "admin" };
  }
  return user;
}
async function createUserWithPassword(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const email = data.email.trim().toLowerCase();
  const result = await db.insert(users).values({
    email,
    passwordHash: data.passwordHash,
    name: data.name ?? null,
    loginMethod: "email",
    role: roleForEmail(email),
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  return result[0].insertId;
}
function mergeLoginMethod(existing, provider) {
  const parts = new Set((existing || "").split("+").filter(Boolean));
  parts.add(provider);
  return Array.from(parts).join("+");
}
async function upsertOAuthUser(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const email = data.email.trim().toLowerCase();
  const role = roleForEmail(email);
  const linked = await db.select().from(oauthAccounts).where(
    and(eq(oauthAccounts.provider, data.provider), eq(oauthAccounts.providerUserId, data.providerUserId))
  ).limit(1);
  if (linked.length > 0) {
    const user2 = await getUserById(linked[0].userId);
    if (!user2) throw new Error("Linked OAuth user not found");
    await db.update(users).set({
      email: user2.email || email,
      name: user2.name || data.name || null,
      loginMethod: mergeLoginMethod(user2.loginMethod, data.provider),
      role: role === "admin" ? "admin" : user2.role,
      lastSignedIn: /* @__PURE__ */ new Date()
    }).where(eq(users.id, user2.id));
    await db.update(oauthAccounts).set({
      email,
      scopes: data.scopes
    }).where(eq(oauthAccounts.id, linked[0].id));
    return await getUserById(user2.id);
  }
  let user = await getUserByEmail(email);
  if (!user) {
    const result = await db.insert(users).values({
      email,
      name: data.name ?? null,
      loginMethod: data.provider,
      role,
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    const insertedId = result[0].insertId;
    user = await getUserById(insertedId);
  } else {
    await db.update(users).set({
      name: user.name || data.name || null,
      loginMethod: mergeLoginMethod(user.loginMethod, data.provider),
      role: role === "admin" ? "admin" : user.role,
      lastSignedIn: /* @__PURE__ */ new Date()
    }).where(eq(users.id, user.id));
    user = await getUserById(user.id);
  }
  if (!user) throw new Error("OAuth user could not be created");
  await db.insert(oauthAccounts).values({
    userId: user.id,
    provider: data.provider,
    providerUserId: data.providerUserId,
    email,
    scopes: data.scopes
  }).onDuplicateKeyUpdate({
    set: {
      userId: user.id,
      email,
      scopes: data.scopes
    }
  });
  return user;
}
async function saveSurvey(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(surveys).where(eq(surveys.userId, data.userId)).limit(1);
  if (existing.length > 0) {
    await db.update(surveys).set(data).where(eq(surveys.userId, data.userId));
    return existing[0];
  }
  const [result] = await db.insert(surveys).values(data).$returningId();
  return result;
}
async function getSurveyByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(surveys).where(eq(surveys.userId, userId)).limit(1);
  return result[0];
}
async function saveApplication(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(applications).values(data).$returningId();
  return result;
}
async function getApplicationsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt));
}
async function updateApplicationStatus(id, userId, status, notes) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const updateData = { status };
  if (notes !== void 0) updateData.notes = notes;
  await db.update(applications).set(updateData).where(and(eq(applications.id, id), eq(applications.userId, userId)));
}
async function deleteApplication(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, userId)));
}
async function saveResume(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(resumes).where(eq(resumes.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(resumes).set(data).where(eq(resumes.userId, userId));
    return existing[0];
  }
  const [result] = await db.insert(resumes).values({ userId, ...data }).$returningId();
  return result;
}
async function getResumeByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.createdAt)).limit(1);
  return result[0];
}
async function saveFitEvaluation(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(fitEvaluations).values({ userId, ...data }).$returningId();
  return result;
}
async function getFitEvaluationsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fitEvaluations).where(eq(fitEvaluations.userId, userId)).orderBy(desc(fitEvaluations.createdAt));
}
async function saveReport(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(reports).values({ userId, ...data }).$returningId();
  return result;
}
async function getReportsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.createdAt));
}
async function saveGoal(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(goals).where(eq(goals.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(goals).set(data).where(eq(goals.userId, userId));
    return existing[0];
  }
  const [result] = await db.insert(goals).values({ userId, ...data }).$returningId();
  return result;
}
async function getGoalByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(goals).where(eq(goals.userId, userId)).limit(1);
  return result[0];
}
async function saveEmailAlert(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(emailAlerts).where(eq(emailAlerts.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(emailAlerts).set(data).where(eq(emailAlerts.userId, userId));
    return existing[0];
  }
  const [result] = await db.insert(emailAlerts).values({ userId, ...data }).$returningId();
  return result;
}
async function getEmailAlertByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(emailAlerts).where(eq(emailAlerts.userId, userId)).limit(1);
  return result[0];
}
async function joinConsultingWaitlist(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(consultingWaitlist).values(data).$returningId();
  return result;
}
async function getConsultingWaitlist() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consultingWaitlist).orderBy(desc(consultingWaitlist.createdAt));
}
async function getAdminStats() {
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
    journeyFunnel: [],
    agentTaskBreakdown: [],
    apiHealthBreakdown: [],
    qualitativeInsights: ["Database is unavailable, so admin analytics are showing an offline empty state."],
    recentSignups: []
  };
  const db = await getDb();
  if (!db) return emptyAdminStats;
  const safeCount = async (table) => {
    try {
      const [row] = await db.select({ count: sql`count(*)` }).from(table);
      return Number(row?.count ?? 0);
    } catch (error) {
      console.warn("[Admin] Count skipped:", error);
      return 0;
    }
  };
  const safeDistinctUsers = async (table, column) => {
    try {
      const [row] = await db.select({ count: sql`count(distinct ${column})` }).from(table);
      return Number(row?.count ?? 0);
    } catch (error) {
      console.warn("[Admin] Distinct user count skipped:", error);
      return 0;
    }
  };
  const safePercent = (value, total) => total > 0 ? Math.round(value / total * 100) : 0;
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
    emailConnectedUsers
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
    safeDistinctUsers(emailAccounts, emailAccounts.userId)
  ]);
  const [active7, active30] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(users).where(sql`${users.lastSignedIn} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`).then(([row]) => Number(row?.count ?? 0)).catch(() => 0),
    db.select({ count: sql`count(*)` }).from(users).where(sql`${users.lastSignedIn} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`).then(([row]) => Number(row?.count ?? 0)).catch(() => 0)
  ]);
  const applicationStatusRows = await db.select({
    status: applications.status,
    count: sql`count(*)`
  }).from(applications).groupBy(applications.status).catch(() => []);
  const applicationStatusCounts = {
    bookmarked: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0
  };
  for (const row of applicationStatusRows) {
    applicationStatusCounts[String(row.status)] = Number(row.count ?? 0);
  }
  const agentRows = await db.select({
    agent: agentTasks.agent,
    status: agentTasks.status,
    count: sql`count(*)`
  }).from(agentTasks).groupBy(agentTasks.agent, agentTasks.status).catch(() => []);
  const apiHealthRows = await db.select({
    service: apiHealthLogs.service,
    status: apiHealthLogs.status,
    fallbackUsed: apiHealthLogs.fallbackUsed,
    count: sql`count(*)`
  }).from(apiHealthLogs).groupBy(apiHealthLogs.service, apiHealthLogs.status, apiHealthLogs.fallbackUsed).catch(() => []);
  const recentSignups = await db.select({
    date: sql`DATE(createdAt)`,
    count: sql`count(*)`
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
      description: "Career profile, onboarding, goals, salary/visa/language context"
    },
    {
      key: "job_discovery",
      label: "Jobs saved",
      count: savedJobUsers,
      percent: safePercent(savedJobUsers, totalUsers),
      description: "Saved jobs and target opportunity curation"
    },
    {
      key: "resume",
      label: "Resume analyzed",
      count: resumeManagedUsers,
      percent: safePercent(resumeManagedUsers, totalUsers),
      description: "Resume analysis, gaps, keywords, and paste/upload fallback"
    },
    {
      key: "application",
      label: "Applications tracked",
      count: applicationUsers,
      percent: safePercent(applicationUsers, totalUsers),
      description: "Applied, interview, offer, rejection, and saved workflows"
    },
    {
      key: "fit",
      label: "Job fit evaluated",
      count: fitUsers,
      percent: safePercent(fitUsers, totalUsers),
      description: "Role/profile/resume fit scoring and strategy"
    },
    {
      key: "interview",
      label: "Interview prepared",
      count: interviewPrepUsers,
      percent: safePercent(interviewPrepUsers, totalUsers),
      description: "Likely questions, STAR stories, and follow-up emails"
    },
    {
      key: "career_management",
      label: "Long-term managed",
      count: longTermManagedUsers,
      percent: safePercent(longTermManagedUsers, totalUsers),
      description: "Reports, checklists, journal, and ongoing next actions"
    }
  ];
  const journeyManagementScore = Math.round(
    journeyFunnel.reduce((sum, item) => sum + item.percent, 0) / Math.max(journeyFunnel.length, 1)
  );
  const qualitativeInsights = [
    totalUsers === 0 ? "No users yet. Keep the app in internal/staging review until auth, database, and onboarding are verified." : `${safePercent(active30, totalUsers)}% of users were active in the last 30 days; weekly active coverage is ${safePercent(active7, totalUsers)}%.`,
    profileManagedUsers < totalUsers ? "Some users have not completed career context. Push onboarding/profile CTAs before job recommendations." : "All tracked users have some profile context, so agent guidance can be role/market-aware.",
    resumeManagedUsers < applicationUsers ? "Some applicants are tracking jobs before resume analysis. Recommend resume upload or paste-text fallback earlier." : "Resume coverage is aligned with or ahead of application tracking.",
    applicationStatusCounts.interview > totalInterviewPreps ? "Interview-stage applications exceed generated prep. Surface Interview Prep as the next required action." : "Interview prep coverage is keeping pace with interview-stage activity.",
    totalReports + totalChecklistItems + totalJournalEntries > 0 ? "Long-term career management is active through reports, checklists, or journal entries." : "Long-term management is not active yet. Add weekly reports and post-interview follow-up prompts."
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
    agentTaskBreakdown: agentRows.map((row) => ({
      agent: row.agent,
      status: row.status,
      count: Number(row.count ?? 0)
    })),
    apiHealthBreakdown: apiHealthRows.map((row) => ({
      service: row.service,
      status: row.status,
      fallbackUsed: Boolean(row.fallbackUsed),
      count: Number(row.count ?? 0)
    })),
    qualitativeInsights,
    recentSignups
  };
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    loginMethod: users.loginMethod,
    role: users.role,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn
  }).from(users).orderBy(desc(users.createdAt));
}
var XP_ACTIONS = {
  apply: 50,
  checklist: 10,
  journal: 20,
  resume: 30,
  fit: 25,
  login: 5,
  streak_bonus: 15
};
var LEVEL_THRESHOLDS = [0, 100, 300, 600, 1e3, 1500, 2200, 3e3, 4e3, 5500, 7500, 1e4];
function calculateLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}
var BADGES = {
  first_apply: { name: "First Application", condition: (s) => s.totalApply >= 1 },
  apply_10: { name: "Job Hunter", condition: (s) => s.totalApply >= 10 },
  apply_50: { name: "Application Machine", condition: (s) => s.totalApply >= 50 },
  streak_3: { name: "3-Day Streak", condition: (s) => s.longestStreak >= 3 },
  streak_7: { name: "Week Warrior", condition: (s) => s.longestStreak >= 7 },
  streak_30: { name: "Monthly Master", condition: (s) => s.longestStreak >= 30 },
  journal_5: { name: "Reflective Mind", condition: (s) => s.totalJournal >= 5 },
  checklist_20: { name: "Task Crusher", condition: (s) => s.totalChecklist >= 20 },
  level_5: { name: "Rising Star", condition: (s) => s.level >= 5 },
  level_10: { name: "Career Pro", condition: (s) => s.level >= 10 }
};
async function getOrCreateUserXP(userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(userXP).where(eq(userXP.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];
  await db.insert(userXP).values({ userId, totalXP: 0, level: 1, currentStreak: 0, longestStreak: 0, badges: [] });
  const created = await db.select().from(userXP).where(eq(userXP.userId, userId)).limit(1);
  return created[0];
}
async function awardXP(userId, action, description) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const xpAmount = XP_ACTIONS[action] || 5;
  await db.insert(xpEvents).values({ userId, action, xpAmount, description });
  const profile = await getOrCreateUserXP(userId);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
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
  const stats = {
    totalApply: 0,
    totalJournal: 0,
    totalChecklist: 0,
    longestStreak: newLongest,
    level: newLevel
  };
  const [applyCount] = await db.select({ count: sql`count(*)` }).from(xpEvents).where(and(eq(xpEvents.userId, userId), eq(xpEvents.action, "apply")));
  const [journalCount] = await db.select({ count: sql`count(*)` }).from(xpEvents).where(and(eq(xpEvents.userId, userId), eq(xpEvents.action, "journal")));
  const [checklistCount] = await db.select({ count: sql`count(*)` }).from(xpEvents).where(and(eq(xpEvents.userId, userId), eq(xpEvents.action, "checklist")));
  stats.totalApply = applyCount.count;
  stats.totalJournal = journalCount.count;
  stats.totalChecklist = checklistCount.count;
  const currentBadges = profile.badges || [];
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
    badges: newBadges
  }).where(eq(userXP.userId, userId));
  return { totalXP: newXP, level: newLevel, xpGained: xpAmount, currentStreak: newStreak, badges: newBadges };
}
async function getXPHistory(userId, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(xpEvents).where(eq(xpEvents.userId, userId)).orderBy(desc(xpEvents.createdAt)).limit(limit);
}
async function getChecklistByDate(userId, date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailyChecklist).where(and(eq(dailyChecklist.userId, userId), eq(dailyChecklist.date, date))).orderBy(dailyChecklist.sortOrder);
}
async function addChecklistItem(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(dailyChecklist).values({ userId, ...data }).$returningId();
  return result;
}
async function toggleChecklistItem(id, userId, isCompleted) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(dailyChecklist).set({ isCompleted }).where(and(eq(dailyChecklist.id, id), eq(dailyChecklist.userId, userId)));
}
async function deleteChecklistItem(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(dailyChecklist).where(and(eq(dailyChecklist.id, id), eq(dailyChecklist.userId, userId)));
}
async function getJournalEntries(userId, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(journal).where(eq(journal.userId, userId)).orderBy(desc(journal.date)).limit(limit);
}
async function getJournalByDate(userId, date) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(journal).where(and(eq(journal.userId, userId), eq(journal.date, date))).limit(1);
  return result[0];
}
async function saveJournalEntry(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(journal).where(and(eq(journal.userId, userId), eq(journal.date, data.date))).limit(1);
  if (existing.length > 0) {
    await db.update(journal).set(data).where(and(eq(journal.userId, userId), eq(journal.date, data.date)));
    return existing[0];
  }
  const [result] = await db.insert(journal).values({ userId, ...data }).$returningId();
  return result;
}
async function getApprovedConsultants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consultants).where(and(eq(consultants.isApproved, true), eq(consultants.isActive, true))).orderBy(desc(consultants.totalSessions));
}
async function getConsultantByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(consultants).where(eq(consultants.userId, userId)).limit(1);
  return result[0];
}
async function getConsultantById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(consultants).where(eq(consultants.id, id)).limit(1);
  return result[0];
}
async function applyToBeConsultant(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(consultingApplications).values({ userId, ...data }).$returningId();
  return result;
}
async function getConsultingApplicationByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(consultingApplications).where(eq(consultingApplications.userId, userId)).orderBy(desc(consultingApplications.createdAt)).limit(1);
  return result[0];
}
async function getAllConsultingApplications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consultingApplications).orderBy(desc(consultingApplications.createdAt));
}
async function approveConsultantApplication(applicationId, userId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [app] = await db.select().from(consultingApplications).where(eq(consultingApplications.id, applicationId)).limit(1);
  if (!app) throw new Error("Application not found");
  await db.update(consultingApplications).set({ status: "approved" }).where(eq(consultingApplications.id, applicationId));
  await db.insert(consultants).values({
    userId: app.userId,
    displayName: app.displayName,
    title: app.title ?? void 0,
    bio: app.bio ?? void 0,
    specialties: app.specialties ?? [],
    targetRegions: app.targetRegions ?? [],
    languages: app.languages ?? [],
    yearsExperience: app.yearsExperience ?? 0,
    linkedinUrl: app.linkedinUrl ?? void 0,
    isApproved: true,
    isActive: true
  }).onDuplicateKeyUpdate({ set: { isApproved: true, isActive: true } });
  return { success: true };
}
async function getUserCredits(userId) {
  const db = await getDb();
  if (!db) return { balance: 0, totalEarned: 0, totalSpent: 0 };
  const result = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  if (result.length > 0) return result[0];
  await db.insert(userCredits).values({ userId, balance: 5, totalEarned: 5, totalSpent: 0 });
  await db.insert(creditTransactions).values({
    userId,
    amount: 5,
    type: "welcome_bonus",
    description: "Welcome bonus credits"
  });
  const created = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  return created[0];
}
async function getCreditTransactions(userId, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions).where(eq(creditTransactions.userId, userId)).orderBy(desc(creditTransactions.createdAt)).limit(limit);
}
async function bookConsultingSession(clientUserId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const credits = await getUserCredits(clientUserId);
  if (credits.balance < data.creditsCharged) {
    throw new Error("Insufficient credits");
  }
  await db.update(userCredits).set({
    balance: credits.balance - data.creditsCharged,
    totalSpent: credits.totalSpent + data.creditsCharged
  }).where(eq(userCredits.userId, clientUserId));
  await db.insert(creditTransactions).values({
    userId: clientUserId,
    amount: -data.creditsCharged,
    type: "session_payment",
    description: `Consulting session booking`,
    referenceId: data.consultantId
  });
  const [session] = await db.insert(consultingSessions).values({
    consultantId: data.consultantId,
    clientUserId,
    creditsCharged: data.creditsCharged,
    topic: data.topic,
    scheduledAt: data.scheduledAt,
    status: "pending"
  }).$returningId();
  return session;
}
async function getSessionsByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consultingSessions).where(eq(consultingSessions.clientUserId, userId)).orderBy(desc(consultingSessions.createdAt));
}
async function upsertChatSession(userId, sessionId, title) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(chatSessions).where(and(eq(chatSessions.sessionId, sessionId), eq(chatSessions.userId, userId))).limit(1);
  if (existing.length > 0) {
    if (title) await db.update(chatSessions).set({ title }).where(eq(chatSessions.sessionId, sessionId));
    return existing[0];
  }
  const [result] = await db.insert(chatSessions).values({ userId, sessionId, title: title || "New Chat" }).$returningId();
  return result;
}
async function saveChatMessage(userId, sessionId, role, content) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(chatMessages).values({ userId, sessionId, role, content }).$returningId();
  return result;
}
async function getChatSessions(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt)).limit(50);
}
async function getChatMessages(userId, sessionId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId))).orderBy(chatMessages.createdAt);
}
async function deleteChatSession(userId, sessionId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(chatMessages).where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId)));
  await db.delete(chatSessions).where(and(eq(chatSessions.sessionId, sessionId), eq(chatSessions.userId, userId)));
}
async function saveResumeAnalysisResult(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(resumeAnalysisResults).values({ userId, ...data }).$returningId();
  return result;
}
async function getResumeAnalysisHistory(userId, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resumeAnalysisResults).where(eq(resumeAnalysisResults.userId, userId)).orderBy(desc(resumeAnalysisResults.createdAt)).limit(limit);
}
async function getLatestResumeAnalysis(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(resumeAnalysisResults).where(eq(resumeAnalysisResults.userId, userId)).orderBy(desc(resumeAnalysisResults.createdAt)).limit(1);
  return result[0];
}
async function submitReview(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(reviews).values({ userId, ...data }).$returningId();
  return result;
}
async function getApprovedReviews(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.isApproved, true)).orderBy(desc(reviews.createdAt)).limit(limit);
}
async function getUserReviews(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.userId, userId)).orderBy(desc(reviews.createdAt));
}
async function getUserProfile(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function upsertUserProfile(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
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
async function upsertCareerProfile(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
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
async function getCareerProfile(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(careerProfiles).where(eq(careerProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}
async function upsertCachedJobs(jobRows) {
  const db = await getDb();
  if (!db || jobRows.length === 0) return;
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
        fetchedAt: /* @__PURE__ */ new Date()
      }
    });
  }
}
async function getCachedJobs(options) {
  const db = await getDb();
  if (!db) return [];
  const limit = Math.min(options?.limit ?? 100, 500);
  const rows = await db.select().from(jobs).orderBy(desc(jobs.updatedAt)).limit(500);
  const search = options?.search?.trim().toLowerCase();
  const location = options?.location && options.location !== "all" ? options.location : void 0;
  return rows.filter((job) => !location || job.location === location || job.remote).filter((job) => {
    if (!search) return true;
    const haystack = `${job.title} ${job.company} ${job.description ?? ""} ${(job.skills ?? []).join(" ")}`.toLowerCase();
    return haystack.includes(search);
  }).slice(0, limit);
}
async function saveSavedJob(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(savedJobs).values({ userId, ...data }).$returningId();
  return result;
}
async function createResumeAnalysis(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(resumeAnalyses).values(data).$returningId();
  return result;
}
async function createJobFitEvaluation(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(jobFitEvaluations).values(data).$returningId();
  return result;
}
async function getApplicationById(id, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(applications).where(and(eq(applications.id, id), eq(applications.userId, userId))).limit(1);
  return result[0];
}
async function saveInterviewPrep(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(interviewPreps).values(data).$returningId();
  return result;
}
async function getInterviewPrepsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewPreps).where(eq(interviewPreps.userId, userId)).orderBy(desc(interviewPreps.createdAt)).limit(20);
}
async function recordAgentTask(data) {
  const db = await getDb();
  if (!db) return void 0;
  try {
    const [result] = await db.insert(agentTasks).values(data).$returningId();
    return result;
  } catch (error) {
    console.warn("[Database] Could not record agent task:", error);
    return void 0;
  }
}
async function recordApiHealth(data) {
  const db = await getDb();
  if (!db) return void 0;
  try {
    const [result] = await db.insert(apiHealthLogs).values(data).$returningId();
    return result;
  } catch (error) {
    console.warn("[Database] Could not record API health:", error);
    return void 0;
  }
}
async function saveEmailAccount(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(emailAccounts).where(and(
    eq(emailAccounts.userId, data.userId),
    eq(emailAccounts.provider, data.provider ?? "gmail"),
    eq(emailAccounts.email, data.email)
  )).limit(1);
  if (existing.length > 0) {
    await db.update(emailAccounts).set({
      scopes: data.scopes,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? existing[0].refreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      status: data.status ?? "connected"
    }).where(eq(emailAccounts.id, existing[0].id));
    const updated = await db.select().from(emailAccounts).where(eq(emailAccounts.id, existing[0].id)).limit(1);
    return updated[0];
  }
  const [result] = await db.insert(emailAccounts).values(data).$returningId();
  const inserted = await db.select().from(emailAccounts).where(eq(emailAccounts.id, result.id)).limit(1);
  return inserted[0];
}
async function getPrimaryEmailAccount(userId, provider = "gmail") {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(emailAccounts).where(and(eq(emailAccounts.userId, userId), eq(emailAccounts.provider, provider), eq(emailAccounts.status, "connected"))).orderBy(desc(emailAccounts.updatedAt)).limit(1);
  return result[0] ?? null;
}
async function updateEmailAccountTokens(accountId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(emailAccounts).set(data).where(eq(emailAccounts.id, accountId));
}
async function markEmailAccountSynced(accountId) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(emailAccounts).set({ lastSyncedAt: /* @__PURE__ */ new Date() }).where(eq(emailAccounts.id, accountId));
}
async function saveEmailMessage(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(emailMessages).values(data).onDuplicateKeyUpdate({
    set: {
      threadId: data.threadId,
      fromEmail: data.fromEmail,
      toEmail: data.toEmail,
      subject: data.subject,
      snippet: data.snippet,
      receivedAt: data.receivedAt,
      rawMetadata: data.rawMetadata
    }
  });
}
async function getEmailMessages(userId, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailMessages).where(eq(emailMessages.userId, userId)).orderBy(desc(emailMessages.receivedAt)).limit(limit);
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: secure ? "none" : "lax",
    secure
  };
}

// server/_core/googleOAuth.ts
var GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
var GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
var LOGIN_SCOPES = ["openid", "email", "profile"];
var GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly"
];
function isGoogleOAuthConfigured() {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret);
}
function getRequestBaseUrl(req) {
  if (ENV.appBaseUrl) return ENV.appBaseUrl.replace(/\/$/, "");
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader?.split(",")[0]?.trim();
  const protocol = proto || req.protocol || "http";
  return `${protocol}://${req.get("host")}`;
}
function getGoogleRedirectUri(req, mode) {
  const fallbackPath = mode === "gmail" ? "/api/integrations/gmail/callback" : "/api/auth/google/callback";
  if (mode === "gmail" && ENV.googleGmailRedirectUri) return ENV.googleGmailRedirectUri;
  if (mode === "login" && ENV.googleRedirectUri) return ENV.googleRedirectUri;
  return `${getRequestBaseUrl(req)}${fallbackPath}`;
}
function buildGoogleAuthUrl(req, mode, state, loginHint) {
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: getGoogleRedirectUri(req, mode),
    response_type: "code",
    scope: (mode === "gmail" ? GMAIL_SCOPES : LOGIN_SCOPES).join(" "),
    state,
    include_granted_scopes: "true"
  });
  if (mode === "gmail") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }
  if (loginHint) params.set("login_hint", loginHint);
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}
async function exchangeGoogleCode(req, mode, code) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getGoogleRedirectUri(req, mode)
    })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Google token exchange failed (${response.status}): ${errorText.slice(0, 160)}`);
  }
  return response.json();
}
async function refreshGoogleAccessToken(refreshToken) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Google token refresh failed (${response.status}): ${errorText.slice(0, 160)}`);
  }
  return response.json();
}
async function fetchGoogleProfile(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    throw new Error(`Google profile fetch failed (${response.status})`);
  }
  return response.json();
}
function tokenExpiryFromNow(expiresInSeconds) {
  if (!expiresInSeconds) return null;
  return new Date(Date.now() + Math.max(expiresInSeconds - 60, 60) * 1e3);
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var SDKServer = class {
  parseCookies(cookieHeader) {
    if (!cookieHeader) return /* @__PURE__ */ new Map();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }
  getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    return new SignJWT({
      userId: payload.userId,
      email: payload.email,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(this.getSessionSecret());
  }
  async verifySession(cookieValue) {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), {
        algorithms: ["HS256"]
      });
      const { userId, email, name } = payload;
      if (typeof userId !== "number" || !isNonEmptyString(email)) return null;
      return { userId, email, name: typeof name === "string" ? name : "" };
    } catch {
      return null;
    }
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) throw ForbiddenError("Invalid session");
    const user = await getUserById(session.userId);
    if (!user) throw ForbiddenError("User not found");
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/auth.ts
var GOOGLE_AUTH_STATE_COOKIE = "jobpa_google_oauth_state";
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}
function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(attempt, "hex"));
}
function redirectWithAuthError(res, code) {
  res.redirect(`/login?authError=${encodeURIComponent(code)}`);
}
function getCookie(req, name) {
  return parseCookieHeader2(req.headers.cookie || "")[name];
}
function setStateCookie(req, res, name, value) {
  res.cookie(name, value, {
    ...getSessionCookieOptions(req),
    sameSite: "lax",
    maxAge: 10 * 60 * 1e3
  });
}
function clearStateCookie(req, res, name) {
  res.clearCookie(name, {
    ...getSessionCookieOptions(req),
    sameSite: "lax",
    maxAge: -1
  });
}
function registerAuthRoutes(app) {
  app.get("/api/auth/google", (req, res) => {
    if (!isGoogleOAuthConfigured()) {
      redirectWithAuthError(res, "google_not_configured");
      return;
    }
    const state = crypto.randomBytes(24).toString("hex");
    setStateCookie(req, res, GOOGLE_AUTH_STATE_COOKIE, state);
    res.redirect(buildGoogleAuthUrl(req, "login", state));
  });
  app.get("/api/auth/google/callback", async (req, res) => {
    if (!isGoogleOAuthConfigured()) {
      redirectWithAuthError(res, "google_not_configured");
      return;
    }
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const providerError = typeof req.query.error === "string" ? req.query.error : "";
    const expectedState = getCookie(req, GOOGLE_AUTH_STATE_COOKIE);
    clearStateCookie(req, res, GOOGLE_AUTH_STATE_COOKIE);
    if (providerError) {
      redirectWithAuthError(res, providerError);
      return;
    }
    if (!code) {
      redirectWithAuthError(res, "missing_google_code");
      return;
    }
    if (!state || !expectedState || state !== expectedState) {
      redirectWithAuthError(res, "invalid_google_state");
      return;
    }
    try {
      const token = await exchangeGoogleCode(req, "login", code);
      const profile = await fetchGoogleProfile(token.access_token);
      if (!profile.email || profile.email_verified === false) {
        redirectWithAuthError(res, "google_email_unverified");
        return;
      }
      const user = await upsertOAuthUser({
        provider: "google",
        providerUserId: profile.sub,
        email: profile.email.toLowerCase(),
        name: profile.name,
        scopes: token.scope
      });
      const session = await sdk.signSession({
        userId: user.id,
        email: user.email || profile.email,
        name: user.name || profile.name || ""
      });
      res.cookie(COOKIE_NAME, session, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect("/dashboard");
    } catch (error) {
      console.error("[Auth] Google OAuth failed:", error);
      redirectWithAuthError(res, "google_login_failed");
    }
  });
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }
      const passwordHash = createPasswordHash(password);
      const userId = await createUserWithPassword({ email, passwordHash, name });
      const token = await sdk.signSession({ userId, email, name: name || "" });
      res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Register failed:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    try {
      const user = await getUserByEmail(email);
      if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const token = await sdk.signSession({ userId: user.id, email: user.email, name: user.name || "" });
      res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}

// server/_core/chat.ts
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod/v4";
function createLLMProvider() {
  const baseURL = ENV.llmBaseUrl ? ENV.llmBaseUrl.endsWith("/v1") ? ENV.llmBaseUrl : `${ENV.llmBaseUrl}/v1` : void 0;
  return createOpenAI({
    baseURL,
    apiKey: ENV.llmApiKey
  });
}
var careerTools = {
  searchJobs: tool({
    description: "Search for job listings by keyword, location, or industry",
    inputSchema: z.object({
      query: z.string().describe("Job search keyword, e.g. 'data analyst'"),
      location: z.string().optional().describe("Location filter: singapore, hongkong, dubai, korea, remote")
    }),
    execute: async ({ query, location }) => {
      const platforms = {
        singapore: ["Career@Gov (jobs.careers.gov.sg)", "MyCareersFuture (mycareersfuture.gov.sg)", "LinkedIn"],
        hongkong: ["JobsDB (jobsdb.com)", "LinkedIn", "CTgoodjobs"],
        dubai: ["Bayt (bayt.com)", "GulfTalent (gulftalent.com)", "LinkedIn"],
        korea: ["Saramin (saramin.co.kr)", "JobKorea (jobkorea.co.kr)", "LinkedIn"],
        remote: ["LinkedIn Remote", "We Work Remotely", "Remote.co"]
      };
      const loc = location || "singapore";
      return {
        query,
        location: loc,
        recommendedPlatforms: platforms[loc] || platforms.singapore,
        tip: `Search for "${query}" on these platforms. Use the Jobs tab in JobPA to see curated listings.`
      };
    }
  }),
  getVisaInfo: tool({
    description: "Get visa and work permit information for a specific country",
    inputSchema: z.object({
      country: z.string().describe("Country: singapore, hongkong, dubai, korea")
    }),
    execute: async ({ country }) => {
      const visaInfo = {
        singapore: {
          types: [
            { name: "Employment Pass (EP)", minSalary: "S$5,000/mo", description: "For professionals, managers, executives" },
            { name: "S Pass", minSalary: "S$3,150/mo", description: "For mid-skilled workers" },
            { name: "Tech.Pass", minSalary: "S$20,000/mo", description: "For top tech talent" }
          ],
          tip: "Most tech roles qualify for EP. Companies must advertise on MCF for 14 days before hiring foreigners."
        },
        hongkong: {
          types: [
            { name: "General Employment Policy (GEP)", description: "Standard work visa for professionals" },
            { name: "IANG", description: "For non-local graduates of HK institutions" },
            { name: "QMAS (Quality Migrant Admission)", description: "Points-based talent scheme" },
            { name: "Top Talent Pass", description: "For high earners or top university graduates" }
          ],
          tip: "HK has no minimum salary for GEP but you need a job offer from a HK company."
        },
        dubai: {
          types: [
            { name: "Employment Visa", description: "Sponsored by employer, valid 2-3 years" },
            { name: "Freelance Visa", description: "For independent professionals" },
            { name: "Golden Visa", description: "10-year residency for exceptional talent" }
          ],
          tip: "No income tax in UAE. Most companies provide housing and flight allowances."
        },
        korea: {
          types: [
            { name: "E-7 (Specific Activities)", description: "For professional workers in designated fields" },
            { name: "D-10 (Job Seeking)", description: "6-month visa for job hunting" },
            { name: "F-2-7 (Points-based)", description: "Long-term residency via points system" }
          ],
          tip: "E-7 is the most common work visa. Korean language ability is a plus but not always required for tech roles."
        }
      };
      return visaInfo[country] || { error: "Country not found. Supported: singapore, hongkong, dubai, korea" };
    }
  }),
  getInterviewTips: tool({
    description: "Get interview preparation tips for a specific role or company type",
    inputSchema: z.object({
      role: z.string().describe("Target role, e.g. 'Software Engineer'"),
      companyType: z.string().optional().describe("Company type: startup, enterprise, government, fintech")
    }),
    execute: async ({ role, companyType }) => {
      return {
        role,
        companyType: companyType || "general",
        generalTips: [
          "Research the company's recent news, products, and culture",
          "Prepare STAR method stories for behavioral questions",
          "Have 3-5 thoughtful questions ready for the interviewer",
          "Practice explaining your resume in 2 minutes"
        ],
        technicalTips: [
          "Review fundamentals relevant to the role",
          "Practice coding/case studies if applicable",
          "Be ready to discuss past projects in detail",
          "Prepare a portfolio or work samples if relevant"
        ],
        salaryTips: [
          "Research market rates on Glassdoor, Levels.fyi, or NodeFlair",
          "Consider total compensation (base + bonus + equity + benefits)",
          "Don't give a number first \u2014 ask for their budget range",
          "Factor in cost of living for the target city"
        ]
      };
    }
  }),
  getSalaryBenchmark: tool({
    description: "Get salary benchmarks for a role in a specific location",
    inputSchema: z.object({
      role: z.string().describe("Job role, e.g. 'Data Analyst'"),
      location: z.string().describe("Location: singapore, hongkong, dubai, korea"),
      experience: z.string().optional().describe("Experience level: junior, mid, senior")
    }),
    execute: async ({ role, location, experience }) => {
      const benchmarks = {
        singapore: {
          default: { junior: "S$4,000-6,000/mo", mid: "S$6,000-10,000/mo", senior: "S$10,000-18,000/mo" },
          tech: { junior: "S$4,500-7,000/mo", mid: "S$7,000-12,000/mo", senior: "S$12,000-22,000/mo" }
        },
        hongkong: {
          default: { junior: "HK$20,000-35,000/mo", mid: "HK$35,000-60,000/mo", senior: "HK$60,000-100,000/mo" },
          tech: { junior: "HK$25,000-40,000/mo", mid: "HK$40,000-70,000/mo", senior: "HK$70,000-120,000/mo" }
        },
        dubai: {
          default: { junior: "AED 8,000-15,000/mo", mid: "AED 15,000-30,000/mo", senior: "AED 30,000-50,000/mo" },
          tech: { junior: "AED 10,000-18,000/mo", mid: "AED 18,000-35,000/mo", senior: "AED 35,000-60,000/mo" }
        },
        korea: {
          default: { junior: "\u20A93M-4.5M/mo", mid: "\u20A94.5M-7M/mo", senior: "\u20A97M-12M/mo" },
          tech: { junior: "\u20A93.5M-5.5M/mo", mid: "\u20A95.5M-9M/mo", senior: "\u20A99M-15M/mo" }
        }
      };
      const loc = benchmarks[location] || benchmarks.singapore;
      const roleLower = (role || "").toLowerCase();
      const category = roleLower.includes("engineer") || roleLower.includes("developer") || roleLower.includes("data") || roleLower.includes("devops") || roleLower.includes("ai") ? "tech" : "default";
      const data = loc[category] || loc.default;
      const exp = experience || "mid";
      return {
        role,
        location,
        experience: exp,
        salaryRange: data[exp] || data.mid,
        note: "These are approximate ranges. Actual salary depends on company, specific skills, and negotiation.",
        sources: ["Glassdoor", "Levels.fyi", "NodeFlair (SG)", "JobsDB Salary Report"]
      };
    }
  })
};
var CAREER_SYSTEM_PROMPT = `You are JobPA Career Assistant, an AI-powered career guidance and strategic partner. You help job seekers with:

1. **Job Search Strategy**: Help users find the right roles across Singapore, Hong Kong, Dubai/UAE, South Korea, and remote positions.
2. **Resume & Interview Advice**: Provide actionable feedback on resumes, cover letters, and interview preparation.
3. **Visa & Relocation**: Share visa requirements and relocation tips for different countries.
4. **Salary Negotiation**: Help users understand market rates and negotiate effectively.
5. **Career Planning**: Guide users on career transitions, skill development, and long-term strategy.

Important guidelines:
- You are NOT an auto-apply tool. You provide guidance and strategy \u2014 users apply themselves.
- Be specific and actionable in your advice.
- When discussing salaries, always mention that ranges are approximate and vary by company.
- When discussing visa, immigration, tax, legal, or employment eligibility topics, state that the answer is general guidance, not legal or visa advice, and recommend checking official government/employer sources.
- Encourage users to use JobPA's built-in tools (Resume Analysis, Job Fit, Job Listings) for detailed analysis.
- Be supportive and encouraging \u2014 job searching can be stressful.
- You can respond in both Korean and English. Match the user's language.
- Keep responses concise but helpful. Use bullet points for clarity.`;
function registerChatRoutes(app) {
  const openai = createLLMProvider();
  app.post("/api/chat", async (req, res) => {
    try {
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
      let modelMessages;
      try {
        modelMessages = await convertToModelMessages(uiMessages);
      } catch {
        modelMessages = uiMessages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : m.parts?.filter((p) => p.type === "text").map((p) => p.text ?? "").join("") ?? ""
        }));
      }
      let systemPrompt = CAREER_SYSTEM_PROMPT;
      try {
        const authResult = await sdk.authenticateRequest(req);
        if (authResult?.id) {
          const profile = await getUserProfile(authResult.id);
          if (profile && (profile.fullName || profile.skills || profile.experience)) {
            const skills = profile.skills ?? [];
            const experience = profile.experience ?? [];
            const education = profile.education ?? [];
            const profileContext = `

## User Profile (Personalization Context)
Name: ${profile.fullName || "Not provided"}
Headline: ${profile.headline || "Not provided"}
Location: ${profile.location || "Not provided"}
Target Role: ${profile.targetRole || "Not provided"}
Target Location: ${profile.targetLocation || "Not provided"}
Target Salary: ${profile.targetSalary || "Not provided"}
Visa Status: ${profile.visaStatus || "Not provided"}
Skills: ${skills.length > 0 ? skills.join(", ") : "Not provided"}
Work Experience: ${experience.length > 0 ? experience.map((e) => `${e.role} at ${e.company} (${e.period})`).join("; ") : "Not provided"}
Education: ${education.length > 0 ? education.map((e) => `${e.degree} in ${e.field} from ${e.school}`).join("; ") : "Not provided"}

Use this profile to provide highly personalized career advice. Reference their specific background, skills, and goals when giving recommendations.`;
            systemPrompt = CAREER_SYSTEM_PROMPT + profileContext;
          }
        }
      } catch {
      }
      const result = streamText({
        model: openai.chat(ENV.llmModel),
        system: systemPrompt,
        messages: modelMessages,
        tools: careerTools,
        stopWhen: stepCountIs(5)
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

// server/_core/storageProxy.ts
import express from "express";
import path from "node:path";
function registerStorageProxy(app) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));
}

// server/resumeRoutes.ts
import multer from "multer";

// server/storage.ts
import fs from "node:fs";
import path2 from "node:path";
var UPLOADS_DIR = path2.join(process.cwd(), "uploads");
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
async function storagePut(relKey, data, _contentType = "application/octet-stream") {
  ensureUploadsDir();
  const key = relKey.replace(/^\/+/, "");
  const filePath = path2.join(UPLOADS_DIR, key);
  fs.mkdirSync(path2.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, data);
  return { key, url: `/uploads/${key}` };
}

// server/pdfParser.ts
import { createOpenAI as createOpenAI2 } from "@ai-sdk/openai";
import { generateText } from "ai";
var MIN_TEXT_LENGTH = 50;
async function extractWithPdfjs(buffer) {
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { getDocument } = pdfjsLib;
    const data = new Uint8Array(buffer);
    const doc = await getDocument({ data, useSystemFonts: true }).promise;
    const pageCount = doc.numPages;
    let fullText = "";
    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const items = content.items;
      let lastY = null;
      const lines = [];
      let currentLine = "";
      for (const item of items) {
        const y = item.transform ? item.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        }
        currentLine += item.str;
        if (item.hasEOL) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        }
        lastY = y;
      }
      if (currentLine.trim()) lines.push(currentLine.trim());
      fullText += lines.join("\n") + "\n\n";
    }
    const trimmed = fullText.trim();
    if (trimmed.length >= MIN_TEXT_LENGTH) {
      return { text: trimmed, pageCount };
    }
    return null;
  } catch (err) {
    console.error("[pdfParser] pdfjs-dist error:", err);
    return null;
  }
}
async function extractWithGeminiVision(buffer) {
  if (!ENV.llmApiKey) return null;
  try {
    const baseURL = ENV.llmBaseUrl ? ENV.llmBaseUrl.endsWith("/v1") ? ENV.llmBaseUrl : `${ENV.llmBaseUrl}/v1` : void 0;
    const openai = createOpenAI2({ baseURL, apiKey: ENV.llmApiKey });
    const base64Pdf = buffer.toString("base64");
    const { text: text2 } = await generateText({
      model: openai.chat(ENV.llmModel),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: base64Pdf,
              mimeType: "application/pdf"
            },
            {
              type: "text",
              text: `Extract ALL text from this resume/CV PDF. Preserve the structure: name, contact info, summary, work experience (company, role, dates, descriptions), education, skills, certifications. Output plain text only, no markdown formatting. If the document is in Korean, preserve the Korean text.`
            }
          ]
        }
      ]
    });
    if (text2 && text2.trim().length >= MIN_TEXT_LENGTH) {
      return text2.trim();
    }
    return null;
  } catch (err) {
    console.error("[pdfParser] Gemini Vision error:", err);
    return null;
  }
}
async function extractTextFromPdf(buffer) {
  const pdfjsResult = await extractWithPdfjs(buffer);
  if (pdfjsResult) {
    return {
      text: pdfjsResult.text,
      method: "pdfjs",
      pageCount: pdfjsResult.pageCount
    };
  }
  const visionText = await extractWithGeminiVision(buffer);
  if (visionText) {
    return {
      text: visionText,
      method: "gemini-vision",
      warning: "AI Vision parser used \u2014 ideal for scanned or image-based PDFs."
    };
  }
  throw new Error(
    "Could not extract text from this PDF. The file may be password-protected, corrupted, or contain only images without readable text. Please try uploading a DOCX or TXT version instead."
  );
}
function getParseMethodLabel(method) {
  switch (method) {
    case "pdfjs":
      return "PDF text parser";
    case "pymupdf":
      return "LaTeX-optimized parser";
    case "pdf-parse":
      return "Standard PDF parser";
    case "gemini-vision":
      return "AI Vision parser (scanned PDF)";
  }
}

// server/demoData.ts
var DEMO_JOBS = [
  {
    id: "demo-sg-ai-marketing-001",
    title: "AI Marketing Analyst",
    company: "Merlion Growth Labs",
    location: "singapore",
    salary: "S$5,500-7,500/mo",
    source: "other",
    applyUrl: "https://example.com/demo/ai-marketing-analyst",
    visa: true,
    type: "fulltime",
    experience: "junior",
    industry: "marketing",
    posted: 2,
    remote: false,
    description: "Use customer, campaign, and product data to improve regional growth programs across Singapore and Southeast Asia.",
    closingDate: "Demo listing",
    employmentType: "Full-time",
    skills: ["SQL", "Marketing Analytics", "Dashboarding", "Generative AI"]
  },
  {
    id: "demo-hk-growth-002",
    title: "Growth Strategy Associate",
    company: "Harbour Fintech Studio",
    location: "hongkong",
    salary: "HK$32,000-45,000/mo",
    source: "other",
    applyUrl: "https://example.com/demo/growth-strategy-associate",
    visa: true,
    type: "fulltime",
    experience: "junior",
    industry: "finance",
    posted: 4,
    remote: false,
    description: "Support go-to-market experiments, customer research, and strategic partnerships for a cross-border fintech product.",
    closingDate: "Demo listing",
    employmentType: "Full-time",
    skills: ["Market Research", "Partnerships", "Fintech", "Excel"]
  },
  {
    id: "demo-dubai-pm-003",
    title: "Associate Product Manager",
    company: "Desert Cloud Commerce",
    location: "dubai",
    salary: "AED 14,000-20,000/mo",
    source: "other",
    applyUrl: "https://example.com/demo/associate-product-manager",
    visa: true,
    type: "fulltime",
    experience: "mid",
    industry: "ecommerce",
    posted: 5,
    remote: false,
    description: "Own product discovery, analytics, and launch coordination for a commerce platform serving GCC merchants.",
    closingDate: "Demo listing",
    employmentType: "Full-time",
    skills: ["Product Analytics", "Roadmapping", "User Research", "SQL"]
  },
  {
    id: "demo-kr-global-brand-004",
    title: "Global Brand Operations Specialist",
    company: "Seoul Consumer Tech",
    location: "korea",
    salary: "KRW 4.2M-6.0M/mo",
    source: "other",
    applyUrl: "https://example.com/demo/global-brand-operations",
    visa: false,
    type: "fulltime",
    experience: "junior",
    industry: "marketing",
    posted: 7,
    remote: false,
    description: "Coordinate English-language brand operations, creator campaigns, and overseas launch assets for a Korean consumer tech team.",
    closingDate: "Demo listing",
    employmentType: "Full-time",
    skills: ["Korean", "English", "Creator Marketing", "Operations"]
  },
  {
    id: "demo-remote-data-005",
    title: "Remote Data Storytelling Consultant",
    company: "Open Career Analytics",
    location: "remote",
    salary: "USD 45-65/hr",
    source: "other",
    applyUrl: "https://example.com/demo/data-storytelling-consultant",
    visa: false,
    type: "contract",
    experience: "mid",
    industry: "tech",
    posted: 1,
    remote: true,
    description: "Turn messy customer and market datasets into executive-ready dashboards, narratives, and weekly decision briefs.",
    closingDate: "Demo listing",
    employmentType: "Contract",
    skills: ["Data Visualization", "Storytelling", "Tableau", "Python"]
  }
];
var DEMO_CHECKLIST = [
  "Complete career profile with target country, role, salary, and visa status",
  "Upload a resume or paste resume text for analysis",
  "Save three target jobs and run one job fit evaluation",
  "Move one application through the tracker and generate interview prep",
  "Generate a weekly career management report"
];

// server/jobFetcher.ts
import axios from "axios";
import Papa from "papaparse";
var CACHE_TTL = 30 * 60 * 1e3;
var careerGovCache = null;
var mcfCache = /* @__PURE__ */ new Map();
var jsearchCache = /* @__PURE__ */ new Map();
var saraminCache = /* @__PURE__ */ new Map();
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}
function daysAgo(timestamp2) {
  if (!timestamp2 || isNaN(timestamp2)) return 0;
  const now = Date.now();
  const diff = now - timestamp2;
  return Math.max(0, Math.floor(diff / (1e3 * 60 * 60 * 24)));
}
function mapExperienceLevel(_expText, minYears, _maxYears) {
  const min = minYears ?? 0;
  if (min <= 1) return "entry";
  if (min <= 3) return "junior";
  if (min <= 7) return "mid";
  return "senior";
}
function mapEmploymentType(empType) {
  if (!empType) return "fulltime";
  const lower = empType.toLowerCase();
  if (lower.includes("permanent") || lower.includes("full") || lower.includes("\uC815\uADDC")) return "fulltime";
  if (lower.includes("contract") || lower.includes("fixed") || lower.includes("\uACC4\uC57D")) return "contract";
  if (lower.includes("intern") || lower.includes("\uC778\uD134")) return "internship";
  if (lower.includes("part") || lower.includes("flexi") || lower.includes("\uD30C\uD2B8")) return "parttime";
  return "fulltime";
}
function mapIndustryFromField(field) {
  if (!field) return "government";
  const lower = field.toLowerCase();
  if (lower.includes("tech") || lower.includes("info") || lower.includes("digital") || lower.includes("data") || lower.includes("software") || lower.includes("it") || lower.includes("\uAC8C\uC784") || lower.includes("\uC18C\uD504\uD2B8\uC6E8\uC5B4")) return "tech";
  if (lower.includes("financ") || lower.includes("account") || lower.includes("bank") || lower.includes("\uAE08\uC735") || lower.includes("\uD68C\uACC4")) return "finance";
  if (lower.includes("health") || lower.includes("medical") || lower.includes("pharma") || lower.includes("\uC758\uB8CC") || lower.includes("\uC81C\uC57D")) return "healthcare";
  if (lower.includes("educ") || lower.includes("train") || lower.includes("\uAD50\uC721")) return "education";
  if (lower.includes("engineer") || lower.includes("\uC5D4\uC9C0\uB2C8\uC5B4")) return "tech";
  if (lower.includes("legal") || lower.includes("law") || lower.includes("\uBC95")) return "legal";
  if (lower.includes("market") || lower.includes("commun") || lower.includes("media") || lower.includes("\uB9C8\uCF00\uD305") || lower.includes("\uAD11\uACE0")) return "marketing";
  if (lower.includes("hotel") || lower.includes("food") || lower.includes("hospitality") || lower.includes("\uC2DD\uD488") || lower.includes("\uD638\uD154")) return "hospitality";
  if (lower.includes("logist") || lower.includes("transport") || lower.includes("supply") || lower.includes("\uBB3C\uB958") || lower.includes("\uC720\uD1B5")) return "logistics";
  return "government";
}
var LOCATION_QUERIES = {
  singapore: "in Singapore",
  hongkong: "in Hong Kong",
  dubai: "in Dubai UAE",
  korea: "in South Korea",
  remote: "remote"
};
var CAREERGOV_CSV_URL = "https://raw.githubusercontent.com/opengovsg/careersgovsg-jobs-data/main/data/job-listings.csv";
async function fetchCareerGovJobs() {
  if (careerGovCache && Date.now() - careerGovCache.timestamp < CACHE_TTL) {
    return careerGovCache.data;
  }
  try {
    console.log("[JobFetcher] Fetching Career@Gov CSV...");
    const response = await axios.get(CAREERGOV_CSV_URL, {
      timeout: 3e4,
      responseType: "text"
    });
    const parsed = Papa.parse(response.data, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false
    });
    if (parsed.errors.length > 0) {
      console.warn(`[JobFetcher] Career@Gov CSV parse warnings: ${parsed.errors.length}`);
    }
    const jobs2 = [];
    const rows = parsed.data.slice(0, 500);
    for (const row of rows) {
      const title = (row.jobTitle || "").replace(/\u00a0/g, " ").trim();
      const agency = (row.agency || "").replace(/\u00a0/g, " ").trim();
      const postingNo = row.postingNo || "";
      const jobId = row.jobId || "";
      if (!title || !agency || !jobId) continue;
      const applyUrl = `https://jobs.careers.gov.sg/jobs/hrp/${jobId}/${postingNo}`;
      const startDateMs = parseInt(row.startDate) || 0;
      const closingDateText = row.closingDateText || "";
      const descParts = [row.jobDescription, row.jobResponsibilities, row.jobRequirements].filter(Boolean);
      const fullDesc = stripHtml(descParts.join(" "));
      const shortDesc = fullDesc.slice(0, 300) + (fullDesc.length > 300 ? "..." : "");
      const minYears = parseInt(row.experienceYearsMin) || 0;
      const maxYears = parseInt(row.experienceYearsMax) || 0;
      jobs2.push({
        id: `cg-${jobId}-${postingNo.slice(0, 8)}`,
        title,
        company: agency,
        agency,
        location: "singapore",
        source: "careergov",
        applyUrl,
        visa: true,
        type: mapEmploymentType(row.employmentType),
        experience: mapExperienceLevel(row.experienceRequired, minYears, maxYears),
        industry: mapIndustryFromField(row.field || row.functionalArea || row.industry),
        posted: daysAgo(startDateMs),
        remote: (row.workArrangement || "").toLowerCase().includes("remote"),
        description: shortDesc,
        closingDate: closingDateText,
        employmentType: row.employmentType
      });
    }
    console.log(`[JobFetcher] Career@Gov: ${jobs2.length} jobs loaded`);
    careerGovCache = { data: jobs2, timestamp: Date.now() };
    return jobs2;
  } catch (error) {
    console.error("[JobFetcher] Career@Gov fetch error:", error);
    return careerGovCache?.data || [];
  }
}
var MCF_API_URL = "https://api.mycareersfuture.gov.sg/v2/jobs/";
function mapMCFExperience(minYears, position) {
  if (position) {
    const lower = position.toLowerCase();
    if (lower.includes("senior") || lower.includes("manager") || lower.includes("director")) return "senior";
    if (lower.includes("executive") || lower.includes("professional")) return "mid";
    if (lower.includes("junior") || lower.includes("fresh")) return "junior";
    if (lower.includes("non-executive") || lower.includes("entry")) return "entry";
  }
  if (minYears === null || minYears === void 0) return "mid";
  if (minYears <= 1) return "entry";
  if (minYears <= 3) return "junior";
  if (minYears <= 7) return "mid";
  return "senior";
}
function mapMCFEmploymentType(types) {
  if (!types || types.length === 0) return "fulltime";
  const t2 = (types[0]?.employmentType || "").toLowerCase();
  if (t2.includes("permanent") || t2.includes("full")) return "fulltime";
  if (t2.includes("contract") || t2.includes("temp")) return "contract";
  if (t2.includes("intern")) return "internship";
  if (t2.includes("part") || t2.includes("flexi")) return "parttime";
  return "fulltime";
}
function formatSalary(salary) {
  if (!salary || salary.minimum === null && salary.maximum === null) return void 0;
  const min = salary.minimum;
  const max = salary.maximum;
  const type = salary.type?.salaryType || "Monthly";
  const suffix = type === "Monthly" ? "/mo" : type === "Annual" ? "/yr" : "";
  if (min && max) return `S$${min.toLocaleString()}-${max.toLocaleString()}${suffix}`;
  if (min) return `S$${min.toLocaleString()}+${suffix}`;
  if (max) return `Up to S$${max.toLocaleString()}${suffix}`;
  return void 0;
}
function mapMCFIndustry(categories) {
  if (!categories || categories.length === 0) return "others";
  const cat = (categories[0]?.category || "").toLowerCase();
  if (cat.includes("tech") || cat.includes("info") || cat.includes("software") || cat.includes("data")) return "tech";
  if (cat.includes("financ") || cat.includes("bank") || cat.includes("account") || cat.includes("insurance")) return "finance";
  if (cat.includes("health") || cat.includes("medical") || cat.includes("pharma")) return "healthcare";
  if (cat.includes("educ") || cat.includes("train")) return "education";
  if (cat.includes("market") || cat.includes("sales") || cat.includes("retail")) return "sales";
  if (cat.includes("admin") || cat.includes("human") || cat.includes("hr")) return "hr";
  return "others";
}
async function fetchMCFJobs(search, limit = 50, filters) {
  const filterKey = filters ? JSON.stringify(filters) : "";
  const cacheKey = `mcf-${search || "all"}-${limit}-${filterKey}`;
  const cached = mcfCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  try {
    const pageSize = Math.min(limit, 100);
    const pages = limit > 100 ? Math.ceil(limit / 100) : 1;
    console.log(`[JobFetcher] Fetching MCF jobs (search=${search || "all"}, limit=${limit}, pages=${pages})...`);
    const baseParams = {
      limit: pageSize
    };
    if (search) baseParams.search = search;
    if (filters?.salaryMin) baseParams.salaryMin = filters.salaryMin;
    if (filters?.salaryMax) baseParams.salaryMax = filters.salaryMax;
    if (filters?.categories) baseParams.categories = filters.categories;
    if (filters?.employmentTypes) baseParams.employmentTypes = filters.employmentTypes;
    if (filters?.positionLevels) baseParams.positionLevels = filters.positionLevels;
    const pageRequests = Array.from(
      { length: pages },
      (_, i) => axios.get(MCF_API_URL, {
        params: { ...baseParams, page: i },
        timeout: 15e3,
        headers: { "User-Agent": "JobPA/1.0" }
      })
    );
    const responses = await Promise.allSettled(pageRequests);
    const allResults = [];
    for (const res of responses) {
      if (res.status === "fulfilled" && res.value.data?.results) {
        allResults.push(...res.value.data.results);
      }
    }
    const data = { results: allResults };
    if (!data || !data.results || data.results.length === 0) return [];
    const jobs2 = data.results.map((job) => {
      const postDate = job.metadata?.newPostingDate || job.metadata?.createdAt;
      const daysPosted = postDate ? daysAgo(new Date(postDate).getTime()) : 0;
      const position = job.positionLevels?.[0]?.position || "";
      return {
        id: `mcf-${job.uuid}`,
        title: job.title,
        company: job.hiringCompany?.name || job.postedCompany?.name || "Unknown",
        location: "singapore",
        salary: formatSalary(job.salary),
        source: "mcf",
        applyUrl: job.metadata?.jobDetailsUrl || `https://www.mycareersfuture.gov.sg/job/${job.uuid}`,
        visa: true,
        type: mapMCFEmploymentType(job.employmentTypes),
        experience: mapMCFExperience(job.minimumYearsExperience, position),
        industry: mapMCFIndustry(job.categories),
        posted: daysPosted,
        remote: false,
        description: stripHtml(job.description || "").slice(0, 300),
        closingDate: job.metadata?.expiryDate ? new Date(job.metadata.expiryDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : void 0,
        skills: job.skills?.slice(0, 5).map((s) => s?.skill).filter(Boolean)
      };
    });
    console.log(`[JobFetcher] MCF: ${jobs2.length} jobs loaded`);
    mcfCache.set(cacheKey, { data: jobs2, timestamp: Date.now() });
    return jobs2;
  } catch (error) {
    console.error("[JobFetcher] MCF fetch error:", error);
    const cached2 = mcfCache.get(cacheKey);
    return cached2?.data || [];
  }
}
var JSEARCH_API_URL = "https://jsearch.p.rapidapi.com/search";
function mapJSearchSource(publisher) {
  if (!publisher) return "other";
  const lower = publisher.toLowerCase();
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("indeed")) return "indeed";
  if (lower.includes("glassdoor")) return "glassdoor";
  if (lower.includes("ziprecruiter")) return "ziprecruiter";
  if (lower.includes("monster")) return "monster";
  if (lower.includes("jobstreet")) return "jobstreet";
  if (lower.includes("google")) return "google";
  return "other";
}
function mapJSearchExperience(exp) {
  if (!exp) return "mid";
  if (exp.no_experience_required) return "entry";
  const months = exp.required_experience_in_months;
  if (months === null || months === void 0) return "mid";
  if (months <= 12) return "entry";
  if (months <= 36) return "junior";
  if (months <= 84) return "mid";
  return "senior";
}
function mapJSearchEmploymentType(type) {
  if (!type) return "fulltime";
  const lower = type.toLowerCase();
  if (lower.includes("full")) return "fulltime";
  if (lower.includes("contract") || lower.includes("temp")) return "contract";
  if (lower.includes("intern")) return "internship";
  if (lower.includes("part")) return "parttime";
  return "fulltime";
}
function mapJSearchIndustry(naicsName, title) {
  const text2 = ((naicsName || "") + " " + (title || "")).toLowerCase();
  if (text2.includes("tech") || text2.includes("software") || text2.includes("developer") || text2.includes("engineer") || text2.includes("data") || text2.includes("cloud") || text2.includes("cyber")) return "tech";
  if (text2.includes("financ") || text2.includes("bank") || text2.includes("account") || text2.includes("invest")) return "finance";
  if (text2.includes("health") || text2.includes("medical") || text2.includes("pharma") || text2.includes("nurs")) return "healthcare";
  if (text2.includes("educ") || text2.includes("teach") || text2.includes("professor")) return "education";
  if (text2.includes("market") || text2.includes("sales") || text2.includes("brand")) return "marketing";
  if (text2.includes("hotel") || text2.includes("food") || text2.includes("hospitality") || text2.includes("chef")) return "hospitality";
  if (text2.includes("logist") || text2.includes("supply") || text2.includes("warehouse")) return "logistics";
  if (text2.includes("legal") || text2.includes("law") || text2.includes("compliance")) return "legal";
  return "others";
}
function formatJSearchSalary(job) {
  if (!job.job_min_salary && !job.job_max_salary) return void 0;
  const currency = job.job_salary_currency || "USD";
  const period = job.job_salary_period === "YEAR" ? "/yr" : job.job_salary_period === "MONTH" ? "/mo" : job.job_salary_period === "HOUR" ? "/hr" : "";
  const min = job.job_min_salary;
  const max = job.job_max_salary;
  if (min && max) return `${currency} ${min.toLocaleString()}-${max.toLocaleString()}${period}`;
  if (min) return `${currency} ${min.toLocaleString()}+${period}`;
  if (max) return `Up to ${currency} ${max.toLocaleString()}${period}`;
  return void 0;
}
function mapLocationFromJSearch(job, queryLocation) {
  const country = (job.job_country || "").toLowerCase();
  const city = (job.job_city || "").toLowerCase();
  if (job.job_is_remote) return "remote";
  if (country.includes("singapore") || city.includes("singapore")) return "singapore";
  if (country.includes("hong kong") || city.includes("hong kong")) return "hongkong";
  if (country.includes("united arab") || city.includes("dubai") || city.includes("abu dhabi")) return "dubai";
  if (country.includes("korea") || city.includes("seoul") || city.includes("busan")) return "korea";
  return queryLocation || "remote";
}
async function fetchJSearchJobs(search, location = "singapore", limit = 30) {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    console.log("[JobFetcher] JSearch: No RAPIDAPI_KEY, skipping");
    return [];
  }
  const cacheKey = `jsearch-${search || "all"}-${location}-${limit}`;
  const cached = jsearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  try {
    const locationSuffix = LOCATION_QUERIES[location] || LOCATION_QUERIES["singapore"];
    const query = search ? `${search} ${locationSuffix}` : `jobs ${locationSuffix}`;
    console.log(`[JobFetcher] Fetching JSearch jobs (query="${query}", limit=${limit})...`);
    const response = await axios.get(JSEARCH_API_URL, {
      params: {
        query,
        page: 1,
        num_pages: Math.ceil(limit / 10),
        date_posted: "month"
      },
      headers: {
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        "X-RapidAPI-Key": rapidApiKey
      },
      timeout: 15e3
    });
    const data = response.data;
    if (!data || data.status !== "OK" || !data.data) {
      console.warn("[JobFetcher] JSearch: Unexpected response", data?.status);
      return [];
    }
    const jobs2 = data.data.slice(0, limit).map((job) => {
      const daysPosted = job.job_posted_at_timestamp ? daysAgo(job.job_posted_at_timestamp * 1e3) : 0;
      return {
        id: `js-${job.job_id?.slice(0, 20) || Math.random().toString(36).slice(2)}`,
        title: job.job_title || "Untitled",
        company: job.employer_name || "Unknown",
        location: mapLocationFromJSearch(job, location),
        salary: formatJSearchSalary(job),
        source: mapJSearchSource(job.job_publisher),
        applyUrl: job.job_apply_link || job.job_google_link || "#",
        visa: location === "singapore" || location === "dubai",
        type: mapJSearchEmploymentType(job.job_employment_type),
        experience: mapJSearchExperience(job.job_required_experience),
        industry: mapJSearchIndustry(job.job_naics_name, job.job_title),
        posted: daysPosted,
        remote: job.job_is_remote || false,
        description: stripHtml(job.job_description || "").slice(0, 300) + "...",
        skills: job.job_required_skills?.slice(0, 5) || [],
        companyLogo: job.employer_logo || void 0
      };
    });
    const uniqueSources = Array.from(new Set(jobs2.map((j) => j.source)));
    console.log(`[JobFetcher] JSearch: ${jobs2.length} jobs loaded (sources: ${uniqueSources.join(", ")})`);
    jsearchCache.set(cacheKey, { data: jobs2, timestamp: Date.now() });
    return jobs2;
  } catch (error) {
    if (error?.response?.status === 429) {
      console.warn("[JobFetcher] JSearch: Rate limited (429). Using cache or skipping.");
    } else {
      console.error("[JobFetcher] JSearch fetch error:", error?.message || error);
    }
    const cached2 = jsearchCache.get(cacheKey);
    return cached2?.data || [];
  }
}
var SARAMIN_API_URL = "https://oapi.saramin.co.kr/job-search";
function parseSaraminText(field) {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object") {
    return field["#text"] || field["_"] || "";
  }
  return String(field);
}
function mapSaraminExperience(expLevel) {
  if (!expLevel) return "mid";
  const code = typeof expLevel === "object" ? expLevel["@code"] : "";
  const min = typeof expLevel === "object" ? parseInt(expLevel["@min"] || "0") : 0;
  if (code === "1") return "entry";
  if (min <= 2) return "junior";
  if (min <= 5) return "mid";
  if (min > 5) return "senior";
  return "mid";
}
function mapSaraminJobType(jobType) {
  const text2 = parseSaraminText(jobType).toLowerCase();
  if (text2.includes("\uC815\uADDC")) return "fulltime";
  if (text2.includes("\uACC4\uC57D")) return "contract";
  if (text2.includes("\uC778\uD134")) return "internship";
  if (text2.includes("\uD30C\uD2B8") || text2.includes("\uC544\uB974\uBC14\uC774\uD2B8")) return "parttime";
  return "fulltime";
}
function mapSaraminIndustry(industry, jobMidCode) {
  const industryText = parseSaraminText(industry).toLowerCase();
  const jobText = parseSaraminText(jobMidCode).toLowerCase();
  const combined = industryText + " " + jobText;
  if (combined.includes("it") || combined.includes("\uC18C\uD504\uD2B8\uC6E8\uC5B4") || combined.includes("\uAC8C\uC784") || combined.includes("\uC778\uD130\uB137") || combined.includes("\uB370\uC774\uD130")) return "tech";
  if (combined.includes("\uAE08\uC735") || combined.includes("\uC740\uD589") || combined.includes("\uBCF4\uD5D8") || combined.includes("\uD68C\uACC4")) return "finance";
  if (combined.includes("\uC758\uB8CC") || combined.includes("\uC81C\uC57D") || combined.includes("\uBC14\uC774\uC624") || combined.includes("\uBCD1\uC6D0")) return "healthcare";
  if (combined.includes("\uAD50\uC721") || combined.includes("\uD559\uC6D0")) return "education";
  if (combined.includes("\uB9C8\uCF00\uD305") || combined.includes("\uAD11\uACE0") || combined.includes("\uD64D\uBCF4") || combined.includes("\uBBF8\uB514\uC5B4")) return "marketing";
  if (combined.includes("\uBB3C\uB958") || combined.includes("\uC720\uD1B5") || combined.includes("\uC6B4\uC1A1")) return "logistics";
  if (combined.includes("\uC2DD\uD488") || combined.includes("\uD638\uD154") || combined.includes("\uC678\uC2DD")) return "hospitality";
  if (combined.includes("\uBC95") || combined.includes("\uBC95\uB960")) return "legal";
  if (combined.includes("\uC601\uC5C5") || combined.includes("\uD310\uB9E4")) return "sales";
  return "others";
}
function formatSaraminSalary(salary) {
  const text2 = parseSaraminText(salary);
  if (!text2 || text2 === "\uD68C\uC0AC\uB0B4\uADDC\uC5D0 \uB530\uB984") return void 0;
  return text2;
}
async function fetchSaraminJobs(search, limit = 40) {
  const saraminApiKey = process.env.SARAMIN_API_KEY;
  if (!saraminApiKey) {
    console.log("[JobFetcher] Saramin: No SARAMIN_API_KEY, skipping (add key to enable Korean job listings from \uC0AC\uB78C\uC778)");
    return [];
  }
  const cacheKey = `saramin-${search || "all"}-${limit}`;
  const cached = saraminCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  try {
    console.log(`[JobFetcher] Fetching Saramin jobs (search=${search || "all"}, limit=${limit})...`);
    const params = {
      "access-key": saraminApiKey,
      count: Math.min(limit, 110),
      sort: "pd"
      // 게시일 역순 (newest first)
    };
    if (search) params.keywords = search;
    const response = await axios.get(SARAMIN_API_URL, {
      params,
      timeout: 15e3,
      headers: {
        Accept: "application/json",
        "User-Agent": "JobPA/1.0"
      }
    });
    const data = response.data;
    const jobsData = data?.["job-search"]?.jobs || data?.jobs;
    if (!jobsData) {
      console.warn("[JobFetcher] Saramin: Unexpected response structure", JSON.stringify(data).slice(0, 200));
      return [];
    }
    const jobArray = Array.isArray(jobsData.job) ? jobsData.job : jobsData.job ? [jobsData.job] : [];
    const jobs2 = jobArray.slice(0, limit).map((job) => {
      const postingTimestamp = parseInt(job["posting-timestamp"] || "0") * 1e3;
      const expirationTimestamp = parseInt(job["expiration-timestamp"] || "0") * 1e3;
      const daysPosted = postingTimestamp ? daysAgo(postingTimestamp) : 0;
      const companyName = typeof job.company?.name === "object" ? job.company.name["#text"] || "" : job.company?.name || "Unknown";
      const title = parseSaraminText(job.position?.title) || "Untitled";
      const locationText = parseSaraminText(job.position?.location);
      const jobType = job.position?.["job-type"];
      const industry = job.position?.industry;
      const jobMidCode = job.position?.["job-mid-code"];
      const expLevel = job.position?.["experience-level"];
      let closingDate;
      if (expirationTimestamp) {
        closingDate = new Date(expirationTimestamp).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      }
      return {
        id: `saramin-${job.id}`,
        title,
        company: companyName.trim(),
        location: "korea",
        salary: formatSaraminSalary(job.salary),
        source: "saramin",
        applyUrl: job.url || `https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=${job.id}`,
        visa: false,
        // Korean domestic jobs
        type: mapSaraminJobType(jobType),
        experience: mapSaraminExperience(expLevel),
        industry: mapSaraminIndustry(industry, jobMidCode),
        posted: daysPosted,
        remote: locationText.includes("\uC7AC\uD0DD") || locationText.includes("\uC6D0\uACA9"),
        description: `${locationText} | ${parseSaraminText(jobType)} | ${parseSaraminText(expLevel)}`,
        closingDate,
        skills: job.keyword ? job.keyword.split(",").map((k) => k.trim()).filter(Boolean).slice(0, 5) : []
      };
    });
    console.log(`[JobFetcher] Saramin: ${jobs2.length} jobs loaded`);
    saraminCache.set(cacheKey, { data: jobs2, timestamp: Date.now() });
    return jobs2;
  } catch (error) {
    if (error?.response?.status === 403 || error?.response?.status === 401) {
      console.warn("[JobFetcher] Saramin: Invalid API key (403/401). Check SARAMIN_API_KEY.");
    } else if (error?.response?.status === 429) {
      console.warn("[JobFetcher] Saramin: Rate limited (429). Using cache or skipping.");
    } else {
      console.error("[JobFetcher] Saramin fetch error:", error?.message || error);
    }
    const cached2 = saraminCache.get(cacheKey);
    return cached2?.data || [];
  }
}
async function fetchAllJobs(options) {
  const { search, location = "all", limit = 100 } = options || {};
  const fetchers = [];
  const isSingapore = location === "all" || location === "singapore";
  const isKorea = location === "all" || location === "korea";
  if (isSingapore) {
    fetchers.push(fetchCareerGovJobs());
    fetchers.push(fetchMCFJobs(search, 50));
  }
  if (isKorea) {
    fetchers.push(fetchSaraminJobs(search, 40));
  }
  if (location === "all") {
    fetchers.push(fetchJSearchJobs(search, "singapore", 20));
    fetchers.push(fetchJSearchJobs(search, "hongkong", 20));
    fetchers.push(fetchJSearchJobs(search, "dubai", 20));
    fetchers.push(fetchJSearchJobs(search, "korea", 20));
    fetchers.push(fetchJSearchJobs(search, "remote", 20));
  } else {
    fetchers.push(fetchJSearchJobs(search, location, 40));
  }
  const results = await Promise.allSettled(fetchers);
  let allJobs = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allJobs.push(...result.value);
    }
  }
  if (search && isSingapore) {
    const searchLower = search.toLowerCase();
    allJobs = allJobs.filter((job) => {
      if (job.source === "mcf" || !["careergov"].includes(job.source)) return true;
      return (job.title || "").toLowerCase().includes(searchLower) || (job.company || "").toLowerCase().includes(searchLower) || (job.description || "").toLowerCase().includes(searchLower);
    });
  }
  if (location && location !== "all") {
    allJobs = allJobs.filter((j) => j.location === location || j.remote);
  }
  const seen = /* @__PURE__ */ new Set();
  allJobs = allJobs.filter((job) => {
    const key = `${(job.title || "").toLowerCase().trim()}|${(job.company || "").toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  allJobs.sort((a, b) => a.posted - b.posted);
  const limited = allJobs.slice(0, limit);
  const sources = {};
  for (const job of limited) {
    sources[job.source] = (sources[job.source] || 0) + 1;
  }
  return {
    jobs: limited,
    total: allJobs.length,
    sources
  };
}

// server/jobpaAdapter.ts
function countSources(jobs2) {
  return jobs2.reduce((acc, job) => {
    acc[job.source] = (acc[job.source] || 0) + 1;
    return acc;
  }, {});
}
function dbJobToListing(job) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location || "remote",
    salary: job.salary || void 0,
    source: job.source || "other",
    applyUrl: job.applyUrl || "#",
    visa: Boolean(job.visa),
    type: job.type || "fulltime",
    experience: job.experience || "mid",
    industry: job.industry || "others",
    posted: job.posted ?? 0,
    remote: Boolean(job.remote),
    description: job.description || "",
    closingDate: job.closingDate || void 0,
    skills: Array.isArray(job.skills) ? job.skills : []
  };
}
function listingToDbJob(job) {
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
    raw: job
  };
}
function filterDemoJobs(options) {
  const search = options?.search?.trim().toLowerCase();
  const location = options?.location && options.location !== "all" ? options.location : void 0;
  return DEMO_JOBS.filter((job) => !location || job.location === location || job.remote).filter((job) => {
    if (!search) return true;
    const haystack = `${job.title} ${job.company} ${job.description} ${(job.skills ?? []).join(" ")}`.toLowerCase();
    return haystack.includes(search);
  }).slice(0, options?.limit ?? 100);
}
async function recordHealth(service, status, startedAt, message, fallbackUsed = false) {
  await recordApiHealth({
    service,
    status,
    message,
    responseMs: Date.now() - startedAt,
    fallbackUsed
  });
}
async function fetchJobs(options) {
  const startedAt = Date.now();
  try {
    const live = await fetchAllJobs(options);
    if (live.jobs.length > 0) {
      upsertCachedJobs(live.jobs.map(listingToDbJob)).catch((error) => {
        console.warn("[JobPA Adapter] Job cache write skipped:", error?.message || error);
      });
      await recordHealth("jobs.live", "ok", startedAt);
      return {
        ...live,
        mode: "live"
      };
    }
    throw new Error("Live job APIs returned no jobs");
  } catch (error) {
    const liveMessage = error?.message || "Live job APIs unavailable";
    console.warn("[JobPA Adapter] Live job fetch failed:", liveMessage);
    await recordHealth("jobs.live", "degraded", startedAt, liveMessage, true);
    try {
      const cached = await getCachedJobs(options);
      if (cached.length > 0) {
        const jobs3 = cached.map(dbJobToListing);
        return {
          jobs: jobs3,
          total: jobs3.length,
          sources: countSources(jobs3),
          mode: "cached",
          message: "Live job APIs are temporarily unavailable. Showing cached database results."
        };
      }
    } catch (cacheError) {
      console.warn("[JobPA Adapter] Cached job fallback failed:", cacheError?.message || cacheError);
    }
    const jobs2 = filterDemoJobs(options);
    return {
      jobs: jobs2,
      total: jobs2.length,
      sources: countSources(jobs2),
      mode: "demo",
      message: "Live job APIs and cached database results are unavailable. Showing sanitized demo jobs for review."
    };
  }
}
async function saveJob(userId, job, notes) {
  const snapshot = { ...job };
  let savedJobResult = null;
  let applicationResult = null;
  try {
    savedJobResult = await saveSavedJob(userId, {
      jobId: job.id,
      status: "saved",
      notes,
      snapshot
    });
  } catch (error) {
    console.warn("[JobPA Adapter] saved_jobs write skipped:", error?.message || error);
  }
  try {
    applicationResult = await saveApplication({
      userId,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      applyUrl: job.applyUrl,
      source: job.source,
      status: "bookmarked",
      salary: job.salary,
      notes
    });
    await awardXP(userId, "apply", "Saved a job").catch(() => void 0);
  } catch (error) {
    console.warn("[JobPA Adapter] bookmark application write skipped:", error?.message || error);
  }
  if (!savedJobResult && !applicationResult) {
    return { offline: true, mode: "offline", message: "Database unavailable. Job was not persisted." };
  }
  return { savedJob: savedJobResult, application: applicationResult, mode: "live" };
}
async function createApplication(userId, input) {
  try {
    const result = await saveApplication({ userId, status: "applied", ...input });
    await awardXP(userId, "apply", "Tracked an application").catch(() => void 0);
    return result;
  } catch (error) {
    console.warn("[JobPA Adapter] Application write failed:", error?.message || error);
    return {
      id: -Date.now(),
      userId,
      ...input,
      status: input.status ?? "applied",
      offline: true,
      message: "Database unavailable. Application was not persisted.",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      appliedAt: /* @__PURE__ */ new Date()
    };
  }
}
async function updateApplicationStatus2(userId, id, status, notes) {
  try {
    await updateApplicationStatus(id, userId, status, notes);
    return { success: true, mode: "live" };
  } catch (error) {
    console.warn("[JobPA Adapter] Application status update failed:", error?.message || error);
    return { success: false, mode: "offline", message: "Database unavailable. Status was not persisted." };
  }
}
async function getUserProfile2(userId) {
  const [careerProfile, legacyProfile, survey] = await Promise.all([
    getCareerProfile(userId).catch(() => null),
    getUserProfile(userId).catch(() => null),
    getSurveyByUserId(userId).catch(() => null)
  ]);
  if (!careerProfile && !legacyProfile && !survey) return null;
  return {
    ...legacyProfile ?? {},
    ...careerProfile ?? {},
    survey,
    targetRole: careerProfile?.targetRole ?? legacyProfile?.targetRole ?? survey?.targetRole ?? null,
    targetLocation: legacyProfile?.targetLocation ?? careerProfile?.market ?? (Array.isArray(survey?.preferredLocations) ? survey?.preferredLocations?.[0] : null),
    targetSalary: legacyProfile?.targetSalary ?? careerProfile?.salaryRange ?? survey?.salaryExpectation ?? null,
    visaStatus: legacyProfile?.visaStatus ?? careerProfile?.visaStatus ?? (survey?.needsVisaSponsorship ? "Needs sponsorship" : null),
    interests: careerProfile?.interests ?? survey?.interests ?? []
  };
}
async function saveUserProfile(userId, input) {
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
    agentState: input.agentState
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
    summary: input.summary ?? input.profileSummary
  };
  const [careerResult, legacyResult] = await Promise.all([
    upsertCareerProfile(userId, careerData).catch((error) => {
      console.warn("[JobPA Adapter] career profile write skipped:", error?.message || error);
      return null;
    }),
    upsertUserProfile(userId, legacyData).catch((error) => {
      console.warn("[JobPA Adapter] legacy profile write skipped:", error?.message || error);
      return null;
    })
  ]);
  if (!careerResult && !legacyResult) {
    return { offline: true, mode: "offline", message: "Database unavailable. Profile was not persisted.", ...input };
  }
  return { careerProfile: careerResult, userProfile: legacyResult, mode: "live" };
}
async function createResumeAnalysis2(input) {
  try {
    return await createResumeAnalysis(input);
  } catch (error) {
    console.warn("[JobPA Adapter] resume_analyses write skipped:", error?.message || error);
    return { offline: true, mode: "offline", message: "Database unavailable. Analysis status was not persisted." };
  }
}
async function createJobFitEvaluation2(userId, input) {
  const [newResult, legacyResult] = await Promise.all([
    createJobFitEvaluation({ userId, ...input }).catch((error) => {
      console.warn("[JobPA Adapter] job_fit_evaluations write skipped:", error?.message || error);
      return null;
    }),
    saveFitEvaluation(userId, {
      targetRole: input.targetRole,
      jobDescription: input.jobDescription,
      fitScore: input.fitScore,
      result: input.result
    }).catch((error) => {
      console.warn("[JobPA Adapter] legacy fit evaluation write skipped:", error?.message || error);
      return null;
    })
  ]);
  if (!newResult && !legacyResult) {
    return { offline: true, mode: "offline", message: "Database unavailable. Fit evaluation was not persisted.", ...input };
  }
  return { jobFitEvaluation: newResult, legacyFitEvaluation: legacyResult, mode: "live", ...input };
}

// server/agents.ts
var MARKET_TIPS = {
  singapore: [
    "For Singapore roles, make quantified business impact easy to scan and align seniority with EP salary expectations.",
    "Use MyCareersFuture and company career pages for official postings; treat third-party listings as discovery leads.",
    "Visa guidance is informational only. Check MOM or official employer instructions before making decisions."
  ],
  korea: [
    "For Korea, show Korean language level, global collaboration experience, and role-specific certifications where relevant.",
    "Large companies may use structured aptitude or group interview steps; prepare concise self-introductions in Korean and English.",
    "Visa guidance is informational only. Check HiKorea or official employer instructions before making decisions."
  ],
  hongkong: [
    "For Hong Kong, highlight bilingual English/Mandarin/Cantonese ability and finance or regional market exposure.",
    "Keep resumes concise and emphasize credentials, internships, and commercial outcomes.",
    "Visa guidance is informational only. Check official Hong Kong immigration sources before making decisions."
  ],
  dubai: [
    "For Dubai/UAE, state current visa status clearly and evaluate total package, not just base salary.",
    "LinkedIn, company career pages, and sector networks matter heavily for shortlisted roles.",
    "Visa guidance is informational only. Check official UAE or employer sources before making decisions."
  ],
  uae: [
    "For Dubai/UAE, state current visa status clearly and evaluate total package, not just base salary.",
    "LinkedIn, company career pages, and sector networks matter heavily for shortlisted roles.",
    "Visa guidance is informational only. Check official UAE or employer sources before making decisions."
  ],
  remote: [
    "For remote roles, state timezone overlap, async communication examples, and measurable ownership.",
    "Clarify contractor versus employee status before accepting an offer.",
    "Legal and tax implications vary by country; confirm with official or professional sources."
  ]
};
var COMMON_SKILLS = [
  "sql",
  "python",
  "excel",
  "tableau",
  "power bi",
  "analytics",
  "market research",
  "stakeholder",
  "project management",
  "product",
  "marketing",
  "crm",
  "seo",
  "paid media",
  "data visualization",
  "ai",
  "machine learning",
  "generative ai",
  "korean",
  "english",
  "mandarin",
  "salesforce",
  "hubspot",
  "figma"
];
function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}
function keywordize(text2) {
  const lower = text2.toLowerCase();
  return unique(COMMON_SKILLS.filter((skill) => lower.includes(skill)));
}
function titleKeywords(text2) {
  if (!text2) return [];
  return unique(
    text2.toLowerCase().split(/[^a-z0-9+#.]+/).filter((word) => word.length > 2 && !["the", "and", "for", "with", "role", "job"].includes(word)).slice(0, 12)
  );
}
function scoreResume(text2, targetKeywords) {
  const lower = text2.toLowerCase();
  let score = 35;
  if (text2.length > 800) score += 10;
  if (text2.length > 1800) score += 10;
  if (/experience|work|employment|경력/i.test(text2)) score += 8;
  if (/education|university|degree|학력/i.test(text2)) score += 7;
  if (/skills|tools|certification|기술|자격/i.test(text2)) score += 7;
  if (/\d+%|\$|s\$|krw|aed|hkd|increased|reduced|grew|saved|launched/i.test(text2)) score += 10;
  const matchedTargets = targetKeywords.filter((keyword) => lower.includes(keyword));
  score += Math.min(matchedTargets.length * 4, 16);
  return Math.max(0, Math.min(100, score));
}
function improvement(issue, suggestion, priority, impact = "Improves recruiter scan confidence.") {
  return { issue, suggestion, priority, impact };
}
var marketVisaAgent = {
  guidance(country) {
    const key = (country || "singapore").toLowerCase();
    const tips = MARKET_TIPS[key] ?? MARKET_TIPS.singapore;
    return {
      country: key,
      tips,
      disclaimer: "AI guidance only. This is not legal, visa, tax, or guaranteed employment advice; verify with official government and employer sources."
    };
  }
};
var intakeAgent = {
  buildCareerProfile(input) {
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
        intakeCompletedAt: (/* @__PURE__ */ new Date()).toISOString(),
        source: "onboarding"
      }
    };
  }
};
var resumeAgent = {
  analyzeResumeText(input) {
    const resumeText = (input.resumeText || "").trim();
    if (!resumeText || resumeText.length < 50) {
      return {
        status: "failed",
        message: "We could not fully parse this file. You can paste your resume text instead.",
        analysis: null
      };
    }
    const roleKeywords = titleKeywords(input.targetRole);
    const jdKeywords = titleKeywords(input.jobDescription).slice(0, 10);
    const targetKeywords = unique([...roleKeywords, ...jdKeywords]);
    const foundSkills = keywordize(resumeText);
    const missingKeywords = targetKeywords.filter((keyword) => !resumeText.toLowerCase().includes(keyword)).slice(0, 10);
    const overallScore = scoreResume(resumeText, targetKeywords);
    const status = input.parseWarning || resumeText.length < 300 ? "partial" : "success";
    const market = input.targetMarket || "singapore";
    const strengths = [
      foundSkills.length > 0 ? `Shows relevant skills: ${foundSkills.slice(0, 5).join(", ")}.` : "Contains enough text for a structured first-pass review.",
      /\d+%|\$|s\$|krw|aed|hkd/i.test(resumeText) ? "Includes quantified outcomes that can help recruiters judge impact." : "Has room to add quantified outcomes for stronger recruiter scanning.",
      /project|campaign|launched|managed|led|built/i.test(resumeText) ? "Mentions ownership of projects, campaigns, or initiatives." : "Can become stronger by adding project ownership examples."
    ];
    const improvements = [
      ...!/\d+%|\$|s\$|krw|aed|hkd|increased|reduced|grew|saved|launched/i.test(resumeText) ? [improvement("Impact is not quantified enough", "Add metrics such as growth, cost saved, conversion lift, revenue, users, or cycle time.", "high", "Can materially improve shortlist probability.")] : [],
      ...missingKeywords.length > 0 ? [improvement("Missing target keywords", `Add truthful evidence for keywords such as ${missingKeywords.slice(0, 5).join(", ")}.`, "high", "Improves ATS and recruiter matching for this role.")] : [],
      ...!/summary|profile|objective/i.test(resumeText) ? [improvement("No clear positioning summary", "Add a 2-3 line summary connecting your background to the target role and market.", "medium")] : [],
      improvement("Application strategy needs tailoring", "Create one resume variant per role family and mirror each JD's strongest requirements.", "medium")
    ].slice(0, 5);
    const actionPlanTasks = [
      { title: "Add two quantified achievements to the resume", category: "resume" },
      { title: "Create a keyword gap list from one target job description", category: "research" },
      { title: "Draft one STAR story for the strongest project", category: "prep" }
    ];
    const analysis = {
      interviewProbability: Math.max(15, Math.min(90, overallScore - 5)),
      overallScore,
      strengths,
      improvements,
      regionSpecificTips: marketVisaAgent.guidance(market).tips,
      missingKeywords,
      actionPlanTasks,
      summary: status === "partial" ? "We could parse enough resume text for a partial review. Paste the full resume text if any section is missing." : "Resume analysis completed. Use the improvement list to tailor the next application batch.",
      targetRegion: market,
      analyzedAt: Date.now()
    };
    return {
      status,
      message: status === "partial" ? "We created a partial analysis. You can paste your resume text for a fuller retry." : "Analysis completed.",
      analysis,
      keywords: foundSkills
    };
  }
};
var jobFitAgent = {
  evaluate(input) {
    const jd = input.jobDescription || "";
    const profileText = JSON.stringify(input.profile ?? {});
    const resumeText = JSON.stringify(input.resumeAnalysis ?? {});
    const candidateKeywords = unique([...keywordize(profileText), ...keywordize(resumeText)]);
    const jdKeywords = unique([...keywordize(jd), ...titleKeywords(input.targetRole), ...titleKeywords(input.jobTitle)]).slice(0, 16);
    const matchedSkills = jdKeywords.filter((keyword) => candidateKeywords.includes(keyword));
    const missingSkills = jdKeywords.filter((keyword) => !candidateKeywords.includes(keyword)).slice(0, 8);
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
          missingSkills.length > 0 ? `Close visible gaps by adding truthful examples for ${missingSkills.slice(0, 3).join(", ")}.` : "Maintain the current keyword alignment and focus on company-specific tailoring.",
          "Use a short cover note explaining market fit, visa/work status, and availability."
        ],
        interviewTips: [
          "Prepare a 90-second walkthrough connecting your background to this role.",
          "Create STAR stories for ownership, conflict, measurable impact, and learning agility.",
          "Prepare two company-specific questions about goals, metrics, and team operating rhythm."
        ],
        disclaimer: "AI fit scoring is guidance only and does not predict recruiter decisions."
      }
    };
  }
};
var jobDiscoveryAgent = {
  rankJobs(jobs2, profile) {
    const targetRole = String(profile?.targetRole ?? "").toLowerCase();
    const interests = Array.isArray(profile?.interests) ? profile?.interests.join(" ").toLowerCase() : "";
    const countries = Array.isArray(profile?.targetCountries) ? profile?.targetCountries : [];
    return [...jobs2].map((job) => {
      let score = 50;
      const title = job.title.toLowerCase();
      const text2 = `${job.title} ${job.description} ${(job.skills ?? []).join(" ")}`.toLowerCase();
      if (targetRole && title.includes(targetRole)) score += 20;
      for (const word of titleKeywords(targetRole)) if (text2.includes(word)) score += 5;
      for (const word of titleKeywords(interests)) if (text2.includes(word)) score += 3;
      if (countries.includes(job.location)) score += 8;
      if (job.visa) score += 4;
      if (job.remote) score += 2;
      return { ...job, matchScore: Math.min(100, score) };
    }).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  }
};
var applicationAgent = {
  nextActions(status) {
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
  }
};
var interviewAgent = {
  createPrep(input) {
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
        "What would you do in your first 30 days in this role?"
      ],
      starStories: [
        "A measurable project where you improved growth, efficiency, or customer outcomes.",
        "A cross-functional collaboration story with a difficult stakeholder.",
        "A learning-agility story showing how you picked up a new tool, market, or domain quickly."
      ],
      followUpTiming: "Send a concise thank-you note within 24 hours, then follow up after 5-7 business days if no timeline was given.",
      followUpEmail: `Subject: Thank you - ${role} interview

Hi [Name],

Thank you for speaking with me about the ${role} opportunity at ${company}. I appreciated learning more about the team priorities and how this role contributes to [specific goal discussed].

Our conversation reinforced my interest in the role, especially the opportunity to apply my experience in [relevant skill/project] to [company/team objective]. Please let me know if I can share any additional information.

Best,
[Your Name]`,
      marketNotes: marketVisaAgent.guidance(market).tips,
      disclaimer: "AI interview preparation is guidance only; tailor all examples truthfully to your own experience."
    };
  }
};
var careerManagerAgent = {
  buildReport(input) {
    const applications2 = input.applications ?? [];
    const interviews = applications2.filter((app) => app.status === "interview").length;
    const offers = applications2.filter((app) => app.status === "offer").length;
    const active = applications2.filter((app) => ["bookmarked", "applied", "interview"].includes(app.status)).length;
    const checklistLine = `${input.checklistDone ?? 0}/${input.checklistTotal ?? 0}`;
    return `## Career Management Report

**Pipeline:** ${applications2.length} total records, ${active} active, ${interviews} interview-stage, ${offers} offer-stage.

**Resume:** ${input.resumeScore != null ? `${input.resumeScore}/100` : "No successful analysis yet. Upload a resume or paste text to continue."}

**Target:** ${input.targetRole || "No target role saved yet."}

**Checklist:** ${checklistLine} tasks completed.

## Recommended Next Actions
- Save or apply to 3 roles that match the target role.
- Run a fit evaluation before applying to high-priority roles.
- If any role is at interview stage, generate prep and send a thank-you note within 24 hours after the call.
- Add one journal note about what worked this week and what to change next week.

AI guidance only; employment, salary, and visa outcomes are not guaranteed.`;
  }
};
var qaErrorAgent = {
  audit(input) {
    const issues = [];
    const nextActions = [];
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
      nextActions: nextActions.length > 0 ? nextActions : DEMO_CHECKLIST
    };
  }
};

// server/resumeRoutes.ts
var FALLBACK_MESSAGE = "We could not fully parse this file. You can paste your resume text instead.";
var MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, _file, cb) => cb(null, true)
});
function detectSupportedMime(file) {
  const originalName = (file.originalname || "").toLowerCase();
  if (file.mimetype === "application/pdf" || originalName.endsWith(".pdf")) return "application/pdf";
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || originalName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (file.mimetype === "text/plain" || originalName.endsWith(".txt")) return "text/plain";
  return null;
}
async function extractTextFromBuffer(buffer, mimetype) {
  if (mimetype === "text/plain") {
    return { text: buffer.toString("utf-8"), method: "text" };
  }
  if (mimetype === "application/pdf") {
    const result = await extractTextFromPdf(buffer);
    return {
      text: result.text,
      method: result.method,
      warning: result.warning
    };
  }
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 0) {
        return {
          text: result.value,
          method: "docx",
          warning: result.messages?.length ? "DOCX parser reported minor formatting warnings." : void 0
        };
      }
    } catch (error) {
      console.warn("[ResumeRoutes] DOCX parser failed:", error);
    }
    return {
      text: "",
      method: "docx",
      warning: "DOCX parsing failed or produced no readable text."
    };
  }
  return { text: "", method: "text", warning: "Unsupported file type." };
}
function parseLabel(method) {
  if (method === "text") return "Plain text parser";
  if (method === "docx") return "DOCX text parser";
  return getParseMethodLabel(method);
}
async function authenticate(req) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}
async function persistFailure(userId, input) {
  await createResumeAnalysis2({
    userId,
    source: input.source,
    fileName: input.fileName,
    targetRole: input.targetRole,
    targetMarket: input.targetMarket,
    resumeText: input.resumeText,
    status: "failed",
    parseMethod: input.parseMethod,
    parseWarning: input.parseWarning,
    errorMessage: input.errorMessage
  });
}
async function persistSuccessfulAnalysis(userId, input) {
  await createResumeAnalysis2({
    userId,
    source: input.source,
    fileName: input.fileName,
    resumeText: input.resumeText.slice(0, 6e4),
    targetRole: input.targetRole,
    targetMarket: input.targetMarket,
    status: input.status,
    parseMethod: input.parseMethod,
    parseWarning: input.parseWarning,
    overallScore: input.analysis?.overallScore,
    summary: input.analysis?.summary,
    strengths: input.analysis?.strengths,
    improvements: input.analysis?.improvements,
    keywords: input.keywords ?? input.analysis?.missingKeywords,
    rawResult: input.analysis
  });
  await saveResume(userId, {
    fileName: input.fileName ?? "pasted-resume.txt",
    fileUrl: input.fileUrl,
    fileKey: input.fileKey,
    analysisResult: input.analysis,
    overallScore: input.analysis?.overallScore
  }).catch((error) => {
    console.warn("[ResumeRoutes] Legacy resume save skipped:", error?.message || error);
  });
  await saveResumeAnalysisResult(userId, {
    resumeText: input.resumeText.slice(0, 6e4),
    targetRole: input.targetRole,
    targetMarket: input.targetMarket,
    overallScore: input.analysis?.overallScore,
    summary: input.analysis?.summary,
    strengths: input.analysis?.strengths,
    improvements: input.analysis?.improvements?.map((item) => item.issue || item.suggestion || String(item)),
    keywords: input.keywords ?? input.analysis?.missingKeywords,
    rawResult: input.analysis
  }).catch((error) => {
    console.warn("[ResumeRoutes] Resume analysis history save skipped:", error?.message || error);
  });
  await awardXP(userId, "resume", "Analyzed a resume").catch(() => void 0);
}
function fallbackResponse(extra) {
  return {
    success: false,
    status: "failed",
    message: FALLBACK_MESSAGE,
    canPaste: true,
    retryable: true,
    ...extra
  };
}
function registerResumeRoutes(app) {
  app.post("/api/resume/upload-analyze", (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(200).json(fallbackResponse({
            code: "file_too_large",
            detail: "File too large. Maximum size is 10MB."
          }));
        }
        return res.status(200).json(fallbackResponse({ code: "upload_failed", detail: err.message || "Upload failed." }));
      }
      next();
    });
  }, async (req, res) => {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const targetMarket = req.body.targetRegion || req.body.targetMarket || "singapore";
    const jobDescription = req.body.jobDescription || "";
    const targetRole = req.body.targetRole || "";
    const file = req.file;
    if (!file) {
      await persistFailure(user.id, {
        source: "upload",
        targetRole,
        targetMarket,
        errorMessage: "No file uploaded."
      });
      return res.status(200).json(fallbackResponse({ code: "missing_file" }));
    }
    if (!file.buffer || file.buffer.length === 0) {
      await persistFailure(user.id, {
        source: "upload",
        fileName: file.originalname,
        targetRole,
        targetMarket,
        errorMessage: "Empty file."
      });
      return res.status(200).json(fallbackResponse({ code: "empty_file" }));
    }
    const supportedMime = detectSupportedMime(file);
    if (!supportedMime) {
      await persistFailure(user.id, {
        source: "upload",
        fileName: file.originalname,
        targetRole,
        targetMarket,
        errorMessage: "Unsupported file type."
      });
      return res.status(200).json(fallbackResponse({
        code: "unsupported_file",
        detail: "Supported formats are PDF, DOCX, and TXT."
      }));
    }
    let extractResult;
    try {
      extractResult = await extractTextFromBuffer(file.buffer, supportedMime);
    } catch (error) {
      await persistFailure(user.id, {
        source: "upload",
        fileName: file.originalname,
        targetRole,
        targetMarket,
        errorMessage: error?.message || "Parser failed."
      });
      return res.status(200).json(fallbackResponse({ code: "parse_failed" }));
    }
    const resumeText = (extractResult.text || "").trim();
    if (resumeText.length < 50) {
      await persistFailure(user.id, {
        source: "upload",
        fileName: file.originalname,
        targetRole,
        targetMarket,
        parseMethod: extractResult.method,
        parseWarning: extractResult.warning,
        errorMessage: "Missing readable resume text."
      });
      return res.status(200).json(fallbackResponse({ code: "missing_text" }));
    }
    const safeFileName = (file.originalname || "resume").replace(/[\\/]/g, "-");
    const fileKey = `resumes/${user.id}/${Date.now()}-${safeFileName}`;
    const stored = await storagePut(fileKey, file.buffer, supportedMime).catch((error) => {
      console.warn("[ResumeRoutes] File storage skipped:", error?.message || error);
      return { key: void 0, url: void 0 };
    });
    const agentResult = resumeAgent.analyzeResumeText({
      resumeText,
      targetRole,
      targetMarket,
      jobDescription,
      parseWarning: extractResult.warning
    });
    if (!agentResult.analysis) {
      await persistFailure(user.id, {
        source: "upload",
        fileName: safeFileName,
        targetRole,
        targetMarket,
        parseMethod: extractResult.method,
        parseWarning: extractResult.warning,
        errorMessage: agentResult.message || FALLBACK_MESSAGE
      });
      return res.status(200).json(fallbackResponse({ code: "analysis_failed" }));
    }
    await persistSuccessfulAnalysis(user.id, {
      source: "upload",
      fileName: safeFileName,
      fileUrl: stored.url,
      fileKey: stored.key,
      resumeText,
      targetRole,
      targetMarket,
      status: agentResult.status,
      parseMethod: extractResult.method,
      parseWarning: extractResult.warning,
      analysis: agentResult.analysis,
      keywords: agentResult.keywords
    });
    return res.json({
      success: true,
      status: agentResult.status,
      message: agentResult.message,
      analysis: agentResult.analysis,
      fileUrl: stored.url,
      parseInfo: {
        method: extractResult.method,
        label: parseLabel(extractResult.method),
        warning: extractResult.warning ?? null
      }
    });
  });
  app.post("/api/resume/analyze-text", async (req, res) => {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const resumeText = String(req.body.resumeText || "").trim();
    const targetMarket = String(req.body.targetRegion || req.body.targetMarket || "singapore");
    const targetRole = String(req.body.targetRole || "");
    const jobDescription = String(req.body.jobDescription || "");
    if (resumeText.length < 50) {
      await persistFailure(user.id, {
        source: "paste",
        targetRole,
        targetMarket,
        resumeText,
        errorMessage: "Pasted resume text is too short."
      });
      return res.status(200).json(fallbackResponse({
        code: "text_too_short",
        detail: "Paste at least a few resume sections before retrying."
      }));
    }
    const agentResult = resumeAgent.analyzeResumeText({
      resumeText,
      targetRole,
      targetMarket,
      jobDescription
    });
    if (!agentResult.analysis) {
      await persistFailure(user.id, {
        source: "paste",
        targetRole,
        targetMarket,
        resumeText,
        errorMessage: agentResult.message || FALLBACK_MESSAGE
      });
      return res.status(200).json(fallbackResponse({ code: "analysis_failed" }));
    }
    await persistSuccessfulAnalysis(user.id, {
      source: "paste",
      fileName: "pasted-resume.txt",
      resumeText,
      targetRole,
      targetMarket,
      status: agentResult.status,
      parseMethod: "text",
      analysis: agentResult.analysis,
      keywords: agentResult.keywords
    });
    return res.json({
      success: true,
      status: agentResult.status,
      message: agentResult.message,
      analysis: agentResult.analysis,
      parseInfo: {
        method: "text",
        label: "Pasted text",
        warning: null
      }
    });
  });
}

// server/gmailRoutes.ts
import { parse as parseCookieHeader3 } from "cookie";
import crypto3 from "node:crypto";

// server/_core/secret.ts
import crypto2 from "node:crypto";
var VERSION = "v1";
function getKey() {
  return crypto2.createHash("sha256").update(ENV.cookieSecret || "jobpa-local-development-secret").digest();
}
function encryptSecret(value) {
  if (!value) return null;
  const iv = crypto2.randomBytes(12);
  const cipher = crypto2.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(":");
}
function decryptSecret(value) {
  if (!value) return null;
  if (!value.startsWith(`${VERSION}:`)) return value;
  const [, ivEncoded, tagEncoded, encryptedEncoded] = value.split(":");
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) return null;
  const decipher = crypto2.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivEncoded, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, "base64url")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

// server/gmailRoutes.ts
var GMAIL_STATE_COOKIE = "jobpa_gmail_oauth_state";
var CAREER_MAIL_QUERY = '(interview OR application OR recruiter OR hiring OR offer OR rejection OR "thank you" OR "next steps") newer_than:180d';
function getCookie2(req, name) {
  return parseCookieHeader3(req.headers.cookie || "")[name];
}
function setStateCookie2(req, res, name, value) {
  res.cookie(name, value, {
    ...getSessionCookieOptions(req),
    sameSite: "lax",
    maxAge: 10 * 60 * 1e3
  });
}
function clearStateCookie2(req, res, name) {
  res.clearCookie(name, {
    ...getSessionCookieOptions(req),
    sameSite: "lax",
    maxAge: -1
  });
}
async function authenticate2(req, res) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}
function encodeSubject(subject) {
  return /^[\x00-\x7F]*$/.test(subject) ? subject : `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}
function toBase64Url(input) {
  return Buffer.from(input, "utf8").toString("base64url");
}
function getHeader(headers, name) {
  return headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value || "";
}
async function getConnectedGmailAccount(userId) {
  const account = await getPrimaryEmailAccount(userId, "gmail");
  if (!account) return null;
  const accessToken = decryptSecret(account.accessToken);
  const refreshToken = decryptSecret(account.refreshToken);
  return { account, accessToken, refreshToken };
}
async function getValidAccessToken(userId) {
  const connected = await getConnectedGmailAccount(userId);
  if (!connected?.account || !connected.accessToken) {
    throw new Error("Gmail is not connected");
  }
  const expiresAt = connected.account.tokenExpiresAt?.getTime?.() ?? 0;
  if (expiresAt > Date.now() + 6e4) return connected.accessToken;
  if (!connected.refreshToken) return connected.accessToken;
  const refreshed = await refreshGoogleAccessToken(connected.refreshToken);
  await updateEmailAccountTokens(connected.account.id, {
    accessToken: encryptSecret(refreshed.access_token),
    refreshToken: refreshed.refresh_token ? encryptSecret(refreshed.refresh_token) : void 0,
    tokenExpiresAt: tokenExpiryFromNow(refreshed.expires_in),
    status: "connected"
  });
  return refreshed.access_token;
}
async function gmailFetch(accessToken, path3, init) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1${path3}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers || {}
    }
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gmail API failed (${response.status}): ${errorText.slice(0, 160)}`);
  }
  return response.json();
}
function registerGmailRoutes(app) {
  app.get("/api/integrations/gmail/connect", async (req, res) => {
    if (!isGoogleOAuthConfigured()) {
      res.redirect("/dashboard/email?status=google_not_configured");
      return;
    }
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.redirect("/login?authError=session_required");
      return;
    }
    const state = crypto3.randomBytes(24).toString("hex");
    setStateCookie2(req, res, GMAIL_STATE_COOKIE, state);
    res.redirect(buildGoogleAuthUrl(req, "gmail", state, user.email));
  });
  app.get("/api/integrations/gmail/callback", async (req, res) => {
    if (!isGoogleOAuthConfigured()) {
      res.redirect("/dashboard/email?status=google_not_configured");
      return;
    }
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.redirect("/login?authError=session_required");
      return;
    }
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const providerError = typeof req.query.error === "string" ? req.query.error : "";
    const expectedState = getCookie2(req, GMAIL_STATE_COOKIE);
    clearStateCookie2(req, res, GMAIL_STATE_COOKIE);
    if (providerError) {
      res.redirect(`/dashboard/email?status=${encodeURIComponent(providerError)}`);
      return;
    }
    if (!code) {
      res.redirect("/dashboard/email?status=missing_google_code");
      return;
    }
    if (!state || !expectedState || state !== expectedState) {
      res.redirect("/dashboard/email?status=invalid_google_state");
      return;
    }
    try {
      const token = await exchangeGoogleCode(req, "gmail", code);
      const profile = await fetchGoogleProfile(token.access_token);
      const email = (profile.email || user.email || "").toLowerCase();
      if (!email) {
        res.redirect("/dashboard/email?status=missing_email");
        return;
      }
      await saveEmailAccount({
        userId: user.id,
        provider: "gmail",
        email,
        scopes: token.scope,
        accessToken: encryptSecret(token.access_token),
        refreshToken: token.refresh_token ? encryptSecret(token.refresh_token) : void 0,
        tokenExpiresAt: tokenExpiryFromNow(token.expires_in),
        status: "connected"
      });
      res.redirect("/dashboard/email?status=connected");
    } catch (error) {
      console.error("[Gmail] OAuth callback failed:", error);
      res.redirect("/dashboard/email?status=gmail_connect_failed");
    }
  });
  app.get("/api/integrations/gmail/status", async (req, res) => {
    const user = await authenticate2(req, res);
    if (!user) return;
    const account = await getPrimaryEmailAccount(user.id, "gmail").catch(() => null);
    res.json({
      connected: Boolean(account),
      email: account?.email ?? null,
      scopes: account?.scopes ?? null,
      lastSyncedAt: account?.lastSyncedAt ?? null
    });
  });
  app.post("/api/email/send", async (req, res) => {
    const user = await authenticate2(req, res);
    if (!user) return;
    const { to, subject, body } = req.body ?? {};
    if (!to || !subject || !body) {
      res.status(400).json({ error: "to, subject, and body are required" });
      return;
    }
    try {
      const token = await getValidAccessToken(user.id);
      const message = [
        `To: ${to}`,
        `Subject: ${encodeSubject(subject)}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "MIME-Version: 1.0",
        "",
        body
      ].join("\r\n");
      const result = await gmailFetch(token, "/users/me/messages/send", {
        method: "POST",
        body: JSON.stringify({ raw: toBase64Url(message) })
      });
      res.json({ success: true, id: result.id, threadId: result.threadId });
    } catch (error) {
      console.error("[Gmail] Send failed:", error);
      res.status(502).json({
        error: "Email send failed. Reconnect Gmail and try again."
      });
    }
  });
  app.post("/api/email/sync", async (req, res) => {
    const user = await authenticate2(req, res);
    if (!user) return;
    const query = typeof req.body?.query === "string" && req.body.query.trim() ? req.body.query.trim() : CAREER_MAIL_QUERY;
    const maxResults = Math.min(Number(req.body?.maxResults) || 10, 25);
    try {
      const connected = await getConnectedGmailAccount(user.id);
      if (!connected?.account) {
        res.status(409).json({ error: "Gmail is not connected" });
        return;
      }
      const token = await getValidAccessToken(user.id);
      const list = await gmailFetch(
        token,
        `/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
      );
      const savedMessages = [];
      for (const item of list.messages || []) {
        const detail = await gmailFetch(
          token,
          `/users/me/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`
        );
        const headers = detail.payload?.headers;
        const receivedAtText = getHeader(headers, "Date");
        const receivedAt = receivedAtText ? new Date(receivedAtText) : null;
        const row = {
          userId: user.id,
          provider: "gmail",
          providerMessageId: detail.id,
          threadId: detail.threadId,
          fromEmail: getHeader(headers, "From"),
          toEmail: getHeader(headers, "To"),
          subject: getHeader(headers, "Subject"),
          snippet: detail.snippet,
          receivedAt: receivedAt && !Number.isNaN(receivedAt.getTime()) ? receivedAt : null,
          rawMetadata: {
            labelIds: detail.labelIds,
            internalDate: detail.internalDate
          }
        };
        await saveEmailMessage(row);
        savedMessages.push(row);
      }
      await markEmailAccountSynced(connected.account.id);
      res.json({ success: true, query, count: savedMessages.length, messages: savedMessages });
    } catch (error) {
      console.error("[Gmail] Sync failed:", error);
      res.status(502).json({
        error: "Email sync failed. Reconnect Gmail and try again."
      });
    }
  });
  app.get("/api/email/messages", async (req, res) => {
    const user = await authenticate2(req, res);
    if (!user) return;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const messages = await getEmailMessages(user.id, limit).catch(() => []);
    res.json({ messages });
  });
}

// server/routers.ts
import { createOpenAI as createOpenAI3 } from "@ai-sdk/openai";
import { generateText as generateText2 } from "ai";

// server/_core/systemRouter.ts
import { z as z2 } from "zod";

// server/_core/notification.ts
async function notifyOwner(_payload) {
  console.warn("[notification] notifyOwner: not available in self-hosted mode");
  return false;
}

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z2.object({
      timestamp: z2.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z2.object({
      title: z2.string().min(1, "title is required"),
      content: z2.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z3 } from "zod";

// server/careerOps.ts
var SOURCE_POLICY = "Career Ops in JobPA uses approved APIs, cached database records, or sanitized demo jobs. It does not auto-apply or scrape job boards without explicit approval.";
function clampLimit(limit) {
  return Math.max(3, Math.min(limit ?? 10, 20));
}
function careerOpsGrade(score) {
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}
function decisionForScore(score) {
  if (score >= 80) {
    return {
      level: "priority",
      label: "Priority target",
      summary: "Strong match. Save it, tailor the resume, and decide whether to apply within 48 hours."
    };
  }
  if (score >= 65) {
    return {
      level: "consider",
      label: "Consider with tailoring",
      summary: "Potential match. Apply only if the gaps can be handled truthfully in resume and cover note."
    };
  }
  if (score >= 55) {
    return {
      level: "hold",
      label: "Hold for research",
      summary: "Possible but weak. Research the team or find a warm path before spending application time."
    };
  }
  return {
    level: "skip",
    label: "Skip for now",
    summary: "Low match. Keep this as market signal unless there is a strategic reason to pursue it."
  };
}
function toStringList(value, fallback = []) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : fallback;
}
function getResumeStrengths(resumeAnalysis) {
  const direct = toStringList(resumeAnalysis?.strengths);
  const raw = toStringList(resumeAnalysis?.rawResult?.strengths);
  return (direct.length > 0 ? direct : raw).slice(0, 4);
}
function profileSkills(profile) {
  const skills = toStringList(profile?.skills);
  const interests = toStringList(profile?.interests);
  return Array.from(/* @__PURE__ */ new Set([...skills, ...interests])).slice(0, 10);
}
function buildResumeVariant(input) {
  const role = input.jobTitle || input.targetRole || input.profile?.targetRole || "target role";
  const company = input.company || "target company";
  const matchedSkills = toStringList(input.fitResult.matchedSkills);
  const missingSkills = toStringList(input.fitResult.missingSkills);
  const strengths = getResumeStrengths(input.resumeAnalysis);
  const skills = Array.from(/* @__PURE__ */ new Set([...profileSkills(input.profile), ...matchedSkills])).slice(0, 12);
  const market = input.profile?.targetLocation || input.profile?.market || "target market";
  const markdown = `# Tailored Resume Variant - ${role}

Company: ${company}
Market: ${market}
Generated by JobPA Career Ops

AI guidance only. Use this as a truthful tailoring draft, not a guarantee of interview, employment, salary, or visa outcome.

## Positioning Summary
Position yourself as a ${role} candidate for ${company}. Lead with the strongest evidence that overlaps with the job description, then make work status, location fit, and availability easy to understand.

## Keywords To Mirror Truthfully
${skills.length > 0 ? skills.map((skill) => `- ${skill}`).join("\n") : "- Add role-specific keywords from the job description after verifying they are true to your experience."}

## Proof Points To Move Up
${strengths.length > 0 ? strengths.map((item) => `- ${item}`).join("\n") : "- Add 2-3 quantified achievements tied to growth, efficiency, customer outcomes, revenue, cost, quality, or delivery speed."}

## Gaps To Handle Honestly
${missingSkills.length > 0 ? missingSkills.map((skill) => `- ${skill}: add truthful evidence, a learning plan, or leave it out if you do not have it.`).join("\n") : "- No major keyword gaps detected. Keep the resume concise and specific."}

## Cover Note Angle
Open with why this role, why this company, and one measurable result that proves you can do the work. Keep the note under 180 words.

## Interview Prep Hooks
- Prepare a 90-second career story for ${role}.
- Prepare STAR stories for ownership, measurable impact, ambiguity, and stakeholder conflict.
- Prepare two company-specific questions about success metrics and team operating rhythm.
`;
  return {
    title: `${role} at ${company}`,
    markdown,
    keywords: skills,
    gaps: missingSkills
  };
}
function normalizeJobDescription(job) {
  const skills = (job.skills ?? []).join(", ");
  return [job.description, skills ? `Skills: ${skills}` : "", `Role: ${job.title}`, `Company: ${job.company}`].filter(Boolean).join("\n\n");
}
async function persistAgentTask(input) {
  await recordAgentTask({
    userId: input.userId,
    agent: "Career Ops Agent",
    taskType: input.taskType,
    status: input.status,
    input: input.request,
    output: input.output,
    errorMessage: input.errorMessage
  }).catch(() => void 0);
}
async function runCareerOpsScan(userId, input) {
  const limit = clampLimit(input.limit);
  const [profile, latestResume] = await Promise.all([
    getUserProfile2(userId).catch(() => null),
    getLatestResumeAnalysis(userId).catch(() => null)
  ]);
  const resumeContext = latestResume ?? null;
  const targetRole = String(input.search?.trim() || profile?.targetRole || "product manager");
  const location = input.location && input.location !== "all" ? input.location : profile?.targetLocation ?? void 0;
  const search = targetRole;
  const jobData = await fetchJobs({ search, location, limit: Math.max(limit * 2, 12) });
  const ranked = jobDiscoveryAgent.rankJobs(jobData.jobs, profile).slice(0, limit);
  const evaluations = [];
  for (const job of ranked) {
    const fit = jobFitAgent.evaluate({
      profile,
      resumeAnalysis: resumeContext,
      targetRole,
      jobTitle: job.title,
      company: job.company,
      jobDescription: normalizeJobDescription(job)
    });
    const blendedScore = Math.round(fit.fitScore * 0.8 + (job.matchScore ?? 50) * 0.2);
    const grade = careerOpsGrade(blendedScore);
    const decision = decisionForScore(blendedScore);
    const result = {
      ...fit.result ?? {},
      fitScore: blendedScore,
      grade,
      decision,
      sourcePolicy: SOURCE_POLICY,
      jobDiscoveryScore: job.matchScore ?? null
    };
    await createJobFitEvaluation2(userId, {
      jobId: job.id,
      targetRole,
      jobTitle: job.title,
      company: job.company,
      jobDescription: normalizeJobDescription(job),
      fitScore: blendedScore,
      status: "success",
      result
    }).catch(() => void 0);
    evaluations.push({
      job,
      fitScore: blendedScore,
      grade,
      decision,
      matchedSkills: fit.result.matchedSkills ?? [],
      missingSkills: fit.result.missingSkills ?? [],
      strategy: fit.result.strategy ?? [],
      interviewTips: fit.result.interviewTips ?? [],
      resumeVariant: buildResumeVariant({
        profile,
        resumeAnalysis: resumeContext,
        jobTitle: job.title,
        company: job.company,
        targetRole,
        fitResult: result
      })
    });
  }
  const output = {
    mode: jobData.mode,
    message: jobData.message,
    sources: jobData.sources,
    sourcePolicy: SOURCE_POLICY,
    search,
    location: location || "all",
    resumeStatus: resumeContext ? "available" : "missing",
    marketGuidance: marketVisaAgent.guidance(location || profile?.targetLocation || "singapore"),
    nextActions: evaluations.length > 0 ? [
      "Save A/B-grade roles before applying.",
      "Download the tailored resume draft and edit it truthfully.",
      "Move only selected roles into Applications Tracker."
    ] : [
      "Complete My Profile or broaden the search query.",
      "Paste a JD manually for evaluation.",
      "Check approved job APIs or cached data availability."
    ],
    evaluations
  };
  await persistAgentTask({
    userId,
    taskType: "career_ops_scan",
    status: evaluations.length > 0 ? "success" : "partial",
    request: input,
    output
  });
  return output;
}
async function evaluateManualJob(userId, input) {
  const [profile, latestResume] = await Promise.all([
    getUserProfile2(userId).catch(() => null),
    getLatestResumeAnalysis(userId).catch(() => null)
  ]);
  const resumeContext = latestResume ?? null;
  const targetRole = input.targetRole || (profile?.targetRole ? String(profile.targetRole) : void 0);
  const role = input.jobTitle || targetRole || "Pasted job description";
  const company = input.company || "Manual JD";
  const fit = jobFitAgent.evaluate({
    profile,
    resumeAnalysis: resumeContext,
    targetRole,
    jobTitle: role,
    company,
    jobDescription: input.jobDescription
  });
  const grade = careerOpsGrade(fit.fitScore);
  const decision = decisionForScore(fit.fitScore);
  const result = {
    ...fit.result ?? {},
    grade,
    decision,
    sourcePolicy: SOURCE_POLICY
  };
  await createJobFitEvaluation2(userId, {
    targetRole,
    jobTitle: role,
    company,
    jobDescription: input.jobDescription,
    fitScore: fit.fitScore,
    status: "success",
    result
  }).catch(() => void 0);
  const output = {
    job: {
      id: `manual-${Date.now()}`,
      title: role,
      company,
      location: profile?.targetLocation || "manual",
      source: "manual",
      applyUrl: "#",
      visa: false,
      type: "fulltime",
      experience: profile?.experienceLevel || "mid",
      industry: "manual",
      posted: 0,
      remote: false,
      description: input.jobDescription,
      skills: []
    },
    fitScore: fit.fitScore,
    grade,
    decision,
    matchedSkills: fit.result.matchedSkills ?? [],
    missingSkills: fit.result.missingSkills ?? [],
    strategy: fit.result.strategy ?? [],
    interviewTips: fit.result.interviewTips ?? [],
    resumeVariant: buildResumeVariant({
      profile,
      resumeAnalysis: resumeContext,
      jobTitle: role,
      company,
      targetRole,
      fitResult: result
    }),
    sourcePolicy: SOURCE_POLICY,
    nextActions: applicationAgent.nextActions("bookmarked")
  };
  await persistAgentTask({
    userId,
    taskType: "career_ops_manual_jd",
    status: "success",
    request: { ...input, jobDescription: input.jobDescription.slice(0, 4e3) },
    output
  });
  return output;
}
async function saveCareerOpsJob(userId, input) {
  return saveJob(userId, input.job, input.notes || "Saved from Career Ops Center");
}

// server/routers.ts
function toPublicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    loginMethod: user.loginMethod,
    createdAt: user.createdAt,
    lastSignedIn: user.lastSignedIn
  };
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => toPublicUser(opts.ctx.user)),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  survey: router({
    save: protectedProcedure.input(z3.object({
      lookingFor: z3.array(z3.string()).optional(),
      targetRole: z3.string().optional(),
      experienceLevel: z3.string().optional(),
      interests: z3.array(z3.string()).optional(),
      targetCompanies: z3.string().optional(),
      preferredLocations: z3.array(z3.string()).optional(),
      salaryExpectation: z3.string().optional(),
      needsVisaSponsorship: z3.boolean().optional(),
      preferredLanguage: z3.string().optional(),
      preferredJobTypes: z3.array(z3.string()).optional(),
      howHeardAbout: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const profileDraft = intakeAgent.buildCareerProfile(input);
      const { preferredLanguage: _preferredLanguage, ...surveyInput } = input;
      const [surveyResult, profileResult] = await Promise.all([
        saveSurvey({ userId: ctx.user.id, ...surveyInput }).catch((error) => {
          console.warn("[survey.save] Survey write skipped:", error?.message || error);
          return null;
        }),
        saveUserProfile(ctx.user.id, profileDraft).catch((error) => {
          console.warn("[survey.save] Profile write skipped:", error?.message || error);
          return null;
        })
      ]);
      if (!surveyResult && !profileResult) {
        return {
          offline: true,
          message: "Database unavailable. Your onboarding can continue, but this profile was not persisted.",
          profile: profileDraft
        };
      }
      return surveyResult ?? profileResult;
    }),
    get: protectedProcedure.query(async ({ ctx }) => {
      const survey = await getSurveyByUserId(ctx.user.id);
      return survey ?? null;
    })
  }),
  application: router({
    save: protectedProcedure.input(z3.object({
      jobTitle: z3.string(),
      company: z3.string(),
      location: z3.string().optional(),
      applyUrl: z3.string().optional(),
      source: z3.string().optional(),
      status: z3.enum(["applied", "interview", "offer", "rejected", "withdrawn", "bookmarked"]).default("applied"),
      salary: z3.string().optional(),
      visaType: z3.string().optional(),
      notes: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return createApplication(ctx.user.id, input);
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const applications2 = await getApplicationsByUserId(ctx.user.id).catch((error) => {
        console.warn("[application.list] Database unavailable:", error?.message || error);
        return [];
      });
      return applications2.map((application) => ({
        ...application,
        nextActions: applicationAgent.nextActions(application.status)
      }));
    }),
    updateStatus: protectedProcedure.input(z3.object({
      id: z3.number(),
      status: z3.enum(["applied", "interview", "offer", "rejected", "withdrawn", "bookmarked"]),
      notes: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return updateApplicationStatus2(ctx.user.id, input.id, input.status, input.notes);
    }),
    remove: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
      return deleteApplication(input.id, ctx.user.id).catch((error) => {
        console.warn("[application.remove] Delete skipped:", error?.message || error);
        return { success: false, mode: "offline", message: "Database unavailable. Delete was not persisted." };
      });
    })
  }),
  resume: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const resume = await getResumeByUserId(ctx.user.id);
      return resume ?? null;
    }),
    save: protectedProcedure.input(z3.object({
      fileName: z3.string().optional(),
      fileUrl: z3.string().optional(),
      fileKey: z3.string().optional(),
      analysisResult: z3.any().optional(),
      overallScore: z3.number().optional()
    })).mutation(async ({ ctx, input }) => {
      return saveResume(ctx.user.id, input);
    })
  }),
  fit: router({
    evaluate: protectedProcedure.input(z3.object({
      jobId: z3.string().optional(),
      targetRole: z3.string().optional(),
      jobTitle: z3.string().optional(),
      company: z3.string().optional(),
      jobDescription: z3.string().min(20)
    })).mutation(async ({ ctx, input }) => {
      const [profile, latestResume] = await Promise.all([
        getUserProfile2(ctx.user.id).catch(() => null),
        getLatestResumeAnalysis(ctx.user.id).catch(() => null)
      ]);
      const evaluation = jobFitAgent.evaluate({
        profile,
        resumeAnalysis: latestResume,
        targetRole: input.targetRole,
        jobTitle: input.jobTitle,
        company: input.company,
        jobDescription: input.jobDescription
      });
      await awardXP(ctx.user.id, "fit", "Created a job fit evaluation").catch(() => void 0);
      return createJobFitEvaluation2(ctx.user.id, {
        jobId: input.jobId,
        targetRole: input.targetRole,
        jobTitle: input.jobTitle,
        company: input.company,
        jobDescription: input.jobDescription,
        fitScore: evaluation.fitScore,
        status: "success",
        result: evaluation.result
      });
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      return getFitEvaluationsByUserId(ctx.user.id);
    })
  }),
  report: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getReportsByUserId(ctx.user.id);
    }),
    generate: protectedProcedure.mutation(async ({ ctx }) => {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const [applications2, latestResume, goal, checklist, profile] = await Promise.all([
        getApplicationsByUserId(ctx.user.id).catch(() => []),
        getLatestResumeAnalysis(ctx.user.id).catch(() => null),
        getGoalByUserId(ctx.user.id).catch(() => null),
        getChecklistByDate(ctx.user.id, today).catch(() => []),
        getUserProfile2(ctx.user.id).catch(() => null)
      ]);
      const checklistDone = checklist?.filter((c) => c.isCompleted).length || 0;
      const checklistTotal = checklist?.length || 0;
      const fallbackContent = careerManagerAgent.buildReport({
        applications: applications2,
        resumeScore: latestResume?.overallScore ?? null,
        checklistDone,
        checklistTotal,
        targetRole: profile?.targetRole ?? goal?.targetRole ?? null
      });
      let content = fallbackContent;
      const baseURL = ENV.llmBaseUrl ? ENV.llmBaseUrl.endsWith("/v1") ? ENV.llmBaseUrl : `${ENV.llmBaseUrl}/v1` : void 0;
      const openai = createOpenAI3({ apiKey: ENV.llmApiKey, baseURL });
      const appSummary = applications2?.slice(0, 5).map((a) => `${a.company} - ${a.jobTitle} (${a.status})`).join(", ") || "No applications yet";
      const resumeScore = latestResume?.overallScore ? `${latestResume.overallScore}/100` : "Not analyzed yet";
      const goalText = goal?.targetRole ? `Target: ${goal.targetRole} in ${goal.targetJobType || "any field"}` : "No goal set";
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
        const { text: text2 } = await generateText2({
          model: openai.chat(ENV.llmModel),
          prompt,
          maxOutputTokens: 500
        });
        content = `${text2}

_AI guidance only; employment, salary, and visa outcomes are not guaranteed._`;
      } catch (error) {
        console.warn("[report.generate] AI generation unavailable; using deterministic report:", error);
      }
      const title = `Daily Report - ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      return saveReport(ctx.user.id, {
        title,
        content,
        reportType: "daily"
      }).catch((error) => {
        console.warn("[report.generate] Report persistence skipped:", error?.message || error);
        return {
          id: -Date.now(),
          userId: ctx.user.id,
          title,
          content,
          reportType: "daily",
          offline: true,
          createdAt: /* @__PURE__ */ new Date()
        };
      });
    })
  }),
  goal: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const goal = await getGoalByUserId(ctx.user.id);
      return goal ?? null;
    }),
    save: protectedProcedure.input(z3.object({
      targetJobType: z3.string().optional(),
      targetRole: z3.string().optional(),
      targetCompany: z3.string().optional(),
      deadlineMonths: z3.number().optional(),
      weeklyApplicationTarget: z3.number().optional(),
      notes: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return saveGoal(ctx.user.id, input);
    })
  }),
  emailAlert: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const alert = await getEmailAlertByUserId(ctx.user.id);
      return alert ?? null;
    }),
    save: protectedProcedure.input(z3.object({
      targetRoles: z3.array(z3.string()).optional(),
      targetLocations: z3.array(z3.string()).optional(),
      frequency: z3.string().optional(),
      isActive: z3.boolean().optional(),
      email: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return saveEmailAlert(ctx.user.id, input);
    })
  }),
  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAdminStats();
    }),
    users: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAllUsers();
    })
  }),
  jobs: router({
    list: publicProcedure.input(z3.object({
      search: z3.string().optional(),
      keyword: z3.string().optional(),
      location: z3.string().optional(),
      page: z3.number().optional(),
      limit: z3.number().optional()
    }).optional()).query(async ({ input }) => {
      return fetchJobs({
        search: input?.search || input?.keyword,
        location: input?.location,
        limit: input?.limit || 100
      });
    }),
    save: protectedProcedure.input(z3.object({
      id: z3.string(),
      title: z3.string(),
      company: z3.string(),
      location: z3.string(),
      salary: z3.string().optional(),
      source: z3.string(),
      applyUrl: z3.string(),
      visa: z3.boolean().optional(),
      type: z3.string().optional(),
      experience: z3.string().optional(),
      industry: z3.string().optional(),
      posted: z3.number().optional(),
      remote: z3.boolean().optional(),
      description: z3.string().optional(),
      closingDate: z3.string().optional(),
      skills: z3.array(z3.string()).optional(),
      notes: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return saveJob(ctx.user.id, {
        id: input.id,
        title: input.title,
        company: input.company,
        location: input.location,
        salary: input.salary,
        source: input.source,
        applyUrl: input.applyUrl,
        visa: input.visa ?? false,
        type: input.type ?? "fulltime",
        experience: input.experience ?? "mid",
        industry: input.industry ?? "others",
        posted: input.posted ?? 0,
        remote: input.remote ?? false,
        description: input.description ?? "",
        closingDate: input.closingDate,
        skills: input.skills
      }, input.notes);
    })
  }),
  careerOps: router({
    scan: protectedProcedure.input(z3.object({
      search: z3.string().optional(),
      location: z3.string().optional(),
      limit: z3.number().min(3).max(20).optional()
    })).mutation(async ({ ctx, input }) => {
      return runCareerOpsScan(ctx.user.id, input);
    }),
    evaluateManual: protectedProcedure.input(z3.object({
      jobTitle: z3.string().optional(),
      company: z3.string().optional(),
      targetRole: z3.string().optional(),
      jobDescription: z3.string().min(20)
    })).mutation(async ({ ctx, input }) => {
      return evaluateManualJob(ctx.user.id, input);
    }),
    saveJob: protectedProcedure.input(z3.object({
      job: z3.object({
        id: z3.string(),
        title: z3.string(),
        company: z3.string(),
        location: z3.string(),
        salary: z3.string().optional(),
        source: z3.string(),
        applyUrl: z3.string(),
        visa: z3.boolean(),
        type: z3.string(),
        experience: z3.string(),
        industry: z3.string(),
        posted: z3.number(),
        remote: z3.boolean(),
        description: z3.string(),
        closingDate: z3.string().optional(),
        skills: z3.array(z3.string()).optional()
      }),
      notes: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return saveCareerOpsJob(ctx.user.id, {
        job: input.job,
        notes: input.notes
      });
    })
  }),
  consulting: router({
    // Legacy waitlist (keep for backwards compat)
    joinWaitlist: publicProcedure.input(z3.object({
      name: z3.string().optional(),
      email: z3.string().email(),
      interests: z3.array(z3.string()).optional(),
      message: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      return joinConsultingWaitlist({ ...input, userId: userId ?? void 0 });
    }),
    getWaitlist: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getConsultingWaitlist();
    }),
    // Marketplace: list approved consultants
    list: publicProcedure.query(async () => {
      return getApprovedConsultants();
    }),
    getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
      const consultant = await getConsultantById(input.id);
      return consultant ?? null;
    }),
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getConsultantByUserId(ctx.user.id);
      return profile ?? null;
    }),
    myApplication: protectedProcedure.query(async ({ ctx }) => {
      const app = await getConsultingApplicationByUserId(ctx.user.id);
      return app ?? null;
    }),
    applyConsultant: protectedProcedure.input(z3.object({
      displayName: z3.string().min(2),
      title: z3.string().optional(),
      bio: z3.string().optional(),
      specialties: z3.array(z3.string()).optional(),
      targetRegions: z3.array(z3.string()).optional(),
      languages: z3.array(z3.string()).optional(),
      yearsExperience: z3.number().optional(),
      linkedinUrl: z3.string().optional(),
      motivation: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return applyToBeConsultant(ctx.user.id, input);
    }),
    allApplications: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return getAllConsultingApplications();
    }),
    approveApplication: protectedProcedure.input(z3.object({
      applicationId: z3.number(),
      userId: z3.number()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      return approveConsultantApplication(input.applicationId, input.userId);
    }),
    myCredits: protectedProcedure.query(async ({ ctx }) => {
      return getUserCredits(ctx.user.id);
    }),
    creditHistory: protectedProcedure.query(async ({ ctx }) => {
      return getCreditTransactions(ctx.user.id);
    }),
    bookSession: protectedProcedure.input(z3.object({
      consultantId: z3.number(),
      topic: z3.string().optional(),
      scheduledAt: z3.number().optional()
    })).mutation(async ({ ctx, input }) => {
      const consultantList = await getApprovedConsultants();
      const c = consultantList.find((c2) => c2.id === input.consultantId);
      if (!c) throw new Error("Consultant not found");
      return bookConsultingSession(ctx.user.id, {
        consultantId: input.consultantId,
        creditsCharged: c.sessionPriceCredits ?? 10,
        topic: input.topic,
        scheduledAt: input.scheduledAt
      });
    }),
    mySessions: protectedProcedure.query(async ({ ctx }) => {
      return getSessionsByUser(ctx.user.id);
    })
  }),
  gamification: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      return getOrCreateUserXP(ctx.user.id);
    }),
    awardXP: protectedProcedure.input(z3.object({
      action: z3.string(),
      description: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return awardXP(ctx.user.id, input.action, input.description);
    }),
    history: protectedProcedure.query(async ({ ctx }) => {
      return getXPHistory(ctx.user.id);
    })
  }),
  checklist: router({
    get: protectedProcedure.input(z3.object({
      date: z3.string()
    })).query(async ({ ctx, input }) => {
      return getChecklistByDate(ctx.user.id, input.date);
    }),
    add: protectedProcedure.input(z3.object({
      date: z3.string(),
      title: z3.string(),
      category: z3.string().optional(),
      isAIGenerated: z3.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      return addChecklistItem(ctx.user.id, input);
    }),
    toggle: protectedProcedure.input(z3.object({
      id: z3.number(),
      isCompleted: z3.boolean()
    })).mutation(async ({ ctx, input }) => {
      await toggleChecklistItem(input.id, ctx.user.id, input.isCompleted);
      if (input.isCompleted) {
        await awardXP(ctx.user.id, "checklist", "Completed a checklist item");
      }
      return { success: true };
    }),
    remove: protectedProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ ctx, input }) => {
      return deleteChecklistItem(input.id, ctx.user.id);
    })
  }),
  journal: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getJournalEntries(ctx.user.id);
    }),
    getByDate: protectedProcedure.input(z3.object({
      date: z3.string()
    })).query(async ({ ctx, input }) => {
      const entry = await getJournalByDate(ctx.user.id, input.date);
      return entry ?? null;
    }),
    save: protectedProcedure.input(z3.object({
      date: z3.string(),
      mood: z3.string().optional(),
      content: z3.string().optional(),
      highlights: z3.array(z3.string()).optional(),
      goals: z3.array(z3.string()).optional()
    })).mutation(async ({ ctx, input }) => {
      const result = await saveJournalEntry(ctx.user.id, input);
      await awardXP(ctx.user.id, "journal", "Wrote a journal entry");
      return result;
    })
  }),
  chat: router({
    sessions: protectedProcedure.query(async ({ ctx }) => {
      return getChatSessions(ctx.user.id);
    }),
    messages: protectedProcedure.input(z3.object({
      sessionId: z3.string()
    })).query(async ({ ctx, input }) => {
      return getChatMessages(ctx.user.id, input.sessionId);
    }),
    saveMessage: protectedProcedure.input(z3.object({
      sessionId: z3.string(),
      role: z3.enum(["user", "assistant"]),
      content: z3.string(),
      sessionTitle: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await upsertChatSession(ctx.user.id, input.sessionId, input.sessionTitle);
      return saveChatMessage(ctx.user.id, input.sessionId, input.role, input.content);
    }),
    deleteSession: protectedProcedure.input(z3.object({
      sessionId: z3.string()
    })).mutation(async ({ ctx, input }) => {
      await deleteChatSession(ctx.user.id, input.sessionId);
      return { success: true };
    })
  }),
  resumeAnalysis: router({
    history: protectedProcedure.query(async ({ ctx }) => {
      return getResumeAnalysisHistory(ctx.user.id);
    }),
    latest: protectedProcedure.query(async ({ ctx }) => {
      const analysis = await getLatestResumeAnalysis(ctx.user.id);
      return analysis ?? null;
    }),
    save: protectedProcedure.input(z3.object({
      resumeText: z3.string().optional(),
      targetRole: z3.string().optional(),
      targetMarket: z3.string().optional(),
      overallScore: z3.number().optional(),
      summary: z3.string().optional(),
      strengths: z3.array(z3.string()).optional(),
      improvements: z3.array(z3.string()).optional(),
      keywords: z3.array(z3.string()).optional(),
      rawResult: z3.any().optional()
    })).mutation(async ({ ctx, input }) => {
      return saveResumeAnalysisResult(ctx.user.id, input);
    })
  }),
  reviews: router({
    // Public: get all approved reviews
    list: publicProcedure.query(async () => {
      return getApprovedReviews();
    }),
    // Protected: submit a review
    submit: protectedProcedure.input(z3.object({
      rating: z3.number().min(1).max(5),
      comment: z3.string().min(10).max(1e3),
      displayName: z3.string().max(128).optional(),
      targetRole: z3.string().max(128).optional(),
      targetMarket: z3.string().max(64).optional(),
      isAnonymous: z3.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      return submitReview(ctx.user.id, input);
    }),
    // Protected: get my own reviews
    mine: protectedProcedure.query(async ({ ctx }) => {
      return getUserReviews(ctx.user.id);
    })
  }),
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getUserProfile2(ctx.user.id);
    }),
    upsert: protectedProcedure.input(z3.object({
      fullName: z3.string().optional(),
      headline: z3.string().optional(),
      email: z3.string().optional(),
      phone: z3.string().optional(),
      location: z3.string().optional(),
      skills: z3.array(z3.string()).optional(),
      experience: z3.array(z3.object({
        company: z3.string(),
        role: z3.string(),
        period: z3.string(),
        description: z3.string()
      })).optional(),
      education: z3.array(z3.object({
        school: z3.string(),
        degree: z3.string(),
        field: z3.string(),
        period: z3.string()
      })).optional(),
      targetRole: z3.string().optional(),
      targetLocation: z3.string().optional(),
      targetSalary: z3.string().optional(),
      visaStatus: z3.string().optional(),
      linkedinUrl: z3.string().optional(),
      portfolioUrl: z3.string().optional(),
      summary: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      return saveUserProfile(ctx.user.id, input);
    })
  }),
  interview: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getInterviewPrepsByUserId(ctx.user.id).catch((error) => {
        console.warn("[interview.list] Database unavailable:", error?.message || error);
        return [];
      });
    }),
    prep: protectedProcedure.input(z3.object({
      applicationId: z3.number().optional(),
      jobTitle: z3.string().optional(),
      company: z3.string().optional(),
      stage: z3.string().optional(),
      notes: z3.string().optional(),
      targetMarket: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const [application, profile] = await Promise.all([
        input.applicationId ? getApplicationById(input.applicationId, ctx.user.id).catch(() => void 0) : Promise.resolve(void 0),
        getUserProfile2(ctx.user.id).catch(() => null)
      ]);
      const prep = interviewAgent.createPrep({
        jobTitle: input.jobTitle ?? application?.jobTitle,
        company: input.company ?? application?.company,
        targetMarket: input.targetMarket ?? profile?.targetLocation ?? "singapore",
        notes: input.notes ?? application?.notes ?? void 0
      });
      const saved = await saveInterviewPrep({
        userId: ctx.user.id,
        applicationId: input.applicationId,
        jobTitle: prep.role,
        company: prep.company,
        stage: input.stage ?? "interview",
        prep,
        followUpEmail: prep.followUpEmail
      }).catch((error) => {
        console.warn("[interview.prep] Persistence skipped:", error?.message || error);
        return { offline: true, message: "Database unavailable. Interview prep was not persisted." };
      });
      return { prep, saved };
    })
  }),
  market: router({
    guidance: publicProcedure.input(z3.object({
      country: z3.string().optional()
    }).optional()).query(({ input }) => {
      return marketVisaAgent.guidance(input?.country);
    })
  }),
  agent: router({
    workflow: protectedProcedure.query(async ({ ctx }) => {
      const [profile, applications2, latestResume, interviewPreps2, jobs2] = await Promise.all([
        getUserProfile2(ctx.user.id).catch(() => null),
        getApplicationsByUserId(ctx.user.id).catch(() => []),
        getLatestResumeAnalysis(ctx.user.id).catch(() => null),
        getInterviewPrepsByUserId(ctx.user.id).catch(() => []),
        fetchJobs({ limit: 5 }).catch(() => ({ jobs: [], mode: "offline" }))
      ]);
      return qaErrorAgent.audit({
        hasProfile: Boolean(profile?.targetRole || profile?.fullName),
        hasJobs: Boolean(jobs2.jobs?.length),
        hasResumeAnalysis: Boolean(latestResume),
        hasApplications: applications2.length > 0,
        hasInterviewPrep: interviewPreps2.length > 0,
        jobDataMode: jobs2.mode,
        resumeStatus: latestResume ? "success" : null
      });
    })
  }),
  trend: router({
    generate: protectedProcedure.input(z3.object({
      sector: z3.string().optional(),
      region: z3.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const baseURL2 = ENV.llmBaseUrl ? ENV.llmBaseUrl.endsWith("/v1") ? ENV.llmBaseUrl : `${ENV.llmBaseUrl}/v1` : void 0;
      const openai = createOpenAI3({ apiKey: ENV.llmApiKey, baseURL: baseURL2 });
      const sector = input.sector || "all sectors";
      const region = input.region || "Singapore, Korea, India";
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
      let text2;
      try {
        const result = await generateText2({
          model: openai.chat(ENV.llmModel),
          prompt,
          maxOutputTokens: 1200
        });
        text2 = result.text;
      } catch (error) {
        console.warn("[trend.generate] AI trend generation unavailable; using local fallback:", error);
        text2 = `## Hot Skills in Demand
- Data literacy, AI workflow design, CRM analytics, stakeholder communication, and market research remain practical differentiators.

## Salary Trends
Ranges vary heavily by company and visa status. Use this as directional guidance only and verify with current official or employer sources.

## Top Hiring Companies
Check official career pages and approved APIs for employers in ${region}. Do not rely on scraped listings.

## Market Insights
Candidates with cross-border communication, analytics, and AI-enabled productivity examples can position strongly for ${sector}.

## Action Items
- Build one market-specific resume variant.
- Save five target roles and run fit evaluations.
- Prepare STAR stories with quantified outcomes.
- Verify visa/legal topics with official sources.`;
      }
      return {
        content: text2,
        sector,
        region,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/apiApp.ts
function createApiApp() {
  const app = express2();
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerResumeRoutes(app);
  registerAuthRoutes(app);
  registerGmailRoutes(app);
  registerChatRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app;
}

// server/_core/vercelApi.ts
var vercelApi_default = createApiApp();
export {
  vercelApi_default as default
};
