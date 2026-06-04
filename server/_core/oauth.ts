<<<<<<< HEAD
=======
/**
 * Google OAuth 콜백 라우터
 * GET /api/oauth/callback?code=...  — Google이 리다이렉트하는 엔드포인트
 * GET /api/auth/login               — 구글 로그인 URL로 리다이렉트
 */
>>>>>>> user_github/main
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
<<<<<<< HEAD
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
=======
import { exchangeCodeForUserInfo, getGoogleAuthUrl, sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const v = req.query[key];
  return typeof v === "string" ? v : undefined;
}

function getRedirectUri(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? (req.secure ? "https" : "http");
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:3000";
  return `${proto}://${host}/api/oauth/callback`;
}

export function registerOAuthRoutes(app: Express) {
  // 1. 로그인 시작 — Google 인증 URL로 리다이렉트
  app.get("/api/auth/login", (req: Request, res: Response) => {
    const redirectUri = getRedirectUri(req);
    const url = getGoogleAuthUrl(redirectUri);
    res.redirect(302, url);
  });

  // 2. Google 콜백 — code를 받아 세션 쿠키 발급
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    if (!code) {
      res.status(400).json({ error: "code is required" });
>>>>>>> user_github/main
      return;
    }

    try {
<<<<<<< HEAD
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
=======
      const redirectUri = getRedirectUri(req);
      const userInfo = await exchangeCodeForUserInfo(code, redirectUri);

      await db.upsertUser({
        openId: userInfo.sub,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken({
        openId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name || "",
      }, { expiresInMs: ONE_YEAR_MS });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Google callback failed", error);
      res.status(500).send(`
        <h2>로그인 실패</h2>
        <pre>${String(error)}</pre>
        <a href="/">홈으로</a>
      `);
    }
  });

  // 3. 로그아웃
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ ok: true });
  });
>>>>>>> user_github/main
}
