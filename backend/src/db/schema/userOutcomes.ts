import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  real,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const userOutcomes = pgTable('user_outcomes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  opportunitySlug: varchar('opportunity_slug', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  attempted: boolean('attempted').notNull().default(true),
  firstStepCompleted: boolean('first_step_completed').notNull().default(false),
  predictedDailyIncome: integer('predicted_daily_income').notNull(),
  actualDailyEarned: integer('actual_daily_earned').notNull().default(0),
  hoursSpent: real('hours_spent').notNull().default(0),
  costsIncurred: integer('costs_incurred').notNull().default(0),
  wasEstimateAccurate: boolean('was_estimate_accurate'),
  predictionErrorAmount: integer('prediction_error_amount'), // actual - predicted
  feedbackNotes: text('feedback_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('user_outcomes_user_id_idx').on(table.userId),
  opportunityIdx: index('user_outcomes_opportunity_idx').on(table.opportunitySlug),
  cityIdx: index('user_outcomes_city_idx').on(table.city),
}));

export type UserOutcome = typeof userOutcomes.$inferSelect;
export type NewUserOutcome = typeof userOutcomes.$inferInsert;
