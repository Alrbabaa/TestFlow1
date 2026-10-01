CREATE INDEX "applications_campaign_tester_email_idx" ON "applications" USING btree ("campaign_id","tester_email");--> statement-breakpoint
CREATE INDEX "applications_campaign_id_idx" ON "applications" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaigns_developer_id_idx" ON "campaigns" USING btree ("developer_id");