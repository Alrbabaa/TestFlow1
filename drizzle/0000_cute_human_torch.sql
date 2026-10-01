CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"tester_id" text NOT NULL,
	"tester_name" text NOT NULL,
	"tester_email" text NOT NULL,
	"google_play_email" text,
	"country" text,
	"os_type" text NOT NULL,
	"os_version" text,
	"device_model" text,
	"status" text DEFAULT 'applied' NOT NULL,
	"applied_at" timestamp DEFAULT now(),
	"completed_days" integer DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "bug_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"tester_id" text NOT NULL,
	"tester_name" text NOT NULL,
	"tester_email" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"steps_to_reproduce" text,
	"device_info" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"app_name" text NOT NULL,
	"slug" text NOT NULL,
	"developer_id" text NOT NULL,
	"developer_name" text NOT NULL,
	"platform" text NOT NULL,
	"category" text NOT NULL,
	"short_description" text NOT NULL,
	"full_description" text,
	"icon" text,
	"banner_image" text,
	"test_url" text NOT NULL,
	"required_testers_count" integer DEFAULT 20 NOT NULL,
	"current_testers_count" integer DEFAULT 0 NOT NULL,
	"min_testing_days" integer DEFAULT 14 NOT NULL,
	"reward_description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"instructions" text,
	"nda_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "campaigns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"tester_id" text NOT NULL,
	"tester_name" text NOT NULL,
	"rating" integer NOT NULL,
	"category" text NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'tester' NOT NULL,
	"name" text,
	"company_name" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;