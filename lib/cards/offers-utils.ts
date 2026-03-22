import { INCOME_RANGES, type CardOffer, type CardCategory, type CardOffersFilters, type IncomeRange, type OccupationType } from '@/types/card-offers.types';

export interface CardOfferRow {
  id: string;
  name: string;
  issuer: string;
  network: CardOffer['network'];
  categories: string[] | null;
  annual_fee: number | string;
  purchase_rate: number | string | null;
  cash_advance_rate: number | string | null;
  min_annual_income: number | string | null;
  min_credit_score: number | null;
  eligible_for_students: boolean;
  eligible_for_newcomers: boolean;
  welcome_bonus: string | null;
  welcome_bonus_value: number | string | null;
  earn_rate_description: string | null;
  earn_rate_grocery: number | string | null;
  earn_rate_travel: number | string | null;
  earn_rate_dining: number | string | null;
  earn_rate_other: number | string | null;
  perks: string[] | null;
  insurance: string[] | null;
  card_gradient: string;
  is_featured: boolean;
  display_order: number;
  apply_url: string | null;
  source_provider?: string | null;
  source_external_id?: string | null;
  source_url?: string | null;
  source_image_url?: string | null;
  source_categories?: string[] | null;
  source_match_count?: number | null;
  source_last_synced_at?: string | null;
}

const VALID_CATEGORIES: CardCategory[] = ['all', 'travel', 'cashback', 'student', 'no-fee', 'rewards', 'secured'];
const VALID_INCOME_RANGES: IncomeRange[] = ['any', 'under-30k', '30k-60k', '60k-80k', '80k-100k', '100k+'];
const VALID_OCCUPATIONS: OccupationType[] = ['all', 'student', 'employee', 'self-employed', 'newcomer', 'retired'];

export function parseCardOfferFilters(searchParams: URLSearchParams): CardOffersFilters {
  const rawCategory = (searchParams.get('category') || 'all') as CardCategory;
  const rawIncome = (searchParams.get('income') || 'any') as IncomeRange;
  const rawOccupation = (searchParams.get('occupation') || 'all') as OccupationType;

  return {
    category: VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'all',
    incomeRange: VALID_INCOME_RANGES.includes(rawIncome) ? rawIncome : 'any',
    occupation: VALID_OCCUPATIONS.includes(rawOccupation) ? rawOccupation : 'all',
  };
}

export function getIncomeMinValue(incomeRange: IncomeRange): number | null {
  const incomeEntry = INCOME_RANGES.find((r) => r.value === incomeRange);
  return incomeEntry?.minValue ?? null;
}

export function computeMatchScore(
  card: Pick<CardOfferRow, 'min_annual_income' | 'eligible_for_students' | 'eligible_for_newcomers' | 'categories' | 'is_featured'>,
  incomeRange: IncomeRange,
  occupation: OccupationType,
): number {
  let score = 50;

  const userIncome = getIncomeMinValue(incomeRange);
  const minIncome = card.min_annual_income !== null ? Number(card.min_annual_income) : null;

  if (minIncome !== null && userIncome !== null) {
    if (userIncome >= minIncome) {
      score += 20;
    } else {
      score -= 30;
    }
  } else if (minIncome === null) {
    score += 10;
  }

  if (occupation === 'student') {
    if (card.eligible_for_students) score += 25;
    else score -= 10;
  }

  if (occupation === 'newcomer') {
    if (card.eligible_for_newcomers) score += 25;
    else score -= 5;
  }

  if (occupation === 'student' || occupation === 'newcomer') {
    const categories = card.categories ?? [];
    if (categories.includes('no-fee') || categories.includes('secured')) score += 15;
  }

  if (card.is_featured) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function mapCardOfferRowToDto(row: CardOfferRow, incomeRange: IncomeRange, occupation: OccupationType): CardOffer {
  return {
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    network: row.network,
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
    sourceProvider: row.source_provider ?? null,
    sourceExternalId: row.source_external_id ?? null,
    sourceUrl: row.source_url ?? null,
    sourceImageUrl: row.source_image_url ?? null,
    sourceCategories: row.source_categories ?? [],
    sourceMatchCount: row.source_match_count ?? 0,
    sourceLastSyncedAt: row.source_last_synced_at ?? null,
    matchScore: computeMatchScore(row, incomeRange, occupation),
  };
}

export function sortOffersByRelevance(a: CardOffer, b: CardOffer): number {
  if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;

  const aSourceCount = a.sourceMatchCount ?? 0;
  const bSourceCount = b.sourceMatchCount ?? 0;
  if (aSourceCount !== bSourceCount) return bSourceCount - aSourceCount;

  return (b.matchScore ?? 0) - (a.matchScore ?? 0);
}
