CREATE TABLE `ai_configurations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`business_name` text NOT NULL,
	`business_type` text NOT NULL,
	`location` text NOT NULL,
	`expertise` text NOT NULL,
	`target_audience` text NOT NULL,
	`main_service` text NOT NULL,
	`brand_personality` text NOT NULL,
	`unique_value` text NOT NULL,
	`tone` text NOT NULL,
	`desired_action` text NOT NULL,
	`word_count` integer DEFAULT 3000 NOT NULL,
	`local_knowledge` text,
	`is_default` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`config_id` integer,
	`title` text NOT NULL,
	`keyword` text NOT NULL,
	`secondary_keywords` text NOT NULL,
	`content` text NOT NULL,
	`meta_description` text NOT NULL,
	`seo_title` text NOT NULL,
	`word_count` integer NOT NULL,
	`status` text DEFAULT 'generating' NOT NULL,
	`error_message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`config_id`) REFERENCES `ai_configurations`(`id`) ON UPDATE no action ON DELETE no action
);
