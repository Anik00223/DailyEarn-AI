// Always-live server with graceful shutdown, auto-reconnect, and health monitoring
import 'dotenv/config';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { ideasRouter } from './modules/ideas/ideas.routes';
import { userRouter } from './modules/user/user.routes';
import { locationsRouter } from './modules/locations/locations.routes';
import { connectRedis, disconnectRedis, getRedisClient } from './config/redis';
import { testDatabaseConnection, getDbPool } from './config/database';
import { initializeWorker } from './queues/workers/ideaWorker';
import { monitor } from './utils/monitor';

const app = express();
let server: ReturnType<typeof app.listen> | null = null;

// Graceful shutdown
let shuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (shuttingDown) {
    console.warn('?? Received ' + signal + ' again - forcing exit');
    process.exit(1);
  }
  shuttingDown = true;
  console.log('\n?? Received ' + signal + ' - shutting down gracefully...');

  if (server) {
    server.close(async (err: Error | undefined) => {
      if (err) {
        console.error('? Error closing server:', err.message);
        process.exit(1);
      }
      console.log('? HTTP server closed');
      try {
        const pool = getDbPool();
        await pool.end();
        console.log('? PostgreSQL pool closed');
      } catch (e: unknown) {
        console.error('? Error closing DB pool:', e instanceof Error ? e.message : e);
      }
      try {
        await disconnectRedis();
        console.log('? Redis disconnected');
      } catch (e: unknown) {
        console.error('? Error disconnecting Redis:', e instanceof Error ? e.message : e);
      }
      console.log('? Shutdown complete');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('?? Forced shutdown after timeout');
      process.exit(1);
    }, 15000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Keep process alive on unexpected errors
process.on('uncaughtException', (error: Error) => {
  console.error(JSON.stringify({
    level: 'error',
    type: 'uncaughtException',
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  }));
});

process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error(JSON.stringify({
    level: 'error',
    type: 'unhandledRejection',
    message: msg,
    timestamp: new Date().toISOString(),
  }));
});

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", env.CORS_ORIGIN],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(requestIdMiddleware);
app.use(globalLimiter);

// Enhanced health check
async function computeHealthChecks() {
  const checks: Record<string, string> = {};
  try {
    const pool = getDbPool();
    await pool.query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }
  try {
    const client = getRedisClient();
    if (client.isOpen) {
      await client.ping();
      checks.redis = 'ok';
    } else {
      checks.redis = 'connecting';
    }
  } catch {
    checks.redis = 'error';
  }
  const allOk = Object.values(checks).every((v) => v === 'ok');
  return { allOk, checks };
}

// API health endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  const { allOk, checks } = await computeHealthChecks();
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    db: checks.database === 'ok',
    redis: checks.redis === 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  });
});

// Root health endpoint used by Docker/Nginx (keeps backwards compatibility)
app.get('/health', async (_req: Request, res: Response) => {
  const { allOk, checks } = await computeHealthChecks();
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    db: checks.database === 'ok',
    redis: checks.redis === 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  });
});

// Monitor endpoint for PM2 / load balancer
app.get('/api/monitor', (_req: Request, res: Response) => {
  res.json(monitor());
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/user', userRouter);
app.use('/api/locations', locationsRouter);

app.use('/{*splat}', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' });
});

app.use(errorHandler);

// Start with retry loop
async function startServer(): Promise<void> {
  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        retryCount++;
        const waitMs = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.warn('?? DB connection failed - retry ' + retryCount + '/' + maxRetries + ' in ' + waitMs + 'ms');
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      try {
        await connectRedis();
      } catch {
        console.warn('?? Redis connection failed - rate limiting may not work');
      }
      initializeWorker();

      server = app.listen(env.PORT, () => {
        console.log('?? DailyEarn AI backend running on port ' + env.PORT);
        console.log('?? Environment: ' + env.NODE_ENV);
        console.log('?? CORS origin: ' + env.CORS_ORIGIN);
        console.log('?? PID: ' + process.pid);
      });

      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.error('? Port ' + env.PORT + ' already in use');
          setTimeout(() => process.exit(0), 1000);
        }
      });

      retryCount = 0;
      return;
    } catch (error) {
      retryCount++;
      const waitMs = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.error('? Start failed (attempt ' + retryCount + '/' + maxRetries + '):', error);
      if (retryCount >= maxRetries) {
        console.error('? Max retries exhausted - exiting so PM2 can restart');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

startServer();

export default app;