/**
 * Credit Analysis Page
 * Detailed credit analysis and insights
 */

'use client';

import { useState } from 'react';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { EmptyCardState } from '@/components/cards/EmptyCardState';
import { CardOverviewSkeleton } from '@/components/cards/CardOverviewSkeleton';
import { CardSelectionModal } from '@/components/cards/CardSelectionModal';
import { SuccessModal } from '@/components/cards/SuccessModal';
import { useCard } from '@/contexts/CardContext';

interface CardOption {
  id: string;
  name: string;
  bank: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
}

export default function CreditAnalysisPage() {
  const { connectedCards, addCard, isLoading } = useCard();
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleAddCard = () => {
    setShowCardSelection(true);
  };

  const handleSelectCard = (card: CardOption) => {
    addCard(card);
    setShowCardSelection(false);
    setShowSuccessModal(true);
  };

  const handleViewDashboard = () => {
    setShowSuccessModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navigation />
        <main className="pt-28 lg:pt-40 pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <CardOverviewSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {connectedCards.length === 0 ? (
            <EmptyCardState onAddCard={handleAddCard} />
          ) : (
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-500 mb-6">
                Credit Analysis
              </h1>
              {/* Add your actual analysis content here */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connected Cards: {connectedCards.length}
                </p>
                {connectedCards.map((card, index) => (
                  <p key={card.id} className="text-gray-600 dark:text-gray-400">
                    {index + 1}. {card.bank} {card.name} •••• {card.lastFour}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CardSelectionModal
        isOpen={showCardSelection}
        onClose={() => setShowCardSelection(false)}
        onSelectCard={handleSelectCard}
        connectedCardIds={connectedCards.map(card => card.id)}
      />
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleViewDashboard}
        onViewDashboard={handleViewDashboard}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
