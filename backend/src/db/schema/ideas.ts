import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const effortLevelEnum = pgEnum('effort_level', ['low', 'medium', 'high']);

export const ideas = pgTable('ideas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  estimatedDailyEarn: integer('estimated_daily_earn').notNull(),
  estimatedWeeklyEarn: integer('estimated_weekly_earn').notNull(),
  effortLevel: effortLevelEnum('effort_level').notNull(),
  skillsRequired: text('skills_required').array().default([]),
  platformName: varchar('platform_name', { length: 100 }).notNull(),
  platformUrl: varchar('platform_url', { length: 500 }).notNull(),
  gettingStartedSteps: text('getting_started_steps').array().default([]),
  earningsBreakdown: text('earnings_breakdown').notNull(),
  citySpecificTip: text('city_specific_tip').notNull(),
  isSaved: boolean('is_saved').default(false),
  isDismissed: boolean('is_dismissed').default(false),
  generationTimestamp: timestamp('generation_timestamp').notNull(),
  ideaHash: varchar('idea_hash', { length: 64 }).notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('ideas_user_id_idx').on(table.userId),
  generatedAtIdx: index('ideas_generated_at_idx').on(table.generatedAt),
  isSavedIdx: index('ideas_is_saved_idx').on(table.isSaved),
  isDismissedIdx: index('ideas_is_dismissed_idx').on(table.isDismissed),
  userGeneratedIdx: index('ideas_user_generated_idx').on(table.userId, table.generatedAt),
}));

export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;
