/**
 * Seed script: Insert Sumin Lee as the first approved consultant
 * Run: node scripts/seed-sumin.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// First, ensure there's a user record for Sumin (userId = 1 as owner, or create a placeholder)
// We'll insert a consultant with userId = 1 (the owner user)
// If no user exists yet, we create a placeholder user first

const [existingUsers] = await conn.execute("SELECT id FROM users LIMIT 1");
let userId;

if (existingUsers.length === 0) {
  // Create a placeholder owner user
  const [result] = await conn.execute(
    `INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, 'admin', NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    ["sumin-owner", "Sumin Lee", "sumin@jobpa.io"]
  );
  userId = result.insertId;
  console.log(`Created user with id: ${userId}`);
} else {
  userId = existingUsers[0].id;
  console.log(`Using existing user id: ${userId}`);
}

// Check if consultant already exists
const [existingConsultant] = await conn.execute(
  "SELECT id FROM consultants WHERE userId = ?",
  [userId]
);

const careerHistory = JSON.stringify([
  { company: "Sprinklr", role: "Enterprise Account Executive, APAC", period: "2023 – Present" },
  { company: "Salesforce", role: "Account Executive, Korea & SEA", period: "2021 – 2023" },
  { company: "LinkedIn", role: "Talent Solutions Consultant", period: "2019 – 2021" },
]);

const specialties = JSON.stringify([
  "Singapore EP Visa Strategy",
  "Tech Sales Career Transition",
  "APAC Job Market Navigation",
  "Korean Professionals Abroad",
  "LinkedIn Profile Optimization",
  "Interview Coaching",
]);

const industries = JSON.stringify([
  "Technology",
  "SaaS",
  "Enterprise Sales",
  "Talent Acquisition",
]);

const targetRegions = JSON.stringify(["Singapore", "Korea", "Southeast Asia", "Australia"]);
const languages = JSON.stringify(["Korean", "English"]);

const sessionTypes = JSON.stringify([
  {
    name: "30분 빠른 상담",
    durationMinutes: 30,
    priceCredits: 5,
    description: "이력서 피드백, 비자 질문, 빠른 커리어 방향 점검",
  },
  {
    name: "60분 심층 코칭",
    durationMinutes: 60,
    priceCredits: 10,
    description: "취업 전략 수립, 면접 준비, 링크드인 프로필 최적화",
  },
  {
    name: "90분 커리어 로드맵",
    durationMinutes: 90,
    priceCredits: 15,
    description: "싱가포르/APAC 취업 전체 전략 수립 + 액션플랜 작성",
  },
]);

const photoUrl = "/manus-storage/suminlee-profile_fc56112c.png";
const linkedinUrl = "https://linkedin.com/in/suminlee-apac";

if (existingConsultant.length > 0) {
  // Update existing
  await conn.execute(
    `UPDATE consultants SET
      displayName = ?,
      title = ?,
      bio = ?,
      specialties = ?,
      targetRegions = ?,
      languages = ?,
      yearsExperience = ?,
      sessionPriceCredits = ?,
      photoUrl = ?,
      avatarUrl = ?,
      linkedinUrl = ?,
      industry = ?,
      industries = ?,
      careerHistory = ?,
      sessionTypes = ?,
      isApproved = true,
      isActive = true,
      updatedAt = NOW()
    WHERE userId = ?`,
    [
      "Sumin Lee",
      "Enterprise Account Executive @ Sprinklr | Ex-Salesforce, LinkedIn | APAC Career Coach",
      "싱가포르 현지 취업 6년차. Sprinklr, Salesforce, LinkedIn을 거치며 APAC 테크 세일즈 커리어를 쌓았습니다. 한국에서 싱가포르로 이직하는 과정의 어려움을 직접 경험했기에, 같은 길을 걷는 분들께 실질적인 도움을 드리고 싶습니다. EP 비자 전략부터 링크드인 최적화, 현지 네트워킹까지 — 혼자 헤매지 않아도 됩니다.",
      specialties,
      targetRegions,
      languages,
      6,
      10,
      photoUrl,
      photoUrl,
      linkedinUrl,
      "Technology / SaaS",
      industries,
      careerHistory,
      sessionTypes,
      userId,
    ]
  );
  console.log("✅ Updated Sumin Lee consultant profile");
} else {
  // Insert new
  await conn.execute(
    `INSERT INTO consultants (
      userId, displayName, title, bio, specialties, targetRegions, languages,
      yearsExperience, sessionPriceCredits, photoUrl, avatarUrl, linkedinUrl,
      industry, industries, careerHistory, sessionTypes,
      isApproved, isActive, totalSessions, avgRating, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, true, 12, 5, NOW(), NOW())`,
    [
      userId,
      "Sumin Lee",
      "Enterprise Account Executive @ Sprinklr | Ex-Salesforce, LinkedIn | APAC Career Coach",
      "싱가포르 현지 취업 6년차. Sprinklr, Salesforce, LinkedIn을 거치며 APAC 테크 세일즈 커리어를 쌓았습니다. 한국에서 싱가포르로 이직하는 과정의 어려움을 직접 경험했기에, 같은 길을 걷는 분들께 실질적인 도움을 드리고 싶습니다. EP 비자 전략부터 링크드인 최적화, 현지 네트워킹까지 — 혼자 헤매지 않아도 됩니다.",
      specialties,
      targetRegions,
      languages,
      6,
      10,
      photoUrl,
      photoUrl,
      linkedinUrl,
      "Technology / SaaS",
      industries,
      careerHistory,
      sessionTypes,
    ]
  );
  console.log("✅ Inserted Sumin Lee as first consultant");
}

await conn.end();
console.log("Done!");
