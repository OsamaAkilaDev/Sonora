CREATE TABLE `chat_members` (
	`chat_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`last_read_id` text,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`chat_id`, `user_id`),
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `members_user_idx` ON `chat_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text,
	`dm_key` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_message_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chats_dm_key_unique` ON `chats` (`dm_key`);--> statement-breakpoint
CREATE TABLE `friendships` (
	`user_a` text NOT NULL,
	`user_b` text NOT NULL,
	`status` text NOT NULL,
	`requested_by` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_a`, `user_b`),
	FOREIGN KEY (`user_a`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_b`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `friendships_b_idx` ON `friendships` (`user_b`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`client_id` text,
	`body` text NOT NULL,
	`reply_to_id` text,
	`created_at` integer NOT NULL,
	`edited_at` integer,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_chat_idx` ON `messages` (`chat_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `messages_client_idx` ON `messages` (`sender_id`,`client_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `connected` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_seen_at` integer;