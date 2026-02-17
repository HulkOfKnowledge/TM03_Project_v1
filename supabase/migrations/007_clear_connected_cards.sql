-- Migration: Clear all connected credit cards and their data
-- This allows for a clean slate when testing demo data

-- Delete all credit data cache entries (will cascade from cards deletion, but explicit is safer)
TRUNCATE TABLE credit_data_cache CASCADE;

-- Delete all connected credit cards
TRUNCATE TABLE connected_credit_cards CASCADE;
