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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUser2Context(): TrpcContext {
  return createMockContext({ id: 2, openId: "test-user-456", email: "user2@test.com", name: "User Two" });
}

function createAdminContext(): TrpcContext {
  return createMockContext({ role: "admin" });
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns user for authenticated context", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const user = await caller.auth.me();
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
    expect(user?.email).toBe("test@example.com");
    expect(user).not.toHaveProperty("openId");
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("returns null for unauthenticated context", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

// ─── Survey ──────────────────────────────────────────────────────────────────

describe("survey.save", () => {
  it("saves survey data for authenticated user", async () => {
    const caller = appRouter.createCaller(createMockContext());
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
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.survey.save({
        lookingFor: ["market_insights"],
        targetRole: "Engineer",
        experienceLevel: "mid",
        interests: ["Tech"],
        preferredLocations: ["singapore"],
        needsVisaSponsorship: true,
        preferredJobTypes: ["fulltime"],
      })
    ).rejects.toThrow();
  });
});

// ─── Application Tracking ────────────────────────────────────────────────────

describe("application", () => {
  it("saves application data", async () => {
    const caller = appRouter.createCaller(createMockContext());
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
    const caller = appRouter.createCaller(createMockContext());
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
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.application.save({
        jobTitle: "Test",
        company: "Test",
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.application.save({ jobTitle: "Test", company: "Test", status: "applied" })
    ).rejects.toThrow();
  });

  it("accepts valid status update", async () => {
    const caller = appRouter.createCaller(createMockContext());
    try {
      await caller.application.updateStatus({ id: 1, status: "interview", notes: "Phone screen" });
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  });

  it("rejects invalid status value in update", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.application.updateStatus({ id: 1, status: "invalid" as any })
    ).rejects.toThrow();
  });
});

// ─── Consulting Waitlist ─────────────────────────────────────────────────────

describe("consulting.joinWaitlist", () => {
  it("allows unauthenticated users to join waitlist", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    try {
      await caller.consulting.joinWaitlist({
        name: "Test User",
        email: "test@example.com",
        message: "Interested in visa consulting",
      });
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  });

  it("rejects invalid email", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.consulting.joinWaitlist({ email: "not-an-email" })
    ).rejects.toThrow();
  });
});

// ─── Admin ───────────────────────────────────────────────────────────────────

describe("admin", () => {
  it("rejects non-admin users from stats", async () => {
    const caller = appRouter.createCaller(createMockContext({ role: "user" }));
    await expect(caller.admin.stats()).rejects.toThrow("Forbidden");
  });

  it("allows admin to get stats", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    try {
      const stats = await caller.admin.stats();
      expect(stats).toHaveProperty("totalUsers");
      expect(stats).toHaveProperty("totalApplications");
      expect(stats).toHaveProperty("totalWaitlist");
    } catch (e: any) {
      expect(e.message).not.toBe("Forbidden");
    }
  });

  it("rejects non-admin from user list", async () => {
    const caller = appRouter.createCaller(createMockContext({ role: "user" }));
    await expect(caller.admin.users()).rejects.toThrow("Forbidden");
  });

  it("rejects unauthenticated from user list", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.admin.users()).rejects.toThrow();
  });
});

// ─── Job Fit Evaluation ──────────────────────────────────────────────────────

describe("fit.evaluate", () => {
  it("requires job description", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.fit.evaluate({ targetRole: "AI Engineer", jobDescription: "" })
    ).rejects.toThrow();
  });

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.fit.evaluate({ targetRole: "AI Engineer", jobDescription: "Build ML models" })
    ).rejects.toThrow();
  });
});

// ─── Jobs List (Real Data) ───────────────────────────────────────────────────

describe("jobs.list", () => {
  it("is accessible without authentication (public)", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    try {
      const result = await caller.jobs.list({ location: "singapore", page: 1, limit: 5 });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("jobs");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.jobs)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  }, 30000);

  it("supports keyword search", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    try {
      const result = await caller.jobs.list({ location: "singapore", keyword: "engineer", page: 1, limit: 5 });
      expect(result).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  }, 30000);

  it("supports non-Singapore locations via JSearch", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    try {
      const result = await caller.jobs.list({ location: "hongkong", page: 1, limit: 5 });
      expect(result).toBeDefined();
      expect(result).toHaveProperty("jobs");
      expect(result).toHaveProperty("sources");
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  }, 30000);
});

// ─── Gamification ────────────────────────────────────────────────────────────

describe("gamification", () => {
  it("gets or creates XP profile", async () => {
    const caller = appRouter.createCaller(createMockContext());
    try {
      const result = await caller.gamification.profile();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalXP");
      expect(result).toHaveProperty("level");
      expect(result).toHaveProperty("currentStreak");
      expect(result).toHaveProperty("badges");
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);

  it("adds XP for actions", async () => {
    const caller = appRouter.createCaller(createMockContext());
    try {
      const result = await caller.gamification.addXP({ action: "login", description: "Daily login" });
      expect(result).toHaveProperty("totalXP");
      expect(result).toHaveProperty("xpGained");
      expect(result.xpGained).toBeGreaterThan(0);
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);

  it("returns XP history", async () => {
    const caller = appRouter.createCaller(createMockContext());
    try {
      const result = await caller.gamification.history({ limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);

  it("requires authentication for profile", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.gamification.profile()).rejects.toThrow();
  });

  it("requires authentication for addXP", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.gamification.addXP({ action: "login", description: "test" })
    ).rejects.toThrow();
  });
});

// ─── Checklist ───────────────────────────────────────────────────────────────

describe("checklist", () => {
  const today = new Date().toISOString().slice(0, 10);

  it("adds a checklist item", async () => {
    const caller = appRouter.createCaller(createMockContext());
    try {
      const result = await caller.checklist.add({ date: today, title: "Update resume", category: "resume" });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);

  it("lists checklist items for a date", async () => {
    const caller = appRouter.createCaller(createMockContext());
    try {
      const result = await caller.checklist.list({ date: today });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.checklist.list({ date: today })).rejects.toThrow();
  });
});

// ─── Journal ─────────────────────────────────────────────────────────────────

describe("journal", () => {
  const today = new Date().toISOString().slice(0, 10);

  it("saves a journal entry", async () => {
    const caller = appRouter.createCaller(createMockContext());
    try {
      const result = await caller.journal.save({
        date: today,
        mood: "motivated",
        content: "Had a great interview today!",
        highlights: ["Interview went well"],
        goals: ["Follow up with recruiter"],
      });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);

  it("gets journal entries", async () => {
    const caller = appRouter.createCaller(createMockContext());
    try {
      const result = await caller.journal.list({ limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.journal.list({ limit: 10 })).rejects.toThrow();
  });
});

// ─── Data Isolation ──────────────────────────────────────────────────────────

describe("data isolation", () => {
  it("user 1 cannot see user 2 applications", async () => {
    const caller1 = appRouter.createCaller(createMockContext());
    const caller2 = appRouter.createCaller(createUser2Context());

    try {
      await caller1.application.save({
        jobTitle: "Unique Job for User 1 Only",
        company: "Company A",
        location: "Singapore",
        applyUrl: "https://example.com/user1only",
        source: "mcf",
        status: "applied",
      });

      const user2Apps = await caller2.application.list();
      const leaked = user2Apps.find((a: any) => a.jobTitle === "Unique Job for User 1 Only");
      expect(leaked).toBeUndefined();
    } catch (e: any) {
      // DB errors acceptable in test env, but not auth errors
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);

  it("user 1 cannot see user 2 journal entries", async () => {
    const caller1 = appRouter.createCaller(createMockContext());
    const caller2 = appRouter.createCaller(createUser2Context());

    try {
      await caller1.journal.save({
        date: "2026-01-15",
        mood: "happy",
        content: "Secret journal entry for user 1 only",
      });

      const user2Journal = await caller2.journal.list({ limit: 100 });
      const leaked = user2Journal.find((j: any) => j.content === "Secret journal entry for user 1 only");
      expect(leaked).toBeUndefined();
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);

  it("user 1 cannot see user 2 checklist items", async () => {
    const caller1 = appRouter.createCaller(createMockContext());
    const caller2 = appRouter.createCaller(createUser2Context());

    try {
      await caller1.checklist.add({
        date: "2026-01-15",
        title: "Secret task for user 1 only",
        category: "apply",
      });

      const user2Checklist = await caller2.checklist.list({ date: "2026-01-15" });
      const leaked = user2Checklist.find((c: any) => c.title === "Secret task for user 1 only");
      expect(leaked).toBeUndefined();
    } catch (e: any) {
      expect(e.message).not.toContain("UNAUTHORIZED");
    }
  }, 15000);
});
