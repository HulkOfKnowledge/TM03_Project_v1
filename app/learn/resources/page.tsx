/**
 * Resources Page
 * Collection of helpful credit-related resources
 */

'use client';

import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-brand mb-6">Resources</h1>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This page will contain:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Downloadable PDFs and guides</li>
              <li>Credit score calculators and tools</li>
              <li>Budget templates and worksheets</li>
              <li>Glossary of credit terms</li>
              <li>External resource links</li>
              <li>FAQ section</li>
              <li>Infographics and visual aids</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
