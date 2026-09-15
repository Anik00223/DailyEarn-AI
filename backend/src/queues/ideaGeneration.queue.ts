import Bull from 'bull';
import { env } from '../config/env';

export interface IdeaJobData {
  prompt: string;
  userId: string;
}

export interface IdeaJobResult {
  rawResponse: string;
  userId: string;
}

/**
 * Lazy Bull queue singleton.
 *
 * The queue is only constructed when Redis is expected to be reachable, so a
 * Redis-offline boot never creates ioredis clients whose connection failures
 * surface as empty unhandledRejection crashes. Access via getIdeaQueue()
 * returns null when the queue is unavailable; callers fall back to direct
 * in-process AI generation.
 */
let queue: Bull.Queue<IdeaJobData> | null = null;
let queueInitFailed = false;

function buildQueue(): Bull.Queue<IdeaJobData> {
  const redisUrl = new URL(env.REDIS_URL);
  const q = new Bull<IdeaJobData>('idea-generation', {
    redis: {
      host: redisUrl.hostname || '127.0.0.1',
      port: redisUrl.port ? parseInt(redisUrl.port, 10) : 6379,
      password: redisUrl.password || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times: number) => {
        if (times > 2) return null; // Stop reconnecting after 2 tries if Redis unavailable
        return Math.min(times * 300, 1000);
      },
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 50,
      removeOnFail: 100,
      timeout: 35000,
    },
  });

  // All Bull/ioredis client errors land here as handled events — they must
  // never escape as unhandled promise rejections.
  q.on('error', () => {
    if (!queueInitFailed) {
      queueInitFailed = true;
      console.warn('⚠️ Bull queue unavailable (Redis offline) — idea jobs use direct in-process generation');
    }
  });
  (q as unknown as { on(event: string, handler: (...args: unknown[]) => void): void }).on(
    'failed',
    (job: unknown, err: unknown) => {
      const id = (job as { id?: unknown } | null)?.id ?? '?';
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Job ${String(id)} failed:`, message);
    }
  );
  q.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  return q;
}

/**
 * Returns true when a Bull queue should be attempted. If REDIS_URL is
 * missing/placeholder or explicitly points at localhost in production, the
 * queue is skipped entirely (no ioredis clients are ever created).
 */
export function isQueueAvailable(): boolean {
  if (queueInitFailed) return false;
  if (!env.REDIS_URL) return false;
  if (env.NODE_ENV === 'production' && /(localhost|127\.0\.0\.1)/.test(env.REDIS_URL)) return false;
  return true;
}

export function getIdeaQueue(): Bull.Queue<IdeaJobData> | null {
  if (!isQueueAvailable()) return null;
  if (!queue) {
    try {
      queue = buildQueue();
    } catch (error) {
      queueInitFailed = true;
      console.warn(
        '⚠️ Bull queue init failed — idea jobs use direct in-process generation:',
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  return queue;
}

/** Back-compat export — prefer getIdeaQueue() (null-safe) in new code. */
export function getIdeaQueueOrThrow(): Bull.Queue<IdeaJobData> {
  const q = getIdeaQueue();
  if (!q) throw new Error('Bull queue unavailable (Redis offline)');
  return q;
}
