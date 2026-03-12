import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

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
  /** Step 0: What are you looking for through JobPA? (JSON array) */
  lookingFor: json("lookingFor").$type<string[]>(),
  /** Step 1: Target role */
  targetRole: varchar("targetRole", { length: 255 }),
  /** Step 2: Experience level */
  experienceLevel: varchar("experienceLevel", { length: 64 }),
  /** Step 3: Areas of interest (JSON array) */
  interests: json("interests").$type<string[]>(),
  /** Step 4: Additional info */
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
