ALTER TABLE `consultants` ADD `photoUrl` text;--> statement-breakpoint
ALTER TABLE `consultants` ADD `industry` varchar(128);--> statement-breakpoint
ALTER TABLE `consultants` ADD `industries` json;--> statement-breakpoint
ALTER TABLE `consultants` ADD `careerHistory` json;--> statement-breakpoint
ALTER TABLE `consultants` ADD `sessionTypes` json;