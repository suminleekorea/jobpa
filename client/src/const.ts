export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

<<<<<<< HEAD
// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
=======
// Google OAuth — 서버의 /api/auth/login 으로 보내면 서버가 Google로 리다이렉트
export const getLoginUrl = () => "/api/auth/login";
>>>>>>> user_github/main
