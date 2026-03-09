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
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-medium'
          : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900',
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          checked
            ? 'border-indigo-500 bg-indigo-500'
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CARD_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
              category === cat.value
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400',
            )}
          >
            {cat.label}
          </button>
        ))}

        <div className="flex-1 flex-shrink-0" />

        <button
          onClick={() => setModalOpen(true)}
          className={cn(
            'flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
            activeFilters > 0
              ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-700 dark:text-indigo-300'
              : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Personalize
          {activeFilters > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white font-bold">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Result summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span>{' '}
          card{totalCount !== 1 ? 's' : ''}
        </p>
        {isPersonalized && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 px-3 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
