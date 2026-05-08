import { eq, and, count, sql, desc } from 'drizzle-orm';
import { db } from '../../db/index';
import { users, ideas, analytics } from '../../db/schema/index';
import { createError } from '../../middleware/errorHandler';
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  city: z.string().min(2).max(100).trim().optional(),
  state: z.string().min(2).max(100).trim().optional(),
  skillTags: z.array(z.string().max(50)).max(10).optional(),
  dailyIncomeGoal: z.number().int().min(100).max(10000).optional(),
  languagePref: z.enum(['en', 'hi', 'bn', 'te', 'ta', 'mr']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function updateProfile(
  userId: string,
  data: UpdateProfileInput
) {
  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      city: users.city,
      state: users.state,
      skillTags: users.skillTags,
      dailyIncomeGoal: users.dailyIncomeGoal,
      languagePref: users.languagePref,
    });

  if (!updated) {
    throw createError(404, 'NOT_FOUND', 'User not found');
  }

  return updated;
}

export async function getUserStats(userId: string) {
  const [totalGenerated] = await db
    .select({ count: count() })
    .from(ideas)
    .where(eq(ideas.userId, userId));

  const [totalSaved] = await db
    .select({ count: count() })
    .from(ideas)
    .where(and(eq(ideas.userId, userId), eq(ideas.isSaved, true)));

  const [totalDismissed] = await db
    .select({ count: count() })
    .from(ideas)
    .where(and(eq(ideas.userId, userId), eq(ideas.isDismissed, true)));

  // Calculate estimated monthly earnings from saved ideas
  const savedIdeas = await db
    .select({ estimatedDailyEarn: ideas.estimatedDailyEarn })
    .from(ideas)
    .where(and(eq(ideas.userId, userId), eq(ideas.isSaved, true)));

  const avgDailyEarn =
    savedIdeas.length > 0
      ? savedIdeas.reduce((sum, i) => sum + i.estimatedDailyEarn, 0) / savedIdeas.length
      : 0;
  const estimatedMonthlyEarnings = Math.round(avgDailyEarn * 30);

  // Top platforms from saved ideas
  const topPlatformsResult = await db
    .select({
      platformName: ideas.platformName,
      platformCount: count(),
    })
    .from(ideas)
    .where(and(eq(ideas.userId, userId), eq(ideas.isSaved, true)))
    .groupBy(ideas.platformName)
    .orderBy(desc(count()))
    .limit(5);

  const topPlatforms = topPlatformsResult.map((p) => p.platformName);

  return {
    totalIdeasGenerated: totalGenerated?.count ?? 0,
    totalSaved: totalSaved?.count ?? 0,
    totalDismissed: totalDismissed?.count ?? 0,
    estimatedMonthlyEarnings,
    topPlatforms,
  };
}
