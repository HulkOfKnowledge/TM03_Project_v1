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

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, preferred_dashboard, first_name, surname, mobile_number, onboarding_stage, onboarding_substep, onboarding_data')
      .eq('id', user.id)
      .single();

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
