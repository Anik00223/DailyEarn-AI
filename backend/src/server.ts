// Production-hardened server with graceful shutdown, telemetry, liveness/readiness probes, and strict security
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
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
import { decisionRouter } from './modules/decision/decision.routes';
import { seedOpportunities } from './db/seeds/seed';
import { connectRedis, disconnectRedis, isRedisAvailable } from './config/redis';
import { testDatabaseConnection, getDbPool, getPoolStats } from './config/database';
import { getGroqMetrics } from './config/groq';
import { initializeWorker } from './queues/workers/ideaWorker';
import { monitor } from './utils/monitor';
import { db } from './db';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import fs from 'fs';

const app = express();
let server: ReturnType<typeof app.listen> | null = null;

// Graceful shutdown
let shuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (shuttingDown) {
    console.warn('⚠️ Received ' + signal + ' again - forcing exit');
    process.exit(1);
  }
  shuttingDown = true;
  console.log(`\n🛑 Received ${signal} - shutting down gracefully...`);

  if (server) {
    server.close(async (err: Error | undefined) => {
      if (err) {
        console.error('❌ Error closing server:', err.message);
        process.exit(1);
      }
      console.log('✅ HTTP server closed');
      try {
        const pool = getDbPool();
        await pool.end();
        console.log('✅ PostgreSQL pool closed');
      } catch (e: unknown) {
        console.error('❌ Error closing DB pool:', e instanceof Error ? e.message : e);
      }
      try {
        await disconnectRedis();
        console.log('✅ Redis disconnected');
      } catch (e: unknown) {
        console.error('❌ Error disconnecting Redis:', e instanceof Error ? e.message : e);
      }
      console.log('✅ Shutdown complete');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('⚠️ Forced shutdown after timeout');
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

// ─── STRICT PRODUCTION CORS POLICY ───
// Reject '*' when credentials are enabled. Match ONLY configured origins.
const configuredOrigins = env.CORS_ORIGIN.split(',')
  .map((o) => o.trim())
  .filter((o) => o && o !== '*');

const defaultProductionOrigins = [
  'https://dailyearn-frontend.onrender.com',
  'https://dailyearn-ai-2.onrender.com',
  'https://dailyearn-ai-1.onrender.com',
];
for (const origin of defaultProductionOrigins) {
  if (!configuredOrigins.includes(origin)) {
    configuredOrigins.push(origin);
  }
}

export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // Allow same-origin / server-to-server / curl
  if (env.NODE_ENV !== 'production') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true;
    }
  }
  if (configuredOrigins.includes(origin)) {
    return true;
  }
  // Allow official DailyEarn Render domain patterns
  if (/^https:\/\/dailyearn(-[a-z0-9]+)*\.onrender\.com$/.test(origin)) {
    return true;
  }
  return false;
};

// ─── SECURITY HEADERS (HELMET) ───
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          ...configuredOrigins,
          'https://*.onrender.com',
          ...(env.NODE_ENV !== 'production'
            ? ['http://localhost:*', 'http://127.0.0.1:*', 'ws://localhost:*', 'ws://127.0.0.1:*']
            : []),
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
  })
);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    // Reject by omitting access-control headers without throwing unhandled server error
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  maxAge: 86400, // 24 hours preflight cache
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(requestIdMiddleware);

// ─── OBSERVABILITY & TELEMETRY LOGGER ───
// Structured JSON logs with latency, status, route, and pool utilization (Never logging secrets/auth)
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // Skip noisy probe logging
    if (req.path === '/health/liveness') return;

    const logEntry = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      requestId: req.id,
      method: req.method,
      route: req.baseUrl ? `${req.baseUrl}${req.path}` : req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    };
    if (res.statusCode >= 500) {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  });
  next();
});

// ─── HEALTH & READINESS PROBES (SEPARATED) ───

// 1. Liveness Probe: Fast, lightweight check indicating process is alive (No DB query)
app.get('/health/liveness', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 2. Readiness Probe: Checks critical dependencies (PostgreSQL pool readiness)
app.get('/health/readiness', async (_req: Request, res: Response) => {
  try {
    const pool = getDbPool();
    await pool.query('SELECT 1');
    const poolStats = getPoolStats();
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      pool: poolStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown DB error';
    res.status(503).json({
      status: 'not_ready',
      database: 'error',
      error: msg,
      timestamp: new Date().toISOString(),
    });
  }
});

// 3. API Health endpoint (Backward-compatible comprehensive diagnostic)
app.get(['/api/health', '/health'], async (_req: Request, res: Response) => {
  let dbOk = false;
  try {
    const pool = getDbPool();
    await pool.query('SELECT 1');
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const redisOk = isRedisAvailable();
  const poolStats = getPoolStats();
  const groqMetrics = getGroqMetrics();

  const isHealthy = dbOk; // Database is the authoritative critical service
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? (redisOk ? 'ok' : 'degraded') : 'unhealthy',
    database: dbOk ? 'ok' : 'error',
    redis: redisOk ? 'ok' : 'degraded',
    pool: poolStats,
    groq: {
      circuitState: groqMetrics.circuitState,
      failureCount: groqMetrics.failureCount,
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Monitor endpoint for system resources
app.get('/api/monitor', (_req: Request, res: Response) => {
  res.json({
    ...monitor(),
    pool: getPoolStats(),
    groq: getGroqMetrics(),
  });
});

// Apply Global Rate Limiter to business routes
app.use(globalLimiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/decision', decisionRouter);
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
        console.warn(`⚠️ DB connection attempt failed - retry ${retryCount}/${maxRetries} in ${waitMs}ms`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      let redisOk = false;
      try {
        await connectRedis();
        redisOk = true;
      } catch {
        console.warn('⚠️ Redis connection failed - distributed rate limiting will use in-memory fallback');
      }
      if (redisOk) {
        initializeWorker();
      }

      // Automatically synchronize PostgreSQL schema on startup if needed
      try {
        const candidateFolders = [
          path.resolve(__dirname, '../drizzle'),
          path.resolve(process.cwd(), 'drizzle'),
          path.resolve(process.cwd(), 'backend/drizzle'),
        ];
        const migrationsFolder = candidateFolders.find((f) => fs.existsSync(f));
        if (migrationsFolder) {
          await migrate(db, { migrationsFolder });
          console.log('✅ PostgreSQL schema synchronized');
        }
      } catch (migErr) {
        console.warn('⚠️ Schema migration notice:', migErr instanceof Error ? migErr.message : migErr);
      }

      await seedOpportunities();

      server = app.listen(env.PORT, '0.0.0.0', () => {
        console.log(`[Server] DailyEarn AI backend listening on 0.0.0.0:${env.PORT}`);
        console.log(`[Server] Environment: ${env.NODE_ENV}`);
        console.log(`[Server] CORS origins allowed: ${configuredOrigins.join(', ')}`);
        console.log(`[Server] Database: connected (Pool size: ${getPoolStats().maxAllowed})`);
        console.log(`[Server] PID: ${process.pid}`);

        // Keep-alive self-ping for Render / Cloud deployments (prevents 15-min idle spin-down)
        const renderUrl =
          process.env.RENDER_EXTERNAL_URL ||
          (env.NODE_ENV === 'production' ? 'https://dailyearn-ai-1.onrender.com' : null);

        if (renderUrl) {
          const TEN_MINUTES_MS = 10 * 60 * 1000;
          setInterval(async () => {
            try {
              const https = await import('https');
              const targetUrl = `${renderUrl.replace(/\/$/, '')}/health/liveness`;
              https.get(targetUrl, (res) => {
                if (res.statusCode && res.statusCode < 400) {
                  console.log(`[KeepAlive] Ping successful: HTTP ${res.statusCode} at ${new Date().toISOString()}`);
                }
              }).on('error', (err) => {
                console.warn('[KeepAlive] Ping notice:', err.message);
              });
            } catch {
              // Ignore keep-alive error
            }
          }, TEN_MINUTES_MS);
          console.log(`[KeepAlive] 10-minute keep-alive ping active for ${renderUrl}`);
        }
      });

      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.error('❌ Port ' + env.PORT + ' already in use');
          setTimeout(() => process.exit(0), 1000);
        }
      });

      retryCount = 0;
      return;
    } catch (error) {
      retryCount++;
      const waitMs = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.error('❌ Start failed (attempt ' + retryCount + '/' + maxRetries + '):', error);
      if (retryCount >= maxRetries) {
        console.error('❌ Max retries exhausted - exiting so process manager can restart');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

startServer();

export default app;