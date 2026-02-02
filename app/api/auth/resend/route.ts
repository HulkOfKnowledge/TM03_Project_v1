/**
 * API Route: POST /api/auth/resend
 * Resend confirmation email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json();

    if (!email) {
      return NextResponse.json(
        createErrorResponse('INVALID_REQUEST', 'Missing email'),
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });

    if (error) {
      return NextResponse.json(
        createErrorResponse('RESEND_FAILED', error.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ sent: true }),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}