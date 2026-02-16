/**
 * Card Selection Modal
 * Simulates Flinks card selection with 10 sample cards
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CardOption {
  id: string;
  name: string;
  bank: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
}

// Sample cards for Flinks simulation
const SAMPLE_CARDS: CardOption[] = [
  { id: '1', name: 'Visa Platinum', bank: 'TD Bank', type: 'visa', lastFour: '5168' },
  { id: '2', name: 'World Elite', bank: 'RBC', type: 'mastercard', lastFour: '4892' },
  { id: '3', name: 'Cash Back', bank: 'Scotiabank', type: 'visa', lastFour: '7234' },
  { id: '4', name: 'Travel Rewards', bank: 'BMO', type: 'visa', lastFour: '3456' },
  { id: '5', name: 'Gold Card', bank: 'CIBC', type: 'mastercard', lastFour: '8901' },
  { id: '6', name: 'Student Card', bank: 'Tangerine', type: 'mastercard', lastFour: '2345' },
  { id: '7', name: 'Secured Card', bank: 'Capital One', type: 'visa', lastFour: '6789' },
  { id: '8', name: 'Premium Travel', bank: 'Amex', type: 'visa', lastFour: '1234' },
  { id: '9', name: 'No Fee Card', bank: 'PC Financial', type: 'mastercard', lastFour: '5678' },
  { id: '10', name: 'Cashback Plus', bank: 'Simplii', type: 'visa', lastFour: '9012' },
];

interface CardSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (card: CardOption) => void;
}

export function CardSelectionModal({ isOpen, onClose, onSelectCard }: CardSelectionModalProps) {
  const [selectedCard, setSelectedCard] = useState<CardOption | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedCard) {
      onSelectCard(selectedCard);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-950 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Your Card</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose a card to connect to your dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Card Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedCard?.id === card.id
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{card.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{card.bank}</p>
                  </div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {card.type}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">•••• {card.lastFour}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedCard}
            className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Connect Card
          </button>
        </div>
      </div>
    </div>
  );
}
