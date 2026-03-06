/**
 * Database Models - Type definitions for all database tables
 * These types mirror the Supabase database schema
 */

// ==================== USER PROFILE ====================
export interface UserProfile {
  id: string; // UUID, matches auth.users.id
  email: string;
  first_name: string;
  surname: string;
  mobile_number: string | null;
  preferred_language: 'en' | 'fr' | 'ar';
  preferred_dashboard: 'learn' | 'card' | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserProfileInput {
  id: string;
  email: string;
  first_name: string;
  surname: string;
  mobile_number?: string;
  preferred_language?: 'en' | 'fr' | 'ar';
}

export interface UpdateUserProfileInput {
  first_name?: string;
  surname?: string;
  mobile_number?: string;
  preferred_language?: 'en' | 'fr' | 'ar';
  preferred_dashboard?: 'learn' | 'card';
  onboarding_completed?: boolean;
  onboarding_step?: number;
}

// ==================== CONNECTED CREDIT CARDS ====================
export interface ConnectedCreditCard {
  id: string; // UUID
  user_id: string; // Foreign key to user_profiles
  flinks_login_id: string; // Reference to Flinks account
  flinks_account_id: string; // Flinks account identifier
  institution_name: string;
  card_type: 'credit' | 'line_of_credit';
  card_last_four: string;
  card_network: 'visa' | 'mastercard' | 'amex' | 'other' | null;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConnectedCardInput {
  user_id: string;
  flinks_login_id: string;
  flinks_account_id: string;
  institution_name: string;
  card_type: 'credit' | 'line_of_credit';
  card_last_four: string;
  card_network?: 'visa' | 'mastercard' | 'amex' | 'other';
}

// ==================== CREDIT DATA CACHE ====================
export interface CreditDataCache {
  id: string; // UUID
  card_id: string; // Foreign key to connected_credit_cards
  current_balance: number;
  credit_limit: number;
  available_credit: number;
  utilization_percentage: number;
  minimum_payment: number;
  payment_due_date: string | null;
  last_payment_amount: number | null;
  last_payment_date: string | null;
  interest_rate: number | null;
  raw_flinks_data: Record<string, unknown>; // JSONB
  synced_at: string;
  created_at: string;
}

export interface CreateCreditDataInput {
  card_id: string;
  current_balance: number;
  credit_limit: number;
  available_credit: number;
  utilization_percentage: number;
  minimum_payment: number;
  payment_due_date?: string;
  last_payment_amount?: number;
  last_payment_date?: string;
  interest_rate?: number;
  raw_flinks_data: Record<string, unknown>;
}

// ==================== CARD TRANSACTIONS ====================
/** Mirrors the card_transactions table (migration 009). */
export interface CardTransaction {
  id: string;
  card_id: string;
  /** Flinks transaction UUID – used for idempotent upserts */
  flinks_transaction_id: string;
  date: string;         // 'YYYY-MM-DD'
  description: string;
  debit: number | null;   // positive = card balance increases (purchase)
  credit: number | null;  // positive = card balance decreases (payment/refund)
  balance: number | null; // running card balance after this transaction
  raw_category: string | null;
  synced_at: string;
  created_at: string;
}

export interface CreateCardTransactionInput {
  card_id: string;
  flinks_transaction_id: string;
  date: string;
  description: string;
  debit?: number | null;
  credit?: number | null;
  balance?: number | null;
  raw_category?: string | null;
  synced_at?: string;
}

// ==================== LEARNING MODULES ====================
export interface LearningModule {
  id: string; // UUID
  title_en: string;
  title_fr: string;
  title_ar: string;
  description_en: string;
  description_fr: string;
  description_ar: string;
  content_en: string; // JSONB or text
  content_fr: string;
  content_ar: string;
  module_order: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== USER LEARNING PROGRESS ====================
export interface UserLearningProgress {
  id: string; // UUID
  user_id: string; // Foreign key to user_profiles
  module_id: string; // Foreign key to learning_modules
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProgressInput {
  status?: 'not_started' | 'in_progress' | 'completed';
  progress_percentage?: number;
  completed_at?: string;
}

// ==================== CREDIT INSIGHTS ====================
export interface CreditInsight {
  id: string; // UUID
  user_id: string; // Foreign key to user_profiles
  insight_type: 'recommendation' | 'alert' | 'achievement' | 'tip';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title_en: string;
  title_fr: string;
  title_ar: string;
  message_en: string;
  message_fr: string;
  message_ar: string;
  action_required: boolean;
  is_read: boolean;
  expires_at: string | null;
  metadata: Record<string, unknown>; // JSONB
  created_at: string;
  updated_at: string;
}

export interface CreateInsightInput {
  user_id: string;
  insight_type: 'recommendation' | 'alert' | 'achievement' | 'tip';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title_en: string;
  title_fr: string;
  title_ar: string;
  message_en: string;
  message_fr: string;
  message_ar: string;
  action_required?: boolean;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

// ==================== AUDIT LOGS ====================
export interface AuditLog {
  id: string; // UUID
  user_id: string | null; // Foreign key to user_profiles, nullable for system events
  action: string; // e.g., 'card_connected', 'data_synced', 'profile_updated'
  resource_type: string; // e.g., 'credit_card', 'user_profile', 'learning_module'
  resource_id: string | null;
  metadata: Record<string, unknown>; // JSONB
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface CreateAuditLogInput {
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}
