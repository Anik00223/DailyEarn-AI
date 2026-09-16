import { eq, and, desc, ne, sql, count } from 'drizzle-orm';
import { db } from '../../db/index';
import { ideas, analytics } from '../../db/schema/index';
import { createError } from '../../middleware/errorHandler';
import { buildIdeaPrompt, generateIdeaHash } from './ideas.prompt';
import { buildDeterministicIdeas } from './ideas.fallback';
import { geminiResponseSchema } from './ideas.schema';
import type { GenerateIdeasInput, GeminiIdea } from './ideas.schema';
import { getIdeaQueue } from '../../queues/ideaGeneration.queue';
import { orchestrateAiRequest } from '../../services/aiOrchestrator';
import { redisGet, redisSet } from '../../config/redis';

const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const FALLBACK_CACHE_TTL_SECONDS = 30 * 60; // fallback results are retried against AI sooner

/**
 * Parses and validates a raw provider response. Malformed or truncated
 * responses are classified as RECOVERABLE provider failures: this returns
 * null instead of throwing, so the caller can retry or use the deterministic
 * fallback rather than surfacing a 5xx.
 */
function tryParseAiIdeas(raw: string): GeminiIdea[] | null {
  try {
    let cleanedResponse = raw.trim();
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const jsonResponse = JSON.parse(cleanedResponse);
    return geminiResponseSchema.parse(jsonResponse).ideas;
  } catch (error) {
    console.warn(
      '[Ideas] AI response failed parse/validation (recoverable):',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

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

  // 4. Queue a generation job when Redis/Bull is up; otherwise generate
  // in-process (no ioredis clients are ever created in degraded mode).
  let rawResponse: string | null = null;
  const ideaQueue = getIdeaQueue();
  if (ideaQueue) {
    try {
      const job = await ideaQueue.add({ prompt, userId });
      const result = (await job.finished()) as { rawResponse: string };
      rawResponse = result.rawResponse;
    } catch (queueError) {
      // Queue failure is recoverable — direct orchestration below still serves
      // the request; a transient AI failure must never surface as a 5xx.
      console.warn(
        '[Ideas] Bull queue execution failed, falling back to direct AI generation:',
        queueError instanceof Error ? queueError.message : queueError
      );
      rawResponse = null;
    }
  }

  // 5. Resilient generation. Provider timeout / 429 / network failure /
  // circuit-open / malformed response are ALL recoverable: retry once with
  // backoff (same prompt, so in-flight coalescing still dedupes), then serve
  // human-verified catalog ideas via the deterministic fallback. 5xx is
  // reserved for genuine application failures (e.g. database errors, which
  // still propagate naturally through the error handler).
  const parsedFromRaw = rawResponse ? tryParseAiIdeas(rawResponse) : null;
  const MAX_AI_ATTEMPTS = 2;
  const RETRY_DELAY_MS = 1500;
  let parsedIdeas: GeminiIdea[] | null = parsedFromRaw;
  let deterministicFallback = !parsedFromRaw && Boolean(rawResponse);
  for (let attempt = 1; attempt <= MAX_AI_ATTEMPTS && !parsedIdeas; attempt++) {
    if (attempt > 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
    const orchestration = await orchestrateAiRequest(prompt);
    if (!orchestration.content) {
      // Recoverable AI-provider failure (timeout / rate_limited / circuit_open /
      // unavailable / fallback). Retry, then fall back — never 5xx.
      console.warn(
        `[Ideas] AI attempt ${attempt}/${MAX_AI_ATTEMPTS} unavailable (provider=${orchestration.provider}, reason=${orchestration.reason}) — recoverable provider failure`
      );
      continue;
    }
    parsedIdeas = tryParseAiIdeas(orchestration.content);
    if (!parsedIdeas) {
      // Malformed provider response — recoverable; retry or fall back.
      console.warn(`[Ideas] AI attempt ${attempt}/${MAX_AI_ATTEMPTS} returned a malformed response — recoverable`);
    }
  }

  if (!parsedIdeas) {
    parsedIdeas = buildDeterministicIdeas(params);
    deterministicFallback = true;
    console.warn(
      '[Ideas] All AI provider attempts failed or were malformed — serving human-verified catalog ideas (deterministic fallback, non-5xx)'
    );
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
        // Location attribution — real user-selected location, never a default
        city: params.city,
        state: params.state,
        generationTimestamp,
        ideaHash: hash,
      })
      .returning();

    if (savedIdea) {
      savedIdeas.push(savedIdea);
    }
  }

  // 7. Cache result in Redis for 6 hours (30 min for fallback results so the
  // next identical request gets a fresh chance at real AI generation)
  if (savedIdeas.length > 0) {
    try {
      await redisSet(
        cacheKey,
        JSON.stringify(savedIdeas),
        deterministicFallback ? FALLBACK_CACHE_TTL_SECONDS : CACHE_TTL_SECONDS
      );
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
      provider: deterministicFallback ? 'deterministic' : 'ai',
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
