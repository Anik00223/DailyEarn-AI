-- Create the dailyearn database if it doesn't exist
SELECT 'CREATE DATABASE dailyearn' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dailyearn')\gexec
