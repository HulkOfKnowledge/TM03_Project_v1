/**
 * API Route: /api/cards/offers
 * Returns personalized credit card recommendations
 * Supports filtering by category, income range, and occupation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { CardOffer, CardCategory, IncomeRange, OccupationType } from '@/types/card-offers.types';
import { INCOME_RANGES } from '@/types/card-offers.types';

export const dynamic = 'force-dynamic';

/**
 * Compute a personalization match score (0–100) for a card offer
 * given the user's income range and occupation.
 */
function computeMatchScore(
  card: Record<string, unknown>,
  incomeRange: IncomeRange,
  occupation: OccupationType,
): number {
  let score = 50; // base

  const incomeEntry = INCOME_RANGES.find((r) => r.value === incomeRange);
  const userIncome = incomeEntry?.minValue ?? null;

  // Income eligibility
  const minIncome = card.min_annual_income as number | null;
  if (minIncome !== null && userIncome !== null) {
    if (userIncome >= minIncome) {
      score += 20;
    } else {
      score -= 30; // user doesn't meet income requirement
    }
  } else if (minIncome === null) {
    score += 10; // no income requirement — accessible
  }

  // Occupation bonuses
  if (occupation === 'student') {
    if (card.eligible_for_students) score += 25;
    else score -= 10;
  }
  if (occupation === 'newcomer') {
    if (card.eligible_for_newcomers) score += 25;
    else score -= 5;
  }
  if (occupation === 'student' || occupation === 'newcomer') {
    // Prefer no-fee and secured cards
    const categories = card.categories as string[];
    if (categories.includes('no-fee') || categories.includes('secured')) score += 15;
  }

  // Featured cards get a small boost
  if (card.is_featured) score += 5;

  return Math.min(100, Math.max(0, score));
}

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
    const category = (searchParams.get('category') || 'all') as CardCategory;
    const incomeRange = (searchParams.get('income') || 'any') as IncomeRange;
    const occupation = (searchParams.get('occupation') || 'all') as OccupationType;

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
    const incomeEntry = INCOME_RANGES.find((r) => r.value === incomeRange);
    if (incomeEntry && incomeEntry.minValue !== null) {
      // Only show cards the user is eligible for
      query = query.or(
        `min_annual_income.is.null,min_annual_income.lte.${incomeEntry.minValue}`
      );
    }

    // Occupation — student filter
    if (occupation === 'student') {
      // Show student-eligible and no-min-income cards
      query = query.or('eligible_for_students.eq.true,min_annual_income.is.null');
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error fetching card offers:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch card offers'),
        { status: 500 }
      );
    }

    const offers: CardOffer[] = (rows || []).map((row) => ({
      id: row.id,
      name: row.name,
      issuer: row.issuer,
      network: row.network as CardOffer['network'],
      categories: row.categories ?? [],
      annualFee: Number(row.annual_fee),
      purchaseRate: row.purchase_rate !== null ? Number(row.purchase_rate) : null,
      cashAdvanceRate: row.cash_advance_rate !== null ? Number(row.cash_advance_rate) : null,
      minAnnualIncome: row.min_annual_income !== null ? Number(row.min_annual_income) : null,
      minCreditScore: row.min_credit_score ?? null,
      eligibleForStudents: Boolean(row.eligible_for_students),
      eligibleForNewcomers: Boolean(row.eligible_for_newcomers),
      welcomeBonus: row.welcome_bonus ?? null,
      welcomeBonusValue: row.welcome_bonus_value !== null ? Number(row.welcome_bonus_value) : null,
      earnRateDescription: row.earn_rate_description ?? null,
      earnRateGrocery: row.earn_rate_grocery !== null ? Number(row.earn_rate_grocery) : null,
      earnRateTravel: row.earn_rate_travel !== null ? Number(row.earn_rate_travel) : null,
      earnRateDining: row.earn_rate_dining !== null ? Number(row.earn_rate_dining) : null,
      earnRateOther: row.earn_rate_other !== null ? Number(row.earn_rate_other) : null,
      perks: row.perks ?? [],
      insurance: row.insurance ?? [],
      cardGradient: row.card_gradient,
      isFeatured: Boolean(row.is_featured),
      displayOrder: row.display_order,
      applyUrl: row.apply_url ?? null,
      matchScore: computeMatchScore(row, incomeRange, occupation),
    }));

    // Sort: featured + high score first
    offers.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return (b.matchScore ?? 0) - (a.matchScore ?? 0);
    });

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
