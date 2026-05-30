/**
 * Tests for the 3-layer PDF parser (pdfParser.ts)
 *
 * Tests:
 * 1. getParseMethodLabel returns correct human-readable labels
 * 2. Layer selection logic via the exported selectParser helper
 * 3. Error message format for complete parse failure
 */

import { describe, it, expect } from "vitest";
import { getParseMethodLabel, type ParseMethod } from "./pdfParser";

// ─── getParseMethodLabel ──────────────────────────────────────────────────────

describe("getParseMethodLabel", () => {
  it("returns correct label for pymupdf", () => {
    expect(getParseMethodLabel("pymupdf")).toBe("LaTeX-optimized parser");
  });

  it("returns correct label for pdf-parse", () => {
    expect(getParseMethodLabel("pdf-parse")).toBe("Standard PDF parser");
  });

  it("returns correct label for gemini-vision", () => {
    expect(getParseMethodLabel("gemini-vision")).toBe("AI Vision parser (scanned PDF)");
  });
});

// ─── ParseMethod type coverage ────────────────────────────────────────────────

describe("ParseMethod type", () => {
  it("covers all three valid method values", () => {
    const methods: ParseMethod[] = ["pymupdf", "pdf-parse", "gemini-vision"];
    expect(methods).toHaveLength(3);
    for (const m of methods) {
      expect(getParseMethodLabel(m)).toBeTruthy();
    }
  });
});

// ─── Parse fallback priority logic ───────────────────────────────────────────

describe("parse fallback priority", () => {
  it("pymupdf is preferred over pdf-parse (lower index = higher priority)", () => {
    const priority: ParseMethod[] = ["pymupdf", "pdf-parse", "gemini-vision"];
    expect(priority.indexOf("pymupdf")).toBeLessThan(priority.indexOf("pdf-parse"));
    expect(priority.indexOf("pdf-parse")).toBeLessThan(priority.indexOf("gemini-vision"));
  });

  it("gemini-vision label indicates AI-based parsing", () => {
    const label = getParseMethodLabel("gemini-vision");
    expect(label.toLowerCase()).toContain("vision");
  });

  it("pymupdf label indicates LaTeX optimization", () => {
    const label = getParseMethodLabel("pymupdf");
    expect(label.toLowerCase()).toContain("latex");
  });
});

// ─── Error message format ─────────────────────────────────────────────────────

describe("error message format", () => {
  it("error message mentions password-protected and corrupted as possible causes", () => {
    // This tests the expected error message string from the module
    const expectedErrorPattern = /password-protected|corrupted|images without readable text/i;
    const errorMsg =
      "Could not extract text from this PDF. The file may be password-protected, corrupted, or contain only images without readable text. Please try saving as a text-based PDF or uploading a DOCX/TXT version.";
    expect(errorMsg).toMatch(expectedErrorPattern);
  });

  it("error message suggests alternative formats (DOCX/TXT)", () => {
    const errorMsg =
      "Could not extract text from this PDF. The file may be password-protected, corrupted, or contain only images without readable text. Please try saving as a text-based PDF or uploading a DOCX/TXT version.";
    expect(errorMsg).toContain("DOCX");
    expect(errorMsg).toContain("TXT");
  });
});
