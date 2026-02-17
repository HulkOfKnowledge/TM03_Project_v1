/**
 * Card Context
 * Global state management for connected cards
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ConnectedCard } from '@/types/card.types';

interface CardContextType {
  connectedCards: ConnectedCard[];
  selectedCard: ConnectedCard | null;
  selectCard: (card: ConnectedCard) => void;
  addCard: (card: ConnectedCard) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  refreshCards: () => Promise<void>;
  isLoading: boolean;
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export function CardProvider({ children }: { children: ReactNode }) {
  const [connectedCards, setConnectedCards] = useState<ConnectedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<ConnectedCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cards from API on mount
  useEffect(() => {
    loadCards();
  }, []);

  // Update selected card when cards change
  useEffect(() => {
    if (connectedCards.length > 0) {
      // If there's no selected card or the selected card was removed, select the first one
      if (!selectedCard || !connectedCards.find(c => c.id === selectedCard.id)) {
        setSelectedCard(connectedCards[0]);
      }
    } else {
      setSelectedCard(null);
    }
  }, [connectedCards, selectedCard]);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cards');
      
      if (response.ok) {
        const result = await response.json();
        setConnectedCards(result.data || []);
      } else {
        console.error('Failed to load cards:', response.statusText);
        setConnectedCards([]);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      setConnectedCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addCard = async (card: ConnectedCard) => {
    try {
      // Check if card already exists
      if (connectedCards.some(c => c.id === card.id)) {
        return;
      }

      // Call API to persist the card
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // For mock/sample cards, use the card id as flinks identifiers
          flinksLoginId: `mock_login_${card.id}`,
          flinksAccountId: `mock_account_${card.id}`,
          institutionName: card.bank,
          cardType: 'credit',
          cardLastFour: card.lastFour,
          cardNetwork: card.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add card');
      }

      const result = await response.json();
      const addedCard = result.data;

      // Update local state with the card from the API
      setConnectedCards(prev => [...prev, addedCard]);
    } catch (error) {
      console.error('Error adding card:', error);
      throw error;
    }
  };

  const removeCard = async (cardId: string) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConnectedCards(prev => prev.filter(card => card.id !== cardId));
      } else {
        console.error('Failed to remove card:', response.statusText);
        throw new Error('Failed to remove card');
      }
    } catch (error) {
      console.error('Error removing card:', error);
      throw error;
    }
  };

  const selectCard = (card: ConnectedCard) => {
    setSelectedCard(card);
  };

  const refreshCards = async () => {
    await loadCards();
  };

  return (
    <CardContext.Provider value={{ 
      connectedCards, 
      selectedCard,
      selectCard,
      addCard, 
      removeCard, 
      refreshCards,
      isLoading 
    }}>
      {children}
    </CardContext.Provider>
  );
}

export function useCard() {
  const context = useContext(CardContext);
  if (context === undefined) {
    throw new Error('useCard must be used within a CardProvider');
  }
  return context;
}
