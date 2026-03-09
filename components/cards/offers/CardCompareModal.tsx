/**
 * CardCompareModal
 * Side-by-side comparison of up to 3 credit card offers
 */

'use client';

import { useEffect } from 'react';
import { X, Check, ExternalLink, Minus, ShieldCheck, Sparkles, Wallet, TrendingUp, UserCheck, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardOffer } from '@/types/card-offers.types';

interface CardCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  offers: CardOffer[];
  onRemove: (offerId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function CardVisual({ offer }: { offer: CardOffer }) {
  const net = offer.network === 'visa' ? 'VISA' : offer.network === 'mastercard' ? 'MC' : 'AMEX';
  return (
    <div className={cn('w-full aspect-[1.586/1] rounded-xl bg-gradient-to-br flex flex-col justify-between p-3 shadow-md', offer.cardGradient)}>
      <p className="text-white/75 text-[9px] font-medium truncate">{offer.issuer}</p>
      <div className="flex items-end justify-between gap-1">
        <p className="text-white text-[9px] font-bold leading-tight line-clamp-2 min-w-0">{offer.name}</p>
        <p className="text-white/90 font-bold text-[8px] flex-shrink-0 tracking-wide">{net}</p>
      </div>
    </div>
  );
}

function SectionDivider({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
      <span className="text-indigo-500 dark:text-indigo-400">{icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
        {label}
      </span>
    </div>
  );
}

interface RowProps {
  label: string;
  values: React.ReactNode[];
  gridCols: string;
  alt?: boolean;
}

function Row({ label, values, gridCols, alt }: RowProps) {
  return (
    <div className={cn('grid border-b border-gray-100 dark:border-gray-800/60', gridCols, alt && 'bg-gray-50/40 dark:bg-gray-900/30')}>
      <div className="flex items-center px-4 py-3.5">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">{label}</span>
      </div>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex items-center justify-center px-2 py-3.5 border-l border-gray-100 dark:border-gray-800/60 text-center"
        >
          {v}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function CardCompareModal({ isOpen, onClose, offers, onRemove }: CardCompareModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || offers.length === 0) return null;

  const n = offers.length;

  const gridCols =
    n === 1 ? 'grid-cols-[120px_1fr]'
    : n === 2 ? 'grid-cols-[120px_1fr_1fr]'
    : 'grid-cols-[120px_1fr_1fr_1fr]';

  const minW = n === 3 ? 520 : n === 2 ? 380 : 280;

  function val(offer: CardOffer, key: string) {
    return (offer as unknown as Record<string, unknown>)[key];
  }

  function earnCell(offer: CardOffer, key: string) {
    const v = val(offer, key) as number | null;
    return v && v > 0
      ? <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{v}<span className="text-indigo-400 dark:text-indigo-500">×</span></span>
      : <Minus className="h-3.5 w-3.5 text-gray-300 dark:text-gray-700" />;
  }

  function boolCell(yes: boolean) {
    return yes
      ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"><Check className="h-3 w-3 text-green-600 dark:text-green-400" /></span>
      : <Minus className="h-3.5 w-3.5 text-gray-300 dark:text-gray-700" />;
  }

  const rowProps = (label: string, values: React.ReactNode[], idx: number) => ({
    label, values, gridCols, alt: idx % 2 !== 0,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-white dark:bg-gray-950 w-full sm:max-w-3xl sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92dvh] sm:max-h-[88vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Compare Cards</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {n} card{n > 1 ? 's' : ''} selected · scroll to see all details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable body (single scroll surface) ── */}
        <div
          className="flex-1 overflow-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent] dark:[scrollbar-color:#374151_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb:hover]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-600"
        >
          <div style={{ minWidth: minW + 'px' }}>

            {/* ── Sticky card header row ── */}
            <div className={cn('grid sticky top-0 z-10 bg-white dark:bg-gray-950 border-b-2 border-gray-200 dark:border-gray-700', gridCols)}>
              {/* Empty corner cell */}
              <div className="p-3 bg-gray-50/80 dark:bg-gray-900/60" />
              {offers.map((offer) => (
                <div key={offer.id} className="flex flex-col items-center gap-2 p-3 border-l border-gray-100 dark:border-gray-800">
                  <CardVisual offer={offer} />
                  <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 text-center leading-tight line-clamp-2 w-full px-1">
                    {offer.name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {offer.isFeatured && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                        Featured
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemove(offer.id)}
                    className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-lg px-1.5 py-0.5 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    <X className="h-2.5 w-2.5" /> Remove
                  </button>
                </div>
              ))}
            </div>

            {/* ─── COSTS ─── */}
            <SectionDivider label="Costs" icon={<Wallet className="h-3.5 w-3.5" />} />
            <Row {...rowProps('Annual Fee', offers.map((o) =>
              o.annualFee === 0
                ? <span className="text-sm font-bold text-green-600 dark:text-green-400">Free</span>
                : <span className="text-sm font-bold text-gray-900 dark:text-white">${o.annualFee}<span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">/yr</span></span>
            ), 0)} />
            <Row {...rowProps('Purchase Rate', offers.map((o) =>
              o.purchaseRate !== null
                ? <span className="text-sm font-semibold text-gray-900 dark:text-white">{o.purchaseRate}<span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">%</span></span>
                : <Minus className="h-3.5 w-3.5 text-gray-300 dark:text-gray-700" />
            ), 1)} />
            <Row {...rowProps('Cash Advance', offers.map((o) =>
              o.cashAdvanceRate !== null
                ? <span className="text-sm font-semibold text-gray-900 dark:text-white">{o.cashAdvanceRate}<span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">%</span></span>
                : <Minus className="h-3.5 w-3.5 text-gray-300 dark:text-gray-700" />
            ), 2)} />
            <Row {...rowProps('Min. Income', offers.map((o) =>
              o.minAnnualIncome !== null
                ? <span className="text-sm font-semibold text-gray-900 dark:text-white">${o.minAnnualIncome!.toLocaleString()}</span>
                : <span className="text-xs font-bold text-green-600 dark:text-green-400">None</span>
            ), 3)} />

            {/* ─── WELCOME BONUS ─── */}
            <SectionDivider label="Welcome Bonus" icon={<Sparkles className="h-3.5 w-3.5" />} />
            <Row {...rowProps('Offer', offers.map((o) =>
              o.welcomeBonus
                ? <span className="text-xs text-gray-700 dark:text-gray-200 leading-snug text-center">{o.welcomeBonus}</span>
                : <Minus className="h-3.5 w-3.5 text-gray-300 dark:text-gray-700" />
            ), 0)} />

            {/* ─── EARN RATES ─── */}
            <SectionDivider label="Earn Rates" icon={<TrendingUp className="h-3.5 w-3.5" />} />
            <Row {...rowProps('Grocery', offers.map((o) => earnCell(o, 'earnRateGrocery')), 0)} />
            <Row {...rowProps('Travel', offers.map((o) => earnCell(o, 'earnRateTravel')), 1)} />
            <Row {...rowProps('Dining', offers.map((o) => earnCell(o, 'earnRateDining')), 2)} />
            <Row {...rowProps('Other', offers.map((o) => earnCell(o, 'earnRateOther')), 3)} />

            {/* ─── ELIGIBILITY ─── */}
            <SectionDivider label="Eligibility" icon={<UserCheck className="h-3.5 w-3.5" />} />
            <Row {...rowProps('Students', offers.map((o) => boolCell(!!o.eligibleForStudents)), 0)} />
            <Row {...rowProps('Newcomers', offers.map((o) => boolCell(!!o.eligibleForNewcomers)), 1)} />

            {/* ─── INSURANCE ─── */}
            <SectionDivider label="Insurance Coverage" icon={<ShieldCheck className="h-3.5 w-3.5" />} />
            <Row {...rowProps('Coverage', offers.map((o) =>
              o.insurance.length > 0
                ? <div className="flex flex-wrap gap-1 justify-center">
                    {o.insurance.map((ins, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/40 leading-tight">
                        {ins}
                      </span>
                    ))}
                  </div>
                : <span className="text-xs text-gray-400">Basic</span>
            ), 0)} />

            {/* ─── PERKS ─── */}
            <SectionDivider label="Key Perks" icon={<ListChecks className="h-3.5 w-3.5" />} />
            <Row {...rowProps('Benefits', offers.map((o) =>
              <ul className="space-y-1.5 text-left w-full">
                {o.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="mt-0.5 flex-shrink-0 h-3.5 w-3.5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="h-2 w-2 text-green-600 dark:text-green-400" />
                    </span>
                    <span className="text-[11px] text-gray-700 dark:text-gray-300 leading-snug">{perk}</span>
                  </li>
                ))}
              </ul>
            ), 0)} />

            {/* Bottom padding */}
            <div className="h-4" />
          </div>
        </div>

        {/* ── Apply footer ── */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60 px-4 py-4">
          <div className={cn('grid gap-3', n === 1 ? 'grid-cols-1' : n === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {offers.map((offer) => (
              <div key={offer.id} className="flex flex-col gap-1.5">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center truncate px-1">{offer.name}</p>
                {offer.applyUrl ? (
                  <a
                    href={offer.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    Apply Now <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <button disabled className="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-xs font-semibold text-gray-400 cursor-not-allowed">
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
