ALTER TABLE users ADD `balance` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE transactions ADD `is_income` integer NOT NULL;