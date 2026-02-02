/**
 * API Route: POST /api/auth/login
 * TODO: Implement user login
 * - Validate request body with loginSchema
 * - Call Supabase auth.signInWithPassword
 * - Return user data and session tokens
 * - Set HTTP-only cookies for session
 * - Handle errors (invalid credentials, user not found)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) {
      return NextResponse.json(
        createErrorResponse('LOGIN_FAILED', authError.message),
        { status: 400 }
      );
    }

    const user = authData.user;

    if (!user) {
      return NextResponse.json(
        createErrorResponse('NO_USER', 'Login failed - no user returned'),
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('preferred_dashboard, onboarding_completed, first_name')
      .eq('id', user.id)
      .single();

    return NextResponse.json(
      createSuccessResponse({ user, profile }),
      { status: 200 }
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'errors' in error) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid request'),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}
