CREATE TABLE "apps" (
	"id" text PRIMARY KEY NOT NULL,
	"developer_id" text NOT NULL,
	"name" text NOT NULL,
	"platform" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"icon" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"value" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "campaign_rewards_campaign_id_unique" UNIQUE("campaign_id")
);
--> statement-breakpoint
CREATE TABLE "developers" (
	"user_uid" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"submitted_at" timestamp DEFAULT now(),
	"approved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
UPDATE "applications" SET "status" = 'pending' WHERE "status" = 'applied';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "app_id" text;--> statement-breakpoint
ALTER TABLE "campaign_rewards" ADD CONSTRAINT "campaign_rewards_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developers" ADD CONSTRAINT "developers_user_uid_users_uid_fk" FOREIGN KEY ("user_uid") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "developers" ("user_uid", "company_name", "status", "submitted_at")
SELECT "uid", COALESCE(NULLIF("company_name", ''), NULLIF("name", ''), "email"),
	   CASE WHEN "role" = 'developer' THEN 'approved' ELSE 'pending_approval' END,
	   COALESCE("created_at", now())
FROM "users"
WHERE "role" IN ('developer', 'developer_pending')
ON CONFLICT ("user_uid") DO NOTHING;
--> statement-breakpoint
INSERT INTO "apps" ("id", "developer_id", "name", "platform", "category", "description", "icon", "created_at")
SELECT 'app-' || "id", "developer_id", "app_name", "platform", "category", "full_description", "icon", "created_at"
FROM "campaigns"
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
UPDATE "campaigns" SET "app_id" = 'app-' || "id" WHERE "app_id" IS NULL;
--> statement-breakpoint
INSERT INTO "campaign_rewards" ("id", "campaign_id", "type", "title", "description")
SELECT 'reward-' || "id", "id", 'points', "reward_description", "reward_description"
FROM "campaigns"
WHERE "reward_description" IS NOT NULL AND "reward_description" <> ''
ON CONFLICT ("campaign_id") DO NOTHING;