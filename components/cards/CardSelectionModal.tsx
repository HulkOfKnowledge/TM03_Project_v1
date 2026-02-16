/**
 * Card Selection Modal
 * Simulates Flinks card selection with 10 sample cards
 */

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { CreditCardDisplay } from './CreditCardDisplay';

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
  connectedCardIds?: string[];
}

export function CardSelectionModal({ isOpen, onClose, onSelectCard, connectedCardIds = [] }: CardSelectionModalProps) {
  const [selectedCard, setSelectedCard] = useState<CardOption | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedCard) {
      onSelectCard(selectedCard);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-950 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
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
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_CARDS.map((card, index) => {
              const isConnected = connectedCardIds.includes(card.id);
              const isSelected = selectedCard?.id === card.id;
              
              return (
                <button
                  key={card.id}
                  onClick={() => !isConnected && setSelectedCard(card)}
                  disabled={isConnected}
                  className={`group relative rounded-xl transition-all ${
                    isConnected
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  {/* Selection Ring */}
                  <div className={`absolute -inset-1 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 opacity-100'
                      : 'bg-gradient-to-r from-gray-300 to-gray-300 dark:from-gray-700 dark:to-gray-700 opacity-0 group-hover:opacity-50'
                  }`} />
                  
                  {/* Card */}
                  <div className="relative">
                    <CreditCardDisplay
                      bank={card.bank}
                      name={card.name}
                      type={card.type}
                      lastFour={card.lastFour}
                      gradientIndex={index}
                      size="medium"
                    />

                    {/* Connected Badge */}
                    {isConnected && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-medium border border-white/30">
                        Connected
                      </div>
                    )}

                    {/* Selected Indicator */}
                    {isSelected && !isConnected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
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
