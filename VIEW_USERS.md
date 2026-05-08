# Viewing User Data in PostgreSQL

## Quick Commands

### View All Users
```bash
$env:PGPASSWORD='postgres'; & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -d dailyearn -c "SELECT id, email, name, city, state, daily_income_goal, language_pref FROM users;"
```

### View Users with Skills
```bash
$env:PGPASSWORD='postgres'; & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -d dailyearn -c "SELECT id, name, email, city, daily_income_goal, ARRAY_TO_STRING(skill_tags, ', ') as skills FROM users;"
```

### View All Tables
```bash
$env:PGPASSWORD='postgres'; & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -d dailyearn -c "\dt"
```

## Interactive psql Session
To explore data interactively:
```bash
$env:PGPASSWORD='postgres'; & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -d dailyearn
```

Once in psql, use these commands:
- `SELECT * FROM users;` - View all users
- `SELECT * FROM ideas;` - View all ideas
- `SELECT * FROM sessions;` - View user sessions
- `\q` - Exit psql

## View via Drizzle Studio
Run this for a web-based database viewer:
```bash
cd backend
npm run db:studio
```

This opens a browser at http://localhost:3000
