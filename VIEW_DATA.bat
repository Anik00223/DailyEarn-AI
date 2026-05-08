@echo off
echo ====================================
echo DailyEarnAI - Quick Database Viewer
echo ====================================
echo.
echo You can view your user data using:
echo.
echo 1. PowerShell script (recommended):
echo    .\view_db.ps1 users
echo.
echo 2. Node.js script:
echo    cd backend && node scripts\view_db.cjs users
echo.
echo 3. Direct PostgreSQL:
echo    psql -U postgres -d dailyearn -c "SELECT * FROM users;"
echo.
echo 4. Drizzle Studio:
echo    cd backend && npm run db:studio
echo.
echo Currently you have 3 users in the database.
echo.
pause
