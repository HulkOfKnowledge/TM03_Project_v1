/**
 * Client-side helpers for auth API routes
 */

import type { User } from '@supabase/supabase-js';

export async function fetchAuthMe(): Promise<{ user: User | null; profile: any | null }> {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    return { user: null, profile: null };
  }

  const result = await response.json();
  return {
    user: result?.data?.user ?? null,
    profile: result?.data?.profile ?? null,
  };
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