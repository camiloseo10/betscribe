CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`config_id` integer,
	`platform_name` text NOT NULL,
	`platform_type` text NOT NULL,
	`market` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`seo_title` text DEFAULT '' NOT NULL,
	`meta_description` text DEFAULT '' NOT NULL,
	`word_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'generating' NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`config_id`) REFERENCES `ai_configurations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`token` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `seo_structures` ALTER COLUMN "html_content" TO "html_content" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `seo_structures` ADD `website_url` text DEFAULT '';