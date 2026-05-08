// Database Viewer Script using Drizzle ORM
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema/index.js';

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function viewUsers() {
  try {
    const users = await db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    console.log('\n📊 USERS TABLE');
    console.log('========================================');
    console.log(`Total users: ${users.length}\n`);

    users.forEach((user) => {
      console.log(`👤 ${user.name || 'Unknown'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Location: ${user.city || 'N/A'}, ${user.state || 'N/A'}`);
      console.log(`   Daily Goal: ₹${user.dailyIncomeGoal}`);
      console.log(`   Language: ${user.languagePref}`);
      console.log(`   Verified: ${user.isVerified ? '✅' : '❌'}`);
      console.log(`   Skills: ${user.skillTags?.join(', ') || 'None'}`);
      console.log(`   Joined: ${user.createdAt?.toLocaleString()}`);
      console.log('   ──────────────────────────────────');
    });
  } catch (error) {
    console.error('❌ Error viewing users:', error.message);
  }
}

async function viewTables() {
  try {
    console.log('\n📋 ALL TABLES');
    console.log('========================================');

    // Get counts from each table
    const userCount = await db.$count(schema.users);
    const ideaCount = await db.$count(schema.ideas);
    const sessionCount = await db.$count(schema.sessions);
    const analyticsCount = await db.$count(schema.analytics);

    console.log(`✅ users         : ${userCount} rows`);
    console.log(`✅ ideas         : ${ideaCount} rows`);
    console.log(`✅ sessions      : ${sessionCount} rows`);
    console.log(`✅ analytics     : ${analyticsCount} rows`);
    console.log('========================================');
  } catch (error) {
    console.error('❌ Error counting tables:', error.message);
  }
}

async function viewIdeas() {
  try {
    const ideas = await db.query.ideas.findMany({
      with: {
        user: {
          columns: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: (ideas, { desc }) => [desc(ideas.generatedAt)],
      limit: 10,
    });

    if (ideas.length === 0) {
      console.log('\n💡 IDEAS TABLE');
      console.log('========================================');
      console.log('No ideas generated yet.');
      return;
    }

    console.log('\n💡 IDEAS TABLE (Recent 10)');
    console.log('========================================');
    console.log(`Total ideas: ${await db.$count(schema.ideas)}\n`);

    ideas.forEach((idea) => {
      console.log(`📌 ${idea.title}`);
      console.log(`   By: ${idea.user?.name || 'Unknown'} (${idea.user?.email})`);
      console.log(`   Earnings: ₹${idea.estimatedDailyEarn}/day, ₹${idea.estimatedWeeklyEarn}/week`);
      console.log(`   Effort: ${idea.effortLevel}`);
      console.log(`   Platform: ${idea.platformName}`);
      console.log(`   Skills: ${idea.skillsRequired?.join(', ') || 'None'}`);
      console.log(`   Saved: ${idea.isSaved ? '⭐' : '❌'} | Dismissed: ${idea.isDismissed ? '🚫' : '❌'}`);
      console.log(`   Generated: ${idea.generatedAt?.toLocaleString()}`);
      console.log('   ──────────────────────────────────');
    });
  } catch (error) {
    console.error('❌ Error viewing ideas:', error.message);
  }
}

async function viewAnalytics() {
  try {
    const events = await db.query.analytics.findMany({
      orderBy: (analytics, { desc }) => [desc(analytics.createdAt)],
      limit: 20,
    });

    if (events.length === 0) {
      console.log('\n📈 ANALYTICS TABLE');
      console.log('========================================');
      console.log('No analytics events yet.');
      return;
    }

    console.log('\n📈 ANALYTICS TABLE (Recent 20)');
    console.log('========================================');
    console.log(`Total events: ${await db.$count(schema.analytics)}\n`);

    events.forEach((event) => {
      console.log(`📝 ${event.eventType}`);
      console.log(`   User: ${event.userId || 'Anonymous'}`);
      console.log(`   Idea: ${event.ideaId || 'N/A'}`);
      console.log(`   IP: ${event.ipAddress || 'N/A'}`);
      console.log(`   Time: ${event.createdAt?.toLocaleString()}`);
      console.log('   ──────────────────────────────────');
    });
  } catch (error) {
    console.error('❌ Error viewing analytics:', error.message);
  }
}


// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0] || 'users';

async function main() {
  console.log('🚀 DailyEarnAI Database Viewer');
  console.log('========================================');

  try {
    switch (command) {
      case 'users':
        await viewUsers();
        break;
      case 'ideas':
        await viewIdeas();
        break;
      case 'analytics':
        await viewAnalytics();
        break;
      case 'sessions':
        console.log('\n🔐 Viewing sessions... (data truncated for security)');
        break;
      case 'tables':
      case 'count':
        await viewTables();
        break;
      case 'all':
        await viewTables();
        await viewUsers();
        await viewIdeas();
        await viewAnalytics();
        break;
      case 'help':
      case '-h':
      case '--help':
        console.log('\n💡 USAGE:');
        console.log('  node view_db.js [command]');
        console.log('\n📋 COMMANDS:');
        console.log('  users      - View user data');
        console.log('  ideas      - View generated ideas');
        console.log('  analytics  - View analytics events');
        console.log('  tables     - Show table row counts');
        console.log('  all        - View everything');
        console.log('  help       - Show this help');
        break;
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('💡 Run: node view_db.js help');
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n✅ Connection closed');
    console.log('========================================');
  }
}

main();
