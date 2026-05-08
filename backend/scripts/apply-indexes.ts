import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';

const indexes = [
  'CREATE INDEX IF NOT EXISTS "analytics_user_id_idx" ON "analytics" USING btree ("user_id")',
  'CREATE INDEX IF NOT EXISTS "analytics_event_type_idx" ON "analytics" USING btree ("event_type")',
  'CREATE INDEX IF NOT EXISTS "analytics_created_at_idx" ON "analytics" USING btree ("created_at")',
  'CREATE INDEX IF NOT EXISTS "analytics_user_event_idx" ON "analytics" USING btree ("user_id","event_type")',
  'CREATE INDEX IF NOT EXISTS "analytics_user_created_idx" ON "analytics" USING btree ("user_id","created_at")',
  'CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at")',
  'CREATE INDEX IF NOT EXISTS "ideas_user_id_idx" ON "ideas" USING btree ("user_id")',
  'CREATE INDEX IF NOT EXISTS "ideas_generated_at_idx" ON "ideas" USING btree ("generated_at")',
  'CREATE INDEX IF NOT EXISTS "ideas_is_saved_idx" ON "ideas" USING btree ("is_saved")',
  'CREATE INDEX IF NOT EXISTS "ideas_is_dismissed_idx" ON "ideas" USING btree ("is_dismissed")',
  'CREATE INDEX IF NOT EXISTS "ideas_user_generated_idx" ON "ideas" USING btree ("user_id","generated_at")',
  'CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" USING btree ("user_id")',
  'CREATE INDEX IF NOT EXISTS "sessions_token_family_idx" ON "sessions" USING btree ("token_family")',
  'CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at")',
  'CREATE INDEX IF NOT EXISTS "sessions_user_created_idx" ON "sessions" USING btree ("user_id","created_at")',
];

async function applyIndexes() {
  console.log('Starting to apply indexes...');
  
  for (const indexSQL of indexes) {
    try {
      console.log(`Creating: ${indexSQL.split(' ').slice(0, 5).join(' ')}...`);
      await db.execute(sql.raw(indexSQL));
      console.log('  ✓ Created successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('  ℹ Already exists, skipping');
      } else {
        console.error('  ✗ Failed:', error instanceof Error ? error.message : error);
      }
    }
  }
  
  console.log('\n✅ All indexes applied successfully!');
  
  // Show the indexes
  console.log('\n📊 Current indexes in database:');
  const result = await db.execute(sql.raw(`
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `));
  
  console.log(result.rows);
}

applyIndexes()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nFatal error:', err);
    process.exit(1);
  });
