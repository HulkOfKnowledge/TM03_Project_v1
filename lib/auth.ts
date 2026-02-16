/**
 * Auth Utilities
 * Shared authentication helper functions
 */

import { clearAuthCache } from './api/auth-client';

/**
 * Handle user logout
 * Properly signs out from Supabase and redirects to home page
 */
export function handleLogout(): void {
  try {
    // Clear the auth cache
    clearAuthCache();
    
    // Redirect immediately
    window.location.replace('/login');

    // Fire-and-forget logout call to clear cookies
    void fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
    });
  } catch (error) {
    console.error('Failed to logout:', error);
    // Still redirect even if there's an error to prevent stuck state
    window.location.replace('/login');
  }
}
