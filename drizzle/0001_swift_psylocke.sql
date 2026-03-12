CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jobTitle` varchar(512) NOT NULL,
	`company` varchar(255) NOT NULL,
	`location` varchar(128),
	`applyUrl` text,
	`source` varchar(64),
	`status` enum('applied','interview','offer','rejected','withdrawn','bookmarked') NOT NULL DEFAULT 'applied',
	`notes` text,
	`salary` varchar(128),
	`visaType` varchar(64),
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultingWaitlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255),
	`email` varchar(320) NOT NULL,
	`interests` json,
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultingWaitlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetRoles` json,
	`targetLocations` json,
	`frequency` varchar(32) DEFAULT 'weekly',
	`isActive` boolean DEFAULT true,
	`email` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fitEvaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetRole` varchar(255),
	`jobDescription` text,
	`fitScore` int,
	`result` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fitEvaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetJobType` varchar(64),
	`targetRole` varchar(255),
	`targetCompany` varchar(255),
	`deadlineMonths` int DEFAULT 3,
	`weeklyApplicationTarget` int DEFAULT 5,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(512),
	`content` text,
	`reportType` varchar(64) DEFAULT 'daily',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255),
	`fileUrl` text,
	`fileKey` text,
	`analysisResult` json,
	`overallScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lookingFor` json,
	`targetRole` varchar(255),
	`experienceLevel` varchar(64),
	`interests` json,
	`targetCompanies` text,
	`preferredLocations` json,
	`salaryExpectation` varchar(128),
	`needsVisaSponsorship` boolean DEFAULT false,
	`preferredJobTypes` json,
	`howHeardAbout` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surveys_id` PRIMARY KEY(`id`)
);
