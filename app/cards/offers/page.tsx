/**
 * Card Offers Page
 * Personalized credit card recommendations based on income, occupation & category
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { CardOfferCard } from '@/components/cards/offers/CardOfferCard';
import { CardCompareModal } from '@/components/cards/offers/CardCompareModal';
import { OffersFilterBar } from '@/components/cards/offers/OffersFilterBar';
import { CardOffersSkeleton } from '@/components/cards/offers/CardOffersSkeleton';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { CreditCard, X, GitCompare, Search } from 'lucide-react';
import type { CardOffer, CardCategory, IncomeRange, OccupationType } from '@/types/card-offers.types';

const MAX_COMPARE = 3;
const MOBILE_MAX_COMPARE = 2;
const OFFERS_PER_PAGE_DESKTOP = 12;
const OFFERS_PER_PAGE_MOBILE = 10;

export default function CardOffersPage() {
  const [offers, setOffers] = useState<CardOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState<CardCategory>('all');
  const [incomeRange, setIncomeRange] = useState<IncomeRange>('any');
  const [occupation, setOccupation] = useState<OccupationType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Comparison
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const maxCompare = isMobile ? MOBILE_MAX_COMPARE : MAX_COMPARE;
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = isMobile ? OFFERS_PER_PAGE_MOBILE : OFFERS_PER_PAGE_DESKTOP;

  const isPersonalized = incomeRange !== 'any' || occupation !== 'all';

  const fetchOffers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        category,
        income: incomeRange,
        occupation,
      });

      const res = await fetch(`/api/cards/offers?${params.toString()}`);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to load offers');
      }

      const result = await res.json();
      setOffers(result.data?.offers ?? []);
    } catch (e) {
      console.error('Error fetching card offers:', e);
      setError('Could not load card offers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [category, incomeRange, occupation]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, incomeRange, occupation, searchQuery]);

  const filteredOffers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return offers;

    return offers.filter((offer) => {
      const cardName = offer.name.toLowerCase();
      const bankName = offer.issuer.toLowerCase();
      return cardName.includes(query) || bankName.includes(query);
    });
  }, [offers, searchQuery]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    setCompareIds(prev => {
      if (prev.size <= maxCompare) return prev;
      return new Set(Array.from(prev).slice(0, maxCompare));
    });
  }, [maxCompare]);

  useEffect(() => {
    if (showCompare && compareIds.size < 2) {
      setShowCompare(false);
    }
  }, [showCompare, compareIds]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const paginatedOffers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredOffers.slice(start, start + pageSize);
  }, [filteredOffers, safePage, pageSize]);

  const handleToggleCompare = (offer: CardOffer) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(offer.id)) {
        next.delete(offer.id);
      } else if (next.size < maxCompare) {
        next.add(offer.id);
      }
      return next;
    });
  };

  const handleRemoveFromCompare = (offerId: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      next.delete(offerId);
      return next;
    });
  };

  const selectedOffers = offers.filter((o) => compareIds.has(o.id));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-28 lg:pt-40 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="mb-3 text-3xl font-bold text-brand md:text-4xl">Card Offers</h1>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-xl">
              Explore top Canadian credit cards tailored to your income, lifestyle and goals. Compare side-by-side to find the best fit.
            </p>
          </div>

          {/* Filters */}
          {!isLoading && !error && (
            <div className="mb-6">
              <OffersFilterBar
                category={category}
                incomeRange={incomeRange}
                occupation={occupation}
                onCategoryChange={setCategory}
                onIncomeChange={setIncomeRange}
                onOccupationChange={setOccupation}
                totalCount={filteredOffers.length}
                isPersonalized={isPersonalized}
              />
              <div className="mt-4">
                <label htmlFor="offer-search" className="sr-only">Search by card or bank name</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="offer-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by card or bank name"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-700 transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:placeholder:text-gray-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content states */}
          {isLoading ? (
            <CardOffersSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-gray-500 dark:text-gray-400 text-center">{error}</p>
              <button
                onClick={fetchOffers}
                className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">
                {searchQuery ? 'No matching cards found' : 'No cards found'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Try adjusting your filters, income range, or search term to see more options.
              </p>
              <button
                onClick={() => {
                  setCategory('all');
                  setIncomeRange('any');
                  setOccupation('all');
                  setSearchQuery('');
                }}
                className="px-5 py-2 rounded-xl border border-brand text-brand text-sm font-medium hover:bg-brand/5 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
              <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 lg:gap-6 lg:p-6">
                {paginatedOffers.map((offer) => (
                  <CardOfferCard
                    key={offer.id}
                    offer={offer}
                    isCompareSelected={compareIds.has(offer.id)}
                    onToggleCompare={handleToggleCompare}
                    compareDisabled={compareIds.size >= maxCompare && !compareIds.has(offer.id)}
                  />
                ))}
              </div>

              <PaginationControls
                currentPage={safePage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredOffers.length}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating compare bar */}
      {compareIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-3 py-3 shadow-2xl backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/95 sm:px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Compare ({compareIds.size}/{maxCompare}):
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                  {selectedOffers.map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 dark:bg-brand/10"
                    >
                      <span
                        className={`inline-block h-2 w-2 rounded-full bg-gradient-to-br ${o.cardGradient}`}
                      />
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200 max-w-[140px] truncate">
                        {o.name}
                      </span>
                      <button
                        onClick={() => handleRemoveFromCompare(o.id)}
                        className="text-gray-400 hover:text-red-500 ml-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-shrink-0">
                <button
                  onClick={() => setCompareIds(new Set())}
                  className="rounded-lg px-3 py-2 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowCompare(true)}
                  disabled={compareIds.size < 2}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial sm:px-5"
                >
                  <GitCompare className="h-4 w-4" />
                  Compare now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare modal */}
      <CardCompareModal
        isOpen={showCompare}
        onClose={() => setShowCompare(false)}
        offers={selectedOffers}
        onRemove={handleRemoveFromCompare}
      />

      <Footer />
    </div>
  );
}
