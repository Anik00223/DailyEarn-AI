import { z } from 'zod';

export const generateIdeasSchema = z.object({
  city: z.string().min(2, 'City is too short').max(100).trim(),
  state: z.string().min(2, 'State is too short').max(100).trim(),
  skills: z
    .array(z.string().max(50).trim())
    .min(1, 'At least one skill is required')
    .max(10, 'Maximum 10 skills allowed'),
  dailyGoal: z.number().int().min(100).max(10000).default(500),
  language: z.enum(['en', 'hi', 'bn', 'te', 'ta', 'mr']).default('en'),
  count: z.number().int().min(1).max(10).default(5),
});

export const paginationSchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('10').transform(Number),
});

export type GenerateIdeasInput = z.infer<typeof generateIdeasSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// Zod schema for validating Gemini response
export const geminiIdeaSchema = z.object({
  title: z.string().max(200),
  description: z.string(),
  estimated_daily_earn: z.number().int().min(0),
  estimated_weekly_earn: z.number().int().min(0),
  effort_level: z.enum(['low', 'medium', 'high']),
  skills_required: z.array(z.string()),
  platform_name: z.string(),
  platform_url: z.string(),
  getting_started_steps: z.array(z.string()),
  earnings_breakdown: z.string(),
  city_specific_tip: z.string(),
});

export const geminiResponseSchema = z.object({
  ideas: z.array(geminiIdeaSchema),
});

export type GeminiIdea = z.infer<typeof geminiIdeaSchema>;
