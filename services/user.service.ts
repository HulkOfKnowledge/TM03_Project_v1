/**
 * User Service
 * Handles user profile management, preferences, and onboarding
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  UserProfile,
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from '@/types/database.types';

export class UserService {
  /**
   * Get user profile by ID
   * TODO: Implement profile fetching
   * - Query user_profiles table
   * - Use RLS to ensure user can only access own profile
   * - Return null if profile not found
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    // TODO: Implementation needed
    // const supabase = await createClient();
    throw new Error('Not implemented');
  }

  /**
   * Get user profile by email
   * TODO: Implement email lookup
   * - Query user_profiles by email
   * - Use admin client for server-side operations
   * - Used primarily for authentication flows
   */
  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    // TODO: Implementation needed
    throw new Error('Not implemented');
  }

  /**
   * Create new user profile
   * TODO: Implement profile creation
   * - Called automatically via trigger on auth.users insert
   * - Or call manually if trigger fails
   * - Set default values for onboarding
   */
  async createProfile(
    input: CreateUserProfileInput
  ): Promise<UserProfile> {
    // TODO: Implementation needed
    throw new Error('Not implemented');
  }

  /**
   * Update user profile
   * TODO: Implement profile updates
   * - Validate input with Zod schema
   * - Update allowed fields only
   * - Trigger updated_at timestamp
   * - Return updated profile
   */
  async updateProfile(
    userId: string,
    input: UpdateUserProfileInput
  ): Promise<UserProfile> {
    // TODO: Implementation needed
    throw new Error('Not implemented');
  }

  /**
   * Update onboarding progress
   * TODO: Implement onboarding tracking
   * - Update onboarding_step as user progresses
   * - Set onboarding_completed when finished
   * - Set preferred_dashboard based on user choice
   * - Log onboarding completion in audit_logs
   */
  async updateOnboarding(
    userId: string,
    step: number,
    completed: boolean = false
  ): Promise<UserProfile> {
    // TODO: Implementation needed
    throw new Error('Not implemented');
  }

  /**
   * Set user's preferred dashboard
   * TODO: Implement dashboard preference
   * - Update preferred_dashboard field
   * - Options: 'learn' or 'card'
   * - Used for redirect after login
   */
  async setPreferredDashboard(
    userId: string,
    dashboard: 'learn' | 'card'
  ): Promise<UserProfile> {
    // TODO: Implementation needed
    throw new Error('Not implemented');
  }

  /**
   * Change user's preferred language
   * TODO: Implement language preference
   * - Update preferred_language field
   * - Options: 'en', 'fr', 'ar'
   * - Affects UI language and content shown
   */
  async setPreferredLanguage(
    userId: string,
    language: 'en' | 'fr' | 'ar'
  ): Promise<UserProfile> {
    // TODO: Implementation needed
    throw new Error('Not implemented');
  }

  /**
   * Check if user has completed onboarding
   * TODO: Implement onboarding check
   * - Query onboarding_completed field
   * - Redirect to onboarding if not completed
   * - Used in middleware and dashboard routes
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    // TODO: Implementation needed
    throw new Error('Not implemented');
  }

  /**
   * Get user's dashboard route based on preference
   * TODO: Implement dashboard routing logic
   * - Check preferred_dashboard field
   * - Default to 'card' if not set
   * - Return full route path
   */
  async getDashboardRoute(userId: string): Promise<string> {
    // TODO: Implementation needed
    // Should return '/learn' or '/cards'
    throw new Error('Not implemented');
  }

  /**
   * Delete user account and all associated data
   * TODO: Implement account deletion
   * - Delete user from auth.users (cascades to user_profiles)
   * - All related data deleted via CASCADE constraints
   * - Log deletion in audit_logs before deletion
   * - Send confirmation email
   */
  async deleteAccount(userId: string): Promise<void> {
    // TODO: Implementation needed
    throw new Error('Not implemented');
  }
}

// Singleton instance
export const userService = new UserService();
