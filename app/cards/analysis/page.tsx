/**
 * Credit Analysis Page
 * Detailed credit analysis and insights
 */

'use client';

import { useState } from 'react';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { EmptyCardState } from '@/components/cards/EmptyCardState';
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
  const { connectedCard, setConnectedCard, isLoading } = useCard();
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleAddCard = () => {
    setShowCardSelection(true);
  };

  const handleSelectCard = (card: CardOption) => {
    setConnectedCard(card);
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
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
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
          {!connectedCard ? (
            <EmptyCardState onAddCard={handleAddCard} />
          ) : (
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-500 mb-6">
                Credit Analysis
              </h1>
              {/* Add your actual analysis content here */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connected Card: {connectedCard.name}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  •••• {connectedCard.lastFour}
                </p>
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
