/**
 * OffersFilterBar
 * Category chips + personalization via modal
 */

'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import {
  CARD_CATEGORIES,
  INCOME_RANGES,
  OCCUPATION_TYPES,
  type CardCategory,
  type IncomeRange,
  type OccupationType,
} from '@/types/card-offers.types';

interface OffersFilterBarProps {
  category: CardCategory;
  incomeRange: IncomeRange;
  occupation: OccupationType;
  onCategoryChange: (v: CardCategory) => void;
  onIncomeChange: (v: IncomeRange) => void;
  onOccupationChange: (v: OccupationType) => void;
  totalCount: number;
  isPersonalized: boolean;
}

function RadioRow({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all border',
        checked
          ? 'border-brand bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand font-medium'
          : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900',
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          checked
            ? 'border-brand bg-brand'
            : 'border-gray-300 dark:border-gray-600',
        )}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  );
}

export function OffersFilterBar({
  category,
  incomeRange,
  occupation,
  onCategoryChange,
  onIncomeChange,
  onOccupationChange,
  totalCount,
  isPersonalized,
}: OffersFilterBarProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const activeFilters = (incomeRange !== 'any' ? 1 : 0) + (occupation !== 'all' ? 1 : 0);

  const clearPersonalization = () => {
    onIncomeChange('any');
    onOccupationChange('all');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Category tabs + personalize button */}
      <div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:#9CA3AF_#F3F4F6] dark:[scrollbar-color:#6B7280_#1F2937] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb:hover]:bg-gray-500 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-400">
          {CARD_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
                category === cat.value
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand hover:text-brand dark:hover:text-brand',
              )}
            >
              {cat.label}
            </button>
          ))}

          <div className="hidden flex-1 flex-shrink-0 sm:flex" />

          <button
            onClick={() => setModalOpen(true)}
            className={cn(
              'hidden flex-shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all sm:flex',
              activeFilters > 0
                ? 'bg-brand/10 dark:bg-brand/20 border-brand text-brand dark:text-brand'
                : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand hover:text-brand dark:hover:text-brand',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Personalize
            {activeFilters > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-white font-bold">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Result summary */}
      <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-3 sm:flex-wrap">
        <p className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          Showing{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>{' '}
          card{totalCount !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className={cn(
            'flex flex-shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all sm:hidden',
            activeFilters > 0
              ? 'bg-brand/10 dark:bg-brand/20 border-brand text-brand dark:text-brand'
              : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand hover:text-brand dark:hover:text-brand',
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Personalize
          {activeFilters > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
              {activeFilters}
            </span>
          )}
        </button>
        {isPersonalized && (
          <span className="hidden sm:inline-flex flex-shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full bg-brand/10 dark:bg-brand/20 px-3 py-0.5 text-xs font-medium text-brand dark:text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            Personalized for you
          </span>
        )}
      </div>

      {/* Personalization modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Personalize Results"
        description="Tell us about yourself to see the cards that match your profile best."
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Annual Income
            </p>
            <div className="flex flex-col gap-1">
              {INCOME_RANGES.map((r) => (
                <RadioRow
                  key={r.value}
                  label={r.label}
                  checked={incomeRange === r.value}
                  onClick={() => onIncomeChange(r.value)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Occupation / Situation
            </p>
            <div className="flex flex-col gap-1">
              {OCCUPATION_TYPES.map((o) => (
                <RadioRow
                  key={o.value}
                  label={o.label}
                  checked={occupation === o.value}
                  onClick={() => onOccupationChange(o.value)}
                />
              ))}
            </div>
          </div>
        </div>

        {activeFilters > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={() => { clearPersonalization(); setModalOpen(false); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-brand hover:bg-brand/90 text-white text-sm font-semibold transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
