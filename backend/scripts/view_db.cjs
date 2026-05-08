#!/usr/bin/env node
// Simple DB viewer using pg driver directly
require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function viewUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        id, 
        email, 
        name, 
        city, 
        state, 
        daily_income_goal, 
        language_pref,
        skill_tags,
        created_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log('\n📊 USERS TABLE');
    console.log('========================================');
    console.log(`Total users: ${result.rows.length}\n`);
    
    result.rows.forEach((user) => {
      console.log(`👤 ${user.name || 'Unknown'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Location: ${user.city || 'N/A'}, ${user.state || 'N/A'}`);
      console.log(`   Daily Goal: ₹${user.daily_income_goal}`);
      console.log(`   Language: ${user.language_pref}`);
      console.log(`   Verified: ${user.is_verified ? '✅' : '❌'}`);
      console.log(`   Skills: ${user.skill_tags?.join(', ') || 'None'}`);
      console.log(`   Joined: ${user.created_at?.toLocaleString()}`);
      console.log('   ──────────────────────────────────');
    });
    
    console.log('✅ Users loaded successfully\n');
  } finally {
    client.release();
  }
}

async function viewTables() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        schemaname,
        tablename,
        (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
      FROM (
        SELECT 
          schemaname,
          tablename,
          query_to_xml(format('SELECT count(*) AS cnt FROM %I.%I', schemaname, tablename), false, true, '') as xml_count
        FROM pg_tables
        WHERE schemaname = 'public'
      ) AS sub;
    `);
    
    console.log('\n📋 ALL TABLES');
    console.log('========================================');
    
    result.rows.forEach((table) => {
      console.log(`✅ ${table.tablename.padEnd(15)} : ${table.row_count} rows`);
    });
    
    console.log('========================================\n');
    console.log('✅ Table counts loaded successfully\n');
  } finally {
    client.release();
  }
}

async function rawQuery(sql) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql);
    console.log('\n🔍 QUERY RESULT');
    console.log('========================================');
    console.log(`Columns: ${result.fields.map(f => f.name).join(', ')}`);
    console.log(`Rows: ${result.rows.length}`);
    console.log('');
    
    if (result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log('No rows returned');
    }
    
    console.log('========================================\n');
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🚀 DailyEarnAI Database Viewer');
  console.log('========================================\n');
  
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'users':
        await viewUsers();
        break;
      case 'tables':
        await viewTables();
        break;
      case 'raw':
        const sql = process.argv.slice(3).join(' ');
        if (!sql) {
          console.log('Usage: node view_db.cjs raw "SELECT * FROM users"');
        } else {
          await rawQuery(sql);
        }
        break;
      default:
        console.log('💡 USAGE: node view_db.cjs [command]');
        console.log('');
        console.log('📋 COMMANDS:');
        console.log('  users  - View all users');
        console.log('  tables - View table row counts');
        console.log('  raw    - Run custom SQL query');
        console.log('');
        console.log('Examples:');
        console.log('  node view_db.cjs users');
        console.log('  node view_db.cjs raw "SELECT * FROM users"');
        console.log('  node view_db.cjs raw "SELECT COUNT(*) FROM ideas"');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
