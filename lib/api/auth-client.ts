/**
 * Client-side helpers for auth API routes
 * Includes in-memory caching to avoid unnecessary API calls
 */

import type { AuthProfile, AuthUser } from '@/types/auth.types';

// In-memory cache for auth requests (session duration)
let authCache: { user: AuthUser | null; profile: AuthProfile | null } | null = null;

/**
 * Fetch current user and profile with caching support
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns User and profile data
 */
export async function fetchAuthMe(
  forceRefresh: boolean = false,
): Promise<{ user: AuthUser | null; profile: AuthProfile | null }> {
  // Return cached data if available (unless force refresh)
  if (!forceRefresh && authCache) {
    return authCache;
  }

  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const result = { user: null, profile: null };
    authCache = result;
    return result;
  }

  const result = await response.json();
  const authData = {
    user: result?.data?.user ?? null,
    profile: result?.data?.profile ?? null,
  };
  
  // Update cache
  authCache = authData;
  
  return authData;
}

// Clear the auth cache (useful after login/logout)
export function clearAuthCache(): void {
  authCache = null;
}

// Update auth cache without API call (useful after profile updates)
export function updateAuthCache(user: AuthUser | null, profile: AuthProfile | null): void {
  authCache = { user, profile };
}

export async function startOAuth(provider: 'google' | 'facebook', redirectTo: string): Promise<string> {
  const response = await fetch('/api/auth/oauth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, redirectTo }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message || 'Social authentication failed');
  }

  return result?.data?.url;
}

export async function loginWithEmail(payload: { email: string; password: string }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return { response, result };
}

export async function signupWithEmail(payload: Record<string, unknown>) {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  return { response, result };
}

export async function resendConfirmationEmail(payload: { email: string; redirectTo?: string }) {
  const response = await fetch('/api/auth/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.ok;
}