import { createClient, RedisClientType } from 'redis';
import { env } from './env';

let redisClient: RedisClientType;

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    redisClient = createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            console.error('❌ Redis: max reconnect attempts reached');
            return new Error('Max reconnect attempts reached');
          }
          const delay = Math.min(retries * 200, 5000);
          console.warn(`⚠️ Redis: reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
        connectTimeout: 10000,
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
  const client = getRedisClient();
  if (!client.isOpen) {
    await client.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
}

// ─── Helper Methods ───

export async function redisGet(key: string): Promise<string | null> {
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
): Promise<void> {
  try {
    if (ttlSeconds) {
      await getRedisClient().setEx(key, ttlSeconds, value);
    } else {
      await getRedisClient().set(key, value);
    }
  } catch (error) {
    console.error(`Redis SET error for key "${key}":`, error);
  }
}

export async function redisDel(key: string): Promise<void> {
  try {
    await getRedisClient().del(key);
  } catch (error) {
    console.error(`Redis DEL error for key "${key}":`, error);
  }
}

export async function redisExists(key: string): Promise<boolean> {
  try {
    const result = await getRedisClient().exists(key);
    return result === 1;
  } catch (error) {
    console.error(`Redis EXISTS error for key "${key}":`, error);
    return false;
  }
}

export async function redisIncr(key: string): Promise<number> {
  try {
    return await getRedisClient().incr(key);
  } catch (error) {
    console.error(`Redis INCR error for key "${key}":`, error);
    return 0;
  }
}

export async function redisExpire(key: string, seconds: number): Promise<void> {
  try {
    await getRedisClient().expire(key, seconds);
  } catch (error) {
    console.error(`Redis EXPIRE error for key "${key}":`, error);
  }
}
