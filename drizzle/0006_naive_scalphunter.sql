CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text NOT NULL,
	`displayName` varchar(128),
	`targetRole` varchar(128),
	`targetMarket` varchar(64),
	`isApproved` boolean DEFAULT false,
	`isAnonymous` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
