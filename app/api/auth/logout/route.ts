/**
 * API Route: POST /api/auth/logout
 * TODO: Implement user logout
 * - Call Supabase auth.signOut
 * - Clear session cookies
 * - Return success response
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        createErrorResponse('LOGOUT_FAILED', error.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ logged_out: true }),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}
