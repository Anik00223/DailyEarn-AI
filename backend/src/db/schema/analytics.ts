import {
  pgTable,
  pgEnum,
  uuid,
  inet,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const eventTypeEnum = pgEnum('event_type', [
  'idea_generated',
  'idea_saved',
  'idea_dismissed',
  'idea_clicked',
  'user_login',
]);

export const analytics = pgTable('analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  eventType: eventTypeEnum('event_type').notNull(),
  ideaId: uuid('idea_id'),
  metadata: jsonb('metadata'),
  ipAddress: inet('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('analytics_user_id_idx').on(table.userId),
  eventTypeIdx: index('analytics_event_type_idx').on(table.eventType),
  createdAtIdx: index('analytics_created_at_idx').on(table.createdAt),
  userEventIdx: index('analytics_user_event_idx').on(table.userId, table.eventType),
  userCreatedIdx: index('analytics_user_created_idx').on(table.userId, table.createdAt),
}));

export type AnalyticsEvent = typeof analytics.$inferSelect;
export type NewAnalyticsEvent = typeof analytics.$inferInsert;
