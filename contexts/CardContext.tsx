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
  connectedCard: ConnectedCard | null;
  setConnectedCard: (card: ConnectedCard | null) => void;
  isLoading: boolean;
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export function CardProvider({ children }: { children: ReactNode }) {
  const [connectedCard, setConnectedCard] = useState<ConnectedCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load card from localStorage on mount
  useEffect(() => {
    try {
      const savedCard = localStorage.getItem('connectedCard');
      if (savedCard) {
        setConnectedCard(JSON.parse(savedCard));
      }
    } catch (error) {
      console.error('Error loading card from storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save card to localStorage whenever it changes
  useEffect(() => {
    if (connectedCard) {
      localStorage.setItem('connectedCard', JSON.stringify(connectedCard));
    } else {
      localStorage.removeItem('connectedCard');
    }
  }, [connectedCard]);

  return (
    <CardContext.Provider value={{ connectedCard, setConnectedCard, isLoading }}>
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
