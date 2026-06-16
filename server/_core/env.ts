const DEFAULT_ADMIN_EMAILS = ["leewaterfolk@gmail.com"];

function parseAdminEmails(value?: string) {
  return (value ?? DEFAULT_ADMIN_EMAILS.join(","))
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

export const ENV = {
  appBaseUrl: process.env.APP_BASE_URL ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  adminEmails: parseAdminEmails(process.env.ADMIN_EMAILS),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
  googleGmailRedirectUri: process.env.GOOGLE_GMAIL_REDIRECT_URI ?? "",
  llmBaseUrl: process.env.LLM_BASE_URL ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "gemini-2.5-flash",
};

export function isAdminEmail(email?: string | null) {
  return Boolean(email && ENV.adminEmails.includes(email.trim().toLowerCase()));
}
