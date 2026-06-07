-- Migration: Manus → Self-hosted auth
-- Run this on your TiDB Cloud cluster once before first deploy.

-- 1. Make openId nullable (was NOT NULL in Manus era)
ALTER TABLE users MODIFY COLUMN openId varchar(64) NULL;

-- 2. Add unique constraint on email if not already present
ALTER TABLE users MODIFY COLUMN email varchar(320) UNIQUE;

-- 3. Add passwordHash column for email/password auth
ALTER TABLE users ADD COLUMN passwordHash varchar(255) NULL AFTER email;
