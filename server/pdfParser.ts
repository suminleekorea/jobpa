/**
 * Multi-layer PDF text extractor optimized for LaTeX PDFs.
 *
 * Layer 1: pymupdf (fitz) via Python subprocess — best for LaTeX/Type1/ligature fonts
 * Layer 2: pdf-parse (Node.js) — fallback for standard PDFs
 * Layer 3: Gemini Vision API — last resort for scanned/image-based PDFs
 *
 * Returns the extracted text and the method used.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, unlink } from "fs/promises";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { ENV } from "./_core/env";
import { createPatchedFetch } from "./_core/patchedFetch";

const execFileAsync = promisify(execFile);

export type ParseMethod = "pymupdf" | "pdf-parse" | "gemini-vision";

export interface PdfParseResult {
  text: string;
  method: ParseMethod;
  pageCount?: number;
  warning?: string;
}

// Minimum meaningful text length threshold
const MIN_TEXT_LENGTH = 100;

// ─── Layer 1: pymupdf via Python subprocess ───────────────────────────────────

const PYMUPDF_SCRIPT = `
import sys
import json
import fitz  # pymupdf

pdf_path = sys.argv[1]
try:
    doc = fitz.open(pdf_path)
    pages = []
    for page in doc:
        text = page.get_text("text", flags=fitz.TEXT_DEHYPHENATE | fitz.TEXT_PRESERVE_WHITESPACE)
        pages.append(text)
    doc.close()
    result = {
        "text": "\\n".join(pages),
        "page_count": len(pages),
        "success": True
    }
except Exception as e:
    result = {"success": False, "error": str(e)}
print(json.dumps(result))
`;

async function extractWithPymupdf(buffer: Buffer): Promise<{ text: string; pageCount: number } | null> {
  const tmpPath = join(tmpdir(), `jobpa_resume_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
  try {
    await writeFile(tmpPath, buffer);
    const { stdout } = await execFileAsync("python3", ["-c", PYMUPDF_SCRIPT, tmpPath], {
      timeout: 15000,
      maxBuffer: 5 * 1024 * 1024,
    });
    const result = JSON.parse(stdout.trim());
    if (result.success && result.text && result.text.trim().length >= MIN_TEXT_LENGTH) {
      return { text: result.text.trim(), pageCount: result.page_count };
    }
    return null;
  } catch {
    return null;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

// ─── Layer 2: pdf-parse (Node.js) ────────────────────────────────────────────

async function extractWithPdfParse(buffer: Buffer): Promise<string | null> {
  try {
    const pdfParse = (await import("pdf-parse")) as any;
    const parseFn = pdfParse.default ?? pdfParse;
    const data = await parseFn(buffer);
    if (data.text && data.text.trim().length >= MIN_TEXT_LENGTH) {
      return data.text.trim();
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Layer 3: Gemini Vision API ───────────────────────────────────────────────

const PDF_TO_IMAGES_SCRIPT = `
import sys
import json
import base64
from pdf2image import convert_from_bytes

pdf_bytes = sys.stdin.buffer.read()
try:
    images = convert_from_bytes(pdf_bytes, dpi=150, fmt="jpeg", first_page=1, last_page=4)
    result = []
    for img in images:
        import io
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        result.append(b64)
    print(json.dumps({"success": True, "images": result}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

async function extractWithGeminiVision(buffer: Buffer): Promise<string | null> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) return null;

  try {
    // Convert PDF pages to JPEG images via Python
    const { stdout } = await execFileAsync("python3", ["-c", PDF_TO_IMAGES_SCRIPT], {
      input: buffer,
      timeout: 30000,
      maxBuffer: 20 * 1024 * 1024,
      encoding: "buffer",
    } as any);

    const result = JSON.parse((stdout as unknown as Buffer).toString("utf-8").trim());
    if (!result.success || !result.images || result.images.length === 0) return null;

    const openai = createOpenAI({
      baseURL: ENV.forgeApiUrl.endsWith("/v1") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/v1`,
      apiKey: ENV.forgeApiKey,
      fetch: createPatchedFetch(fetch) as any,
    });

    // Build multimodal message: one image per page (up to 4 pages)
    const imageContents = result.images.map((b64: string) => ({
      type: "image" as const,
      image: `data:image/jpeg;base64,${b64}`,
    }));

    const { text } = await generateText({
      model: openai.chat("gemini-2.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            ...imageContents,
            {
              type: "text",
              text: `Extract ALL text from these resume pages. Preserve the structure: name, contact info, work experience, education, skills, certifications. Output plain text only, no markdown formatting. This is a LaTeX-formatted academic/professional resume.`,
            },
          ],
        },
      ],
    });

    if (text && text.trim().length >= MIN_TEXT_LENGTH) {
      return text.trim();
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Main export: 3-layer fallback ───────────────────────────────────────────

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfParseResult> {
  // Layer 1: pymupdf — best for LaTeX/Type1/ligature fonts
  const pymupdfResult = await extractWithPymupdf(buffer);
  if (pymupdfResult) {
    return {
      text: pymupdfResult.text,
      method: "pymupdf",
      pageCount: pymupdfResult.pageCount,
    };
  }

  // Layer 2: pdf-parse — standard PDF fallback
  const pdfParseText = await extractWithPdfParse(buffer);
  if (pdfParseText) {
    return {
      text: pdfParseText,
      method: "pdf-parse",
      warning: "Standard parser used — some LaTeX formatting may be imperfect.",
    };
  }

  // Layer 3: Gemini Vision API — for scanned/image-based PDFs
  const visionText = await extractWithGeminiVision(buffer);
  if (visionText) {
    return {
      text: visionText,
      method: "gemini-vision",
      warning: "AI Vision parser used — ideal for scanned or image-based PDFs.",
    };
  }

  // All layers failed
  throw new Error(
    "Could not extract text from this PDF. The file may be password-protected, corrupted, or contain only images without readable text. Please try saving as a text-based PDF or uploading a DOCX/TXT version."
  );
}

/**
 * Human-readable label for the parse method, shown in the UI.
 */
export function getParseMethodLabel(method: ParseMethod): string {
  switch (method) {
    case "pymupdf":
      return "LaTeX-optimized parser";
    case "pdf-parse":
      return "Standard PDF parser";
    case "gemini-vision":
      return "AI Vision parser (scanned PDF)";
  }
}
