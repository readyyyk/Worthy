CREATE TABLE IF NOT EXISTS "transactions" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"owner_id" smallint NOT NULL,
	"description" varchar(256) NOT NULL,
	"amount" smallint NOT NULL,
	"currency" varchar(3) NOT NULL,
	"is_income" boolean NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"tags" varchar(64)[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"primary_currency" varchar(3) NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
