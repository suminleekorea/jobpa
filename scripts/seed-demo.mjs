import "dotenv/config";
import mysql from "mysql2/promise";

const demoJobs = [
  {
    id: "demo-sg-ai-marketing-001",
    title: "AI Marketing Analyst",
    company: "Merlion Growth Labs",
    location: "singapore",
    salary: "S$5,500-7,500/mo",
    source: "other",
    apply_url: "https://example.com/demo/ai-marketing-analyst",
    visa: true,
    type: "fulltime",
    experience: "junior",
    industry: "marketing",
    posted: 2,
    remote: false,
    description: "Use customer, campaign, and product data to improve regional growth programs.",
    skills: ["SQL", "Marketing Analytics", "Dashboarding", "Generative AI"],
  },
  {
    id: "demo-hk-growth-002",
    title: "Growth Strategy Associate",
    company: "Harbour Fintech Studio",
    location: "hongkong",
    salary: "HK$32,000-45,000/mo",
    source: "other",
    apply_url: "https://example.com/demo/growth-strategy-associate",
    visa: true,
    type: "fulltime",
    experience: "junior",
    industry: "finance",
    posted: 4,
    remote: false,
    description: "Support go-to-market experiments, customer research, and strategic partnerships.",
    skills: ["Market Research", "Partnerships", "Fintech", "Excel"],
  },
];

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set. Skipping demo seed.");
  process.exit(0);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [userResult] = await connection.execute(
    `INSERT INTO users (openId, name, email, loginMethod, role, lastSignedIn)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name), lastSignedIn = NOW()`,
    ["demo-jobpa-user", "Demo JobPA User", "demo-jobpa@example.invalid", "demo", "user"],
  );

  let userId = userResult.insertId;
  if (!userId) {
    const [rows] = await connection.execute("SELECT id FROM users WHERE email = ? LIMIT 1", ["demo-jobpa@example.invalid"]);
    userId = rows[0]?.id;
  }

  await connection.execute(
    `INSERT INTO career_profiles
      (user_id, interests, target_countries, target_role, experience_level, salary_range, visa_status, preferred_language, languages, market, profile_summary, agent_state)
     VALUES (?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE
      interests = VALUES(interests),
      target_countries = VALUES(target_countries),
      target_role = VALUES(target_role),
      experience_level = VALUES(experience_level),
      salary_range = VALUES(salary_range),
      visa_status = VALUES(visa_status),
      preferred_language = VALUES(preferred_language),
      languages = VALUES(languages),
      market = VALUES(market),
      profile_summary = VALUES(profile_summary),
      agent_state = VALUES(agent_state)`,
    [
      userId,
      JSON.stringify(["AI/ML", "Marketing Analytics", "Product Growth"]),
      JSON.stringify(["singapore", "hongkong"]),
      "AI Marketing Analyst",
      "junior",
      "S$5,500-7,500/mo",
      "Needs employer sponsorship",
      "English",
      JSON.stringify(["English", "Korean"]),
      "singapore",
      "Sanitized demo profile for local JobPA review.",
      JSON.stringify({ seededAt: new Date().toISOString(), source: "seed-demo" }),
    ],
  );

  for (const job of demoJobs) {
    await connection.execute(
      `INSERT INTO jobs
        (id, title, company, location, salary, source, apply_url, visa, type, experience, industry, posted, remote, description, skills, raw)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        company = VALUES(company),
        location = VALUES(location),
        salary = VALUES(salary),
        source = VALUES(source),
        apply_url = VALUES(apply_url),
        visa = VALUES(visa),
        type = VALUES(type),
        experience = VALUES(experience),
        industry = VALUES(industry),
        posted = VALUES(posted),
        remote = VALUES(remote),
        description = VALUES(description),
        skills = VALUES(skills),
        raw = VALUES(raw)`,
      [
        job.id,
        job.title,
        job.company,
        job.location,
        job.salary,
        job.source,
        job.apply_url,
        job.visa,
        job.type,
        job.experience,
        job.industry,
        job.posted,
        job.remote,
        job.description,
        JSON.stringify(job.skills),
        JSON.stringify(job),
      ],
    );
  }

  console.log(`Seeded demo JobPA data for user id ${userId}.`);
} finally {
  await connection.end();
}
