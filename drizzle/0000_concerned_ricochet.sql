CREATE TABLE `survey_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`endpoint` text NOT NULL,
	`ready` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `survey_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`questions` text NOT NULL,
	`created_at` text NOT NULL
);
