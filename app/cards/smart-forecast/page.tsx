'use client';

import { useState } from 'react';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { EmptyCardState } from '@/components/cards/EmptyCardState';
import { CardSelectionModal } from '@/components/cards/CardSelectionModal';
import { SuccessModal } from '@/components/cards/SuccessModal';
import { SmartForecast } from '@/components/cards/smart-forecast/SmartForecast';
import { SmartForecastSkeleton } from '@/components/cards/smart-forecast/SmartForecastSkeleton';
import { useCard } from '@/contexts/CardContext';

interface CardOption {
  id: string;
  name: string;
  bank: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
}

export default function SmartForecastPage() {
  const { connectedCards, isLoading, refreshCards } = useCard();
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

      setShowCardSelection(true);
    } catch (error) {
      console.error('Error seeding demo data:', error);
      alert('Failed to load demo cards. Please try again.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSelectCard = async (cardOption: CardOption) => {
    try {
      const response = await fetch(`/api/cards/${cardOption.id}/activate`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to activate card');
      }

      await refreshCards();
      setShowCardSelection(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error activating card:', error);
      alert('Failed to connect card. Please try again.');
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
            <SmartForecastSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {connectedCards.length > 0 ? (
            <SmartForecast connectedCards={connectedCards} />
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

      <CardSelectionModal
        isOpen={showCardSelection}
        onClose={() => setShowCardSelection(false)}
        onSelectCard={handleSelectCard}
        connectedCardIds={connectedCards.map((card) => card.id)}
      />
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleViewDashboard}
        onViewDashboard={handleViewDashboard}
      />

      <Footer />
    </div>
  );
}
