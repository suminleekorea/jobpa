import { describe, expect, it } from "vitest";
import { detectResumeFileKind, extractTextFromResumeFile, getResumeParseMethodLabel } from "./resumeTextExtractor";

function fileFixture(originalname: string, mimetype: string, body: string | Buffer) {
  return {
    originalname,
    mimetype,
    buffer: Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8"),
  };
}

describe("detectResumeFileKind", () => {
  it("detects plain resume text even when browser sends octet-stream", () => {
    const file = fileFixture(
      "resume.download",
      "application/octet-stream",
      "Sumin Lee\nProduct Marketing Manager\nExperience\nLed GTM campaigns and customer success programs."
    );

    expect(detectResumeFileKind(file as any)).toBe("text");
  });

  it("detects RTF from content instead of extension only", () => {
    const file = fileFixture("resume", "application/octet-stream", "{\\rtf1\\ansi Sumin Lee\\par Growth Marketing}");

    expect(detectResumeFileKind(file as any)).toBe("rtf");
  });
});

describe("extractTextFromResumeFile", () => {
  it("extracts readable text from RTF", async () => {
    const file = fileFixture("resume.rtf", "application/rtf", "{\\rtf1\\ansi Sumin Lee\\par Customer Success\\par SQL}");

    const result = await extractTextFromResumeFile(file as any);

    expect(result.method).toBe("rtf");
    expect(result.text).toContain("Sumin Lee");
    expect(result.text).toContain("Customer Success");
  });

  it("strips HTML tags from exported resumes", async () => {
    const file = fileFixture(
      "resume.html",
      "text/html",
      "<html><body><h1>Sumin Lee</h1><p>Business Operations Analyst</p><script>ignore()</script></body></html>"
    );

    const result = await extractTextFromResumeFile(file as any);

    expect(result.method).toBe("html");
    expect(result.text).toContain("Business Operations Analyst");
    expect(result.text).not.toContain("<h1>");
    expect(result.text).not.toContain("ignore");
  });

  it("normalizes CSV resume exports into analyzable text", async () => {
    const file = fileFixture("resume.csv", "text/csv", "section,value\nname,Sumin Lee\nskills,SEO CRM Analytics");

    const result = await extractTextFromResumeFile(file as any);

    expect(result.method).toBe("csv");
    expect(result.text).toContain("SEO CRM Analytics");
  });
});

describe("getResumeParseMethodLabel", () => {
  it("labels best-effort fallback methods clearly", () => {
    expect(getResumeParseMethodLabel("loose-text")).toBe("Best-effort text parser");
    expect(getResumeParseMethodLabel("legacy-doc-fallback")).toContain("Legacy DOC");
  });
});
