CREATE TABLE `dailyChecklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`title` varchar(512) NOT NULL,
	`isAIGenerated` boolean DEFAULT false,
	`isCompleted` boolean DEFAULT false,
	`category` varchar(64),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyChecklist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`mood` varchar(32),
	`content` text,
	`highlights` json,
	`goals` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userXP` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXP` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActiveDate` varchar(10),
	`badges` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userXP_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `xpEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`xpAmount` int NOT NULL,
	`description` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xpEvents_id` PRIMARY KEY(`id`)
);
