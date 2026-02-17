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

interface CardOption {
  id: string;
  name: string;
  bank: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
}

export default function CardDashboardPage() {
  const { connectedCards, removeCard, isLoading, refreshCards } = useCard();
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleAddCard = () => {
    setShowCardSelection(true);
  };

  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      const response = await fetch('/api/cards/seed-demo', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to seed demo data:', error);
        alert(error.error?.message || 'Failed to load demo cards');
        return;
      }

      // Open card selection modal to let user pick cards
      setShowCardSelection(true);
    } catch (error) {
      console.error('Error seeding demo data:', error);
      alert('Failed to load demo cards. Please try again.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSelectCard = async (cardOption: CardOption): Promise<void> => {
    try {
      // Activate the card (make it visible on dashboard)
      const response = await fetch(`/api/cards/${cardOption.id}/activate`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to activate card');
      }
      
      // Refresh cards and close modal
      await refreshCards();
      setShowCardSelection(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error activating card:', error);
      alert('Failed to connect card. Please try again.');
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
            <EmptyCardState 
              onAddCard={handleAddCard} 
              onSeedDemoData={handleSeedDemoData}
              isSeeding={isSeeding}
              showFAQButton 
            />
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
