/**
 * Job Data Fetcher
 * Fetches real job listings from:
 *  1. Career@Gov (CSV) — Singapore Government
 *  2. MCF (API) — MyCareersFuture Singapore
 *  3. JSearch (RapidAPI) — LinkedIn, Indeed, Glassdoor, Google Jobs, etc.
 *  4. Saramin (API) — 사람인, Korea's largest job portal (requires SARAMIN_API_KEY)
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
  source: "careergov" | "mcf" | "linkedin" | "indeed" | "glassdoor" | "google" | "ziprecruiter" | "monster" | "jobstreet" | "saramin" | "other";
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
  companyLogo?: string;
}

// ─── Cache ──────────────────────────────────────────────────────
interface CacheEntry {
  data: JobListing[];
  timestamp: number;
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
let careerGovCache: CacheEntry | null = null;
let mcfCache: Map<string, CacheEntry> = new Map();
let jsearchCache: Map<string, CacheEntry> = new Map();
let saraminCache: Map<string, CacheEntry> = new Map();

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

function mapExperienceLevel(_expText: string, minYears?: number, _maxYears?: number): string {
  const min = minYears ?? 0;
  if (min <= 1) return "entry";
  if (min <= 3) return "junior";
  if (min <= 7) return "mid";
  return "senior";
}

function mapEmploymentType(empType: string): string {
  if (!empType) return "fulltime";
  const lower = empType.toLowerCase();
  if (lower.includes("permanent") || lower.includes("full") || lower.includes("정규")) return "fulltime";
  if (lower.includes("contract") || lower.includes("fixed") || lower.includes("계약")) return "contract";
  if (lower.includes("intern") || lower.includes("인턴")) return "internship";
  if (lower.includes("part") || lower.includes("flexi") || lower.includes("파트")) return "parttime";
  return "fulltime";
}

function mapIndustryFromField(field: string): string {
  if (!field) return "government";
  const lower = field.toLowerCase();
  if (lower.includes("tech") || lower.includes("info") || lower.includes("digital") || lower.includes("data") || lower.includes("software") || lower.includes("it") || lower.includes("게임") || lower.includes("소프트웨어")) return "tech";
  if (lower.includes("financ") || lower.includes("account") || lower.includes("bank") || lower.includes("금융") || lower.includes("회계")) return "finance";
  if (lower.includes("health") || lower.includes("medical") || lower.includes("pharma") || lower.includes("의료") || lower.includes("제약")) return "healthcare";
  if (lower.includes("educ") || lower.includes("train") || lower.includes("교육")) return "education";
  if (lower.includes("engineer") || lower.includes("엔지니어")) return "tech";
  if (lower.includes("legal") || lower.includes("law") || lower.includes("법")) return "legal";
  if (lower.includes("market") || lower.includes("commun") || lower.includes("media") || lower.includes("마케팅") || lower.includes("광고")) return "marketing";
  if (lower.includes("hotel") || lower.includes("food") || lower.includes("hospitality") || lower.includes("식품") || lower.includes("호텔")) return "hospitality";
  if (lower.includes("logist") || lower.includes("transport") || lower.includes("supply") || lower.includes("물류") || lower.includes("유통")) return "logistics";
  return "government";
}

// ─── Location Mapping ───────────────────────────────────────────
const LOCATION_QUERIES: Record<string, string> = {
  singapore: "in Singapore",
  hongkong: "in Hong Kong",
  dubai: "in Dubai UAE",
  korea: "in South Korea",
  remote: "remote",
};

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
  if (cat.includes("tech") || cat.includes("info") || cat.includes("software") || cat.includes("data")) return "tech";
  if (cat.includes("financ") || cat.includes("bank") || cat.includes("account") || cat.includes("insurance")) return "finance";
  if (cat.includes("health") || cat.includes("medical") || cat.includes("pharma")) return "healthcare";
  if (cat.includes("educ") || cat.includes("train")) return "education";
  if (cat.includes("market") || cat.includes("sales") || cat.includes("retail")) return "sales";
  if (cat.includes("admin") || cat.includes("human") || cat.includes("hr")) return "hr";
  return "others";
}

export async function fetchMCFJobs(
  search?: string,
  limit: number = 50,
  filters?: {
    salaryMin?: number;
    salaryMax?: number;
    categories?: string;
    employmentTypes?: string;
    positionLevels?: string;
  }
): Promise<JobListing[]> {
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
    const baseParams: Record<string, string | number> = {
      limit: pageSize,
    };
    if (search) baseParams.search = search;
    if (filters?.salaryMin) baseParams.salaryMin = filters.salaryMin;
    if (filters?.salaryMax) baseParams.salaryMax = filters.salaryMax;
    if (filters?.categories) baseParams.categories = filters.categories;
    if (filters?.employmentTypes) baseParams.employmentTypes = filters.employmentTypes;
    if (filters?.positionLevels) baseParams.positionLevels = filters.positionLevels;

    // Fetch multiple pages in parallel if needed
    const pageRequests = Array.from({ length: pages }, (_, i) =>
      axios.get(MCF_API_URL, {
        params: { ...baseParams, page: i },
        timeout: 15000,
        headers: { "User-Agent": "JobPA/1.0" },
      })
    );
    const responses = await Promise.allSettled(pageRequests);
    const allResults: MCFJob[] = [];
    for (const res of responses) {
      if (res.status === "fulfilled" && res.value.data?.results) {
        allResults.push(...res.value.data.results);
      }
    }
    const data = { results: allResults };
    if (!data || !data.results || data.results.length === 0) return [];

    const jobs: JobListing[] = (data.results as MCFJob[]).map((job) => {
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

// ─── JSearch API (RapidAPI) ─────────────────────────────────────
const JSEARCH_API_URL = "https://jsearch.p.rapidapi.com/search";

interface JSearchJob {
  job_id: string;
  employer_name: string;
  employer_logo: string | null;
  employer_website: string | null;
  job_employment_type: string;
  job_title: string;
  job_apply_link: string;
  job_description: string;
  job_is_remote: boolean;
  job_posted_at_timestamp: number;
  job_posted_at_datetime_utc: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_salary_period: string | null;
  job_required_experience: {
    no_experience_required: boolean;
    required_experience_in_months: number | null;
    experience_mentioned: boolean;
    experience_preferred: boolean;
  };
  job_required_skills: string[] | null;
  job_google_link: string;
  job_publisher: string;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
  job_onet_soc?: string;
  job_naics_code?: string;
  job_naics_name?: string;
}

function mapJSearchSource(publisher: string): JobListing["source"] {
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

function mapJSearchExperience(exp: JSearchJob["job_required_experience"]): string {
  if (!exp) return "mid";
  if (exp.no_experience_required) return "entry";
  const months = exp.required_experience_in_months;
  if (months === null || months === undefined) return "mid";
  if (months <= 12) return "entry";
  if (months <= 36) return "junior";
  if (months <= 84) return "mid";
  return "senior";
}

function mapJSearchEmploymentType(type: string): string {
  if (!type) return "fulltime";
  const lower = type.toLowerCase();
  if (lower.includes("full")) return "fulltime";
  if (lower.includes("contract") || lower.includes("temp")) return "contract";
  if (lower.includes("intern")) return "internship";
  if (lower.includes("part")) return "parttime";
  return "fulltime";
}

function mapJSearchIndustry(naicsName: string | undefined, title: string): string {
  const text = ((naicsName || "") + " " + (title || "")).toLowerCase();
  if (text.includes("tech") || text.includes("software") || text.includes("developer") || text.includes("engineer") || text.includes("data") || text.includes("cloud") || text.includes("cyber")) return "tech";
  if (text.includes("financ") || text.includes("bank") || text.includes("account") || text.includes("invest")) return "finance";
  if (text.includes("health") || text.includes("medical") || text.includes("pharma") || text.includes("nurs")) return "healthcare";
  if (text.includes("educ") || text.includes("teach") || text.includes("professor")) return "education";
  if (text.includes("market") || text.includes("sales") || text.includes("brand")) return "marketing";
  if (text.includes("hotel") || text.includes("food") || text.includes("hospitality") || text.includes("chef")) return "hospitality";
  if (text.includes("logist") || text.includes("supply") || text.includes("warehouse")) return "logistics";
  if (text.includes("legal") || text.includes("law") || text.includes("compliance")) return "legal";
  return "others";
}

function formatJSearchSalary(job: JSearchJob): string | undefined {
  if (!job.job_min_salary && !job.job_max_salary) return undefined;
  const currency = job.job_salary_currency || "USD";
  const period = job.job_salary_period === "YEAR" ? "/yr" : job.job_salary_period === "MONTH" ? "/mo" : job.job_salary_period === "HOUR" ? "/hr" : "";
  const min = job.job_min_salary;
  const max = job.job_max_salary;
  if (min && max) return `${currency} ${min.toLocaleString()}-${max.toLocaleString()}${period}`;
  if (min) return `${currency} ${min.toLocaleString()}+${period}`;
  if (max) return `Up to ${currency} ${max.toLocaleString()}${period}`;
  return undefined;
}

function mapLocationFromJSearch(job: JSearchJob, queryLocation: string): string {
  // Map back to our location keys
  const country = (job.job_country || "").toLowerCase();
  const city = (job.job_city || "").toLowerCase();

  if (job.job_is_remote) return "remote";
  if (country.includes("singapore") || city.includes("singapore")) return "singapore";
  if (country.includes("hong kong") || city.includes("hong kong")) return "hongkong";
  if (country.includes("united arab") || city.includes("dubai") || city.includes("abu dhabi")) return "dubai";
  if (country.includes("korea") || city.includes("seoul") || city.includes("busan")) return "korea";

  // Fallback to the query location
  return queryLocation || "remote";
}

export async function fetchJSearchJobs(
  search?: string,
  location: string = "singapore",
  limit: number = 30
): Promise<JobListing[]> {
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
        date_posted: "month",
      },
      headers: {
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        "X-RapidAPI-Key": rapidApiKey,
      },
      timeout: 15000,
    });

    const data = response.data;
    if (!data || data.status !== "OK" || !data.data) {
      console.warn("[JobFetcher] JSearch: Unexpected response", data?.status);
      return [];
    }

    const jobs: JobListing[] = (data.data as JSearchJob[]).slice(0, limit).map((job) => {
      const daysPosted = job.job_posted_at_timestamp
        ? daysAgo(job.job_posted_at_timestamp * 1000)
        : 0;

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
        companyLogo: job.employer_logo || undefined,
      };
    });

    const uniqueSources = Array.from(new Set(jobs.map(j => j.source)));
    console.log(`[JobFetcher] JSearch: ${jobs.length} jobs loaded (sources: ${uniqueSources.join(", ")})`);
    jsearchCache.set(cacheKey, { data: jobs, timestamp: Date.now() });
    return jobs;
  } catch (error: any) {
    if (error?.response?.status === 429) {
      console.warn("[JobFetcher] JSearch: Rate limited (429). Using cache or skipping.");
    } else {
      console.error("[JobFetcher] JSearch fetch error:", error?.message || error);
    }
    const cached = jsearchCache.get(cacheKey);
    return cached?.data || [];
  }
}

// ─── Saramin API (사람인) ────────────────────────────────────────
// Korea's largest job portal. Requires SARAMIN_API_KEY env variable.
// Apply for API key at: https://oapi.saramin.co.kr/guide/job-search
const SARAMIN_API_URL = "https://oapi.saramin.co.kr/job-search";

interface SaraminJob {
  id: string;
  url: string;
  active: string;
  "posting-timestamp": string;
  "expiration-timestamp": string;
  "expiration-date"?: string;
  "close-type": { "@code": string; "#text": string } | string;
  company: {
    name: { "@href"?: string; "#text": string } | string;
  };
  position: {
    title: string;
    location: { "@code": string; "#text": string } | string;
    "job-type": { "@code": string; "#text": string } | string;
    industry: { "@code": string; "#text": string } | string;
    "job-mid-code": { "@code": string; "#text": string } | string;
    "job-code": { "@code": string; "#text": string } | string;
    "experience-level": { "@code": string; "@min": string; "@max": string; "#text": string } | string;
    "required-education-level": { "@code": string; "#text": string } | string;
  };
  keyword?: string;
  salary?: { "@code": string; "#text": string } | string;
}

function parseSaraminText(field: any): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field === "object") {
    return field["#text"] || field["_"] || "";
  }
  return String(field);
}

function mapSaraminExperience(expLevel: any): string {
  if (!expLevel) return "mid";
  const code = typeof expLevel === "object" ? expLevel["@code"] : "";
  const min = typeof expLevel === "object" ? parseInt(expLevel["@min"] || "0") : 0;
  if (code === "1") return "entry"; // 신입
  if (min <= 2) return "junior";
  if (min <= 5) return "mid";
  if (min > 5) return "senior";
  return "mid";
}

function mapSaraminJobType(jobType: any): string {
  const text = parseSaraminText(jobType).toLowerCase();
  if (text.includes("정규")) return "fulltime";
  if (text.includes("계약")) return "contract";
  if (text.includes("인턴")) return "internship";
  if (text.includes("파트") || text.includes("아르바이트")) return "parttime";
  return "fulltime";
}

function mapSaraminIndustry(industry: any, jobMidCode: any): string {
  const industryText = parseSaraminText(industry).toLowerCase();
  const jobText = parseSaraminText(jobMidCode).toLowerCase();
  const combined = industryText + " " + jobText;
  if (combined.includes("it") || combined.includes("소프트웨어") || combined.includes("게임") || combined.includes("인터넷") || combined.includes("데이터")) return "tech";
  if (combined.includes("금융") || combined.includes("은행") || combined.includes("보험") || combined.includes("회계")) return "finance";
  if (combined.includes("의료") || combined.includes("제약") || combined.includes("바이오") || combined.includes("병원")) return "healthcare";
  if (combined.includes("교육") || combined.includes("학원")) return "education";
  if (combined.includes("마케팅") || combined.includes("광고") || combined.includes("홍보") || combined.includes("미디어")) return "marketing";
  if (combined.includes("물류") || combined.includes("유통") || combined.includes("운송")) return "logistics";
  if (combined.includes("식품") || combined.includes("호텔") || combined.includes("외식")) return "hospitality";
  if (combined.includes("법") || combined.includes("법률")) return "legal";
  if (combined.includes("영업") || combined.includes("판매")) return "sales";
  return "others";
}

function formatSaraminSalary(salary: any): string | undefined {
  const text = parseSaraminText(salary);
  if (!text || text === "회사내규에 따름") return undefined;
  return text;
}

export async function fetchSaraminJobs(
  search?: string,
  limit: number = 40
): Promise<JobListing[]> {
  const saraminApiKey = process.env.SARAMIN_API_KEY;
  if (!saraminApiKey) {
    console.log("[JobFetcher] Saramin: No SARAMIN_API_KEY, skipping (add key to enable Korean job listings from 사람인)");
    return [];
  }

  const cacheKey = `saramin-${search || "all"}-${limit}`;
  const cached = saraminCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    console.log(`[JobFetcher] Fetching Saramin jobs (search=${search || "all"}, limit=${limit})...`);

    const params: Record<string, string | number> = {
      "access-key": saraminApiKey,
      count: Math.min(limit, 110),
      sort: "pd", // 게시일 역순 (newest first)
    };
    if (search) params.keywords = search;

    const response = await axios.get(SARAMIN_API_URL, {
      params,
      timeout: 15000,
      headers: {
        Accept: "application/json",
        "User-Agent": "JobPA/1.0",
      },
    });

    const data = response.data;
    // Saramin JSON response structure: { "jobs": { "count": N, "start": 0, "total": N, "job": [...] } }
    const jobsData = data?.["job-search"]?.jobs || data?.jobs;
    if (!jobsData) {
      console.warn("[JobFetcher] Saramin: Unexpected response structure", JSON.stringify(data).slice(0, 200));
      return [];
    }

    const jobArray: SaraminJob[] = Array.isArray(jobsData.job)
      ? jobsData.job
      : jobsData.job
        ? [jobsData.job]
        : [];

    const jobs: JobListing[] = jobArray.slice(0, limit).map((job) => {
      const postingTimestamp = parseInt(job["posting-timestamp"] || "0") * 1000;
      const expirationTimestamp = parseInt(job["expiration-timestamp"] || "0") * 1000;
      const daysPosted = postingTimestamp ? daysAgo(postingTimestamp) : 0;

      const companyName = typeof job.company?.name === "object"
        ? (job.company.name["#text"] || "")
        : (job.company?.name || "Unknown");

      const title = parseSaraminText(job.position?.title) || "Untitled";
      const locationText = parseSaraminText(job.position?.location);
      const jobType = job.position?.["job-type"];
      const industry = job.position?.industry;
      const jobMidCode = job.position?.["job-mid-code"];
      const expLevel = job.position?.["experience-level"];

      // Format closing date
      let closingDate: string | undefined;
      if (expirationTimestamp) {
        closingDate = new Date(expirationTimestamp).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }

      return {
        id: `saramin-${job.id}`,
        title,
        company: companyName.trim(),
        location: "korea",
        salary: formatSaraminSalary(job.salary),
        source: "saramin" as const,
        applyUrl: job.url || `https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=${job.id}`,
        visa: false, // Korean domestic jobs
        type: mapSaraminJobType(jobType),
        experience: mapSaraminExperience(expLevel),
        industry: mapSaraminIndustry(industry, jobMidCode),
        posted: daysPosted,
        remote: locationText.includes("재택") || locationText.includes("원격"),
        description: `${locationText} | ${parseSaraminText(jobType)} | ${parseSaraminText(expLevel)}`,
        closingDate,
        skills: job.keyword ? job.keyword.split(",").map(k => k.trim()).filter(Boolean).slice(0, 5) : [],
      };
    });

    console.log(`[JobFetcher] Saramin: ${jobs.length} jobs loaded`);
    saraminCache.set(cacheKey, { data: jobs, timestamp: Date.now() });
    return jobs;
  } catch (error: any) {
    if (error?.response?.status === 403 || error?.response?.status === 401) {
      console.warn("[JobFetcher] Saramin: Invalid API key (403/401). Check SARAMIN_API_KEY.");
    } else if (error?.response?.status === 429) {
      console.warn("[JobFetcher] Saramin: Rate limited (429). Using cache or skipping.");
    } else {
      console.error("[JobFetcher] Saramin fetch error:", error?.message || error);
    }
    const cached = saraminCache.get(cacheKey);
    return cached?.data || [];
  }
}

// ─── Combined Fetch ─────────────────────────────────────────────
export async function fetchAllJobs(options?: {
  search?: string;
  location?: string;
  limit?: number;
}): Promise<{
  jobs: JobListing[];
  total: number;
  sources: Record<string, number>;
}> {
  const { search, location = "all", limit = 100 } = options || {};

  const fetchers: Promise<JobListing[]>[] = [];
  const isSingapore = location === "all" || location === "singapore";
  const isKorea = location === "all" || location === "korea";

  // Career@Gov + MCF only for Singapore
  if (isSingapore) {
    fetchers.push(fetchCareerGovJobs());
    fetchers.push(fetchMCFJobs(search, 50));
  }

  // Saramin for Korea
  if (isKorea) {
    fetchers.push(fetchSaraminJobs(search, 40));
  }

  // JSearch for ALL locations (including Singapore for LinkedIn/Indeed/Glassdoor coverage)
  if (location === "all") {
    // Fetch for each location
    fetchers.push(fetchJSearchJobs(search, "singapore", 20));
    fetchers.push(fetchJSearchJobs(search, "hongkong", 20));
    fetchers.push(fetchJSearchJobs(search, "dubai", 20));
    fetchers.push(fetchJSearchJobs(search, "korea", 20));
    fetchers.push(fetchJSearchJobs(search, "remote", 20));
  } else {
    fetchers.push(fetchJSearchJobs(search, location, 40));
  }

  const results = await Promise.allSettled(fetchers);
  let allJobs: JobListing[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allJobs.push(...result.value);
    }
  }

  // Apply search filter to Career@Gov jobs (MCF and JSearch already filtered by API)
  if (search && isSingapore) {
    const searchLower = search.toLowerCase();
    allJobs = allJobs.filter(job => {
      if (job.source === "mcf" || !["careergov"].includes(job.source)) return true;
      return (
        (job.title || "").toLowerCase().includes(searchLower) ||
        (job.company || "").toLowerCase().includes(searchLower) ||
        (job.description || "").toLowerCase().includes(searchLower)
      );
    });
  }

  // Filter by location if specific
  if (location && location !== "all") {
    allJobs = allJobs.filter(j => j.location === location || j.remote);
  }

  // Deduplicate by title + company (rough)
  const seen = new Set<string>();
  allJobs = allJobs.filter(job => {
    const key = `${(job.title || "").toLowerCase().trim()}|${(job.company || "").toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by posted date (newest first)
  allJobs.sort((a, b) => a.posted - b.posted);

  const limited = allJobs.slice(0, limit);

  // Count by source
  const sources: Record<string, number> = {};
  for (const job of limited) {
    sources[job.source] = (sources[job.source] || 0) + 1;
  }

  return {
    jobs: limited,
    total: allJobs.length,
    sources,
  };
}
