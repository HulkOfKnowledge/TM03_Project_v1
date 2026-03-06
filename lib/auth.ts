/**
 * Auth Utilities
 * Shared authentication helper functions
 */

import { clearAuthCache } from './api/auth-client';

/**
 * Handle user logout
 * Properly signs out from Supabase and redirects to the login page
 */
export function handleLogout(): void {
  // Clear client-side cache first so UI updates immediately.
  clearAuthCache();

  void (async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      // Redirect after logout attempt to avoid middleware seeing stale session on /login.
      window.location.replace('/login');
    }
  })();
}
