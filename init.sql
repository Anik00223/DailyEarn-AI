-- Initialize DailyEarn AI Database
-- This script runs when PostgreSQL container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if it doesn't exist (useful for custom databases)
-- Note: This will fail if running in initdb, but that's okay
-- \c ${POSTGRES_DB} postgres;

-- Create schemas for organization (optional)
CREATE SCHEMA IF NOT EXISTS public;

-- Set timezone
SET timezone = 'UTC';

-- Create roles for application (optional security layer)
-- CREATE ROLE dailyearn_app WITH LOGIN PASSWORD 'change_in_production';
-- GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO dailyearn_app;
-- GRANT USAGE ON SCHEMA public TO dailyearn_app;

-- Create monitoring user for metrics
-- CREATE ROLE dailyearn_monitor WITH LOGIN PASSWORD 'monitor_password';
-- GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO dailyearn_monitor;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO dailyearn_monitor;

-- Add any initialization data here if needed
-- INSERT INTO migrations (version) VALUES ('001');
