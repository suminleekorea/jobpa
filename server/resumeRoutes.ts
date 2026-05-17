import type { Express } from "express";
import multer from "multer";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { createPatchedFetch } from "./_core/patchedFetch";
import { storagePut } from "./storage";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { extractTextFromPdf, getParseMethodLabel, type ParseMethod } from "./pdfParser";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, DOCX, and TXT files are allowed"));
  },
});

interface ExtractResult {
  text: string;
  method: ParseMethod | "text" | "docx";
  warning?: string;
}

async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<ExtractResult> {
  if (mimetype === "text/plain") {
    return { text: buffer.toString("utf-8"), method: "text" };
  }

  if (mimetype === "application/pdf") {
    // Use the 2-layer PDF parser (pdfjs-dist → Gemini Vision)
    const result = await extractTextFromPdf(buffer);
    return {
      text: result.text,
      method: result.method,
      warning: result.warning,
    };
  }

  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 0) {
        return { text: result.value, method: "docx" };
      }
    } catch {
      // fall through
    }
    return {
      text: buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " "),
      method: "docx",
      warning: "DOCX parsing had issues; some content may be missing.",
    };
  }

  return { text: buffer.toString("utf-8"), method: "text" };
}

const ResumeAnalysisSchema = z.object({
  interviewProbability: z.number().min(0).max(100).describe("Probability (0-100) that this resume will get an interview for the target role/JD"),
  overallScore: z.number().min(0).max(100).describe("Overall resume quality score"),
  strengths: z.array(z.string()).describe("3-5 key strengths of the resume"),
  improvements: z.array(z.object({
    issue: z.string().describe("The specific issue or gap"),
    suggestion: z.string().describe("Concrete actionable suggestion"),
    impact: z.string().describe("Expected impact if fixed, e.g. 'increases probability to 65%'"),
    priority: z.enum(["high", "medium", "low"]),
  })).describe("3-5 specific improvement recommendations"),
  regionSpecificTips: z.array(z.string()).describe("2-3 region-specific tips based on target market"),
  missingKeywords: z.array(z.string()).describe("Important keywords missing from resume that appear in the JD"),
  actionPlanTasks: z.array(z.object({
    title: z.string().describe("Short task title for checklist"),
    category: z.enum(["skill", "resume", "research", "network", "prep"]),
  })).describe("3-5 specific tasks the user should add to their daily action plan"),
  summary: z.string().describe("2-3 sentence overall assessment"),
});

export type ResumeAnalysisResult = z.infer<typeof ResumeAnalysisSchema>;

const REGION_CONTEXT: Record<string, string> = {
  singapore: `Singapore-specific context:
- EP (Employment Pass) requires minimum salary ~$5,000/month for most sectors, higher for financial services
- MOM (Ministry of Manpower) guidelines require demonstrating skills complementary to local workforce
- Fair Consideration Framework: employers must advertise on MyCareersFuture for 14 days before hiring foreigners
- Emphasize quantified achievements, not just responsibilities
- LinkedIn is heavily used; ensure profile matches resume
- Common interview formats: case studies for consulting/finance, technical assessments for tech roles`,
  korea: `Korea-specific context:
- Korean resumes (이력서/자기소개서) traditionally include photo, age, military service (for men)
- Large conglomerates (chaebols) have structured GSAT/aptitude tests
- Emphasize educational background and certifications prominently
- Korean business culture values hierarchy and seniority
- TOPIK score relevant for non-native Korean speakers
- For returnees: highlight international experience as a differentiator, not a gap`,
  uae: `UAE/Dubai-specific context:
- Visa sponsorship is standard; employers handle work permits
- Include nationality and visa status clearly
- Arabic language skills are a bonus but not required for most roles
- Free zones (DIFC, ADGM, Dubai Internet City) have different regulations
- Salary is often tax-free; negotiate total package including housing allowance
- Networking through LinkedIn and industry events is critical`,
  hongkong: `Hong Kong-specific context:
- IANG (Immigration Arrangements for Non-local Graduates) visa for recent graduates
- Bilingual (English + Cantonese/Mandarin) skills are highly valued
- Financial services sector dominates; CFA, CPA certifications valued
- Concise, 1-2 page resumes preferred
- Strong emphasis on academic credentials from top universities`,
  australia: `Australia-specific context:
- Skills-based immigration; highlight skills matching occupation lists (SOL/MLTSSL)
- Include Australian work rights status if applicable
- Emphasis on cultural fit and soft skills alongside technical skills
- Superannuation and leave entitlements are standard expectations
- Cover letter is important and expected
- LinkedIn profile should be complete and active`,
};

export function registerResumeRoutes(app: Express) {
  // POST /api/resume/upload-analyze
  app.post("/api/resume/upload-analyze", (req: any, res: any, next: any) => {
    upload.single("resume")(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: err.message || 'File upload failed.' });
      }
      next();
    });
  }, async (req: any, res: any) => {
    try {
      // Auth check
      let user: any = null;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        user = null;
      }
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const targetRegion = (req.body.targetRegion as string) || "singapore";
      const jobDescription = (req.body.jobDescription as string) || "";
      const targetRole = (req.body.targetRole as string) || "";

      // Extract text using 3-layer parser
      let extractResult: ExtractResult;
      try {
        extractResult = await extractTextFromBuffer(file.buffer, file.mimetype);
      } catch (parseError: any) {
        return res.status(400).json({
          error: parseError.message || "Could not extract text from file. Please try a different format.",
          parseError: true,
        });
      }

      const { text: resumeText, method: parseMethod, warning: parseWarning } = extractResult;

      if (!resumeText || resumeText.trim().length < 50) {
        return res.status(400).json({
          error: "The extracted text is too short. Please ensure the file contains readable text content.",
          parseError: true,
        });
      }

      // Upload file to S3
      const fileKey = `resumes/${user.id}/${Date.now()}-${file.originalname}`;
      const { url: fileUrl } = await storagePut(fileKey, file.buffer, file.mimetype);

      // Build AI prompt
      const regionContext = REGION_CONTEXT[targetRegion] || REGION_CONTEXT.singapore;
      const jdSection = jobDescription
        ? `\n\nTarget Job Description:\n${jobDescription.slice(0, 2000)}`
        : targetRole
        ? `\n\nTarget Role: ${targetRole}`
        : "";

      const openai = createOpenAI({
        apiKey: process.env.BUILT_IN_FORGE_API_KEY,
        baseURL: `${process.env.BUILT_IN_FORGE_API_URL}/v1`,
        fetch: createPatchedFetch(fetch) as any,
      });

      const { object: analysis } = await generateObject({
        model: openai.chat("gemini-2.5-flash"),
        schema: ResumeAnalysisSchema,
        prompt: `You are an expert career coach and hiring manager with 15+ years of experience in ${targetRegion.toUpperCase()} job market.

Analyze the following resume and provide a detailed, actionable assessment.

${regionContext}
${jdSection}

Resume Content:
${resumeText.slice(0, 4000)}

Provide honest, specific, and actionable feedback. The interviewProbability should reflect realistic chances based on the resume quality and JD match (if provided). Be specific about what keywords and skills are missing.`,
      });

      // Save to database
      await db.saveResume(user.id, {
        fileName: file.originalname,
        fileUrl,
        fileKey,
        analysisResult: { ...analysis, targetRegion, analyzedAt: Date.now() },
        overallScore: analysis.overallScore,
      });

      // Build parse method info for UI
      const parseMethodLabel = ["pdfjs", "gemini-vision"].includes(parseMethod as string)
        ? getParseMethodLabel(parseMethod as ParseMethod)
        : null;

      return res.json({
        success: true,
        analysis,
        fileUrl,
        parseInfo: {
          method: parseMethod,
          label: parseMethodLabel,
          warning: parseWarning ?? null,
        },
      });
    } catch (error: any) {
      console.error("[ResumeRoutes] Analysis error:", error);
      return res.status(500).json({ error: error.message || "Analysis failed" });
    }
  });
}
