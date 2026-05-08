# Database Viewer Script for DailyEarnAI
# Usage: ./view_db.ps1 [table_name]
# Examples: ./view_db.ps1 users
#           ./view_db.ps1 ideas
#           ./view_db.ps1 (lists all tables)

param(
    [string]$TableName = ""
)

$env:PGPASSWORD = "postgres"
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$dbName = "dailyearn"
$user = "postgres"
$dbHost = "localhost"

function Show-Help {
    Write-Host "=========================================="
    Write-Host "DailyEarnAI Database Viewer"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "USAGE:"
    Write-Host "  ./view_db.ps1 [table_name]"
    Write-Host ""
    Write-Host "EXAMPLES:"
    Write-Host "  ./view_db.ps1                  # List all tables"
    Write-Host "  ./view_db.ps1 users            # View all users"
    Write-Host "  ./view_db.ps1 ideas            # View all ideas"
    Write-Host "  ./view_db.ps1 sessions         # View all sessions"
    Write-Host ""
    Write-Host "COMMANDS:"
    Write-Host "  help                          # Show this help"
    Write-Host "  tables                        # List all tables"
    Write-Host "  query "SELECT * FROM users"   # Run custom query"
    Write-Host ""
}

function Show-AllTables {
    Write-Host "Listing all tables..."
    Write-Host "========================================"
    & $psqlPath -U $user -h $dbHost -d $dbName -c "\dt" 2>&1
    Write-Host ""
    Write-Host "========================================"
}

function Show-TableData {
    param([string]$Table)
    
    Write-Host "Viewing table: $Table"
    Write-Host "========================================"
    
    switch ($Table) {
        "users" {
            & $psqlPath -U $user -h $dbHost -d $dbName -c "
                SELECT 
                    id, 
                    email, 
                    name, 
                    city, 
                    state, 
                    daily_income_goal, 
                    language_pref,
                    ARRAY_TO_STRING(skill_tags, ', ') AS skills,
                    created_at
                FROM users 
                ORDER BY created_at DESC;
            " 2>&1
        }
        "ideas" {
            & $psqlPath -U $user -h $dbHost -d $dbName -c "
                SELECT 
                    id,
                    user_id,
                    title,
                    estimated_daily_earn,
                    estimated_weekly_earn,
                    effort_level,
                    platform_name,
                    is_saved,
                    is_dismissed,
                    generated_at
                FROM ideas 
                ORDER BY generated_at DESC 
                LIMIT 20;
            " 2>&1
        }
        "sessions" {
            & $psqlPath -U $user -h $dbHost -d $dbName -c "
                SELECT 
                    id,
                    user_id,
                    ip_address,
                    is_revoked,
                    expires_at,
                    created_at
                FROM sessions 
                ORDER BY created_at DESC;
            " 2>&1
        }
        "analytics" {
            & $psqlPath -U $user -h $dbHost -d $dbName -c "
                SELECT 
                    id,
                    user_id,
                    event_type,
                    idea_id,
                    ip_address,
                    created_at
                FROM analytics 
                ORDER BY created_at DESC 
                LIMIT 20;
            " 2>&1
        }
        default {
            Write-Host "Unknown table: $Table"
            Write-Host "Available tables: users, ideas, sessions, analytics"
        }
    }
    
    Write-Host "========================================"
}

function Run-CustomQuery {
    param([string]$Query)
    
    Write-Host "Running custom query..."
    Write-Host "========================================"
    & $psqlPath -U $user -h $dbHost -d $dbName -c $Query 2>&1
    Write-Host "========================================"
}

# Main logic
if ($TableName -eq "" -or $TableName -eq "tables") {
    Show-AllTables
}
elseif ($TableName -eq "help") {
    Show-Help
}
elseif ($TableName.StartsWith("SELECT") -or $TableName.StartsWith("select")) {
    Run-CustomQuery -Query $TableName
}
else {
    Show-TableData -Table $TableName
}
