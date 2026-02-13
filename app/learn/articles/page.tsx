/**
 * Articles & Guides Page
 * Credit education articles and comprehensive guides
 */

'use client';

import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-brand mb-6">Articles & Guides</h1>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This page will contain:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Featured articles on credit topics</li>
              <li>Step-by-step guides for building credit</li>
              <li>Blog posts and news updates</li>
              <li>Case studies and success stories</li>
              <li>Expert tips and advice</li>
              <li>Search and filter functionality</li>
              <li>Categories: Credit Building, Debt Management, Credit Reports, etc.</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
