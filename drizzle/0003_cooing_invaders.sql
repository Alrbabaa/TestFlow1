CREATE TABLE "db_smoke_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
