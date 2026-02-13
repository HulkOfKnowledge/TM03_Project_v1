/**
 * Card Dashboard Page
 * Main dashboard for credit card management
 */

'use client';

import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';

export default function CardDashboardPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-brand mb-6">Card Dashboard</h1>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This page will contain:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>List all connected credit cards</li>
              <li>Display key metrics for each card (balance, limit, utilization, due date)</li>
              <li>Overall utilization across all cards</li>
              <li>Total credit available</li>
              <li>Payment recommendations section</li>
              <li>Credit insights and alerts</li>
              <li>"Connect New Card" button</li>
              <li>"Sync All Cards" button</li>
              <li>Link to individual card detail pages</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
