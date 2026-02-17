/**
 * API Route: /api/cards/available
 * Get all inactive cards available for connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export const dynamic = 'force-dynamic';

interface CardOption {
  id: string;
  name: string;
  bank: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
}

/**
 * GET /api/cards/available
 * Get all inactive cards for the authenticated user
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    // Fetch inactive cards (available for connection)
    const { data: cards, error } = await supabase
      .from('connected_credit_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', false)
      .order('institution_name', { ascending: true });

    if (error) {
      console.error('Error fetching available cards:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch cards'),
        { status: 500 }
      );
    }

    // Transform to CardOption format
    const availableCards: CardOption[] = (cards || []).map((card: any) => ({
      id: card.id,
      name: `${card.institution_name} ${card.card_network || ''}`.trim(),
      bank: card.institution_name,
      type: card.card_network === 'visa' ? 'visa' : 'mastercard',
      lastFour: card.card_last_four,
    }));

    return NextResponse.json(
      createSuccessResponse(availableCards),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/cards/available:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
