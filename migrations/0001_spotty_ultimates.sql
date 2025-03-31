CREATE TABLE `shopping_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` integer NOT NULL,
	`name` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`auto_generated` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`transaction_id` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `shopping_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
