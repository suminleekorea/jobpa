/**
 * Multi-layer PDF text extractor — pure Node.js, zero Python dependencies.
 *
 * Layer 1: pdfjs-dist (Mozilla's PDF.js) — works for most PDFs including LaTeX
 * Layer 2: Gemini Vision API — last resort for scanned/image-based PDFs
 *
 * Returns the extracted text and the method used.
 */
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { ENV } from "./_core/env";

export type ParseMethod = "pdfjs" | "gemini-vision";

export interface PdfParseResult {
  text: string;
  method: ParseMethod;
  pageCount?: number;
  warning?: string;
}

// Minimum meaningful text length threshold
const MIN_TEXT_LENGTH = 50;

// ─── Layer 1: pdfjs-dist (Mozilla PDF.js) ─────────────────────────────────────
async function extractWithPdfjs(buffer: Buffer): Promise<{ text: string; pageCount: number } | null> {
  try {
    // Dynamic import to avoid bundling issues
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { getDocument } = pdfjsLib;

    const data = new Uint8Array(buffer);
    const doc = await getDocument({ data, useSystemFonts: true }).promise;
    const pageCount = doc.numPages;

    let fullText = "";
    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // Reconstruct text with proper spacing
      const items = content.items as Array<{ str: string; hasEOL?: boolean; transform?: number[] }>;
      let lastY: number | null = null;
      const lines: string[] = [];
      let currentLine = "";

      for (const item of items) {
        const y = item.transform ? item.transform[5] : null;
        // Detect line breaks by Y-coordinate change
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        }
        currentLine += item.str;
        if (item.hasEOL) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        }
        lastY = y;
      }
      if (currentLine.trim()) lines.push(currentLine.trim());

      fullText += lines.join("\n") + "\n\n";
    }

    const trimmed = fullText.trim();
    if (trimmed.length >= MIN_TEXT_LENGTH) {
      return { text: trimmed, pageCount };
    }
    return null;
  } catch (err) {
    console.error("[pdfParser] pdfjs-dist error:", err);
    return null;
  }
}

// ─── Layer 2: Gemini Vision API (for scanned/image PDFs) ─────────────────────
async function extractWithGeminiVision(buffer: Buffer): Promise<string | null> {
  const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
  if (!forgeApiKey) return null;

  try {
    const baseURL = `${process.env.BUILT_IN_FORGE_API_URL}/v1`;
    const openai = createOpenAI({ baseURL, apiKey: forgeApiKey });

    // Send the raw PDF as a base64 file to Gemini (it supports PDF natively)
    const base64Pdf = buffer.toString("base64");

    const { text } = await generateText({
      model: openai.chat("gemini-2.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: base64Pdf,
              mimeType: "application/pdf",
            } as any,
            {
              type: "text",
              text: `Extract ALL text from this resume/CV PDF. Preserve the structure: name, contact info, summary, work experience (company, role, dates, descriptions), education, skills, certifications. Output plain text only, no markdown formatting. If the document is in Korean, preserve the Korean text.`,
            },
          ],
        },
      ],
    });

    if (text && text.trim().length >= MIN_TEXT_LENGTH) {
      return text.trim();
    }
    return null;
  } catch (err) {
    console.error("[pdfParser] Gemini Vision error:", err);
    return null;
  }
}

// ─── Main export: 2-layer fallback ───────────────────────────────────────────
export async function extractTextFromPdf(buffer: Buffer): Promise<PdfParseResult> {
  // Layer 1: pdfjs-dist — works for most PDFs including LaTeX
  const pdfjsResult = await extractWithPdfjs(buffer);
  if (pdfjsResult) {
    return {
      text: pdfjsResult.text,
      method: "pdfjs",
      pageCount: pdfjsResult.pageCount,
    };
  }

  // Layer 2: Gemini Vision API — for scanned/image-based PDFs
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
    "Could not extract text from this PDF. The file may be password-protected, corrupted, or contain only images without readable text. Please try uploading a DOCX or TXT version instead."
  );
}

/**
 * Human-readable label for the parse method, shown in the UI.
 */
export function getParseMethodLabel(method: ParseMethod): string {
  switch (method) {
    case "pdfjs":
      return "PDF text parser";
    case "gemini-vision":
      return "AI Vision parser (scanned PDF)";
  }
}
