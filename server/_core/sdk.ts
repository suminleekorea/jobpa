/**
 * Auth SDK — Google OAuth 기반 자체 인증
 * Manus OAuth 서버 의존성 제거, jose JWT 세션 유지
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type SessionPayload = {
  openId: string; // Google sub (고유 ID)
  email: string;
  name: string;
};

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;

// ─── Google OAuth helpers ─────────────────────────────────────────────────────

export function getGoogleAuthUrl(redirectUri: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", ENV.googleClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeCodeForUserInfo(
  code: string,
  redirectUri: string
): Promise<{ sub: string; email: string; name: string; picture?: string }> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text().catch(() => "");
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${err}`);
  }
  const tokens = (await tokenRes.json()) as { access_token: string };

  const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!infoRes.ok) {
    throw new Error(`Google userinfo failed: ${infoRes.status}`);
  }
  return infoRes.json() as Promise<{
    sub: string;
    email: string;
    name: string;
    picture?: string;
  }>;
}

// ─── JWT Session ──────────────────────────────────────────────────────────────

class SDKServer {
  private getSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }

  async createSessionToken(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

    return new SignJWT({
      openId: payload.openId,
      email: payload.email,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.getSecret());
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSecret(), {
        algorithms: ["HS256"],
      });
      const { openId, email, name } = payload as Record<string, unknown>;
      if (!isNonEmptyString(openId) || !isNonEmptyString(email)) return null;
      return { openId, email, name: isNonEmptyString(name) ? name : "" };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) throw ForbiddenError("Invalid session cookie");

    let user = await db.getUserByOpenId(session.openId);
    if (!user) {
      await db.upsertUser({
        openId: session.openId,
        email: session.email,
        name: session.name,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });
      user = await db.getUserByOpenId(session.openId);
    }

    if (!user) throw ForbiddenError("User not found");

    await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
    return user;
  }
}

export const sdk = new SDKServer();
