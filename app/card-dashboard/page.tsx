"use client";

import { useEffect, useMemo, useState } from 'react';
import type { DemoDashboardData } from '@/services/demo-data.service';

// ============================
// TYPE DEFINITIONS
// ============================

interface DashboardState {
  data: DemoDashboardData | null;
  isLoading: boolean;
  error: string | null;
}

interface AnalysisState {
  data: {
    overallScore: number;
    insights: Array<{
      type: string;
      priority: string;
      title: { en: string };
      message: { en: string };
      actionRequired: boolean;
    }>;
  } | null;
  isLoading: boolean;
  error: string | null;
}

interface RecommendationState {
  data: {
    totalAmount: number;
    recommendations: Array<{
      cardId: string;
      suggestedAmount: number;
      reasoning: { en: string };
      expectedImpact: {
        interestSaved: number;
        utilizationImprovement: number;
        scoreImpactEstimate: number;
      };
      priority: number;
    }>;
    strategy: string;
    projectedSavings: { monthlyInterest: number; annualInterest: number };
  } | null;
  isLoading: boolean;
  error: string | null;
}

type ViewMode = 'consolidated' | 'single' | 'compare';
type TransactionType = 'purchase' | 'refund' | 'payment';

// ============================
// UTILITY FUNCTIONS
// ============================

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
});

const percentFormatter = new Intl.NumberFormat('en-CA', {
  style: 'percent',
  maximumFractionDigits: 1,
});

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================
// SKELETON COMPONENTS
// ============================

function SkeletonCard() {
  return (
    <div className="animate-pulse border border-gray-200 bg-white p-4">
      <div className="h-4 w-24 bg-gray-200" />
      <div className="mt-3 h-6 w-32 bg-gray-200" />
      <div className="mt-2 h-3 w-40 bg-gray-200" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse border-b border-gray-100 p-4">
      <div className="h-4 w-full bg-gray-200" />
    </div>
  );
}

// ============================
// CARD SELECTION MODAL
// ============================

interface CardSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCards: DemoDashboardData['cards'];
  connectedCardIds: string[];
  onSelectCard: (cardId: string) => void;
}

function CardSelectionModal({
  isOpen,
  onClose,
  availableCards,
  connectedCardIds,
  onSelectCard,
}: CardSelectionModalProps) {
  if (!isOpen) return null;

  const unconnectedCards = availableCards.filter(card => !connectedCardIds.includes(card.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-white p-8">
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-black">Select a Card</h2>
            <p className="mt-1 text-sm text-gray-600">Choose from available cards</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {unconnectedCards.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-600">All available cards are connected</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {unconnectedCards.map((card) => (
              <button
                key={card.id}
                onClick={() => onSelectCard(card.id)}
                className="border-2 border-gray-200 bg-white p-6 text-left hover:border-black"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{card.institution_name}</p>
                    <p className="mt-1 font-semibold text-black">{card.card_name}</p>
                  </div>
                  <p className="text-xs text-gray-500 uppercase">{card.card_network}</p>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance</span>
                    <span className="font-medium text-black">{currencyFormatter.format(card.current_balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Limit</span>
                    <span className="font-medium text-black">{currencyFormatter.format(card.credit_limit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Utilization</span>
                    <span className="font-medium text-black">{percentFormatter.format(card.utilization_percentage / 100)}</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">•••• {card.card_last_four}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================
// MAIN COMPONENT
// ============================

export default function CardDashboardPage() {
  const [state, setState] = useState<DashboardState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const [connectedCardIds, setConnectedCardIds] = useState<string[]>([]);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('consolidated');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const [analysis, setAnalysis] = useState<AnalysisState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const [recommendations, setRecommendations] = useState<RecommendationState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const [availableAmount, setAvailableAmount] = useState(0);
  const [optimizationGoal, setOptimizationGoal] = useState<
    'minimize_interest' | 'improve_score' | 'balanced'
  >('balanced');

  // Load all available cards on mount
  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const response = await fetch('/api/demo/card-dashboard', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Demo dashboard data unavailable.');
        }

        const payload = await response.json();
        if (!payload?.success) {
          throw new Error(payload?.error?.message ?? 'Failed to load demo data.');
        }

        if (isMounted) {
          setState({ data: payload.data, isLoading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            data: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load demo data.',
          });
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  // Run analysis when connected cards change
  useEffect(() => {
    if (connectedCardIds.length === 0) {
      setAnalysis({ data: null, isLoading: false, error: null });
      setRecommendations({ data: null, isLoading: false, error: null });
      return;
    }

    let isMounted = true;

    async function runAnalysis() {
      setAnalysis({ data: null, isLoading: true, error: null });
      try {
        const response = await fetch('/api/credit-intelligence/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectedCardIds,
          }),
        });

        if (!response.ok) {
          throw new Error('Analysis service unavailable.');
        }

        const payload = await response.json();
        if (!payload?.success) {
          throw new Error(payload?.error?.message ?? 'Failed to run analysis.');
        }

        if (isMounted) {
          setAnalysis({ data: payload.data, isLoading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setAnalysis({
            data: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to run analysis.',
          });
        }
      }
    }

    runAnalysis();

    return () => {
      isMounted = false;
    };
  }, [connectedCardIds]);

  // Run recommendations when connected cards or settings change
  useEffect(() => {
    if (connectedCardIds.length === 0) return;

    // Debounce to avoid excessive API calls while user is typing
    const timeoutId = setTimeout(async () => {
      try {
        setRecommendations({ data: null, isLoading: true, error: null });
        
        const response = await fetch('/api/credit-intelligence/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectedCardIds,
            availableAmount,
            optimizationGoal,
          }),
        });

        if (!response.ok) {
          throw new Error('Recommendation service unavailable.');
        }

        const payload = await response.json();
        if (!payload?.success) {
          throw new Error(payload?.error?.message ?? 'Failed to load recommendations.');
        }

        setRecommendations({ data: payload.data, isLoading: false, error: null });
      } catch (error) {
        setRecommendations({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load recommendations.',
        });
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timeoutId);
    };
  }, [connectedCardIds, availableAmount, optimizationGoal]);

  // Computed values
  const connectedCards = useMemo(() => {
    if (!state.data) return [];
    return state.data.cards.filter(card => connectedCardIds.includes(card.id));
  }, [state.data, connectedCardIds]);

  const cardsById = useMemo(() => {
    if (!state.data) return new Map<string, DemoDashboardData['cards'][number]>();
    return new Map(state.data.cards.map((card) => [card.id, card]));
  }, [state.data]);

  // Filter data based on view mode and selected cards
  const viewFilteredCards = useMemo(() => {
    if (viewMode === 'consolidated') return connectedCards;
    if (viewMode === 'single' && selectedCardIds.length > 0) {
      return connectedCards.filter(card => card.id === selectedCardIds[0]);
    }
    if (viewMode === 'compare' && selectedCardIds.length > 0) {
      return connectedCards.filter(card => selectedCardIds.includes(card.id));
    }
    return connectedCards;
  }, [connectedCards, viewMode, selectedCardIds]);

  // Combined transactions and payments - merged into one list
  const allTransactions = useMemo(() => {
    if (!state.data) return [];
    const cardIds = viewFilteredCards.map(c => c.id);
    
    // Get regular transactions
    const transactions = state.data.transactions
      .filter(txn => cardIds.includes(txn.card_id))
      .map(txn => ({
        id: txn.id,
        card_id: txn.card_id,
        date: txn.posted_at,
        description: txn.merchant,
        category: txn.category,
        amount: txn.amount,
        type: txn.type as TransactionType,
      }));

    // Get payments and convert to transaction format
    const payments = state.data.payments
      .filter(payment => cardIds.includes(payment.card_id))
      .map(payment => ({
        id: payment.id,
        card_id: payment.card_id,
        date: payment.payment_date,
        description: `Payment - ${payment.method.replace('_', ' ')}`,
        category: 'Payment',
        amount: payment.amount,
        type: 'payment' as TransactionType,
      }));

    // Combine and sort by date (newest first)
    return [...transactions, ...payments].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [state.data, viewFilteredCards]);

  const summary = useMemo(() => {
    if (viewFilteredCards.length === 0) {
      return {
        total_balance: 0,
        total_limit: 0,
        total_available: 0,
        total_utilization: 0,
        total_minimum_payment: 0,
        next_due_date: null as string | null,
        upcoming_payment_total: 0,
      };
    }

    const totalLimit = viewFilteredCards.reduce((sum, card) => sum + Number(card.credit_limit || 0), 0);
    const totalBalance = viewFilteredCards.reduce((sum, card) => sum + Number(card.current_balance || 0), 0);
    const totalAvailable = viewFilteredCards.reduce((sum, card) => sum + Number(card.available_credit || 0), 0);
    const totalUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
    const totalMinimumPayment = viewFilteredCards.reduce((sum, card) => sum + Number(card.minimum_payment || 0), 0);

    const upcomingPayments = viewFilteredCards
      .filter((card) => Boolean(card.payment_due_date))
      .map((card) => ({
        dueDate: card.payment_due_date as string,
        amount: Number(card.minimum_payment || 0),
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return {
      total_balance: Number(totalBalance.toFixed(2)),
      total_limit: Number(totalLimit.toFixed(2)),
      total_available: Number(totalAvailable.toFixed(2)),
      total_utilization: Number(totalUtilization.toFixed(2)),
      total_minimum_payment: Number(totalMinimumPayment.toFixed(2)),
      next_due_date: upcomingPayments.length > 0 ? upcomingPayments[0].dueDate : null,
      upcoming_payment_total: Number(upcomingPayments.reduce((sum, item) => sum + item.amount, 0).toFixed(2)),
    };
  }, [viewFilteredCards]);

  // Set default availableAmount to total balance owed
  useEffect(() => {
    if (connectedCards.length > 0) {
      const totalBalance = connectedCards.reduce(
        (sum, card) => sum + Number(card.current_balance || 0),
        0
      );
      setAvailableAmount(Number(totalBalance.toFixed(2)));
    }
  }, [connectedCards]);

  // Handlers
  const handleConnectCard = (cardId: string) => {
    setConnectedCardIds(prev => [...prev, cardId]);
    setIsCardModalOpen(false);
    
    if (connectedCardIds.length === 0) {
      setViewMode('single');
      setSelectedCardIds([cardId]);
    } else if (connectedCardIds.length === 1) {
      setViewMode('compare');
      setSelectedCardIds([connectedCardIds[0], cardId]);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    setConnectedCardIds(prev => prev.filter(id => id !== cardId));
    setSelectedCardIds(prev => prev.filter(id => id !== cardId));
    
    const remainingCount = connectedCardIds.length - 1;
    if (remainingCount === 0) {
      setViewMode('consolidated');
      setSelectedCardIds([]);
    } else if (remainingCount === 1) {
      setViewMode('single');
      setSelectedCardIds([connectedCardIds.filter(id => id !== cardId)[0]]);
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    
    if (mode === 'consolidated') {
      setSelectedCardIds([]);
    } else if (mode === 'single' && connectedCardIds.length > 0) {
      setSelectedCardIds([connectedCardIds[0]]);
    } else if (mode === 'compare' && connectedCardIds.length >= 2) {
      setSelectedCardIds(connectedCardIds.slice(0, 2));
    }
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-48 bg-gray-200 animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (state.error || !state.data) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="border-2 border-black bg-white p-8 text-center">
          <h2 className="text-xl font-bold text-black">Unable to Load Dashboard</h2>
          <p className="mt-2 text-gray-600">{state.error ?? 'Demo data is unavailable.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 border-2 border-black bg-black px-6 py-2 text-sm font-medium text-white hover:bg-white hover:text-black"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { data } = state;

  // Empty state (no cards connected)
  if (connectedCardIds.length === 0) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="mb-8 border-b border-gray-200 pb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Demo Mode</p>
          <h1 className="mt-2 text-3xl font-bold text-black">Card Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome, {data.user.full_name}</p>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="border-2 border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-black">
              <svg className="h-8 w-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-black">No Cards Connected</h2>
            <p className="mt-2 text-gray-600">
              Connect your first credit card to start tracking balances and payments.
            </p>
            <button
              onClick={() => setIsCardModalOpen(true)}
              className="mt-8 border-2 border-black bg-black px-8 py-3 font-medium text-white hover:bg-white hover:text-black"
            >
              Connect Card
            </button>
          </div>
        </div>

        <CardSelectionModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          availableCards={data.cards}
          connectedCardIds={connectedCardIds}
          onSelectCard={handleConnectCard}
        />
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Demo Mode</p>
          <h1 className="mt-1 text-3xl font-bold text-black">Card Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Welcome back, {data.user.full_name}</p>
        </div>
        <button
          onClick={() => setIsCardModalOpen(true)}
          className="border-2 border-black bg-black px-6 py-2 text-sm font-medium text-white hover:bg-white hover:text-black"
        >
          Add Card
        </button>
      </div>

      {/* Connected Cards List */}
      <div className="mb-8 border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="font-bold text-black">Connected Cards ({connectedCardIds.length})</h2>
        </div>
        <div className="space-y-3">
          {connectedCards.map((card) => (
            <div key={card.id} className="flex items-center justify-between border border-gray-200 bg-white p-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-black">{card.card_name}</p>
                    <p className="text-xs text-gray-500">{card.institution_name} • {card.card_last_four}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="font-semibold text-black">{currencyFormatter.format(card.current_balance)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Utilization</p>
                  <p className="font-semibold text-black">{percentFormatter.format(card.utilization_percentage / 100)}</p>
                </div>
                <button
                  onClick={() => handleRemoveCard(card.id)}
                  className="text-gray-400 hover:text-black"
                  title="Remove card"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Mode Selector */}
      {connectedCardIds.length > 1 && (
        <div className="mb-8 border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="font-bold text-black">View Mode</h2>
            <p className="text-sm text-gray-600">Choose how to view your data</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewModeChange('consolidated')}
              className={`border px-4 py-2 text-sm font-medium ${
                viewMode === 'consolidated'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white text-black hover:border-black'
              }`}
            >
              All Cards
            </button>
            <button
              onClick={() => handleViewModeChange('single')}
              className={`border px-4 py-2 text-sm font-medium ${
                viewMode === 'single'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white text-black hover:border-black'
              }`}
            >
              Single Card
            </button>
            {connectedCardIds.length >= 2 && (
              <button
                onClick={() => handleViewModeChange('compare')}
                className={`border px-4 py-2 text-sm font-medium ${
                  viewMode === 'compare'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 bg-white text-black hover:border-black'
                }`}
              >
                Compare
              </button>
            )}
          </div>

          {/* Card Selection */}
          {(viewMode === 'single' || viewMode === 'compare') && (
            <div className="mt-4 flex gap-3">
              {(viewMode === 'single' ? [0] : [0, 1]).map((index) => (
                <select
                  key={index}
                  className="flex-1 border-2 border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
                  value={selectedCardIds[index] ?? ''}
                  onChange={(e) => {
                    const next = [...selectedCardIds];
                    next[index] = e.target.value;
                    setSelectedCardIds(next);
                  }}
                >
                  <option value="">Select a card</option>
                  {connectedCards
                    .filter(card => {
                      // In compare mode, don't show cards already selected in other dropdown
                      if (viewMode === 'compare') {
                        const otherIndex = index === 0 ? 1 : 0;
                        return card.id !== selectedCardIds[otherIndex];
                      }
                      return true;
                    })
                    .map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.card_name} •••• {card.card_last_four}
                      </option>
                    ))}
                </select>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-5">
        <div className="border border-gray-200 bg-white p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Owed</p>
          <p className="mt-2 text-2xl font-bold text-black">{currencyFormatter.format(summary.total_balance)}</p>
          <p className="mt-1 text-xs text-gray-600">{viewFilteredCards.length} {viewFilteredCards.length === 1 ? 'card' : 'cards'}</p>
        </div>
        <div className="border border-gray-200 bg-white p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Credit Limit</p>
          <p className="mt-2 text-2xl font-bold text-black">{currencyFormatter.format(summary.total_limit)}</p>
          <p className="mt-1 text-xs text-gray-600">Available: {currencyFormatter.format(summary.total_available)}</p>
        </div>
        <div className="border border-gray-200 bg-white p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Utilization</p>
          <p className="mt-2 text-2xl font-bold text-black">{percentFormatter.format(summary.total_utilization / 100)}</p>
          <p className="mt-1 text-xs text-gray-600">
            {summary.total_utilization < 30 ? 'Excellent' : summary.total_utilization < 50 ? 'Good' : 'High'}
          </p>
        </div>
        <div className="border border-gray-200 bg-white p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Min Payment</p>
          <p className="mt-2 text-2xl font-bold text-black">{currencyFormatter.format(summary.total_minimum_payment)}</p>
          <p className="mt-1 text-xs text-gray-600">To avoid late fees</p>
        </div>
        <div className="border border-gray-200 bg-white p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Next Due Date</p>
          <p className="mt-2 text-2xl font-bold text-black">{formatDate(summary.next_due_date)}</p>
          <p className="mt-1 text-xs text-gray-600">Min: {currencyFormatter.format(summary.upcoming_payment_total)}</p>
        </div>
      </div>

      {/* Card Details Table */}
      <div className="mb-8 border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="font-bold text-black">Card Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="p-3 text-left font-medium text-gray-700">Card</th>
                <th className="p-3 text-left font-medium text-gray-700">Balance</th>
                <th className="p-3 text-left font-medium text-gray-700">Limit</th>
                <th className="p-3 text-left font-medium text-gray-700">Utilization</th>
                <th className="p-3 text-left font-medium text-gray-700">Min Payment</th>
                <th className="p-3 text-left font-medium text-gray-700">Due Date</th>
                <th className="p-3 text-left font-medium text-gray-700">APR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {viewFilteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-semibold text-black">{card.card_name}</p>
                    <p className="text-xs text-gray-500">{card.institution_name} • {card.card_last_four}</p>
                  </td>
                  <td className="p-3 font-medium text-black">{currencyFormatter.format(card.current_balance)}</td>
                  <td className="p-3 text-gray-600">{currencyFormatter.format(card.credit_limit)}</td>
                  <td className="p-3 text-gray-600">{percentFormatter.format(card.utilization_percentage / 100)}</td>
                  <td className="p-3 text-gray-600">{currencyFormatter.format(card.minimum_payment)}</td>
                  <td className="p-3 text-gray-600">{formatDate(card.payment_due_date)}</td>
                  <td className="p-3 text-gray-600">{card.interest_rate ? `${card.interest_rate.toFixed(2)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Transactions (includes payments) */}
        <div className="border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <h2 className="font-bold text-black">Transactions ({allTransactions.length})</h2>
            <p className="text-xs text-gray-600">Purchases and payments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-medium text-gray-700">Description</th>
                  <th className="p-3 text-left font-medium text-gray-700">Card</th>
                  <th className="p-3 text-left font-medium text-gray-700">Category</th>
                  <th className="p-3 text-left font-medium text-gray-700">Date</th>
                  <th className="p-3 text-right font-medium text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allTransactions.slice(0, 20).map((transaction) => {
                  const card = cardsById.get(transaction.card_id);
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-black">{transaction.description}</td>
                      <td className="p-3 text-xs text-gray-600">
                        {card ? `${card.card_name} • ${card.card_last_four}` : 'Card'}
                      </td>
                      <td className="p-3 text-gray-600">{transaction.category}</td>
                      <td className="p-3 text-xs text-gray-600">{formatDate(transaction.date)}</td>
                      <td className={`p-3 text-right font-semibold ${
                        transaction.type === 'refund' || transaction.type === 'payment'
                          ? 'text-black'
                          : 'text-black'
                      }`}>
                        {transaction.type === 'refund' || transaction.type === 'payment' ? '+' : '-'}
                        {currencyFormatter.format(Math.abs(transaction.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Insights */}
          <div className="border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-black">Insights & Alerts</h2>
            <div className="space-y-3">
              {analysis.isLoading && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}
              {analysis.error && (
                <div className="border border-gray-300 bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-700">{analysis.error}</p>
                </div>
              )}
              {!analysis.isLoading && !analysis.error && analysis.data?.insights?.length ? (
                analysis.data.insights.map((item, index) => (
                    <div key={`${item.priority}-${index}`} className="border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-semibold text-black flex-1">{item.title?.en ?? 'Insight'}</p>
                        <span className="border border-gray-300 px-2 py-1 text-xs font-medium uppercase text-gray-700">
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{item.message?.en ?? ''}</p>
                    </div>
                  ))
              ) : !analysis.isLoading && !analysis.error ? (
                <div className="border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm text-gray-600">No insights available</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Recommendations */}
          <div className="border border-gray-200 bg-white p-6">
            <h2 className="mb-2 font-bold text-black">Payment Recommendations</h2>
            <p className="mb-4 text-xs text-gray-600">
              Default is your total balance. Adjust if you have a different budget.
            </p>

            <div className="mb-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount Available to Pay
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  className="w-full border-2 border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
                  value={availableAmount}
                  onChange={(e) => setAvailableAmount(Number(e.target.value))}
                  placeholder={currencyFormatter.format(summary.total_balance)}
                />
                {availableAmount < summary.total_minimum_payment && availableAmount > 0 && (
                  <p className="mt-1 text-xs text-gray-600">
                    Less than minimum payment ({currencyFormatter.format(summary.total_minimum_payment)}). May result in late fees.
                  </p>
                )}
                {availableAmount > summary.total_balance && (
                  <p className="mt-1 text-xs text-gray-600">
                    Amount exceeds total balance. Recommendations will pay off all cards.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                  Goal
                </label>
                <select
                  className="w-full border-2 border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
                  value={optimizationGoal}
                  onChange={(e) =>
                    setOptimizationGoal(e.target.value as 'minimize_interest' | 'improve_score' | 'balanced')
                  }
                >
                  <option value="balanced">Balanced</option>
                  <option value="minimize_interest">Minimize Interest</option>
                  <option value="improve_score">Improve Score</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {recommendations.isLoading && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}
              {recommendations.error && (
                <div className="border border-gray-300 bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-700">{recommendations.error}</p>
                </div>
              )}
              {!recommendations.isLoading && !recommendations.error && recommendations.data ? (
                <>
                  <div className="border border-gray-200 bg-gray-50 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Strategy</span>
                      <span className="font-semibold capitalize text-black">
                        {recommendations.data.strategy.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span className="text-gray-600">Monthly Savings</span>
                      <span className="font-bold text-black">
                        {currencyFormatter.format(recommendations.data.projectedSavings.monthlyInterest)}
                      </span>
                    </div>
                  </div>

                  {recommendations.data.recommendations.map((rec) => {
                      const card = cardsById.get(rec.cardId);
                      const reasoningParts = (rec.reasoning?.en ?? '').split(' • ');
                      return (
                        <div key={rec.cardId} className="border border-gray-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="flex h-5 w-5 items-center justify-center border border-gray-300 text-xs font-bold text-black">
                                {rec.priority}
                              </span>
                              <p className="font-semibold text-black">{card?.card_name ?? 'Card'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-black">
                                {currencyFormatter.format(rec.suggestedAmount)}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {reasoningParts.map((part, idx) => (
                              <p key={idx} className="text-sm text-gray-600">
                                {idx > 0 && '• '}{part}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </>
              ) : !recommendations.isLoading && !recommendations.error ? (
                <div className="border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm text-gray-600">Adjust settings to see recommendations</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Score */}
          {/* {analysis.data && (
            <div className="border-2 border-black bg-black p-6 text-white">
              <h3 className="font-bold">Credit Health Score</h3>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center border-2 border-white">
                  <span className="text-2xl font-bold">{analysis.data.overallScore}</span>
                </div>
                <div className="flex-1">
                  <div className="h-2 border border-white">
                    <div className="h-full bg-white" style={{ width: `${analysis.data.overallScore}%` }} />
                  </div>
                  <p className="mt-2 text-sm">
                    {analysis.data.overallScore >= 80 ? 'Excellent' : analysis.data.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                  </p>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>

      <CardSelectionModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        availableCards={data.cards}
        connectedCardIds={connectedCardIds}
        onSelectCard={handleConnectCard}
      />
    </div>
  );
}
