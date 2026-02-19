/**
 * Payment Recommendations Component
 * Display ML-powered payment recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { creditIntelligenceService } from '@/services/credit-intelligence.service';
import type { ConnectedCard } from '@/types/card.types';
import type { PaymentRecommendationResponse } from '@/types/credit-intelligence.types';

interface PaymentRecommendationsProps {
  cards: ConnectedCard[];
  availableAmount?: number;
}

export function PaymentRecommendations({ cards, availableAmount = 1000 }: PaymentRecommendationsProps) {
  const [recommendation, setRecommendation] = useState<PaymentRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<'minimize_interest' | 'improve_score' | 'balanced'>('balanced');
  const [customAmount, setCustomAmount] = useState(availableAmount);

  useEffect(() => {
    if (cards && cards.length > 0) {
      fetchRecommendations();
    }
  }, [cards, selectedGoal, customAmount]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      const response = await creditIntelligenceService.getPaymentRecommendations({
        userId: 'current_user', // This would come from auth context in production
        cards: cards.map(card => ({
          cardId: card.id,
          institutionName: card.bank || 'Unknown',
          currentBalance: card.currentBalance,
          creditLimit: card.creditLimit,
          utilizationPercentage: card.utilizationPercentage,
          minimumPayment: card.minimumPayment,
          paymentDueDate: card.paymentDueDate,
          interestRate: card.interestRate || 19.99,
          lastPaymentAmount: card.lastPaymentAmount,
          lastPaymentDate: card.lastPaymentDate,
        })),
        availableAmount: customAmount,
        optimizationGoal: selectedGoal,
      });

      setRecommendation(response);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStrategyIcon = (strategy: string) => {
    if (strategy.includes('interest') || strategy.includes('avalanche')) {
      return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (strategy.includes('score') || strategy.includes('utilization')) {
      return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  };

  const getPriorityBadge = (priority: number) => {
    if (priority === 1) {
      return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">High Priority</span>;
    } else if (priority === 2) {
      return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Medium</span>;
    }
    return <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Low</span>;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!recommendation || !recommendation.recommendations || recommendation.recommendations.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Payment Recommendations
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Unable to generate recommendations at this time. Please ensure you have connected credit cards.
        </p>
      </div>
    );
  }

  // Helper to get card details from cardId
  const getCardDetails = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    return {
      name: card?.bank || card?.name || 'Unknown Card',
      balance: card?.currentBalance || 0,
      apr: card?.interestRate || 19.99,
    };
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
      {/* Header with controls */}
      <div className="mb-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          AI-Powered Payment Recommendations
        </h2>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Optimization goal selector */}
          <div className="flex-1">
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Optimization Goal
            </label>
            <select
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value as any)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="balanced">Balanced Approach (ML-Powered)</option>
              <option value="minimize_interest">Minimize Interest (Avalanche)</option>
              <option value="improve_score">Improve Credit Score</option>
            </select>
          </div>

          {/* Available amount input */}
          <div className="flex-1">
            <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Available to Pay
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-7 pr-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Strategy overview */}
      <div className="mb-6 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
            {getStrategyIcon(recommendation.strategy)}
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
              {recommendation.strategy}
            </h3>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Allocating ${recommendation.totalAmount.toFixed(2)} across {recommendation.recommendations.length} card{recommendation.recommendations.length > 1 ? 's' : ''}
            </p>
            
            {recommendation.projectedSavings && (
              <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                {recommendation.projectedSavings.monthlyInterest > 0 && (
                  <p>💰 Could save ${recommendation.projectedSavings.monthlyInterest.toFixed(2)}/month in interest</p>
                )}
                {recommendation.projectedSavings.annualInterest > 0 && (
                  <p>📊 Annual savings: ${recommendation.projectedSavings.annualInterest.toFixed(2)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card-by-card recommendations */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Recommended Allocation
        </h4>
        
        {recommendation.recommendations.map((rec) => {
          const cardDetails = getCardDetails(rec.cardId);
          return (
            <div
              key={rec.cardId}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h5 className="font-semibold text-gray-900 dark:text-white">
                      {cardDetails.name}
                    </h5>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    APR: {cardDetails.apr.toFixed(2)}% • Balance: ${cardDetails.balance.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pay</p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    ${rec.suggestedAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="mt-2 rounded bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Why: </span>
                  {rec.reasoning.en}
                </p>
                {rec.expectedImpact && (rec.expectedImpact.interestSaved > 0 || rec.expectedImpact.utilizationImprovement > 0) && (
                  <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    {rec.expectedImpact.interestSaved > 0 && (
                      <p>💰 Interest saved: ${rec.expectedImpact.interestSaved.toFixed(2)}</p>
                    )}
                    {rec.expectedImpact.utilizationImprovement > 0 && (
                      <p>📊 Utilization improvement: {rec.expectedImpact.utilizationImprovement.toFixed(1)}%</p>
                    )}
                    {rec.expectedImpact.scoreImpactEstimate > 0 && (
                      <p>⭐ Score impact: +{rec.expectedImpact.scoreImpactEstimate.toFixed(0)} points (est.)</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
