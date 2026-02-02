/**
 * API Route: POST /api/auth/oauth
 * Returns provider OAuth URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const { provider, redirectTo } = await request.json();

    if (!provider || !redirectTo) {
      return NextResponse.json(
        createErrorResponse('INVALID_REQUEST', 'Missing provider or redirectTo'),
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      return NextResponse.json(
        createErrorResponse('OAUTH_FAILED', error?.message || 'Failed to create OAuth URL'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ url: data.url }),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An error occurred'),
      { status: 500 }
    );
  }
}