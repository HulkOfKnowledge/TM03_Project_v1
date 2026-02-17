/**
 * API Route: /api/cards/[id]/activate
 * Activate a card to make it visible on the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

/**
 * PATCH /api/cards/[id]/activate
 * Activate a specific card
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const cardId = params.id;

    // Verify card belongs to user
    const { data: card, error: cardError } = await supabase
      .from('connected_credit_cards')
      .select('id, user_id')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Card not found'),
        { status: 404 }
      );
    }

    if (card.user_id !== user.id) {
      return NextResponse.json(
        createErrorResponse('FORBIDDEN', 'Access denied'),
        { status: 403 }
      );
    }

    // Activate the card
    const { error: updateError } = await supabase
      .from('connected_credit_cards')
      .update({ is_active: true })
      .eq('id', cardId);

    if (updateError) {
      console.error('Error activating card:', updateError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to activate card'),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ id: cardId, isActive: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/cards/[id]/activate:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
