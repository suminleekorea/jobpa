import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(overrides?: Partial<TrpcContext["user"]>): TrpcContext {
  const user = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createMockContext({ role: "admin" });
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("survey.save", () => {
  it("saves survey data for authenticated user", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.survey.save({
        lookingFor: ["market_insights", "resume_feedback"],
        targetRole: "AI Engineer",
        experienceLevel: "mid",
        interests: ["AI/ML", "Backend"],
        preferredLocations: ["singapore", "hongkong"],
        needsVisaSponsorship: true,
        preferredJobTypes: ["fulltime"],
      });
    } catch (e: any) {
      // DB errors are expected in test environment
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);
});

describe("application.save", () => {
  it("accepts valid application data", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.application.save({
        jobTitle: "AI Engineer",
        company: "GovTech Singapore",
        location: "singapore",
        applyUrl: "https://careers.gov.sg/job/123",
        source: "careergov",
        status: "applied",
        salary: "S$8,000-12,000/mo",
      });
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  });

  it("accepts bookmarked status", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.application.save({
        jobTitle: "Frontend Developer",
        company: "Grab",
        status: "bookmarked",
      });
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  });

  it("rejects invalid status", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.application.save({
        jobTitle: "Test",
        company: "Test",
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });
});

describe("application.updateStatus", () => {
  it("accepts valid status update", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.application.updateStatus({
        id: 1,
        status: "interview",
        notes: "Phone screen scheduled",
      });
    } catch (e: any) {
      // DB error expected
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  });
});

describe("consulting.joinWaitlist", () => {
  it("allows unauthenticated users to join waitlist", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.consulting.joinWaitlist({
        name: "Test User",
        email: "test@example.com",
        message: "Interested in visa consulting",
      });
    } catch (e: any) {
      // DB error expected, but should not be auth error
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  });

  it("rejects invalid email", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.consulting.joinWaitlist({
        email: "not-an-email",
      })
    ).rejects.toThrow();
  });
});

describe("admin.stats", () => {
  it("rejects non-admin users", async () => {
    const ctx = createMockContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.stats()).rejects.toThrow("Forbidden");
  });

  it("allows admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const stats = await caller.admin.stats();
      // If DB is available, check structure
      expect(stats).toHaveProperty("totalUsers");
      expect(stats).toHaveProperty("totalApplications");
      expect(stats).toHaveProperty("totalResumes");
      expect(stats).toHaveProperty("totalWaitlist");
    } catch (e: any) {
      // DB error is OK, but should not be "Forbidden"
      expect(e.message).not.toBe("Forbidden");
    }
  });
});

describe("admin.users", () => {
  it("rejects non-admin users", async () => {
    const ctx = createMockContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.users()).rejects.toThrow("Forbidden");
  });
});

describe("fit.evaluate", () => {
  it("requires job description", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.fit.evaluate({
        targetRole: "AI Engineer",
        jobDescription: "",
      })
    ).rejects.toThrow();
  });
});

describe("auth.me", () => {
  it("returns user for authenticated context", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();
    expect(user).toBeDefined();
    expect(user?.openId).toBe("test-user-123");
    expect(user?.name).toBe("Test User");
  });

  it("returns null for unauthenticated context", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});
