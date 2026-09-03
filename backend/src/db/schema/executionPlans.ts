import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { recommendations } from './recommendations';

export const executionPlans = pgTable('execution_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  recommendationId: uuid('recommendation_id').references(() => recommendations.id, { onDelete: 'cascade' }),
  opportunitySlug: varchar('opportunity_slug', { length: 100 }).notNull(),
  opportunityName: varchar('opportunity_name', { length: 200 }).notNull(),
  platform: varchar('platform', { length: 100 }).notNull(),
  targetDailyEarn: varchar('target_daily_earn', { length: 50 }).notNull(),
  days: jsonb('days').notNull(), // array of 7 day plan objects { dayNumber, title, focus, actionItems, estimatedMinutes, completed }
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('execution_plans_user_id_idx').on(table.userId),
  opportunityIdx: index('execution_plans_opportunity_idx').on(table.opportunitySlug),
}));

export type ExecutionPlan = typeof executionPlans.$inferSelect;
export type NewExecutionPlan = typeof executionPlans.$inferInsert;
