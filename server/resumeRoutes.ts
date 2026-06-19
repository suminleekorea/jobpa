import type { Express } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { createResumeAnalysis } from "./jobpaAdapter";
import { resumeAgent, type AnalysisStatus } from "./agents";
import {
  detectResumeFileKind,
  extractTextFromResumeFile,
  getResumeParseMethodLabel,
  type ResumeExtractResult,
} from "./resumeTextExtractor";

const FALLBACK_MESSAGE = "We could not fully parse this file. You can paste your resume text instead.";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, _file, cb) => cb(null, true),
});

function contentTypeForKind(kind: ResumeExtractResult["kind"], fallback?: string) {
  switch (kind) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "legacy-doc":
      return "application/msword";
    case "rtf":
      return "application/rtf";
    case "html":
      return "text/html; charset=utf-8";
    case "markdown":
      return "text/markdown; charset=utf-8";
    case "csv":
      return "text/csv; charset=utf-8";
    case "text":
      return "text/plain; charset=utf-8";
    default:
      return fallback || "application/octet-stream";
  }
}

async function authenticate(req: any) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

async function persistFailure(userId: number, input: {
  source: "upload" | "paste" | "retry";
  fileName?: string;
  targetRole?: string;
  targetMarket?: string;
  resumeText?: string;
  parseMethod?: string;
  parseWarning?: string;
  errorMessage: string;
}) {
  await createResumeAnalysis({
    userId,
    source: input.source,
    fileName: input.fileName,
    targetRole: input.targetRole,
    targetMarket: input.targetMarket,
    resumeText: input.resumeText,
    status: "failed",
    parseMethod: input.parseMethod,
    parseWarning: input.parseWarning,
    errorMessage: input.errorMessage,
  });
}

async function persistSuccessfulAnalysis(userId: number, input: {
  source: "upload" | "paste" | "retry";
  fileName?: string;
  fileUrl?: string;
  fileKey?: string;
  resumeText: string;
  targetRole?: string;
  targetMarket?: string;
  status: AnalysisStatus;
  parseMethod?: string;
  parseWarning?: string;
  analysis: any;
  keywords?: string[];
}) {
  await createResumeAnalysis({
    userId,
    source: input.source,
    fileName: input.fileName,
    resumeText: input.resumeText.slice(0, 60000),
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
    rawResult: input.analysis,
  });

  await db.saveResume(userId, {
    fileName: input.fileName ?? "pasted-resume.txt",
    fileUrl: input.fileUrl,
    fileKey: input.fileKey,
    analysisResult: input.analysis,
    overallScore: input.analysis?.overallScore,
  }).catch(error => {
    console.warn("[ResumeRoutes] Legacy resume save skipped:", error?.message || error);
  });

  await db.saveResumeAnalysisResult(userId, {
    resumeText: input.resumeText.slice(0, 60000),
    targetRole: input.targetRole,
    targetMarket: input.targetMarket,
    overallScore: input.analysis?.overallScore,
    summary: input.analysis?.summary,
    strengths: input.analysis?.strengths,
    improvements: input.analysis?.improvements?.map((item: any) => item.issue || item.suggestion || String(item)),
    keywords: input.keywords ?? input.analysis?.missingKeywords,
    rawResult: input.analysis,
  }).catch(error => {
    console.warn("[ResumeRoutes] Resume analysis history save skipped:", error?.message || error);
  });

  await db.awardXP(userId, "resume", "Analyzed a resume").catch(() => undefined);
}

function fallbackResponse(extra?: Record<string, unknown>) {
  return {
    success: false,
    status: "failed" as const,
    message: FALLBACK_MESSAGE,
    canPaste: true,
    retryable: true,
    ...extra,
  };
}

export function registerResumeRoutes(app: Express) {
  app.post("/api/resume/upload-analyze", (req: any, res: any, next: any) => {
    upload.single("resume")(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(200).json(fallbackResponse({
            code: "file_too_large",
            detail: "File too large. Maximum size is 10MB.",
          }));
        }
        return res.status(200).json(fallbackResponse({ code: "upload_failed", detail: err.message || "Upload failed." }));
      }
      next();
    });
  }, async (req: any, res: any) => {
    const user = await authenticate(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const targetMarket = (req.body.targetRegion as string) || (req.body.targetMarket as string) || "singapore";
    const jobDescription = (req.body.jobDescription as string) || "";
    const targetRole = (req.body.targetRole as string) || "";
    const file = req.file as Express.Multer.File | undefined;

    if (!file) {
      await persistFailure(user.id, {
        source: "upload",
        targetRole,
        targetMarket,
        errorMessage: "No file uploaded.",
      });
      return res.status(200).json(fallbackResponse({ code: "missing_file" }));
    }

    if (!file.buffer || file.buffer.length === 0) {
      await persistFailure(user.id, {
        source: "upload",
        fileName: file.originalname,
        targetRole,
        targetMarket,
        errorMessage: "Empty file.",
      });
      return res.status(200).json(fallbackResponse({ code: "empty_file" }));
    }

    const detectedKind = detectResumeFileKind(file);
    if (!detectedKind) {
      await persistFailure(user.id, {
        source: "upload",
        fileName: file.originalname,
        targetRole,
        targetMarket,
        errorMessage: "Unsupported file type.",
      });
      return res.status(200).json(fallbackResponse({
        code: "unsupported_file",
        detail: "Supported formats include PDF, DOCX, DOC, TXT, RTF, Markdown, HTML, and CSV.",
      }));
    }

    let extractResult: ResumeExtractResult;
    try {
      extractResult = await extractTextFromResumeFile(file);
    } catch (error: any) {
      await persistFailure(user.id, {
        source: "upload",
        fileName: file.originalname,
        targetRole,
        targetMarket,
        errorMessage: error?.message || "Parser failed.",
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
        errorMessage: "Missing readable resume text.",
      });
      return res.status(200).json(fallbackResponse({ code: "missing_text" }));
    }

    const safeFileName = (file.originalname || "resume").replace(/[\\/]/g, "-");
    const fileKey = `resumes/${user.id}/${Date.now()}-${safeFileName}`;
    const stored = await storagePut(fileKey, file.buffer, contentTypeForKind(extractResult.kind, file.mimetype)).catch(error => {
      console.warn("[ResumeRoutes] File storage skipped:", error?.message || error);
      return { key: undefined, url: undefined };
    });

    const agentResult = resumeAgent.analyzeResumeText({
      resumeText,
      targetRole,
      targetMarket,
      jobDescription,
      parseWarning: extractResult.warning,
    });

    if (!agentResult.analysis) {
      await persistFailure(user.id, {
        source: "upload",
        fileName: safeFileName,
        targetRole,
        targetMarket,
        parseMethod: extractResult.method,
        parseWarning: extractResult.warning,
        errorMessage: agentResult.message || FALLBACK_MESSAGE,
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
      keywords: agentResult.keywords,
    });

    return res.json({
      success: true,
      status: agentResult.status,
      message: agentResult.message,
      analysis: agentResult.analysis,
      fileUrl: stored.url,
      parseInfo: {
        method: extractResult.method,
        label: getResumeParseMethodLabel(extractResult.method),
        warning: extractResult.warning ?? null,
      },
    });
  });

  app.post("/api/resume/analyze-text", async (req: any, res: any) => {
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
        errorMessage: "Pasted resume text is too short.",
      });
      return res.status(200).json(fallbackResponse({
        code: "text_too_short",
        detail: "Paste at least a few resume sections before retrying.",
      }));
    }

    const agentResult = resumeAgent.analyzeResumeText({
      resumeText,
      targetRole,
      targetMarket,
      jobDescription,
    });

    if (!agentResult.analysis) {
      await persistFailure(user.id, {
        source: "paste",
        targetRole,
        targetMarket,
        resumeText,
        errorMessage: agentResult.message || FALLBACK_MESSAGE,
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
      keywords: agentResult.keywords,
    });

    return res.json({
      success: true,
      status: agentResult.status,
      message: agentResult.message,
      analysis: agentResult.analysis,
      parseInfo: {
        method: "text",
        label: "Pasted text",
        warning: null,
      },
    });
  });
}
