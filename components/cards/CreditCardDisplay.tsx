/**
 * Credit Card Display Component
 * Reusable credit card visual component following DRY principle
 */

'use client';

interface CreditCardDisplayProps {
  bank: string;
  name: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
  gradientIndex?: number;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

// Brand-accurate gradient colors for the 10 demo banks
export const BANK_GRADIENTS: Record<string, string> = {
  // --- colourful cards ---
  'td bank':      'from-green-700 via-green-800 to-green-900',       // TD: signature green
  'scotiabank':   'from-red-600 via-red-700 to-red-900',             // Scotia: bright red
  'bmo':          'from-sky-500 via-blue-600 to-blue-700',            // BMO: light blue
  'tangerine':    'from-orange-500 via-orange-600 to-amber-700',     // Tangerine: orange
  'pc financial': 'from-amber-500 via-orange-500 to-orange-600',     // PC Financial: amber
  'simplii':      'from-rose-500 via-pink-600 to-rose-600',          // Simplii: pink-red
  // --- dark / premium cards ---
  'rbc':          'from-blue-950 via-indigo-950 to-slate-900',       // RBC: deep navy
  'cibc':         'from-zinc-700 via-zinc-800 to-zinc-900',          // CIBC: dark charcoal
  'capital one':  'from-slate-600 via-slate-800 to-slate-900',       // Capital One: dark ash
  'amex':         'from-neutral-700 via-stone-800 to-zinc-900',      // Amex: dark platinum
};

// Fallback gradients for unrecognised institutions — mix of colourful and dark
export const CARD_GRADIENTS = [
  'from-zinc-800 via-gray-900 to-black',
  'from-slate-600 via-slate-700 to-slate-900',
  'from-neutral-700 via-stone-800 to-zinc-950',
  'from-purple-600 via-purple-700 to-pink-600',
  'from-blue-700 via-blue-800 to-indigo-900',
  'from-green-600 via-emerald-700 to-teal-600',
  'from-orange-600 via-red-700 to-pink-600',
  'from-cyan-600 via-blue-700 to-indigo-600',
  'from-amber-600 via-orange-700 to-red-600',
  'from-teal-600 via-cyan-700 to-blue-600',
  'from-violet-700 via-purple-800 to-fuchsia-900',
];

export function CreditCardDisplay({
  bank,
  name,
  type,
  lastFour,
  gradientIndex = 0,
  className = '',
  size = 'large',
}: CreditCardDisplayProps) {
  const bankKey = bank.toLowerCase().trim();
  const gradient = BANK_GRADIENTS[bankKey] ?? CARD_GRADIENTS[gradientIndex % CARD_GRADIENTS.length];

  // Size-based styling
  const sizeClasses = {
    small: {
      container: 'p-3',
      credit: 'text-xs',
      bank: 'text-xs',
      type: 'text-xs',
      cardName: 'text-[10px]',
      number: 'text-xs',
      wave: 'w-48 h-48',
      waveTransform: '-translate-y-24 translate-x-24',
    },
    medium: {
      container: 'p-4',
      credit: 'text-xs',
      bank: 'text-sm',
      type: 'text-sm',
      cardName: 'text-xs',
      number: 'text-sm',
      wave: 'w-64 h-64',
      waveTransform: '-translate-y-32 translate-x-32',
    },
    large: {
      container: 'p-6 md:p-8',
      credit: 'text-base md:text-lg',
      bank: 'text-base md:text-lg',
      type: 'text-xl md:text-2xl',
      cardName: 'text-base md:text-lg',
      number: 'text-lg md:text-xl',
      wave: 'w-96 h-96',
      waveTransform: '-translate-y-48 translate-x-48',
    },
  };

  const styles = sizeClasses[size];

  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-2xl ${styles.container} shadow-2xl aspect-[1.586/1] relative overflow-hidden ${className}`}
    >
      {/* Decorative wave element */}
      <div className={`absolute top-0 right-0 ${styles.wave} opacity-20`}>
        <div
          className={`absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent rounded-full ${styles.waveTransform} rotate-45`}
        ></div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-white/90 ${styles.credit} font-medium mb-0.5`}>Credit</p>
            <p className={`text-white ${styles.bank} font-semibold`}>{bank}</p>
          </div>
          <div className="text-right">
            <p className={`text-white font-bold ${styles.type} uppercase`}>{type}</p>
          </div>
        </div>
        <div>
          <p className={`text-white/90 ${styles.cardName} mb-2`}>{name}</p>
          <p className={`text-white ${styles.number} tracking-wider font-medium`}>
            {size === 'small' ? `•••• ${lastFour}` : `•••• •••• •••• ${lastFour}`}
          </p>
        </div>
      </div>
    </div>
  );
}
