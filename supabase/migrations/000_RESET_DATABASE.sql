-- =====================================================
-- COMPLETE DATABASE RESET
-- =====================================================
-- WARNING: This will delete ALL data and tables
-- Use this only for development/testing

-- Drop all tables in the correct order (respecting foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS credit_insights CASCADE;
DROP TABLE IF EXISTS user_learning_progress CASCADE;
DROP TABLE IF EXISTS learning_modules CASCADE;
DROP TABLE IF EXISTS credit_data_cache CASCADE;
DROP TABLE IF EXISTS connected_credit_cards CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop triggers will be handled by CASCADE when dropping functions

-- Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";