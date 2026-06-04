# JobPA — Environment Variables Setup

Copy and rename this as `.env` in the project root for local development.

```bash
# ─── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=mysql://user:password@host:4000/jobpa?ssl={"rejectUnauthorized":true}

# ─── Auth ────────────────────────────────────────────────────────────────────
JWT_SECRET=your-jwt-secret-here
VITE_APP_ID=your-manus-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth

# ─── Manus Forge API (LLM + Vision + Storage) ────────────────────────────────
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key

# ─── App Info ────────────────────────────────────────────────────────────────
VITE_APP_TITLE=JobPA
VITE_APP_LOGO=/jobpa-logo.png
OWNER_OPEN_ID=your-open-id
OWNER_NAME=your-name

# ─── Analytics (optional) ────────────────────────────────────────────────────
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

## Where to get these values

| Variable | Source |
|---|---|
| `DATABASE_URL` | TiDB Cloud / local MySQL |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `VITE_APP_ID` | Manus Developer Portal |
| `BUILT_IN_FORGE_API_KEY` | Manus Platform → Project Settings → Secrets |
| `VITE_FRONTEND_FORGE_API_KEY` | Same as above (frontend variant) |
| `OWNER_OPEN_ID` | Your Manus user ID |

## Local Development Without Manus Platform

If you want to run JobPA outside of Manus:

1. **LLM**: Replace `BUILT_IN_FORGE_API_KEY` with your own Anthropic or Google API key and update `server/_core/chat.ts` to use the appropriate provider
2. **OAuth**: Replace Manus OAuth with GitHub/Google OAuth or a mock auth middleware
3. **Database**: Use a local MySQL instance (`mysql://root:@localhost:3306/jobpa`)
4. **Storage**: Replace S3 helpers in `server/storage.ts` with local file storage

## Running Locally

```bash
# 1. Clone
git clone https://github.com/suminleekorea/jobpa
cd jobpa

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp ENV_SETUP.md .env   # then edit .env with your values

# 4. Apply database migrations
# Run SQL files in drizzle/migrations/ against your MySQL instance

# 5. Start dev server
pnpm dev
# → http://localhost:3000
```
