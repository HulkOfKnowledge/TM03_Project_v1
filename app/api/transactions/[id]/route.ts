import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from('card_transactions')
      .select(`
        id,
        card_id,
        date,
        description,
        debit,
        credit,
        balance,
        raw_category,
        connected_credit_cards!inner(
          user_id,
          institution_name,
          card_last_four
        )
      `)
      .eq('id', params.id)
      .eq('connected_credit_cards.user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Transaction not found'),
        { status: 404 }
      );
    }

    const cardMeta = Array.isArray(data.connected_credit_cards)
      ? data.connected_credit_cards[0]
      : data.connected_credit_cards;

    const payload = {
      id: data.id,
      cardId: data.card_id,
      date: data.date,
      description: data.description,
      amount: Number(data.debit ?? (data.credit != null ? -data.credit : 0)),
      balance: data.balance != null ? Number(data.balance) : null,
      category: data.raw_category,
      cardLabel: cardMeta
        ? `${cardMeta.institution_name} •••• ${cardMeta.card_last_four}`
        : 'Connected card',
      bank: cardMeta?.institution_name ?? null,
      lastFour: cardMeta?.card_last_four ?? null,
    };

    return NextResponse.json(createSuccessResponse(payload), { status: 200 });
  } catch (error) {
    console.error('Error loading transaction details:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to load transaction details'),
      { status: 500 }
    );
  }
}
