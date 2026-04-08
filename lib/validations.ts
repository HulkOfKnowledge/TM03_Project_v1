/**
 * Validation Schemas using Zod
 * Runtime validation for API inputs and data transformations
 */

import { z } from 'zod';

// ==================== USER SCHEMAS ====================
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  surname: z.string().min(2, 'Last name must be at least 2 characters'),
  mobile_number: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid mobile number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  first_name: z.string().min(2).optional(),
  surname: z.string().min(2).optional(),
  mobile_number: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid mobile number').optional(),
  preferred_language: z.enum(['en', 'fr', 'ar']).optional(),
  preferred_dashboard: z.enum(['learn', 'card']).optional(),
});

export const updateOnboardingSchema = z.object({
  onboarding_step: z.number().int().min(0),
  onboarding_completed: z.boolean().optional(),
});

// ==================== CREDIT CARD SCHEMAS ====================
export const connectCardSchema = z.object({
  flinks_login_id: z.string().uuid('Invalid login ID'),
  flinks_account_id: z.string().min(1, 'Account ID is required'),
  institution_name: z.string().min(1, 'Institution name is required'),
  card_type: z.enum(['credit', 'line_of_credit']),
  card_last_four: z.string().length(4, 'Must be 4 digits').regex(/^\d+$/),
  card_network: z.enum(['visa', 'mastercard', 'amex', 'other']).optional(),
});

export const syncCardSchema = z.object({
  card_id: z.string().uuid('Invalid card ID'),
});

// ==================== CREDIT DATA SCHEMAS ====================
export const creditDataSchema = z.object({
  card_id: z.string().uuid(),
  current_balance: z.number().nonnegative(),
  credit_limit: z.number().positive(),
  available_credit: z.number().nonnegative(),
  utilization_percentage: z.number().min(0).max(100),
  minimum_payment: z.number().nonnegative(),
  payment_due_date: z.string().datetime().nullable().optional(),
  last_payment_amount: z.number().nonnegative().nullable().optional(),
  last_payment_date: z.string().datetime().nullable().optional(),
  interest_rate: z.number().nonnegative().nullable().optional(),
  raw_flinks_data: z.record(z.unknown()),
});

// ==================== LEARNING SCHEMAS ====================
export const updateProgressSchema = z.object({
  module_id: z.string().uuid('Invalid module ID'),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
});

// ==================== INSIGHTS SCHEMAS ====================
export const createInsightSchema = z.object({
  user_id: z.string().uuid(),
  insight_type: z.enum(['recommendation', 'alert', 'achievement', 'tip']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  title_en: z.string().min(1),
  title_fr: z.string().min(1),
  title_ar: z.string().min(1),
  message_en: z.string().min(1),
  message_fr: z.string().min(1),
  message_ar: z.string().min(1),
  action_required: z.boolean().optional().default(false),
  expires_at: z.string().datetime().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const markInsightReadSchema = z.object({
  insight_id: z.string().uuid('Invalid insight ID'),
});

// ==================== CREDIT INTELLIGENCE SCHEMAS ====================
export const analyzeRequestSchema = z.object({
  user_id: z.string().uuid(),
  cards: z.array(
    z.object({
      card_id: z.string().uuid(),
      institution_name: z.string(),
      current_balance: z.number().nonnegative(),
      credit_limit: z.number().positive(),
      utilization_percentage: z.number().min(0).max(100),
      minimum_payment: z.number().nonnegative(),
      payment_due_date: z.string().nullable(),
      interest_rate: z.number().nonnegative().nullable(),
      last_payment_amount: z.number().nonnegative().nullable(),
      last_payment_date: z.string().nullable(),
    })
  ),
});

export const paymentRecommendationRequestSchema = z.object({
  user_id: z.string().uuid(),
  cards: z.array(
    z.object({
      card_id: z.string().uuid(),
      institution_name: z.string(),
      current_balance: z.number().nonnegative(),
      credit_limit: z.number().positive(),
      utilization_percentage: z.number().min(0).max(100),
      minimum_payment: z.number().nonnegative(),
      payment_due_date: z.string().nullable(),
      interest_rate: z.number().nonnegative().nullable(),
    })
  ),
  available_amount: z.number().positive(),
  optimization_goal: z.enum(['minimize_interest', 'balanced', 'minimize_balance']),
});

export const payoffSimulationRequestSchema = z.object({
  card_id: z.string().uuid(),
  current_balance: z.number().positive(),
  interest_rate: z.number().nonnegative(),
  minimum_payment: z.number().positive(),
  extra_payment: z.number().nonnegative(),
});

// ==================== PAGINATION SCHEMA ====================
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

// ==================== TYPE EXPORTS ====================
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ConnectCardInput = z.infer<typeof connectCardSchema>;
export type CreditDataInput = z.infer<typeof creditDataSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type CreateInsightInput = z.infer<typeof createInsightSchema>;
export type AnalyzeRequestInput = z.infer<typeof analyzeRequestSchema>;
export type PaymentRecommendationInput = z.infer<
  typeof paymentRecommendationRequestSchema
>;
export type PayoffSimulationInput = z.infer<typeof payoffSimulationRequestSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
