/**
 * API Route: /api/cards/offers
 * Returns personalized credit card recommendations
 * Supports filtering by category, income range, and occupation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { CardOffer, CardCategory, OccupationType } from '@/types/card-offers.types';
import {
  getIncomeMinValue,
  mapCardOfferRowToDto,
  parseCardOfferFilters,
  sortOffersByRelevance,
  type CardOfferRow,
} from '@/lib/cards/offers-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cards/offers
 * Query params:
 *   category  - CardCategory (all | travel | cashback | student | no-fee | rewards | secured)
 *   income    - IncomeRange  (any | under-30k | 30k-60k | 60k-80k | 80k-100k | 100k+)
 *   occupation - OccupationType (all | student | employee | self-employed | newcomer | retired)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const { category, incomeRange, occupation } = parseCardOfferFilters(searchParams);

    // Build Supabase query
    let query = supabase
      .from('credit_card_offers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Category filter — 'all' skips
    if (category !== 'all') {
      query = query.contains('categories', [category]);
    }

    // Income eligibility filter
    const incomeMinValue = getIncomeMinValue(incomeRange);
    if (incomeMinValue !== null) {
      // Only show cards the user is eligible for
      query = query.or(
        `min_annual_income.is.null,min_annual_income.lte.${incomeMinValue}`
      );
    }

    // Occupation-specific eligibility
    if (occupation === 'student') {
      query = query.or('eligible_for_students.eq.true,min_annual_income.is.null');
    }

    if (occupation === 'newcomer') {
      query = query.or('eligible_for_newcomers.eq.true,min_annual_income.is.null');
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error fetching card offers:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch card offers'),
        { status: 500 }
      );
    }

    const offers: CardOffer[] = ((rows || []) as CardOfferRow[]).map((row) =>
      mapCardOfferRowToDto(row, incomeRange, occupation)
    );

    // Sort: featured + source confidence + match score
    offers.sort(sortOffersByRelevance);

    const isPersonalized = incomeRange !== 'any' || occupation !== 'all';

    return NextResponse.json(
      createSuccessResponse({
        offers,
        totalCount: offers.length,
        personalizedFor: isPersonalized
          ? { incomeRange, occupation }
          : null,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in GET /api/cards/offers:', err);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 }
    );
  }
}
