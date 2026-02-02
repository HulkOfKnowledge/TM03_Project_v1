/**
 * API Route: POST /api/onboarding/complete
 * Completes onboarding and updates user profile
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
    const { personalDetails, accountSetup, isEditingPassword } = body ?? {};

    if (!personalDetails || !accountSetup) {
      return NextResponse.json(
        createErrorResponse('INVALID_REQUEST', 'Missing onboarding data'),
        { status: 400 }
      );
    }

    // Update password if requested
    if (isEditingPassword && personalDetails?.password) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: personalDetails.password,
      });

      if (passwordError) {
        return NextResponse.json(
          createErrorResponse('PASSWORD_UPDATE_FAILED', passwordError.message),
          { status: 400 }
        );
      }
    }

    const creditKnowledge = accountSetup.creditKnowledge;
    const preferred_dashboard =
      creditKnowledge === 'intermediate' || creditKnowledge === 'advanced'
        ? 'card'
        : 'learn';

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        first_name: personalDetails.firstName,
        surname: personalDetails.surname,
        mobile_number: personalDetails.mobileNumber,
        status_in_canada: accountSetup.statusInCanada,
        province: accountSetup.province,
        primary_goal: accountSetup.primaryGoal,
        credit_products: accountSetup.creditProducts,
        immigration_status: accountSetup.immigrationStatus,
        credit_knowledge: accountSetup.creditKnowledge,
        current_situation: accountSetup.currentSituation,
        preferred_dashboard,
        onboarding_stage: null,
        onboarding_substep: null,
        onboarding_data: null,
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        createErrorResponse('UPDATE_FAILED', updateError.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ completed: true, preferred_dashboard }),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}