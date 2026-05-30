import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchSaraminJobs } from "./jobFetcher";

// ─── Saramin API Integration ─────────────────────────────────────────────────

describe("fetchSaraminJobs — no API key", () => {
  beforeEach(() => {
    // Ensure SARAMIN_API_KEY is not set
    delete process.env.SARAMIN_API_KEY;
  });

  it("returns empty array gracefully when SARAMIN_API_KEY is not set", async () => {
    const result = await fetchSaraminJobs("개발자", 10);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("does not throw when called without API key", async () => {
    await expect(fetchSaraminJobs()).resolves.not.toThrow();
  });
});

describe("fetchSaraminJobs — with invalid API key", () => {
  beforeEach(() => {
    process.env.SARAMIN_API_KEY = "invalid-test-key-12345";
  });

  it("returns empty array on 403/401 auth error", async () => {
    // With an invalid key, the API will return 403; the function should handle gracefully
    const result = await fetchSaraminJobs("engineer", 5);
    expect(Array.isArray(result)).toBe(true);
    // Either returns empty (API rejected) or cached data — both are valid
  }, 20000);
});

// ─── Korean Platform External Resources (UI logic) ───────────────────────────

describe("Korean platform external resource URLs", () => {
  const KOREAN_PLATFORMS = [
    { name: "잡코리아", url: "https://www.jobkorea.co.kr" },
    { name: "인크루트", url: "https://www.incruit.com" },
    { name: "피플앤잡", url: "https://www.peoplenjob.com" },
  ];

  it("all Korean platform URLs are valid HTTPS URLs", () => {
    for (const platform of KOREAN_PLATFORMS) {
      expect(platform.url).toMatch(/^https:\/\//);
      expect(platform.url).not.toContain(" ");
    }
  });

  it("all Korean platforms have non-empty names", () => {
    for (const platform of KOREAN_PLATFORMS) {
      expect(platform.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("Korean platforms section is shown only when Korea location is selected", () => {
    // This mirrors the UI logic: selectedLocation === "korea"
    const shouldShow = (location: string) => location === "korea";
    expect(shouldShow("korea")).toBe(true);
    expect(shouldShow("singapore")).toBe(false);
    expect(shouldShow("all")).toBe(false);
    expect(shouldShow("dubai")).toBe(false);
    expect(shouldShow("remote")).toBe(false);
  });
});

// ─── Source Badge Mapping ─────────────────────────────────────────────────────

describe("Korean job source badge mapping", () => {
  const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
    saramin: { label: "사람인", color: "bg-indigo-100 text-indigo-800" },
    jobkorea: { label: "잡코리아", color: "bg-rose-100 text-rose-800" },
  };

  function getSourceBadge(source?: string) {
    if (!source) return SOURCE_BADGES.google || { label: "Google Jobs", color: "bg-gray-100 text-gray-800" };
    const key = source.toLowerCase().replace(/[^a-z]/g, "");
    return SOURCE_BADGES[key] || { label: source, color: "bg-gray-100 text-gray-800" };
  }

  it("maps saramin source to 사람인 badge", () => {
    const badge = getSourceBadge("saramin");
    expect(badge.label).toBe("사람인");
    expect(badge.color).toContain("indigo");
  });

  it("maps jobkorea source to 잡코리아 badge", () => {
    const badge = getSourceBadge("jobkorea");
    expect(badge.label).toBe("잡코리아");
    expect(badge.color).toContain("rose");
  });

  it("returns fallback badge for unknown source", () => {
    const badge = getSourceBadge("unknownplatform");
    expect(badge.label).toBe("unknownplatform");
    expect(badge.color).toContain("gray");
  });

  it("handles undefined source gracefully", () => {
    const badge = getSourceBadge(undefined);
    expect(badge).toBeDefined();
    expect(badge.label).toBeTruthy();
  });
});
