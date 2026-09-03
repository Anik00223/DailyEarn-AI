import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (add Render PostgreSQL Internal Connection String)'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  GROQ_API_KEY: z.string().default('gsk_placeholder_for_render_deterministic_fallback'),
  JWT_ACCESS_SECRET: z
    .string()
    .default('dailyearn_default_access_secret_min_64_chars_for_security_and_render_0123456789'),
  JWT_REFRESH_SECRET: z
    .string()
    .default('dailyearn_default_refresh_secret_min_64_chars_for_security_and_render_0123456789'),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
  CORS_ORIGIN: z.string().default('*'),
  ADMIN_SECRET: z.string().default('dailyearn_admin_secret_minimum_32_chars_1234'),
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
