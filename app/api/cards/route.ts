/**
 * API Route: /api/cards
 * Manage user's connected credit cards
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { ConnectedCard } from '@/types/card.types';

/**
 * GET /api/cards
 * Get all connected cards for the authenticated user
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

    // Fetch connected cards with their credit data
    const { data: cards, error } = await supabase
      .from('connected_credit_cards')
      .select(`
        *,
        credit_data:credit_data_cache(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cards:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch cards'),
        { status: 500 }
      );
    }

    // Transform database records to ConnectedCard format
    const connectedCards: ConnectedCard[] = (cards || []).map((card: any) => {
      const creditData = Array.isArray(card.credit_data) && card.credit_data.length > 0 
        ? card.credit_data[0] 
        : null;

      return {
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
    });

    return NextResponse.json(
      createSuccessResponse(connectedCards),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/cards:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/cards
 * Connect a new credit card
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      flinksLoginId,
      flinksAccountId,
      institutionName,
      cardType,
      cardLastFour,
      cardNetwork,
    } = body;

    // Validate required fields
    if (!flinksLoginId || !flinksAccountId || !institutionName || !cardType || !cardLastFour) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Missing required fields'),
        { status: 400 }
      );
    }

    // Insert connected card
    const { data: newCard, error: insertError } = await supabase
      .from('connected_credit_cards')
      .insert({
        user_id: user.id,
        flinks_login_id: flinksLoginId,
        flinks_account_id: flinksAccountId,
        institution_name: institutionName,
        card_type: cardType,
        card_last_four: cardLastFour,
        card_network: cardNetwork || 'other',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting card:', insertError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to connect card'),
        { status: 500 }
      );
    }

    // Transform to ConnectedCard format
    const connectedCard: ConnectedCard = {
      id: newCard.id,
      name: `${newCard.institution_name} ${newCard.card_network || ''}`.trim(),
      bank: newCard.institution_name,
      type: newCard.card_network === 'visa' ? 'visa' : 'mastercard',
      lastFour: newCard.card_last_four,
      currentBalance: 0,
      creditLimit: 0,
      availableCredit: 0,
      utilizationPercentage: 0,
      minimumPayment: 0,
      paymentDueDate: null,
      lastPaymentAmount: null,
      lastPaymentDate: null,
      interestRate: null,
      lastSyncedAt: newCard.last_synced_at,
      isActive: newCard.is_active,
    };

    return NextResponse.json(
      createSuccessResponse(connectedCard),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/cards:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
