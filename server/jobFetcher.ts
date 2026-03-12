/**
 * Job Data Fetcher
 * Fetches real job listings from Career@Gov (CSV) and MCF (API)
 * Caches results in memory with TTL to avoid excessive API calls
 */
import axios from "axios";
import Papa from "papaparse";

// ─── Types ──────────────────────────────────────────────────────
export interface JobListing {
  id: string;
  title: string;
  company: string;
  agency?: string;
  location: string;
  salary?: string;
  source: "careergov" | "mcf";
  applyUrl: string;
  visa: boolean;
  type: string;
  experience: string;
  industry: string;
  posted: number;
  remote: boolean;
  description: string;
  closingDate?: string;
  employmentType?: string;
  skills?: string[];
}

// ─── Cache ──────────────────────────────────────────────────────
interface CacheEntry {
  data: JobListing[];
  timestamp: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
let careerGovCache: CacheEntry | null = null;
let mcfCache: Map<string, CacheEntry> = new Map();

// ─── Helpers ────────────────────────────────────────────────────
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function daysAgo(timestamp: number): number {
  if (!timestamp || isNaN(timestamp)) return 0;
  const now = Date.now();
  const diff = now - timestamp;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function mapExperienceLevel(expText: string, minYears?: number, maxYears?: number): string {
  const min = minYears ?? 0;
  if (min <= 1) return "entry";
  if (min <= 3) return "junior";
  if (min <= 7) return "mid";
  return "senior";
}

function mapEmploymentType(empType: string): string {
  if (!empType) return "fulltime";
  const lower = empType.toLowerCase();
  if (lower.includes("permanent") || lower.includes("full")) return "fulltime";
  if (lower.includes("contract") || lower.includes("fixed")) return "contract";
  if (lower.includes("intern")) return "internship";
  if (lower.includes("part") || lower.includes("flexi")) return "parttime";
  return "fulltime";
}

function mapIndustryFromField(field: string): string {
  if (!field) return "government";
  const lower = field.toLowerCase();
  if (lower.includes("tech") || lower.includes("info") || lower.includes("digital") || lower.includes("data")) return "tech";
  if (lower.includes("financ") || lower.includes("account")) return "finance";
  if (lower.includes("health") || lower.includes("medical") || lower.includes("pharma")) return "healthcare";
  if (lower.includes("educ") || lower.includes("train")) return "education";
  if (lower.includes("engineer")) return "tech";
  if (lower.includes("legal") || lower.includes("law")) return "legal";
  if (lower.includes("market") || lower.includes("commun") || lower.includes("media")) return "marketing";
  return "government";
}

// ─── Career@Gov CSV ─────────────────────────────────────────────
const CAREERGOV_CSV_URL = "https://raw.githubusercontent.com/opengovsg/careersgovsg-jobs-data/main/data/job-listings.csv";

interface CareerGovRow {
  postingNo: string;
  jobId: string;
  jobTitle: string;
  agency: string;
  agencyId: string;
  agencyDescription: string;
  startDate: string;
  closingDate: string;
  closingDateText: string;
  remainingDays: string;
  employmentType: string;
  employmentTypeCode: string;
  experienceRequired: string;
  experienceYearsMin: string;
  experienceYearsMax: string;
  field: string;
  fieldCode: string;
  functionalArea: string;
  functionalAreaCode: string;
  industry: string;
  educationCode: string;
  isNew: string;
  location: string;
  jobDescription: string;
  jobResponsibilities: string;
  jobRequirements: string;
  category: string;
  workArrangement: string;
}

export async function fetchCareerGovJobs(): Promise<JobListing[]> {
  if (careerGovCache && Date.now() - careerGovCache.timestamp < CACHE_TTL) {
    return careerGovCache.data;
  }

  try {
    console.log("[JobFetcher] Fetching Career@Gov CSV...");
    const response = await axios.get(CAREERGOV_CSV_URL, {
      timeout: 30000,
      responseType: "text",
    });

    const parsed = Papa.parse<CareerGovRow>(response.data, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parsed.errors.length > 0) {
      console.warn(`[JobFetcher] Career@Gov CSV parse warnings: ${parsed.errors.length}`);
    }

    const jobs: JobListing[] = [];
    // Process up to 500 most recent rows
    const rows = parsed.data.slice(0, 500);

    for (const row of rows) {
      const title = (row.jobTitle || "").replace(/\u00a0/g, " ").trim();
      const agency = (row.agency || "").replace(/\u00a0/g, " ").trim();
      const postingNo = row.postingNo || "";
      const jobId = row.jobId || "";

      if (!title || !agency || !jobId) continue;

      // Construct URL: https://jobs.careers.gov.sg/jobs/hrp/{jobId}/{postingNo}
      const applyUrl = `https://jobs.careers.gov.sg/jobs/hrp/${jobId}/${postingNo}`;

      // Parse dates
      const startDateMs = parseInt(row.startDate) || 0;
      const closingDateText = row.closingDateText || "";

      // Build description from separate fields
      const descParts = [row.jobDescription, row.jobResponsibilities, row.jobRequirements].filter(Boolean);
      const fullDesc = stripHtml(descParts.join(" "));
      const shortDesc = fullDesc.slice(0, 300) + (fullDesc.length > 300 ? "..." : "");

      const minYears = parseInt(row.experienceYearsMin) || 0;
      const maxYears = parseInt(row.experienceYearsMax) || 0;

      jobs.push({
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
        employmentType: row.employmentType,
      });
    }

    console.log(`[JobFetcher] Career@Gov: ${jobs.length} jobs loaded`);
    careerGovCache = { data: jobs, timestamp: Date.now() };
    return jobs;
  } catch (error) {
    console.error("[JobFetcher] Career@Gov fetch error:", error);
    return careerGovCache?.data || [];
  }
}

// ─── MCF API ────────────────────────────────────────────────────
const MCF_API_URL = "https://api.mycareersfuture.gov.sg/v2/jobs/";

interface MCFJob {
  uuid: string;
  title: string;
  description: string;
  minimumYearsExperience: number | null;
  numberOfVacancies: number;
  skills: Array<{ skill: string }>;
  categories: Array<{ category: string }>;
  employmentTypes: Array<{ employmentType: string }>;
  positionLevels: Array<{ position: string }>;
  postedCompany: { name: string; description?: string };
  hiringCompany?: { name: string };
  salary: { minimum: number | null; maximum: number | null; type: { salaryType: string } };
  metadata: {
    jobPostId: string;
    createdAt: string;
    expiryDate: string;
    newPostingDate: string;
    jobDetailsUrl: string;
  };
  address?: {
    districts?: Array<{ location: string; region: string }>;
  };
}

function mapMCFExperience(minYears: number | null, position: string): string {
  if (position) {
    const lower = position.toLowerCase();
    if (lower.includes("senior") || lower.includes("manager") || lower.includes("director")) return "senior";
    if (lower.includes("executive") || lower.includes("professional")) return "mid";
    if (lower.includes("junior") || lower.includes("fresh")) return "junior";
    if (lower.includes("non-executive") || lower.includes("entry")) return "entry";
  }
  if (minYears === null || minYears === undefined) return "mid";
  if (minYears <= 1) return "entry";
  if (minYears <= 3) return "junior";
  if (minYears <= 7) return "mid";
  return "senior";
}

function mapMCFEmploymentType(types: Array<{ employmentType: string }>): string {
  if (!types || types.length === 0) return "fulltime";
  const t = (types[0]?.employmentType || "").toLowerCase();
  if (t.includes("permanent") || t.includes("full")) return "fulltime";
  if (t.includes("contract") || t.includes("temp")) return "contract";
  if (t.includes("intern")) return "internship";
  if (t.includes("part") || t.includes("flexi")) return "parttime";
  return "fulltime";
}

function formatSalary(salary: MCFJob["salary"]): string | undefined {
  if (!salary || (salary.minimum === null && salary.maximum === null)) return undefined;
  const min = salary.minimum;
  const max = salary.maximum;
  const type = salary.type?.salaryType || "Monthly";
  const suffix = type === "Monthly" ? "/mo" : type === "Annual" ? "/yr" : "";

  if (min && max) return `S$${min.toLocaleString()}-${max.toLocaleString()}${suffix}`;
  if (min) return `S$${min.toLocaleString()}+${suffix}`;
  if (max) return `Up to S$${max.toLocaleString()}${suffix}`;
  return undefined;
}

function mapMCFIndustry(categories: Array<{ category: string }>): string {
  if (!categories || categories.length === 0) return "others";
  const cat = (categories[0]?.category || "").toLowerCase();
  if (cat.includes("tech") || cat.includes("info") || cat.includes("software") || cat.includes("engineering")) return "tech";
  if (cat.includes("financ") || cat.includes("bank") || cat.includes("account") || cat.includes("insurance")) return "finance";
  if (cat.includes("health") || cat.includes("medical") || cat.includes("pharma")) return "healthcare";
  if (cat.includes("educ") || cat.includes("train")) return "education";
  if (cat.includes("market") || cat.includes("sales") || cat.includes("retail")) return "sales";
  if (cat.includes("admin") || cat.includes("human") || cat.includes("hr")) return "hr";
  return "others";
}

export async function fetchMCFJobs(search?: string, limit: number = 50): Promise<JobListing[]> {
  const cacheKey = `mcf-${search || "all"}-${limit}`;
  const cached = mcfCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    console.log(`[JobFetcher] Fetching MCF jobs (search=${search || "all"}, limit=${limit})...`);
    const params: Record<string, string | number> = {
      limit: Math.min(limit, 100),
      page: 0,
    };
    if (search) params.search = search;

    const response = await axios.get(MCF_API_URL, {
      params,
      timeout: 15000,
      headers: { "User-Agent": "JobPA/1.0" },
    });

    const data = response.data;
    if (!data || !data.results) return [];

    const jobs: JobListing[] = data.results.map((job: MCFJob) => {
      const postDate = job.metadata?.newPostingDate || job.metadata?.createdAt;
      const daysPosted = postDate ? daysAgo(new Date(postDate).getTime()) : 0;
      const position = job.positionLevels?.[0]?.position || "";

      return {
        id: `mcf-${job.uuid}`,
        title: job.title,
        company: job.hiringCompany?.name || job.postedCompany?.name || "Unknown",
        location: "singapore",
        salary: formatSalary(job.salary),
        source: "mcf" as const,
        applyUrl: job.metadata?.jobDetailsUrl || `https://www.mycareersfuture.gov.sg/job/${job.uuid}`,
        visa: true,
        type: mapMCFEmploymentType(job.employmentTypes),
        experience: mapMCFExperience(job.minimumYearsExperience, position),
        industry: mapMCFIndustry(job.categories),
        posted: daysPosted,
        remote: false,
        description: stripHtml(job.description || "").slice(0, 300),
        closingDate: job.metadata?.expiryDate ? new Date(job.metadata.expiryDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : undefined,
        skills: job.skills?.slice(0, 5).map(s => s?.skill).filter(Boolean) as string[],
      };
    });

    console.log(`[JobFetcher] MCF: ${jobs.length} jobs loaded`);
    mcfCache.set(cacheKey, { data: jobs, timestamp: Date.now() });
    return jobs;
  } catch (error) {
    console.error("[JobFetcher] MCF fetch error:", error);
    const cached = mcfCache.get(cacheKey);
    return cached?.data || [];
  }
}

// ─── Combined Fetch ─────────────────────────────────────────────
export async function fetchAllJobs(options?: {
  search?: string;
  location?: string;
  limit?: number;
}): Promise<{ jobs: JobListing[]; total: number; sources: { careergov: number; mcf: number } }> {
  const { search, location, limit = 100 } = options || {};

  // For non-Singapore locations, return empty (future: add other APIs)
  if (location && location !== "all" && location !== "singapore") {
    return { jobs: [], total: 0, sources: { careergov: 0, mcf: 0 } };
  }

  const [careerGovJobs, mcfJobs] = await Promise.all([
    fetchCareerGovJobs(),
    fetchMCFJobs(search, Math.min(limit, 100)),
  ]);

  let allJobs = [...careerGovJobs, ...mcfJobs];

  // Apply search filter to Career@Gov jobs (MCF already filtered by API)
  if (search) {
    const searchLower = search.toLowerCase();
    allJobs = allJobs.filter(job =>
      (job.title || "").toLowerCase().includes(searchLower) ||
      (job.company || "").toLowerCase().includes(searchLower) ||
      (job.description || "").toLowerCase().includes(searchLower)
    );
  }

  // Sort by posted date (newest first)
  allJobs.sort((a, b) => a.posted - b.posted);

  const limited = allJobs.slice(0, limit);

  return {
    jobs: limited,
    total: allJobs.length,
    sources: {
      careergov: limited.filter(j => j.source === "careergov").length,
      mcf: limited.filter(j => j.source === "mcf").length,
    },
  };
}
