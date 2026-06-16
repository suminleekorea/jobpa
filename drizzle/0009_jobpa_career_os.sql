CREATE TABLE IF NOT EXISTS `career_profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `interests` json,
  `target_countries` json,
  `target_role` varchar(255),
  `experience_level` varchar(64),
  `salary_range` varchar(128),
  `visa_status` varchar(128),
  `preferred_language` varchar(64),
  `languages` json,
  `market` varchar(128),
  `profile_summary` text,
  `agent_state` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `career_profiles_id` PRIMARY KEY(`id`),
  CONSTRAINT `career_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` varchar(160) NOT NULL,
  `title` varchar(512) NOT NULL,
  `company` varchar(255) NOT NULL,
  `location` varchar(128),
  `salary` varchar(128),
  `source` varchar(64),
  `apply_url` text,
  `visa` boolean DEFAULT false,
  `type` varchar(64),
  `experience` varchar(64),
  `industry` varchar(128),
  `posted` int DEFAULT 0,
  `remote` boolean DEFAULT false,
  `description` text,
  `closing_date` varchar(128),
  `skills` json,
  `raw` json,
  `fetched_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `saved_jobs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `job_id` varchar(160),
  `status` varchar(32) NOT NULL DEFAULT 'saved',
  `notes` text,
  `snapshot` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `saved_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `resume_analyses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `resume_id` int,
  `source` varchar(32) NOT NULL DEFAULT 'upload',
  `file_name` varchar(255),
  `resume_text` text,
  `target_role` varchar(255),
  `target_market` varchar(64),
  `status` enum('pending','success','partial','failed') NOT NULL DEFAULT 'pending',
  `parse_method` varchar(64),
  `parse_warning` text,
  `error_message` text,
  `overall_score` int,
  `summary` text,
  `strengths` json,
  `improvements` json,
  `keywords` json,
  `raw_result` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `resume_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `job_fit_evaluations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `job_id` varchar(160),
  `target_role` varchar(255),
  `job_title` varchar(512),
  `company` varchar(255),
  `job_description` text,
  `fit_score` int,
  `status` varchar(32) DEFAULT 'success',
  `result` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `job_fit_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `interview_preps` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `application_id` int,
  `job_title` varchar(512),
  `company` varchar(255),
  `stage` varchar(64) DEFAULT 'interview',
  `prep` json,
  `follow_up_email` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `interview_preps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `agent_tasks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int,
  `agent` varchar(64) NOT NULL,
  `task_type` varchar(128),
  `status` varchar(32) NOT NULL DEFAULT 'pending',
  `input` json,
  `output` json,
  `error_message` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `agent_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `api_health_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `service` varchar(128) NOT NULL,
  `status` varchar(32) NOT NULL,
  `message` text,
  `response_ms` int,
  `fallback_used` boolean DEFAULT false,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `api_health_logs_id` PRIMARY KEY(`id`)
);
