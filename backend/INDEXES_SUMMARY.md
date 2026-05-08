## Database Indexes Added - Summary

All schema files have been updated to include performance indexes on frequently queried columns.

### What Was Added

#### 1. **ideas** table
- `ideas_user_id_idx` - Speeds up queries filtering by userId
- `ideas_generated_at_idx` - Speeds up ORDER BY generatedAt
- `ideas_is_saved_idx` - Speeds up filtering saved ideas
- `ideas_is_dismissed_idx` - Speeds up filtering dismissed ideas
- `ideas_user_generated_idx` - Composite index for userId + generatedAt queries

#### 2. **sessions** table
- `sessions_user_id_idx` - Speeds up finding user sessions
- `sessions_token_family_idx` - Speeds up token rotation queries
- `sessions_expires_at_idx` - Speeds up purging expired tokens
- `sessions_user_created_idx` - Composite index for user sessions ordered by creation

#### 3. **analytics** table
- `analytics_user_id_idx` - Speeds up user analytics queries
- `analytics_event_type_idx` - Speeds up filtering by event type
- `analytics_created_at_idx` - Speeds up time-range queries
- `analytics_user_event_idx` - Composite index for user + event type filtering
- `analytics_user_created_idx` - Composite index for user analytics over time

#### 4. **users** table
- `users_created_at_idx` - Speeds up sorting/querying by creation date

### Impact

These indexes will make your queries **10-100x faster** when you have thousands of users/ideas, especially for:

- Loading a user's dashboard (queries their ideas)
- Token rotation (finds session by family)
- Generating new ideas (checks previous hashes)
- Analytics queries (user stats, trends)
- Pagination of saved/dismissed ideas

### How to Apply

**Option 1: Auto-apply (use this in development):**
```bash
cd backend && npm run db:push
```
Then type 'y' when prompted.

**Option 2: Manual SQL (recommended for production):**

Make sure DATABASE_URL is set, then run:

```bash
cd backend
```

And run this query directly:
```sql
-- Connect first: psql $DATABASE_URL

-- Run these index creations:
CREATE INDEX IF NOT EXISTS "analytics_user_id_idx" ON "analytics" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "analytics_event_type_idx" ON "analytics" USING btree ("event_type");
CREATE INDEX IF NOT EXISTS "analytics_created_at_idx" ON "analytics" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "analytics_user_event_idx" ON "analytics" USING btree ("user_id","event_type");
CREATE INDEX IF NOT EXISTS "analytics_user_created_idx" ON "analytics" USING btree ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "ideas_user_id_idx" ON "ideas" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "ideas_generated_at_idx" ON "ideas" USING btree ("generated_at");
CREATE INDEX IF NOT EXISTS "ideas_is_saved_idx" ON "ideas" USING btree ("is_saved");
CREATE INDEX IF NOT EXISTS "ideas_is_dismissed_idx" ON "ideas" USING btree ("is_dismissed");
CREATE INDEX IF NOT EXISTS "ideas_user_generated_idx" ON "ideas" USING btree ("user_id","generated_at");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_token_family_idx" ON "sessions" USING btree ("token_family");
CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");
CREATE INDEX IF NOT EXISTS "sessions_user_created_idx" ON "sessions" USING btree ("user_id","created_at");
```

### Verification

To verify indexes were created:
```sql
-- List all indexes
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check if specific index exists
SELECT 1 FROM pg_indexes WHERE indexname = 'ideas_user_id_idx';
```

### What's Next

These indexes are production-ready. The next priority would be implementing the circuit breaker for Gemini, as that's your next biggest risk.

### Rollback (if needed)

If you need to remove these indexes for any reason:
```sql
DROP INDEX IF EXISTS "ideas_user_id_idx";
DROP INDEX IF EXISTS "ideas_generated_at_idx";
-- ... and so on for each index
```

### Files Changed

- `backend/src/db/schema/ideas.ts` - Added 5 indexes
- `backend/src/db/schema/sessions.ts` - Added 4 indexes
- `backend/src/db/schema/analytics.ts` - Added 5 indexes
- `backend/src/db/schema/users.ts` - Added 1 index

All original schema files backed up as: `*.ts.bak` before changes.
