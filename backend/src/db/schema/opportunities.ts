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
  jsonb,
} from 'drizzle-orm/pg-core';

export const opportunities = pgTable('opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  platform: varchar('platform', { length: 100 }).notNull(),
  opportunityName: varchar('opportunity_name', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'delivery' | 'tutoring' | 'reselling' | 'services' | 'digital' | 'artisan'
  description: text('description').notNull(),
  requiredSkills: text('required_skills').array().notNull().default([]),
  minimumSkillLevel: varchar('minimum_skill_level', { length: 20 }).notNull().default('beginner'), // 'beginner' | 'intermediate' | 'advanced'
  supportedLocationTiers: text('supported_location_tiers').array().notNull().default(['tier1', 'tier2', 'tier3', 'pan_india']),
  supportedCities: text('supported_cities').array().default([]),
  eligibilityRequirements: text('eligibility_requirements').array().notNull().default([]),
  requiresVehicle: boolean('requires_vehicle').notNull().default(false),
  requiresSmartphone: boolean('requires_smartphone').notNull().default(true),
  minimumAge: integer('minimum_age').notNull().default(18),
  startupCostMin: integer('startup_cost_min').notNull().default(0),
  startupCostMax: integer('startup_cost_max').notNull().default(0),
  recurringCostMonthly: integer('recurring_cost_monthly').notNull().default(0),
  payoutModel: varchar('payout_model', { length: 50 }).notNull(), // 'per_order' | 'per_hour' | 'per_session' | 'per_client' | 'commission'
  estimatedPayoutMin: integer('estimated_payout_min').notNull(),
  estimatedPayoutMax: integer('estimated_payout_max').notNull(),
  platformFeePercent: integer('platform_fee_percent').notNull().default(0),
  typicalTimePerUnitMin: integer('typical_time_per_unit_min').notNull(),
  unitsPerHourTypical: real('units_per_hour_typical').notNull().default(1.5),
  demandLevel: varchar('demand_level', { length: 20 }).notNull().default('medium'), // 'low' | 'medium' | 'high' | 'surging'
  reliabilityScore: integer('reliability_score').notNull().default(85), // 0-100
  verificationStatus: varchar('verification_status', { length: 30 }).notNull().default('VERIFIED'), // 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED'
  sourceUrl: varchar('source_url', { length: 500 }).notNull(),
  sourceTitle: varchar('source_title', { length: 200 }).notNull(),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }).notNull().defaultNow(),
  verifiedFields: jsonb('verified_fields'),
  notes: text('notes'),
  restrictions: text('restrictions'),
  activeStatus: boolean('active_status').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  categoryIdx: index('opportunities_category_idx').on(table.category),
  activeIdx: index('opportunities_active_idx').on(table.activeStatus),
  platformIdx: index('opportunities_platform_idx').on(table.platform),
}));

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
