/**
 * API Route: GET /api/auth/me
 * Returns authenticated user and profile (server-side)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { AuthProfile, AuthUser } from '@/types/auth.types';

function createNoStoreResponse(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

function sanitizeUser(user: {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): AuthUser {
  const metadata = user.user_metadata || {};

  return {
    id: user.id,
    email: user.email || null,
    email_confirmed_at: user.email_confirmed_at || null,
    user_metadata: {
      full_name: typeof metadata.full_name === 'string' ? metadata.full_name : null,
      name: typeof metadata.name === 'string' ? metadata.name : null,
      first_name: typeof metadata.first_name === 'string' ? metadata.first_name : null,
      surname: typeof metadata.surname === 'string' ? metadata.surname : null,
      mobile_number: typeof metadata.mobile_number === 'string' ? metadata.mobile_number : null,
      avatar_url: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
      picture: typeof metadata.picture === 'string' ? metadata.picture : null,
      preferred_language: typeof metadata.preferred_language === 'string' ? metadata.preferred_language : null,
    },
  };
}

function sanitizeProfile(profile: {
  onboarding_completed?: boolean | null;
  preferred_dashboard?: 'learn' | 'card' | null;
  first_name?: string | null;
  surname?: string | null;
  mobile_number?: string | null;
  avatar_url?: string | null;
  onboarding_stage?: string | null;
  onboarding_substep?: string | null;
  onboarding_data?: unknown;
} | null): AuthProfile | null {
  if (!profile) return null;

  return {
    onboarding_completed: Boolean(profile.onboarding_completed),
    preferred_dashboard: profile.preferred_dashboard || 'learn',
    first_name: profile.first_name || null,
    surname: profile.surname || null,
    mobile_number: profile.mobile_number || null,
    avatar_url: profile.avatar_url || null,
    onboarding_stage: profile.onboarding_stage || null,
    onboarding_substep: profile.onboarding_substep || null,
    onboarding_data: profile.onboarding_data || null,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return createNoStoreResponse(
        createErrorResponse('UNAUTHENTICATED', 'User not authenticated'),
        401,
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, preferred_dashboard, first_name, surname, mobile_number, avatar_url, onboarding_stage, onboarding_substep, onboarding_data')
      .eq('id', user.id)
      .single();

    const profileErrorAny = profileError as { code?: string } | null;
    const profileMissing = !profile || profileErrorAny?.code === 'PGRST116';

    if (profileMissing) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const nameParts = fullName.split(' ');
      const firstName = user.user_metadata?.first_name || nameParts[0] || '';
      const surname = user.user_metadata?.surname || nameParts.slice(1).join(' ') || '';

      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          surname: surname,
          mobile_number: user.user_metadata?.mobile_number || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          preferred_language: user.user_metadata?.preferred_language || 'en',
          onboarding_completed: false,
          preferred_dashboard: 'learn',
        });

      if (!createError) {
        const { data: createdProfile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed, preferred_dashboard, first_name, surname, mobile_number, avatar_url, onboarding_stage, onboarding_substep, onboarding_data')
          .eq('id', user.id)
          .single();

        return createNoStoreResponse(
          createSuccessResponse({ user: sanitizeUser(user), profile: sanitizeProfile(createdProfile) }),
          200,
        );
      }
    }

    return createNoStoreResponse(
      createSuccessResponse({ user: sanitizeUser(user), profile: sanitizeProfile(profile) }),
      200,
    );
  } catch (error) {
    return createNoStoreResponse(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      500,
    );
  }
}
