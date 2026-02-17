/**
 * Card Dashboard Page
 * Main dashboard for credit card management
 */

'use client';

import { useState } from 'react';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { EmptyCardState } from '@/components/cards/EmptyCardState';
import { CardOverview } from '@/components/cards/CardOverview';
import { CardOverviewSkeleton } from '@/components/cards/CardOverviewSkeleton';
import { CardSelectionModal } from '@/components/cards/CardSelectionModal';
import { SuccessModal } from '@/components/cards/SuccessModal';
import { useCard } from '@/contexts/CardContext';
import type { ConnectedCard } from '@/types/card.types';

interface CardOption {
  id: string;
  name: string;
  bank: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
}

export default function CardDashboardPage() {
  const { connectedCards, addCard, removeCard, isLoading } = useCard();
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleAddCard = () => {
    setShowCardSelection(true);
  };

  const handleSelectCard = async (cardOption: CardOption) => {
    try {
      // Convert CardOption to ConnectedCard with default values
      const card: ConnectedCard = {
        ...cardOption,
        currentBalance: 0,
        creditLimit: 0,
        availableCredit: 0,
        utilizationPercentage: 0,
        minimumPayment: 0,
        paymentDueDate: null,
        lastPaymentAmount: null,
        lastPaymentDate: null,
        interestRate: null,
        lastSyncedAt: null,
        isActive: true,
      };
      
      await addCard(card);
      setShowCardSelection(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error adding card:', error);
      // TODO: Show error message to user
    }
  };

  const handleDisconnectCard = async (cardId: string) => {
    try {
      await removeCard(cardId);
    } catch (error) {
      console.error('Error removing card:', error);
      // TODO: Show error message to user
    }
  };

  const handleViewDashboard = () => {
    setShowSuccessModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {connectedCards.length > 0 ? (
            <CardOverview 
              card={connectedCards[0]} 
              onAddCard={handleAddCard} 
              onDisconnectCard={handleDisconnectCard}
              allCards={connectedCards}
            />
          ) : (
            <EmptyCardState onAddCard={handleAddCard} showFAQButton />
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
