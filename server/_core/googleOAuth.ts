import type { Request } from "express";
import { ENV } from "./env";

export type GoogleOAuthMode = "login" | "gmail";

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const LOGIN_SCOPES = ["openid", "email", "profile"];
const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export function isGoogleOAuthConfigured() {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret);
}

export function getRequestBaseUrl(req: Request) {
  if (ENV.appBaseUrl) return ENV.appBaseUrl.replace(/\/$/, "");
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader)
    ? protoHeader[0]
    : protoHeader?.split(",")[0]?.trim();
  const protocol = proto || req.protocol || "http";
  return `${protocol}://${req.get("host")}`;
}

export function getGoogleRedirectUri(req: Request, mode: GoogleOAuthMode) {
  const fallbackPath =
    mode === "gmail"
      ? "/api/integrations/gmail/callback"
      : "/api/auth/google/callback";

  if (mode === "gmail" && ENV.googleGmailRedirectUri) return ENV.googleGmailRedirectUri;
  if (mode === "login" && ENV.googleRedirectUri) return ENV.googleRedirectUri;
  return `${getRequestBaseUrl(req)}${fallbackPath}`;
}

export function buildGoogleAuthUrl(
  req: Request,
  mode: GoogleOAuthMode,
  state: string,
  loginHint?: string | null
) {
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: getGoogleRedirectUri(req, mode),
    response_type: "code",
    scope: (mode === "gmail" ? GMAIL_SCOPES : LOGIN_SCOPES).join(" "),
    state,
    include_granted_scopes: "true",
  });

  if (mode === "gmail") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }
  if (loginHint) params.set("login_hint", loginHint);

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  req: Request,
  mode: GoogleOAuthMode,
  code: string
): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getGoogleRedirectUri(req, mode),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Google token exchange failed (${response.status}): ${errorText.slice(0, 160)}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Google token refresh failed (${response.status}): ${errorText.slice(0, 160)}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export async function fetchGoogleProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Google profile fetch failed (${response.status})`);
  }

  return response.json() as Promise<GoogleProfile>;
}

export function tokenExpiryFromNow(expiresInSeconds?: number) {
  if (!expiresInSeconds) return null;
  return new Date(Date.now() + Math.max(expiresInSeconds - 60, 60) * 1000);
}
