CREATE TABLE `content_ideas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`config_id` integer,
	`topic` text NOT NULL,
	`language` text DEFAULT 'es' NOT NULL,
	`ideas` text NOT NULL,
	`status` text DEFAULT 'generating' NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`config_id`) REFERENCES `ai_configurations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `seo_structures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`config_id` integer,
	`keyword` text NOT NULL,
	`language` text DEFAULT 'es' NOT NULL,
	`structure` text NOT NULL,
	`html_content` text NOT NULL,
	`status` text DEFAULT 'generating' NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`config_id`) REFERENCES `ai_configurations`(`id`) ON UPDATE no action ON DELETE no action
);
