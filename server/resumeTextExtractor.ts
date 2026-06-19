import type { Express } from "express";
import { extractTextFromPdf, getParseMethodLabel, type ParseMethod } from "./pdfParser";

export type ResumeFileKind =
  | "pdf"
  | "docx"
  | "legacy-doc"
  | "rtf"
  | "html"
  | "markdown"
  | "csv"
  | "text";

export type ResumeParseMethod =
  | ParseMethod
  | "docx"
  | "legacy-doc-fallback"
  | "rtf"
  | "html"
  | "markdown"
  | "csv"
  | "text"
  | "loose-text";

export interface ResumeExtractResult {
  text: string;
  method: ResumeParseMethod;
  kind: ResumeFileKind;
  warning?: string;
}

const TEXT_EXTENSIONS = new Set([".txt", ".text"]);
const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const CSV_EXTENSIONS = new Set([".csv", ".tsv"]);
const HTML_EXTENSIONS = new Set([".html", ".htm"]);

function extensionOf(fileName?: string) {
  const match = (fileName || "").toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

function hasMagic(buffer: Buffer, magic: string) {
  return buffer.subarray(0, magic.length).toString("latin1") === magic;
}

export function detectResumeFileKind(file: Pick<Express.Multer.File, "originalname" | "mimetype" | "buffer">): ResumeFileKind | null {
  const extension = extensionOf(file.originalname);
  const mimetype = (file.mimetype || "").toLowerCase();
  const buffer = file.buffer || Buffer.alloc(0);
  const firstBytes = buffer.subarray(0, 64).toString("latin1").toLowerCase();

  if (hasMagic(buffer, "%PDF-") || mimetype === "application/pdf" || extension === ".pdf") return "pdf";
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    return "docx";
  }
  if (mimetype === "application/msword" || extension === ".doc") return "legacy-doc";
  if (firstBytes.includes("{\\rtf") || mimetype === "application/rtf" || mimetype === "text/rtf" || extension === ".rtf") {
    return "rtf";
  }
  if (HTML_EXTENSIONS.has(extension) || mimetype === "text/html" || /^\s*<!doctype html|^\s*<html/i.test(firstBytes)) {
    return "html";
  }
  if (MARKDOWN_EXTENSIONS.has(extension) || mimetype === "text/markdown") return "markdown";
  if (CSV_EXTENSIONS.has(extension) || mimetype === "text/csv" || mimetype === "text/tab-separated-values") return "csv";
  if (TEXT_EXTENSIONS.has(extension) || mimetype.startsWith("text/")) return "text";

  const loose = extractLooseText(buffer);
  return loose.length >= 50 ? "text" : null;
}

function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeBestEffort(buffer: Buffer) {
  const utf8 = normalizeText(buffer.toString("utf8"));
  const utf16 = normalizeText(buffer.toString("utf16le"));
  return readabilityScore(utf16) > readabilityScore(utf8) ? utf16 : utf8;
}

function readabilityScore(text: string) {
  const useful = text.match(/[a-zA-Z0-9가-힣一-龥ぁ-んァ-ン@.%+$#:/,-]/g)?.length ?? 0;
  const bad = text.match(/[\uFFFD\x00-\x08\x0B\x0C\x0E-\x1F]/g)?.length ?? 0;
  return useful - bad * 8;
}

function extractLooseText(buffer: Buffer) {
  const decoded = decodeBestEffort(buffer);
  const textRuns = decoded
    .split(/\n|[\x00-\x08\x0B\x0C\x0E-\x1F]+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 3)
    .join("\n");

  const latinRuns = buffer
    .toString("latin1")
    .match(/[A-Za-z0-9가-힣一-龥ぁ-んァ-ン@.%+$#:/,()&' -]{4,}/g)
    ?.map((line) => line.trim())
    .filter(Boolean)
    .join("\n") ?? "";

  return normalizeText(readabilityScore(textRuns) >= readabilityScore(latinRuns) ? textRuns : latinRuns);
}

function stripRtf(raw: string) {
  const decodedHex = raw.replace(/\\'([0-9a-f]{2})/gi, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
  return normalizeText(
    decodedHex
      .replace(/\\par[d]?/gi, "\n")
      .replace(/\\tab/gi, " ")
      .replace(/\{\\fonttbl[\s\S]*?\}/gi, "")
      .replace(/\{\\colortbl[\s\S]*?\}/gi, "")
      .replace(/\\[a-z]+-?\d* ?/gi, "")
      .replace(/[{}]/g, "")
  );
}

function stripHtml(raw: string) {
  return normalizeText(
    raw
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
  );
}

function normalizeDelimited(raw: string) {
  return normalizeText(raw.replace(/[,\t;]+/g, " ").replace(/"/g, ""));
}

async function extractDocx(buffer: Buffer): Promise<Pick<ResumeExtractResult, "text" | "method" | "warning">> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    const text = normalizeText(result.value || "");
    if (text.length > 0) {
      return {
        text,
        method: "docx",
        warning: result.messages?.length ? "DOCX parser reported minor formatting warnings." : undefined,
      };
    }
  } catch (error) {
    console.warn("[ResumeTextExtractor] DOCX parser failed:", error);
  }

  return {
    text: extractLooseText(buffer),
    method: "loose-text",
    warning: "DOCX parser failed; used best-effort text extraction.",
  };
}

export async function extractTextFromResumeFile(file: Pick<Express.Multer.File, "originalname" | "mimetype" | "buffer">): Promise<ResumeExtractResult> {
  const kind = detectResumeFileKind(file);
  if (!kind) {
    return {
      text: "",
      method: "loose-text",
      kind: "text",
      warning: "Unsupported file type or no readable text detected.",
    };
  }

  const rawText = decodeBestEffort(file.buffer);

  if (kind === "pdf") {
    try {
      const result = await extractTextFromPdf(file.buffer);
      return {
        text: normalizeText(result.text),
        method: result.method,
        kind,
        warning: result.warning,
      };
    } catch (error) {
      const fallbackText = extractLooseText(file.buffer);
      return {
        text: fallbackText,
        method: "loose-text",
        kind,
        warning: fallbackText.length > 0
          ? "PDF parser failed; used best-effort embedded text extraction."
          : error instanceof Error ? error.message : "PDF parser failed.",
      };
    }
  }

  if (kind === "docx") {
    const result = await extractDocx(file.buffer);
    return { ...result, kind };
  }

  if (kind === "legacy-doc") {
    return {
      text: extractLooseText(file.buffer),
      method: "legacy-doc-fallback",
      kind,
      warning: "Legacy .doc parsing is best-effort. Upload DOCX/PDF/TXT if sections are missing.",
    };
  }

  if (kind === "rtf") return { text: stripRtf(rawText), method: "rtf", kind };
  if (kind === "html") return { text: stripHtml(rawText), method: "html", kind };
  if (kind === "csv") return { text: normalizeDelimited(rawText), method: "csv", kind };
  if (kind === "markdown") return { text: normalizeText(rawText), method: "markdown", kind };

  return { text: normalizeText(rawText), method: "text", kind };
}

export function getResumeParseMethodLabel(method: ResumeParseMethod): string {
  switch (method) {
    case "docx":
      return "DOCX text parser";
    case "legacy-doc-fallback":
      return "Legacy DOC fallback parser";
    case "rtf":
      return "RTF text parser";
    case "html":
      return "HTML text parser";
    case "markdown":
      return "Markdown text parser";
    case "csv":
      return "CSV text parser";
    case "text":
      return "Plain text parser";
    case "loose-text":
      return "Best-effort text parser";
    default:
      return getParseMethodLabel(method);
  }
}
