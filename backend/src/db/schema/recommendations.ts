import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  real,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const recommendations = pgTable('recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  targetDailyIncome: integer('target_daily_income').notNull(),
  availableHoursPerDay: real('available_hours_per_day').notNull(),
  availableCapital: integer('available_capital').notNull().default(0),
  hasVehicle: boolean('has_vehicle').notNull().default(false),
  experienceLevel: varchar('experience_level', { length: 20 }).notNull().default('beginner'),
  skills: text('skills').array().notNull().default([]),
  feasibilityVerdict: varchar('feasibility_verdict', { length: 30 }).notNull(), // 'FEASIBLE' | 'POSSIBLE_WITH_CHANGES' | 'UNLIKELY'
  feasibilityReason: text('feasibility_reason').notNull(),
  realisticCeilingMin: integer('realistic_ceiling_min').notNull(),
  realisticCeilingMax: integer('realistic_ceiling_max').notNull(),
  targetGap: integer('target_gap').notNull().default(0),
  rankedOpportunities: jsonb('ranked_opportunities').notNull(), // array of scored opportunities with financial models
  incomeMix: jsonb('income_mix'), // bundled opportunities to bridge gap
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('recommendations_user_id_idx').on(table.userId),
  cityIdx: index('recommendations_city_idx').on(table.city),
  createdAtIdx: index('recommendations_created_at_idx').on(table.createdAt),
}));

export type Recommendation = typeof recommendations.$inferSelect;
export type NewRecommendation = typeof recommendations.$inferInsert;
