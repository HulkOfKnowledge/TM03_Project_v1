-- Add columns to track onboarding progress for seamless continuation across sessions
-- This allows users to continue where they left off even after closing the browser or switching devices

-- Add all missing onboarding-related columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS status_in_canada TEXT CHECK (status_in_canada IN ('new_immigrant', 'permanent_resident', 'canadian_citizen')),
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS primary_goal TEXT CHECK (primary_goal IN ('build_credit', 'manage_debt', 'learn_credit', 'improve_score')),
ADD COLUMN IF NOT EXISTS credit_products TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS immigration_status TEXT CHECK (immigration_status IN ('new_immigrant', 'permanent_resident', 'canadian_citizen')),
ADD COLUMN IF NOT EXISTS credit_knowledge TEXT CHECK (credit_knowledge IN ('no_knowledge', 'beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS current_situation TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_stage TEXT CHECK (onboarding_stage IN ('personal', 'account', 'finish')),
ADD COLUMN IF NOT EXISTS onboarding_substep TEXT CHECK (onboarding_substep IN ('immigration', 'knowledge', 'situation')),
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT NULL;

-- Update last_name column if it doesn't exist (used instead of surname in some places)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_stage ON user_profiles(onboarding_stage) WHERE onboarding_completed = false;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.status_in_canada IS 'User status in Canada for initial onboarding';
COMMENT ON COLUMN user_profiles.province IS 'Province where user resides';
COMMENT ON COLUMN user_profiles.primary_goal IS 'User primary goal for using the platform';
COMMENT ON COLUMN user_profiles.credit_products IS 'Array of credit products user owns';
COMMENT ON COLUMN user_profiles.immigration_status IS 'Detailed immigration status';
COMMENT ON COLUMN user_profiles.credit_knowledge IS 'User self-assessed credit knowledge level';
COMMENT ON COLUMN user_profiles.current_situation IS 'Array of current credit situations';
COMMENT ON COLUMN user_profiles.onboarding_stage IS 'Current stage of onboarding process (personal, account, finish)';
COMMENT ON COLUMN user_profiles.onboarding_substep IS 'Current substep within finish stage (immigration, knowledge, situation)';
COMMENT ON COLUMN user_profiles.onboarding_data IS 'Temporary storage for onboarding form data to enable continuation across sessions';
