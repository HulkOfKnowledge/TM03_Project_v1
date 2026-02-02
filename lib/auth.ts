/**
 * Auth Utilities
 * Shared authentication helper functions
 */


/**
 * Handle user logout
 * Properly signs out from Supabase and redirects to home page
 */
export async function handleLogout(): Promise<void> {
  try {
    // Fire-and-forget logout calls to avoid blocking navigation
    void fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
    });

    // Force a full navigation so server components see cleared cookies immediately
    window.location.replace('/login');
  } catch (error) {
    console.error('Failed to logout:', error);
    // Still redirect even if there's an error to prevent stuck state
    window.location.replace('/login');
  }
}
