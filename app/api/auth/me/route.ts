/**
 * API Route: GET /api/auth/me
 * Returns authenticated user and profile (server-side)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHENTICATED', 'User not authenticated'),
        { status: 401 }
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

        return NextResponse.json(
          createSuccessResponse({ user, profile: createdProfile }),
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      createSuccessResponse({ user, profile }),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}
