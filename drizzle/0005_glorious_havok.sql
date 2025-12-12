CREATE TABLE `email_verifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`name` text,
	`password_hash` text,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`verified` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `review_configurations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`platform_name` text NOT NULL,
	`target_country` text NOT NULL,
	`main_user_criterion` text NOT NULL,
	`secondary_user_criterion` text NOT NULL,
	`rating` integer NOT NULL,
	`main_license` text NOT NULL,
	`foundation_year` integer NOT NULL,
	`mobile_app` text NOT NULL,
	`average_withdrawal_time` text NOT NULL,
	`support_247` text NOT NULL,
	`sports_variety` text NOT NULL,
	`strong_markets` text NOT NULL,
	`casino_games_count` integer NOT NULL,
	`main_provider` text NOT NULL,
	`featured_game` text NOT NULL,
	`welcome_offer_type` text NOT NULL,
	`rollover_requirement` text NOT NULL,
	`additional_promotions_count` integer NOT NULL,
	`popular_payment_method_1` text NOT NULL,
	`popular_payment_method_2` text NOT NULL,
	`unique_competitive_advantage` text NOT NULL,
	`experience_level` text NOT NULL,
	`desired_tone` text NOT NULL,
	`main_focus` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `articles` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `content_ideas` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `seo_structures` ADD `user_id` text;