/**
 * API Route: GET /api/demo/card-dashboard
 * Returns consolidated demo data for the card dashboard UI
 */

import { NextResponse } from 'next/server';
import { demoDataService } from '@/services/demo-data.service';
import { createErrorResponse, createSuccessResponse } from '@/types/api.types';

export async function GET() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (!isDemoMode) {
    return NextResponse.json(
      createErrorResponse('NOT_FOUND', 'Demo endpoint is disabled'),
      { status: 404 }
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      createErrorResponse(
        'CONFIG_ERROR',
        'Missing Supabase admin configuration for demo mode.'
      ),
      { status: 500 }
    );
  }

  try {
    const data = await demoDataService.getDashboardData();

    return NextResponse.json(createSuccessResponse(data));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to load demo dashboard data';

    console.error('[demo-card-dashboard]', message);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', message),
      { status: 500 }
    );
  }
}
