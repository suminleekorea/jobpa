import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { notifyOwner } from "./notification";

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function createPasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(attempt, "hex"));
}

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    try {
      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }
      const passwordHash = createPasswordHash(password);
      const userId = await db.createUserWithPassword({ email, passwordHash, name });
      const token = await sdk.signSession({ userId, email, name: name || "" });
      res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Register failed:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Forgot password — generate reset token and send email notification
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    const { email } = req.body ?? {};
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    try {
      const user = await db.getUserByEmail(email);
      // Always return success to prevent email enumeration
      if (!user || !user.passwordHash) {
        res.json({ success: true, message: "If this email exists, a reset link has been sent." });
        return;
      }
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
      await db.createPasswordResetToken(user.id, token, expiresAt);

      // Build reset URL (works for both deployed and local)
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

      // Notify owner with the reset link (since we don't have SMTP)
      await notifyOwner({
        title: `[JobPA] Password Reset Request`,
        content: `User ${user.email} requested a password reset.\n\nReset link (expires in 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this message.`,
      }).catch(() => {}); // Don't fail if notification fails

      // Also return the token in dev mode for testing
      const isDev = process.env.NODE_ENV !== "production";
      res.json({
        success: true,
        message: "If this email exists, a reset link has been sent.",
        ...(isDev ? { resetUrl, token } : {}),
      });
    } catch (error) {
      console.error("[Auth] Forgot password failed:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  // Reset password — verify token and set new password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    const { token, password } = req.body ?? {};
    if (!token || !password) {
      res.status(400).json({ error: "Token and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    try {
      const resetToken = await db.getPasswordResetToken(token);
      if (!resetToken) {
        res.status(400).json({ error: "Invalid or expired reset link" });
        return;
      }
      if (resetToken.usedAt) {
        res.status(400).json({ error: "This reset link has already been used" });
        return;
      }
      if (new Date() > resetToken.expiresAt) {
        res.status(400).json({ error: "This reset link has expired. Please request a new one." });
        return;
      }
      const passwordHash = createPasswordHash(password);
      await db.updateUserPassword(resetToken.userId, passwordHash);
      await db.markPasswordResetTokenUsed(token);

      // Auto-login after reset
      const user = await db.getUserById(resetToken.userId);
      if (user) {
        const sessionToken = await sdk.signSession({ userId: user.id, email: user.email!, name: user.name || "" });
        res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      }
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("[Auth] Reset password failed:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Verify reset token (for frontend to check before showing form)
  app.get("/api/auth/verify-reset-token", async (req: Request, res: Response) => {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      res.status(400).json({ valid: false, error: "Token is required" });
      return;
    }
    try {
      const resetToken = await db.getPasswordResetToken(token);
      if (!resetToken || resetToken.usedAt || new Date() > resetToken.expiresAt) {
        res.json({ valid: false });
        return;
      }
      res.json({ valid: true });
    } catch {
      res.json({ valid: false });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    try {
      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const token = await sdk.signSession({ userId: user.id, email: user.email!, name: user.name || "" });
      res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}
