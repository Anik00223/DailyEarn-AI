import { eq, and, desc, ne, sql, count } from 'drizzle-orm';
import { db } from '../../db/index';
import { ideas, analytics } from '../../db/schema/index';
import { createError } from '../../middleware/errorHandler';
import { buildIdeaPrompt, generateIdeaHash } from './ideas.prompt';
import { geminiResponseSchema } from './ideas.schema';
import type { GenerateIdeasInput, GeminiIdea } from './ideas.schema';
import { ideaQueue } from '../../queues/ideaGeneration.queue';
import { redisGet, redisSet } from '../../config/redis';

const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

export async function generateIdeas(
  userId: string,
  params: GenerateIdeasInput
): Promise<typeof ideas.$inferSelect[]> {
  // 1. Check Redis cache for identical request
  const cacheKey = `ideas:${userId}:${params.city.toLowerCase().trim()}:${params.state.toLowerCase().trim()}:${[...params.skills].sort().join(',')}:${params.dailyGoal}:${params.language}:${params.count}`;
  try {
    const cached = await redisGet(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as typeof ideas.$inferSelect[];
      // Filter out any ideas marked as dismissed by user
      const filtered = parsed.filter((idea) => idea.isDismissed === false);
      if (filtered.length > 0) {
        return filtered;
      }
    }
  } catch {
    // Cache miss or error — proceed with generation
  }

  // 2. Fetch previous idea hashes (last 50)
  const previousIdeas = await db
    .select({ ideaHash: ideas.ideaHash })
    .from(ideas)
    .where(eq(ideas.userId, userId))
    .orderBy(desc(ideas.generatedAt))
    .limit(50);

  const previousHashes = previousIdeas.map((i) => i.ideaHash);

  // 3. Build prompt
  const prompt = buildIdeaPrompt({
    city: params.city,
    state: params.state,
    skills: params.skills,
    dailyGoal: params.dailyGoal,
    language: params.language,
    previousIdeaHashes: previousHashes,
    timestamp: Date.now(),
    count: params.count,
  });

  // 4. Add generation job to Bull Queue and await finished result
  let rawResponse: string;
  try {
    const job = await ideaQueue.add({ prompt, userId });
    const result = await job.finished() as { rawResponse: string };
    rawResponse = result.rawResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw createError(502, 'IDEA_GENERATION_FAILED', `AI generation failed: ${message}`);
  }

  // 5. Parse response (guaranteed to succeed and validate due to validator hook)
  let parsedIdeas: GeminiIdea[];
  try {
    let cleanedResponse = rawResponse.trim();
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '');
    }

    const jsonResponse = JSON.parse(cleanedResponse);
    const validated = geminiResponseSchema.parse(jsonResponse);
    parsedIdeas = validated.ideas;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Parse error';
    throw createError(502, 'IDEA_GENERATION_FAILED', `Failed to parse AI response: ${message}`);
  }

  // 6. Save ideas to database
  const savedIdeas: typeof ideas.$inferSelect[] = [];
  const generationTimestamp = new Date();

  for (const idea of parsedIdeas) {
    const hash = generateIdeaHash(idea.title, idea.platform_name);

    // Skip duplicates
    if (previousHashes.includes(hash)) {
      continue;
    }

    const [savedIdea] = await db
      .insert(ideas)
      .values({
        userId,
        title: idea.title,
        description: idea.description,
        estimatedDailyEarn: idea.estimated_daily_earn,
        estimatedWeeklyEarn: idea.estimated_weekly_earn,
        effortLevel: idea.effort_level,
        skillsRequired: idea.skills_required,
        platformName: idea.platform_name,
        platformUrl: idea.platform_url,
        gettingStartedSteps: idea.getting_started_steps,
        earningsBreakdown: idea.earnings_breakdown,
        citySpecificTip: idea.city_specific_tip,
        generationTimestamp,
        ideaHash: hash,
      })
      .returning();

    if (savedIdea) {
      savedIdeas.push(savedIdea);
    }
  }

  // 7. Cache result in Redis for 6 hours
  if (savedIdeas.length > 0) {
    try {
      await redisSet(cacheKey, JSON.stringify(savedIdeas), CACHE_TTL_SECONDS);
    } catch {
      // Non-critical — continue even if caching fails
    }
  }

  // 8. Log analytics event
  await db.insert(analytics).values({
    userId,
    eventType: 'idea_generated',
    metadata: {
      city: params.city,
      state: params.state,
      skills: params.skills,
      count: savedIdeas.length,
      cached: false,
    },
  });

  return savedIdeas;
}

export async function getIdeas(
  userId: string,
  page: number,
  limit: number
): Promise<{ ideas: typeof ideas.$inferSelect[]; total: number }> {
  const offset = (page - 1) * limit;

  const [userIdeas, totalResult] = await Promise.all([
    db
      .select()
      .from(ideas)
      .where(
        and(
          eq(ideas.userId, userId),
          eq(ideas.isDismissed, false)
        )
      )
      .orderBy(desc(ideas.generatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(ideas)
      .where(
        and(
          eq(ideas.userId, userId),
          eq(ideas.isDismissed, false)
        )
      ),
  ]);

  return {
    ideas: userIdeas,
    total: totalResult[0]?.count ?? 0,
  };
}

export async function saveIdea(
  ideaId: string,
  userId: string
): Promise<typeof ideas.$inferSelect> {
  const [idea] = await db
    .select()
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.userId, userId)))
    .limit(1);

  if (!idea) {
    throw createError(404, 'NOT_FOUND', 'Idea not found');
  }

  const [updated] = await db
    .update(ideas)
    .set({ isSaved: !idea.isSaved })
    .where(eq(ideas.id, ideaId))
    .returning();

  if (!updated) {
    throw createError(500, 'INTERNAL_ERROR', 'Failed to update idea');
  }

  // Log analytics
  await db.insert(analytics).values({
    userId,
    eventType: updated.isSaved ? 'idea_saved' : 'idea_dismissed',
    ideaId,
  });

  return updated;
}

export async function dismissIdea(
  ideaId: string,
  userId: string
): Promise<void> {
  const [idea] = await db
    .select()
    .from(ideas)
    .where(and(eq(ideas.id, ideaId), eq(ideas.userId, userId)))
    .limit(1);

  if (!idea) {
    throw createError(404, 'NOT_FOUND', 'Idea not found');
  }

  await db
    .update(ideas)
    .set({ isDismissed: true })
    .where(eq(ideas.id, ideaId));

  await db.insert(analytics).values({
    userId,
    eventType: 'idea_dismissed',
    ideaId,
  });
}

export async function getSavedIdeas(
  userId: string
): Promise<typeof ideas.$inferSelect[]> {
  return db
    .select()
    .from(ideas)
    .where(
      and(
        eq(ideas.userId, userId),
        eq(ideas.isSaved, true)
      )
    )
    .orderBy(desc(ideas.generatedAt));
}
