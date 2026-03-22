/**
 * Credit Card Offers & Recommendations Types
 */

export type CardNetwork = 'visa' | 'mastercard' | 'amex';

export type CardCategory =
  | 'all'
  | 'travel'
  | 'cashback'
  | 'student'
  | 'no-fee'
  | 'rewards'
  | 'secured';

export type IncomeRange =
  | 'any'
  | 'under-30k'
  | '30k-60k'
  | '60k-80k'
  | '80k-100k'
  | '100k+';

export type OccupationType =
  | 'all'
  | 'student'
  | 'employee'
  | 'self-employed'
  | 'newcomer'
  | 'retired';

export interface CardOffer {
  id: string;
  name: string;
  issuer: string;
  network: CardNetwork;
  categories: string[];

  // Financials
  annualFee: number;
  purchaseRate: number | null;
  cashAdvanceRate: number | null;

  // Eligibility
  minAnnualIncome: number | null;
  minCreditScore: number | null;
  eligibleForStudents: boolean;
  eligibleForNewcomers: boolean;

  // Welcome bonus
  welcomeBonus: string | null;
  welcomeBonusValue: number | null;

  // Earn rates
  earnRateDescription: string | null;
  earnRateGrocery: number | null;
  earnRateTravel: number | null;
  earnRateDining: number | null;
  earnRateOther: number | null;

  // Benefits
  perks: string[];
  insurance: string[];

  // Display
  cardGradient: string;
  isFeatured: boolean;
  displayOrder: number;
  applyUrl: string | null;

  // Source metadata
  sourceProvider?: string | null;
  sourceExternalId?: string | null;
  sourceUrl?: string | null;
  sourceImageUrl?: string | null;
  sourceCategories?: string[];
  sourceMatchCount?: number;
  sourceLastSyncedAt?: string | null;

  // Personalization score (computed server-side)
  matchScore?: number;
}

export interface CardOffersFilters {
  category: CardCategory;
  incomeRange: IncomeRange;
  occupation: OccupationType;
}

export interface CardOffersResponse {
  offers: CardOffer[];
  totalCount: number;
  personalizedFor: {
    incomeRange: IncomeRange;
    occupation: OccupationType;
  } | null;
}

export const CARD_CATEGORIES: { value: CardCategory; label: string }[] = [
  { value: 'all', label: 'All Cards' },
  { value: 'travel', label: 'Travel' },
  { value: 'cashback', label: 'Cash Back' },
  { value: 'no-fee', label: 'No Annual Fee' },
  { value: 'rewards', label: 'Rewards' },
  { value: 'student', label: 'Student' },
  { value: 'secured', label: 'Secured' },
];

export const INCOME_RANGES: { value: IncomeRange; label: string; minValue: number | null; maxValue: number | null }[] = [
  { value: 'any', label: 'Any income', minValue: null, maxValue: null },
  { value: 'under-30k', label: 'Under $30,000', minValue: 0, maxValue: 29999 },
  { value: '30k-60k', label: '$30,000 – $60,000', minValue: 30000, maxValue: 60000 },
  { value: '60k-80k', label: '$60,000 – $80,000', minValue: 60000, maxValue: 80000 },
  { value: '80k-100k', label: '$80,000 – $100,000', minValue: 80000, maxValue: 100000 },
  { value: '100k+', label: '$100,000+', minValue: 100000, maxValue: null },
];

export const OCCUPATION_TYPES: { value: OccupationType; label: string }[] = [
  { value: 'all', label: 'All occupations' },
  { value: 'employee', label: 'Employed (full-time/part-time)' },
  { value: 'self-employed', label: 'Self-employed / Freelance' },
  { value: 'student', label: 'Student' },
  { value: 'newcomer', label: 'Newcomer to Canada' },
  { value: 'retired', label: 'Retired' },
];
