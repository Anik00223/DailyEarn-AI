import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../config/redis';

/**
 * Create a Redis-backed store if Redis client is connected.
 * Falls back to undefined (in-memory store) when Redis is unavailable so
 * the server can still run in development without Redis.
 */
function createRedisStore(prefix: string): RedisStore | undefined {
  try {
    const client = getRedisClient();
    // If client isn't open yet, don't attempt to use it synchronously
    if (!client || !('isOpen' in client) || !client.isOpen) {
      return undefined;
    }

    return new RedisStore({
      sendCommand: (...args: string[]) => client.sendCommand(args),
      prefix: `rl:${prefix}:`,
    });
  } catch (err) {
    // If anything goes wrong, log and fall back to default memory store
    // (express-rate-limit will use its in-memory store when `store` is undefined).
    // Avoid throwing here to prevent bringing down the server during startup.
    // eslint-disable-next-line no-console
    console.warn('⚠️ Redis store unavailable for rate limiter, using in-memory fallback');
    return undefined;
  }
}

// 5 per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // store: createRedisStore('login'),
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts. Please try again later.',
    retryAfter: 900,
  },
});

// 3 per hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('register'),
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many registration attempts. Please try again later.',
    retryAfter: 3600,
  },
});

// 10 per hour per authenticated user ID
export const generateIdeasLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('generate'),
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

// 100 per minute per IP
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('global'),
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests',
    retryAfter: 60,
  },
});
