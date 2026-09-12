import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import { env } from './env';
import * as schema from '../db/schema/index';

// ─── CONNECTION BUDGET CALCULATIONS ───
// FORMULA: INSTANCE_COUNT × POOL_SIZE_PER_INSTANCE + RESERVE <= MAX_DB_CONNECTIONS
const maxDbConnections = env.MAX_DB_CONNECTIONS;
const reservedConnections = env.RESERVED_CONNECTIONS;
const backendInstances = Math.max(1, env.BACKEND_INSTANCES);

export const APPLICATION_CONNECTION_BUDGET = Math.max(
  1,
  maxDbConnections - reservedConnections
);

export const POOL_SIZE_PER_INSTANCE =
  env.DATABASE_POOL_SIZE ||
  Math.max(2, Math.floor(APPLICATION_CONNECTION_BUDGET / backendInstances));

console.log(`[Database] Connection Budget Configured:
  MAX_DB_CONNECTIONS: ${maxDbConnections}
  RESERVED_CONNECTIONS (admin/migrations/bursts): ${reservedConnections}
  APPLICATION_CONNECTION_BUDGET: ${APPLICATION_CONNECTION_BUDGET}
  BACKEND_INSTANCES: ${backendInstances}
  POOL_SIZE_PER_INSTANCE: ${POOL_SIZE_PER_INSTANCE}
  TOTAL_APPLICATION_CONNECTIONS: ${backendInstances * POOL_SIZE_PER_INSTANCE} (Headroom: ${maxDbConnections - (backendInstances * POOL_SIZE_PER_INSTANCE)})`);

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: POOL_SIZE_PER_INSTANCE,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 5000,
  statement_timeout: env.STATEMENT_TIMEOUT_MS,
  // If Render or cloud database requires SSL with rejectUnauthorized: false
  ssl:
    env.NODE_ENV === 'production' && !env.DATABASE_URL.includes('localhost')
      ? { rejectUnauthorized: false }
      : undefined,
};

const pool = new Pool(poolConfig);

pool.on('error', (err: Error) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

export const db = drizzle(pool, { schema });

export const getDbPool = (): Pool => pool;
export const getPool = (): Pool => pool;

export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    maxAllowed: POOL_SIZE_PER_INSTANCE,
    activeCount: pool.totalCount - pool.idleCount,
    utilizationPercent: Math.round(
      ((pool.totalCount - pool.idleCount) / POOL_SIZE_PER_INSTANCE) * 100
    ),
  };
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ PostgreSQL connected');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ PostgreSQL connection failed:', message);
    return false;
  }
}
