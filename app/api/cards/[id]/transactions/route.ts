/**
 * API Route: /api/cards/[id]/transactions
 * Get transaction history for a card
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { Transaction } from '@/types/card.types';

/**
 * GET /api/cards/[id]/transactions
 * Get transactions for a specific card
 */
export async function GET(
  request: NextRequest,
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
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify card belongs to user
    const { data: card, error: cardError } = await supabase
      .from('connected_credit_cards')
      .select('id, flinks_account_id')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Card not found'),
        { status: 404 }
      );
    }

    // For now, return mock data since we need to integrate with Flinks for real transactions
    // TODO: Fetch real transactions from Flinks API using card.flinks_account_id
    const mockTransactions: Transaction[] = generateMockTransactions(cardId, limit);

    return NextResponse.json(
      createSuccessResponse({
        transactions: mockTransactions,
        total: mockTransactions.length,
        limit,
        offset,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/cards/[id]/transactions:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}

/**
 * Generate mock transactions for development
 * TODO: Replace with real Flinks transaction data
 */
function generateMockTransactions(cardId: string, count: number): Transaction[] {
  const categories = ['Groceries', 'Gas', 'Dining', 'Shopping', 'Entertainment', 'Bills'];
  const merchants = ['Walmart', 'Shell', 'Restaurant', 'Amazon', 'Netflix', 'Utility Co'];
  
  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    return {
      id: `txn_${cardId}_${i}`,
      cardId,
      date: date.toISOString(),
      description: `Transaction ${i + 1}`,
      amount: Math.floor(Math.random() * 200) + 10,
      category: categories[Math.floor(Math.random() * categories.length)],
      merchantName: merchants[Math.floor(Math.random() * merchants.length)],
    };
  });
}
