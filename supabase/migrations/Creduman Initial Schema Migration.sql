-- =====================================================
-- CREDUMAN DATABASE SCHEMA - INITIAL MIGRATION
-- =====================================================
-- This migration creates all tables, RLS policies, indexes, and triggers
-- for the Creduman credit education platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: user_profiles
-- =====================================================
-- Extends Supabase auth.users with application-specific data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'fr', 'ar')),
  preferred_dashboard TEXT CHECK (preferred_dashboard IN ('learn', 'card')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Index for email lookups
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- =====================================================
-- TABLE: connected_credit_cards
-- =====================================================
CREATE TABLE IF NOT EXISTS connected_credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  flinks_login_id TEXT NOT NULL,
  flinks_account_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'line_of_credit')),
  card_last_four TEXT NOT NULL CHECK (LENGTH(card_last_four) = 4),
  card_network TEXT CHECK (card_network IN ('visa', 'mastercard', 'amex', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, flinks_account_id)
);

-- RLS Policies for connected_credit_cards
ALTER TABLE connected_credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
  ON connected_credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON connected_credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON connected_credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards"
  ON connected_credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_connected_cards_user_id ON connected_credit_cards(user_id);
CREATE INDEX idx_connected_cards_flinks_login ON connected_credit_cards(flinks_login_id);
CREATE INDEX idx_connected_cards_active ON connected_credit_cards(user_id, is_active);

-- =====================================================
-- TABLE: credit_data_cache
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES connected_credit_cards(id) ON DELETE CASCADE,
  current_balance NUMERIC(12, 2) NOT NULL,
  credit_limit NUMERIC(12, 2) NOT NULL,
  available_credit NUMERIC(12, 2) NOT NULL,
  utilization_percentage NUMERIC(5, 2) NOT NULL CHECK (utilization_percentage >= 0 AND utilization_percentage <= 100),
  minimum_payment NUMERIC(12, 2) NOT NULL,
  payment_due_date TIMESTAMPTZ,
  last_payment_amount NUMERIC(12, 2),
  last_payment_date TIMESTAMPTZ,
  interest_rate NUMERIC(5, 2),
  raw_flinks_data JSONB NOT NULL DEFAULT '{}',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for credit_data_cache
ALTER TABLE credit_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit data"
  ON credit_data_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM connected_credit_cards
      WHERE connected_credit_cards.id = credit_data_cache.card_id
      AND connected_credit_cards.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_credit_data_card_id ON credit_data_cache(card_id);
CREATE INDEX idx_credit_data_synced_at ON credit_data_cache(synced_at DESC);

-- =====================================================
-- TABLE: learning_modules
-- =====================================================
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_fr TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  module_order INTEGER NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(module_order)
);

-- RLS Policies for learning_modules (public read for published modules)
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published modules"
  ON learning_modules FOR SELECT
  USING (is_published = TRUE);

-- Index
CREATE INDEX idx_learning_modules_published ON learning_modules(is_published, module_order);

-- =====================================================
-- TABLE: user_learning_progress
-- =====================================================
CREATE TABLE IF NOT EXISTS user_learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- RLS Policies for user_learning_progress
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_learning_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_learning_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_progress_user_id ON user_learning_progress(user_id);
CREATE INDEX idx_user_progress_module_id ON user_learning_progress(module_id);
CREATE INDEX idx_user_progress_status ON user_learning_progress(user_id, status);

-- =====================================================
-- TABLE: credit_insights
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('recommendation', 'alert', 'achievement', 'tip')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title_en TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  message_en TEXT NOT NULL,
  message_fr TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  action_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for credit_insights
ALTER TABLE credit_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON credit_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON credit_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_insights_user_id ON credit_insights(user_id);
CREATE INDEX idx_insights_unread ON credit_insights(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_insights_priority ON credit_insights(user_id, priority, created_at DESC);
CREATE INDEX idx_insights_expires ON credit_insights(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- TABLE: audit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for audit_logs (users can only view their own logs)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- =====================================================
-- TRIGGERS: Update updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connected_cards_updated_at
  BEFORE UPDATE ON connected_credit_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_modules_updated_at
  BEFORE UPDATE ON learning_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_learning_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_insights_updated_at
  BEFORE UPDATE ON credit_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Create user profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- END OF MIGRATION
-- =====================================================
