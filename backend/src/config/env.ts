import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Ensure .env is loaded regardless of execution CWD
const envFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
];
for (const f of envFiles) {
  if (fs.existsSync(f)) {
    dotenv.config({ path: f });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (add Render PostgreSQL Internal Connection String)'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  GROQ_API_KEY: z
    .string()
    .default('')
    .transform((val) => (val ? val.trim().replace(/^['"]|['"]$/g, '') : '')),
  GROQ_MODEL: z
    .string()
    .default('qwen/qwen3.8-27b')
    .transform((val) => val.trim().replace(/^['"]|['"]$/g, '')),
  JWT_ACCESS_SECRET: z
    .string()
    .default('dailyearn_default_access_secret_min_64_chars_for_security_and_render_0123456789'),
  JWT_REFRESH_SECRET: z
    .string()
    .default('dailyearn_default_refresh_secret_min_64_chars_for_security_and_render_0123456789'),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  CORS_ORIGIN: z.string().default('*'),
  ADMIN_SECRET: z.string().default('dailyearn_admin_secret_minimum_32_chars_1234'),
  // Scale & Database Connection Budgeting
  MAX_DB_CONNECTIONS: z.string().default('100').transform(Number),
  RESERVED_CONNECTIONS: z.string().default('20').transform(Number),
  BACKEND_INSTANCES: z.string().default('1').transform(Number),
  DATABASE_POOL_SIZE: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  STATEMENT_TIMEOUT_MS: z.string().default('5000').transform(Number),
  // Groq & Circuit Breaker Limits
  GROQ_TIMEOUT_MS: z.string().default('8000').transform(Number),
  CIRCUIT_BREAKER_FAIL_THRESHOLD: z.string().default('5').transform(Number),
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: z.string().default('30000').transform(Number),
  // NVIDIA Secondary AI Provider
  NVIDIA_API_KEY: z
    .string()
    .default('')
    .transform((val) => (val ? val.trim().replace(/^['"]|['"]$/g, '') : '')),
  NVIDIA_MODEL: z
    .string()
    .default('meta/llama-3.2-11b-vision-instruct')
    .transform((val) => val.trim().replace(/^['"]|['"]$/g, '')),
  NVIDIA_BASE_URL: z
    .string()
    .default('https://integrate.api.nvidia.com/v1')
    .transform((val) => val.trim().replace(/\/+$/, '')),
  NVIDIA_TIMEOUT_MS: z.string().default('20000').transform(Number),
  NVIDIA_CIRCUIT_BREAKER_FAIL_THRESHOLD: z.string().default('5').transform(Number),
  NVIDIA_CIRCUIT_BREAKER_RESET_TIMEOUT_MS: z.string().default('30000').transform(Number),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Missing required environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  console.error(
    '\n👉 TIP: In your Render Dashboard, go to your Web Service -> "Environment" tab and add DATABASE_URL (copied from your Render PostgreSQL "Internal Database URL").'
  );
  process.exit(1);
}

export const env: Env = parsed.data;

export function getGroqApiKey(): string {
  const key =
    process.env.GROQ_API_KEY ||
    process.env.GROQ_KEY ||
    process.env.GROQ_API_TOKEN ||
    env?.GROQ_API_KEY ||
    '';
  return key.trim().replace(/^['"]|['"]$/g, '');
}

export function isGroqConfigured(): boolean {
  const key = getGroqApiKey();
  if (!key) return false;
  if (
    key.includes('placeholder') ||
    key.includes('your_groq_api_key') ||
    key.includes('your_') ||
    key === 'gsk_placeholder_for_render_deterministic_fallback'
  ) {
    return false;
  }
  return key.startsWith('gsk_') || key.length >= 20;
}

export function getNvidiaApiKey(): string {
  const key =
    process.env.NVIDIA_API_KEY ||
    process.env.NVIDIA_KEY ||
    process.env.NVIDIA_API_TOKEN ||
    env?.NVIDIA_API_KEY ||
    '';
  return key.trim().replace(/^['"]|['"]$/g, '');
}

export function isNvidiaConfigured(): boolean {
  const key = getNvidiaApiKey();
  if (!key) return false;
  if (
    key.includes('placeholder') ||
    key.includes('your_nvidia_api_key') ||
    key.includes('your_') ||
    key === 'nvapi_placeholder_for_render_fallback'
  ) {
    return false;
  }
  return key.startsWith('nvapi-') || key.length >= 20;
}

