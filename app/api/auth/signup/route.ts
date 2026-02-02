/**
 * API Route: POST /api/auth/signup
 * TODO: Implement user registration
 * - Validate request body with signupSchema
 * - Call Supabase auth.signUp
 * - User profile created automatically via trigger
 * - Send verification email if email confirmation enabled
 * - Return user data and session tokens
 * - Handle errors (email already exists, weak password)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { signupSchema } from '@/lib/validations';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);
    const emailRedirectTo = body?.emailRedirectTo as string | undefined;

    const supabase = await createClient();

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', validatedData.email)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        createErrorResponse('EMAIL_EXISTS', 'An account with this email already exists'),
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: emailRedirectTo || undefined,
        data: {
          first_name: validatedData.first_name,
          surname: validatedData.surname,
          mobile_number: validatedData.mobile_number,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        createErrorResponse('SIGNUP_FAILED', authError.message),
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        createErrorResponse('NO_USER', 'Signup failed - no user returned'),
        { status: 400 }
      );
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        first_name: validatedData.first_name,
        surname: validatedData.surname,
        mobile_number: validatedData.mobile_number,
        preferred_language: 'en',
        onboarding_completed: false,
        preferred_dashboard: 'learn',
      });

    if (profileError) {
      // Continue anyway; profile may be created by a trigger
      console.error('Profile creation error:', profileError);
    }

    return NextResponse.json(
      createSuccessResponse({ user: authData.user }),
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
