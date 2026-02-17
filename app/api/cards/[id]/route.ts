/**
 * API Route: /api/cards/[id]
 * Get or delete a specific credit card
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { ConnectedCard } from '@/types/card.types';

/**
 * GET /api/cards/[id]
 * Get details of a specific card
 */
export async function GET(
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

    // Fetch card with credit data
    const { data: card, error } = await supabase
      .from('connected_credit_cards')
      .select(`
        *,
        credit_data:credit_data_cache(*)
      `)
      .eq('id', cardId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !card) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Card not found'),
        { status: 404 }
      );
    }

    // Get the most recent credit data
    const creditData = Array.isArray(card.credit_data) && card.credit_data.length > 0 
      ? card.credit_data[0] 
      : null;

    const connectedCard: ConnectedCard = {
      id: card.id,
      name: `${card.institution_name} ${card.card_network || ''}`.trim(),
      bank: card.institution_name,
      type: card.card_network === 'visa' ? 'visa' : 'mastercard',
      lastFour: card.card_last_four,
      currentBalance: creditData?.current_balance || 0,
      creditLimit: creditData?.credit_limit || 0,
      availableCredit: creditData?.available_credit || 0,
      utilizationPercentage: creditData?.utilization_percentage || 0,
      minimumPayment: creditData?.minimum_payment || 0,
      paymentDueDate: creditData?.payment_due_date || null,
      lastPaymentAmount: creditData?.last_payment_amount || null,
      lastPaymentDate: creditData?.last_payment_date || null,
      interestRate: creditData?.interest_rate || null,
      lastSyncedAt: card.last_synced_at,
      isActive: card.is_active,
    };

    return NextResponse.json(
      createSuccessResponse(connectedCard),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/cards/[id]:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cards/[id]
 * Disconnect a credit card (soft delete)
 */
export async function DELETE(
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

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('connected_credit_cards')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', cardId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting card:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to disconnect card'),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/cards/[id]:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
