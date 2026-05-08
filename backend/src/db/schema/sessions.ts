import {
  pgTable,
  uuid,
  varchar,
  text,
  inet,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).unique().notNull(),
  tokenFamily: varchar('token_family', { length: 64 }).notNull(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  isRevoked: boolean('is_revoked').default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  tokenFamilyIdx: index('sessions_token_family_idx').on(table.tokenFamily),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  userCreatedIdx: index('sessions_user_created_idx').on(table.userId, table.createdAt),
}));

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
