import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  generateContent: vi.fn(),
  generateNvidiaContent: vi.fn(),
}));

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_URL: 'postgresql://localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    GROQ_API_KEY: 'test_groq_api_key_for_testing_purposes',
    GROQ_MODEL: 'llama-3.3-70b-versatile',
    NVIDIA_API_KEY: 'test_nvidia_key',
    NVIDIA_MODEL: 'test-nvidia-model',
    JWT_ACCESS_SECRET: 'test_access_secret_64chars_minimum_so_zod_does_not_fail_validation_schema',
    JWT_REFRESH_SECRET: 'test_refresh_secret_64chars_minimum_so_zod_does_not_fail_validation_schema',
    BCRYPT_ROUNDS: 12,
    CORS_ORIGIN: 'http://localhost:5173',
    ADMIN_SECRET: 'test_admin_secret_32chars_minimum_ok',
  },
  isGroqConfigured: vi.fn().mockReturnValue(true),
  isNvidiaConfigured: vi.fn().mockReturnValue(true),
}));

vi.mock('../config/redis', () => ({
  redisGet: vi.fn().mockResolvedValue(null),
  redisSet: vi.fn().mockResolvedValue(true),
}));

vi.mock('../config/groq', () => ({
  generateContent: h.generateContent,
  classifyError: (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    const type = /429|rate/i.test(message)
      ? 'rate_limit'
      : /timeout|abort/i.test(message)
        ? 'timeout'
        : /circuit/i.test(message)
          ? 'circuit_breaker_open'
          : 'unavailable';
    return { type, message };
  },
  getGroqMetrics: vi.fn().mockReturnValue({}),
}));

vi.mock('../config/nvidia', () => ({
  generateNvidiaContent: h.generateNvidiaContent,
  classifyNvidiaError: (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    const type = /429|rate/i.test(message) ? 'rate_limit' : /timeout|abort/i.test(message) ? 'timeout' : 'unavailable';
    return { type, message };
  },
  getNvidiaMetrics: vi.fn().mockReturnValue({}),
}));

import { orchestrateAiRequest } from './aiOrchestrator';

beforeEach(() => {
  h.generateContent.mockReset();
  h.generateNvidiaContent.mockReset();
});

describe('aiOrchestrator — provider chain resilience', () => {
  it('CHAIN 1: Groq success → provider=groq', async () => {
    h.generateContent.mockResolvedValueOnce('{"ok":true}');

    const result = await orchestrateAiRequest('prompt', undefined, { skipCache: true });

    expect(result.provider).toBe('groq');
    expect(result.reason).toBe('success');
    expect(h.generateNvidiaContent).not.toHaveBeenCalled();
  });

  it('CHAIN 2: Groq failure → NVIDIA succeeds → provider=nvidia', async () => {
    h.generateContent.mockRejectedValueOnce(new Error('429 rate limit exceeded'));
    h.generateNvidiaContent.mockResolvedValueOnce('{"ok":true}');

    const result = await orchestrateAiRequest('prompt', undefined, { skipCache: true });

    expect(result.provider).toBe('nvidia');
    expect(result.reason).toBe('success');
  });

  it('CHAIN 3: both providers fail → deterministic fallback (content empty, never throws)', async () => {
    h.generateContent.mockRejectedValueOnce(new Error('timeout abort'));
    h.generateNvidiaContent.mockRejectedValueOnce(new Error('connection reset'));

    const result = await orchestrateAiRequest('prompt', undefined, { skipCache: true });

    expect(result.provider).toBe('deterministic');
    expect(result.content).toBe('');
    expect(result.reason).toBe('timeout'); // classification of the primary failure is preserved
  });

  it('CHAIN 4: forced Groq failure → NVIDIA path (safe live diagnostics contract)', async () => {
    h.generateNvidiaContent.mockResolvedValueOnce('{"ok":true}');

    const result = await orchestrateAiRequest('prompt', undefined, { skipCache: true, forceGroqFailure: true });

    expect(h.generateContent).not.toHaveBeenCalled();
    expect(result.provider).toBe('nvidia');
  });

  it('CHAIN 5: all providers forced to fail → deterministic (no exception escapes)', async () => {
    const result = await orchestrateAiRequest('prompt', undefined, {
      skipCache: true,
      forceGroqFailure: true,
      forceNvidiaFailure: true,
    });

    expect(result.provider).toBe('deterministic');
    expect(result.content).toBe('');
  });

  it('CHAIN 6: Groq timeout classified as recoverable — orchestrator never rejects', async () => {
    h.generateContent.mockRejectedValueOnce(new Error('request timeout abort'));
    h.generateNvidiaContent.mockRejectedValueOnce(new Error('timeout abort'));

    await expect(orchestrateAiRequest('prompt', undefined, { skipCache: true })).resolves.toBeDefined();
  });

  it('CHAIN 7: Groq 429 classified as recoverable — orchestrator never rejects', async () => {
    h.generateContent.mockRejectedValueOnce(new Error('HTTP 429 Too Many Requests'));
    h.generateNvidiaContent.mockRejectedValueOnce(new Error('HTTP 429'));

    await expect(orchestrateAiRequest('prompt', undefined, { skipCache: true })).resolves.toBeDefined();
  });
});
