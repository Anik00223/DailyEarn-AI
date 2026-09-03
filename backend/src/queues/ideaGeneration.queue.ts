import Bull from 'bull';
import { env } from '../config/env';

const redisUrl = new URL(env.REDIS_URL);
const redisOpts = {
  host: redisUrl.hostname || '127.0.0.1',
  port: redisUrl.port ? parseInt(redisUrl.port, 10) : 6379,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    if (times > 2) return null; // Stop reconnecting after 2 tries if Redis unavailable
    return Math.min(times * 300, 1000);
  },
};

export const ideaQueue = new Bull('idea-generation', {
  redis: redisOpts,
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

let bullLogged = false;
ideaQueue.on('error', (error: Error) => {
  if (!bullLogged) {
    console.warn('⚠️ Bull queue background worker disabled (Redis offline — running in memory):', error.message);
    bullLogged = true;
  }
});

ideaQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

ideaQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});
