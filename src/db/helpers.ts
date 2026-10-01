import { db } from './index.ts';
import { users, developers, apps, campaigns, campaignRewards, applications, bugReports, feedbacks } from './schema.ts';
import { eq, desc, inArray, sql, and } from 'drizzle-orm';

// 1. User helpers
export async function getOrCreateUser(uid: string, email: string, name?: string, adminUids: string[] = []) {
  try {
    const isConfiguredAdmin = adminUids.includes(uid);
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || null,
        role: isConfiguredAdmin ? 'admin' : 'tester',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
          ...(isConfiguredAdmin ? { role: 'admin' } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to get or create user in Cloud SQL.');
    throw new Error('Database operation failed for user profile.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  const result = await db.select().from(users).where(eq(users.uid, uid));
  return result[0] || null;
}

export async function submitDeveloperRequest(uid: string, name: string, companyName: string) {
  return db.transaction(async (transaction) => {
    const userRows = await transaction.select().from(users).where(eq(users.uid, uid));
    const user = userRows[0];
    if (!user || user.role === 'admin' || user.role === 'developer') return null;

    const result = await transaction.update(users)
      .set({ name, companyName, role: 'developer_pending' })
      .where(eq(users.uid, uid))
      .returning();
    await transaction.insert(developers)
      .values({ userUid: uid, companyName, status: 'pending_approval' })
      .onConflictDoUpdate({
        target: developers.userUid,
        set: { companyName, status: 'pending_approval', submittedAt: new Date(), approvedAt: null },
      });
    return result[0] || null;
  });
}

export async function getPendingDeveloperRequests() {
  return db
    .select({ uid: users.uid, name: users.name, email: users.email, companyName: users.companyName, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.role, 'developer_pending'))
    .orderBy(desc(users.createdAt));
}

export async function decideDeveloperRequest(uid: string, approved: boolean) {
  return db.transaction(async (transaction) => {
    const userRows = await transaction.select().from(users).where(eq(users.uid, uid));
    if (!userRows[0] || userRows[0].role !== 'developer_pending') return null;
    const result = await transaction.update(users)
      .set({ role: approved ? 'developer' : 'tester' })
      .where(eq(users.uid, uid))
      .returning();
    await transaction.update(developers)
      .set({ status: approved ? 'approved' : 'rejected', approvedAt: approved ? new Date() : null })
      .where(eq(developers.userUid, uid));
    return result[0] || null;
  });
}

// 2. Campaign helpers
export async function getAllCampaigns() {
  try {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  } catch (error) {
    console.error('Failed to fetch campaigns from Cloud SQL.');
    throw new Error('Failed to retrieve campaigns list.', { cause: error });
  }
}

export async function getCampaignBySlug(slug: string) {
  try {
    const results = await db.select().from(campaigns).where(eq(campaigns.slug, slug));
    return results[0] || null;
  } catch (error) {
    console.error('Failed to fetch campaign by slug from Cloud SQL.');
    throw new Error('Failed to retrieve campaign details.', { cause: error });
  }
}

export async function getCampaignById(id: string) {
  const results = await db.select().from(campaigns).where(eq(campaigns.id, id));
  return results[0] || null;
}

export async function getCampaignsForDeveloper(developerId: string) {
  return db.select().from(campaigns)
    .where(eq(campaigns.developerId, developerId))
    .orderBy(desc(campaigns.createdAt));
}

export async function createCampaign(data: typeof campaigns.$inferInsert & {
  reward?: { type: string; title: string; value?: string; description?: string };
}) {
  try {
    return await db.transaction(async (transaction) => {
      const appId = data.appId || `app-${data.id}`;
      const existingApp = await transaction.select().from(apps).where(eq(apps.id, appId));
      if (!existingApp[0]) {
        await transaction.insert(apps).values({
          id: appId,
          developerId: data.developerId,
          name: data.appName,
          platform: data.platform,
          category: data.category,
          description: data.fullDescription,
          icon: data.icon,
        });
      } else if (existingApp[0].developerId !== data.developerId) {
        throw new Error('App owner does not match campaign owner.');
      }

      const { reward, ...campaignData } = data;
      const result = await transaction.insert(campaigns).values({ ...campaignData, appId }).returning();
      if (reward) {
        await transaction.insert(campaignRewards).values({
          id: `reward-${data.id}`,
          campaignId: data.id,
          type: reward.type,
          title: reward.title,
          value: reward.value,
          description: reward.description,
        });
      }
      return result[0];
    });
  } catch (error) {
    console.error('Failed to create campaign in Cloud SQL.');
    throw new Error('Failed to create new campaign.', { cause: error });
  }
}

export async function updateCampaign(id: string, updates: Partial<typeof campaigns.$inferInsert>) {
  try {
    const result = await db.update(campaigns).set(updates).where(eq(campaigns.id, id)).returning();
    return result[0];
  } catch (error) {
    console.error('Failed to update campaign in Cloud SQL.');
    throw new Error('Failed to update campaign.', { cause: error });
  }
}

export async function deleteCampaign(id: string) {
  try {
    return await db.transaction(async (transaction) => {
      await transaction.delete(applications).where(eq(applications.campaignId, id));
      await transaction.delete(bugReports).where(eq(bugReports.campaignId, id));
      await transaction.delete(feedbacks).where(eq(feedbacks.campaignId, id));
      await transaction.delete(campaignRewards).where(eq(campaignRewards.campaignId, id));
      const result = await transaction.delete(campaigns).where(eq(campaigns.id, id)).returning();
      return result[0];
    });
  } catch (error) {
    console.error('Failed to delete campaign from Cloud SQL.');
    throw new Error('Failed to delete campaign.', { cause: error });
  }
}

// 3. Application helpers
export async function getAllApplications(campaignId?: string, testerEmail?: string) {
  try {
    if (campaignId) {
      return await db.select().from(applications).where(eq(applications.campaignId, campaignId));
    }
    if (testerEmail) {
      return await db.select().from(applications).where(eq(applications.testerEmail, testerEmail));
    }
    return await db.select().from(applications);
  } catch (error) {
    console.error('Failed to fetch applications from Cloud SQL.');
    throw new Error('Failed to retrieve applications.', { cause: error });
  }
}

export async function getApplicationsForTester(testerId: string) {
  return db.select().from(applications).where(eq(applications.testerId, testerId));
}

export async function getApplicationById(id: string) {
  const result = await db.select().from(applications).where(eq(applications.id, id));
  return result[0] || null;
}

export async function getApplicationsForDeveloper(developerId: string) {
  const ownedCampaigns = await db.select({ id: campaigns.id }).from(campaigns)
    .where(eq(campaigns.developerId, developerId));
  const campaignIds = ownedCampaigns.map((campaign) => campaign.id);
  if (campaignIds.length === 0) return [];
  return db.select().from(applications).where(inArray(applications.campaignId, campaignIds));
}

export async function createApplication(data: typeof applications.$inferInsert) {
  try {
    return await db.transaction(async (transaction) => {
      await transaction.execute(sql`
        select pg_advisory_xact_lock(
          hashtext(${data.campaignId}),
          hashtext(lower(${data.testerEmail}))
        )
      `);
      const existing = await transaction.select({ id: applications.id })
        .from(applications)
        .where(and(
          eq(applications.campaignId, data.campaignId),
          sql`lower(${applications.testerEmail}) = lower(${data.testerEmail})`
        ));
      if (existing.length) throw new Error('APPLICATION_ALREADY_EXISTS');

      const result = await transaction.insert(applications).values(data).returning();
      await transaction.update(campaigns)
        .set({ currentTestersCount: sql`${campaigns.currentTestersCount} + 1` })
        .where(eq(campaigns.id, data.campaignId));
      return result[0];
    });
  } catch (error) {
      console.error('Failed to create application in Cloud SQL.');
    throw new Error('Failed to submit application.', { cause: error });
  }
}

export async function updateApplication(id: string, updates: Partial<typeof applications.$inferInsert>) {
  try {
    const result = await db.update(applications).set(updates).where(eq(applications.id, id)).returning();
    return result[0];
  } catch (error) {
      console.error('Failed to update application in Cloud SQL.');
    throw new Error('Failed to update application record.', { cause: error });
  }
}

// 4. Bug Report helpers
export async function getAllBugReports(campaignId?: string) {
  try {
    if (campaignId) {
      return await db.select().from(bugReports).where(eq(bugReports.campaignId, campaignId));
    }
    return await db.select().from(bugReports);
  } catch (error) {
      console.error('Failed to fetch bug reports from Cloud SQL.');
    throw new Error('Failed to retrieve bug reports.', { cause: error });
  }
}

export async function createBugReport(data: typeof bugReports.$inferInsert) {
  try {
    const result = await db.insert(bugReports).values(data).returning();
    return result[0];
  } catch (error) {
      console.error('Failed to create bug report in Cloud SQL.');
    throw new Error('Failed to submit bug report.', { cause: error });
  }
}

export async function updateBugReport(id: string, updates: Partial<typeof bugReports.$inferInsert>) {
  try {
    const result = await db.update(bugReports).set(updates).where(eq(bugReports.id, id)).returning();
    return result[0];
  } catch (error) {
    console.error('Failed to update bug report in Cloud SQL.');
    throw new Error('Failed to update bug report.', { cause: error });
  }
}

// 5. Feedback helpers
export async function getAllFeedbacks(campaignId?: string) {
  try {
    if (campaignId) {
      return await db.select().from(feedbacks).where(eq(feedbacks.campaignId, campaignId));
    }
    return await db.select().from(feedbacks);
  } catch (error) {
      console.error('Failed to fetch feedback from Cloud SQL.');
    throw new Error('Failed to retrieve feedback.', { cause: error });
  }
}

export async function createFeedback(data: typeof feedbacks.$inferInsert) {
  try {
    const result = await db.insert(feedbacks).values(data).returning();
    return result[0];
  } catch (error) {
      console.error('Failed to submit feedback to Cloud SQL.');
    throw new Error('Failed to submit feedback.', { cause: error });
  }
}

// 6. Database Seeding
export async function seedDatabaseIfEmpty() {
  // Database initialized clean - apps are created and managed by the Admin/Developers
  return;
}
