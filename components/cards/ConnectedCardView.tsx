/**
 * Connected Card View
 * Shows card with Flinks branding
 */

'use client';

import { ArrowLeft } from 'lucide-react';

interface ConnectedCardViewProps {
  cardName: string;
  cardLastFour: string;
  cardType: 'visa' | 'mastercard';
  holderName?: string;
  onAddCard: () => void;
  onBack?: () => void;
}

export function ConnectedCardView({
  cardName,
  cardLastFour,
  cardType,
  holderName = 'John Doe',
  onAddCard,
  onBack,
}: ConnectedCardViewProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      {onBack && (
        <div className="mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      )}

      {/* Card Display */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 md:p-12">
        <div className="max-w-md mx-auto">
          {/* Flinks Card with Branding */}
          <div className="relative mb-8">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black dark:from-gray-900 dark:via-black dark:to-gray-950 rounded-2xl p-6 md:p-8 shadow-2xl aspect-[1.586/1]">
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <p className="text-white/90 text-sm md:text-base font-medium">Credit</p>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">{cardType.toUpperCase()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-white/90 text-sm md:text-base mb-3">{holderName}</p>
                  <p className="text-white text-base md:text-lg tracking-widest font-medium">
                    4556 - 5642 - 0695 - {cardLastFour}
                  </p>
                </div>
              </div>
            </div>
            {/* Flinks Logo Overlay */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-950 px-6 py-2 rounded-full shadow-lg border-2 border-white dark:border-gray-900">
              <p className="text-white font-bold text-lg">Flinks</p>
            </div>
          </div>

          {/* Add Card Button */}
          <button
            onClick={onAddCard}
            className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors mt-8"
          >
            Add Card
          </button>
        </div>
      </div>
    </div>
  );
}
