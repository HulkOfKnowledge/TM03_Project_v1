/**
 * API Route: POST /api/onboarding/progress
 * Saves onboarding progress for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHENTICATED', 'User not authenticated'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { onboarding_stage, onboarding_substep, onboarding_data } = body ?? {};

    if (!onboarding_stage || !onboarding_substep) {
      return NextResponse.json(
        createErrorResponse('INVALID_REQUEST', 'Missing onboarding stage or substep'),
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        onboarding_stage,
        onboarding_substep,
        onboarding_data,
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        createErrorResponse('UPDATE_FAILED', updateError.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ saved: true }),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}