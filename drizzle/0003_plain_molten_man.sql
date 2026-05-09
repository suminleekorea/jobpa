CREATE TABLE `consultants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`title` varchar(255),
	`bio` text,
	`specialties` json,
	`targetRegions` json,
	`languages` json,
	`yearsExperience` int DEFAULT 0,
	`sessionPriceCredits` int DEFAULT 10,
	`avatarUrl` text,
	`linkedinUrl` text,
	`isApproved` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`totalSessions` int DEFAULT 0,
	`avgRating` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultants_id` PRIMARY KEY(`id`),
	CONSTRAINT `consultants_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `consultingApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`title` varchar(255),
	`bio` text,
	`specialties` json,
	`targetRegions` json,
	`languages` json,
	`yearsExperience` int DEFAULT 0,
	`linkedinUrl` text,
	`motivation` text,
	`status` varchar(32) DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultingApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultingSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`consultantId` int NOT NULL,
	`clientUserId` int NOT NULL,
	`status` varchar(32) DEFAULT 'pending',
	`scheduledAt` bigint,
	`durationMinutes` int DEFAULT 60,
	`creditsCharged` int NOT NULL,
	`topic` varchar(512),
	`notes` text,
	`meetingUrl` text,
	`rating` int,
	`review` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultingSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`description` varchar(512),
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCredits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`totalEarned` int NOT NULL DEFAULT 0,
	`totalSpent` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCredits_id` PRIMARY KEY(`id`),
	CONSTRAINT `userCredits_userId_unique` UNIQUE(`userId`)
);
