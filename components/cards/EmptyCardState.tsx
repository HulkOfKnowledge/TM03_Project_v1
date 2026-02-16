/**
 * Empty Card State
 * Shows when no card is connected
 */

'use client';

import { CreditCard, Plus } from 'lucide-react';

interface EmptyCardStateProps {
  onAddCard: () => void;
  showFAQButton?: boolean;
}

export function EmptyCardState({ onAddCard, showFAQButton = false }: EmptyCardStateProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-500 mb-2">
            Cards & Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your first credit card to start tracking your usage safely.
          </p>
        </div>
        {showFAQButton && (
          <button className="px-4 py-2 rounded-lg border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-500 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors whitespace-nowrap">
            Card FAQs
          </button>
        )}
      </div>

      {/* Card Display Area */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 md:p-12 mb-8">
        <div className="max-w-md mx-auto">
          {/* Placeholder Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black rounded-2xl p-6 md:p-8 shadow-xl mb-8 aspect-[1.586/1]">
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-start justify-between">
                <p className="text-white/70 text-sm md:text-base">Credit</p>
                <CreditCard className="h-8 w-8 text-white/50" />
              </div>
              <div>
                <p className="text-white/70 text-sm md:text-base mb-2">John Doe</p>
                <p className="text-white/70 text-base md:text-lg tracking-wider">
                  •••• - •••• - •••• - ••••
                </p>
              </div>
            </div>
          </div>

          {/* Connect Button */}
          <button
            onClick={onAddCard}
            className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Connect Card
          </button>
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-4">
        <FeatureItem
          icon="💳"
          title="No Connection Charges"
          description="Connect your card securely for free."
        />
        <FeatureItem
          icon="👁️"
          title="Monitor your Usage"
          description="See your spending and limit in real time."
        />
        <FeatureItem
          icon="📅"
          title="365-day history"
          description="View a full year of your credit activity."
        />
        <FeatureItem
          icon="🔔"
          title="Usage Caution Alerts"
          description="Get early warnings before usage gets risky."
        />
        <FeatureItem
          icon="💳"
          title="Multiple Card Connection"
          description="Link all your cards in one dashboard."
          badge="Premium Feature"
        />
        <FeatureItem
          icon="📊"
          title="Credit Analysis"
          description="Understand your spending and risk patterns instantly."
          badge="Premium Feature"
        />
      </div>
    </div>
  );
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  badge?: string;
}

function FeatureItem({ icon, title, description, badge }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}
