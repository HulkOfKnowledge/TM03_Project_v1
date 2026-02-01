/**
 * Auth Utilities
 * Shared authentication helper functions
 */

import { createClient } from '@/lib/supabase/client';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Handle user logout
 * Properly signs out from Supabase and redirects to home page
 */
export async function handleLogout(router: AppRouterInstance): Promise<void> {
  try {
    const supabase = createClient();
    
    // Sign out from Supabase and wait for it to complete
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
    
    // Clear any client-side state if needed
    // (Supabase SSR should handle cookie cleanup)
    
    // Redirect to home page after successful logout
    router.push('/');
    router.refresh(); // Refresh to update server components
  } catch (error) {
    console.error('Failed to logout:', error);
    // Still redirect even if there's an error to prevent stuck state
    router.push('/');
    router.refresh();
  }
}
