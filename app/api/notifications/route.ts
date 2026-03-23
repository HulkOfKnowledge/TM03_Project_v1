import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import { buildRewardNotifications } from '@/lib/notifications/reward-notifications';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    const { data: cards, error: cardsError } = await supabase
      .from('connected_credit_cards')
      .select('id, institution_name, card_last_four')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (cardsError) {
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch cards'),
        { status: 500 }
      );
    }

    if (!cards || cards.length === 0) {
      return NextResponse.json(
        createSuccessResponse({ unreadCount: 0, daily: [], weekly: [], monthly: [] }),
        { status: 200 }
      );
    }

    const cardIds = cards.map((card: any) => card.id);

    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);

    const { data: txns, error: txError } = await supabase
      .from('card_transactions')
      .select('id, card_id, date, description, debit, raw_category')
      .in('card_id', cardIds)
      .gte('date', minDate.toISOString().slice(0, 10))
      .order('date', { ascending: false })
      .limit(5000);

    if (txError) {
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch transactions'),
        { status: 500 }
      );
    }

    const { data: offers } = await supabase
      .from('credit_card_offers')
      .select('issuer, earn_rate_grocery, earn_rate_travel, earn_rate_dining, earn_rate_other')
      .eq('is_active', true)
      .limit(500);

    const summary = buildRewardNotifications({
      cards: cards.map((card: any) => ({
        id: card.id,
        institutionName: card.institution_name,
        lastFour: card.card_last_four,
      })),
      transactions: (txns || []).map((txn: any) => ({
        id: txn.id,
        cardId: txn.card_id,
        date: txn.date,
        description: txn.description,
        amount: Number(txn.debit ?? 0),
        rawCategory: txn.raw_category,
      })),
      offers: (offers || []).map((offer: any) => ({
        issuer: offer.issuer,
        earnRateGrocery: offer.earn_rate_grocery,
        earnRateTravel: offer.earn_rate_travel,
        earnRateDining: offer.earn_rate_dining,
        earnRateOther: offer.earn_rate_other,
      })),
    });

    return NextResponse.json(createSuccessResponse(summary), { status: 200 });
  } catch (error) {
    console.error('Error loading notifications:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to load notifications'),
      { status: 500 }
    );
  }
}
