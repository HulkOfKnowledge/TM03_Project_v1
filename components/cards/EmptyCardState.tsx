/**
 * Empty Card State
 * Shows when no card is connected
 */

'use client';

import { CreditCard, Plus, Eye, Calendar, Bell, Layers } from 'lucide-react';

interface EmptyCardStateProps {
  onAddCard: () => void;
  showFAQButton?: boolean;
}

export function EmptyCardState({ onAddCard, showFAQButton = false }: EmptyCardStateProps) {
  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand mb-2">
            Cards & Account
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect your first credit card to start tracking your usage safely.
          </p>
        </div>
        {showFAQButton && (
          <button className="px-4 py-2 rounded-lg border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-500 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors whitespace-nowrap text-sm self-start">
            Card FAQs
          </button>
        )}
      </div>

      {/* Card Display Area */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-2 md:p-12 mb-8">
        <div className="max-w-md mx-auto">
          {/* Placeholder Card */}
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black dark:from-gray-900 dark:via-black dark:to-gray-950 rounded-2xl p-6 md:p-8 shadow-2xl mb-6 aspect-[1.586/1] relative overflow-hidden">
            {/* Decorative wave */}
            <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent rounded-full -translate-y-48 translate-x-48 rotate-45"></div>
            </div>

            <div className="relative flex flex-col justify-between h-full">
              <div className="flex items-start justify-between">
                <p className="text-white/80 text-base md:text-lg font-medium">Credit</p>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                    <p className="text-white font-bold text-xl">VISA</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <p className="text-white/80 text-base md:text-lg">John Doe</p>
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-lg md:text-xl tracking-wider font-medium">
                    1111 - 2222 - 3333 - 4444
                  </p>
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Connect Button */}
          <button
            onClick={onAddCard}
            className="w-full md:w-auto mx-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="h-5 w-5" />
            Connect Card
          </button>
        </div>

        {/* Features List */}
        <div className="space-y-4 mt-16">
          <FeatureItem
            icon={<CreditCard className="h-5 w-5" />}
            title="No Connection Charges"
            description="Connect your card securely for free."
          />
          <FeatureItem
            icon={<Eye className="h-5 w-5" />}
            title="Monitor your Usage"
            description="See your spending and limit in real time."
          />
          <FeatureItem
            icon={<Calendar className="h-5 w-5" />}
            title="365-day history"
            description="View a full year of your credit activity."
          />
          <FeatureItem
            icon={<Bell className="h-5 w-5" />}
            title="Usage Caution Alerts"
            description="Get early warnings before usage gets risky."
          />
          <FeatureItem
            icon={<Layers className="h-5 w-5" />}
            title="Multiple Card Connection"
            description="Link all your cards in one dashboard."
            badge="Premium Feature"
          />
          <FeatureItem
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="Credit Analysis"
            description="Understand your spending and risk patterns instantly."
            badge="Premium Feature"
          />
        </div>
      </div>

      
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

function FeatureItem({ icon, title, description, badge }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-gray-900 dark:text-white text-sm md:text-base">
            {title}
          </h3>
          {badge && (
            <span className="px-2 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}
