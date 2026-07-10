{
  "apps": [
    {
      "name": "dailyearn-backend",
      "script": "./backend/dist/server.js",
      "cwd": "/opt/dailyearn",
      "instances": "max",
      "exec_mode": "cluster",
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "512M",
      "min_uptime": "10s",
      "max_restarts": 10,
      "restart_delay": 3000,
      "kill_timeout": 15000,
      "log_date_format": "YYYY-MM-DD HH:mm:ss",
      "error_file": "/opt/dailyearn/logs/backend-error.log",
      "out_file": "/opt/dailyearn/logs/backend-out.log",
      "log_file": "/opt/dailyearn/logs/backend-combined.log",
      "time": true,
      "env": {
        "NODE_ENV": "production",
        "PORT": 3001
      },
      "env_production": {
        "NODE_ENV": "production"
      },
      "env_staging": {
        "NODE_ENV": "production"
      }
    }
  ]
}