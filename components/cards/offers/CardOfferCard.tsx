/**
 * CardOfferCard
 * Displays a single credit card offer – consistent with the cards dashboard design
 */

'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, ExternalLink, Shield, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardOffer } from '@/types/card-offers.types';

// ── Mini card visual ──────────────────────────────────────────────────────────
function MiniCardVisual({ offer }: { offer: CardOffer }) {
  const networkLabel =
    offer.network === 'visa' ? 'VISA' : offer.network === 'mastercard' ? 'MASTERCARD' : 'AMEX';

  return (
    <div className={cn('relative w-full aspect-[1.586/1] rounded-xl bg-gradient-to-br overflow-hidden shadow-md', offer.cardGradient)}>
      <div className="h-full flex flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-[10px] font-medium">Credit</p>
            <p className="text-white text-xs font-semibold leading-tight">{offer.issuer}</p>
          </div>
          <div className="h-5 w-7 rounded bg-yellow-200/40 border border-yellow-100/30" />
        </div>
        <div>
          <p className="text-white/60 text-[10px] tracking-widest mb-1">•••• •••• •••• ••••</p>
          <div className="flex items-end justify-between">
            <p className="text-white text-[10px] leading-tight max-w-[70%] truncate">{offer.name}</p>
            <p className="text-white font-bold text-[10px] uppercase">{networkLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Match badge ───────────────────────────────────────────────────────────────
function MatchBadge({ score }: { score: number }) {
  if (score >= 75) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        ✦ Great match
      </span>
    );
  }
  if (score >= 55) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
        ✦ Good match
      </span>
    );
  }
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
interface CardOfferCardProps {
  offer: CardOffer;
  isCompareSelected: boolean;
  onToggleCompare: (offer: CardOffer) => void;
  compareDisabled: boolean;
}

export function CardOfferCard({
  offer,
  isCompareSelected,
  onToggleCompare,
  compareDisabled,
}: CardOfferCardProps) {
  const [expanded, setExpanded] = useState(false);
  const visiblePerks = expanded ? offer.perks : offer.perks.slice(0, 3);

  const topEarnRate = Math.max(
    offer.earnRateGrocery ?? 0,
    offer.earnRateTravel ?? 0,
    offer.earnRateDining ?? 0,
    offer.earnRateOther ?? 0,
  );

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border bg-white dark:bg-gray-950 transition-all duration-200',
        isCompareSelected
          ? 'border-indigo-500 dark:border-indigo-500 shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20'
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm',
      )}
    >
      {/* Featured badge */}
      {offer.isFeatured && (
        <div className="absolute top-3 right-3 z-10 bg-indigo-600 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
          Featured
        </div>
      )}

      {/* Card visual */}
      <div className="p-4 pb-3">
        <MiniCardVisual offer={offer} />
      </div>

      {/* Name + match */}
      <div className="px-4 pb-3 flex flex-col gap-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
          {offer.name}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">{offer.issuer}</span>
          {offer.matchScore !== undefined && <MatchBadge score={offer.matchScore} />}
        </div>
      </div>

      {/* Key metrics */}
      <div className="mx-4 mb-3 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center py-2.5 px-1">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 text-center">Annual Fee</span>
          <span className={cn('text-sm font-semibold', offer.annualFee === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white')}>
            {offer.annualFee === 0 ? 'Free' : `$${offer.annualFee}/yr`}
          </span>
        </div>
        <div className="flex flex-col items-center py-2.5 px-1">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 text-center">Rate</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {offer.purchaseRate !== null ? `${offer.purchaseRate}%` : '—'}
          </span>
        </div>
        <div className="flex flex-col items-center py-2.5 px-1">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 text-center">Top Earn</span>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {topEarnRate > 0 ? `${topEarnRate}x` : '—'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-4 gap-3">
        {/* Welcome bonus */}
        {offer.welcomeBonus && (
          <div className="flex items-start gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-3 border border-indigo-100 dark:border-indigo-900/40">
            <Gift className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-0.5">
                Welcome Bonus
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{offer.welcomeBonus}</p>
            </div>
          </div>
        )}

        {/* Earn rate description */}
        {offer.earnRateDescription && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug border-l-2 border-indigo-200 dark:border-indigo-800 pl-2.5">
            {offer.earnRateDescription}
          </p>
        )}

        {/* Perks */}
        <ul className="space-y-1.5">
          {visiblePerks.map((perk, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{perk}</span>
            </li>
          ))}
        </ul>

        {offer.perks.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors self-start"
          >
            {expanded ? (
              <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
            ) : (
              <><ChevronDown className="h-3.5 w-3.5" /> +{offer.perks.length - 3} more benefits</>
            )}
          </button>
        )}

        {/* Insurance tags */}
        {offer.insurance.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pb-1">
            <Shield className="h-3 w-3 text-gray-400 flex-shrink-0" />
            {offer.insurance.slice(0, 3).map((ins, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {ins}
              </span>
            ))}
            {offer.insurance.length > 3 && (
              <span className="text-[10px] text-gray-400">+{offer.insurance.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 p-4 mt-auto border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => !compareDisabled && onToggleCompare(offer)}
          disabled={compareDisabled}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all whitespace-nowrap',
            isCompareSelected
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
              : compareDisabled
              ? 'border-gray-200 dark:border-gray-800 text-gray-400 cursor-not-allowed opacity-50'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400',
          )}
        >
          {isCompareSelected ? <Check className="h-3.5 w-3.5" /> : <span className="h-3 w-3 rounded border border-current" />}
          Compare
        </button>

        {offer.applyUrl ? (
          <a
            href={offer.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Apply Now <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <button disabled className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-400 cursor-not-allowed">
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
}
