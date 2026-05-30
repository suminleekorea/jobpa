import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, bigint } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const surveys = mysqlTable("surveys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lookingFor: json("lookingFor").$type<string[]>(),
  targetRole: varchar("targetRole", { length: 255 }),
  experienceLevel: varchar("experienceLevel", { length: 64 }),
  interests: json("interests").$type<string[]>(),
  targetCompanies: text("targetCompanies"),
  preferredLocations: json("preferredLocations").$type<string[]>(),
  salaryExpectation: varchar("salaryExpectation", { length: 128 }),
  needsVisaSponsorship: boolean("needsVisaSponsorship").default(false),
  preferredJobTypes: json("preferredJobTypes").$type<string[]>(),
  howHeardAbout: varchar("howHeardAbout", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

export const applications = mysqlTable("applications", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export const resumes = mysqlTable("resumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }),
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  analysisResult: json("analysisResult"),
  overallScore: int("overallScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resume = typeof resumes.$inferSelect;

export const fitEvaluations = mysqlTable("fitEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetRole: varchar("targetRole", { length: 255 }),
  jobDescription: text("jobDescription"),
  fitScore: int("fitScore"),
  result: json("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FitEvaluation = typeof fitEvaluations.$inferSelect;

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }),
  content: text("content"),
  reportType: varchar("reportType", { length: 64 }).default("daily"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;

export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetJobType: varchar("targetJobType", { length: 64 }),
  targetRole: varchar("targetRole", { length: 255 }),
  targetCompany: varchar("targetCompany", { length: 255 }),
  deadlineMonths: int("deadlineMonths").default(3),
  weeklyApplicationTarget: int("weeklyApplicationTarget").default(5),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;

export const emailAlerts = mysqlTable("emailAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetRoles: json("targetRoles").$type<string[]>(),
  targetLocations: json("targetLocations").$type<string[]>(),
  frequency: varchar("frequency", { length: 32 }).default("weekly"),
  isActive: boolean("isActive").default(true),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailAlert = typeof emailAlerts.$inferSelect;

export const consultingWaitlist = mysqlTable("consultingWaitlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  interests: json("interests").$type<string[]>(),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConsultingWaitlist = typeof consultingWaitlist.$inferSelect;

// ─── Gamification ───────────────────────────────────────────────
export const userXP = mysqlTable("userXP", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalXP: int("totalXP").default(0).notNull(),
  level: int("level").default(1).notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActiveDate: varchar("lastActiveDate", { length: 10 }),
  badges: json("badges").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserXP = typeof userXP.$inferSelect;
export type InsertUserXP = typeof userXP.$inferInsert;

export const xpEvents = mysqlTable("xpEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  xpAmount: int("xpAmount").notNull(),
  description: varchar("description", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type XPEvent = typeof xpEvents.$inferSelect;

// ─── Daily Checklist ────────────────────────────────────────────
export const dailyChecklist = mysqlTable("dailyChecklist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  isAIGenerated: boolean("isAIGenerated").default(false),
  isCompleted: boolean("isCompleted").default(false),
  category: varchar("category", { length: 64 }),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyChecklistItem = typeof dailyChecklist.$inferSelect;
export type InsertDailyChecklistItem = typeof dailyChecklist.$inferInsert;

// ─── Journal ────────────────────────────────────────────────────
export const journal = mysqlTable("journal", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  mood: varchar("mood", { length: 32 }),
  content: text("content"),
  highlights: json("highlights").$type<string[]>(),
  goals: json("goals").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JournalEntry = typeof journal.$inferSelect;
export type InsertJournalEntry = typeof journal.$inferInsert;

// ─── Consulting Marketplace ──────────────────────────────────────
export const consultants = mysqlTable("consultants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  bio: text("bio"),
  specialties: json("specialties").$type<string[]>(),
  targetRegions: json("targetRegions").$type<string[]>(),
  languages: json("languages").$type<string[]>(),
  yearsExperience: int("yearsExperience").default(0),
  sessionPriceCredits: int("sessionPriceCredits").default(10),
  avatarUrl: text("avatarUrl"),
  photoUrl: text("photoUrl"),
  linkedinUrl: text("linkedinUrl"),
  industry: varchar("industry", { length: 128 }),
  industries: json("industries").$type<string[]>(),
  careerHistory: json("careerHistory").$type<{company: string; role: string; period: string}[]>(),
  sessionTypes: json("sessionTypes").$type<{name: string; durationMinutes: number; priceCredits: number; description: string}[]>(),
  isApproved: boolean("isApproved").default(false),
  isActive: boolean("isActive").default(true),
  totalSessions: int("totalSessions").default(0),
  avgRating: int("avgRating").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Consultant = typeof consultants.$inferSelect;

export const consultingApplications = mysqlTable("consultingApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  bio: text("bio"),
  specialties: json("specialties").$type<string[]>(),
  targetRegions: json("targetRegions").$type<string[]>(),
  languages: json("languages").$type<string[]>(),
  yearsExperience: int("yearsExperience").default(0),
  linkedinUrl: text("linkedinUrl"),
  motivation: text("motivation"),
  status: varchar("status", { length: 32 }).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ConsultingApplication = typeof consultingApplications.$inferSelect;

export const consultingSessions = mysqlTable("consultingSessions", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ConsultingSession = typeof consultingSessions.$inferSelect;

export const userCredits = mysqlTable("userCredits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: int("balance").default(0).notNull(),
  totalEarned: int("totalEarned").default(0).notNull(),
  totalSpent: int("totalSpent").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserCredits = typeof userCredits.$inferSelect;

export const creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  description: varchar("description", { length: 512 }),
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CreditTransaction = typeof creditTransactions.$inferSelect;

// ─── Chat History ────────────────────────────────────────────────
export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ChatSession = typeof chatSessions.$inferSelect;

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChatMessage = typeof chatMessages.$inferSelect;

// ─── Resume Analysis Results ─────────────────────────────────────
export const resumeAnalysisResults = mysqlTable("resumeAnalysisResults", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ResumeAnalysisResult = typeof resumeAnalysisResults.$inferSelect;

// ─── User Reviews / Testimonials ─────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment").notNull(),
  displayName: varchar("displayName", { length: 128 }), // user-chosen display name
  targetRole: varchar("targetRole", { length: 128 }), // e.g. "Software Engineer"
  targetMarket: varchar("targetMarket", { length: 64 }), // e.g. "Singapore", "Korea"
  isApproved: boolean("isApproved").default(false), // owner approves before public display
  isAnonymous: boolean("isAnonymous").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Review = typeof reviews.$inferSelect;

// ─── User Profiles (MyProfile) ───────────────────────────────────
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  fullName: varchar("fullName", { length: 255 }),
  headline: varchar("headline", { length: 512 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  location: varchar("location", { length: 255 }),
  skills: json("skills").$type<string[]>(),
  experience: json("experience").$type<{company: string; role: string; period: string; description: string}[]>(),
  education: json("education").$type<{school: string; degree: string; field: string; period: string}[]>(),
  targetRole: varchar("targetRole", { length: 255 }),
  targetLocation: varchar("targetLocation", { length: 255 }),
  targetSalary: varchar("targetSalary", { length: 128 }),
  visaStatus: varchar("visaStatus", { length: 128 }),
  linkedinUrl: text("linkedinUrl"),
  portfolioUrl: text("portfolioUrl"),
  summary: text("summary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
