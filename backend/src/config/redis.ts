import { createClient, RedisClientType } from 'redis';
import { env } from './env';

let redisClient: RedisClientType | null = null;
let isConnecting = false;

export function isRedisAvailable(): boolean {
  return Boolean(redisClient && redisClient.isOpen);
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    const isTls = env.REDIS_URL.startsWith('rediss://');
    redisClient = createClient({
      url: env.REDIS_URL,
      socket: {
        tls: isTls ? true : undefined,
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            console.error('❌ Redis: max reconnect attempts reached');
            return new Error('Max reconnect attempts reached');
          }
          const delay = Math.min(retries * 200, 5000);
          console.warn(`⚠️ Redis: reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
        connectTimeout: 8000,
      },
    });

    redisClient.on('error', (err: Error) => {
      console.error('Redis client error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redisClient.on('reconnecting', () => {
      console.warn('⚠️ Redis reconnecting...');
    });
  }

  return redisClient;
}

export async function connectRedis(): Promise<void> {
  if (isConnecting) return;
  isConnecting = true;
  try {
    const client = getRedisClient();
    if (!client.isOpen) {
      await client.connect();
    }
  } finally {
    isConnecting = false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

// ─── Helper Methods with Error and Latency Protection ───

export async function redisGet(key: string): Promise<string | null> {
  if (!isRedisAvailable()) return null;
  try {
    return await getRedisClient().get(key);
  } catch (error) {
    console.error(`Redis GET error for key "${key}":`, error);
    return null;
  }
}

export async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> {
  if (!isRedisAvailable()) return false;
  try {
    if (ttlSeconds) {
      await getRedisClient().setEx(key, ttlSeconds, value);
    } else {
      await getRedisClient().set(key, value);
    }
    return true;
  } catch (error) {
    console.error(`Redis SET error for key "${key}":`, error);
    return false;
  }
}

export async function redisDel(key: string): Promise<boolean> {
  if (!isRedisAvailable()) return false;
  try {
    await getRedisClient().del(key);
    return true;
  } catch (error) {
    console.error(`Redis DEL error for key "${key}":`, error);
    return false;
  }
}

export async function redisExists(key: string): Promise<boolean> {
  if (!isRedisAvailable()) return false;
  try {
    const result = await getRedisClient().exists(key);
    return result === 1;
  } catch (error) {
    console.error(`Redis EXISTS error for key "${key}":`, error);
    return false;
  }
}

export async function redisIncr(key: string): Promise<number> {
  if (!isRedisAvailable()) return 0;
  try {
    return await getRedisClient().incr(key);
  } catch (error) {
    console.error(`Redis INCR error for key "${key}":`, error);
    return 0;
  }
}

export async function redisExpire(key: string, seconds: number): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    await getRedisClient().expire(key, seconds);
  } catch (error) {
    console.error(`Redis EXPIRE error for key "${key}":`, error);
  }
}

// ─── Token Revocation Storage (Multi-Instance Safe) ───

/**
 * Marks all access tokens for a user issued before now as revoked in Redis.
 * TTL is 15 minutes (900 seconds), equal to access-token lifespan.
 */
export async function markUserTokensRevoked(userId: string): Promise<void> {
  const revocationTimestamp = Date.now().toString();
  await redisSet(`auth:revocation:${userId}`, revocationTimestamp, 900);
}

/**
 * Checks if a token issued at `iatSeconds` has been revoked.
 * Returns:
 *  - 'REVOKED' if explicitly revoked
 *  - 'ACTIVE' if valid and active
 *  - 'UNAVAILABLE' if Redis is offline (caller should use fail-closed fallback)
 */
export async function checkTokenRevocationStatus(
  userId: string,
  iatSeconds: number
): Promise<'REVOKED' | 'ACTIVE' | 'UNAVAILABLE'> {
  if (!isRedisAvailable()) {
    return 'UNAVAILABLE';
  }
  try {
    const revokedTimestamp = await redisGet(`auth:revocation:${userId}`);
    if (!revokedTimestamp) {
      return 'ACTIVE';
    }
    const revokedAt = parseInt(revokedTimestamp, 10);
    // If token was issued before or at the revocation timestamp, it is revoked
    if (iatSeconds * 1000 <= revokedAt) {
      return 'REVOKED';
    }
    return 'ACTIVE';
  } catch {
    return 'UNAVAILABLE';
  }
}
