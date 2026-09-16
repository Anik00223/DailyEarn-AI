import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted shared state (safe across vi.mock hoisting) ───
const h = vi.hoisted(() => ({
  orchestrateMock: vi.fn(),
  insertedRows: [] as Record<string, unknown>[],
  analyticsRows: [] as Array<{ userId: string; eventType: string; metadata: { provider?: string } }>,
  tables: { ideas: { name: 'ideas' }, analytics: { name: 'analytics' } },
}));

vi.mock('../../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_URL: 'postgresql://localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    GROQ_API_KEY: 'test_groq_api_key_for_testing_purposes',
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    JWT_ACCESS_SECRET: 'test_access_secret_64chars_minimum_so_zod_does_not_fail_validation_schema',
    JWT_REFRESH_SECRET: 'test_refresh_secret_64chars_minimum_so_zod_does_not_fail_validation_schema',
    BCRYPT_ROUNDS: 12,
    CORS_ORIGIN: 'http://localhost:5173',
    ADMIN_SECRET: 'test_admin_secret_32chars_minimum_ok',
  },
  isGroqConfigured: vi.fn().mockReturnValue(true),
  isNvidiaConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock('../../config/redis', () => ({
  redisGet: vi.fn().mockResolvedValue(null),
  redisSet: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../queues/ideaGeneration.queue', () => ({
  getIdeaQueue: vi.fn().mockReturnValue(null),
}));

vi.mock('../../services/aiOrchestrator', () => ({
  orchestrateAiRequest: h.orchestrateMock,
}));

vi.mock('../../db/schema/index', () => ({
  ideas: h.tables.ideas,
  analytics: h.tables.analytics,
}));

vi.mock('../../db/index', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
    })),
    insert: vi.fn((table: { name: string }) => ({
      values: vi.fn((vals: Record<string, unknown>) => {
        if (vals && typeof vals === 'object' && 'eventType' in vals) {
          h.analyticsRows.push(vals as { userId: string; eventType: string; metadata: { provider?: string } });
          return Promise.resolve(undefined);
        }
        h.insertedRows.push(vals);
        return {
          returning: vi.fn().mockResolvedValue([{ id: `idea-${h.insertedRows.length}`, ...vals }]),
        };
      }),
    })),
  },
}));

vi.mock('../../middleware/errorHandler', () => ({
  createError: (statusCode: number, code: string, message: string) =>
    Object.assign(new Error(message), { statusCode, code }),
}));

import { generateIdeas } from './ideas.service';
import { buildDeterministicIdeas } from './ideas.fallback';

const PARAMS = {
  city: 'Silchar',
  state: 'Assam',
  skills: ['Teaching'],
  dailyGoal: 600,
  language: 'en' as const,
  count: 2,
};

function validAiResponse(city: string): string {
  return JSON.stringify({
    ideas: [
      {
        title: `Tutor school students in ${city}`,
        description: `Offer evening tutoring to students in ${city}.`,
        estimated_daily_earn: 500,
        estimated_weekly_earn: 3000,
        effort_level: 'low',
        skills_required: ['Teaching'],
        platform_name: 'Vedantu',
        platform_url: 'https://www.vedantu.com',
        getting_started_steps: ['Sign up', 'Verify profile', 'Take first session'],
        earnings_breakdown: '2 sessions × ₹250 = ₹500/day',
        city_specific_tip: `Work within your own area of ${city}.`,
      },
    ],
  });
}

beforeEach(() => {
  h.insertedRows.length = 0;
  h.analyticsRows.length = 0;
  h.orchestrateMock.mockReset();
});

describe('ideas.service — AI transient failure resilience (no unnecessary 5xx)', () => {
  it('REGRESSION 1: successful AI response → ideas returned with correct city/state attribution', async () => {
    h.orchestrateMock.mockResolvedValueOnce({
      content: validAiResponse('Silchar'),
      provider: 'groq',
      reason: 'success',
      latencyMs: 100,
      model: 'test',
      fromCache: false,
    });

    const result = await generateIdeas('user-1', PARAMS);

    expect(h.orchestrateMock).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].city).toBe('Silchar');
    expect(result[0].state).toBe('Assam');
    // Persisted location must come from the request, never a hardcoded default
    expect(h.insertedRows[0].city).toBe('Silchar');
    expect(h.insertedRows[0].state).toBe('Assam');
  });

  it('REGRESSION 2: provider failover content (NVIDIA-served) → ideas persisted with request city/state', async () => {
    h.orchestrateMock.mockResolvedValueOnce({
      content: validAiResponse('Silchar'),
      provider: 'nvidia',
      reason: 'success',
      latencyMs: 200,
      model: 'nvidia-test',
      fromCache: false,
    });

    const result = await generateIdeas('user-1', PARAMS);

    expect(result).toHaveLength(1);
    expect(result[0].city).toBe('Silchar');
    expect(h.insertedRows[0].city).toBe('Silchar');
    expect(h.insertedRows[0].state).toBe('Assam');
  });

  it('REGRESSION 3: both providers transiently unavailable → deterministic fallback, resolves (never throws)', async () => {
    h.orchestrateMock.mockResolvedValue({
      content: '',
      provider: 'deterministic',
      reason: 'unavailable',
      latencyMs: 5,
      model: 'deterministic-engine',
      fromCache: false,
    });

    const result = await generateIdeas('user-1', { ...PARAMS, count: 3 });

    expect(h.orchestrateMock).toHaveBeenCalledTimes(2); // one retry, then fallback
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result[0].city).toBe('Silchar');
    expect(result[0].state).toBe('Assam');
    expect(h.analyticsRows[0].metadata.provider).toBe('deterministic');
  });

  it('REGRESSION 4: provider timeout classified as recoverable → fallback, never throws', async () => {
    h.orchestrateMock.mockResolvedValue({
      content: '',
      provider: 'deterministic',
      reason: 'timeout',
      latencyMs: 5,
      model: 'deterministic-engine',
      fromCache: false,
    });

    await expect(generateIdeas('user-1', PARAMS)).resolves.toBeDefined();
  });

  it('REGRESSION 5: provider 429 (rate_limited) classified as recoverable → fallback, never throws', async () => {
    h.orchestrateMock.mockResolvedValue({
      content: '',
      provider: 'deterministic',
      reason: 'rate_limited',
      latencyMs: 5,
      model: 'deterministic-engine',
      fromCache: false,
    });

    await expect(generateIdeas('user-1', PARAMS)).resolves.toBeDefined();
  });


  it('REGRESSION 6: malformed AI response on attempt 1 → retried once → valid content used (recoverable, no 5xx)', async () => {
    h.orchestrateMock
      .mockResolvedValueOnce({
        content: '{"ideas": [{"title": "truncated strin', // malformed / truncated
        provider: 'groq',
        reason: 'success',
        latencyMs: 10,
        model: 'test',
        fromCache: false,
      })
      .mockResolvedValueOnce({
        content: validAiResponse('Silchar'),
        provider: 'groq',
        reason: 'success',
        latencyMs: 10,
        model: 'test',
        fromCache: false,
      });

    const result = await generateIdeas('user-1', PARAMS);

    expect(h.orchestrateMock).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
    expect(result[0].city).toBe('Silchar');
  });

  it('REGRESSION 7: deterministic fallback retains correct city/state in every idea', async () => {
    h.orchestrateMock.mockResolvedValue({
      content: '',
      provider: 'deterministic',
      reason: 'unavailable',
      latencyMs: 5,
      model: 'deterministic-engine',
      fromCache: false,
    });

    const result = await generateIdeas('user-1', { ...PARAMS, city: 'Indore', state: 'Madhya Pradesh', count: 3 });

    expect(result.length).toBeGreaterThan(0);
    for (const idea of result) {
      expect(idea.city).toBe('Indore');
      expect(idea.state).toBe('Madhya Pradesh');
      expect(idea.citySpecificTip).toContain('Indore');
      expect(idea.citySpecificTip).toContain('Madhya Pradesh');
      // Closed-world geography: no invented localities
      expect(idea.citySpecificTip).not.toMatch(/\b(road|colony|nagar|market|mall|college)\b/i);
    }
  });

  it('REGRESSION 8: AI provider failure does not corrupt persisted idea location', async () => {
    h.orchestrateMock.mockResolvedValue({
      content: validAiResponse('WRONG-LOCATION-LEAK'),
      provider: 'groq',
      reason: 'success',
      latencyMs: 10,
      model: 'test',
      fromCache: false,
    });

    // Even if the AI hallucinates a different city in its text, persistence
    // must always use the real request city/state.
    const result = await generateIdeas('user-1', { ...PARAMS, city: 'Guwahati', state: 'Assam' });

    expect(h.insertedRows[0].city).toBe('Guwahati');
    expect(h.insertedRows[0].state).toBe('Assam');
    expect(result[0].city).toBe('Guwahati');
  });
});

describe('buildDeterministicIdeas — catalog fallback contract', () => {
  it('is deterministic (stable across calls), respects count, and stays closed-world', () => {
    const params = { ...PARAMS, city: 'Bangalore', state: 'Karnataka', count: 3 };
    const a = buildDeterministicIdeas(params);
    const b = buildDeterministicIdeas(params);

    expect(a).toEqual(b); // deterministic
    expect(a.length).toBeLessThanOrEqual(3);
    for (const idea of a) {
      expect(idea.estimated_daily_earn).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(idea.estimated_daily_earn)).toBe(true);
      expect(['low', 'medium', 'high']).toContain(idea.effort_level);
      expect(idea.city_specific_tip).toContain('Bangalore');
      expect(idea.city_specific_tip).toContain('Karnataka');
    }
  });
});

