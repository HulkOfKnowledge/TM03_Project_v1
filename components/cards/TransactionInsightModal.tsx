/**
 * Transaction Insight Modal
 * Shows AI-powered insights for individual transactions and monthly history
 */

'use client';

import { useEffect, useState } from 'react';
import type { CardHistoryRow, ConnectedCard, Transaction } from '@/types/card.types';

interface TransactionInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: CardHistoryRow | Transaction | null;
  card: ConnectedCard;
}

interface Insight {
  type: string;
  severity: string;
  message: string;
  metadata?: {
    remaining_amount?: number;
    threshold_percentage?: number;
    current_utilization?: number;
    days_until_due?: number;
    minimum_payment?: number;
  };
}

export function TransactionInsightModal({ 
  isOpen, 
  onClose, 
  transaction, 
  card 
}: TransactionInsightModalProps) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      generateInsight();
    }
  }, [isOpen, transaction]);

  const generateInsight = async () => {
    if (!transaction) return;

    setLoading(true);
    try {
      // Check if this is a daily transaction or monthly history row
      const isMonthlyHistory = 'month' in transaction && 'endingBalance' in transaction;
      
      let generatedInsight: Insight;

      if (isMonthlyHistory) {
        // Handle monthly history row (CardHistoryRow)
        const historyRow = transaction as CardHistoryRow;
        const thirtyPercentThreshold = card.creditLimit * 0.30;
        const remainingTo30 = thirtyPercentThreshold - historyRow.endingBalance;

        // Danger Zone: Above 30%
        if (historyRow.utilizationPercentage > 30) {
          generatedInsight = {
            type: 'high_utilization_alert',
            severity: 'urgent',
            message: `Danger Zone! Your utilization was ${historyRow.utilizationPercentage.toFixed(1)}% in ${historyRow.month}. This is above 30% and will negatively impact your credit score. Consider paying down your balance immediately.`,
            metadata: {
              current_utilization: historyRow.utilizationPercentage,
              threshold_percentage: 30
            }
          };
        }
        // Caution Zone: 26-30%
        else if (historyRow.utilizationPercentage > 25) {
          const isNear30 = historyRow.utilizationPercentage >= 29;
          generatedInsight = {
            type: 'caution_zone_warning',
            severity: isNear30 ? 'high' : 'medium',
            message: `Caution Zone. Your utilization for ${historyRow.month} was ${historyRow.utilizationPercentage.toFixed(1)}%. ${isNear30 ? 'You are very close to 30% - be careful!' : 'Try to keep it below 30% to protect your credit score.'} You had $${remainingTo30.toFixed(2)} remaining before reaching 30%.`,
            metadata: {
              remaining_amount: remainingTo30,
              threshold_percentage: 30,
              current_utilization: historyRow.utilizationPercentage
            }
          };
        }
        // Safe Zone: 0-25%
        else {
          if (historyRow.payment > historyRow.endingBalance * 0.5) {
            generatedInsight = {
              type: 'safe_zone_good_payment',
              severity: 'success',
              message: `Safe Zone! Your utilization was only ${historyRow.utilizationPercentage.toFixed(1)}% in ${historyRow.month}. Great job paying $${historyRow.payment.toFixed(2)}, which is ${((historyRow.payment / historyRow.endingBalance) * 100).toFixed(0)}% of your balance. Keep it up!`,
            };
          } else {
            generatedInsight = {
              type: 'safe_zone',
              severity: 'success',
              message: `Safe Zone! Your utilization for ${historyRow.month} was ${historyRow.utilizationPercentage.toFixed(1)}%, well below the 30% threshold. This is excellent for your credit score. Keep maintaining this level!`,
              metadata: {
                current_utilization: historyRow.utilizationPercentage,
                threshold_percentage: 30
              }
            };
          }
        }
      } else {
        // Handle daily transaction (Transaction)
        const txn = transaction as Transaction;
        const utilization = txn.utilizationPercentage || 0;
        const zone = txn.zone || 'Unknown';
        
        if (zone === 'Danger' || utilization > 30) {
          generatedInsight = {
            type: 'high_utilization_transaction',
            severity: 'urgent',
            message: `After this ${txn.amount >= 0 ? 'purchase' : 'payment'} on ${new Date(txn.date).toLocaleDateString()}, your balance ${txn.amount >= 0 ? 'increased' : 'decreased'} by $${Math.abs(txn.amount).toFixed(2)}. ${utilization > 30 ? `This put you at ${utilization.toFixed(1)}% utilization, which is in the danger zone and may hurt your credit score.` : 'Monitor your spending carefully.'}`,
            metadata: {
              current_utilization: utilization,
              threshold_percentage: 30
            }
          };
        } else if (zone === 'Caution' || (utilization >= 25 && utilization <= 30)) {
          generatedInsight = {
            type: 'caution_transaction',
            severity: 'medium',
            message: `This transaction on ${new Date(txn.date).toLocaleDateString()} ${txn.amount >= 0 ? 'increased' : 'decreased'} your balance by $${Math.abs(txn.amount).toFixed(2)}. ${utilization > 0 ? `Your utilization was ${utilization.toFixed(1)}%, which is in the caution zone. Try to keep it below 30%.` : ''}`,
            metadata: {
              current_utilization: utilization,
              threshold_percentage: 30
            }
          };
        } else {
          generatedInsight = {
            type: 'safe_transaction',
            severity: 'success',
            message: `Great! This ${txn.amount >= 0 ? 'purchase' : 'payment'} on ${new Date(txn.date).toLocaleDateString()} ${txn.amount >= 0 ? 'is' : 'helped'} keep your utilization ${utilization > 0 ? `at a safe ${utilization.toFixed(1)}%` : 'low'}. ${txn.amount < 0 ? 'Payments like this help maintain a healthy credit profile.' : 'Keep your spending in check!'}`,
            metadata: {
              current_utilization: utilization
            }
          };
        }
      }

      setInsight(generatedInsight);
    } catch (error) {
      console.error('Error generating insight:', error);
      setInsight({
        type: 'error',
        severity: 'info',
        message: 'Unable to generate insight at this time.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !transaction) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          {'month' in transaction ? `Monthly Insight - ${transaction.month}` : 'Transaction Details'}
        </h3>

        {/* Transaction Summary */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          {'month' in transaction ? (
            // Monthly history row
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Ending Balance</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${transaction.endingBalance.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Utilization</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {transaction.utilizationPercentage.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Payment Made</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${transaction.payment.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Peak Usage</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${transaction.peakUsage.toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            // Daily transaction
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Date</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(transaction.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Amount</p>
                <p className={`text-lg font-semibold ${transaction.amount < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600 dark:text-gray-400">Description</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {transaction.description}
                </p>
              </div>
              {transaction.balance !== undefined && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Balance After</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    ${transaction.balance.toFixed(2)}
                  </p>
                </div>
              )}
              {transaction.utilizationPercentage !== undefined && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Utilization</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {transaction.utilizationPercentage.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Insight */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : insight ? (
          <div className={`rounded-lg p-4 ${getSeverityColor(insight.severity)}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {getSeverityIcon(insight.severity)}
              </div>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold capitalize">
                  {insight.type.replace(/_/g, ' ')}
                </h4>
                <p className="text-sm leading-relaxed">
                  {insight.message}
                </p>
                
                {insight.metadata && (
                  <div className="mt-3 space-y-1 text-xs opacity-80">
                    {insight.metadata.remaining_amount !== undefined && (
                      <p>Remaining to 30%: ${insight.metadata.remaining_amount.toFixed(2)}</p>
                    )}
                    {insight.metadata.current_utilization !== undefined && (
                      <p>Current utilization: {insight.metadata.current_utilization.toFixed(1)}%</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
