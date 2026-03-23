/**
 * Client-side helpers for cards API routes
 * Includes in-memory caching to avoid unnecessary API calls
 */

import type { 
  ConnectedCard, 
  Transaction, 
  CardHistoryRow, 
  CreditAnalysisData,
  CardMetricsResponse,
} from '@/types/card.types';

// In-memory caches (session duration, no time-based expiration)
let cardsCache: ConnectedCard[] | null = null;
const transactionsCache: Map<string, Transaction[]> = new Map();
const monthlyHistoryCache: Map<string, CardHistoryRow[]> = new Map();
let creditAnalysisCache: CreditAnalysisData | null = null;

/**
 * Fetch cards with caching support
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Array of connected cards
 */
export async function fetchCards(forceRefresh: boolean = false): Promise<ConnectedCard[]> {
  // Return cached data if available (unless force refresh)
  if (!forceRefresh && cardsCache !== null) {
    return cardsCache;
  }

  try {
    const response = await fetch('/api/cards', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Failed to fetch cards:', response.statusText);
      const result: ConnectedCard[] = [];
      cardsCache = result;
      return result;
    }

    const result = await response.json();
    const cards = result.data || [];
    
    // Update cache
    cardsCache = cards;
    
    return cards;
  } catch (error) {
    console.error('Error fetching cards:', error);
    const result: ConnectedCard[] = [];
    cardsCache = result;
    return result;
  }
}

/**
 * Clear the cards cache
 * Call this after adding/removing cards or when you need fresh data
 */
export function clearCardsCache(): void {
  cardsCache = null;
}

/**
 * Update cache without API call
 * Useful after mutations (add/remove card)
 */
export function updateCardsCache(cards: ConnectedCard[]): void {
  cardsCache = cards;
}

/**
 * Add a card to cache
 */
export function addCardToCache(card: ConnectedCard): void {
  if (cardsCache) {
    cardsCache = [...cardsCache, card];
  }
  clearCardDerivedCaches();
}

/**
 * Remove a card from cache
 */
export function removeCardFromCache(cardId: string): void {
  if (cardsCache) {
    cardsCache = cardsCache.filter(card => card.id !== cardId);
  }
  // Also clear related data for this card
  transactionsCache.delete(`${cardId}`);
  monthlyHistoryCache.delete(cardId);
  clearCardDerivedCaches();
}

/**
 * Clear caches derived from card composition (add/remove/activation state)
 */
export function clearCardDerivedCaches(): void {
  clearCreditAnalysisCache();
  clearMetricsCache();
}

// ============= TRANSACTIONS CACHING =============

/**
 * Fetch card transactions with caching support
 * @param cardId - The card ID
 * @param limit - Number of transactions to fetch
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Array of transactions
 */
export async function fetchCardTransactions(
  cardId: string, 
  limit: number = 50, 
  forceRefresh: boolean = false
): Promise<Transaction[]> {
  const cacheKey = `${cardId}`;
  
  // Return cached data if available (unless force refresh)
  if (!forceRefresh && transactionsCache.has(cacheKey)) {
    return transactionsCache.get(cacheKey) || [];
  }

  try {
    const response = await fetch(`/api/cards/${cardId}/transactions?limit=${limit}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Failed to fetch card transactions');
      const result: Transaction[] = [];
      transactionsCache.set(cacheKey, result);
      return result;
    }

    const result = await response.json();
    const transactions = result.data?.transactions || [];
    
    // Update cache
    transactionsCache.set(cacheKey, transactions);
    
    return transactions;
  } catch (error) {
    console.error('Error fetching card transactions:', error);
    const result: Transaction[] = [];
    transactionsCache.set(cacheKey, result);
    return result;
  }
}

/**
 * Clear transactions cache for a specific card
 */
export function clearCardTransactionsCache(cardId: string): void {
  transactionsCache.delete(`${cardId}`);
}

/**
 * Clear all transactions cache
 */
export function clearAllTransactionsCache(): void {
  transactionsCache.clear();
}

// ============= MONTHLY HISTORY CACHING =============

/**
 * Fetch card monthly history with caching support
 * @param cardId - The card ID
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Array of monthly history rows
 */
export async function fetchCardMonthlyHistory(
  cardId: string, 
  forceRefresh: boolean = false
): Promise<CardHistoryRow[]> {
  // Return cached data if available (unless force refresh)
  if (!forceRefresh && monthlyHistoryCache.has(cardId)) {
    return monthlyHistoryCache.get(cardId) || [];
  }

  try {
    const response = await fetch(`/api/cards/${cardId}/monthly-history`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Failed to fetch card history');
      const result: CardHistoryRow[] = [];
      monthlyHistoryCache.set(cardId, result);
      return result;
    }

    const result = await response.json();
    const history = result.data || [];
    
    // Update cache
    monthlyHistoryCache.set(cardId, history);
    
    return history;
  } catch (error) {
    console.error('Error fetching card history:', error);
    const result: CardHistoryRow[] = [];
    monthlyHistoryCache.set(cardId, result);
    return result;
  }
}

/**
 * Clear monthly history cache for a specific card
 */
export function clearCardMonthlyHistoryCache(cardId: string): void {
  monthlyHistoryCache.delete(cardId);
}

/**
 * Clear all monthly history cache
 */
export function clearAllMonthlyHistoryCache(): void {
  monthlyHistoryCache.clear();
}

// ============= CREDIT ANALYSIS CACHING =============

/**
 * Fetch credit analysis data with caching support
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Credit analysis data or null
 */
export async function fetchCreditAnalysis(
  forceRefresh: boolean = false
): Promise<CreditAnalysisData | null> {
  // Return cached data if available (unless force refresh)
  if (!forceRefresh && creditAnalysisCache !== null) {
    return creditAnalysisCache;
  }

  try {
    const response = await fetch('/api/cards/analysis', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Failed to fetch credit analysis');
      creditAnalysisCache = null;
      return null;
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      creditAnalysisCache = null;
      return null;
    }
    
    const analysisData = result.data;
    
    // Update cache
    creditAnalysisCache = analysisData;
    
    return analysisData;
  } catch (error) {
    console.error('Error fetching credit analysis:', error);
    creditAnalysisCache = null;
    return null;
  }
}

/**
 * Clear credit analysis cache
 */
export function clearCreditAnalysisCache(): void {
  creditAnalysisCache = null;
}

// ============= CARD METRICS CACHING =============

const metricsCache = new Map<string, CardMetricsResponse>();

/**
 * Fetch date-filtered card metrics from the single-source-of-truth endpoint.
 * Results are cached by "startDate:endDate" key.
 */
export async function fetchCardMetrics(
  startDate: string,
  endDate: string,
  forceRefresh: boolean = false,
): Promise<CardMetricsResponse | null> {
  const key = `${startDate}:${endDate}`;
  if (!forceRefresh && metricsCache.has(key)) return metricsCache.get(key) || null;

  try {
    const response = await fetch(
      `/api/cards/metrics?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      { method: 'GET', credentials: 'include' },
    );

    if (!response.ok) {
      console.error('Failed to fetch card metrics:', response.statusText);
      return null;
    }

    const result = await response.json();
    if (!result.success || !result.data) return null;

    metricsCache.set(key, result.data);
    return result.data as CardMetricsResponse;
  } catch (error) {
    console.error('Error fetching card metrics:', error);
    return null;
  }
}

/**
 * Clear the metrics cache
 */
export function clearMetricsCache(): void {
  metricsCache.clear();
}

/**
 * Clear all card-related caches
 * Useful after significant changes or logout
 */
export function clearAllCardCaches(): void {
  cardsCache = null;
  transactionsCache.clear();
  monthlyHistoryCache.clear();
  creditAnalysisCache = null;
  metricsCache.clear();
}
