/**
 * API Route: /api/cards/[id]/transactions
 * Get transaction history for a card from card_transactions table.
 * Flinks /GetAccountsDetail syncs once integration is live.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { Transaction } from '@/types/card.types';

/**
 * GET /api/cards/[id]/transactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    const cardId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const limit  = Math.min(parseInt(searchParams.get('limit')  || '50'), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // Verify card belongs to the authenticated user
    const { data: card, error: cardError } = await supabase
      .from('connected_credit_cards')
      .select('id')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json(createErrorResponse('NOT_FOUND', 'Card not found'), { status: 404 });
    }

    const { data: rows, error: txnError, count } = await supabase
      .from('card_transactions')
      .select('*', { count: 'exact' })
      .eq('card_id', cardId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (txnError) {
      console.error('Error fetching transactions:', txnError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch transactions'),
        { status: 500 }
      );
    }

    const transactions: Transaction[] = (rows ?? []).map((row) => ({
      id:           row.id,
      cardId:       row.card_id,
      date:         row.date,
      description:  row.description,
      // Expose net amount: debits (purchases) are positive, credits (payments) negative
      amount:       row.debit ?? (row.credit != null ? -row.credit : 0),
      balance:      row.balance ?? null,  // Include balance from database
      category:     row.raw_category ?? null,
      merchantName: null, // populated when Flinks Enrich /GetCategorization is integrated
    }));

    return NextResponse.json(
      createSuccessResponse({ transactions, total: count ?? transactions.length, limit, offset }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/cards/[id]/transactions:', error);
    return NextResponse.json(createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'), { status: 500 });
  }
}
