CREATE TABLE IF NOT EXISTS `oauth_accounts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `provider` varchar(32) NOT NULL,
  `provider_user_id` varchar(255) NOT NULL,
  `email` varchar(320),
  `scopes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `oauth_accounts_id` PRIMARY KEY(`id`),
  CONSTRAINT `oauth_accounts_provider_user_unique` UNIQUE(`provider`, `provider_user_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `email_accounts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `provider` varchar(32) NOT NULL DEFAULT 'gmail',
  `email` varchar(320) NOT NULL,
  `scopes` text,
  `access_token` text,
  `refresh_token` text,
  `token_expires_at` timestamp,
  `status` varchar(32) NOT NULL DEFAULT 'connected',
  `last_synced_at` timestamp,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `email_accounts_id` PRIMARY KEY(`id`),
  CONSTRAINT `email_accounts_user_provider_email_unique` UNIQUE(`user_id`, `provider`, `email`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `email_messages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `provider` varchar(32) NOT NULL DEFAULT 'gmail',
  `provider_message_id` varchar(255) NOT NULL,
  `thread_id` varchar(255),
  `from_email` text,
  `to_email` text,
  `subject` text,
  `snippet` text,
  `received_at` timestamp,
  `raw_metadata` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `email_messages_id` PRIMARY KEY(`id`),
  CONSTRAINT `email_messages_user_provider_message_unique` UNIQUE(`user_id`, `provider`, `provider_message_id`)
);
