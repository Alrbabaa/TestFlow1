import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users table (synced with Firebase Auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').notNull().default('tester'),
  name: text('name'),
  companyName: text('company_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const developers = pgTable('developers', {
  userUid: text('user_uid').primaryKey().references(() => users.uid),
  companyName: text('company_name').notNull(),
  status: text('status').notNull().default('pending_approval'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
});

export const apps = pgTable('apps', {
  id: text('id').primaryKey(),
  developerId: text('developer_id').notNull(),
  name: text('name').notNull(),
  platform: text('platform').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  icon: text('icon'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Campaigns table
export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  appId: text('app_id').references(() => apps.id),
  name: text('name').notNull(),
  appName: text('app_name').notNull(),
  slug: text('slug').notNull().unique(),
  developerId: text('developer_id').notNull(),
  developerName: text('developer_name').notNull(),
  platform: text('platform').notNull(), // 'android' | 'ios' | 'both'
  category: text('category').notNull(),
  shortDescription: text('short_description').notNull(),
  fullDescription: text('full_description'),
  icon: text('icon'),
  bannerImage: text('banner_image'),
  testUrl: text('test_url').notNull(),
  requiredTestersCount: integer('required_testers_count').notNull().default(20),
  currentTestersCount: integer('current_testers_count').notNull().default(0),
  minTestingDays: integer('min_testing_days').notNull().default(14),
  rewardDescription: text('reward_description'),
  status: text('status').notNull().default('active'),
  isFeatured: boolean('is_featured').notNull().default(false),
  instructions: text('instructions'),
  ndaRequired: boolean('nda_required').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('campaigns_developer_id_idx').on(table.developerId),
]);

export const campaignRewards = pgTable('campaign_rewards', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').references(() => campaigns.id).notNull().unique(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  value: text('value'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Tester applications and campaign-specific tester status
export const applications = pgTable('applications', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id')
    .references(() => campaigns.id)
    .notNull(),
  testerId: text('tester_id').notNull(),
  testerName: text('tester_name').notNull(),
  testerEmail: text('tester_email').notNull(),
  googlePlayEmail: text('google_play_email'),
  country: text('country'),
  osType: text('os_type').notNull(),
  osVersion: text('os_version'),
  deviceModel: text('device_model'),
  status: text('status').notNull().default('pending'),
  appliedAt: timestamp('applied_at').defaultNow(),
  completedDays: integer('completed_days').notNull().default(0),
  notes: text('notes'),
}, (table) => [
  index('applications_campaign_id_idx').on(table.campaignId),
]);

// 4. Bug Reports table
export const bugReports = pgTable('bug_reports', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id')
    .references(() => campaigns.id)
    .notNull(),
  testerId: text('tester_id').notNull(),
  testerName: text('tester_name').notNull(),
  testerEmail: text('tester_email').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: text('severity').notNull().default('medium'),
  status: text('status').notNull().default('new'),
  stepsToReproduce: text('steps_to_reproduce'),
  deviceInfo: text('device_info'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Feedbacks table
export const feedbacks = pgTable('feedbacks', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id')
    .references(() => campaigns.id)
    .notNull(),
  testerId: text('tester_id').notNull(),
  testerName: text('tester_name').notNull(),
  rating: integer('rating').notNull(),
  category: text('category').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const dbSmokeChecks = pgTable('db_smoke_checks', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const campaignsRelations = relations(campaigns, ({ many }) => ({
  applications: many(applications),
  bugReports: many(bugReports),
  feedbacks: many(feedbacks),
  rewards: many(campaignRewards),
}));

export const developersRelations = relations(developers, ({ one }) => ({
  user: one(users, { fields: [developers.userUid], references: [users.uid] }),
}));

export const appsRelations = relations(apps, ({ many }) => ({
  campaigns: many(campaigns),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [applications.campaignId],
    references: [campaigns.id],
  }),
}));

export const bugReportsRelations = relations(bugReports, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [bugReports.campaignId],
    references: [campaigns.id],
  }),
}));

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [feedbacks.campaignId],
    references: [campaigns.id],
  }),
}));
