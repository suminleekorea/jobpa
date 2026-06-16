import type { Express, Request, Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import crypto from "node:crypto";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  fetchGoogleProfile,
  isGoogleOAuthConfigured,
  refreshGoogleAccessToken,
  tokenExpiryFromNow,
} from "./_core/googleOAuth";
import { decryptSecret, encryptSecret } from "./_core/secret";
import { sdk } from "./_core/sdk";

const GMAIL_STATE_COOKIE = "jobpa_gmail_oauth_state";
const CAREER_MAIL_QUERY =
  '(interview OR application OR recruiter OR hiring OR offer OR rejection OR "thank you" OR "next steps") newer_than:180d';

function getCookie(req: Request, name: string) {
  return parseCookieHeader(req.headers.cookie || "")[name];
}

function setStateCookie(req: Request, res: Response, name: string, value: string) {
  res.cookie(name, value, {
    ...getSessionCookieOptions(req),
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });
}

function clearStateCookie(req: Request, res: Response, name: string) {
  res.clearCookie(name, {
    ...getSessionCookieOptions(req),
    sameSite: "lax",
    maxAge: -1,
  });
}

async function authenticate(req: Request, res: Response) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}

function encodeSubject(subject: string) {
  return /^[\x00-\x7F]*$/.test(subject)
    ? subject
    : `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function getHeader(headers: Array<{ name: string; value: string }> | undefined, name: string) {
  return headers?.find(header => header.name.toLowerCase() === name.toLowerCase())?.value || "";
}

async function getConnectedGmailAccount(userId: number) {
  const account = await db.getPrimaryEmailAccount(userId, "gmail");
  if (!account) return null;
  const accessToken = decryptSecret(account.accessToken);
  const refreshToken = decryptSecret(account.refreshToken);
  return { account, accessToken, refreshToken };
}

async function getValidAccessToken(userId: number) {
  const connected = await getConnectedGmailAccount(userId);
  if (!connected?.account || !connected.accessToken) {
    throw new Error("Gmail is not connected");
  }

  const expiresAt = connected.account.tokenExpiresAt?.getTime?.() ?? 0;
  if (expiresAt > Date.now() + 60_000) return connected.accessToken;

  if (!connected.refreshToken) return connected.accessToken;

  const refreshed = await refreshGoogleAccessToken(connected.refreshToken);
  await db.updateEmailAccountTokens(connected.account.id, {
    accessToken: encryptSecret(refreshed.access_token),
    refreshToken: refreshed.refresh_token ? encryptSecret(refreshed.refresh_token) : undefined,
    tokenExpiresAt: tokenExpiryFromNow(refreshed.expires_in),
    status: "connected",
  });
  return refreshed.access_token;
}

async function gmailFetch(accessToken: string, path: string, init?: RequestInit) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gmail API failed (${response.status}): ${errorText.slice(0, 160)}`);
  }

  return response.json();
}

export function registerGmailRoutes(app: Express) {
  app.get("/api/integrations/gmail/connect", async (req: Request, res: Response) => {
    if (!isGoogleOAuthConfigured()) {
      res.redirect("/dashboard/email?status=google_not_configured");
      return;
    }

    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.redirect("/login?authError=session_required");
      return;
    }

    const state = crypto.randomBytes(24).toString("hex");
    setStateCookie(req, res, GMAIL_STATE_COOKIE, state);
    res.redirect(buildGoogleAuthUrl(req, "gmail", state, user.email));
  });

  app.get("/api/integrations/gmail/callback", async (req: Request, res: Response) => {
    if (!isGoogleOAuthConfigured()) {
      res.redirect("/dashboard/email?status=google_not_configured");
      return;
    }

    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.redirect("/login?authError=session_required");
      return;
    }

    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const providerError = typeof req.query.error === "string" ? req.query.error : "";
    const expectedState = getCookie(req, GMAIL_STATE_COOKIE);
    clearStateCookie(req, res, GMAIL_STATE_COOKIE);

    if (providerError) {
      res.redirect(`/dashboard/email?status=${encodeURIComponent(providerError)}`);
      return;
    }
    if (!code) {
      res.redirect("/dashboard/email?status=missing_google_code");
      return;
    }
    if (!state || !expectedState || state !== expectedState) {
      res.redirect("/dashboard/email?status=invalid_google_state");
      return;
    }

    try {
      const token = await exchangeGoogleCode(req, "gmail", code);
      const profile = await fetchGoogleProfile(token.access_token);
      const email = (profile.email || user.email || "").toLowerCase();
      if (!email) {
        res.redirect("/dashboard/email?status=missing_email");
        return;
      }

      await db.saveEmailAccount({
        userId: user.id,
        provider: "gmail",
        email,
        scopes: token.scope,
        accessToken: encryptSecret(token.access_token),
        refreshToken: token.refresh_token ? encryptSecret(token.refresh_token) : undefined,
        tokenExpiresAt: tokenExpiryFromNow(token.expires_in),
        status: "connected",
      });

      res.redirect("/dashboard/email?status=connected");
    } catch (error) {
      console.error("[Gmail] OAuth callback failed:", error);
      res.redirect("/dashboard/email?status=gmail_connect_failed");
    }
  });

  app.get("/api/integrations/gmail/status", async (req: Request, res: Response) => {
    const user = await authenticate(req, res);
    if (!user) return;

    const account = await db.getPrimaryEmailAccount(user.id, "gmail").catch(() => null);
    res.json({
      connected: Boolean(account),
      email: account?.email ?? null,
      scopes: account?.scopes ?? null,
      lastSyncedAt: account?.lastSyncedAt ?? null,
    });
  });

  app.post("/api/email/send", async (req: Request, res: Response) => {
    const user = await authenticate(req, res);
    if (!user) return;

    const { to, subject, body } = req.body ?? {};
    if (!to || !subject || !body) {
      res.status(400).json({ error: "to, subject, and body are required" });
      return;
    }

    try {
      const token = await getValidAccessToken(user.id);
      const message = [
        `To: ${to}`,
        `Subject: ${encodeSubject(subject)}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "MIME-Version: 1.0",
        "",
        body,
      ].join("\r\n");

      const result = await gmailFetch(token, "/users/me/messages/send", {
        method: "POST",
        body: JSON.stringify({ raw: toBase64Url(message) }),
      });

      res.json({ success: true, id: result.id, threadId: result.threadId });
    } catch (error) {
      console.error("[Gmail] Send failed:", error);
      res.status(502).json({
        error: "Email send failed. Reconnect Gmail and try again.",
      });
    }
  });

  app.post("/api/email/sync", async (req: Request, res: Response) => {
    const user = await authenticate(req, res);
    if (!user) return;

    const query = typeof req.body?.query === "string" && req.body.query.trim()
      ? req.body.query.trim()
      : CAREER_MAIL_QUERY;
    const maxResults = Math.min(Number(req.body?.maxResults) || 10, 25);

    try {
      const connected = await getConnectedGmailAccount(user.id);
      if (!connected?.account) {
        res.status(409).json({ error: "Gmail is not connected" });
        return;
      }

      const token = await getValidAccessToken(user.id);
      const list = await gmailFetch(
        token,
        `/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
      ) as { messages?: Array<{ id: string; threadId: string }> };

      const savedMessages = [];
      for (const item of list.messages || []) {
        const detail = await gmailFetch(
          token,
          `/users/me/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`
        ) as any;
        const headers = detail.payload?.headers as Array<{ name: string; value: string }> | undefined;
        const receivedAtText = getHeader(headers, "Date");
        const receivedAt = receivedAtText ? new Date(receivedAtText) : null;
        const row = {
          userId: user.id,
          provider: "gmail",
          providerMessageId: detail.id,
          threadId: detail.threadId,
          fromEmail: getHeader(headers, "From"),
          toEmail: getHeader(headers, "To"),
          subject: getHeader(headers, "Subject"),
          snippet: detail.snippet,
          receivedAt: receivedAt && !Number.isNaN(receivedAt.getTime()) ? receivedAt : null,
          rawMetadata: {
            labelIds: detail.labelIds,
            internalDate: detail.internalDate,
          },
        };
        await db.saveEmailMessage(row);
        savedMessages.push(row);
      }

      await db.markEmailAccountSynced(connected.account.id);
      res.json({ success: true, query, count: savedMessages.length, messages: savedMessages });
    } catch (error) {
      console.error("[Gmail] Sync failed:", error);
      res.status(502).json({
        error: "Email sync failed. Reconnect Gmail and try again.",
      });
    }
  });

  app.get("/api/email/messages", async (req: Request, res: Response) => {
    const user = await authenticate(req, res);
    if (!user) return;

    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const messages = await db.getEmailMessages(user.id, limit).catch(() => []);
    res.json({ messages });
  });
}
