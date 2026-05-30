export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Google OAuth — 서버의 /api/auth/login 으로 보내면 서버가 Google로 리다이렉트
export const getLoginUrl = () => "/api/auth/login";
