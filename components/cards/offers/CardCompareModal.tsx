/**
 * CardCompareModal
 * Side-by-side comparison of up to 3 credit card offers
 */

'use client';

import { X, Check, Shield, ExternalLink, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardOffer } from '@/types/card-offers.types';

interface CardCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  offers: CardOffer[];
  onRemove: (offerId: string) => void;
}

const COMPARE_ROWS: {
  label: string;
  key: keyof CardOffer | string;
  format?: (v: unknown, offer: CardOffer) => React.ReactNode;
}[] = [
  {
    label: 'Annual Fee',
    key: 'annualFee',
    format: (v) =>
      v === 0 ? (
        <span className="text-green-600 dark:text-green-400 font-semibold">$0 — Free</span>
      ) : (
        <span>${v as number}/yr</span>
      ),
  },
  {
    label: 'Purchase Rate',
    key: 'purchaseRate',
    format: (v) => (v !== null ? `${v}%` : '—'),
  },
  {
    label: 'Cash Advance Rate',
    key: 'cashAdvanceRate',
    format: (v) => (v !== null ? `${v}%` : '—'),
  },
  {
    label: 'Min. Annual Income',
    key: 'minAnnualIncome',
    format: (v) =>
      v !== null ? (
        `$${(v as number).toLocaleString()}`
      ) : (
        <span className="text-green-600 dark:text-green-400">None</span>
      ),
  },
  {
    label: 'Grocery Earn Rate',
    key: 'earnRateGrocery',
    format: (v) =>
      v && (v as number) > 0 ? (
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{v as number}×</span>
      ) : (
        <Minus className="h-4 w-4 text-gray-400" />
      ),
  },
  {
    label: 'Travel Earn Rate',
    key: 'earnRateTravel',
    format: (v) =>
      v && (v as number) > 0 ? (
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{v as number}×</span>
      ) : (
        <Minus className="h-4 w-4 text-gray-400" />
      ),
  },
  {
    label: 'Dining Earn Rate',
    key: 'earnRateDining',
    format: (v) =>
      v && (v as number) > 0 ? (
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{v as number}×</span>
      ) : (
        <Minus className="h-4 w-4 text-gray-400" />
      ),
  },
  {
    label: 'Other Purchases',
    key: 'earnRateOther',
    format: (v) =>
      v && (v as number) > 0 ? (
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{v as number}×</span>
      ) : (
        <Minus className="h-4 w-4 text-gray-400" />
      ),
  },
  {
    label: 'Welcome Bonus',
    key: 'welcomeBonus',
    format: (v) =>
      v ? (
        <span className="text-xs leading-snug">{v as string}</span>
      ) : (
        <Minus className="h-4 w-4 text-gray-400" />
      ),
  },
  {
    label: 'For Students',
    key: 'eligibleForStudents',
    format: (v) =>
      v ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Minus className="h-4 w-4 text-gray-400" />
      ),
  },
  {
    label: 'For Newcomers',
    key: 'eligibleForNewcomers',
    format: (v) =>
      v ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Minus className="h-4 w-4 text-gray-400" />
      ),
  },
];

function getCellValue(offer: CardOffer, key: string): unknown {
  return (offer as unknown as Record<string, unknown>)[key];
}

function NetworkTag({ network }: { network: CardOffer['network'] }) {
  const map = {
    visa: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    mastercard: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    amex: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  const label = { visa: 'VISA', mastercard: 'MC', amex: 'AMEX' };
  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', map[network])}>
      {label[network]}
    </span>
  );
}

export function CardCompareModal({ isOpen, onClose, offers, onRemove }: CardCompareModalProps) {
  if (!isOpen || offers.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-950 w-full sm:max-w-4xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 sm:animate-in sm:fade-in sm:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Compare Cards
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Side-by-side comparison of {offers.length} selected card{offers.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Card headers */}
          <div
            className={cn(
              'grid sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-10',
              offers.length === 1 ? 'grid-cols-1' : offers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            )}
          >
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex flex-col items-center text-center p-4 gap-2 border-r last:border-r-0 border-gray-100 dark:border-gray-800"
              >
                {/* Mini card visual */}
                <div
                  className={cn(
                    'w-full h-14 rounded-xl bg-gradient-to-br flex items-end p-2',
                    offer.cardGradient
                  )}
                >
                  <p className="text-white text-[10px] font-semibold leading-tight line-clamp-2">
                    {offer.name}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <NetworkTag network={offer.network} />
                  {offer.isFeatured && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{offer.issuer}</p>
                <button
                  onClick={() => onRemove(offer.id)}
                  className="text-[10px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {COMPARE_ROWS.map((row) => (
              <div
                key={row.label}
                className={cn(
                  'grid',
                  offers.length === 1
                    ? 'grid-cols-1'
                    : offers.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-3'
                )}
              >
                {offers.map((offer, idx) => (
                  <div
                    key={offer.id}
                    className="relative flex flex-col gap-1 p-4 border-r last:border-r-0 border-gray-100 dark:border-gray-800"
                  >
                    {/* Row label only in first card cell */}
                    {idx === 0 && (
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        {row.label}
                      </span>
                    )}
                    <div className={cn('text-sm text-gray-900 dark:text-white', idx > 0 && 'mt-5')}>
                      {row.format
                        ? row.format(getCellValue(offer, row.key), offer)
                        : String(getCellValue(offer, row.key) ?? '—')}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Perks section */}
            <div
              className={cn(
                'grid',
                offers.length === 1
                  ? 'grid-cols-1'
                  : offers.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
              )}
            >
              {offers.map((offer, idx) => (
                <div
                  key={offer.id}
                  className="flex flex-col gap-1.5 p-4 border-r last:border-r-0 border-gray-100 dark:border-gray-800"
                >
                  {idx === 0 && (
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Key Perks
                    </span>
                  )}
                  <ul className={cn('space-y-1.5', idx > 0 && 'mt-5')}>
                    {offer.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[11px] text-gray-700 dark:text-gray-300 leading-snug">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Insurance section */}
            <div
              className={cn(
                'grid',
                offers.length === 1
                  ? 'grid-cols-1'
                  : offers.length === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
              )}
            >
              {offers.map((offer, idx) => (
                <div
                  key={offer.id}
                  className="flex flex-col gap-2 p-4 border-r last:border-r-0 border-gray-100 dark:border-gray-800"
                >
                  {idx === 0 && (
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Insurance Coverage
                    </span>
                  )}
                  <div className={cn('flex flex-wrap gap-1', idx > 0 && 'mt-5')}>
                    {offer.insurance.length > 0 ? (
                      offer.insurance.map((ins, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        >
                          {ins}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">Basic only</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Apply buttons row */}
          <div
            className={cn(
              'grid border-t border-gray-200 dark:border-gray-800 p-4 gap-3',
              offers.length === 1
                ? 'grid-cols-1'
                : offers.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-3'
            )}
          >
            {offers.map((offer) => (
              <div key={offer.id} className="flex flex-col items-center gap-2">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 text-center leading-snug">
                  {offer.name}
                </p>
                {offer.applyUrl ? (
                  <a
                    href={offer.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    Apply Now <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-xs font-semibold text-gray-400 cursor-not-allowed"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
