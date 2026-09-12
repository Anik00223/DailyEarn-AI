import rateLimit, { MemoryStore, Store, Options, ClientRateLimitInfo } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient, isRedisAvailable } from '../config/redis';
import { env } from '../config/env';

/**
 * ResilientRateLimitStore provides distributed rate limiting via Redis
 * across multiple horizontal backend instances, with safe bounded in-memory fallback
 * if Redis is disconnected or during local development.
 */
export class ResilientRateLimitStore implements Store {
  private redisStore: RedisStore | null = null;
  private memoryStore: MemoryStore;
  public prefix?: string;
  private options?: Options;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.memoryStore = new MemoryStore();
  }

  init(options: Options): void {
    this.options = options;
    this.memoryStore.init(options);
  }

  private ensureRedisStore(): RedisStore | null {
    if (!isRedisAvailable()) {
      this.redisStore = null;
      return null;
    }
    if (!this.redisStore) {
      try {
        this.redisStore = new RedisStore({
          sendCommand: async (...args: string[]) => {
            const client = getRedisClient();
            return client.sendCommand(args);
          },
          prefix: `rl:${this.prefix}:`,
        });
        if (this.options) {
          this.redisStore.init(this.options);
        }
      } catch {
        this.redisStore = null;
      }
    }
    return this.redisStore;
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const store = this.ensureRedisStore();
    if (store) {
      try {
        return await store.get(key);
      } catch {
        this.redisStore = null;
      }
    }
    return this.memoryStore.get(key);
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const store = this.ensureRedisStore();
    if (store) {
      try {
        return await store.increment(key);
      } catch (err) {
        console.warn(`[RateLimiter:${this.prefix}] Redis increment error, falling back to memory:`, err instanceof Error ? err.message : err);
        this.redisStore = null;
      }
    }
    return this.memoryStore.increment(key);
  }

  async decrement(key: string): Promise<void> {
    const store = this.ensureRedisStore();
    if (store) {
      try {
        return await store.decrement(key);
      } catch {
        this.redisStore = null;
      }
    }
    return this.memoryStore.decrement(key);
  }

  async resetKey(key: string): Promise<void> {
    const store = this.ensureRedisStore();
    if (store) {
      try {
        await store.resetKey(key);
      } catch {
        this.redisStore = null;
      }
    }
    return this.memoryStore.resetKey(key);
  }

  async resetAll(): Promise<void> {
    const store = this.ensureRedisStore();
    if (store && typeof (store as any).resetAll === 'function') {
      try {
        await (store as any).resetAll();
      } catch {
        this.redisStore = null;
      }
    }
    return this.memoryStore.resetAll();
  }
}

// ─── Production-Grade Differentiated Rate Limiters ───

// 1. Login: 5 attempts per 15 minutes per IP (50 in dev/test)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore('login'),
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: 900,
  },
});

// 2. Register: 10 per hour per IP (100 in dev/test)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore('register'),
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many registration attempts. Please try again later.',
    retryAfter: 3600,
  },
});

// 3. Refresh: 30 per 15 minutes per IP
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore('refresh'),
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many token refresh attempts. Please try again later.',
    retryAfter: 900,
  },
});

// 4. Decision Evaluation: 30 evaluations per minute per IP / User
export const decisionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore('decision'),
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Decision evaluation rate limit exceeded. Please wait a few moments.',
    retryAfter: 60,
  },
});

// 5. Groq / AI Endpoint Protection: 10 requests per minute per IP / User
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore('ai'),
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'AI enrichment limit reached. Reverting to deterministic calculations.',
    retryAfter: 60,
  },
});

// 6. Location Autocomplete: 60 per minute per IP
export const locationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore('location'),
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many search requests. Please slow down.',
    retryAfter: 60,
  },
});

// 7. Background Idea Generation: 10 per hour per User ID
export const generateIdeasLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore('generate'),
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Generation limit reached. Resets in 1 hour.',
    retryAfter: 3600,
  },
});

// 8. Global API Protection: 120 per minute per IP
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRateLimitStore('global'),
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
    retryAfter: 60,
  },
});
