"use client";

import { useEffect, useMemo, useState } from 'react';

import type { DemoDashboardData } from '@/services/demo-data.service';

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
    recommendations: Array<{
      cardId: string;
      suggestedAmount: number;
      reasoning: { en: string };
      priority: number;
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

type CardViewMode = 'all' | 'single' | 'compare-2' | 'compare-3';

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

export default function CardDashboardPage() {
  const [state, setState] = useState<DashboardState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [showCards, setShowCards] = useState(false);
  const [viewMode, setViewMode] = useState<CardViewMode>('all');
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
  const [availableAmount, setAvailableAmount] = useState(600);
  const [optimizationGoal, setOptimizationGoal] = useState<
    'minimize_interest' | 'improve_score' | 'balanced'
  >('balanced');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const response = await fetch('/api/demo/card-dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
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

  useEffect(() => {
    if (!showCards) {
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
          headers: {
            'Content-Type': 'application/json',
          },
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
  }, [showCards]);

  useEffect(() => {
    if (!showCards) return;

    let isMounted = true;

    async function runRecommendations() {
      setRecommendations({ data: null, isLoading: true, error: null });
      try {
        const response = await fetch('/api/credit-intelligence/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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

        if (isMounted) {
          setRecommendations({ data: payload.data, isLoading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setRecommendations({
            data: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load recommendations.',
          });
        }
      }
    }

    runRecommendations();

    return () => {
      isMounted = false;
    };
  }, [showCards, availableAmount, optimizationGoal]);

  const cardsById = useMemo(() => {
    if (!state.data) return new Map<string, DemoDashboardData['cards'][number]>();
    return new Map(state.data.cards.map((card) => [card.id, card]));
  }, [state.data]);

  const availableCards = state.data?.cards ?? [];

  useEffect(() => {
    if (!showCards || availableCards.length === 0) {
      setSelectedCardIds([]);
      return;
    }

    if (viewMode === 'all') {
      setSelectedCardIds(availableCards.map((card) => card.id));
      return;
    }

    const needed = viewMode === 'single' ? 1 : viewMode === 'compare-2' ? 2 : 3;
    const defaults = availableCards.slice(0, needed).map((card) => card.id);
    setSelectedCardIds(defaults);
  }, [viewMode, availableCards, showCards]);

  const filteredCards = useMemo(() => {
    if (!showCards) return [];
    if (viewMode === 'all') return availableCards;
    return availableCards.filter((card) => selectedCardIds.includes(card.id));
  }, [availableCards, selectedCardIds, viewMode, showCards]);

  const filteredTransactions = useMemo(() => {
    if (!state.data || !showCards) return [];
    if (viewMode === 'all') return state.data.transactions;
    return state.data.transactions.filter((txn) => selectedCardIds.includes(txn.card_id));
  }, [state.data, selectedCardIds, viewMode, showCards]);

  const filteredPayments = useMemo(() => {
    if (!state.data || !showCards) return [];
    if (viewMode === 'all') return state.data.payments;
    return state.data.payments.filter((payment) => selectedCardIds.includes(payment.card_id));
  }, [state.data, selectedCardIds, viewMode, showCards]);

  const summary = useMemo(() => {
    if (!showCards || filteredCards.length === 0) {
      return {
        total_balance: 0,
        total_limit: 0,
        total_available: 0,
        total_utilization: 0,
        next_due_date: null as string | null,
        upcoming_payment_total: 0,
      };
    }

    const totalLimit = filteredCards.reduce(
      (sum, card) => sum + Number(card.credit_limit || 0),
      0
    );
    const totalBalance = filteredCards.reduce(
      (sum, card) => sum + Number(card.current_balance || 0),
      0
    );
    const totalAvailable = filteredCards.reduce(
      (sum, card) => sum + Number(card.available_credit || 0),
      0
    );
    const totalUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

    const upcomingPayments = filteredCards
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
      next_due_date: upcomingPayments.length > 0 ? upcomingPayments[0].dueDate : null,
      upcoming_payment_total: Number(
        upcomingPayments.reduce((sum, item) => sum + item.amount, 0).toFixed(2)
      ),
    };
  }, [filteredCards, showCards]);

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 rounded-2xl bg-white p-5 shadow-sm">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="mt-4 h-6 w-32 rounded bg-slate-200" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-12 rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-10 rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-4">Card Dashboard</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error ?? 'Demo data is unavailable.'}
        </div>
      </div>
    );
  }

  const { data } = state;

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-500">Demo Experience</p>
          <h1 className="text-3xl font-bold text-slate-900">Card Dashboard</h1>
          <p className="text-sm text-slate-600">
            Welcome back, {data.user.full_name}. Here’s a consolidated view of your connected cards.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            Connect Card (Demo)
          </button>
          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm"
            onClick={() => setShowCards(true)}
          >
            Sync All Cards
          </button>
        </div>
      </div>

      {!showCards ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">No connected cards yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Connect a card to begin tracking balances, payments, and credit insights.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
            >
              Connect Card
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700"
              onClick={() => setShowCards(true)}
            >
              Load Demo Cards
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Total Balance</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {currencyFormatter.format(summary.total_balance)}
              </p>
              <p className="text-sm text-slate-500">Across {filteredCards.length} cards</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Total Limit</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {currencyFormatter.format(summary.total_limit)}
              </p>
              <p className="text-sm text-slate-500">
                Available: {currencyFormatter.format(summary.total_available)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Utilization</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {percentFormatter.format(summary.total_utilization / 100)}
              </p>
              <p className="text-sm text-slate-500">Keep below 30% for best scores</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-slate-400">Next Payment Due</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatDate(summary.next_due_date)}
              </p>
              <p className="text-sm text-slate-500">
                Upcoming minimums: {currencyFormatter.format(summary.upcoming_payment_total)}
              </p>
            </div>
          </section>

          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Card View Mode</h2>
                <p className="text-sm text-slate-500">
                  Choose a consolidated view or compare specific cards.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  View
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    value={viewMode}
                    onChange={(event) => setViewMode(event.target.value as CardViewMode)}
                  >
                    <option value="all">All cards (consolidated)</option>
                    <option value="single">Single card</option>
                    <option value="compare-2">Compare 2 cards</option>
                    <option value="compare-3">Compare 3 cards</option>
                  </select>
                </label>
                {viewMode !== 'all' && (
                  <div className="flex flex-wrap gap-3">
                    {Array.from({
                      length: viewMode === 'single' ? 1 : viewMode === 'compare-2' ? 2 : 3,
                    }).map((_, index) => (
                      <label
                        key={index}
                        className="text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        Card {index + 1}
                        <select
                          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                          value={selectedCardIds[index] ?? ''}
                          onChange={(event) => {
                            const next = [...selectedCardIds];
                            next[index] = event.target.value;
                            setSelectedCardIds(next);
                          }}
                        >
                          {availableCards.map((card) => (
                            <option key={card.id} value={card.id}>
                              {card.card_name} · {card.card_last_four}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Connected Cards</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {filteredCards.length} cards in view
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Card</th>
                    <th className="px-4 py-3">Network</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Limit</th>
                    <th className="px-4 py-3">Utilization</th>
                    <th className="px-4 py-3">Min Payment</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">APR</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map((card) => (
                    <tr key={card.id} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{card.card_name}</p>
                        <p className="text-xs text-slate-500">{card.institution_name} · {card.card_last_four}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">{card.card_network}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {currencyFormatter.format(card.current_balance)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {currencyFormatter.format(card.credit_limit)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {percentFormatter.format(card.utilization_percentage / 100)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {currencyFormatter.format(card.minimum_payment)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(card.payment_due_date)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {card.interest_rate ? `${card.interest_rate.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
                  <span className="text-xs text-slate-500">Latest {filteredTransactions.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Merchant</th>
                        <th className="px-4 py-3">Card</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => {
                        const card = cardsById.get(transaction.card_id);
                        return (
                          <tr key={transaction.id} className="border-b border-slate-100">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {transaction.merchant}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {card ? `${card.card_name} · ${card.card_last_four}` : 'Card'}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{transaction.category}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatDate(transaction.posted_at)}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-semibold ${
                                transaction.type === 'refund' ? 'text-emerald-600' : 'text-slate-900'
                              }`}
                            >
                              {transaction.type === 'refund' ? '+' : '-'}
                              {currencyFormatter.format(Math.abs(transaction.amount))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
                  <span className="text-xs text-slate-500">Latest {filteredPayments.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Card</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((payment) => {
                        const card = cardsById.get(payment.card_id);
                        return (
                          <tr key={payment.id} className="border-b border-slate-100">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {card ? `${card.card_name} · ${card.card_last_four}` : 'Card'}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatDate(payment.payment_date)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {payment.method.replace('_', ' ')}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{payment.status}</td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                              {currencyFormatter.format(payment.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Insights & Alerts</h2>
                <div className="mt-4 space-y-3">
                  {analysis.isLoading && (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-16 rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  )}
                  {analysis.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {analysis.error}
                    </div>
                  )}
                  {!analysis.isLoading && !analysis.error && analysis.data?.insights?.length
                    ? analysis.data.insights.map((item, index) => (
                        <div
                          key={`${item.priority}-${index}`}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {item.title?.en ?? 'Insight'}
                              </p>
                              <p className="text-sm text-slate-600">
                                {item.message?.en ?? ''}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                              {item.priority}
                            </span>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Payment Recommendations</h2>
                    <p className="text-sm text-slate-500">
                      Adjust the payment amount to see different strategies.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Monthly budget
                      <input
                        type="number"
                        min={0}
                        className="mt-2 w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        value={availableAmount}
                        onChange={(event) => setAvailableAmount(Number(event.target.value))}
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Goal
                      <select
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        value={optimizationGoal}
                        onChange={(event) =>
                          setOptimizationGoal(
                            event.target.value as 'minimize_interest' | 'improve_score' | 'balanced'
                          )
                        }
                      >
                        <option value="balanced">Balanced</option>
                        <option value="minimize_interest">Minimize interest</option>
                        <option value="improve_score">Improve score</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  {recommendations.isLoading && (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-12 rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  )}
                  {recommendations.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {recommendations.error}
                    </div>
                  )}
                  {!recommendations.isLoading &&
                  !recommendations.error &&
                  recommendations.data ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <span>Strategy: {recommendations.data.strategy.replace('_', ' ')}</span>
                        <span>
                          Projected monthly savings: {currencyFormatter.format(
                            recommendations.data.projectedSavings.monthlyInterest
                          )}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                            <tr>
                              <th className="px-4 py-3">Priority</th>
                              <th className="px-4 py-3">Card</th>
                              <th className="px-4 py-3">Suggested payment</th>
                              <th className="px-4 py-3">Reasoning</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recommendations.data.recommendations.map((rec) => (
                              <tr key={rec.cardId} className="border-b border-slate-100">
                                <td className="px-4 py-3 font-semibold text-slate-900">
                                  {rec.priority}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {cardsById.get(rec.cardId)?.card_name ?? 'Card'}
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-900">
                                  {currencyFormatter.format(rec.suggestedAmount)}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {rec.reasoning?.en ?? ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white shadow-sm">
                <h2 className="text-lg font-semibold">Credit Intelligence Preview</h2>
                <p className="mt-2 text-sm text-slate-200">
                  The recommendation engine will prioritize which card to pay first and forecast your
                  utilization trend over time.
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Suggested first payment</span>
                    <span className="font-semibold">
                      {analysis.data?.recommendations?.[0]?.cardId
                        ? cardsById.get(analysis.data.recommendations[0].cardId)?.card_name ?? '—'
                        : filteredCards[0]?.card_name ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Projected utilization (30 days)</span>
                    <span className="font-semibold">24%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Potential interest saved</span>
                    <span className="font-semibold">$38.70</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
