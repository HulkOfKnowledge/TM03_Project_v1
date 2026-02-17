/**
 * API Route: /api/cards/[id]/monthly-history
 * Get monthly payment and utilization history for a card
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { CardHistoryRow } from '@/types/card.types';

/**
 * GET /api/cards/[id]/monthly-history
 * Get monthly history for a specific card
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

    // Verify card belongs to user
    const { data: card, error: cardError } = await supabase
      .from('connected_credit_cards')
      .select('id')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Card not found'),
        { status: 404 }
      );
    }

    // Fetch credit data history for the card (monthly snapshots)
    const { data: history, error } = await supabase
      .from('credit_data_cache')
      .select('*')
      .eq('card_id', cardId)
      .order('synced_at', { ascending: false })
      .limit(12); // Get last 12 months

    if (error) {
      console.error('Error fetching monthly history:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch history'),
        { status: 500 }
      );
    }

    // Transform to CardHistoryRow format
    const monthlyHistory: CardHistoryRow[] = (history || []).map((record: any, index: number) => {
      const date = new Date(record.synced_at);
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      
      // Calculate zone based on utilization
      let zone: 'Safe' | 'Caution' | 'Danger' = 'Safe';
      if (record.utilization_percentage >= 30) {
        zone = 'Danger';
      } else if (record.utilization_percentage >= 25) {
        zone = 'Caution';
      }

      // Get previous record for comparison
      const prevRecord = history[index + 1];
      const startBalance = prevRecord?.current_balance || record.current_balance;

      return {
        month: monthName,
        zone,
        startBalance,
        endingBalance: record.current_balance,
        peakUsage: record.current_balance, // This would ideally track the max balance during the month
        payment: record.last_payment_amount || 0,
        utilizationPercentage: record.utilization_percentage,
      };
    });

    return NextResponse.json(
      createSuccessResponse(monthlyHistory),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/cards/[id]/monthly-history:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
