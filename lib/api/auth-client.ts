/**
 * Client-side helpers for auth API routes
 */

import type { User } from '@supabase/supabase-js';

// In-memory cache for auth requests
let authCache: { user: User | null; profile: any | null } | null = null;
let authCacheTimestamp: number = 0;
const AUTH_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function fetchAuthMe(forceRefresh: boolean = false): Promise<{ user: User | null; profile: any | null }> {
  const now = Date.now();
  
  // Return cached data if available and fresh
  if (!forceRefresh && authCache && (now - authCacheTimestamp) < AUTH_CACHE_DURATION) {
    return authCache;
  }

  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const result = { user: null, profile: null };
    authCache = result;
    authCacheTimestamp = now;
    return result;
  }

  const result = await response.json();
  const authData = {
    user: result?.data?.user ?? null,
    profile: result?.data?.profile ?? null,
  };
  
  // Update cache
  authCache = authData;
  authCacheTimestamp = now;
  
  return authData;
}

// Clear the auth cache (useful after login/logout)
export function clearAuthCache(): void {
  authCache = null;
  authCacheTimestamp = 0;
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