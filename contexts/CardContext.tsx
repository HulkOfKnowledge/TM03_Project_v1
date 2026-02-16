/**
 * Card Context
 * Global state management for connected cards
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ConnectedCard {
  id: string;
  name: string;
  bank: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
}

interface CardContextType {
  connectedCards: ConnectedCard[];
  addCard: (card: ConnectedCard) => void;
  removeCard: (cardId: string) => void;
  isLoading: boolean;
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export function CardProvider({ children }: { children: ReactNode }) {
  const [connectedCards, setConnectedCards] = useState<ConnectedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cards from localStorage on mount
  useEffect(() => {
    try {
      const savedCards = localStorage.getItem('connectedCards');
      if (savedCards) {
        setConnectedCards(JSON.parse(savedCards));
      }
    } catch (error) {
      console.error('Error loading cards from storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cards to localStorage whenever they change
  useEffect(() => {
    if (connectedCards.length > 0) {
      localStorage.setItem('connectedCards', JSON.stringify(connectedCards));
    } else {
      localStorage.removeItem('connectedCards');
    }
  }, [connectedCards]);

  const addCard = (card: ConnectedCard) => {
    setConnectedCards(prev => {
      // Check if card already exists
      if (prev.some(c => c.id === card.id)) {
        return prev;
      }
      return [...prev, card];
    });
  };

  const removeCard = (cardId: string) => {
    setConnectedCards(prev => prev.filter(card => card.id !== cardId));
  };

  return (
    <CardContext.Provider value={{ connectedCards, addCard, removeCard, isLoading }}>
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
