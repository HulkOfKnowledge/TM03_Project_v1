-- =====================================================
-- ADD AVATAR_URL TO USER_PROFILES TABLE
-- =====================================================
-- This migration adds avatar_url column to store profile pictures from OAuth providers

-- Add avatar_url column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN user_profiles.avatar_url IS 'Profile picture URL from OAuth providers (Google, Facebook, etc.)';
