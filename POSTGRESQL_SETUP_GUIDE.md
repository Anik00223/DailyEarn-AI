# 🗄️ PostgreSQL Setup Complete - View User Data

## ✅ What Has Been Set Up

1. **✅ PostgreSQL 16** - Running on your system
2. **✅ Database** - `dailyearn` created
3. **✅ Tables** - All 4 tables created:
   - `users` - User accounts and profiles
   - `ideas` - Generated income ideas
   - `sessions` - User authentication sessions
   - `analytics` - User activity tracking
4. **✅ Sample Data** - 3 test users inserted with realistic Indian names and cities

---

## 👥 Sample User Data Created

| ID | Name | Email | City | State | Daily Goal | Language | Skills |
|----|------|-------|------|-------|-----------|----------|--------|
| 550e32f3-e1f1-4ce2-b405-bc0595185a5b | **Amit Patel** | amit@example.com | Surat | Gujarat | ₹600 | English | delivery, bike riding, mobile repair |
| 3e0feecf-9cf5-48a0-bc03-160dbc3d5197 | **Priya Sharma** | priya@example.com | Indore | Madhya Pradesh | ₹750 | Hindi | tailoring, graphic design, cooking |
| b8aeb3e6-6bf2-4b72-bb62-1a1d640780a2 | **Rajesh** | rajesh@example.com | Pune | Maharashtra | ₹500 | English | cooking, driving, teaching |

---

## 🔍 How to View User Data

### **Method 1: PowerShell Script (Easiest)**

A convenient PowerShell script has been created for you:

```powershell
# From project root directory:
.\view_db.ps1 users          # View all users
.\view_db.ps1 ideas          # View all ideas
.\view_db.ps1 tables         # List all tables
.\view_db.ps1 help           # Show help

# Or from backend directory:
..\view_db.ps1 users
```

**Output:**
```
📊 USERS TABLE
========================================
Total users: 3

👤 Amit Patel
   Email: amit@example.com
   ID: 550e32f3-e1f1-4ce2-b405-bc0595185a5b
   Location: Surat, Gujarat
   Daily Goal: ₹600
   Language: en
   Skills: delivery, bike riding, mobile repair
   Joined: 8/5/2026, 1:28:04 am
   ──────────────────────────────────
   ... [more users]
```

✅ **Best for**: Quick viewing, development, demonstrations

---

### **Method 2: Node.js Script (Application-Native)**

Run this from the `backend` directory:

```bash
cd backend

# View users
node scripts/view_db.cjs users

# View ideas  
node scripts/view_db.cjs ideas

# View table counts
node scripts/view_db.cjs tables

# Run custom query
node scripts/view_db.cjs raw "SELECT COUNT(*) as total_users FROM users"
```

✅ **Best for**: Testing your database connection, programmatic access, custom queries

---

### **Method 3: Direct PostgreSQL psql Commands**

For raw SQL access:

```bash
# Set password in environment variable
$env:PGPASSWORD='postgres'

# View all users
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -d dailyearn -c "SELECT * FROM users;"

# View with formatting
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -d dailyearn -c "SELECT id, email, name, city, daily_income_goal, ARRAY_TO_STRING(skill_tags, ', ') as skills FROM users;" -x

# Interactive psql session
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -d dailyearn

# Then in psql:
SELECT * FROM users;
SELECT * FROM ideas;
\dt  # list tables
\q   # quit
```

✅ **Best for**: Advanced queries, debugging, learning SQL, manual data updates

---

### **Method 4: Drizzle Studio (Web UI)**

Launch Drizzle's built-in web database viewer:

```bash
cd backend
npm run db:studio
```

This opens a browser at **http://localhost:3000** where you can:
- Browse all tables
- View/edit data
- Run SQL queries
- See table relationships

✅ **Best for**: Visual exploration, editing data, understanding schema

---

### **Method 5: Direct JavaScript Queries**

From your application code:

```javascript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './src/db/schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Query users
const allUsers = await db.query.users.findMany();
console.log(allUsers);

// Or with conditions
const puneUsers = await db.query.users.findMany({
  where: (users, { eq }) => eq(users.city, 'Pune')
});
```

✅ **Best for**: Within your application code, complex queries with conditions

---

## 📊 Current Data Summary

**Users Table:** 3 users from Indian cities (Tier 2/3 focus)
- Pune, Maharashtra
- Indore, Madhya Pradesh
- Surat, Gujarat

**Ideas Table:** 0 rows (you can generate ideas via the app)

**Sessions Table:** 0 rows (will populate when users log in)

**Analytics Table:** 0 rows (will populate when users interact)

---

## 🔧 Database Credentials

**Connection String:**
```
postgresql://postgres:postgres@localhost:5432/dailyearn
```

**Breakdown:**
- **Host:** localhost
- **Port:** 5432
- **Database:** dailyearn
- **Username:** postgres
- **Password:** postgres

---

## 📝 Environment Variables

Your `.env` file should contain:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dailyearn
```

This is correctly set up already!

---

## 🎯 Next Steps

### To see real user data:
1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Register users** via the frontend or API

3. **Generate ideas** for those users

4. **View the data** using any method above

### To add more test data:
```sql
INSERT INTO users (email, password_hash, name, city, state, skill_tags, daily_income_goal) VALUES
('test@example.com', '$2a$12$dummyhash', 'Test User', 'Nagpur', 'Maharashtra', ARRAY['cooking', 'sewing'], 500);
```

---

## 🛠️ Troubleshooting

### "Connection refused" error:
- Check PostgreSQL service: `Get-Service postgresql-x64-16`
- Ensure it's running: `Start-Service postgresql-x64-16`

### "Database doesn't exist":
- Create database: `createdb dailyearn` (with PostgreSQL password)

### "Table doesn't exist":
- Run migrations: `cd backend && npm run db:push`

### Authentication failed:
- Password is: **postgres**
- Check: `Test-Path "C:\Program Files\PostgreSQL\16\bin\psql.exe"`

---

## 📚 Quick Reference Card

| Action | Command |
|--------|---------|
| **View Users** | `.\view_db.ps1 users` |
| **View Ideas** | `.\view_db.ps1 ideas` |
| **View All Tables** | `.\view_db.ps1 tables` |
| **Custom Query** | Use psql or `node view_db.cjs raw "SQL"` |
| **Web UI** | `cd backend && npm run db:studio` |
| **List Tables in psql** | `\dt` |
| **Describe Table** | `\d users` |
| **Count Users** | `SELECT COUNT(*) FROM users;` |

---

## ✅ Verification Checklist

- [x] PostgreSQL 16 installed and running
- [x] `dailyearn` database created
- [x] All tables created (users, ideas, sessions, analytics)
- [x] Sample users inserted (3 users)
- [x] PowerShell viewer script created and working
- [x] Node.js viewer script created and working
- [x] Quick reference guides created
- [x] Connection credentials configured

---

## 💡 Pro Tips

1. **Quick access**: Add `view_db.ps1` to your PATH for global access
2. **Aliases**: Create PowerShell alias: `Set-Alias -Name db -Value .\view_db.ps1`
3. **Auto-complete**: The script supports tab completion in PowerShell
4. **Export data**: Pipe to CSV: `.\view_db.ps1 users > users.csv`
5. **Watch changes**: Use `watch` command to auto-refresh: `watch -n 5 \"node view_db.cjs users\"`

---

## 🎉 You're All Set!

Your PostgreSQL database is now fully set up with sample data and multiple ways to view it. Choose whichever method feels most comfortable for your workflow!

**Questions?** Check the files:
- `VIEW_USERS.md` - More detailed commands
- `view_db.ps1` - PowerShell viewer script
- `backend/scripts/view_db.cjs` - Node.js viewer script
